const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
var settings_json = {};
var websites_json = {};

var tab_id = 0;
var tab_url = "";
var current_urls = []; //0: global, 1: domain, 2: page

var all_urls = {}; //url_domain: {0: domain, 1: page}

var coords = {x: "20px", y: "20px"};
var sizes = {w: "300px", h: "300px"};
var opacity = {value: 0.7};

let opening_sticky = false;

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

function changeIcon(index) {
    browser.browserAction.setIcon({path: icons[index], tabId: tab_id});
}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;
        tab_url = activeTab.url;

        //catch changing of tab
        browser.tabs.onActivated.addListener(tabUpdated);
        browser.tabs.onUpdated.addListener(tabUpdated);

        browser.runtime.onMessage.addListener((message) => {
            if (message["updated"] !== undefined && message["updated"]) {
                checkStatus();
                checkStickyNotes();
            }
        });

        listenerShortcuts();
        listenerStickyNotes();
        checkStatus();
    });
}

function loadDataFromSync() {
    loaded();
}

function tabUpdated(tabs) {
    sync_local = browser.storage.sync;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else if (result.storage === "local") sync_local = browser.storage.local;
        else {
            browser.storage.local.set({"storage": "sync"});
            sync_local = browser.storage.sync;
        }
        browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
            tab_id = tabs[0].tabId;
            tab_url = tabs[0].url;
        }).then((tabs) => {
            checkStatus();
        });
    });
}

function checkStatus() {
    current_urls = ["**global", getDomainUrl(tab_url), getPageUrl(tab_url)];
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "no";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "no";
        }

        continueCheckStatus();
        //console.log(JSON.stringify(settings_json));
    });
}

function continueCheckStatus() {
    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            checkIcon();
            //console.log(">>>" + getTheCorrectUrl());

            if (websites_json[getTheCorrectUrl()] !== undefined && websites_json[getTheCorrectUrl()]["sticky"] !== undefined && websites_json[getTheCorrectUrl()]["sticky"]) {
                openAsStickyNotes();
            } else {
                closeStickyNotes();
            }
        } else {
            changeIcon(0);
        }
        //console.log(JSON.stringify(websites_json));
    });
}

function getDomainUrl(url) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
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

function listenerShortcuts() {
    browser.commands.onCommand.addListener((command) => {
        if (command === "opened-by-domain") {
            //domain
            browser.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "domain"});
        } else if (command === "opened-by-page") {
            //page
            browser.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "page"});
        } else if (command === "opened-by-global") {
            //global
            browser.browserAction.openPopup();
            sync_local.set({"opened-by-shortcut": "global"});
        }
    });
}

