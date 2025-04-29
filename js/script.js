var websites_json = {};
var settings_json = {};

var advanced_managing = true;

var currentUrl = []; //[global, domain, page, other]

var selected_tab = 2; //{0: global | 1:domain | 2:page | 3:other}
var opened_by = -1;

//urls WITHOUT the protocol! e.g. addons.mozilla.org
var urls_unsupported_by_sticky_notes = [];//TODO!MANUAL change this manually in case of new unsupported urls
var stickyNotesSupported = true;

const all_strings = strings[languageToUse];
const linkAcceptPrivacy = "/privacy/index.html";

//Do not add "None" because it's treated in a different way!
let colourListDefault = sortObjectByKeys({
    "red": all_strings["red-colour"],
    "yellow": all_strings["yellow-colour"],
    "black": all_strings["black-colour"],
    "orange": all_strings["orange-colour"],
    "pink": all_strings["pink-colour"],
    "purple": all_strings["purple-colour"],
    "gray": all_strings["grey-colour"],
    "green": all_strings["green-colour"],
    "blue": all_strings["blue-colour"],
    "white": all_strings["white-colour"],
    "aquamarine": all_strings["aquamarine-colour"],
    "turquoise": all_strings["turquoise-colour"],
    "brown": all_strings["brown-colour"],
    "coral": all_strings["coral-colour"],
    "cyan": all_strings["cyan-colour"],
    "darkgreen": all_strings["darkgreen-colour"],
    "violet": all_strings["violet-colour"],
    "lime": all_strings["lime-colour"],
    "fuchsia": all_strings["fuchsia-colour"],
    "indigo": all_strings["indigo-colour"],
    "lavender": all_strings["lavender-colour"],
    "teal": all_strings["teal-colour"],
    "navy": all_strings["navy-colour"],
    "olive": all_strings["olive-colour"],
    "plum": all_strings["plum-colour"],
    "salmon": all_strings["salmon-colour"],
    "snow": all_strings["snow-colour"]
});

let actions = [];
let currentAction = 0;
let undoAction = false;

const linkReview = ["https://chromewebstore.google.com/detail/agcdffobijddcccbfnhfjmaohnljefpm"]; //{chrome add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

let sync_local = chrome.storage.local;

let _domainUrl = undefined
let _pageUrl = undefined
let _globalUrl = undefined
let _allPossibleUrls = undefined
const MAX_COMBINATIONS = 20;
const MAX_PARAMETERS = 5;

checkSyncLocal();

function checkSyncLocal() {
    sync_local = chrome.storage.local;
    checkTheme();
}

function loaded() {
    chrome.storage.local.get("privacy").then(result => {
        if (result.privacy === undefined) {
            //not accepted privacy policy -> open 'privacy' page
            chrome.tabs.create({url: linkAcceptPrivacy});
            window.close()
        }
    });
    checkSyncLocal();
    loadSettings();
    checkTheme();
    checkTimesOpened();

    chrome.runtime.onMessage.addListener((message) => {
        if (message["sync_update"] !== undefined && message["sync_update"]) {
            loaded();
        }
        if (message["check-user--expired"] !== undefined && message["check-user--expired"]) {
            //console.log("User expired! Log in again | script");
            loginExpired();
        }
    });
    chrome.runtime.sendMessage({"check-user": true});
}

function checkTimesOpened() {
    sync_local.get("times-opened").then(result => {
        let times = 0;
        if (result !== undefined && result["times-opened"] !== undefined) {
            times = result["times-opened"];
            let interval_to_check = [1000, 5000, 20000, 50000, 100000, 1000000, 5000000];
            if (times > 0 && interval_to_check.includes(times + 1)) {
                chrome.tabs.create({url: "https://www.saveriomorelli.com/projects/notefox/opened-times/"});
                //window.close();
            }
        }
        times++;
        sync_local.set({"times-opened": times});
    });
}

function continueLoaded() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);
        loadUI();
    });

    chrome.tabs.onActivated.addListener(tabUpdated);
    //chrome.tabs.onUpdated.addListener(tabUpdated);

    checkOpenedBy();
    document.getElementById("notes").focus();
}

function checkOpenedBy() {
    sync_local.get("opened-by-shortcut").then(value => {
        if (value["opened-by-shortcut"] !== undefined) {
            if (value["opened-by-shortcut"] === "domain") {
                opened_by = 1;
                loadUI();
            } else if (value["opened-by-shortcut"] === "page") {
                opened_by = 2;
                loadUI();
            } else if (value["opened-by-shortcut"] === "global") {
                opened_by = 0;
                loadUI();
            }
        }
        sync_local.set({"opened-by-shortcut": "default"});
    });
    listenerShortcuts();
}

function listenerShortcuts() {
    /*
    chrome.commands.onCommand.addListener((command) => {
        if (command === "opened-by-domain") {
            //domain
            opened_by = 1;
            loadUI();
        } else if (command === "opened-by-page") {
            //page
            opened_by = 2;
            loadUI();
        } else if (command === "opened-by-global") {
            //global
            opened_by = 0;
            loadUI();
        }
        sync_local.set({"opened-by-shortcut": "default"});
    });
    */
}

function listenerLinks() {
    let notes = document.getElementById("notes");
    if (notes.innerHTML !== "" && notes.innerHTML !== "<br>") {
        let links = notes.querySelectorAll('a');
        links.forEach(link => {
            function onMouseOverDown(event, settings_json, link) {
                if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    link.style.textDecorationStyle = "solid";
                    link.style.cursor = "pointer";
                }
            }

            function onMouseLeaveUp(link) {
                link.style.textDecorationStyle = "dotted";
                link.style.cursor = "inherit";
            }

            link.onmousedown = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseover = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseup = function (event) {
                onMouseLeaveUp(link);
            }
            link.onmouseleave = function (event) {
                onMouseLeaveUp(link);
            }
            link.onclick = function (event) {
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        chrome.tabs.create({
                            url: link.href,
                            index: tabs[0].index + 1
                        });
                    });
                } else {
                    // Prevent the default link behavior
                }
                event.preventDefault();
            }
        });
    }
}

function setLanguageUI() {
    document.getElementById("domain-button").value = all_strings["domain-label"];
    document.getElementById("page-button").value = all_strings["page-label"];
    document.getElementById("global-button").value = all_strings["global-label"];
    document.getElementById("all-notes-button-grid").value = all_strings["see-all-notes-button"];
    document.getElementById("last-updated-section").value = all_strings["last-update-text"].replaceAll("{{date_time}}", "----/--/-- --:--:--");

    document.getElementById("title-notes").placeholder = all_strings["title-notes-placeholder"];
    document.documentElement.style.setProperty('--placeholder-notes-text', `'${all_strings["notes-placeholder"]}'`);
}

