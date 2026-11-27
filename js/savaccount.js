/**
 * "Continue with SavAccount" in the Notefox account panel of the settings.
 *
 * The sign-in happens in a tab: SavAccount comes back to a page of notefox.eu,
 * the extension reads the address of that tab (permission "tabs", already
 * there), closes it and completes the sign-in with a secret only this page
 * has. No script of SavAccount is ever loaded inside the extension.
 *
 * Loaded by settings/index.html before js/settings.js.
 */

/** @type {{tab: number, flow: string, state: string, redirect: string, section: string, home: (number|null)}|null} */
let savaccount_flow = null;

/**
 * The server says in GET /status whether the sign-in is configured
 * @returns {boolean}
 */
function isSavAccountAvailable() {
    if (typeof server_status === "undefined" || server_status === null || server_status === undefined) return false;
    const details = server_status["schema-details"];
    return details !== undefined && details !== null && details["savaccount"] === true;
}

/**
 * Show (or hide) the buttons of the login and of the signup sections
 */
function refreshSavAccountButtons() {
    ["login", "signup"].forEach((section) => {
        const box = document.getElementById(section + "-savaccount");
        const button = document.getElementById(section + "-savaccount-button");
        if (box === null || button === null) return;

        box.classList.toggle("hidden", !isSavAccountAvailable());
        document.getElementById(section + "-savaccount-or").textContent = getString("notefox-account-savaccount-or");
        document.getElementById(section + "-savaccount-text").textContent = getString("notefox-account-savaccount-button");
        button.disabled = savaccount_flow !== null;
        button.onclick = function () {
            //directly inside the click: Firefox refuses the request of the permission otherwise
            requestNotefoxServerPermission().then((granted) => {
                if (!granted) {
                    showMessageNotefoxAccount(getString("notefox-account-permission-denied-alert"), true);
                    return;
                }
                startSavAccount(section);
            });
            sendTelemetry(section + "-savaccount-button-clicked", "savaccount.js::refreshSavAccountButtons");
        };
    });
}

/**
 * Open SavAccount in a new tab and wait for its answer
 * @param section {string} - "login" or "signup"
 */
async function startSavAccount(section) {
    abortSavAccount();

    const button = document.getElementById(section + "-savaccount-button");
    button.disabled = true;

    const result = await callApi("savaccount-start", {lang: languageToUse});
    const data = result.data;
    if (!result.ok || data === null || data === undefined || !/^https?:\/\//.test(data["url"]) || !/^https?:\/\//.test(data["redirect-uri"])) {
        button.disabled = false;
        showMessageNotefoxAccount(getSavAccountErrorString(result.ok ? 441 : result.code), true);
        return;
    }

    try {
        let home = null;
        try {
            const current = await browser.tabs.getCurrent();
            if (current !== undefined && current !== null) home = current.id;
        } catch (e) {
            //the settings are not inside a tab
        }

        //the listeners first: the answer of a person already signed in is immediate
        savaccount_flow = {
            tab: -1,
            flow: data["flow"],
            state: data["state"],
            redirect: data["redirect-uri"],
            section: section,
            home: home
        };
        browser.tabs.onUpdated.addListener(onSavAccountTabUpdated);
        browser.tabs.onRemoved.addListener(onSavAccountTabRemoved);

        const tab = await browser.tabs.create({url: data["url"]});
        if (savaccount_flow === null) return; //already answered
        savaccount_flow.tab = tab.id;
        showMessageNotefoxAccount(getString("notefox-account-savaccount-waiting"));
    } catch (e) {
        console.error("[savaccount.js::startSavAccount]", e);
        onError("savaccount.js::startSavAccount", e.message);
        abortSavAccount();
        showMessageNotefoxAccount(getSavAccountErrorString(441), true);
    }
}

/**
 * Forget the sign-in in progress (if any)
 */
function abortSavAccount() {
    savaccount_flow = null;
    try {
        browser.tabs.onUpdated.removeListener(onSavAccountTabUpdated);
        browser.tabs.onRemoved.removeListener(onSavAccountTabRemoved);
    } catch (e) {
        //nothing was listening
    }
    ["login", "signup"].forEach((section) => {
        const button = document.getElementById(section + "-savaccount-button");
        if (button !== null) button.disabled = false;
    });
}