function listenerStickyNotes() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        //console.log("Call: " + JSON.stringify(message));
        if (message["open-sticky"] !== undefined && message["open-sticky"]["open"] !== undefined && message["open-sticky"]["open"]) {
            //from main script (script.js)
            //the type indicated 0: domain, 1: page
            let type = 2;
            if (message["open-sticky"]["type"] !== undefined) type = message["open-sticky"]["type"];
            all_urls[current_urls[2]] = {type: type};
            //console.log(JSON.stringify(all_urls));
            setOpenedSticky(true, false);
            openAsStickyNotes();
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

                    sync_local.set({
                        "sticky-notes-coords": {
                            x: message.data.coords.x,
                            y: message.data.coords.y
                        }
                    }).then(result => {
                        coords.x = message.data.coords.x;
                        coords.y = message.data.coords.y;
                    });
                }

                if (message.data.sizes !== undefined) {
                    //save W (width) and H (height) sizes of the sticky
                    //these sizes will be used to open with that size

                    sync_local.set({
                        "sticky-notes-sizes": {
                            w: message.data.sizes.w,
                            h: message.data.sizes.h
                        }
                    }).then(result => {
                        sizes.w = message.data.sizes.w;
                        sizes.h = message.data.sizes.h;
                    });
                }

                if (message.data.opacity !== undefined) {
                    //save opacity of the sticky-notes

                    sync_local.set({
                        "sticky-notes-opacity": {
                            value: message.data.opacity.value
                        }
                    }).then(result => {
                        opacity.value = message.data.opacity.value;
                    });
                }

                /*
                if (message.data.notes !== undefined) {
                    //save W (width) and H (height) sizes of the sticky
                    //these sizes will be used to open with that size

                    sync_local.set({
                        "websites": {
                            //set notes -- modified in sticky-notes
                        }
                    }).then(result => {
                        //updated websites with new notes
                    });
                }
                */
            } else if (message.ask !== undefined) {
                //want something as response
                if (message.ask === "coords") {
                    sendResponse({coords: {x: coords.x, y: coords.y}});
                }
                if (message.ask === "sizes") {
                    sendResponse({sizes: {w: sizes.w, h: sizes.h}});
                }
                if (message.ask === "opacity") {
                    sendResponse({opacity: {value: opacity.value}});
                }
                if (message.ask === "coords-sizes-opacity") {
                    sendResponse({
                        coords: {x: coords.x, y: coords.y},
                        sizes: {w: sizes.w, h: sizes.h},
                        opacity: {value: opacity.value}
                    });
                }
                if (message.ask === "notes") {
                    let url_to_use = getTheCorrectUrl();
                    if (websites_json !== undefined && websites_json[url_to_use] !== undefined && websites_json[url_to_use]["notes"] !== undefined && websites_json[url_to_use]["tag-colour"] !== undefined) {
                        sendResponse({
                            notes: {
                                description: websites_json[url_to_use]["notes"],
                                url: url_to_use,
                                tag_colour: websites_json[url_to_use]["tag-colour"],
                                website: websites_json[url_to_use],
                                sticky_params: {
                                    coords: {x: coords.x, y: coords.y},
                                    sizes: {w: sizes.w, h: sizes.h},
                                    opacity: {value: opacity.value}
                                }
                            },
                            websites: websites_json
                        });
                    } else {
                        console.error(JSON.stringify(websites_json));
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
}

/**
 * Returns the correct url (if exists "page" returns that, else if exists "domain" returns that one)
 */
function getTheCorrectUrl() {
    let default_url_index = 2;
    if (settings_json !== undefined && settings_json["open-default"] !== undefined) {
        if (settings_json["open-default"] === "page") default_url_index = 2;
        else if (settings_json["open-default"] === "domain") default_url_index = 1;
        else if (settings_json["open-default"] === "global") default_url_index = 0;
    }

    //console.log(JSON.stringify(all_urls));

    let url_to_use = tab_url;
    let page = false, domain = false, global = false;
    if (all_urls[getDomainUrl(tab_url)] !== undefined && all_urls[getDomainUrl(tab_url)].type !== undefined) {
        url_to_use = current_urls[all_urls[getDomainUrl(tab_url)].type];
        domain = true;
    }
    if (all_urls[getPageUrl(tab_url)] !== undefined && all_urls[getPageUrl(tab_url)].type !== undefined) {
        url_to_use = current_urls[all_urls[getPageUrl(tab_url)].type];
        page = true;
    }
    if (all_urls["**global"] !== undefined && all_urls["**global"].type !== undefined) {
        url_to_use = current_urls[all_urls["**global"].type];
        global = true;
    }

    let domain_condition = websites_json[getDomainUrl(tab_url)] !== undefined && websites_json[getDomainUrl(tab_url)]["sticky"] !== undefined && websites_json[getDomainUrl(tab_url)]["sticky"];
    let page_condition = websites_json[getPageUrl(tab_url)] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"];
    let global_condition = websites_json["**global"] !== undefined && websites_json["**global"]["sticky"] !== undefined && websites_json["**global"]["sticky"];
    if (!domain && !page && !global) {
        if (domain_condition) {
            url_to_use = current_urls[1];
            domain = true;
        }
        if (page_condition) {
            url_to_use = current_urls[2];
            page = true;
        }
        if (global_condition) {
            url_to_use = current_urls[0];
            global = true;
        }

        if (domain && page && global) {
            //if enter here, this means both are in websites, so choose the default one
            url_to_use = current_urls[default_url_index];
        }
    } else {
        //console.log(`Here! ${global} ${domain} ${page}`);
        if (current_urls[all_urls[getPageUrl(tab_url)].type] !== 1) {
            url_to_use = current_urls[all_urls[getPageUrl(tab_url)].type];
        }
    }

    return url_to_use;
}

/**
 * open sticky notes
 */
function openAsStickyNotes() {
    if (!opening_sticky) {
        opening_sticky = true;
        sync_local.get([
            "sticky-notes-coords",
            "sticky-notes-sizes",
            "sticky-notes-opacity"
        ]).then(result => {
            //console.log(JSON.stringify(result));

            const value_1 = result["sticky-notes-coords"];
            if (value_1 !== undefined) {
                coords.x = value_1.x;
                coords.y = value_1.y;
            }

            const value_2 = result["sticky-notes-sizes"];
            if (value_2 !== undefined) {
                sizes.w = value_2.w;
                sizes.h = value_2.h;
            }

            const value_3 = result["sticky-notes-opacity"];
            if (value_3 !== undefined) {
                opacity.value = value_3.value;
            }
            browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
                const activeTab = tabs[0];
                browser.tabs.executeScript(activeTab.id, {file: "./js/inject/sticky-notes.js"}).then(function () {
                    //console.log("Sticky notes ('open')");
                    opening_sticky = false;
                }).catch(function (error) {
                    console.error("E2: " + error);
                    opening_sticky = false;
                });
            })
        }).catch((error) => {
            console.error("Error retrieving data:", error);
        });
    }
}

