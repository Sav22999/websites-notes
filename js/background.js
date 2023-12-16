const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
const icons16 = ["../img/icons/icon-16.png", "../img/icons/icon-bordered-16.png"];
const icons48 = ["../img/icons/icon-48.png", "../img/icons/icon-bordered-48.png"];
const icons128 = ["../img/icons/icon-128.png", "../img/icons/icon-bordered-128.png"];
var settings_json = {};
var websites_json = {};

var tab_id = 0;
var tab_url = "";
var tab_title = "";
var current_urls = []; //0: global, 1: domain, 2: page

let all_urls = {} //"url":"value" //value as {0:global, 1:domain, 2:page, 3:subdomain}

var type_to_use = -1;

var coords = {x: "20px", y: "20px"};
var sizes = {w: "300px", h: "300px"};
var opacity = {value: 0.8};

let opening_sticky = false;

let page_domain_global = {"page": "Page", "domain": "Domain", "global": "Global", "subdomain": "•••"};
let linkFirstLaunch = "https://saveriomorelli.com/projects/notefox/first-run"

let sync_local = chrome.storage.local;
checkSyncLocal();

function checkSyncLocal() {
    sync_local = chrome.storage.local;
    chrome.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = chrome.storage.sync;
        else {
            chrome.storage.local.set({"storage": "local"});
            sync_local = chrome.storage.local;
        }
    });
    chrome.storage.sync.get("installation").then(result => {
        //console.log("Installation")
        //console.log(result)
        if (result.installation === undefined) {
            chrome.storage.sync.set({
                "installation": {
                    "date": getDate(),
                    "version": chrome.runtime.getManifest().version
                }
            });

            //first launch -> open tutorial
            chrome.tabs.create({url: linkFirstLaunch});
        }
    })
}

function changeIcon(index) {
    chrome.action.setIcon({path: {"16": icons16[index], "48": icons48[index], "128": icons128[index]}});
}

function loaded() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;
        tab_url = activeTab.url;
        tab_title = activeTab.title;

        //catch changing of tab
        chrome.tabs.onActivated.addListener(tabUpdated);
        chrome.tabs.onUpdated.addListener(tabUpdated);

        chrome.runtime.onMessage.addListener((message) => {
            if (message["updated"] !== undefined && message["updated"]) {
                checkStatus();
                checkStickyNotes();
            }
        });

        //listenerShortcuts();//TODO:chrome
        //listenerStickyNotes();//TODO:chrome
        checkStatus();
    });
}

function loadDataFromSync() {
    loaded();
}

function tabUpdated(tabs) {
    sync_local = chrome.storage.sync;
    chrome.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = chrome.storage.sync;
        else if (result.storage === "local") sync_local = chrome.storage.local;
        else {
            chrome.storage.local.set({"storage": "local"});
            sync_local = chrome.storage.local;
        }
        chrome.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            tab_id = tabs[0].tabId;
            tab_url = tabs[0].url;
            tab_title = tabs[0].title;
        }).then((tabs) => {
            checkStatus(update);
        });
    });
}