function onSavAccountTabUpdated(tab_id, change, tab) {
    if (savaccount_flow === null || (savaccount_flow.tab !== -1 && savaccount_flow.tab !== tab_id)) return;

    const address = change !== undefined && change.url !== undefined ? change.url : (tab !== undefined ? tab.url : undefined);
    const answer = readSavAccountAnswer(address, savaccount_flow);
    if (answer === null) return;

    const flow = savaccount_flow;
    abortSavAccount();

    browser.tabs.remove(tab_id).catch(() => {
        //already closed by the user
    });
    if (flow.home !== null) {
        browser.tabs.update(flow.home, {active: true}).catch(() => {
            //the sign-in goes on anyway
        });
    }

    if (answer.code === null) {
        showMessageNotefoxAccount(getString(answer.cancelled ? "notefox-account-savaccount-cancelled" : "notefox-account-savaccount-failed"), true);
        return;
    }
    finishSavAccount(flow, answer);
}

function onSavAccountTabRemoved(tab_id) {
    if (savaccount_flow === null || savaccount_flow.tab !== tab_id) return;
    abortSavAccount();
    showMessageNotefoxAccount(getString("notefox-account-savaccount-cancelled"), true);
}

/**
 * The answer of SavAccount in the address of a tab
 * @param address {string|undefined} - the address of the tab
 * @param flow {{redirect: string, state: string}} - the sign-in in progress
 * @returns {{code: (string|null), iss: (string|null), cancelled: boolean}|null} null when it is not the answer of this sign-in
 */
function readSavAccountAnswer(address, flow) {
    if (address === undefined || address === null || !address.startsWith(flow.redirect)) return null;
    let url = null;
    let expected = null;
    try {
        url = new URL(address);
        expected = new URL(flow.redirect);
    } catch (e) {
        return null;
    }
    if (url.origin !== expected.origin || url.pathname !== expected.pathname) return null;
    if (url.searchParams.get("state") !== flow.state) return null;

    const error = url.searchParams.get("error");
    const code = error === null ? url.searchParams.get("code") : null;
    return {
        code: code === "" ? null : code, iss: url.searchParams.get("iss"), cancelled: error === "access_denied"
    };
}

async function finishSavAccount(flow, answer) {
    const spinner = document.getElementById("loading-" + flow.section);
    spinner.classList.remove("hidden");
    disableAside = true;

    let data = {flow: flow.flow, state: flow.state, code: answer.code};
    if (answer.iss !== null) data["iss"] = answer.iss;
    const result = await callApi("savaccount-finish", data);

    spinner.classList.add("hidden");
    disableAside = false;

    if (!result.ok || result.data === null || result.data === undefined) {
        showMessageNotefoxAccount(getSavAccountErrorString(result.code), true);
    } else if (result.data["result"] === "session") {
        openSavAccountSession(result.data);
    } else {
        notefoxAccountLoginSignupManage("savaccount", result.data);
    }
}

/**
 * Save the session and open the "manage" section
 * @param data {object} - the answer of the API
 */
function openSavAccountSession(data) {
    const account = {
        "login-id": data["login-id"],
        "token": data["token"],
        "expiry": data["expiry"],
        "username": data["username"],
        "email": data["email"],
        "encryption-ready": data["encryption-ready"],
        "permissions": data["permissions"]
    };
    //an expired session still stored would be shown instead of the new one
    browser.storage.sync.remove("notefox-account").then(() => {
        notefoxAccountLoginSignupManage("manage", account, true);
    });
}

/**
 * The section that asks for the password, when the account has to be linked
 * ("link-required", "password-required") or created ("signup-required")
 * @param data {object} - the answer of "savaccount-finish"
 */
