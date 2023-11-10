var websites_json = {};
var settings_json = {};

var advanced_managing = true;

var currentUrl = []; //[global, domain, page, other]

var selected_tab = 2; //{0: global | 1:domain | 2:page | 3:other}
var opened_by = -1;

//urls WITHOUT the protocol! e.g. addons.mozilla.org
var urls_unsupported_by_sticky_notes = ["addons.mozilla.org"];//TODO!MANUAL change this manually in case of new unsupported urls
var stickyNotesSupported = true;

const all_strings = strings[languageToUse];

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

const linkReview = ["https://addons.mozilla.org/firefox/addon/websites-notes/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

let sync_local = browser.storage.local;
checkSyncLocal();

function checkSyncLocal() {
    sync_local = browser.storage.local;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync; else if (result.storage === "sync") sync_local = browser.storage.sync; else {
            browser.storage.local.set({"storage": "local"});
            sync_local = browser.storage.local;
        }
        checkTheme();
    });
}

function loaded() {
    checkSyncLocal();
    loadSettings();
    checkTheme();
    checkTimesOpened();
}

function checkTimesOpened() {
    sync_local.get("times-opened").then(result => {
        let times = 0;
        if (result !== undefined && result["times-opened"] !== undefined) {
            times = result["times-opened"];
            let interval_to_check = [1000, 5000, 20000, 50000, 100000, 1000000, 5000000];
            if (times > 0 && interval_to_check.includes(times + 1)) {
                browser.tabs.create({url: "https://www.saveriomorelli.com/projects/notefox/opened-times/"});
                //window.close();
            }
        }
        times++;
        sync_local.set({"times-opened": times});
    });
}

function continueLoaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);
        loadUI();
    });

    browser.tabs.onActivated.addListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);

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
    browser.commands.onCommand.addListener((command) => {
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
}

function listenerLinks() {
    let notes = document.getElementById("notes");
    if (notes.innerHTML !== "" && notes.innerHTML !== "<br>") {
        let links = notes.querySelectorAll('a');
        links.forEach(link => {
            function onMouseOverDown(event, settings_json, link) {
                if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = "yes";
                if (settings_json["open-links-only-with-ctrl"] === "yes" && (event.ctrlKey || event.metaKey)) {
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
                if (settings_json["open-links-only-with-ctrl"] === "yes" && (event.ctrlKey || event.metaKey)) {
                    browser.tabs.create({url: link.href});
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
}

function loadUI() {
    //opened_by = {-1: default, 0: domain, 1: page}
    setLanguageUI();
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
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
                    } else if (opened_by === 0 || (opened_by === -1 && check_for_global && (default_index === 0 || default_index === 1 && !check_for_domain || default_index === 2 && !check_for_page))) {
                        //by global
                        setTab(0, currentUrl[0]);
                    } else if (opened_by === -1 && check_for_subdomains) {
                        //by subdomain
                        setTab(3, currentUrl[3]);
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

    let notes = document.getElementById("notes");
    notes.oninput = function () {
        saveNotes();
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
            let selectedText = "";
            if (window.getSelection) {
                selectedText = window.getSelection().toString();
            } else if (document.selection && document.selection.type !== 'Control') {
                // For older versions of Internet Explorer
                selectedText = document.selection.createRange().text;
            }
            insertLink(selectedText);
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
        browser.tabs.create({url: "./all-notes/index.html"});
        window.close();
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
            origins: ["<all_urls>"]
        }
        try {
            browser.permissions.request(permissionsToRequest).then(response => {
                if (response) {
                    //granted / obtained
                    openStickyNotes();
                    //console.log("Granted");
                } else {
                    //rejected
                    //console.log("Rejected!");
                }
                window.close();
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
            sync_local.set({"websites": websites_json}, function () {
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
}

function hideTabSubDomains() {
    document.getElementById("notes").contentEditable = true;
    document.getElementById("notes").focus();
    document.getElementById("panel-other-tabs").classList.add("hidden");
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

function loadSettings() {
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";

            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = "yes";
            if (settings_json["advanced-managing"] === "yes") advanced_managing = true;
            else advanced_managing = false;

            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = "yes";
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = "no";
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = "yes";

            if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = "yes";
        }

        continueLoaded();
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

function saveNotes() {
    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        } else {
            websites_json = {};
        }
        if (websites_json[currentUrl[selected_tab]] === undefined) websites_json[currentUrl[selected_tab]] = {};
        let notes = document.getElementById("notes").innerHTML;
        websites_json[currentUrl[selected_tab]]["notes"] = notes;
        websites_json[currentUrl[selected_tab]]["last-update"] = getDate();
        if (websites_json[currentUrl[selected_tab]]["tag-colour"] === undefined) {
            websites_json[currentUrl[selected_tab]]["tag-colour"] = "none";
        }
        if (websites_json[currentUrl[selected_tab]]["sticky"] === undefined) {
            websites_json[currentUrl[selected_tab]]["sticky"] = false;
        }
        if (websites_json[currentUrl[selected_tab]]["minimized"] === undefined) {
            websites_json[currentUrl[selected_tab]]["minimized"] = false;
        }
        if (selected_tab === 0 || document.getElementById("tabs-section").classList.contains("hidden")) {
            websites_json[currentUrl[selected_tab]]["type"] = 0;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else if (selected_tab === 1) {
            websites_json[currentUrl[selected_tab]]["type"] = 1;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else {
            websites_json[currentUrl[selected_tab]]["type"] = 2;
            websites_json[currentUrl[selected_tab]]["domain"] = currentUrl[1];
        }
        let currentPosition = getPosition();
        if (notes === "" || notes === "<br>") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
            loadFormatButtons(true, false);
            //setPosition(document.getElementById("notes"), 1);
            setTimeout(function () {
                document.getElementById("notes").blur();
                document.getElementById("notes").focus();
            }, 100);
        } else {
            loadFormatButtons(true, true);
        }
        if (currentUrl[1] !== "" && currentUrl[2] !== "") {
            //selected_tab : {0: global | 1:domain | 2:page}
            sync_local.set({"websites": websites_json}, function () {
                let never_saved = true;

                let notes = "";
                if (websites_json[currentUrl[selected_tab]] !== undefined && websites_json[currentUrl[selected_tab]]["notes"] !== undefined) {
                    //exists
                    notes = websites_json[currentUrl[selected_tab]]["notes"];
                    never_saved = false;
                }
                //setPosition(document.getElementById("notes"), currentPosition);
                listenerLinks();

                let last_update = all_strings["never-update"];
                if (websites_json[currentUrl[selected_tab]] !== undefined && websites_json[currentUrl[selected_tab]]["last-update"] !== undefined) last_update = websites_json[currentUrl[selected_tab]]["last-update"];
                document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", last_update);

                let colour = "none";
                document.getElementById("tag-colour-section").removeAttribute("class");
                if (websites_json[currentUrl[selected_tab]] !== undefined && websites_json[currentUrl[selected_tab]]["tag-colour"] !== undefined) colour = websites_json[currentUrl[selected_tab]]["tag-colour"];
                document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);

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

function checkNeverSaved(never_saved) {
    if (stickyNotesSupported) {
        if (never_saved) {
            document.getElementById("open-sticky-button").classList.add("hidden");
            document.getElementById("tag-select-grid").classList.add("hidden");
            document.getElementById("all-notes-section").style.gridTemplateAreas = "'all-notes'";
        } else {
            if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
            if (document.getElementById("tag-select-grid").classList.contains("hidden")) document.getElementById("tag-select-grid").classList.remove("hidden");
            document.getElementById("all-notes-section").style.gridTemplateAreas = "'tag all-notes all-notes all-notes all-notes'";
        }
    } else {
        document.getElementById("open-sticky-button").classList.add("hidden");
        document.getElementById("tag-select-grid").classList.add("hidden");
        document.getElementById("all-notes-section").style.gridTemplateAreas = "'all-notes'";
    }
}

function sendMessageUpdateToBackground() {
    browser.runtime.sendMessage({"updated": true});
}

function tabUpdated(tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        let tab_id = tabs[0].tabId;
        let tab_url = tabs[0].url;

        setUrl(tab_url);
        actions = [];
        currentAction = 0;
        undoAction = false;
    }).then((tabs) => {
        window.close();
        //loadUI();
    });
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
    } else {
        document.getElementById("domain-button").style.width = "40%";
        document.getElementById("tab-other-button").style.display = "none";
        document.getElementById("page-button").style.borderBottomRightRadius = "5px";
        document.getElementById("page-button").style.borderTopRightRadius = "5px";
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

    //console.log("Current url [0] " + currentUrl[1] + " - [1] " + currentUrl[2]);
}

function getGlobalUrl() {
    return "**global";
}

function getDomainUrl(url) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        let urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    if (urlToReturn.includes("/")) {
        let urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    return (protocol + "://" + urlToReturn);
}

function getPageUrl(url) {
    let urlToReturn = url;

    //https://page.example/search#section1
    if (settings_json["consider-sections"] === "no") {
        if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];
    }

    //https://page.example/search?parameters
    if (settings_json["consider-parameters"] === "no") {
        if (url.includes("?")) urlToReturn = urlToReturn.split("?")[0];
    }

    //console.log(urlToReturn);
    return urlToReturn;
}

/**
 *
 * @param url
 * @returns {*[]} Returns urls without the domain ("/a/*", "/a/b/*", ...). To get the domain, use "getDomainUrl + this"
 */
function getAllOtherPossibleUrls(url) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        let urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    let urlsToReturn = [];

    if (urlToReturn.includes("/")) {
        let urlPartsTemp = urlToReturn.split("/");
        let urlConcat = "/";
        for (let urlFor = 3; urlFor < urlPartsTemp.length; urlFor++) {
            if (urlPartsTemp[urlFor] !== "") {
                urlConcat += urlPartsTemp[urlFor];
                if (urlConcat !== getDomainUrl(url)) {
                    urlsToReturn.push(urlConcat + "/*");
                }
                urlConcat += "/";
            }
        }
    }

    return urlsToReturn;
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

function getDate() {
    let todayDate = new Date();
    let today = "";
    today = todayDate.getFullYear() + "-";
    let month = todayDate.getMonth() + 1;
    if (month < 10) today = today + "0" + month + "-"; else today = today + "" + month + "-";
    let day = todayDate.getDate();
    if (day < 10) today = today + "0" + day + " "; else today = today + "" + day + " ";
    let hour = todayDate.getHours();
    if (hour < 10) today = today + "0" + hour + ":"; else today = today + "" + hour + ":"
    let minute = todayDate.getMinutes();
    if (minute < 10) today = today + "0" + minute + ":"; else today = today + "" + minute + ":"
    let second = todayDate.getSeconds();
    if (second < 10) today = today + "0" + second; else today = today + "" + second

    return today;
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

    let never_saved = true;
    let notes = "";
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["notes"] !== undefined) {
        //notes saved (also it's empty)
        notes = websites_json[getPageUrl(url)]["notes"];
        listenerLinks();
        never_saved = false;
    }
    document.getElementById("notes").innerHTML = notes;
    listenerLinks();
    if (notes !== "<br>" && notes !== "") {
        loadFormatButtons(true, true);
    }

    let last_update = all_strings["never-update"];
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["last-update"] !== undefined) last_update = websites_json[getPageUrl(url)]["last-update"];
    document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", last_update);

    let colour = "none";
    document.getElementById("tag-colour-section").removeAttribute("class");
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["tag-colour"] !== undefined) colour = websites_json[getPageUrl(url)]["tag-colour"];
    document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);
    if (websites_json[currentUrl[selected_tab]] !== undefined) document.getElementById("tag-select-grid").value = websites_json[currentUrl[selected_tab]]["tag-colour"];

    let sticky = false;
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["sticky"] !== undefined) sticky = websites_json[getPageUrl(url)]["sticky"];
    let minimized = false;
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["minimized"] !== undefined) minimized = websites_json[getPageUrl(url)]["minimized"];

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

                    sync_local.set({"websites": websites_json}).then(result => {
                        //console.log("Opening... <5>")
                        browser.runtime.sendMessage({
                            "open-sticky": {
                                open: true, type: selected_tab
                            }
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

function insertLink(value) {
    //if (isValidURL(value)) {
    document.execCommand('createLink', false, value);
    addAction();
    //}
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
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";

            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = "yes";
            if (settings_json["advanced-managing"] === "yes") advanced_managing = true;
            else advanced_managing = false;

            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = "yes";
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = "no";
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = "yes";
        }

        if (!document.getElementById("notes").spellcheck || (force && value)) {
            //enable spellCheck
            document.getElementById("notes").spellcheck = true;
            settings_json["spellcheck-detection"] = "yes";
            if (document.getElementById("text-spellcheck")) {
                document.getElementById("text-spellcheck").classList.add("text-spellcheck-sel");
            }
        } else {
            //disable spellCheck
            document.getElementById("notes").spellcheck = false;
            settings_json["spellcheck-detection"] = "no";
            if (document.getElementById("text-spellcheck") && document.getElementById("text-spellcheck").classList.contains("text-spellcheck-sel")) {
                document.getElementById("text-spellcheck").classList.remove("text-spellcheck-sel")
            }
        }
        document.getElementById("notes").focus();
        sync_local.set({"settings": settings_json}).then(() => {
            sendMessageUpdateToBackground();
        });
    });
}

function loadFormatButtons(navigation = true, format = true) {
    let url = "/img/commands/";

    let html_text_formatting = true;
    if (settings_json["html-text-formatting"] !== undefined) {
        if (settings_json["html-text-formatting"] === "yes") html_text_formatting = true;
        else html_text_formatting = false;
    }

    let commands = [];
    if (navigation && html_text_formatting) {
        commands.push(
            {
                action: "undo", icon: `${url}undo.svg`, title: all_strings["label-title-undo"], function: function () {
                    undo()
                }
            },
            {
                action: "redo", icon: `${url}redo.svg`, title: all_strings["label-title-redo"], function: function () {
                    redo()
                }
            });
    } else {
        actions = [];
        currentAction = 0;
    }
    if (format && html_text_formatting) {
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
            },
            {
                action: "spellcheck",
                icon: `${url}spellcheck.svg`,
                title: all_strings["label-title-spellcheck"],
                function: function () {
                    spellcheck();
                }
            });
    }

    if (!format && !navigation || !html_text_formatting) {
        document.getElementById("notes").style.marginBottom = "0px";
    } else {
        document.getElementById("notes").style.marginBottom = "35px";
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
        if (settings_json !== undefined && settings_json["spellcheck-detection"] !== undefined && settings_json["spellcheck-detection"] === "no") {
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

    if (settings_json !== undefined && settings_json !== undefined && settings_json["disable-word-wrap"] !== undefined && settings_json["disable-word-wrap"] === "yes") {
        document.getElementById("notes").style.whiteSpace = "none";
    } else {
        document.getElementById("notes").style.whiteSpace = "pre-wrap";
    }
    document.getElementById("notes").focus();
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
        let undo_svg = window.btoa(getIconSvgEncoded("undo", on_primary));
        let redo_svg = window.btoa(getIconSvgEncoded("redo", on_primary));
        let tag_svg = window.btoa(getIconSvgEncoded("tag", on_primary));
        let arrow_select_svg = window.btoa(getIconSvgEncoded("arrow-select", on_primary));
        let arrow_right_svg = window.btoa(getIconSvgEncoded("arrow-right", on_primary));

        let tertiary = backgroundSection;
        let tertiaryTransparent = primary;
        if (tertiaryTransparent.includes("rgb(")) {
            let rgb_temp = tertiaryTransparent.replace("rgb(", "");
            let rgb_temp_arr = rgb_temp.split(",");
            if (rgb_temp_arr.length >= 3) {
                let red = rgb_temp_arr[0].replace(" ", "");
                let green = rgb_temp_arr[1].replace(" ", "");
                let blue = rgb_temp_arr[2].replace(")", "").replace(" ", "");
                tertiaryTransparent = `rgba(${red}, ${green}, ${blue}, 0.2)`;
            }
        } else if (tertiaryTransparent.includes("#")) {
            tertiaryTransparent += "22";
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