function loadUI() {
    //opened_by = {-1: default, 0: domain, 1: page}
    setLanguageUI();
    let notes = document.getElementById("notes");
    let title_notes = document.getElementById("title-notes");
    notes.style.fontFamily = `'${settings_json["font-family"]}'`;
    title_notes.style.fontFamily = `'${settings_json["font-family"]}'`;
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let activeTab = tabs[0];
        let activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;
        let activeTabTitle = activeTab.title;

        setUrl(activeTabUrl);

        if (currentUrl[1] !== "" && currentUrl[2] !== "") {
            sync_local.get("websites", function (value) {
                //console.log("websites: "+JSON.stringify(value));
                let default_index = 2;
                if (!isUrlSupported(activeTabUrl)) default_index = 1;
                if (settings_json["open-default"] === "page" && isUrlSupported(activeTabUrl)) default_index = 2;
                else if (settings_json["open-default"] === "domain" || !isUrlSupported(activeTabUrl) && settings_json["open-default"] === "page") default_index = 1;
                else if (settings_json["open-default"] === "global") default_index = 0;
                if (value["websites"] !== undefined) {
                    websites_json = value["websites"];
                    let check_for_domain = websites_json[currentUrl[1]] !== undefined && websites_json[currentUrl[1]]["last-update"] !== undefined && websites_json[currentUrl[1]]["last-update"] != null && websites_json[currentUrl[1]]["notes"] !== undefined && websites_json[currentUrl[1]]["notes"] !== "";
                    let check_for_page = websites_json[currentUrl[2]] !== undefined && websites_json[currentUrl[2]]["last-update"] !== undefined && websites_json[currentUrl[2]]["last-update"] != null && websites_json[currentUrl[2]]["notes"] !== undefined && websites_json[currentUrl[2]]["notes"] !== "";
                    let check_for_global = websites_json[currentUrl[0]] !== undefined && websites_json[currentUrl[0]]["last-update"] !== undefined && websites_json[currentUrl[0]]["last-update"] != null && websites_json[currentUrl[0]]["notes"] !== undefined && websites_json[currentUrl[0]]["notes"] !== "";
                    let subdomains = getAllOtherPossibleUrls(activeTabUrl);
                    let check_for_subdomains = false;
                    subdomains.forEach(subdomain => {
                        let url = getDomainUrl(activeTabUrl) + subdomain;
                        let tmp_check = websites_json[url] !== undefined && websites_json[url]["last-update"] !== undefined && websites_json[url]["last-update"] != null && websites_json[url]["notes"] !== undefined && websites_json[url]["notes"] !== "";
                        if (tmp_check) {
                            check_for_subdomains = true;
                            if (currentUrl.length === 4) currentUrl[3] = url;
                            else currentUrl.push(url);
                        }
                        //console.log(url + " : " + tmp_check);
                    });

                    if (opened_by === 1 || (opened_by === -1 && check_for_domain && (default_index === 1 || default_index === 2 && !check_for_page || default_index === 0 && !check_for_global))) {
                        //by domain
                        setTab(1, currentUrl[1]);
                    } else if (opened_by === 2 || (opened_by === -1 && check_for_page && (default_index === 2 || default_index === 1 && !check_for_domain || default_index === 0 && !check_for_global))) {
                        //by page
                        setTab(2, currentUrl[2]);
                    } else if (opened_by === -1 && check_for_subdomains) {
                        //by subdomain
                        setTab(3, currentUrl[3]);
                    } else if (opened_by === 0 || (opened_by === -1 && check_for_global && (default_index === 0 || default_index === 1 && !check_for_domain || default_index === 2 && !check_for_page))) {
                        //by global
                        setTab(0, currentUrl[0]);
                    } else {
                        //using default
                        if (opened_by !== -1) {
                            default_index = opened_by;
                        }
                        setTab(default_index, currentUrl[default_index]);
                    }
                } else {
                    //using default
                    if (opened_by !== -1) {
                        default_index = opened_by;
                    }
                    setTab(default_index, currentUrl[default_index]);
                }

                //console.log(JSON.stringify(websites_json));
            });
        } else {
            //console.log("unsupported");
        }
    });

    document.getElementById("domain-button").onclick = function () {
        setTab(1, currentUrl[1]);
    }
    document.getElementById("page-button").onclick = function () {
        setTab(2, currentUrl[2]);
    }
    document.getElementById("global-button").onclick = function () {
        setTab(0, currentUrl[0]);
    }
    document.getElementById("tab-other-button").onclick = function () {
        //setTab(3, "");
        showTabSubDomains();
    }

    document.getElementById("panel-other-tabs").onmouseleave = function () {
        hideTabSubDomains();
    }

    notes.oninput = function () {
        saveNotes();
    }
    title_notes.oninput = function () {
        saveNotes(title = true);
    }
    title_notes.onkeypress = function (e) {
        if (e.key === "Enter") {
            document.getElementById("notes").focus();
        }
    }
    notes.onpaste = function (e) {
        if (((e.originalEvent || e).clipboardData).getData("text/html") !== "") {
            e.preventDefault(); // Prevent the default paste action
            let clipboardData = (e.originalEvent || e).clipboardData;
            let pastedText = clipboardData.getData("text/html");
            let sanitizedHTML = sanitizeHTML(pastedText)
            document.execCommand("insertHTML", false, sanitizedHTML);
        }
        addAction();
    }
    notes.onkeydown = function (e) {
        if (actions.length === 0) {
            //first action on notes add the "initial state" of it
            actions.push({text: sanitizeHTML(notes.innerHTML), position: 0});
        }

        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
            redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
            redo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
            undo();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
            bold();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
            italic();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
            underline();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            strikethrough();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
            insertLink();
        }
    }
    notes.onkeyup = function (e) {
        if (e.key !== "Meta" && e.key !== "Alt" && e.key !== "Control" && e.key !== "Shift" && e.key !== "Tab") {
            addAction();
            //console.log("Add action")
        }
    }
    notes.onclick = function (e) {
        hideTabSubDomains();
        document.getElementById("notes").contentEditable = true;
        addAction();
    }
    notes.onfocus = function (e) {
        notesGotFocus();
    }
    notes.onblur = function (e) {
        notesLostFocus();
    }

    document.getElementById("all-notes-button-grid").onclick = function () {
        chrome.tabs.create({url: "./all-notes/index.html"});
        window.close();//
    }

    if (settings_json["show-title-textbox"]) {
        if (title_notes.classList.contains("hidden")) title_notes.classList.remove("hidden");
        notes.classList.add("no-border-radius-top");
    } else {
        title_notes.classList.add("hidden");
        if (notes.classList.contains("no-border-radius-top")) notes.classList.remove("no-border-radius-top");
    }


    let tagSelect = document.getElementById("tag-select-grid");
    tagSelect.innerText = "";
    let colourList = colourListDefault;
    colourList = Object.assign({}, {"none": all_strings["none-colour"]}, colourList);
    for (let colour in colourList) {
        let tagColour = document.createElement("option");
        tagColour.value = colour;
        tagColour.textContent = colourList[colour];
        //tagColour.classList.add(colour + "-background-tag");
        tagSelect.append(tagColour);
    }
    tagSelect.onchange = function () {
        changeTagColour(currentUrl[selected_tab], tagSelect.value);
    }

    document.getElementById("open-sticky-button").onclick = function (event) {
        //closed -> open it
        const permissionsToRequest = {
            origins: ["<all_urls>"],
            permissions: ["scripting"]
        }
        try {
            chrome.permissions.request(permissionsToRequest).then(response => {
                if (response) {
                    //granted / obtained
                    openStickyNotes();
                    //console.log("Granted");
                } else {
                    //rejected
                    //console.log("Rejected!");
                }
            }).then(() => {
                //window.close();
            });
        } catch (e) {
            console.error("P2)) " + e);
        }
    }

    loadFormatButtons(false, false);
    setTimeout(function () {
        document.getElementById("notes").blur();
        document.getElementById("notes").focus();
    }, 200);
}

function changeTagColour(url, colour) {
    sync_local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        }
        if (websites_json[url] !== undefined) {
            //console.log(`url ${url}`);
            websites_json[url]["tag-colour"] = colour;
            websites_json_to_show = websites_json;
            //console.log("QAZ-8")
            sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
                loadUI();
            });
        }
        saveNotes();
    });
}

function notesGotFocus() {
    hideTabSubDomains();
}

function notesLostFocus() {
    //
}

function showTabSubDomains() {
    document.getElementById("notes").contentEditable = false;
    let panel = document.getElementById("panel-other-tabs");
    let arrowDown = document.getElementById("arrow-down");
    if (panel.classList.contains("hidden")) {
        panel.classList.remove("hidden");
        document.getElementById("notes").contentEditable = false;
    } else {
        panel.classList.add("hidden");
        document.getElementById("notes").contentEditable = true;
        document.getElementById("notes").focus();
    }
    document.getElementById("tab-other-button").classList.add("not-sel");

    if (selected_tab === 3) {
        document.getElementById("subdomains-list").childNodes.forEach(node => {
            let class_text = "";
            for (let i = 0; i < node.attributes.length; i++) {
                if (node.attributes[i].name.toString().toLowerCase() === "class") {
                    class_text = node.attributes[i].nodeValue;
                }
                if (currentUrl.length === 4 && currentUrl[3].replace(currentUrl[1], "") === node.textContent) {
                    if (!class_text.includes(" subdomain-sel")) class_text = class_text + " subdomain-sel";
                } else {
                    if (class_text.includes(" subdomain-sel")) class_text = class_text.replace(" subdomain-sel", "");
                }
            }
            node.setAttribute("class", class_text);
        });
    }
    //get focus on the first element of the list
    document.querySelector("#subdomains-list > *")?.focus();
}

