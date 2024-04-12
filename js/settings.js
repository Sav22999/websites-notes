let settings_json = {};

const all_strings = strings[languageToUse];

let sync_local;
checkSyncLocal();

var importing = false;
let show_conversion_message_attention = false;
var notefox_json = {};
const webBrowserUsed = "firefox";//TODO:change manually
var json_to_export = {};

function checkSyncLocal() {
    sync_local = browser.storage.local;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else {
            browser.storage.local.set({"storage": "local"});
            sync_local = browser.storage.local;
        }
        checkTheme();
    });
}

var currentOS = "default"; //default: win, linux, ecc. | mac
var letters_and_numbers = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
var ctrl_alt_shift = ["default", "domain", "page"];

function loaded() {
    notefox_json = {
        "version": browser.runtime.getManifest().version,
        "author": browser.runtime.getManifest().author,
        "manifest_version": browser.runtime.getManifest().manifest_version,
        "os": "?",
        "browser": webBrowserUsed,
    };
    browser.runtime.getPlatformInfo((platformInfo) => {
        notefox_json["os"] = platformInfo.os
    });

    checkSyncLocal()
    checkOperatingSystem();
    setLanguageUI();
    checkTheme();

    browser.tabs.onActivated.addListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);

    document.getElementById("save-settings-button").onclick = function () {
        saveSettings();
    }
    document.getElementById("translate-addon").onclick = function () {
        browser.tabs.create({url: links.translate});
    }
    document.getElementById("support-telegram-button").onclick = function () {
        browser.tabs.create({url: links.support_telegram});
    }
    document.getElementById("support-email-button").onclick = function () {
        browser.tabs.create({url: links.support_email});
    }
    document.getElementById("support-github-button").onclick = function () {
        browser.tabs.create({url: links.support_github});
    }
    document.getElementById("review-on-firefox-addons-button").onclick = function () {
        browser.tabs.create({url: links.review});
    }

    document.getElementById("open-by-default-select").onchange = function () {
        settings_json["open-default"] = document.getElementById("open-by-default-select").value;

        saveSettings();
    };

    document.getElementById("consider-parameters-check").onchange = function () {
        settings_json["consider-parameters"] = document.getElementById("consider-parameters-check").checked;

        saveSettings();
    };
    document.getElementById("consider-sections-check").onchange = function () {
        settings_json["consider-sections"] = document.getElementById("consider-sections-check").checked;

        saveSettings();
    };

    document.getElementById("save-on-local-instead-of-sync-check").onchange = function () {
        settings_json["save-on-local-not-sync"] = document.getElementById("save-on-local-instead-of-sync-check").checked;

        saveSettings();
    };

    document.getElementById("advanced-managing-check").onchange = function () {
        settings_json["advanced-managing"] = document.getElementById("advanced-managing-check").checked;

        saveSettings();
    };

    document.getElementById("html-text-formatting-check").onchange = function () {
        settings_json["html-text-formatting"] = document.getElementById("html-text-formatting-check").checked;

        saveSettings();
    };

    document.getElementById("disable-word-wrap-check").onchange = function () {
        settings_json["disable-word-wrap"] = document.getElementById("disable-word-wrap-check").checked;

        saveSettings();
    };

    document.getElementById("spellcheck-detection-check").onchange = function () {
        settings_json["spellcheck-detection"] = document.getElementById("spellcheck-detection-check").checked;

        saveSettings();
    };

    setThemeChooser();

    document.getElementById("check-green-icon-global-check").onchange = function () {
        settings_json["check-green-icon-global"] = document.getElementById("check-green-icon-global-check").checked;

        saveSettings();
    };

    document.getElementById("check-green-icon-domain-check").onchange = function () {
        settings_json["check-green-icon-domain"] = document.getElementById("check-green-icon-domain-check").checked;

        saveSettings();
    };

    document.getElementById("check-green-icon-page-check").onchange = function () {
        settings_json["check-green-icon-page"] = document.getElementById("check-green-icon-page-check").checked;

        saveSettings();
    };

    document.getElementById("check-green-icon-subdomain-check").onchange = function () {
        settings_json["check-green-icon-subdomain"] = document.getElementById("check-green-icon-subdomain-check").checked;

        saveSettings();
    };

    document.getElementById("open-links-only-with-ctrl-check").onchange = function () {
        settings_json["open-links-only-with-ctrl"] = document.getElementById("open-links-only-with-ctrl-check").checked;

        saveSettings();
    };

    document.getElementById("check-with-all-supported-protocols-check").onchange = function () {
        settings_json["check-with-all-supported-protocols"] = document.getElementById("check-with-all-supported-protocols-check").checked;

        saveSettings();
    };

    document.getElementById("font-family-select").onchange = function () {
        settings_json["font-family"] = document.getElementById("font-family-select").value;

        saveSettings();
    };

    document.getElementById("clear-all-notes-button").onclick = function () {
        clearAllNotes();
    }
    document.getElementById("import-all-notes-button").onclick = function () {
        importAllNotes();
    }
    document.getElementById("export-all-notes-button").onclick = function () {
        exportAllNotes();
    }
    document.getElementById("export-to-file-button").onclick = function () {
        const permissionsToRequest = {
            permissions: ["downloads"]
        }
        try {
            browser.permissions.request(permissionsToRequest).then(response => {
                if (response) {
                    //granted / obtained
                    exportAllNotes(to_file = true);
                    //console.log("Granted");
                } else {
                    //rejected
                    //console.log("Rejected!");
                }
            });
        } catch (e) {
            console.error("P3)) " + e);
        }
    }
    document.getElementById("import-from-file-button").onclick = function () {
        importAllNotes(from_file = true);
    }

    loadSettings();

    let titleAllNotes = document.getElementById("title-settings-dedication-section");
    titleAllNotes.textContent = all_strings["settings-title"];

    loadAsideBar();
}

function setThemeChooser() {
    document.querySelectorAll('.item-radio-theme input[name="theme-radio"]').forEach(function (input) {
        input.addEventListener('change', function () {
            setThemeChooserByElement(input);
        });
    });
}

function resetThemeChooser() {
    document.querySelectorAll('.item-radio-theme input[name="theme-radio"]').forEach(function (input) {
        input.closest('.item-radio-theme').style.boxShadow = 'none';
    });

}

function setThemeChooserByElement(element, set_variable = true) {
    resetThemeChooser();
    element.closest('.item-radio-theme').style.boxShadow = '0px 0px 0px 5px var(--tertiary-transparent-2)';
    if (set_variable) {
        settings_json["theme"] = element.value;
        saveSettings();
    }
    checkTheme();
}

function tabUpdated() {
    checkTheme();
    browser.storage.local.get([
        "settings"
    ]).then(result => {
        if (result.settings !== undefined && result.settings !== settings_json) {
            loadSettings();
        }
    });
}

