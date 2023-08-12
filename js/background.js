const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
var settings_json = {};
var websites_json = {};

var tab_id = 0;
var tab_url = "";
var current_urls = []; //0: domain, 1: page

var all_urls = {}; //url_domain: {0: domain, 1: page}

var coords = {x: "20px", y: "20px"};
var sizes = {w: "300px", h: "300px"};
var opacity = {value: 0.7};

let opening_sticky = false;

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
    browser.storage.local.get([
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        //BEFORE TO DO ANYTHING, THE ADDON CHECK DATA

        if (result === undefined || JSON.stringify(result) === "{}") {
            //No data in sync
            //console.log("No data to transfer from local to sync!");

            loaded();
        } else {
            //If it's available "local" data, they are sent to "sync" data
            browser.storage.sync.set(result).then(result => {
                //If it entry here, it means "local" data are been exported in "sync" data

                //console.log("Data imported correctly in sync data!");

                browser.storage.local.clear();

                loaded();
            }).catch((error) => {
                console.error("Error importing data to sync:", error);
            });
        }
    }).catch((error) => {
        console.error("Error retrieving data from local:", error);
    });
}

function tabUpdated(tabs) {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        tab_id = tabs[0].tabId;
        tab_url = tabs[0].url;
    }).then((tabs) => {
        checkStatus();
    });
}

function checkStatus() {
    current_urls = [getDomainUrl(tab_url), getPageUrl(tab_url)];
    browser.storage.sync.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";
        }

        continueCheckStatus();
        //console.log(JSON.stringify(settings_json));
    });
}

function continueCheckStatus() {
    browser.storage.sync.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let domain_url = getDomainUrl(tab_url);
            let page_url = getPageUrl(tab_url);

            if (websites_json[domain_url] !== undefined && websites_json[domain_url]["last-update"] !== undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] !== undefined && websites_json[domain_url]["notes"] !== "") {
                changeIcon(1);
            } else if (websites_json[page_url] !== undefined && websites_json[page_url]["last-update"] !== undefined && websites_json[page_url]["last-update"] != null && websites_json[page_url]["notes"] !== undefined && websites_json[page_url]["notes"] !== "") {
                changeIcon(1);
            } else if (websites_json[tab_url] !== undefined && websites_json[tab_url]["last-update"] !== undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] !== undefined && websites_json[tab_url]["notes"] !== "") {
                changeIcon(1);
            } else {
                changeIcon(0);
            }

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
            browser.storage.sync.set({"opened-by-shortcut": "domain"});
        } else if (command === "opened-by-page") {
            //page
            browser.browserAction.openPopup();
            browser.storage.sync.set({"opened-by-shortcut": "page"});
        }
    });
}

function listenerStickyNotes() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        //console.log("Call: " + JSON.stringify(message));
        if (message["open-sticky"] !== undefined && message["open-sticky"]["open"] !== undefined && message["open-sticky"]["open"]) {
            //from main script (script.js)
            let type = 1;
            if (message["open-sticky"]["type"] !== undefined) type = message["open-sticky"]["type"];
            all_urls[current_urls[1]] = {type: type};
            //console.log(JSON.stringify(all_urls));
            openAsStickyNotes();
        }

        if (message.from !== undefined && message.from === "sticky") {
            //from sticky-notes
            if (message.data !== undefined) {
                //communicate something
                if (message.data.close !== undefined) {
                    if (message.data.close) {
                        //sticky-notes hidden
                        setOpenedSticky(false);
                    } else {
                        //sticky-notes shown
                        setOpenedSticky(true);
                    }
                }

                if (message.data.new_text !== undefined) {
                    setNewTextFromSticky(message.data.new_text);
                }

                if (message.data.coords !== undefined) {
                    //save X (left) and Y (top) coords of the sticky
                    //these coords will be used to open in that position

                    browser.storage.sync.set({
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

                    browser.storage.sync.set({
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

                    browser.storage.sync.set({
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

                    browser.storage.sync.set({
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
            }
        }
    });
}

/**
 * Returns the correct url (if exists "page" returns that, else if exists "domain" returns that one)
 */
function getTheCorrectUrl() {
    let default_url_index = 1;
    if (settings_json !== undefined && settings_json["open-default"] !== undefined) {
        if (settings_json["open-default"] === "page") default_url_index = 1;
        else if (settings_json["open-default"] === "domain") default_url_index = 0;
    }

    //console.log(JSON.stringify(all_urls));

    let url_to_use = tab_url;
    let page = false, domain = false;
    if (all_urls[getDomainUrl(tab_url)] !== undefined && all_urls[getDomainUrl(tab_url)].type !== undefined) {
        url_to_use = current_urls[all_urls[getDomainUrl(tab_url)].type];
        domain = true;
    }
    if (all_urls[getPageUrl(tab_url)] !== undefined && all_urls[getPageUrl(tab_url)].type !== undefined) {
        url_to_use = current_urls[all_urls[getPageUrl(tab_url)].type];
        page = true;
    }

    let domain_condition = websites_json[getDomainUrl(tab_url)] !== undefined && websites_json[getDomainUrl(tab_url)]["sticky"] !== undefined && websites_json[getDomainUrl(tab_url)]["sticky"];
    let page_condition = websites_json[getPageUrl(tab_url)] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"];
    if (!domain && !page) {
        if (domain_condition) {
            url_to_use = current_urls[0];
            domain = true;
        }
        if (page_condition) {
            url_to_use = current_urls[1];
            page = true;
        }

        if (domain && page) {
            //if enter here, this means both are in websites, so choose the default one
            url_to_use = current_urls[default_url_index];
        }
    } else {
        //console.log(`Here! ${domain} ${page}`);
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
        browser.storage.sync.get([
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
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        browser.tabs.executeScript({code: "if (document.getElementById(\"sticky-notes-notefox-addon\")) document.getElementById(\"sticky-notes-notefox-addon\").remove();"}).then(function () {
            //console.log("Sticky notes ('close')");
        }).catch(function (error) {
            console.error("E1: " + error);
        });
    });
    opening_sticky = false;
}

function setOpenedSticky(sticky) {
    browser.storage.sync.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            websites_json[getTheCorrectUrl()]["sticky"] = sticky;

            browser.storage.sync.set({
                "websites": websites_json
            }).then(result => {
                //updated websites with new data
                //console.log("set || " + JSON.stringify(websites_json[tab_url]));
                //console.log("set || " + JSON.stringify(websites_json));
            });
        }
    });
}

function setNewTextFromSticky(text) {
    browser.storage.sync.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            websites_json[getTheCorrectUrl()]["notes"] = text;
            websites_json[getTheCorrectUrl()]["last-update"] = getDate();

            browser.storage.sync.set({
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
    browser.storage.sync.get("websites", function (value) {
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