function hideTabSubDomains() {
    document.getElementById("notes").contentEditable = true;
    document.getElementById("notes").focus();
    document.getElementById("panel-other-tabs").classList.add("hidden");
    if (document.getElementById("tab-other-button").classList.contains("not-sel")) {
        document.getElementById("tab-other-button").classList.remove("not-sel");
    }
    document.getElementById("subdomains-list").childNodes.forEach(node => {
        let class_text = "subdomain";
        node.setAttribute("class", class_text);
    })
}

function appendSubDomains(subdomains) {
    let list = document.getElementById("subdomains-list");
    list.innerHTML = "";
    showTabSubDomains();
    let tabIndex = 0;
    subdomains.forEach(domain => {
        let newSubDomain = document.createElement("button");
        newSubDomain.classList.add("subdomain");
        newSubDomain.innerText = domain;
        newSubDomain.tabIndex = tabIndex;
        let url = currentUrl[1] + domain;
        newSubDomain.onclick = function () {
            if (currentUrl.length === 3) currentUrl.push(url)
            else if (currentUrl.length === 4) currentUrl[3] = url;

            setTab(3, url);
        }
        list.appendChild(newSubDomain);
    });
}

function addAction() {
    hideTabSubDomains();
    if (undoAction) {
        undoAction = false;
        for (let i = currentAction; i <= actions.length; i++) {
            actions.pop();
        }
    }
    actions.push({text: sanitizeHTML(notes.innerHTML), position: getPosition()});
    currentAction = actions.length - 1;

    //console.log(actions)
}

function loadSettings(load_only = false) {
    sync_local.get("settings", function (value) {
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
        if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = false;
        if (settings_json["theme"] === undefined) settings_json["theme"] = "light";
        if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = true;
        if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = true;
        if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = true;
        if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = true;
        if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
        if (settings_json["check-with-all-supported-protocols"] === undefined) settings_json["check-with-all-supported-protocols"] = false;
        if (settings_json["font-family"] === undefined || !supportedFontFamily.includes(settings_json["font-family"])) settings_json["font-family"] = "Shantell Sans";
        if (settings_json["datetime-format"] === undefined || !supportedDatetimeFormat.includes(settings_json["datetime-format"])) settings_json["datetime-format"] = "yyyymmdd1";
        if (settings_json["show-title-textbox"] === undefined) settings_json["show-title-textbox"] = false;
        if (settings_json["immersive-sticky-notes"] === undefined) settings_json["immersive-sticky-notes"] = true;

        if (settings_json["advanced-managing"] === "yes" || settings_json["advanced-managing"] === true) advanced_managing = true;
        else advanced_managing = false;

        if(!load_only) continueLoaded();
        //console.log(JSON.stringify(settings_json));
    });
}

function getPosition() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return -1;

    const range = sel.getRangeAt(0);
    const clonedRange = range.cloneRange();
    clonedRange.selectNodeContents(document.body);
    clonedRange.setEnd(range.startContainer, range.startOffset);

    const div = document.createElement('div');
    div.appendChild(clonedRange.cloneContents());

    // Calculate the absolute position
    let absolutePosition = 0;
    const container = div;

    while (container.firstChild) {
        if (container.firstChild === range.startContainer) {
            absolutePosition += range.startOffset;
            break;
        } else {
            const child = container.firstChild;
            absolutePosition += child.textContent.length;
            container.removeChild(child);
        }
    }

    return absolutePosition - 34;

}

function setPosition(element, position) {
    try {
        element.focus();
        //console.log(`Resetting position: ${position}`);

        // Create a new range within the element's content
        const range = document.createRange();
        const nodeStack = [element];
        let node, foundStart = false, stop = false;
        let charCount = 0;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                const text = node.textContent;
                if (charCount + text.length >= position) {
                    range.setStart(node, position - charCount);
                    range.setEnd(node, position - charCount);
                    stop = true;
                } else {
                    charCount += text.length;
                }
            } else {
                let i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        // Clear the current selection
        const selection = window.getSelection();
        selection.removeAllRanges();

        // Add the new range to the selection
        selection.addRange(range);
    } catch (e) {
        element.focus();
        console.error(`Exception SetPosition\n${e}`);
    }
}

function sanitizeHTML(input) {
    //console.log(input)

    let div_sanitize = document.createElement("div");
    div_sanitize.innerHTML = input;

    let sanitizedHTML = sanitize(div_sanitize, -1, -1);

    //console.log(sanitizedHTML.innerHTML)

    return sanitizedHTML.innerHTML;
}

function saveNotes(title_call = false) {
    sync_local.get(["websites", "settings"], function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        } else {
            websites_json = {};
        }

        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
        } else {
            loadSettings(load_only = true);
        }

        let url_to_use = getUrlWithSupportedProtocol(currentUrl[selected_tab], websites_json);
        //console.log(`url_to_use: ${url_to_use}`);

        if (websites_json[url_to_use] === undefined) websites_json[url_to_use] = {};
        let notes = document.getElementById("notes").innerHTML;
        let title = document.getElementById("title-notes").value;

        if (settings_json["save-page-content"]) {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                let activeTab = tabs[0];
                chrome.scripting.executeScript({
                    target: {tabId: activeTab.id},
                    function: function () {
                        return "document.body.innerText";
                    }
                }).then(result => {
                    if (result && result[0]) {
                        websites_json[url_to_use]["content"] = result[0];
                        // Save here because text extraction is asynchronous, and this function gets called AFTER the
                        // "sync_local" call which is further below in the code.
                        sync_local.set({"websites": websites_json, "last-update": getDate()});
                    }
                }).catch(error => {
                    console.error("Error extracting visible text: " + error);
                });
            });
        }

        websites_json[url_to_use]["notes"] = notes;
        if (settings_json["show-title-textbox"]) websites_json[url_to_use]["title"] = title;
        websites_json[url_to_use]["last-update"] = getDate();

        if (websites_json[url_to_use]["tag-colour"] === undefined) {
            let tabSelected = getCurrentTabNameTag(selected_tab);
            websites_json[url_to_use]["tag-colour"] = "none";
            if (settings_json["default-tag-colour-" + tabSelected] !== undefined) websites_json[url_to_use]["tag-colour"] = settings_json["default-tag-colour-" + tabSelected];
        }
        if (websites_json[url_to_use]["sticky"] === undefined) {
            websites_json[url_to_use]["sticky"] = false;
        }
        if (websites_json[url_to_use]["minimized"] === undefined) {
            websites_json[url_to_use]["minimized"] = false;
        }
        if (selected_tab === 0 || document.getElementById("tabs-section").classList.contains("hidden")) {
            websites_json[url_to_use]["type"] = 0;
            websites_json[url_to_use]["domain"] = "";
        } else if (selected_tab === 1) {
            websites_json[url_to_use]["type"] = 1;
            websites_json[url_to_use]["domain"] = "";
        } else {
            websites_json[url_to_use]["type"] = 2;
            websites_json[url_to_use]["domain"] = currentUrl[1];
        }
        let currentPosition = getPosition();
        if (notes === "" || notes === "<br>") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
            loadFormatButtons(true, false);
            //setPosition(document.getElementById("notes"), 1);
            document.getElementById("title-notes").disabled = true;
            let component = "notes";
            if (title_call) component = "title-notes";
            setTimeout(function () {
                document.getElementById(component).blur();
                document.getElementById("notes").focus();
            }, 100);
        } else {
            loadFormatButtons(true, true);
            document.getElementById("title-notes").disabled = false;
            let component = "notes";
            if (title_call) component = "title-notes";
            document.getElementById(component).blur();
            document.getElementById(component).focus();
        }
        if (currentUrl[1] !== "" && currentUrl[2] !== "") {
            //selected_tab : {0: global | 1:domain | 2:page}
            //console.log("QAZ-9")
            sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
                let never_saved = true;

                let notes = "";
                if (websites_json[url_to_use] !== undefined && websites_json[url_to_use]["notes"] !== undefined) {
                    //exists
                    notes = websites_json[url_to_use]["notes"];
                    never_saved = false;
                }
                //setPosition(document.getElementById("notes"), currentPosition);
                listenerLinks();

                let last_update = all_strings["never-update"];
                if (websites_json[url_to_use] !== undefined && websites_json[url_to_use]["last-update"] !== undefined) last_update = websites_json[url_to_use]["last-update"];
                document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(last_update));

                let colour = "none";
                document.getElementById("tag-colour-section").removeAttribute("class");
                if (websites_json[url_to_use] !== undefined && websites_json[url_to_use]["tag-colour"] !== undefined) colour = websites_json[url_to_use]["tag-colour"];
                document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);

                let title = "";
                if (websites_json[url_to_use] !== undefined && websites_json[url_to_use]["title"] !== undefined) title = websites_json[url_to_use]["title"];
                document.getElementById("title-notes").value = title;

                /*
                let sticky = false;
                if (websites_json[currentUrl[selected_tab]] !== undefined && websites_json[currentUrl[selected_tab]]["sticky"] !== undefined) {
                    sticky = websites_json[currentUrl[selected_tab]]["sticky"];
                }
                */

                checkNeverSaved(never_saved)

                //console.log(JSON.stringify(websites_json));

                //send message to "background.js" to update the icon
                sendMessageUpdateToBackground();
            });
        }
        listenerLinks();
    });
}