function setLanguageUI() {
    document.title = all_strings["settings-title-page"];

    document.getElementById("general-title-settings").innerText = all_strings["general-title-settings"];
    document.getElementById("advanced-title-settings").innerText = all_strings["advanced-title-settings"];
    document.getElementById("appearance-title-settings").innerText = all_strings["appearance-title-settings"];
    document.getElementById("shortcuts-title-settings").innerText = all_strings["shortcuts-title-settings"];
    document.getElementById("icon-behaviour-title-settings").innerText = all_strings["icon-behaviour-title-settings"];
    document.getElementById("data-title-settings").innerText = all_strings["data-and-sync-title-settings"];
    document.getElementById("open-by-default-text").innerText = all_strings["open-popup-by-default"];
    document.getElementById("open-by-default-domain-text").innerText = all_strings["domain-label"];
    document.getElementById("open-by-default-page-text").innerText = all_strings["page-label"];
    document.getElementById("consider-parameters-text").innerText = all_strings["consider-parameters"];
    document.getElementById("consider-parameters-detailed-text").innerHTML = all_strings["consider-parameters-detailed"];
    document.getElementById("consider-sections-text").innerText = all_strings["consider-sections"];
    document.getElementById("consider-sections-detailed-text").innerHTML = all_strings["consider-sections-detailed"];
    document.getElementById("save-on-local-instead-of-sync-text").innerText = all_strings["save-on-local-instead-of-sync"];
    document.getElementById("save-on-local-instead-of-sync-detailed-text").innerHTML = all_strings["save-on-local-instead-of-sync-detailed"];
    document.getElementById("open-popup-default-shortcut-text").innerText = all_strings["open-popup-default-shortcut-text"];
    document.getElementById("open-popup-domain-shortcut-text").innerText = all_strings["open-popup-domain-shortcut-text"];
    document.getElementById("open-popup-page-shortcut-text").innerText = all_strings["open-popup-page-shortcut-text"];
    document.getElementById("advanced-managing-text").innerText = all_strings["advanced-managing"];
    document.getElementById("advanced-managing-detailed-text").innerHTML = all_strings["advanced-managing-detailed"];
    document.getElementById("html-text-formatting-text").innerText = all_strings["html-text-formatting"];
    document.getElementById("html-text-formatting-detailed-text").innerHTML = all_strings["html-text-formatting-detailed"];
    document.getElementById("disable-word-wrap-text").innerText = all_strings["disable-word-wrap"];
    document.getElementById("spellcheck-detection-text").innerText = all_strings["spellcheck-detection"];
    document.getElementById("check-green-icon-global-text").innerText = all_strings["check-green-icon-global"];
    document.getElementById("check-green-icon-global-detailed-text").innerHTML = all_strings["check-green-icon-global-detailed"];
    document.getElementById("check-green-icon-domain-text").innerText = all_strings["check-green-icon-domain"];
    document.getElementById("check-green-icon-domain-detailed-text").innerHTML = all_strings["check-green-icon-domain-detailed"];
    document.getElementById("check-green-icon-page-text").innerText = all_strings["check-green-icon-page"];
    document.getElementById("check-green-icon-page-detailed-text").innerHTML = all_strings["check-green-icon-page-detailed"];
    document.getElementById("check-green-icon-subdomain-text").innerText = all_strings["check-green-icon-subdomain"];
    document.getElementById("check-green-icon-subdomain-detailed-text").innerHTML = all_strings["check-green-icon-subdomain-detailed"];
    document.getElementById("open-links-only-with-ctrl-text").innerHTML = all_strings["open-links-only-with-ctrl"];
    document.getElementById("open-links-only-with-ctrl-detailed-text").innerHTML = all_strings["open-links-only-with-ctrl-detailed"];
    document.getElementById("check-with-all-supported-protocols-text").innerHTML = all_strings["check-with-all-supported-protocols"];
    document.getElementById("check-with-all-supported-protocols-detailed-text").innerHTML = all_strings["check-with-all-supported-protocols-detailed"];
    document.getElementById("font-family-text").innerHTML = all_strings["font-family"];
    document.getElementById("font-family-detailed-text").innerHTML = all_strings["font-family-detailed"];
    document.getElementById("theme-text").innerText = all_strings["theme-text"];
    document.getElementById("theme-select-light").innerText = all_strings["theme-choose-light-select"];
    document.getElementById("theme-select-dark").innerText = all_strings["theme-choose-dark-select"];
    document.getElementById("theme-select-firefox").innerText = all_strings["theme-choose-firefox-select"];
    document.getElementById("theme-detailed-text").innerHTML = all_strings["theme-detailed-text"].replace("{{property1}}", `<span class="button-code very-small-button">` + all_strings["theme-choose-firefox-select"] + `</span>`);
    document.getElementById("support-telegram-button").value = all_strings["support-telegram-button"];
    document.getElementById("support-email-button").value = all_strings["support-email-button"];
    document.getElementById("support-github-button").value = all_strings["support-github-button"];
    document.getElementById("review-on-firefox-addons-button").value = all_strings["review-on-firefox-addons-button"];
    document.getElementById("save-settings-button").value = all_strings["save-settings-button"];
    document.getElementById("translate-addon").value = all_strings["translate-addon-button"];
    document.getElementById("clear-all-notes-text").innerText = all_strings["clear-all-notes-text"];
    document.getElementById("clear-all-notes-detailed-text").innerHTML = all_strings["clear-all-notes-detailed-text"];
    document.getElementById("clear-all-notes-button").value = all_strings["clear-all-notes-button"];
    document.getElementById("import-text").innerText = all_strings["import-text"];
    document.getElementById("import-detailed-text").innerHTML = all_strings["import-detailed-text"];
    document.getElementById("import-all-notes-button").value = all_strings["import-notes-button"];
    document.getElementById("export-text").innerText = all_strings["export-text"];
    document.getElementById("export-detailed-text").innerHTML = all_strings["export-detailed-text"];
    document.getElementById("export-all-notes-button").value = all_strings["export-all-notes-button"];
    setNotefoxAcocuntLoginSignupManageButton();

    document.getElementById("text-import").innerHTML = all_strings["import-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
    document.getElementById("cancel-import-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("text-export").innerHTML = all_strings["export-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];
    document.getElementById("text-account").innerHTML = all_strings["notefox-account-signing-up-text"].replaceAll("{{parameters1}}", "href='" + links.terms + "'").replace("{{parameters2}}", "href='" + links.privacy + "'");

    letters_and_numbers.forEach(letterNumber => {
        document.getElementById("key-shortcut-default-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-default'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-domain-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-domain'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-page-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-page'>" + letterNumber + "</option>";
    });

    //notefox account
    document.getElementById("notefox-account-settings-text").innerText = all_strings["notefox-account-settings"];
    document.getElementById("notefox-account-settings-detailed-text").innerHTML = all_strings["notefox-account-settings-detailed"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("signup-username").placeholder = all_strings["username-textbox"];
    document.getElementById("signup-email").placeholder = all_strings["email-textbox"];
    document.getElementById("signup-password").placeholder = all_strings["password-textbox"];
    document.getElementById("signup-confirm-password").placeholder = all_strings["password-confirm-textbox"];
    document.getElementById("signup-submit").value = all_strings["notefox-account-button-settings-signup"];
}

function loadSettings() {
    let shortcuts = browser.commands.getAll();
    shortcuts.then(getCurrentShortcuts);

    browser.storage.local.get([
        "storage"
    ]).then(result => {
        let property1 = all_strings["save-on-local-instead-of-sync"];
        let alert_message = all_strings["disable-sync-settings-message"]
        alert_message = alert_message.replace("{{property1}}", `<span class="button-code" id="string-save-on-local-instead-of-sync">${property1}</span>`);
        document.getElementById("disable-sync").innerHTML = alert_message;

        if (result.storage !== undefined && result.storage === "sync") {
            if (document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.remove("hidden");
            if (document.getElementById("sync-instead-of-local").classList.contains("hidden")) document.getElementById("sync-instead-of-local").classList.remove("hidden");
        } else {
            if (!document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.add("hidden");
            if (!document.getElementById("sync-instead-of-local").classList.contains("hidden")) document.getElementById("sync-instead-of-local").classList.add("hidden");
        }
    });

    browser.storage.local.get(["storage"]).then(result => {
        sync_local.get("settings", function (value) {
            settings_json = {};
            if (value["settings"] !== undefined) settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = false;
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = false;
            if (settings_json["open-popup-default"] === undefined) settings_json["open-popup-default"] = "Ctrl+Alt+O";
            if (settings_json["open-popup-domain"] === undefined) settings_json["open-popup-domain"] = "Ctrl+Alt+D";
            if (settings_json["open-popup-page"] === undefined) settings_json["open-popup-page"] = "Ctrl+Alt+P";
            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = true;
            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = true;
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = false;
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = true;
            if (settings_json["theme"] === undefined) settings_json["theme"] = "light";
            if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = true;
            if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = true;
            if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = true;
            if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = true;
            if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
            if (settings_json["check-with-all-supported-protocols"] === undefined) settings_json["check-with-all-supported-protocols"] = false;
            if (settings_json["font-family"] === undefined || (settings_json["font-family"] !== "Shantell Sans" && settings_json["font-family"] !== "Open Sans")) settings_json["font-family"] = "Shantell Sans";

            let sync_or_local_settings = result["storage"];
            if (sync_or_local_settings === undefined) sync_or_local_settings = "local";

            document.getElementById("open-by-default-select").value = settings_json["open-default"];
            document.getElementById("consider-parameters-check").checked = settings_json["consider-parameters"] === true || settings_json["consider-parameters"] === "yes";
            document.getElementById("consider-sections-check").checked = settings_json["consider-sections"] === true || settings_json["consider-sections"] === "yes";
            document.getElementById("advanced-managing-check").checked = settings_json["advanced-managing"] === true || settings_json["advanced-managing"] === "yes";
            document.getElementById("html-text-formatting-check").checked = settings_json["html-text-formatting"] === true || settings_json["html-text-formatting"] === "yes";
            document.getElementById("disable-word-wrap-check").checked = settings_json["disable-word-wrap"] === true || settings_json["disable-word-wrap"] === "yes";
            document.getElementById("spellcheck-detection-check").checked = settings_json["spellcheck-detection"] === true || settings_json["spellcheck-detection"] === "yes";
            document.getElementById("check-green-icon-global-check").checked = settings_json["check-green-icon-global"] === true || settings_json["check-green-icon-global"] === "yes";
            document.getElementById("check-green-icon-domain-check").checked = settings_json["check-green-icon-domain"] === true || settings_json["check-green-icon-domain"] === "yes";
            document.getElementById("check-green-icon-page-check").checked = settings_json["check-green-icon-page"] === true || settings_json["check-green-icon-page"] === "yes";
            document.getElementById("check-green-icon-subdomain-check").checked = settings_json["check-green-icon-subdomain"] === true || settings_json["check-green-icon-subdomain"] === "yes";

            if (settings_json["theme"] === "light") setThemeChooserByElement(document.getElementById("item-radio-theme-light"), false);
            else if (settings_json["theme"] === "dark") setThemeChooserByElement(document.getElementById("item-radio-theme-dark"), false);
            else if (settings_json["theme"] === "auto") setThemeChooserByElement(document.getElementById("item-radio-theme-auto"), false);

            document.getElementById("open-links-only-with-ctrl-check").checked = settings_json["open-links-only-with-ctrl"] === true || settings_json["open-links-only-with-ctrl"] === "yes";
            document.getElementById("check-with-all-supported-protocols-check").checked = settings_json["check-with-all-supported-protocols"] === true || settings_json["check-with-all-supported-protocols"] === "yes";
            document.getElementById("font-family-select").value = settings_json["font-family"];

            if (sync_or_local_settings === "sync") document.getElementById("save-on-local-instead-of-sync-check").checked = false;
            else if (sync_or_local_settings === "local") document.getElementById("save-on-local-instead-of-sync-check").checked = true;

            let keyboardShortcutCtrlAltShiftDefault = document.getElementById("key-shortcut-ctrl-alt-shift-default-selected");
            let keyboardShortcutLetterNumberDefault = document.getElementById("key-shortcut-default-selected");
            let keyboardShortcutCtrlAltShiftDomain = document.getElementById("key-shortcut-ctrl-alt-shift-domain-selected");
            let keyboardShortcutLetterNumberDomain = document.getElementById("key-shortcut-domain-selected");
            let keyboardShortcutCtrlAltShiftPage = document.getElementById("key-shortcut-ctrl-alt-shift-page-selected");
            let keyboardShortcutLetterNumberPage = document.getElementById("key-shortcut-page-selected");

            keyboardShortcutCtrlAltShiftDefault.value = "Ctrl+Alt";
            keyboardShortcutLetterNumberDefault.value = "O";
            keyboardShortcutCtrlAltShiftDomain.value = "Ctrl+Alt";
            keyboardShortcutLetterNumberDomain.value = "D";
            keyboardShortcutCtrlAltShiftPage.value = "Ctrl+Alt";
            keyboardShortcutLetterNumberPage.value = "P";

            ctrl_alt_shift.forEach(value => {
                let keyboardShortcutCtrlAltShift = document.getElementById("key-shortcut-ctrl-alt-shift-" + value + "-selected");
                let keyboardShortcutLetterNumber = document.getElementById("key-shortcut-" + value + "-selected");
                if (settings_json["open-popup-" + value] !== undefined && settings_json["open-popup-" + value] !== "disabled") {
                    if (keyboardShortcutLetterNumber.classList.contains("hidden")) keyboardShortcutLetterNumber.classList.remove("hidden");
                    if (document.getElementById("label-plus-shortcut-" + value).classList.contains("hidden")) document.getElementById("label-plus-shortcut-" + value).classList.remove("hidden");
                    let splitKeyboardShortcut = settings_json["open-popup-" + value].split("+");
                    let letterNumberShortcut = splitKeyboardShortcut[splitKeyboardShortcut.length - 1];
                    let ctrlAltShiftShortcut = settings_json["open-popup-" + value].substring(0, settings_json["open-popup-" + value].length - 2);
                    keyboardShortcutLetterNumber.value = letterNumberShortcut;
                    keyboardShortcutCtrlAltShift.value = ctrlAltShiftShortcut;

                    let commandName = "_execute_browser_action";
                    if (value === "domain") commandName = "opened-by-domain";
                    else if (value === "page") commandName = "opened-by-page";
                    else if (value === "global") commandName = "opened-by-global";

                    onChangeShortcut(keyboardShortcutCtrlAltShift, keyboardShortcutLetterNumber, keyboardShortcutCtrlAltShift, value, settings_json);
                    onChangeShortcut(keyboardShortcutLetterNumber, keyboardShortcutLetterNumber, keyboardShortcutCtrlAltShift, value, settings_json);
                } else {
                    keyboardShortcutCtrlAltShift.value = settings_json["open-popup-" + value];
                    keyboardShortcutLetterNumber.classList.add("hidden");
                    document.getElementById("label-plus-shortcut-" + value).classList.add("hidden");

                    onChangeShortcut(keyboardShortcutCtrlAltShift, keyboardShortcutLetterNumber, keyboardShortcutCtrlAltShift, value, settings_json);
                    onChangeShortcut(keyboardShortcutLetterNumber, keyboardShortcutLetterNumber, keyboardShortcutCtrlAltShift, value, settings_json);
                }
            });
            //console.log(JSON.stringify(settings_json));
        });
    });


    checkTheme(false, "auto", function (params) {
        document.getElementById("item-radio-theme-auto").style.backgroundColor = params[1];
        document.getElementById("theme-select-firefox").style.color = params[2];
        document.getElementById("primary-auto").style.backgroundColor = params[2];
        document.getElementById("primary-auto").style.color = params[4];
        document.getElementById("secondary-auto").style.backgroundColor = params[3];
        document.getElementById("secondary-auto").style.color = params[5];
    });
}

//if sync storage contains "notefox-account", and it's saved the variable ["login-id", "password" and "expiry"], then show the string relative to "Manage your Notefox account", otherwise
//show the string relative to "Login or Sign up to Notefox". In addition, it's changed also the class of the button ("login-button", "manage-button")
function setNotefoxAcocuntLoginSignupManageButton() {
    browser.storage.sync.get("notefox-account").then(result => {
        if (result["notefox-account"] !== undefined && result["notefox-account"] !== {}) {
            document.getElementById("notefox-account-settings-button").value = all_strings["notefox-account-button-settings-manage"];
            if (document.getElementById("notefox-account-settings-button").classList.contains("login-button")) document.getElementById("notefox-account-settings-button").classList.remove("login-button");
            document.getElementById("notefox-account-settings-button").classList.add("manage-button");
        } else {
            document.getElementById("notefox-account-settings-button").value = all_strings["notefox-account-button-settings-login-or-signup"];
            if (document.getElementById("notefox-account-settings-button").classList.contains("manage-button")) document.getElementById("notefox-account-settings-button").classList.remove("manage-button");
            document.getElementById("notefox-account-settings-button").classList.add("login-button");
        }
        document.getElementById("notefox-account-settings-button").onclick = function () {
            notefoxAccountLoginSignupManage();
        }
    });
}

function onChangeShortcut(element, keyboardShortcutLetterNumber, keyboardShortcutCtrlAltShift, value, settings_json) {
    element.onchange = function () {
        if (keyboardShortcutCtrlAltShift.value !== "disabled") {
            if (keyboardShortcutLetterNumber.classList.contains("hidden")) keyboardShortcutLetterNumber.classList.remove("hidden");
            if (document.getElementById("label-plus-shortcut-" + value).classList.contains("hidden")) document.getElementById("label-plus-shortcut-" + value).classList.remove("hidden");
            settings_json["open-popup-" + value] = keyboardShortcutCtrlAltShift.value + "+" + keyboardShortcutLetterNumber.value;
        } else {
            keyboardShortcutLetterNumber.classList.add("hidden");
            document.getElementById("label-plus-shortcut-" + value).classList.add("hidden");
            settings_json["open-popup-" + value] = "disabled";
        }

        saveSettings();
    }
}

function sendMessageUpdateToBackground() {
    browser.runtime.sendMessage({"updated": true});
}

function saveSettings() {
    //console.log(JSON.stringify(settings_json));
    browser.storage.local.get(["storage"]).then(resultSyncLocalValue => {
        sync_local.get("settings").then(rrr1 => {
            sync_local.set({"settings": settings_json}).then(resultF => {
                    //Saved
                    let buttonSave = document.getElementById("save-settings-button");
                    buttonSave.value = all_strings["saved-button"];

                    let sync_or_local_settings = document.getElementById("save-on-local-instead-of-sync-check").checked;
                    if (sync_or_local_settings === undefined) sync_or_local_settings = true;

                    if (sync_or_local_settings === true) {
                        //use local (from sync)
                        sync_local = browser.storage.local;
                        browser.storage.sync.get([
                            "settings",
                            "websites",
                            "sticky-notes-coords",
                            "sticky-notes-sizes",
                            "sticky-notes-opacity"
                        ]).then(result => {
                            browser.storage.local.set(result).then(resultSet => {
                                browser.storage.sync.get([
                                    "settings",
                                    "websites",
                                    "sticky-notes-coords",
                                    "sticky-notes-sizes",
                                    "sticky-notes-opacity"
                                ]).then(result2 => {

                                    if (result2["settings"] === {} || result2["settings"] === null) browser.storage.sync.remove("settings");
                                    if (result2["websites"] === {} || result2["websites"] === null) browser.storage.sync.remove("websites");
                                    if (result2["sticky-notes-coords"] === {} || result2["sticky-notes-coords"] === null) browser.storage.sync.remove("sticky-notes-coords");
                                    if (result2["sticky-notes-sizes"] === {} || result2["sticky-notes-sizes"] === null) browser.storage.sync.remove("sticky-notes-sizes");
                                    if (result2["sticky-notes-opacity"] === {} || result2["sticky-notes-opacity"] === null) browser.storage.sync.remove("sticky-notes-opacity");

                                    ctrl_alt_shift.forEach(value => {
                                        let commandName = "_execute_browser_action";
                                        if (value === "domain") commandName = "opened-by-domain";
                                        else if (value === "page") commandName = "opened-by-page";
                                        else if (value === "global") commandName = "opened-by-global";

                                        //commandName = "open-by-"+value;
                                        let shortcutToSet = settings_json["open-popup-" + value];
                                        if (shortcutToSet === "disabled") shortcutToSet = "";

                                        updateShortcut(commandName, shortcutToSet);
                                    });

                                    //console.log("-1->" + JSON.stringify(result));
                                    //console.log("-2->" + JSON.stringify(result2));
                                    //console.log(JSON.stringify(result) === JSON.stringify(result2));

                                    if (JSON.stringify(result) === JSON.stringify(result2)) {
                                        browser.storage.sync.clear().then(
                                            result3 => {
                                                browser.storage.local.set({"storage": "local"});
                                            });
                                    }
                                });
                                browser.storage.local.set({"storage": "local"});
                            }).catch((error) => {
                                console.error("Error importing data to local:", error);
                            });
                        }).catch((error) => {
                            console.error("Error retrieving data from sync:", error);
                        });
                    } else if (sync_or_local_settings === false) {
                        //use sync (from local)
                        sync_local = browser.storage.sync;
                        browser.storage.local.get([
                            "settings",
                            "websites",
                            "sticky-notes-coords",
                            "sticky-notes-sizes",
                            "sticky-notes-opacity"
                        ]).then(result => {
                            //console.log(JSON.stringify(result));
                            browser.storage.sync.set(result).then(resultSet => {
                                browser.storage.local.get([
                                    "settings",
                                    "websites",
                                    "sticky-notes-coords",
                                    "sticky-notes-sizes",
                                    "sticky-notes-opacity"
                                ]).then(result2 => {

                                    if (result2["settings"] === {} || result2["settings"] === null) browser.storage.local.remove("settings");
                                    if (result2["websites"] === {} || result2["websites"] === null) browser.storage.local.remove("websites");
                                    if (result2["sticky-notes-coords"] === {} || result2["sticky-notes-coords"] === null) browser.storage.local.remove("sticky-notes-coords");
                                    if (result2["sticky-notes-sizes"] === {} || result2["sticky-notes-sizes"] === null) browser.storage.local.remove("sticky-notes-sizes");
                                    if (result2["sticky-notes-opacity"] === {} || result2["sticky-notes-opacity"] === null) browser.storage.local.remove("sticky-notes-opacity");
                                    //console.log("-1->" + JSON.stringify(result));
                                    //console.log("-2->" + JSON.stringify(result2));
                                    //console.log(JSON.stringify(result) === JSON.stringify(result2));

                                    ctrl_alt_shift.forEach(value => {
                                        //console.log("1>"+settings_json["open-popup-" + value])
                                        let commandName = "_execute_browser_action";
                                        if (value === "domain") commandName = "opened-by-domain";
                                        else if (value === "page") commandName = "opened-by-page";
                                        else if (value === "global") commandName = "opened-by-global";

                                        //commandName = "open-by-"+value;
                                        let shortcutToSet = settings_json["open-popup-" + value];
                                        if (shortcutToSet === "disabled") shortcutToSet = "";

                                        updateShortcut(commandName, shortcutToSet);
                                    });

                                    if (JSON.stringify(result) === JSON.stringify(result2)) browser.storage.local.clear().then(
                                        result3 => {
                                            browser.storage.local.set({"storage": "sync"});
                                        });
                                });
                                browser.storage.local.set({"storage": "sync"});
                            }).catch((error) => {
                                console.error("Error importing data to sync:", error);
                            });
                        }).catch((error) => {
                            console.error("Error retrieving data from local:", error);
                        });
                    }
                    sendMessageUpdateToBackground();

                    setTimeout(function () {
                        buttonSave.value = all_strings["save-settings-button"];
                    }, 2000);
                    //console.log(JSON.stringify(settings_json));

                    if (rrr1 !== undefined && rrr1["settings"] !== undefined && rrr1["settings"]["theme"] !== undefined && rrr1["settings"]["theme"] !== settings_json["theme"] || settings_json["theme"] === undefined) {
                        checkTheme();
                    }
                    loadSettings();
                }
            )
            ;
        });
    });
}

function loadAsideBar() {
    let all_notes = document.getElementById("all-notes-aside");
    let settings = document.getElementById("settings-aside");
    let help = document.getElementById("help-aside");
    let website = document.getElementById("website-aside");
    let donate = document.getElementById("donate-aside");
    let translate = document.getElementById("translate-aside");
    let version = document.getElementById("version-aside");

    all_notes.innerHTML = all_strings["all-notes-aside"];
    all_notes.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["all-notes"], "_self");
        }
    }
    settings.innerHTML = all_strings["settings-aside"];
    settings.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["settings"], "_self");
        }
    }
    help.innerHTML = all_strings["help-aside"];
    help.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["help"], "_self");
        }
    }
    website.innerHTML = all_strings["website-aside"];
    website.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["website"], "_self")
        }
    }
    donate.innerHTML = all_strings["donate-aside"];
    donate.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["donate"], "_self");
        }
    }
    translate.innerHTML = all_strings["translate-aside"];
    translate.onclick = function () {
        if (!importing) {
            window.open(links_aside_bar["translate"], "_self");
        }
    }

    version.innerHTML = all_strings["version-aside"].replaceAll("{{version}}", browser.runtime.getManifest().version);
}

