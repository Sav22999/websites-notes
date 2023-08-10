const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
var settings_json = {};
var websites_json = {};

var tab_id = 0;
var tab_url = "";

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

    browser.storage.local.get("sticky-notes-coords").then(result => {
        const value = result["sticky-notes-coords"];
        if (value !== undefined) {
            coords.x = value.x;
            coords.y = value.y;
        }
    });
    browser.storage.local.get("sticky-notes-sizes").then(result => {
        const value = result["sticky-notes-sizes"];
        if (value !== undefined) {
            sizes.w = value.w;
            sizes.h = value.h;
        }
    });
    browser.storage.local.get("sticky-notes-opacity").then(result => {
        const value = result["sticky-notes-opacity"];
        if (value !== undefined) {
            opacity.value = value.value;
        }
    });
    browser.storage.local.get("websites").then(result => {
        const value = result["websites"];
        if (value !== undefined) {
            //text.description = "Nota nota nota";
        }
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
    browser.storage.local.get("settings", function (value) {
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
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let domain_url = getShortUrl(tab_url);

            if (websites_json[domain_url] !== undefined && websites_json[domain_url]["last-update"] !== undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] !== undefined && websites_json[domain_url]["notes"] !== "") {
                changeIcon(1);
            } else if (websites_json[getPageUrl(tab_url)] !== undefined && websites_json[getPageUrl(tab_url)]["last-update"] !== undefined && websites_json[getPageUrl(tab_url)]["last-update"] != null && websites_json[getPageUrl(tab_url)]["notes"] !== undefined && websites_json[getPageUrl(tab_url)]["notes"] !== "") {
                changeIcon(1);
            } else {
                changeIcon(0);
            }

            if (websites_json[getPageUrl(tab_url)] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"] !== undefined && websites_json[getPageUrl(tab_url)]["sticky"]) {
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

function getShortUrl(url) {
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
            browser.storage.local.set({"opened-by-shortcut": "domain"});
        } else if (command === "opened-by-page") {
            //page
            browser.browserAction.openPopup();
            browser.storage.local.set({"opened-by-shortcut": "page"});
        }
    });
}

function listenerStickyNotes() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message["open-sticky"] !== undefined && message["open-sticky"]) {
            //from main script (script.js)
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

                    browser.storage.local.set({
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

                    browser.storage.local.set({
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

                    browser.storage.local.set({
                        "sticky-notes-opacity": {
                            value: message.data.opacity.value
                        }
                    }).then(result => {
                        opacity.value = message.data.opacity.value;
                    });
                }

                if (message.data.notes !== undefined) {
                    //save W (width) and H (height) sizes of the sticky
                    //these sizes will be used to open with that size

                    browser.storage.local.set({
                        "websites": {
                            //set notes -- modified in sticky-notes
                        }
                    }).then(result => {
                        //updated websites with new notes
                    });
                }
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
                    sendResponse({
                        notes: {
                            description: websites_json[tab_url]["notes"],
                            url: getPageUrl(tab_url),
                            website: websites_json[tab_url]
                        },
                        websites: websites_json
                    });
                }
            }
        }
    });
}

/**
 * open sticky notes
 */
function openAsStickyNotes() {
    if (!opening_sticky) {
        opening_sticky = true;
        browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
            const activeTab = tabs[0];
            browser.tabs.executeScript(activeTab.id, {file: "./js/inject/sticky-notes.js"}).then(function () {
                //console.log("Sticky notes ('open')");
                opening_sticky = false;
            }).catch(function (error) {
                console.error("E2: " + error);
                opening_sticky = false;
            });
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
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            websites_json[getPageUrl(tab_url)]["sticky"] = sticky;

            browser.storage.local.set({
                "websites": websites_json
            }).then(result => {
                //updated websites with new data
                //console.log("set || " + JSON.stringify(websites_json[getPageUrl(tab_url)]));
                //console.log("set || " + JSON.stringify(websites_json));
                if (websites_json[getPageUrl(tab_url)]["sticky"] !== sticky) {
                    //setOpenedSticky(sticky);
                }
            });
        }
    });
}

function setNewTextFromSticky(text) {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            websites_json[getPageUrl(tab_url)]["notes"] = text;

            browser.storage.local.set({
                "websites": websites_json
            }).then(function () {
                //updated websites with new data
                //console.log("set || " + JSON.stringify(websites_json[getPageUrl(tab_url)]));
                //console.log("set || " + JSON.stringify(websites_json));
                if (websites_json[getPageUrl(tab_url)]["text"] !== text) {
                    //setOpenedSticky(sticky);
                }
            }).catch(function (error) {
                console.error("E3: " + error);
            });
        }
    });
}

function checkStickyNotes() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let status = false;
            if (websites_json[getPageUrl(tab_url)]["sticky"] !== undefined) status = websites_json[getPageUrl(tab_url)]["sticky"];

            if (status) {
                openAsStickyNotes();
            }
        }
    });
}

loaded();