function getCurrentTabNameTag(tab) {
    if (tab === 0) return "global";
    else if (tab === 1) return "domain";
    else if (tab === 2) return "page";
    else if (tab === 3) return "subdomain";
}

function checkNeverSaved(never_saved) {
    if (stickyNotesSupported) {
        if (never_saved) {
            document.getElementById("open-sticky-button").classList.add("hidden");
            document.getElementById("tag-select-grid").classList.add("hidden");
            document.getElementById("all-notes-section").style.gridTemplateAreas = "'all-notes'";
            if (document.getElementById("format-buttons").childNodes.length === 0) {
                document.getElementById("format-buttons").classList.add("hidden");
                if (document.getElementById("last-updated-section").classList.contains("padding-top-10")) document.getElementById("last-updated-section").classList.remove("padding-top-10");
            }
        } else {
            if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
            if (document.getElementById("tag-select-grid").classList.contains("hidden")) document.getElementById("tag-select-grid").classList.remove("hidden");
            document.getElementById("all-notes-section").style.gridTemplateAreas = "'tag all-notes all-notes all-notes all-notes'";
            if (document.getElementById("format-buttons").classList.contains("hidden")) {
                document.getElementById("format-buttons").classList.remove("hidden");
                if (!document.getElementById("last-updated-section").classList.contains("padding-top-10")) document.getElementById("last-updated-section").classList.add("padding-top-10");
            }
        }
    } else {
        document.getElementById("open-sticky-button").classList.add("hidden");
        document.getElementById("tag-select-grid").classList.add("hidden");
        document.getElementById("all-notes-section").style.gridTemplateAreas = "'all-notes'";
        document.getElementById("format-buttons").classList.add("hidden");
        if (document.getElementById("last-updated-section").classList.contains("padding-top-10")) document.getElementById("last-updated-section").classList.remove("padding-top-10");
    }
}

function sendMessageUpdateToBackground() {
    chrome.runtime.sendMessage({"updated": true});
}

function tabUpdated() {
    loaded();
}

function setUrl(url) {
    let otherPossibleUrls = getAllOtherPossibleUrls(url);
    if (otherPossibleUrls.length > 0) {
        appendSubDomains(otherPossibleUrls)
    }
    //if (isUrlSupported(url)) {
    currentUrl[0] = getGlobalUrl();
    currentUrl[1] = getDomainUrl(url);
    currentUrl[2] = getPageUrl(url);
    document.getElementById("global-button").style.width = "30%";
    document.getElementById("page-button").style.width = "30%";
    if (advanced_managing && otherPossibleUrls.length > 0) {
        document.getElementById("domain-button").style.width = "30%";
        document.getElementById("tab-other-button").style.width = "10%";
        //document.getElementById("page-button").style.borderRadius = "0px";
        document.getElementById("tab-other-button").style.display = "inline-block";
    } else {
        document.getElementById("domain-button").style.width = "40%";
        document.getElementById("tab-other-button").style.display = "none";
        //document.getElementById("page-button").style.borderBottomRightRadius = "5px";
        //document.getElementById("page-button").style.borderTopRightRadius = "5px";
    }
    if (document.getElementById("page-button").classList.contains("hidden")) document.getElementById("page-button").classList.remove("hidden");
    if (stickyNotesSupported && document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
    /*} else {
        currentUrl[0] = getGlobalUrl();
        currentUrl[1] = getDomainUrl(url);
        currentUrl[2] = getPageUrl(url);
        document.getElementById("global-button").style.width = "50%";
        document.getElementById("domain-button").style.width = "50%";
        document.getElementById("domain-button").style.borderRadius = "0px 5px 5px 0px";
        document.getElementById("page-button").classList.add("hidden");
        if (!document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.add("hidden");
    }*/

    //console.log(`Current url [global] ${currentUrl[0]} [domain] ${currentUrl[1]} - [page]  ${currentUrl[2]}`);
}

function checkAllSupportedProtocols(url, json) {
    //Supported: http, https, moz-extension
    if (url === getGlobalUrl()) return true;

    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === true;
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined || json["https://" + getUrlWithoutProtocol(url)] !== undefined || json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined || json["extension://" + getUrlWithoutProtocol(url)] !== undefined || json["chrome-extension://" + getUrlWithoutProtocol(url)] !== undefined || json["about://" + getUrlWithoutProtocol(url)] !== undefined)
            return true;
        else
            return false;
    } else {
        return json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)] !== undefined;
    }
}

function getUrlWithSupportedProtocol(url, json) {
    //Supported: http, https, moz-extension
    if (url === getGlobalUrl()) return url;

    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === true;
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined) return "http://" + getUrlWithoutProtocol(url);
        else if (json["https://" + getUrlWithoutProtocol(url)] !== undefined) return "https://" + getUrlWithoutProtocol(url);
        else if (json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined) return "moz-extension://" + getUrlWithoutProtocol(url);
        else if (json["extension://" + getUrlWithoutProtocol(url)] !== undefined) return "extension://" + getUrlWithoutProtocol(url);
        else if (json["chrome-extension://" + getUrlWithoutProtocol(url)] !== undefined) return "chrome-extension://" + getUrlWithoutProtocol(url);
        else if (json["about://" + getUrlWithoutProtocol(url)] !== undefined) return "about://" + getUrlWithoutProtocol(url);
        else return getTheProtocol(url) + "://" + getUrlWithoutProtocol(url);
    } else {
        return getTheProtocol(url) + "://" + getUrlWithoutProtocol(url);
    }
}

function getUrlWithoutProtocol(url) {
    if (url === getGlobalUrl()) return url;
    return url.split("://")[1];
}

function getGlobalUrl() {
    return "**global";
}

/**Returns the domain url without the protocol (https, http, ftp, ...)!*/
function getDomainUrl(url, with_protocol = true) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        let urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }
    if (this._domainUrl === undefined) {
        if (urlToReturn.includes("/")) {
            let urlPartsTemp = urlToReturn.split("/");
            if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
                urlToReturn = urlPartsTemp[2];
            }
        }
        this._domainUrl = urlToReturn;
    } else {
        urlToReturn = this._domainUrl;
    }
    if (with_protocol) return protocol + "://" + urlToReturn;
    else return urlToReturn;
}

/**Returns the page url without the protocol (https, http, ftp, ...)!*/
function getPageUrl(url, with_protocol = true) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        let urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }
    if (this._pageUrl === undefined) {
        if (urlToReturn.includes("/")) {
            let urlPartsTemp = urlToReturn.split("/");
            if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
                urlToReturn = urlPartsTemp[2];
                for (let i = 3; i < urlPartsTemp.length; i++) {
                    urlToReturn += "/" + urlPartsTemp[i];
                }
            }
        }

        //https://page.example/search#section1
        if (settings_json["consider-sections"] === "no" || settings_json["consider-parameters"] === false) {
            if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];
        }

        //https://page.example/search?parameters
        if (settings_json["consider-parameters"] === "no" || settings_json["consider-parameters"] === false) {
            if (url.includes("?")) {
                urlToReturn = urlToReturn.split("?")[0];
                if (urlToReturn.includes("#")) {
                    //if it includes sections, then check if consider-sections is "no"
                    //if it's "no", then remove the section
                    if (settings_json["consider-sections"] === "no" || settings_json["consider-sections"] === false) {
                        urlToReturn = urlToReturn.replace(urlToReturn.split("#")[0], "");
                    }
                }
            }
        }

        this._pageUrl = urlToReturn;
    } else {
        urlToReturn = this._pageUrl;
    }

    if (with_protocol) return protocol + "://" + urlToReturn;
    else return urlToReturn;
}