function checkStatus(update = false) {
    current_urls = [getGlobalUrl(), getDomainUrl(tab_url), getPageUrl(tab_url)];
    sync_local.get("settings")
        .then(value => {
            if (value["settings"] !== undefined) {
                settings_json = value["settings"];
                if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
                if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "no";
                if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "no";

                if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = "yes";
                if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = "yes";
                if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = "yes";
                if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = "yes";
            }
            //console.log(JSON.stringify(settings_json));
            //console.log("checkStatus");
            //console.log(value);
        })
        .then(() => {
            sync_local.get(["websites", "sticky-notes-coords", "sticky-notes-sizes", "sticky-notes-opacity"])
                .then(value => {
                    if (value["websites"] !== undefined) {
                        websites_json = value["websites"];

                        //console.log(JSON.stringify(websites_json[getTheCorrectUrl()]));
                        //console.log(tab_title);
                        if (websites_json[tab_url] !== undefined && websites_json[tab_url]["title"] === undefined) {
                            //if the title it's not specified yet, so it's set with the title of the tab
                            websites_json[tab_url]["title"] = tab_title;
                            sync_local.set({"websites": websites_json}).then(resultSet => {
                            });
                        }

                        let url = getTheCorrectUrl();
                        //console.log(">>>" + url);
                        //console.log(websites_json[url]);

                        checkIcon();

                        if (websites_json[url] !== undefined && websites_json[url]["coords"] !== undefined && websites_json[url]["coords"]["x"] !== undefined && websites_json[url]["coords"]["y"] !== undefined) {
                            coords = {x: websites_json[url]["coords"]["x"], y: websites_json[url]["coords"]["y"]};
                        } else {
                            if (value["sticky-notes-coords"] !== undefined && value["sticky-notes-coords"]["x"] !== undefined && value["sticky-notes-coords"]["y"] !== undefined) {
                                coords = {x: value["sticky-notes-coords"]["x"], y: value["sticky-notes-coords"]["y"]};
                            } else {
                                coords = {x: "20px", y: "20px"};
                            }
                        }
                        if (websites_json[url] !== undefined && websites_json[url]["sizes"] !== undefined && websites_json[url]["sizes"]["w"] !== undefined && websites_json[url]["sizes"]["h"] !== undefined) {
                            sizes = {w: websites_json[url]["sizes"]["w"], h: websites_json[url]["sizes"]["h"]};
                        } else {
                            if (value["sticky-notes-sizes"] !== undefined && value["sticky-notes-sizes"]["w"] !== undefined && value["sticky-notes-sizes"]["h"] !== undefined) {
                                sizes = {w: value["sticky-notes-sizes"]["w"], h: value["sticky-notes-sizes"]["h"]};
                            } else {
                                sizes = {w: "300px", h: "300px"};
                            }
                        }
                        if (websites_json[url] !== undefined && websites_json[url]["opacity"] !== undefined && websites_json[url]["opacity"]["value"] !== undefined) {
                            opacity = {value: websites_json[url]["opacity"]["value"]};
                        } else {
                            if (value["sticky-notes-opacity"] !== undefined && value["sticky-notes-opacity"]["value"] !== undefined) {
                                opacity = {value: value["sticky-notes-opacity"]["value"]};
                            } else {
                                opacity = {value: 0.8};
                            }
                        }

                        // console.log("coords: " + JSON.stringify(coords));
                        // console.log("sizes: " + JSON.stringify(sizes));
                        // console.log("opacity: " + JSON.stringify(opacity));

                        //console.log(url);
                        if (websites_json[url] !== undefined && websites_json[url]["sticky"] !== undefined && websites_json[url]["sticky"]) {
                            openAsStickyNotes();
                        } else {
                            closeStickyNotes(update);
                        }
                    } else {
                        changeIcon(0);
                    }
                    //console.log(JSON.stringify(websites_json));
                });
            //console.log("checkStatus (continued)");
        });
}

function getGlobalUrl() {
    return "**global";
}