/**
 * close sticky notes if exists and the status changed to "closed"
 */
function closeStickyNotes() {
    checkIcon();
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        browser.tabs.executeScript({
            code: "if (document.getElementById(\"sticky-notes-notefox-addon\")){ document.getElementById(\"sticky-notes-notefox-addon\").remove(); } if (document.getElementById(\"restore--sticky-notes-notefox-addon\")) { document.getElementById(\"restore--sticky-notes-notefox-addon\").remove(); }"
        }).then(function () {
            //console.log("Sticky notes ('close')");
        }).catch(function (error) {
            console.error("E1: " + error + "\nin " + activeTab.url);
        });
    });
    opening_sticky = false;
}

function checkIcon() {
    let domain_url = getDomainUrl(tab_url);
    let page_url = getPageUrl(tab_url);
    if (websites_json[domain_url] !== undefined && websites_json[domain_url]["last-update"] !== undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] !== undefined && websites_json[domain_url]["notes"] !== "") {
        changeIcon(1);
    } else if (websites_json[page_url] !== undefined && websites_json[page_url]["last-update"] !== undefined && websites_json[page_url]["last-update"] != null && websites_json[page_url]["notes"] !== undefined && websites_json[page_url]["notes"] !== "") {
        changeIcon(1);
    } else if (websites_json[tab_url] !== undefined && websites_json[tab_url]["last-update"] !== undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] !== undefined && websites_json[tab_url]["notes"] !== "") {
        changeIcon(1);
    } else if (websites_json["**global"] !== undefined && websites_json["**global"]["last-update"] !== undefined && websites_json["**global"]["last-update"] != null && websites_json["**global"]["notes"] !== undefined && websites_json["**global"]["notes"] !== "") {
        changeIcon(1);
        //console.log(websites_json["**global"]);
    } else {
        changeIcon(0);
    }
}

function setOpenedSticky(sticky, minimized) {
    sync_local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            if (websites_json[getTheCorrectUrl()] !== undefined) {

                websites_json[getTheCorrectUrl()]["sticky"] = sticky;
                websites_json[getTheCorrectUrl()]["minimized"] = minimized;

                sync_local.set({"websites": websites_json}).then(result => {
                    //updated websites with new data
                    //console.log("set || " + JSON.stringify(websites_json[tab_url]));
                    //console.log("set || " + JSON.stringify(websites_json));
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

            if (text === "") {
                //if notes field is empty, I delete the element from the "dictionary" (notes list)
                delete websites_json[getTheCorrectUrl()];
                closeStickyNotes();
            } else {
                websites_json[getTheCorrectUrl()]["notes"] = text;
                websites_json[getTheCorrectUrl()]["last-update"] = getDate();
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
            if (websites_json[getTheCorrectUrl()] !== undefined && websites_json[getTheCorrectUrl()]["sticky"] !== undefined) status = websites_json[getTheCorrectUrl()]["sticky"];

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