/**
 *
 * @param url
 * @returns {*[]} Returns urls without the domain ("/a/*", "/a/b/*", ...). To get the domain, use "getDomainUrl + this"
 */
function getAllOtherPossibleUrls(url) {
    let urlToReturn = "";
    if (url.includes(":")) {
        let urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    let urlsToReturn = [];
    if (this._allPossibleUrls === undefined) {
        if (urlToReturn.includes("/")) {
            //remove before the "?" and "#" if it exists

            let urlPartsTemp = [];

            urlPartsTemp = urlToReturn.split("/");
            if (urlToReturn.includes("?")) {
                urlPartsTemp = urlToReturn.split("?")[0].split("/");
            }
            if (urlToReturn.includes("#")) {
                urlPartsTemp = urlToReturn.split("#")[0].split("/");
            }

            const _getDomain = getDomainUrl(url);

            let urlConcat = "/";
            for (let urlFor = 3; urlFor < urlPartsTemp.length; urlFor++) {
                if (urlPartsTemp[urlFor] !== "") {
                    urlConcat += urlPartsTemp[urlFor];
                    if (urlConcat !== _getDomain) {
                        urlsToReturn.push(urlConcat + "/*");
                    }
                    urlConcat += "/";
                }
            }
        }

        //get also the all possible combinations of parameters
        //example: https://example.com/search?param1=1&param2=2&param3=3
        //it should add urls like: https://example.com/search?param1=1, https://example.com/search?param2=2, https://example.com/search?param3=3, https://example.com/search?param1=1&param2=2, https://example.com/search?param1=1&param3=3, https://example.com/search?param2=2&param3=3, https://example.com/search?param1=1&param2=2&param3=3

        if (urlToReturn.includes("/")) {
            if (settings_json["consider-parameters"] === "no" || settings_json["consider-parameters"] === false) {
                //console.log(urlToReturn);

                //split the url by "/" to get the domain and the pages
                let urlPartsTemp = urlToReturn.split("/");
                //remove the main domain (not the directories) and the empty parts
                let urlPartsTemp2 = [];
                for (let i = 0; i < urlPartsTemp.length; i++) {
                    if (urlPartsTemp[i] !== "") {
                        urlPartsTemp2.push(urlPartsTemp[i]);
                    }
                }
                //remove the first element of the array (the domain)
                urlPartsTemp2.shift();

                //join the url with "/" (and add the "/" at the beginning)
                let urlToReturnTemp = "/" + urlPartsTemp2.join("/");

                if (urlToReturn.includes("#")) {
                    urlToReturnTemp = urlToReturnTemp.split("#")[0];
                }

                //console.log("urlToReturn", urlToReturn)
                //console.log("urlToReturnTemp", urlToReturnTemp)

                if (urlToReturn.includes("?")) {
                    let urlPartsTemp = urlToReturnTemp.split("?");
                    urlToReturnTemp = urlPartsTemp[0];
                    let parameters = urlPartsTemp[1].split("&");
                    let parametersToReturn = [];
                    for (let i = 0; i < parameters.length; i++) {
                        let parameterParts = parameters[i].split("=");
                        if (parameterParts[1] !== "" && parameterParts[1] !== undefined) {
                            parametersToReturn.push(parameterParts[0] + "=" + parameterParts[1]);
                        }
                    }
                    if (parametersToReturn.length <= MAX_PARAMETERS) {
                        for (let i = 1; i <= parametersToReturn.length; i++) {
                            let combinations = getCombinations(parametersToReturn, i);
                            if (combinations.length <= MAX_COMBINATIONS) {
                                for (let j = 0; j < combinations.length; j++) {
                                    let urlToPush = urlToReturnTemp + "?" + combinations[j].join("&");
                                    if (urlToPush !== getDomainUrl(url)) {
                                        urlsToReturn.push(urlToPush);
                                    }
                                }
                            } else {
                                console.error("Too many combinations to process. Limit is " + MAX_COMBINATIONS);
                            }
                        }
                    } else {
                        console.error("Too many parameters to process. Limit is " + MAX_PARAMETERS);
                        //Use single parameters
                        for (let i = 0; i < parametersToReturn.length; i++) {
                            let urlToPush = urlToReturnTemp + "?" + parametersToReturn[i];
                            if (urlToPush !== getDomainUrl(url)) {
                                urlsToReturn.push(urlToPush);
                            }
                        }
                    }
                }
            }
        }
        this._allPossibleUrls = urlsToReturn;
    } else {
        urlsToReturn = this._allPossibleUrls;
    }

    return urlsToReturn;
}

/**
 * Generates all combinations of the elements in the array, taken n at a time.
 * @param {Array} array - The array of elements.
 * @param {number} n - The number of elements in each combination.
 * @returns {Array} - An array of combinations, each combination is an array.
 */
function getCombinations(array, n) {
    let result = [];
    let f = function (prefix, array) {
        for (let i = 0; i < array.length; i++) {
            let newPrefix = prefix.concat(array[i]);
            if (newPrefix.length === n) {
                result.push(newPrefix);
            } else {
                f(newPrefix, array.slice(i + 1));
            }
        }
    };
    f([], array);
    return result;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

/**
 * If the passed URL is a "supported url"
 * @param url Url you want to check
 * @returns {boolean} return true: the link is supported, false: the link is not supported
 */
function isUrlSupported(url) {
    let valueToReturn = false;
    switch (getTheProtocol(url)) {
        case "http":
        case "https":
        case "moz-extension":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disables all unsupported website
            valueToReturn = false;//TODO!TESTING | true->for testing, false->stable release
    }
    stickyNotesSupported = valueToReturn;
    //additional checks for sticky
    //console.log(url)
    if (urls_unsupported_by_sticky_notes.includes(getDomainUrl(url).replace(getTheProtocol(url), "").replace("://", ""))) {
        stickyNotesSupported = false;
    }
    return valueToReturn;
}

function setTab(index, url) {
    loadFormatButtons(false, false);
    hideTabSubDomains();
    selected_tab = index;
    document.getElementById("domain-button").classList.remove("tab-sel");
    document.getElementById("page-button").classList.remove("tab-sel");
    document.getElementById("global-button").classList.remove("tab-sel");
    document.getElementById("tab-other-button").classList.remove("tab-sel");

    document.getElementsByClassName("tab")[index].classList.add("tab-sel");

    //console.log("url", url)
    //console.log("getPage(url)", getPageUrl(url));

    let never_saved = true;
    let notes = "";
    let title = "";
    if (checkAllSupportedProtocols(url, websites_json) && websites_json[getUrlWithSupportedProtocol(url, websites_json)] !== undefined && websites_json[getUrlWithSupportedProtocol(url, websites_json)]["notes"] !== undefined) {
        //notes saved (also it's empty)
        notes = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["notes"];
        title = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["title"];
        listenerLinks();
        never_saved = false;
    }
    if (title === undefined) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            let activeTab = tabs[0];
            title = activeTab.title;
            document.getElementById("title-notes").value = title;
        });
    }
    document.getElementById("notes").innerHTML = notes;
    document.getElementById("title-notes").value = title;

    if (notes === "<br>" || notes === "") {
        document.getElementById("title-notes").disabled = true;
    } else {
        document.getElementById("title-notes").disabled = false;
    }

    listenerLinks();
    if (notes !== "<br>" && notes !== "") {
        loadFormatButtons(true, true);
    }

    let last_update = all_strings["never-update"];
    if (checkAllSupportedProtocols(url, websites_json) && websites_json[getUrlWithSupportedProtocol(url, websites_json)] !== undefined && websites_json[getUrlWithSupportedProtocol(url, websites_json)]["last-update"] !== undefined) last_update = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["last-update"];
    document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(last_update));

    let colour = "none";
    document.getElementById("tag-colour-section").removeAttribute("class");
    if (checkAllSupportedProtocols(url, websites_json) && websites_json[getUrlWithSupportedProtocol(url, websites_json)] !== undefined && websites_json[getUrlWithSupportedProtocol(url, websites_json)]["tag-colour"] !== undefined) colour = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["tag-colour"];
    document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);
    if (websites_json[currentUrl[selected_tab]] !== undefined) document.getElementById("tag-select-grid").value = websites_json[currentUrl[selected_tab]]["tag-colour"];

    let sticky = false;
    if (checkAllSupportedProtocols(url, websites_json) && websites_json[getUrlWithSupportedProtocol(url, websites_json)] !== undefined && websites_json[getUrlWithSupportedProtocol(url, websites_json)]["sticky"] !== undefined) sticky = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["sticky"];
    let minimized = false;
    if (checkAllSupportedProtocols(url, websites_json) && websites_json[getUrlWithSupportedProtocol(url, websites_json)] !== undefined && websites_json[getUrlWithSupportedProtocol(url, websites_json)]["minimized"] !== undefined) minimized = websites_json[getUrlWithSupportedProtocol(url, websites_json)]["minimized"];

    document.getElementById("notes").focus();

    checkNeverSaved(never_saved);
}

