var websites_json = {};
var settings_json = {};

var currentUrl = []; //[domain, page]

var selected_tab = 0; //{0:domain | 1:page}
var opened_by = -1;

var stickyNotesSupported = true;

const all_strings = strings[languageToUse];

const linkReview = ["https://addons.mozilla.org/firefox/addon/websites-notes/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

let sync_local;
checkSyncLocal();
function checkSyncLocal() {
    sync_local = browser.storage.sync;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else if (result.storage === "local") sync_local = browser.storage.local;
        else {
            browser.storage.local.set({"storage": "sync"});
            sync_local = browser.storage.sync;
        }
    });
}

function loaded() {
    loadSettings();
}

function continueLoaded() {
    document.addEventListener("contextmenu", function (e) {
        if (!(e.target.nodeName == "TEXTAREA")) {
            e.preventDefault();
        }
    }, false);

    document.getElementById("notes").focus();

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);
        loadUI();
    });

    browser.tabs.onUpdated.addListener(tabUpdated);

    checkOpenedBy();
}

function checkOpenedBy() {
    sync_local.get("opened-by-shortcut", function (value) {
        if (value["opened-by-shortcut"] !== undefined) {
            if (value["opened-by-shortcut"] === "domain") {
                opened_by = 0;
                loadUI();
            } else if (value["opened-by-shortcut"] === "page") {
                opened_by = 1;
                loadUI();
            }
            sync_local.set({"opened-by-shortcut": "default"});
        }
    });
    listenerShortcuts();
}

function listenerShortcuts() {
    browser.commands.onCommand.addListener((command) => {
        if (command === "opened-by-domain") {
            //domain
            opened_by = 0;
            loadUI();
        } else if (command === "opened-by-page") {
            //page
            opened_by = 1;
            loadUI();
            sync_local.set({"opened-by-shortcut": "default"});
        }
    });
}

function setLanguageUI() {
    document.getElementById("domain-button").value = all_strings["domain-label"];
    document.getElementById("page-button").value = all_strings["page-label"];
    document.getElementById("all-notes-button").value = all_strings["see-all-notes-button"];
    document.getElementById("last-updated-section").value = all_strings["last-update-text"].replaceAll("{{date_time}}", "----/--/-- --:--:--");
}

function loadUI() {
    //opened_by = {-1: default, 0: domain, 1: page}
    setLanguageUI();
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let activeTab = tabs[0];
        let activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);

        if (currentUrl[0] !== "" && currentUrl[1] !== "") {
            sync_local.get("websites", function (value) {
                let default_index = 0;
                if (settings_json["open-default"] === "page") default_index = 1;
                if (value["websites"] !== undefined) {
                    websites_json = value["websites"];
                    let check_for_domain = websites_json[currentUrl[0]] !== undefined && websites_json[currentUrl[0]]["last-update"] !== undefined && websites_json[currentUrl[0]]["last-update"] != null && websites_json[currentUrl[0]]["notes"] !== undefined && websites_json[currentUrl[0]]["notes"] !== "";
                    let check_for_page = websites_json[currentUrl[1]] !== undefined && websites_json[currentUrl[1]]["last-update"] !== undefined && websites_json[currentUrl[1]]["last-update"] != null && websites_json[currentUrl[1]]["notes"] !== undefined && websites_json[currentUrl[1]]["notes"] !== "";
                    if (opened_by === 0 || (opened_by === -1 && check_for_domain && (default_index === 0 || default_index === 1 && !check_for_page))) {
                        //by domain
                        setTab(0, currentUrl[0]);
                    } else if (opened_by === 1 || (opened_by === -1 && check_for_page && (default_index === 1 || default_index === 0 && !check_for_domain))) {
                        //by page
                        setTab(1, currentUrl[1]);
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
        setTab(0, currentUrl[0]);
    }
    document.getElementById("page-button").onclick = function () {
        setTab(1, currentUrl[1]);
    }
    document.getElementById("notes").oninput = function () {
        saveNotes();
    }
    document.getElementById("all-notes-button").onclick = function () {
        browser.tabs.create({url: "./all-notes/index.html"});
        window.close();
    }

    document.getElementById("open-sticky-button").onclick = function () {
        //closed -> open it
        openStickyNotes();
        window.close();
    }
}

function loadSettings() {
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";
        }

        continueLoaded();
        //console.log(JSON.stringify(settings_json));
    });
}