function showSavAccountSection(data) {
    const signup = data["result"] === "signup-required";
    const changed = data["result"] === "password-required";

    const username_element = document.getElementById("savaccount-username");
    const password_element = document.getElementById("savaccount-password");
    const confirm_element = document.getElementById("savaccount-confirm-password");
    const submit_element = document.getElementById("savaccount-submit");
    const cancel_element = document.getElementById("savaccount-cancel");
    const spinner = document.getElementById("loading-savaccount");
    const fields = signup ? [username_element, password_element, confirm_element] : [password_element];

    document.getElementById("notefox-account-savaccount-section").classList.remove("hidden");
    document.getElementById("title-account").innerText = signup ? getString("notefox-account-button-settings-signup") : getString("notefox-account-button-settings-login");
    document.getElementById("text-account").textContent = getString("notefox-account-savaccount-" + (signup ? "signup-text" : (changed ? "changed-text" : "link-text")))
        .replaceAll("{{email}}", data["email"] !== null && data["email"] !== undefined ? data["email"] : "");
    submit_element.value = signup ? getString("notefox-account-button-settings-signup") : (changed ? getString("notefox-account-button-settings-login") : getString("notefox-account-savaccount-link-button"));

    username_element.placeholder = getString("username-textbox");
    password_element.placeholder = getString("password-textbox");
    confirm_element.placeholder = getString("password-confirm-textbox");
    username_element.value = signup && data["name"] ? data["name"] : "";
    password_element.value = "";
    confirm_element.value = "";
    username_element.classList.toggle("hidden", !signup);
    confirm_element.classList.toggle("hidden", !signup);
    document.getElementById("account-section--savaccount-grid").classList.toggle("savaccount-signup", signup);

    function enable(enabled) {
        fields.concat([submit_element, cancel_element]).forEach((element) => {
            element.disabled = !enabled;
        });
        spinner.classList.toggle("hidden", enabled);
        disableAside = !enabled;
    }

    enable(true);

    fields.forEach((element, index) => {
        element.classList.remove("textbox-error");
        element.onfocus = function () {
            element.classList.remove("textbox-error");
        };
        element.onkeyup = function (e) {
            if (e.key !== "Enter") return;
            if (index + 1 < fields.length) fields[index + 1].focus();
            else submit_element.click();
        };
    });

    submit_element.onclick = async function () {
        sendTelemetry("savaccount-submit-button-clicked", "savaccount.js::showSavAccountSection");

        const empty = fields.filter((element) => element.value.trim() === "");
        let warning = null;
        let wrong = empty;
        if (empty.length > 0) {
            warning = "empty-fields-alert";
        } else if (signup && password_element.value !== confirm_element.value) {
            warning = "passwords-not-equal-alert";
            wrong = [password_element, confirm_element];
        } else if (signup && !isStrongPassword(password_element.value)) {
            warning = "password-not-strong-alert";
            wrong = [password_element, confirm_element];
        }
        if (warning !== null) {
            showMessageNotefoxAccount(getString(warning), true);
            wrong.forEach((element) => element.classList.add("textbox-error"));
            return;
        }

        let request = {ticket: data["ticket"], password: password_element.value};
        if (signup) request["username"] = username_element.value.trim();

        enable(false);
        const result = await callApi(signup ? "savaccount-signup" : "savaccount-link", request);
        enable(true);

        if (result.ok && result.data !== null && result.data !== undefined) {
            password_element.value = "";
            confirm_element.value = "";
            openSavAccountSession(result.data);
        } else if (result.code === 410 || result.code === 429 || result.code === 499) {
            //it can be tried again with the same ticket
            showMessageNotefoxAccount(getSavAccountErrorString(result.code), true);
            if (result.code === 410) password_element.classList.add("textbox-error");
        } else {
            notefoxAccountLoginSignupManage("login", {message: getSavAccountErrorString(result.code)});
        }
    };

    (signup && username_element.value === "" ? username_element : password_element).focus();
}

function getSavAccountErrorString(code) {
    const keys = {440: "failed", 441: "failed", 442: "expired", 443: "in-use"};
    if (keys[code] !== undefined) return getString("notefox-account-savaccount-" + keys[code]);
    return getAccountErrorString(code);
}
