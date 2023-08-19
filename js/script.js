var websites_json = {};
var settings_json = {};

var currentUrl = []; //[domain, page]

var selected_tab = 2; //{0: global | 1:domain | 2:page}
var opened_by = -1;

//urls WITHOUT the protocol! e.g. addons.mozilla.org
var urls_unsupported_by_sticky_notes = ["addons.mozilla.org"];//TODO!MANUAL change this manually in case of new unsupported urls
var stickyNotesSupported = true;

const all_strings = strings[languageToUse];

const linkReview = ["https://addons.mozilla.org/firefox/addon/websites-notes/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

let sync_local;
checkSyncLocal();

function checkSyncLocal() {
    sync_local = browser.storage.local;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else if (result.storage === "sync") sync_local = browser.storage.sync;
        else {
            browser.storage.local.set({"storage": "local"});
            sync_local = browser.storage.local;
        }
    });
}

function loaded() {
    checkSyncLocal()
    loadSettings();

    checkTheme();
}

function continueLoaded() {
    document.addEventListener("contextmenu", function (e) {
        if (!(e.target.nodeName === "TEXTAREA")) {
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
            //page
            opened_by = 0;
            loadUI();
        }
        sync_local.set({"opened-by-shortcut": "default"});
    });
}

function setLanguageUI() {
    document.getElementById("domain-button").value = all_strings["domain-label"];
    document.getElementById("page-button").value = all_strings["page-label"];
    document.getElementById("global-button").value = all_strings["global-label"];
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

            if (currentUrl[1] !== "" && currentUrl[2] !== "") {
                sync_local.get("websites", function (value) {
                    //console.log("websites: "+JSON.stringify(value));
                    let default_index = 2;
                    if (settings_json["open-default"] === "page") default_index = 2;
                    if (value["websites"] !== undefined) {
                        websites_json = value["websites"];
                        let check_for_domain = websites_json[currentUrl[1]] !== undefined && websites_json[currentUrl[1]]["last-update"] !== undefined && websites_json[currentUrl[1]]["last-update"] != null && websites_json[currentUrl[1]]["notes"] !== undefined && websites_json[currentUrl[1]]["notes"] !== "";
                        let check_for_page = websites_json[currentUrl[2]] !== undefined && websites_json[currentUrl[2]]["last-update"] !== undefined && websites_json[currentUrl[2]]["last-update"] != null && websites_json[currentUrl[2]]["notes"] !== undefined && websites_json[currentUrl[2]]["notes"] !== "";
                        let check_for_global = websites_json[currentUrl[0]] !== undefined && websites_json[currentUrl[0]]["last-update"] !== undefined && websites_json[currentUrl[0]]["last-update"] != null && websites_json[currentUrl[0]]["notes"] !== undefined && websites_json[currentUrl[0]]["notes"] !== "";
                        if (opened_by === 1 || (opened_by === -1 && check_for_domain && (default_index === 1 || default_index === 2 && !check_for_page || default_index === 0 && !check_for_global))) {
                            //by domain
                            setTab(1, currentUrl[1]);
                        } else if (opened_by === 2 || (opened_by === -1 && check_for_page && (default_index === 2 || default_index === 1 && !check_for_domain || default_index === 0 && !check_for_global))) {
                            //by page
                            setTab(2, currentUrl[2]);
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
        }
    )
    ;

    document.getElementById("domain-button").onclick = function () {
        setTab(1, currentUrl[1]);
    }
    document.getElementById("page-button").onclick = function () {
        setTab(2, currentUrl[2]);
    }
    document.getElementById("global-button").onclick = function () {
        setTab(0, currentUrl[0]);
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
        if (value["websites"] !== undefined) {
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
        if (selected_tab === 0) {
            websites_json[currentUrl[selected_tab]]["type"] = 0;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else {
            websites_json[currentUrl[selected_tab]]["type"] = 1;
            websites_json[currentUrl[selected_tab]]["domain"] = currentUrl[1];
        }
        if (notes === "") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
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

                if (stickyNotesSupported) {
                    if (never_saved) {
                        document.getElementById("open-sticky-button").classList.add("hidden");
                    } else {
                        if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
                    }
                } else {
                    document.getElementById("open-sticky-button").classList.add("hidden");
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
        currentUrl[0] = "**global";//global
        currentUrl[1] = getDomainUrl(url);
        currentUrl[2] = getPageUrl(url);
        if (document.getElementById("tabs-section").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
        if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
    } else {
        currentUrl[0] = "**global";
        currentUrl[1] = "**global";
        currentUrl[2] = "**global";
        if (!document.getElementById("tabs-section").classList.contains("hidden")) document.getElementById("tabs-section").classList.add("hidden");
        if (!document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.add("hidden");
    }

    //console.log("Current url [0] " + currentUrl[1] + " - [1] " + currentUrl[2]);
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
    selected_tab = index;
    document.getElementById("domain-button").classList.remove("tab-sel");
    document.getElementById("page-button").classList.remove("tab-sel");
    document.getElementById("global-button").classList.remove("tab-sel");

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

    if (stickyNotesSupported) {
        if (never_saved) {
            document.getElementById("open-sticky-button").classList.add("hidden");
        } else {
            if (document.getElementById("open-sticky-button").classList.contains("hidden")) document.getElementById("open-sticky-button").classList.remove("hidden");
        }
    } else {
        document.getElementById("open-sticky-button").classList.add("hidden");
    }
}

function openStickyNotes() {
    if (stickyNotesSupported) browser.runtime.sendMessage({
        "open-sticky": {
            open: true,
            type: selected_tab
        }
    });
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        document.getElementById("popup-content").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("popup-content").style.color = primary;
        var sticky_svg = window.btoa(getIconSvgEncoded("sticky-open", on_primary));

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
                }
            </style>`;
    }
}

loaded();