function checkOperatingSystem() {
    let info = browser.runtime.getPlatformInfo();
    info.then(getOperatingSystem);
    //"mac", "win", "linux", "openbsd", "cros", ...
    // Docs: (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformOs)ˇ
}

function getOperatingSystem(info) {
    if (info.os === "mac") currentOS = "mac";
    else currentOS = "default";

    ctrl_alt_shift.forEach(value => {
        document.getElementById("select-disable-shortcut-" + value).textContent = all_strings["label-disable-shortcut"];
        document.getElementById("select-ctrl-shortcut-" + value).textContent = all_strings["label-ctrl-" + currentOS];
        document.getElementById("select-alt-shortcut-" + value).textContent = all_strings["label-alt-" + currentOS];
        document.getElementById("select-ctrl-alt-shortcut-" + value).textContent = all_strings["label-ctrl-alt-" + currentOS];
        document.getElementById("select-ctrl-shift-shortcut-" + value).textContent = all_strings["label-ctrl-shift-" + currentOS];
        document.getElementById("select-alt-shift-shortcut-" + value).textContent = all_strings["label-alt-shift-" + currentOS];
    });
}

function getCurrentShortcuts(commands) {
    commands.forEach((command) => {
        settings_json[command] = command.shortcut;
    });
}

function updateShortcut(commandName, shortcut) {
    //to disable the shortcut -> the "shortcut" value have to be an empty string
    browser.commands.update({
        name: commandName, shortcut: shortcut
    });
}