function openStickyNotes() {
    //console.log("Opening...")
    if (stickyNotesSupported) {
        //console.log("Opening... <1>")
        sync_local.get("websites", function (value) {
            //console.log("Opening... <2>")
            if (value["websites"] !== undefined) {
                //console.log("Opening... <3>")
                websites_json = value["websites"];

                if (websites_json[currentUrl[selected_tab]] !== undefined) {
                    //console.log("Opening... <4>")
                    websites_json[currentUrl[selected_tab]]["sticky"] = true;
                    websites_json[currentUrl[selected_tab]]["minimized"] = false;

                    //console.log("QAZ-10")
                    sync_local.set({"websites": websites_json, "last-update": getDate()}).then(result => {
                        //console.log("Opening... <5>")
                        chrome.runtime.sendMessage({
                            "open-sticky": {
                                open: true, type: selected_tab
                            }
                        }).then(() => {
                            window.close();//TODO:chrome
                        });
                    });
                }
            }
        });
    }
}

function bold() {
    //console.log("Bold B")
    document.execCommand("bold", false);
    addAction();
}

function italic() {
    //console.log("Italic I")
    document.execCommand("italic", false);
    addAction();
}

function underline() {
    //console.log("Underline U")
    document.execCommand("underline", false);
    addAction();
}

function strikethrough() {
    //console.log("Strikethrough S")
    document.execCommand("strikethrough", false);
    addAction();
}

function subscript() {
    //console.log("Subscript")
    document.execCommand("subscript", false);
    addAction();
}

function superscript() {
    //console.log("Superscript")
    document.execCommand("superscript", false);
    addAction();
}

/*var highlighterBackgroundColor = "rgb(255, 255, 0, 0.5)";

function highlighter() {
    //console.log("Highlighter")

    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
    let isHighlighter = hasAncestorHighlighter(window.getSelection().anchorNode);

    if (isHighlighter) {
        let elements = getTheAncestorHighlighter(window.getSelection().anchorNode);
        let anchorElement = elements[0];
        let parentAnchor = elements[1];

        if (anchorElement && parentAnchor) {
            // Move children of the anchor element to its parent
            while (anchorElement.firstChild) {
                parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
            }
            // Remove the anchor element itself
            parentAnchor.removeChild(anchorElement);
        }
        saveNotes();
        document.execCommand('backColor', false, 'transparent');
    } else {
        document.execCommand('backColor', false, highlighterBackgroundColor);
    }

    addAction();
}

function hasAncestorHighlighter(element) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === "span" && element.style.backgroundColor === highlighterBackgroundColor) {
            return true; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return false; // Reached the top of the DOM tree without finding an anchor element
}

function getTheAncestorHighlighter(element) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === "span" && element.style.backgroundColor === highlighterBackgroundColor) {
            return [element, element.parentNode]; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return [false, false]; // Reached the top of the DOM tree without finding an anchor element
}
*/

function insertHeader(header_size = "h1") {
    insertHTMLFromTagName(header_size);
    addAction();
}

function small() {
    insertHTMLFromTagName("small");
    addAction();
}

function big() {
    insertHTMLFromTagName("big");
    addAction();
}

function insertHTMLFromTagName(tagName) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    let isTagName = hasAncestorTagName(window.getSelection().anchorNode, tagName);

    if (isTagName) {
        let elements = getTheAncestorTagName(window.getSelection().anchorNode, tagName);
        let anchorElement = elements[0];
        let parentAnchor = elements[1];

        if (anchorElement && parentAnchor) {
            // Move children of the anchor element to its parent
            while (anchorElement.firstChild) {
                parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
            }
            // Remove the anchor element itself
            parentAnchor.removeChild(anchorElement);
        }
        saveNotes();
    } else {
        let html = '<' + tagName + '>' + selectedText + '</' + tagName + '>';
        document.execCommand('insertHTML', false, html);
    }
}

function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
    let isLink = hasAncestorTagName(window.getSelection().anchorNode, 'a');

    // If it's already a link, remove the link; otherwise, add the link
    if (isLink) {
        // Remove the link
        let elements = getTheAncestorTagName(window.getSelection().anchorNode, 'a');
        let anchorElement = elements[0];
        let parentAnchor = elements[1];

        if (anchorElement && parentAnchor) {
            // Move children of the anchor element to its parent
            while (anchorElement.firstChild) {
                parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
            }
            // Remove the anchor element itself
            parentAnchor.removeChild(anchorElement);
        }
        saveNotes();
    } else {
        /*let url = prompt("Enter the URL:");
        if (url) {
            document.execCommand('createLink', false, url);
        }*/
        document.execCommand('createLink', false, selectedText);
    }
    addAction();
    //}
}

/*function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    if (selectedText !== "") {
        // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
        let isLink = hasAncestorTagName(window.getSelection().anchorNode, 'a');

        // If it's already a link, remove the link; otherwise, add the link
        if (isLink) {
            // Remove the link
            let elements = getTheAncestorTagName(window.getSelection().anchorNode, 'a');
            let anchorElement = elements[0];
            let parentAnchor = elements[1];

            if (anchorElement && parentAnchor) {
                // Move children of the anchor element to its parent
                while (anchorElement.firstChild) {
                    parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
                }
                // Remove the anchor element itself
                parentAnchor.removeChild(anchorElement);
            }
            saveNotes();
        } else {
            //let url = prompt("Enter the URL:");
            //if (url) {
            //    document.execCommand('createLink', false, url);
            //}
            let section = document.getElementById("link-section");
            let background = document.getElementById("background-opacity");
            let linkUrl = "";
            if (isValidURL(selectedText)) linkUrl = selectedText;

            section.style.display = "block";
            background.style.display = "block";

            let linkText = document.getElementById("link-text");
            linkText.innerHTML = all_strings["insert-link-text"];
            let linkInput = document.getElementById("link-url-text");
            linkInput.value = linkUrl;
            linkInput.placeholder = all_strings["insert-link-placeholder"];
            let linkButton = document.getElementById("link-button");
            linkButton.value = all_strings["insert-link-button"];
            linkButton.onclick = function () {
                section.style.display = "none";
                background.style.display = "none";
                document.execCommand('createLink', false, linkInput.value);
            }
            let linkButtonClose = document.getElementById("link-cancel-button");
            linkButtonClose.value = all_strings["cancel-link-button"];
            linkButtonClose.onclick = function () {
                section.style.display = "none";
                background.style.display = "none";
            }

            setTimeout(() => {
                linkInput.focus()
            }, 100);
        }
        addAction();
    }
    //}
}*/

function hasAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return true; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return false; // Reached the top of the DOM tree without finding an anchor element
}

function getTheAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return [element, element.parentNode]; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return [false, false]; // Reached the top of the DOM tree without finding an anchor element
}

function isValidURL(url) {
    var urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return urlPattern.test(url);
}