function saveNotes() {
    sync_local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        } else {
            websites_json = {};
        }
        if (websites_json[currentUrl[selected_tab]] === undefined) websites_json[currentUrl[selected_tab]] = {};
        let notes = document.getElementById("notes").value;
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
        if (selected_tab == 0) {
            websites_json[currentUrl[selected_tab]]["type"] = 0;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else {
            websites_json[currentUrl[selected_tab]]["type"] = 1;
            websites_json[currentUrl[selected_tab]]["domain"] = currentUrl[0];
        }
        if (notes === "") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
        }
        if (currentUrl[0] !== "" && currentUrl[1] !== "") {
            //selected_tab : {0:domain | 1:page}
            sync_local.set({"websites": websites_json}, function () {
                let never_saved = true;

                let notes = "";
                if (websites_json[currentUrl[selected_tab]] !== undefined && websites_json[currentUrl[selected_tab]]["notes"] !== undefined) {
                    //exists
                    notes = websites_json[currentUrl[selected_tab]]["notes"];
                    never_saved = false;
                }
                document.getElementById("notes").innerText = notes;

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

                if (isUrlSupported(currentUrl[selected_tab])) {
                    if (never_saved) {
                        document.getElementById("open-sticky-button").classList.add("hidden");
                    } else {
                        if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
                    }
                }

                //console.log(JSON.stringify(websites_json));

                //send message to "background.js" to update the icon
                browser.runtime.sendMessage({"updated": true});
            });
        }
    });
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(tabInfo.url);

    loadUI();
}

function setUrl(url) {
    if (isUrlSupported(url)) {
        currentUrl[0] = getDomainUrl(url);
        currentUrl[1] = getPageUrl(url);
        if (document.getElementById("tabs-section").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
        if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
        stickyNotesSupported = true;
    } else {
        currentUrl[0] = getPageUrl(url);
        currentUrl[1] = getPageUrl(url);
        document.getElementById("tabs-section").classList.add("hidden");
        document.getElementById("open-sticky-button").classList.add("hidden");
        stickyNotesSupported = false;
    }

    //console.log("Current url [0] " + currentUrl[0] + " - [1] " + currentUrl[1]);
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
        if (urlPartsTemp[0] == "" && urlPartsTemp[1] == "") {
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

function getTheProtocol(url) {
    return url.split(":")[0];
}

function isUrlSupported(url) {
    let valueToReturn = false;
    switch (getTheProtocol(url)) {
        case "http":
        case "https":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disables all unsupported website
            valueToReturn = false;//todo | true->for testing, false->stable release
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
    selected_tab = index;
    document.getElementById("domain-button").classList.remove("tab-sel");
    document.getElementById("page-button").classList.remove("tab-sel");

    document.getElementsByClassName("tab")[index].classList.add("tab-sel");

    let never_saved = true;
    let notes = "";
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["notes"] !== undefined) {
        //notes saved (also it's empty)
        notes = websites_json[getPageUrl(url)]["notes"];
        never_saved = false;
    }
    document.getElementById("notes").value = notes;

    let last_update = all_strings["never-update"];
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["last-update"] !== undefined) last_update = websites_json[getPageUrl(url)]["last-update"];
    document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", last_update);

    let colour = "none";
    document.getElementById("tag-colour-section").removeAttribute("class");
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["tag-colour"] !== undefined) colour = websites_json[getPageUrl(url)]["tag-colour"];
    document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);

    let sticky = false;
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["sticky"] !== undefined) sticky = websites_json[getPageUrl(url)]["sticky"];
    let minimized = false;
    if (websites_json[getPageUrl(url)] !== undefined && websites_json[getPageUrl(url)]["minimized"] !== undefined) minimized = websites_json[getPageUrl(url)]["minimized"];

    document.getElementById("notes").focus();

    if (isUrlSupported(url)) {
        if (never_saved) {
            document.getElementById("open-sticky-button").classList.add("hidden");
        } else {
            if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
        }
    }
}

function openStickyNotes() {
    if (stickyNotesSupported) browser.runtime.sendMessage({"open-sticky": {open: true, type: selected_tab}});
}

loaded();