function clearAllNotes() {
    let confirmationClearAllNotes = confirm(all_strings["clear-all-notes-confirmation"]);
    if (confirmationClearAllNotes) {
        sync_local.set({
            "websites": {},
            "settings": {},
            "sticky-notes-coords": {},
            "sticky-notes-sizes": {},
            "sticky-notes-opacity": {}
        }).then(result => {
            loaded();
        });
    }
}

function importAllNotes(from_file = false) {
    document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];

    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity",
    ]).then(result => {
        let jsonImportElement = document.getElementById("json-import");
        let json_old_version = {};

        document.getElementById("import-from-file-button").value = all_strings["import-notes-from-file-button"];

        //console.log(JSON.stringify(result));
        if (show_conversion_message_attention) {
            if (document.getElementById("import-now-all-notes-from-local-button")) {
                document.getElementById("import-now-all-notes-from-local-button").onclick = function () {
                    result["notefox"] = {};
                    result["notefox"]["version"] = "3.2";
                    result["storage"] = "sync";
                    result["sticky-notes"] = {};
                    result["sticky-notes"]["coords"] = result["sticky-notes-coords"];
                    result["sticky-notes"]["sizes"] = result["sticky-notes-sizes"];
                    result["sticky-notes"]["opacity"] = result["sticky-notes-opacity"];
                    delete result["sticky-notes-coords"];
                    delete result["sticky-notes-sizes"];
                    delete result["sticky-notes-opacity"];
                    jsonImportElement.value = JSON.stringify(result);
                    json_old_version = result;
                }
            }
        } else {
            if (document.getElementById("import-now-all-notes-from-local-button")) document.getElementById("import-now-all-notes-from-local-button").remove();
        }

        let n_errors = 0;
        showBackgroundOpacity();
        document.getElementById("import-section").style.display = "block";
        jsonImportElement.value = "";
        jsonImportElement.focus();

        document.getElementById("cancel-import-all-notes-button").onclick = function () {
            hideBackgroundOpacity();
            document.getElementById("import-section").style.display = "none";
        }
        document.getElementById("import-now-all-notes-button").onclick = function () {
            let value = jsonImportElement.value;
            if (value.replaceAll(" ", "") !== "") {
                let error = false;
                let error_description = "";
                try {
                    //json_to_export = {"notefox": notefox_json, "websites": websites_json, "settings": settings_json, "sticky-notes": sticky_notes_json};
                    let json_to_export_temp = JSON.parse(value);
                    let continue_ok = false;
                    let cancel = false;
                    if (json_to_export_temp["notefox"] === undefined || (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["notefox"]["version"] === undefined)) {
                        //version before 2.0 (export in a different way)
                        cancel = !confirm(all_strings["notefox-version-too-old-try-to-import-data-anyway"]);
                        if (!cancel) {
                            websites_json = json_to_export_temp;
                            websites_json_to_show = websites_json;
                        }
                    }
                    if (json_to_export_temp["notefox"] !== undefined) {
                        let check_version = checkTwoVersions(json_to_export_temp["notefox"]["version"], "3.3.1.8");
                        if (check_version === "<") {
                            cancel = !confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                            continue_ok = !cancel
                        } else {
                            continue_ok = true;
                        }
                    } else {
                        cancel = !confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                        continue_ok = !cancel;
                    }

                    let sticky_notes = {};

                    if (continue_ok) {
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["websites"] !== undefined) {
                            websites_json = json_to_export_temp["websites"];
                            websites_json_to_show = websites_json;
                        }
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["settings"] !== undefined) settings_json = json_to_export_temp["settings"];
                        for (setting in settings_json) {
                            if (settings_json[setting] === "yes") settings_json[setting] = true;
                            else if (settings_json[setting] === "no") settings_json[setting] = false;
                        }
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["sticky-notes"] !== undefined) {
                            if (json_to_export_temp["sticky-notes"].coords !== undefined) sticky_notes.coords = json_to_export_temp["sticky-notes"].coords;

                            if (json_to_export_temp["sticky-notes"].sizes !== undefined) sticky_notes.sizes = json_to_export_temp["sticky-notes"].sizes;

                            if (json_to_export_temp["sticky-notes"].opacity !== undefined) sticky_notes.opacity = json_to_export_temp["sticky-notes"].opacity;

                            if (sticky_notes.coords === undefined || sticky_notes.coords === null) sticky_notes.coords = {
                                x: "20px",
                                y: "20px"
                            };
                            if (sticky_notes.sizes === undefined || sticky_notes.sizes === null) sticky_notes.sizes = {
                                w: "300px",
                                h: "300px"
                            };
                            if (sticky_notes.opacity === undefined || sticky_notes.opacity === null) sticky_notes.opacity = {value: 0.7};
                        }
                    }

                    //console.log(JSON.stringify(json_to_export_temp));

                    browser.storage.local.get([
                        "storage"
                    ]).then(resultSyncOrLocalToUse => {
                            let storageTemp;
                            if (json_to_export_temp["storage"] !== undefined) storageTemp = json_to_export_temp["storage"];

                            if (storageTemp === undefined && resultSyncOrLocalToUse["storage"] !== undefined) storageTemp = resultSyncOrLocalToUse["storage"];
                            else if ((storageTemp === "sync" || storageTemp === "local")) storageTemp = storageTemp; //do not do anything
                            else storageTemp = "local";

                            if (continue_ok) {
                                importing = true;
                                document.getElementById("cancel-import-all-notes-button").style.display = "none";
                                document.getElementById("import-from-file-button").style.display = "none";

                                browser.storage.local.set({"storage": storageTemp}).then(resultSyncLocal => {
                                    checkSyncLocal();

                                    document.getElementById("import-now-all-notes-button").disabled = true;
                                    document.getElementById("cancel-import-all-notes-button").disabled = true;
                                    document.getElementById("import-now-all-notes-button").value = all_strings["importing-button"];
                                    setTimeout(function () {
                                        document.getElementById("import-now-all-notes-button").disabled = false;
                                        document.getElementById("cancel-import-all-notes-button").disabled = false;
                                        document.getElementById("import-now-all-notes-button").value = all_strings["imported-button"];

                                        sync_local.set({
                                            "websites": websites_json,
                                            "settings": settings_json,
                                            "sticky-notes-coords": sticky_notes.coords,
                                            "sticky-notes-sizes": sticky_notes.sizes,
                                            "sticky-notes-opacity": sticky_notes.opacity
                                        }).then(function () {
                                            //Imported all correctly
                                            sync_local.get([
                                                "settings",
                                                "websites",
                                                "sticky-notes-coords",
                                                "sticky-notes-sizes",
                                                "sticky-notes-opacity"
                                            ]).then(result => {
                                                //console.log(JSON.stringify(storageTemp));
                                                if (storageTemp === "sync") {
                                                    if (JSON.stringify(json_old_version) === jsonImportElement.value) {
                                                        browser.storage.local.clear().then(result1 => {
                                                            browser.storage.local.set({"storage": "sync"})
                                                        });
                                                    } else browser.storage.local.set({"storage": "sync"})
                                                } else {
                                                    if (JSON.stringify(json_old_version) === jsonImportElement.value) {
                                                        browser.storage.local.clear().then(result1 => {
                                                            browser.storage.local.set({"storage": "local"})
                                                        });
                                                    } else browser.storage.local.set({"storage": "local"})
                                                }
                                            });

                                            importing = false;
                                            document.getElementById("cancel-import-all-notes-button").style.display = "inline-block";
                                            document.getElementById("import-from-file-button").style.display = "inline-block";
                                            document.getElementById("import-now-all-notes-button").disabled = false;
                                            document.getElementById("cancel-import-all-notes-button").disabled = false;
                                            document.getElementById("import-now-all-notes-button").value = all_strings["imported-button"];

                                            document.getElementById("import-section").style.display = "none";
                                            hideBackgroundOpacity()

                                            loaded();
                                        }).catch(function (error) {
                                            console.error("E10: " + error);
                                        });
                                    }, 2000);
                                });
                            }
                        }
                    )
                    ;


                    if (!continue_ok && !cancel) {
                        error = true;
                        error_description = "One or more parameters are not correct and it's not possible import data.";
                    }
                    //console.log(JSON.stringify(json_to_export_temp));
                } catch
                    (e) {
                    //console.log("Error: " + e.toString());
                    error = true;
                    error_description = e.toString()
                }

                if (error) {
                    let errorSubSection = document.createElement("div");
                    errorSubSection.classList.add("sub-section", "background-light-red");
                    errorSubSection.id = "error-message-" + n_errors;
                    errorSubSection.textContent = "Error: " + error_description;
                    setTimeout(function () {
                        errorSubSection.remove();
                    }, 10000);
                    n_errors++;

                    let mainSection = document.getElementById("import-sub-sections");
                    mainSection.insertBefore(errorSubSection, mainSection.childNodes[0]);
                }
            }
        }

        if (from_file) {
            importFromFile();
        }
    });
}