function undo() {
    hideTabSubDomains();
    if (actions.length > 0 && currentAction > 0) {
        undoAction = true;
        document.getElementById("notes").innerHTML = actions[--currentAction].text;
        saveNotes();
        setPosition(document.getElementById("notes"), actions[currentAction].position);
    }
    document.getElementById("notes").focus();
}

function redo() {
    hideTabSubDomains();
    if (currentAction < actions.length - 1) {
        undoAction = false;
        document.getElementById("notes").innerHTML = actions[++currentAction].text;
        saveNotes();
        setPosition(document.getElementById("notes"), actions[currentAction].position);
    }
    document.getElementById("notes").focus();
}

function spellcheck(force = false, value = false) {
    hideTabSubDomains();
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = true;
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = true;

            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = true;
            if (settings_json["advanced-managing"] === "yes" || settings_json["advanced-managing"] === true) advanced_managing = true;
            else advanced_managing = false;

            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = true;
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = false;
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = false;
        }

        if (!document.getElementById("notes").spellcheck || (force && value)) {
            //enable spellCheck
            document.getElementById("notes").spellcheck = true;
            settings_json["spellcheck-detection"] = true;
            if (document.getElementById("text-spellcheck")) {
                document.getElementById("text-spellcheck").classList.add("text-spellcheck-sel");
            }
        } else {
            //disable spellCheck
            document.getElementById("notes").spellcheck = false;
            settings_json["spellcheck-detection"] = false;
            if (document.getElementById("text-spellcheck") && document.getElementById("text-spellcheck").classList.contains("text-spellcheck-sel")) {
                document.getElementById("text-spellcheck").classList.remove("text-spellcheck-sel")
            }
        }
        document.getElementById("notes").focus();
        //console.log("QAZ-11")
        sync_local.set({"settings": settings_json, "last-update": getDate()}).then(() => {
            sendMessageUpdateToBackground();
        });
    });
}

function loadFormatButtons(navigation = true, format = true) {
    let url = "/img/commands/";

    let html_text_formatting = true;
    if (settings_json["html-text-formatting"] !== undefined) {
        if (settings_json["html-text-formatting"] === "yes" || settings_json["html-text-formatting"] === true) html_text_formatting = true;
        else html_text_formatting = false;
    }

    let is_undo_redo = true;
    if (settings_json["undo-redo"] !== undefined) {
        if (settings_json["undo-redo"] === "yes" || settings_json["undo-redo"] === true) is_undo_redo = true;
        else is_undo_redo = false;
    }
    let is_bold_italic_underline_strikethrough = true;
    if (settings_json["bold-italic-underline-strikethrough"] !== undefined) {
        if (settings_json["bold-italic-underline-strikethrough"] === "yes" || settings_json["bold-italic-underline-strikethrough"] === true) is_bold_italic_underline_strikethrough = true;
        else is_bold_italic_underline_strikethrough = false;
    }
    let is_link = true;
    if (settings_json["link"] !== undefined) {
        if (settings_json["link"] === "yes" || settings_json["link"] === true) is_link = true;
        else is_link = false;
    }
    let is_spellcheck = true;
    if (settings_json["spellcheck"] !== undefined) {
        if (settings_json["spellcheck"] === "yes" || settings_json["spellcheck"] === true) is_spellcheck = true;
        else is_spellcheck = false;
    }
    let is_subscript_superscript = false;
    if (settings_json["superscript-subscript"] !== undefined) {
        if (settings_json["superscript-subscript"] === "yes" || settings_json["superscript-subscript"] === true) is_subscript_superscript = true;
        else is_subscript_superscript = false;
    }
    let is_headers = false;
    if (settings_json["headers"] !== undefined) {
        if (settings_json["headers"] === "yes" || settings_json["headers"] === true) is_headers = true;
        else is_headers = false;
    }
    let is_small_big = false;
    if (settings_json["small-big"] !== undefined) {
        if (settings_json["small-big"] === "yes" || settings_json["small-big"] === true) is_small_big = true;
        else is_small_big = false;
    }

    let commands = [];
    if (navigation && html_text_formatting) {
        if (is_undo_redo) {
            commands.push(
                {
                    action: "undo",
                    icon: `${url}undo.svg`,
                    title: all_strings["label-title-undo"],
                    function: function () {
                        undo()
                    }
                },
                {
                    action: "redo",
                    icon: `${url}redo.svg`,
                    title: all_strings["label-title-redo"],
                    function: function () {
                        redo()
                    }
                });
        }
    } else {
        actions = [];
        currentAction = 0;
    }
    if (format && html_text_formatting) {
        if (is_bold_italic_underline_strikethrough) {
            commands.push(
                {
                    action: "bold",
                    icon: `${url}bold.svg`,
                    title: all_strings["label-title-bold"],
                    function: function () {
                        bold();
                    }
                },
                {
                    action: "italic",
                    icon: `${url}italic.svg`,
                    title: all_strings["label-title-italic"],
                    function: function () {
                        italic();
                    }
                },
                {
                    action: "underline",
                    icon: `${url}underline.svg`,
                    title: all_strings["label-title-underline"],
                    function: function () {
                        underline();
                    }
                },
                {
                    action: "strikethrough",
                    icon: `${url}strikethrough.svg`,
                    title: all_strings["label-title-strikethrough"],
                    function: function () {
                        strikethrough();
                    }
                }
            );
        }

        if (is_link) {
            commands.push(
                {
                    action: "link",
                    icon: `${url}link.svg`,
                    title: all_strings["label-title-link"],
                    function: function () {
                        insertLink();
                    }
                }
            );
        }

        if (is_spellcheck) {
            commands.push(
                {
                    action: "spellcheck",
                    icon: `${url}spellcheck.svg`,
                    title: all_strings["label-title-spellcheck"],
                    function: function () {
                        spellcheck();
                    }
                }
            );
        }

        if (is_subscript_superscript) {
            commands.push(
                {
                    action: "subscript",
                    icon: `${url}subscript.svg`,
                    title: all_strings["label-title-subscript"],
                    function: function () {
                        subscript();
                    }
                },
                {
                    action: "superscript",
                    icon: `${url}superscript.svg`,
                    title: all_strings["label-title-superscript"],
                    function: function () {
                        superscript();
                    }
                }
            );
        }

        if (is_headers) {
            commands.push(
                {
                    action: "h1",
                    icon: `${url}h1.svg`,
                    title: all_strings["label-title-header-h1"],
                    function: function () {
                        insertHeader("h1");
                    }
                },
                {
                    action: "h2",
                    icon: `${url}h2.svg`,
                    title: all_strings["label-title-header-h2"],
                    function: function () {
                        insertHeader("h2");
                    }
                },
                {
                    action: "h3",
                    icon: `${url}h3.svg`,
                    title: all_strings["label-title-header-h3"],
                    function: function () {
                        insertHeader("h3");
                    }
                },
                {
                    action: "h4",
                    icon: `${url}h4.svg`,
                    title: all_strings["label-title-header-h4"],
                    function: function () {
                        insertHeader("h4");
                    }
                },
                {
                    action: "h5",
                    icon: `${url}h5.svg`,
                    title: all_strings["label-title-header-h5"],
                    function: function () {
                        insertHeader("h5");
                    }
                },
                {
                    action: "h6",
                    icon: `${url}h6.svg`,
                    title: all_strings["label-title-header-h6"],
                    function: function () {
                        insertHeader("h6");
                    }
                }
            );
        }

        if (is_small_big) {
            commands.push(
                {
                    action: "small",
                    icon: `${url}small.svg`,
                    title: all_strings["label-title-small"],
                    function: function () {
                        small();
                    }
                },
                {
                    action: "big",
                    icon: `${url}big.svg`,
                    title: all_strings["label-title-big"],
                    function: function () {
                        big();
                    }
                }
            )
        }
    }

    if (!format && !navigation || !html_text_formatting) {
        document.getElementById("format-buttons").style.display = "none";
        document.getElementById("open-sticky-button").classList.add("button-trigger-sticky-no-format-buttons");
    } else {
        if (document.getElementById("format-buttons").style.display === "none") document.getElementById("format-buttons").style.removeProperty("display");
        if (document.getElementById("open-sticky-button").classList.contains("button-trigger-sticky-no-format-buttons")) document.getElementById("open-sticky-button").classList.remove("button-trigger-sticky-no-format-buttons");
    }


    buttons_container = document.getElementById("format-buttons");
    buttons_container.innerHTML = "";
    let tabIndex = 1;
    commands.forEach(value => {
        let button = document.createElement("button");
        button.classList.add("button-format", "button");
        //button.style.backgroundImage = `url('${value.icon}')`;
        button.id = `text-${value.action}`;
        button.onclick = value.function;
        button.title = value.title;
        button.tabIndex = tabIndex;
        buttons_container.appendChild(button);
    })

    if (format) {
        if (settings_json !== undefined && settings_json["spellcheck-detection"] !== undefined && (settings_json["spellcheck-detection"] === "no" || settings_json["spellcheck-detection"] === false)) {
            document.getElementById("notes").spellcheck = false;
            if (document.getElementById("text-spellcheck") && document.getElementById("text-spellcheck").classList.contains("text-spellcheck-sel")) {
                document.getElementById("text-spellcheck").classList.remove("text-spellcheck-sel")
            }
        } else {
            document.getElementById("notes").spellcheck = true;
            if (document.getElementById("text-spellcheck")) {
                document.getElementById("text-spellcheck").classList.add("text-spellcheck-sel");
            }
        }
    }

    if (settings_json !== undefined && settings_json !== undefined && settings_json["disable-word-wrap"] !== undefined && (settings_json["disable-word-wrap"] === "yes" || settings_json["disable-word-wrap"] === true)) {
        document.getElementById("notes").style.whiteSpace = "none";
    } else {
        document.getElementById("notes").style.whiteSpace = "pre-wrap";
    }
    //document.getElementById("notes").focus();
}