function getDomainUrl(url) {
    let urlToReturn = "";
    if (url !== undefined) {
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
    return "";
}

function getPageUrl(url) {
    let urlToReturn = "";

    if (url !== undefined) {
        urlToReturn = url;
        //https://page.example/search#section1
        if (settings_json["consider-sections"] === "no") {
            if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];
        }

        //https://page.example/search?parameters
        if (settings_json["consider-parameters"] === "no") {
            if (url.includes("?")) urlToReturn = urlToReturn.split("?")[0];
        }
    }

    //console.log(urlToReturn);
    return urlToReturn;
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

function listenerShortcuts() {
    /*
    chrome.commands.onCommand.addListener((command) => {
        if (command === "opened-by-domain") {
            //domain
            chrome.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "domain"});
        } else if (command === "opened-by-page") {
            //page
            chrome.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "page"});
        } else if (command === "opened-by-global") {
            //global
            chrome.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "global"});
        }
    });
    */
}

function listenerStickyNotes() {
    /*
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        //console.log("Call: " + JSON.stringify(message));
        if (message["open-sticky"] !== undefined && message["open-sticky"]["open"] !== undefined && message["open-sticky"]["open"]) {
            //from main script (script.js)
            //the type indicated 0: global, 1: domain, 2: page, 3: subdomain
            if (message["open-sticky"]["type"] !== undefined) {
                type_to_use = message["open-sticky"]["type"];
                all_urls[tab_url] = type_to_use;
                //console.log("--->" + all_urls[tab_url] + " : " + type_to_use);
            }
            //console.log(">9>" + JSON.stringify(all_urls));
            //setOpenedSticky(true, false);
            //openAsStickyNotes();
            tabUpdated();
        }

        if (message.from !== undefined && message.from === "sticky") {
            //from sticky-notes
            if (message.data !== undefined) {
                //communicate something
                if (message.data.sticky !== undefined) {
                    //if message.data.sticky = true -> it means the sticky is present
                    //if message.data.minimized = true -> it means the sticky is minimized
                    setOpenedSticky(message.data.sticky, message.data.minimized);
                }

                if (message.data.new_text !== undefined) {
                    setNewTextFromSticky(message.data.new_text);
                }

                if (message.data.coords !== undefined) {
                    //save X (left) and Y (top) coords of the sticky
                    //these coords will be used to open in that position

                    sync_local.get("websites").then(result => {
                        if (result !== undefined && result["websites"] !== undefined) {
                            websites_json = result["websites"];

                            let url = getTheCorrectUrl();
                            if (websites_json[url]["coords"] === undefined) websites_json[url]["coords"] = {};
                            websites_json[url]["coords"]["x"] = message.data.coords.x;
                            websites_json[url]["coords"]["y"] = message.data.coords.y;

                            coords.x = message.data.coords.x;
                            coords.y = message.data.coords.y;

                            sync_local.set({"websites": websites_json}).then(result => {
                                //console.log(websites_json[url]);
                            });
                        }
                    });
                }

                if (message.data.sizes !== undefined) {
                    //save W (width) and H (height) sizes of the sticky
                    //these sizes will be used to open with that size

                    sync_local.get("websites").then(result => {
                        if (result !== undefined && result["websites"] !== undefined) {
                            websites_json = result["websites"];

                            let url = getTheCorrectUrl();
                            //console.log(url)
                            if (websites_json[url]["sizes"] === undefined) websites_json[url]["sizes"] = {};
                            websites_json[url]["sizes"]["w"] = message.data.sizes.w;
                            websites_json[url]["sizes"]["h"] = message.data.sizes.h;

                            sizes.w = message.data.sizes.w;
                            sizes.h = message.data.sizes.h;

                            sync_local.set({"websites": websites_json}).then(result => {
                                //console.log(websites_json[url]);
                            });
                        }
                    });
                }

                if (message.data.opacity !== undefined) {
                    //save opacity of the sticky-notes

                    sync_local.get("websites").then(result => {
                        if (result !== undefined && result["websites"] !== undefined) {
                            websites_json = result["websites"];

                            let url = getTheCorrectUrl();
                            if (websites_json[url]["opacity"] === undefined) websites_json[url]["opacity"] = {};
                            websites_json[url]["opacity"]["value"] = message.data.opacity.value;

                            opacity.value = message.data.opacity.value;

                            sync_local.set({"websites": websites_json}).then(result => {
                                //console.log(websites_json[url]);
                            });
                        }
                    });
                }
            } else if (message.ask !== undefined) {
                //want something as response
                if (message.ask === "coords-sizes-opacity") {
                    sendResponse({
                        coords: {x: coords.x, y: coords.y},
                        sizes: {w: sizes.w, h: sizes.h},
                        opacity: {value: opacity.value}
                    });
                }
                if (message.ask === "notes") {
                    let url_to_use = getTheCorrectUrl();
                    let page_domain_global_to_use = getTypeToShow(type_to_use);
                    // console.log(url_to_use + " :: " + page_domain_global_to_use);
                    if (websites_json !== undefined && websites_json[url_to_use] !== undefined && websites_json[url_to_use]["notes"] !== undefined && websites_json[url_to_use]["tag-colour"] !== undefined) {
                        sendResponse({
                            notes: {
                                description: websites_json[url_to_use]["notes"],
                                url: url_to_use,
                                tag_colour: websites_json[url_to_use]["tag-colour"],
                                website: websites_json[url_to_use],
                                page_domain_global: page_domain_global_to_use,
                                sticky_params: {
                                    coords: {x: coords.x, y: coords.y},
                                    sizes: {w: sizes.w, h: sizes.h},
                                    opacity: {value: opacity.value}
                                }
                            },
                            websites: websites_json,
                            settings: settings_json
                        });
                    } else {
                        //console.error(JSON.stringify(websites_json[url_to_use]));
                    }
                }
                if (message.ask === "sticky-minimized") {
                    let url_to_use = getTheCorrectUrl();
                    //console.log(websites_json[url_to_use]);
                    if (websites_json !== undefined && websites_json[url_to_use] !== undefined && websites_json[url_to_use]["sticky"] !== undefined && websites_json[url_to_use]["minimized"] !== undefined) {
                        sendResponse({
                            sticky: websites_json[url_to_use]["sticky"],
                            minimized: websites_json[url_to_use]["minimized"]
                        })
                    } else {
                        sendResponse({
                            sticky: true,
                            minimized: false
                        })
                    }
                }
            }
        }
    });
    */
}

/**
 * Get "Page" or "Domain" or "Global" (translated!)
 */
function getTypeToShow(type) {
    let valueToReturn = "";
    switch (type) {
        case 0:
            //global
            valueToReturn = page_domain_global.global
            break;
        case 1:
            //domain
            valueToReturn = page_domain_global.domain
            break;
        case 2:
            //page
            valueToReturn = page_domain_global.page
            break;
        case 3:
            //subdomains
            valueToReturn = page_domain_global.subdomain
            break;
    }
    return valueToReturn;
}

/**
 * @param url the url which you want to check if it's a page or not
 * @returns {boolean} returns true if it's a page OR global, otherwise returns false
 */
function isAPage(url) {
    return (url.replace("http://", "").replace("https://", "").split("/").length > 1);
}

/**
 * Returns the correct url (if exists "page" returns that, else if exists "domain" returns that one)
 */
function getTheCorrectUrl(do_not_check_opened = false) {
    let default_url_index = 2;
    if (settings_json !== undefined && settings_json["open-default"] !== undefined) {
        if (settings_json["open-default"] === "page") default_url_index = 2;
        else if (settings_json["open-default"] === "domain") default_url_index = 1;
        else if (settings_json["open-default"] === "global") default_url_index = 0;
    }

    //console.log(JSON.stringify(all_urls));

    let type = type_to_use;
    if (type === undefined || type === -1) {
        //set by default if it's "-1" (or undefined)
        type = default_url_index;
    }

    if (all_urls[tab_url] !== undefined) {
        //set using the index saved in the current session
        type = all_urls[tab_url];
    }

    let url_to_use = "";

    // console.log(`type ${type_to_use}`);

    let global_condition = websites_json[getGlobalUrl()] !== undefined && (websites_json[getGlobalUrl()]["sticky"] !== undefined && websites_json[getGlobalUrl()]["sticky"] || do_not_check_opened);
    let domain_condition = websites_json[getDomainUrl(tab_url)] !== undefined && (websites_json[getDomainUrl(tab_url)]["sticky"] !== undefined && websites_json[getDomainUrl(tab_url)]["sticky"] || do_not_check_opened);
    let page_condition = websites_json[getPageUrl(tab_url)] !== undefined && (websites_json[getPageUrl(tab_url)]["sticky"] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"] || do_not_check_opened);
    let subdomains_condition = false;
    let subdomain_url_to_use = "";
    let subdomains = getAllOtherPossibleUrls(tab_url);
    subdomains.forEach(subdomain => {
        let subdomain_url = getDomainUrl(tab_url) + subdomain;
        let tmp_check = websites_json[subdomain_url] !== undefined && websites_json[subdomain_url]["last-update"] !== undefined && websites_json[subdomain_url]["last-update"] != null && websites_json[subdomain_url]["notes"] !== undefined && websites_json[subdomain_url]["notes"] !== "";
        if (tmp_check) {
            subdomains_condition = true;
            subdomain_url_to_use = subdomain_url;
        }
        //console.log(url + " : " + tmp_check);
    });

    // console.log(`page ${page_condition} - domain ${domain_condition} - global ${global_condition} - subdomain ${subdomains_condition}`)

    let exists = (page_condition || domain_condition || global_condition || subdomains_condition);

    let default_condition = false;
    if (type === 0) default_condition = global_condition;
    else if (type === 1) default_condition = domain_condition;
    else if (type === 2) default_condition = page_condition;
    else if (type === 3) default_condition = subdomains_condition;

    if (exists) {
        if (default_condition) {
            //console.log(`Default condition true! (${type})`);
            if (type === 3) url_to_use = subdomain_url_to_use;
            else if (type === 0 || type === 1 || type === 2) url_to_use = current_urls[type];
        } else if (global_condition) {
            //console.log("Global condition true!");
            url_to_use = current_urls[0];
            type = 0;
        } else if (domain_condition) {
            //console.log("Domain condition true!");
            url_to_use = current_urls[1];
            type = 1;
        } else if (page_condition) {
            //console.log("Page condition true!");
            url_to_use = current_urls[2];
            type = 2;
        } else if (subdomains_condition) {
            //console.log("Subdomain condition true!");
            url_to_use = subdomain_url_to_use;
            type = 3;
        }
    } else {
        //No otes available
        //console.log("No notes available or sticky-notes disabled!");
    }

    type_to_use = type;

    return url_to_use;
}

/**
 * open sticky notes
 */
function openAsStickyNotes() {
    /*
    if (!opening_sticky) {
        opening_sticky = true;

        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const activeTab = tabs[0];
            chrome.tabs.executeScript(activeTab.id, {file: "./js/inject/sticky-notes.js"}).then(function () {
                //console.log("Sticky notes ('open')");
                opening_sticky = false;
            }).catch(function (error) {
                console.error("E2: " + error);
                opening_sticky = false;
            });
        });
    }
    */
}

/**
 * close sticky notes if exists and the status changed to "closed"
 */
function closeStickyNotes() {
    /*
    checkIcon();
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        chrome.tabs.executeScript({
            code: "if (document.getElementById(\"sticky-notes-notefox-addon\")){ document.getElementById(\"sticky-notes-notefox-addon\").remove(); } if (document.getElementById(\"restore--sticky-notes-notefox-addon\")) { document.getElementById(\"restore--sticky-notes-notefox-addon\").remove(); }"
        }).then(function () {
            //console.log("Sticky notes ('close')");
            if (update) tabUpdated(false);
        }).catch(function (error) {
            console.error("E1: " + error + "\nin " + activeTab.url);
        });
    });
    opening_sticky = false;
    */
}

function checkIcon() {
    let domain_url = getDomainUrl(tab_url);
    let page_url = getPageUrl(tab_url);
    let global_url = getGlobalUrl();
    let check_domain = settings_json["check-green-icon-domain"] === "yes" && websites_json[domain_url] !== undefined && websites_json[domain_url]["last-update"] !== undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] !== undefined && websites_json[domain_url]["notes"] !== "";
    //let check_tab_url = (settings_json["check-green-icon-domain"] === "yes" || settings_json["check-green-icon-page"] === "yes") && websites_json[tab_url] !== undefined && websites_json[tab_url]["last-update"] !== undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] !== undefined && websites_json[tab_url]["notes"] !== "";
    let check_tab_url = false;
    let check_page = settings_json["check-green-icon-page"] === "yes" && websites_json[page_url] !== undefined && websites_json[page_url]["last-update"] !== undefined && websites_json[page_url]["last-update"] != null && websites_json[page_url]["notes"] !== undefined && websites_json[page_url]["notes"] !== "";
    let check_global = settings_json["check-green-icon-global"] === "yes" && websites_json[global_url] !== undefined && websites_json[global_url]["last-update"] !== undefined && websites_json[global_url]["last-update"] != null && websites_json[global_url]["notes"] !== undefined && websites_json[global_url]["notes"] !== ""
    let check_subdomains = false;
    let subdomains = getAllOtherPossibleUrls(tab_url);
    if (settings_json["check-green-icon-subdomain"] === "yes") {
        subdomains.forEach(subdomain => {
            let subdomain_url = domain_url + subdomain;
            let tmp_check = websites_json[subdomain_url] !== undefined && websites_json[subdomain_url]["last-update"] !== undefined && websites_json[subdomain_url]["last-update"] != null && websites_json[subdomain_url]["notes"] !== undefined && websites_json[subdomain_url]["notes"] !== "";
            if (tmp_check) {
                check_subdomains = true;
            }
            //console.log(url + " : " + tmp_check);
        });
    }
    if (check_domain || check_page || check_tab_url || check_global || check_subdomains) {
        changeIcon(1);
    } else {
        changeIcon(0);
    }
}

function getAllOtherPossibleUrls(url) {
    let urlToReturn = "";
    if (url !== undefined) {
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
    return [];
}

function setOpenedSticky(sticky, minimized) {
    //console.log(`sticky: ${sticky} - minimized: ${minimized}`);

    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let url = getTheCorrectUrl();
            //url = tab_url;
            if (websites_json[url] !== undefined) {
                websites_json[url]["sticky"] = sticky;
                websites_json[url]["minimized"] = minimized;

                sync_local.set({"websites": websites_json}).then(result => {
                    //updated websites with new data
                    //console.log("set || " + JSON.stringify(websites_json[tab_url]));
                    //console.log("set || " + JSON.stringify(websites_json));
                    if (!sticky) {
                        closeStickyNotes();
                        if (all_urls[url] !== undefined) {
                            delete all_urls[url];
                            //console.log("::2:: deleted!")
                        } else {
                            //console.log("::1::" + url)
                        }
                    }
                });
            } else {
                closeStickyNotes();
            }
        }
    });
}

function setNewTextFromSticky(text) {
    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            //console.log(text)

            let url = getTheCorrectUrl();

            if (text === "" || text === "<br>") {
                //if notes field is empty, I delete the element from the "dictionary" (notes list)
                delete websites_json[url];
                closeStickyNotes();
            } else {
                websites_json[url]["notes"] = text;
                websites_json[url]["last-update"] = getDate();
            }

            sync_local.set({
                "websites": websites_json
            }).then(function () {
                //updated websites with new data
                //console.log("set || " + JSON.stringify(websites_json[tab_url]));
                //console.log("set || " + JSON.stringify(websites_json));
            }).catch(function (error) {
                console.error("E3: " + error);
            });
        }
    });
}

function checkStickyNotes() {
    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let status = false;
            let url = getTheCorrectUrl();
            if (websites_json[url] !== undefined && websites_json[url]["sticky"] !== undefined) status = websites_json[url]["sticky"];

            if (status) {
                openAsStickyNotes();
            }
        }
    });
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

loadDataFromSync();