function importFromFile() {
    try {
        let input = document.getElementById("import-from-file-input-hidden");
        input.value = ""; //Reset to empty
        input.onchange = function (e) {
            const file = this.files[0];
            //console.log(file);
            if (file === undefined || file.name === '') {
                return;
            }
            if (file.type === undefined || file.type !== undefined && file.type !== "application/json") {
                return;
            }

            const filename = file.name;

            const fileReaderOnLoadHandler = function () {
                let data = undefined;
                try {
                    data = JSON.parse(this.result);
                    //console.log(data);

                    document.getElementById("json-import").value = JSON.stringify(data);
                    document.getElementById("import-now-all-notes-button").click();
                } catch (e) {
                    console.error(`I-E2: ${e}`)
                }
            };

            const fr = new FileReader();
            fr.onload = fileReaderOnLoadHandler;
            fr.readAsText(file);
        };
        input.click();
    } catch (e) {
        console.error(`I-E1: ${e}`);
    }
}

function exportAllNotes(to_file = false) {
    showBackgroundOpacity();
    browser.storage.local.get(["storage"]).then(getStorageTemp => {
        sync_local.get([
            "sticky-notes-coords",
            "sticky-notes-opacity",
            "sticky-notes-sizes",
            "websites"
        ]).then((result) => {
            // Handle the result
            let sticky_notes = {};
            sticky_notes.coords = result["sticky-notes-coords"];
            sticky_notes.sizes = result["sticky-notes-sizes"];
            sticky_notes.opacity = result["sticky-notes-opacity"];

            let websites_json = result["websites"];

            if (sticky_notes.coords === undefined && sticky_notes.coords === null) {
                sticky_notes.coords = {x: "20px", y: "20px"};
            }
            if (sticky_notes.sizes === undefined || sticky_notes.sizes === null) {
                sticky_notes.sizes = {w: "300px", h: "300px"};
            }
            if (sticky_notes.opacity === undefined || sticky_notes.opacity === null) {
                sticky_notes.opacity = {value: 0.7};
            }
            sticky_notes.opacity.value = Number.parseFloat(sticky_notes.opacity.value).toFixed(2);

            //console.log(JSON.stringify(result));

            document.getElementById("export-section").style.display = "block";
            json_to_export = {};
            for (setting in settings_json) {
                if (settings_json[setting] === "yes") settings_json[setting] = true;
                else if (settings_json[setting] === "no") settings_json[setting] = false;
            }
            json_to_export = {
                "notefox": notefox_json,
                "settings": settings_json,
                "websites": websites_json,
                "sticky-notes": sticky_notes,
                "storage": getStorageTemp["storage"]
            };
            document.getElementById("json-export").value = JSON.stringify(json_to_export);

            document.getElementById("cancel-export-all-notes-button").onclick = function () {
                hideBackgroundOpacity();
                document.getElementById("export-section").style.display = "none";

                document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
                document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];
            }
            document.getElementById("copy-now-all-notes-button").onclick = function () {
                document.getElementById("cancel-export-all-notes-button").value = all_strings["close-button"];
                document.getElementById("copy-now-all-notes-button").value = all_strings["copied-button"];

                document.getElementById("json-export").value = JSON.stringify(json_to_export);
                document.getElementById("json-export").select();
                document.execCommand("copy");
            }

            document.getElementById("export-to-file-button").value = all_strings["export-notes-to-file-button"];
            if (to_file) {
                exportToFile();
            }
        }).catch((e) => {
            console.error(`E-E2: ${e}`);
        });
    });
}