/**
 * Show the login expired section
 */
function loginExpired() {
    let section = document.getElementById("login-expired-section");
    let background = document.getElementById("background-opacity");

    section.style.display = "block";
    background.style.display = "block";

    let loginExpiredTitle = document.getElementById("login-expired-title");
    loginExpiredTitle.textContent = all_strings["notefox-account-login-expired-title"];
    let loginExpiredText = document.getElementById("login-expired-text");
    loginExpiredText.innerHTML = all_strings["notefox-account-login-expired-text2"];
    let loginExpiredButton = document.getElementById("login-expired-button");
    loginExpiredButton.value = all_strings["notefox-account-button-settings-login"];
    loginExpiredButton.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
        window.open(links_aside_bar["settings"], "_blank");
        window.close();
    }
    let loginExpiredClose = document.getElementById("login-expired-cancel-button");
    loginExpiredClose.value = all_strings["notefox-account-login-later-button"];
    loginExpiredClose.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
    }
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        document.getElementById("popup-content").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("popup-content").style.color = primary;
        let sticky_svg = window.btoa(getIconSvgEncoded("sticky-open", on_primary));
        let bold_svg = window.btoa(getIconSvgEncoded("bold", on_primary));
        let italic_svg = window.btoa(getIconSvgEncoded("italic", on_primary));
        let underline_svg = window.btoa(getIconSvgEncoded("underline", on_primary));
        let strikethrough_svg = window.btoa(getIconSvgEncoded("strikethrough", on_primary));
        let spellcheck_svg = window.btoa(getIconSvgEncoded("spellcheck", on_primary));
        let spellcheck_sel_svg = window.btoa(getIconSvgEncoded("spellcheck_sel", on_primary));
        let link_svg = window.btoa(getIconSvgEncoded("link", on_primary));
        let undo_svg = window.btoa(getIconSvgEncoded("undo", on_primary));
        let redo_svg = window.btoa(getIconSvgEncoded("redo", on_primary));
        let superscript_svg = window.btoa(getIconSvgEncoded("superscript", on_primary));
        let subscript_svg = window.btoa(getIconSvgEncoded("subscript", on_primary));
        let h1_svg = window.btoa(getIconSvgEncoded("h1", on_primary));
        let h2_svg = window.btoa(getIconSvgEncoded("h2", on_primary));
        let h3_svg = window.btoa(getIconSvgEncoded("h3", on_primary));
        let h4_svg = window.btoa(getIconSvgEncoded("h4", on_primary));
        let h5_svg = window.btoa(getIconSvgEncoded("h5", on_primary));
        let h6_svg = window.btoa(getIconSvgEncoded("h6", on_primary));
        let small_svg = window.btoa(getIconSvgEncoded("small", on_primary));
        let big_svg = window.btoa(getIconSvgEncoded("big", on_primary));

        let tag_svg = window.btoa(getIconSvgEncoded("tag", on_primary));
        let arrow_select_svg = window.btoa(getIconSvgEncoded("arrow-select", on_primary));
        let arrow_right_svg = window.btoa(getIconSvgEncoded("arrow-right", on_primary));

        let tertiary = backgroundSection;
        let tertiaryTransparent = primary;
        let tertiaryTransparent2 = primary;
        let tertiaryTransparent3 = primary;
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
            tertiaryTransparent3 += "BB";
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
                    --tertiary-transparent-3: ${tertiaryTransparent3};
                    --background-color: ${background};
                    --background-section-color: ${backgroundSection};
                }
                #open-sticky-button {
                    background-image: url('data:image/svg+xml;base64,${sticky_svg}');
                    background-size: auto 80%;
                }
                
                #text-bold {
                    background-image: url('data:image/svg+xml;base64,${bold_svg}');
                    background-size: 60% auto;
                }
                
                #text-italic {
                    background-image: url('data:image/svg+xml;base64,${italic_svg}');
                    background-size: 60% auto;
                }
                
                #text-underline {
                    background-image: url('data:image/svg+xml;base64,${underline_svg}');
                    background-size: 60% auto;
                }
                
                #text-strikethrough {
                    background-image: url('data:image/svg+xml;base64,${strikethrough_svg}');
                    background-size: 60% auto;
                }
                
                #text-spellcheck {
                    background-image: url('data:image/svg+xml;base64,${spellcheck_svg}');
                    background-size: 60% auto;
                }
                .text-spellcheck-sel {
                    background-image: url('data:image/svg+xml;base64,${spellcheck_sel_svg}') !important;     
                    background-size: 60% auto;          
                }
                
                #text-superscript {
                    background-image: url('data:image/svg+xml;base64,${superscript_svg}');
                    background-size: 80% auto;
                }
                
                #text-subscript {
                    background-image: url('data:image/svg+xml;base64,${subscript_svg}');
                    background-size: 80% auto;
                }
                
                #text-h1 {
                    background-image: url('data:image/svg+xml;base64,${h1_svg}');
                    background-size: 90% auto;
                }
                
                #text-h2 {
                    background-image: url('data:image/svg+xml;base64,${h2_svg}');
                    background-size: 90% auto;
                }
                
                #text-h3 {
                    background-image: url('data:image/svg+xml;base64,${h3_svg}');
                    background-size: 90% auto;
                }
                
                #text-h4 {
                    background-image: url('data:image/svg+xml;base64,${h4_svg}');
                    background-size: 90% auto;
                }
                
                #text-h5 {
                    background-image: url('data:image/svg+xml;base64,${h5_svg}');
                    background-size: 90% auto;
                }
                
                #text-h6 {
                    background-image: url('data:image/svg+xml;base64,${h6_svg}');
                    background-size: 90% auto;
                }
                
                #text-small {
                    background-image: url('data:image/svg+xml;base64,${small_svg}');
                    background-size: 90% auto;
                }
                
                #text-big {
                    background-image: url('data:image/svg+xml;base64,${big_svg}');
                    background-size: 90% auto;
                }
                
                #text-link {
                    background-image: url('data:image/svg+xml;base64,${link_svg}');
                    background-size: 60% auto;
                }
                
                #text-undo {
                    background-image: url('data:image/svg+xml;base64,${undo_svg}');
                }
                
                #text-redo {
                    background-image: url('data:image/svg+xml;base64,${redo_svg}');
                }
                
                #tag-select-grid {
                    background-image: url('data:image/svg+xml;base64,${tag_svg}'), url('data:image/svg+xml;base64,${arrow_select_svg}');
                }
                
                #all-notes-button-grid {
                    background-image: url('data:image/svg+xml;base64,${arrow_right_svg}');
                }
            </style>`;
    }
}

loaded();