function exportToFile() {
    const data = JSON.stringify(json_to_export);
    const blob = new Blob([data], {type: "application/json"});

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so add 1
    const day = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${year}_${month}_${day}`;

    browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: "notefox_" + notefox_json.version.toString() + "_" + formattedDate + "_" + Date.now() + ".json",
        saveAs: false, // Show the file save dialog
    });

    setTimeout(function () {
        if (document.getElementById("export-section").style.display !== "none") {
            document.getElementById("cancel-export-all-notes-button").click();
        }
    }, 1000);

    document.getElementById("cancel-export-all-notes-button").value = all_strings["close-button"];
    document.getElementById("export-to-file-button").value = all_strings["exported-notes-to-file-button"];
}

function notefoxAccountLoginSignupManage() {
    showBackgroundOpacity();

    var elements = document.getElementsByClassName("button-close-notefox-account");
    for (var i = 0; i < elements.length; i++) {
        elements[i].value = all_strings["cancel-button"];
        elements[i].onclick = function () {
            hideBackgroundOpacity();
            document.getElementById("account-section").style.display = "none";
        }
    }
    browser.storage.sync.get(["notefox-account"]).then(savedData => {
        document.getElementById("account-section").style.display = "block";

        document.getElementById("notefox-account-signup-section").classList.add("hidden");
        document.getElementById("notefox-account-login-section").classList.add("hidden");
        document.getElementById("notefox-account-manage-section").classList.add("hidden");

        if (savedData["notefox-account"] !== undefined && savedData["notefox-account"] !== {}) {
            //Manage account
            console.log("Manage account");

            if (document.getElementById("notefox-account-manage-section").classList.contains("hidden")) document.getElementById("notefox-account-manage-section").classList.remove("hidden");
        } else {
            //Login or Sign up
            console.log("Login or Sign up");

            if (document.getElementById("notefox-account-signup-section").classList.contains("hidden")) document.getElementById("notefox-account-signup-section").classList.remove("hidden");
            //if (document.getElementById("notefox-account-login-section").classList.contains("hidden")) document.getElementById("notefox-account-login-section").classList.remove("hidden");

            document.getElementById("signup-submit").onclick = function () {
                let username = document.getElementById("signup-username").value;
                let password = document.getElementById("signup-password").value;
                let password2 = document.getElementById("signup-confirm-password").value;
                let email = document.getElementById("signup-email").value;

                if (username === "" || password === "" || password2 === "" || email === "") {
                    alert(all_strings["empty-fields-alert"]);
                } else {
                    if (password !== password2) {
                        alert(all_strings["passwords-not-equal-alert"]);
                    } else {
                        browser.runtime.sendMessage({
                            "api": true,
                            "type": "signup",
                            "data": {"username": username, "password": password, "email": email}
                        });

                        document.getElementById("signup-submit").disabled = true;
                        document.getElementById("signup-email").disabled = true;
                        document.getElementById("signup-username").disabled = true;
                        document.getElementById("signup-password").disabled = true;
                        document.getElementById("signup-confirm-password").disabled = true;
                    }
                }
            }
        }
    });

    browser.runtime.onMessage.addListener((message) => {
        if (message["api_response"] !== undefined && message["api_response"]) {
            let data = message["data"];
            switch (message["type"]) {
                case "signup":
                    console.log("Signup response");
                    console.log(data);
                    break;
                default:
                    console.error("Error: " + message["type"] + " is not a valid type");
            }
        }
    });

    function signUpRespone
}

function showBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "block";
}

function hideBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "none";
}

/**
 * Compare two versions (they have to be in this form: W.Z.Y.Z, it's ok also sub-parts of it: W, W.Z, W.Z.Y)
 * @param version1 the first version
 * @param version2 the second version
 * @returns {string} ">" the first version is major than the second one, "=" equals, "<" minor, "!" wrong version form
 */
function checkTwoVersions(version1, version2) {
    let valueToReturn = "";

    let v1 = version1.toString().split(".");
    let v2 = version2.toString().split(".");

    if (v1.length > 0 && v2.length > 0 && v1[0].length > 0 && v2[0].length > 0) {
        if (parseInt(v1[0]) > parseInt(v2[0])) {
            valueToReturn = ">"
        } else if (parseInt(v1[0]) < parseInt(v2[0])) {
            valueToReturn = "<";
        } else {
            let index = 1;
            while (index < 4 && valueToReturn === "") {
                if (v1.length > 0 && v2.length > 0) {
                    if (v1.length === index && v2.length === index) {
                        valueToReturn = "=";
                    } else if (v1.length > index && v2.length === index) {
                        if (v1[index] !== "0") valueToReturn = ">";
                        else valueToReturn = "=";
                    } else if (v1.length === index && v2.length > index) {
                        if (v2[index] !== "0") valueToReturn = "<";
                        else valueToReturn = "=";
                    } else {
                        if (parseInt(v1[index]) > parseInt(v2[index])) valueToReturn = ">";
                        else if (parseInt(v1[index]) < parseInt(v2[index])) valueToReturn = "<";
                        else {
                            if (!(v1.length > index + 1 || v2.length > index + 1)) valueToReturn = "=";
                        }
                    }
                } else {
                    valueToReturn = "!";
                }
                index++;
            }
        }
    } else {
        valueToReturn = "!";
    }

    return valueToReturn;
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        //document.getElementById("settings-dedication-section").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("settings-dedication-section").style.color = primary;
        var save_svg = window.btoa(getIconSvgEncoded("save", on_primary));
        var translate_svg = window.btoa(getIconSvgEncoded("translate", on_primary));
        var github_svg = window.btoa(getIconSvgEncoded("github", on_primary));
        var email_svg = window.btoa(getIconSvgEncoded("email", on_primary));
        var firefox_svg = window.btoa(getIconSvgEncoded("firefox", on_primary));
        var telegram_svg = window.btoa(getIconSvgEncoded("telegram", on_primary));
        var all_notes_aside_svg = window.btoa(getIconSvgEncoded("all-notes", primary));
        var settings_aside_svg = window.btoa(getIconSvgEncoded("settings", on_primary));
        var help_aside_svg = window.btoa(getIconSvgEncoded("help", primary));
        var review_aside_svg = window.btoa(getIconSvgEncoded("review", primary));
        var website_aside_svg = window.btoa(getIconSvgEncoded("website", primary));
        var donate_aside_svg = window.btoa(getIconSvgEncoded("donate", primary));
        var translate_aside_svg = window.btoa(getIconSvgEncoded("translate", primary));
        let arrow_select_svg = window.btoa(getIconSvgEncoded("arrow-select", on_primary));
        var import_svg = window.btoa(getIconSvgEncoded("import", on_primary));
        var export_svg = window.btoa(getIconSvgEncoded("export", on_primary));
        var download_svg = window.btoa(getIconSvgEncoded("download", on_primary));
        var delete_svg = window.btoa(getIconSvgEncoded("delete", on_primary));

        var login_svg = window.btoa(getIconSvgEncoded("login", on_primary));
        var logout_svg = window.btoa(getIconSvgEncoded("logout", on_primary));
        var signup_svg = window.btoa(getIconSvgEncoded("signup", on_primary));
        var account_svg = window.btoa(getIconSvgEncoded("account", on_primary));
        var sync_svg = window.btoa(getIconSvgEncoded("sync", on_primary));
        var sync_error_svg = window.btoa(getIconSvgEncoded("sync-error", on_primary));
        var syncing_svg = window.btoa(getIconSvgEncoded("syncing", on_primary));

        var account_label_svg = window.btoa(getIconSvgEncoded("account", textbox_color));
        var email_label_svg = window.btoa(getIconSvgEncoded("email", textbox_color));
        var password_label_svg = window.btoa(getIconSvgEncoded("password", textbox_color));

        let tertiary = backgroundSection;
        let tertiaryTransparent = primary;
        let tertiaryTransparent2 = primary;
        if (tertiaryTransparent.includes("rgb(")) {
            let rgb_temp = tertiaryTransparent.replace("rgb(", "");
            let rgb_temp_arr = rgb_temp.split(",");
            if (rgb_temp_arr.length >= 3) {
                let red = rgb_temp_arr[0].replace(" ", "");
                let green = rgb_temp_arr[1].replace(" ", "");
                let blue = rgb_temp_arr[2].replace(")", "").replace(" ", "");
                tertiaryTransparent = `rgba(${red}, ${green}, ${blue}, 0.2)`;
                tertiaryTransparent2 = `rgba(${red}, ${green}, ${blue}, 0.8)`;
            }
        } else if (tertiaryTransparent.includes("#")) {
            tertiaryTransparent += "22";
            tertiaryTransparent2 += "88";
        }
        //console.log(tertiaryTransparent);

        document.head.innerHTML += `
            <style>
                :root {
                    --primary-color: ${primary};
                    --secondary-color: ${secondary};
                    --on-primary-color: ${on_primary};
                    --on-secondary-color: ${on_secondary};
                    --textbox-color: ${textbox_background};
                    --on-textbox-color: ${textbox_color};
                    --tertiary: ${tertiary};
                    --tertiary-transparent: ${tertiaryTransparent};
                    --tertiary-transparent-2: ${tertiaryTransparent2};
                }
                .save-button {
                    background-image: url('data:image/svg+xml;base64,${save_svg}');
                }
                .translate-button {
                    background-image: url('data:image/svg+xml;base64,${translate_svg}');
                }
                .github-button {
                    background-image: url('data:image/svg+xml;base64,${github_svg}');
                }
                .email-button {
                    background-image: url('data:image/svg+xml;base64,${email_svg}');
                }
                .firefox-button {
                    background-image: url('data:image/svg+xml;base64,${firefox_svg}');
                }
                .telegram-button {
                    background-image: url('data:image/svg+xml;base64,${telegram_svg}');
                }
                .import-button {
                    background-image: url('data:image/svg+xml;base64,${import_svg}');
                }
                .export-button {
                    background-image: url('data:image/svg+xml;base64,${export_svg}');
                }
                .download-button {
                    background-image: url('data:image/svg+xml;base64,${download_svg}');
                }
                .clear-button {
                    background-image: url('data:image/svg+xml;base64,${delete_svg}');
                }
                #settings-aside {
                    background-image: url('data:image/svg+xml;base64,${settings_aside_svg}');
                }
                #all-notes-aside {
                    background-image: url('data:image/svg+xml;base64,${all_notes_aside_svg}');
                }
                #help-aside {
                    background-image: url('data:image/svg+xml;base64,${help_aside_svg}');
                }
                #review-aside {
                    background-image: url('data:image/svg+xml;base64,${review_aside_svg}');
                }
                #website-aside {
                    background-image: url('data:image/svg+xml;base64,${website_aside_svg}');
                }
                #donate-aside {
                    background-image: url('data:image/svg+xml;base64,${donate_aside_svg}');
                }
                #translate-aside {
                    background-image: url('data:image/svg+xml;base64,${translate_aside_svg}');
                }
                .select-box {
                    background-image: url('data:image/svg+xml;base64,${arrow_select_svg}');
                }
                .section-title-settings {
                    background-color: ${background};
                }
                .login-button {
                    background-image: url('data:image/svg+xml;base64,${login_svg}');
                }
                .logout-button {
                    background-image: url('data:image/svg+xml;base64,${logout_svg}');
                }
                .signup-button {
                    background-image: url('data:image/svg+xml;base64,${signup_svg}');
                }
                .account-button {
                    background-image: url('data:image/svg+xml;base64,${account_svg}');
                }
                .sync-button {
                    background-image: url('data:image/svg+xml;base64,${sync_svg}');
                }
                .sync-error-button {
                    background-image: url('data:image/svg+xml;base64,${sync_error_svg}');
                }
                .syncing-button {
                    background-image: url('data:image/svg+xml;base64,${syncing_svg}');
                }
                
                .password-label {
                    background-image: url('data:image/svg+xml;base64,${password_label_svg}');
                }
                .email-label {
                    background-image: url('data:image/svg+xml;base64,${email_label_svg}');
                }
                .account-label {
                    background-image: url('data:image/svg+xml;base64,${account_label_svg}');
                }
            </style>`;
    }
}

loaded();