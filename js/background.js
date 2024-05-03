const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];
var settings_json = {};
var websites_json = {};
var notefox_json = {};

var icons_json = {};
var theme_colours_json = {};

const webBrowserUsed = "firefox";//TODO:change manually

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
let linkFirstLaunch = "https://notefox.eu/help/first-run"

let sync_local = browser.storage.local;
checkSyncLocal();

function checkSyncLocal() {
    sync_local = browser.storage.local;
    browser.storage.sync.get("installation").then(result => {
        //console.log("Installation")
        //console.log(result)
        if (result.installation === undefined) {
            browser.storage.sync.set({
                "installation": {
                    "date": getDate(),
                    "version": browser.runtime.getManifest().version
                }
            });

            //first launch -> open tutorial
            browser.tabs.create({url: linkFirstLaunch});
        }
    });

    checkSyncData();
}

function checkSyncData(just_once = false) {
    //console.log("Check sync data")
    browser.storage.sync.get(["notefox-account"]).then(resultSync => {
        //console.log("Sync data: " + JSON.stringify(resultSync));
        if (resultSync["notefox-account"] !== undefined) {
            api_request({
                "api": true,
                "type": "get-data",
                "data": {
                    "login-id": resultSync["notefox-account"]["login-id"],
                    "token": resultSync["notefox-account"]["token"]
                }
            });

            syncData(1 * 60 * 1000, just_once); //1 minute if the user is logged in
        } else {
            syncData(5 * 60 * 1000, just_once); //5 minutes if the user is not logged in
        }
    });
}

/**
 * Sync data with the server
 * @param force_time time in milliseconds (default 1 minute)
 * @param just_once if true, it will sync data just once (default false)
 */
function syncData(force_time = 1 * 60 * 1000, just_once = false) {
    //console.log(`Sync data each ${force_time} ms`);

    sync_local.set({"last-sync": getDate()});

    if (!just_once) {
        setTimeout(function () {
            checkSyncData();
        }, force_time);
    }
}

function response(response) {
    //console.log("Response: " + JSON.stringify(response));
    if (response["api_response"] !== undefined && response["api_response"] === true) {
        if (response["type"] !== undefined) {
            if (response["type"] === "get-data") {
                if (response["data"] !== undefined) {
                    let data = response["data"];
                    if (data !== undefined) {
                        if (data.code === 200) {
                            //check if server data is newer than local data
                            //console.log("Server data: " + JSON.stringify(data["data"]));
                            sync_local.get(["last-update"]).then(result => {
                                let latestUpdateServer = data["data"]["updated-locally"];
                                let latestUpdateLocal = result["last-update"];

                                //console.log("Latest update on server: " + latestUpdateServer);
                                //console.log("Latest update on local: " + latestUpdateLocal);

                                if (latestUpdateServer !== undefined && latestUpdateLocal !== undefined) {
                                    let dateServer = new Date(latestUpdateServer);
                                    let dateLocal = new Date(latestUpdateLocal);

                                    if (dateLocal > dateServer) {
                                        //console.log("Local data is newer than server one");

                                        //send data to the server
                                        sendLocalDataToServer();
                                    } else if (dateLocal < dateServer) {
                                        //update local data
                                        //console.log("Server data is newer than local one");

                                        let data_to_server = JSON.parse(data["data"]["data"]);

                                        //console.log(JSON.stringify(data_to_server));

                                        sync_local.set(data_to_server).then(result => {
                                            //console.log("Data updated from server");

                                            syncUpdateFromServer();
                                        });
                                    } else {
                                        //console.log("Local data is the same as the server one");
                                    }
                                } else if (latestUpdateServer === undefined && latestUpdateLocal !== undefined) {
                                    //No data on server
                                    //console.log("No data on server");

                                    //send data to the server
                                    sendLocalDataToServer();
                                } else if (latestUpdateServer !== undefined && latestUpdateLocal === undefined) {
                                    //No data on local
                                    //console.log("No data on local");

                                    let data_to_server = JSON.parse(data["data"]["data"]);

                                    sync_local.set(data_to_server).then(result => {
                                        //console.log("Data updated from server");
                                        syncUpdateFromServer();
                                    });
                                }
                            });
                        } else if (data.code === 450) {
                            //No data on the server ==> never send data
                            //send data to the server

                            //console.log("Sending data to the server");

                            sendLocalDataToServer();
                        } else {
                            console.error(`Error: ${data.code} - ${data.status} - ${data.description}`);
                        }
                    }
                }
            } else if (response["type"] === "send-data") {
                //console.log("Send data response: " + JSON.stringify(response));
            }
        }
    }

}

function sendLocalDataToServer() {
    //console.log("Sending...")
    let data_to_send = {};

    browser.storage.local.get(["storage"]).then(getStorageTemp => {
        sync_local.get(["sticky-notes-coords", "sticky-notes-opacity", "sticky-notes-sizes", "websites", "last-update"]).then((result) => {
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

            for (setting in settings_json) {
                if (settings_json[setting] === "yes") settings_json[setting] = true; else if (settings_json[setting] === "no") settings_json[setting] = false;
            }
            data_to_send = {
                "notefox": notefox_json,
                "settings": settings_json,
                "websites": websites_json,
                "sticky-notes": sticky_notes,
                "storage": getStorageTemp["storage"],
                "last-update": result["last-update"]
            }


            browser.storage.sync.get(["notefox-account"]).then(resultSync => {
                if (resultSync["notefox-account"] !== undefined) {
                    api_request({
                        "api": true,
                        "type": "send-data",
                        "data": {
                            "login-id": resultSync["notefox-account"]["login-id"],
                            "token": resultSync["notefox-account"]["token"],
                            "updated-locally": correctDatetime(result["last-update"]),
                            "data": JSON.stringify(data_to_send)
                        }
                    });
                } else {
                }
            });

            sync_local.set(data_to_send).then(result => {
                //console.log("Data sent to the server");
            });
        }).catch((e) => {
            console.error(`E-B1: ${e}`);
        });
    });
}

function syncUpdateFromServer() {
    //console.log("Receiving...")
    browser.runtime.sendMessage({"sync_update": true}).then(response => {
        //console.log("Sync update from server: " + response);
    }).catch((e) => {
        setTimeout(function () {
            syncUpdateFromServer();
        }, 5 * 60 * 1000); //5 minutes if any issues
        console.error(`E-B2: ${e}`);
    });

    loaded();
}

function correctDatetime(datetime) {
    let date = new Date(datetime);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function changeIcon(index) {
    browser.browserAction.setIcon({path: icons[index], tabId: tab_id});
}

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

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;
        tab_url = activeTab.url;
        tab_title = activeTab.title;

        //catch changing of tab
        browser.tabs.onActivated.addListener(function () {
            tabUpdated();
            type_to_use = -1;
        });
        browser.tabs.onUpdated.addListener(tabUpdated);
        browser.windows.onFocusChanged.addListener(tabUpdated);

        browser.runtime.onMessage.addListener((message) => {
            if (message["updated"] !== undefined && message["updated"]) {
                checkStatus();
                checkStickyNotes();
            }
        });

        checkStatus();
    });
}

function loadDataFromSync() {
    listenerShortcuts();
    listenerStickyNotes();
    listenerAllNotes();

    browser.runtime.onMessage.addListener((message) => {
        if (message["sync-now"] !== undefined && message["sync-now"]) {
            //console.log("Syncing now");
            checkSyncData(true);
        }
        if (message["check-user"] !== undefined && message["check-user"]) {
            //console.log("Check user validity");
            checkUserPeriodically(0, true);
        }
    });

    checkUserPeriodically();

    loaded();
}

/**
 * Check user (login-id and token validity) periodically
 * @param time time in milliseconds (default 5 minutes)
 * @param just_once if true, it won't check user periodically (default false)
 */
function checkUserPeriodically(time = 1 * 60 * 1000, just_once = false) {
    setTimeout(function () {
        browser.storage.sync.get(["notefox-account"]).then(resultSync => {
            if (resultSync["notefox-account"] !== undefined) {
                //logged in
                check_user(resultSync["notefox-account"]["login-id"], resultSync["notefox-account"]["token"]);

                if (!just_once) checkUserPeriodically();
            } else {
                //not logged in
                if (!just_once) checkUserPeriodically();
            }
        });
    }, time);
}

function tabUpdated(update = false) {
    //console.log(JSON.stringify(all_urls));
    sync_local = browser.storage.sync;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else if (result.storage === "local") sync_local = browser.storage.local;
        else {
            browser.storage.local.set({"storage": "local"});
            sync_local = browser.storage.local;
        }
        browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
            if (tabs !== undefined && tabs.length > 0) {
                tab_id = tabs[0].id;
                tab_url = tabs[0].url;
                tab_title = tabs[0].title;
            }
        }).then((tabs) => {
            checkStatus(update);
        });
    });
}

function checkStatus(update = false) {
    current_urls = [getGlobalUrl(), getDomainUrl(tab_url), getPageUrl(tab_url)];
    sync_local.get("settings")
        .then(value => {
            settings_json = {};
            if (value["settings"] !== undefined) settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = false;
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = false;
            if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = true;
            if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = true;
            if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = true;
            if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = true;
            if (settings_json["check-with-all-supported-protocols"] === undefined) settings_json["check-with-all-supported-protocols"] = false;
            //console.log(JSON.stringify(settings_json));
            //console.log("checkStatus");
            //console.log(value);

            if (settings_json["sticky-secondary-color"] === undefined) settings_json["sticky-secondary-color"] = "#ff6200";
            if (settings_json["sticky-on-secondary-color"] === undefined) settings_json["sticky-on-secondary-color"] = "#ffffff";

            let close_sticky_icon_svg = window.btoa(getIconSvgEncoded("close", settings_json["sticky-on-secondary-color"]));
            let minimize_sticky_icon_svg = window.btoa(getIconSvgEncoded("minimize", settings_json["sticky-on-secondary-color"]));
            let restore_sticky_icon_svg = window.btoa(getIconSvgEncoded("restore", settings_json["sticky-on-secondary-color"]));
            icons_json = {
                "close": close_sticky_icon_svg,
                "minimize": minimize_sticky_icon_svg,
                "restore": restore_sticky_icon_svg
            };

            theme_colours_json = {
                "primary": getStickyNotesColoursByElement("yellow")[0],
                "on-primary": getStickyNotesColoursByElement("yellow")[1],
                "secondary": getStickyNotesColoursByElement("yellow")[2],
                "on-secondary": getStickyNotesColoursByElement("yellow")[3]
            };
            sync_local.get("settings").then(result => {
                let primary;
                let secondary;
                let on_primary;
                let on_secondary;
                let default_theme = false;

                if (result !== undefined && result["settings"] !== undefined && result["settings"]["sticky-theme"] !== undefined) {
                    let theme = result["settings"]["sticky-theme"];
                    if (theme === "auto") {
                        browser.theme.getCurrent().then(theme => {
                            if (theme !== undefined && theme["colors"] !== undefined && theme["colors"] !== null) {
                                //console.log(JSON.stringify(theme.colors));
                                primary = theme.colors.toolbar_text;
                                secondary = theme.colors.toolbar_field;
                                on_primary = theme.colors.toolbar;
                                on_secondary = theme.colors.toolbar_field_text;

                                theme_colours_json = {
                                    "primary": primary,
                                    "on-primary": on_primary,
                                    "secondary": secondary,
                                    "on-secondary": on_secondary
                                };

                                if (primary === undefined || secondary === undefined || on_primary === undefined || on_secondary === undefined) {
                                    default_theme = true;
                                }
                            } else {
                                default_theme = true;
                            }
                        });
                    } else {
                        let colours = getStickyNotesColoursByElement(theme);
                        theme_colours_json = {
                            "primary": colours[0],
                            "on-primary": colours[1],
                            "secondary": colours[2],
                            "on-secondary": colours[3]
                        };
                    }
                } else {
                    default_theme = true;
                }

                if (default_theme) {
                    //use the default one
                    let colours = getStickyNotesColoursByElement("yellow");
                    theme_colours_json = {
                        "primary": colours[0],
                        "on-primary": colours[1],
                        "secondary": colours[2],
                        "on-secondary": colours[3]
                    };
                }
            });
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
                            //console.log("QAZ-1")
                            sync_local.set({
                                "websites": websites_json,
                                "last-update": getDate()
                            }).then(resultSet => {
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

/**
 * Get the sticky notes theme colour
 * @param colour it's the name of the theme ("yellow", "lime", "cyan", "pink", "white", "black") -- not "auto"!
 * @returns {(string)[]} it returns an array with the [primary, on-primary, secondary, on-secondary] colours
 */
function getStickyNotesColoursByElement(colour) {
    let primary = "#fffd7d";
    let on_primary = "#111111";
    let secondary = "#ff6200";
    let on_secondary = "#ffffff";

    switch (colour) {
        case "yellow":
            primary = "#fffd7d";
            on_primary = "#111111";
            secondary = "#ff6200";
            on_secondary = "#ffffff";
            break;

        case "lime":
            primary = "#d4f7a6";
            on_primary = "#111111";
            secondary = "#a6e22e";
            on_secondary = "#111111";
            break;

        case "cyan":
            primary = "#b3f0ff";
            on_primary = "#111111";
            secondary = "#00b5e2";
            on_secondary = "#ffffff";
            break;

        case "pink":
            primary = "#ffccff";
            on_primary = "#111111";
            secondary = "#ff00ff";
            on_secondary = "#ffffff";
            break;

        case "white":
            primary = "#f5f5f5";
            on_primary = "#111111";
            secondary = "#cccccc";
            on_secondary = "#111111";
            break;

        case "black":
            primary = "#333333";
            on_primary = "#ffffff";
            secondary = "#000000";
            on_secondary = "#ffffff";
            break;
    }

    return [primary, on_primary, secondary, on_secondary];
}

function getIconSvgEncoded(icon, color) {
    let svgToReturn = "";
    switch (icon) {
        case "close":
            svgToReturn = '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 800 800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g fill="' + color + '">\n' +
                '        <path d="m66.667 600c0-62.853 0-94.28 19.526-113.807 19.526-19.526 50.953-19.526 113.807-19.526s94.281 0 113.807 19.526c19.526 19.527 19.526 50.954 19.526 113.807s0 94.28-19.526 113.807c-19.526 19.526-50.953 19.526-113.807 19.526s-94.281 0-113.807-19.526c-19.526-19.527-19.526-50.954-19.526-113.807z"\n' +
                '              fill-rule="nonzero"/>\n' +
                '        <path d="m115.482 115.482c-48.815 48.816-48.815 127.383-48.815 284.518 0 13.187 0 25.82.029 37.927 16.936-11.104 35.598-15.967 53.491-18.374 21.52-2.893 47.976-2.89 76.83-2.886h5.967c28.854-.004 55.31-.007 76.83 2.886 23.699 3.187 48.747 10.684 69.349 31.284 20.6 20.603 28.097 45.65 31.284 69.35 2.893 21.52 2.89 47.976 2.886 76.83v5.966c.004 28.857.007 55.31-2.886 76.83-2.407 17.894-7.267 36.554-18.374 53.49 12.11.03 24.74.03 37.927.03 157.133 0 235.703 0 284.517-48.816 48.816-48.814 48.816-127.384 48.816-284.517 0-157.135 0-235.702-48.816-284.518-48.814-48.815-127.384-48.815-284.517-48.815-157.135 0-235.702 0-284.518 48.815zm326.185 92.851c-13.807 0-25 11.193-25 25s11.193 25 25 25h64.643l-123.987 123.99c-9.763 9.764-9.763 25.59 0 35.354 9.764 9.763 25.59 9.763 35.354 0l123.99-123.988v64.644c0 13.807 11.193 25 25 25 13.806 0 25-11.193 25-25v-125c0-13.807-11.194-25-25-25z"/>\n' +
                '    </g>\n' +
                '</svg>'
            break;

        case "restore":
            svgToReturn = '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 334 334"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g fill="' + color + '" transform="scale(.416667)">\n' +
                '        <path d="m54.167 400c0 13.807 11.193 25 25 25h365.753l-65.357 56.02c-10.483 8.983-11.696 24.767-2.71 35.25 8.984 10.483 24.767 11.697 35.25 2.71l116.667-100c5.54-4.747 8.73-11.683 8.73-18.98s-3.19-14.233-8.73-18.98l-116.667-100.001c-10.483-8.986-26.266-7.772-35.25 2.711-8.986 10.483-7.773 26.266 2.71 35.251l65.357 56.019h-365.753c-13.807 0-25 11.193-25 25z"/>\n' +
                '        <path d="m312.5 325.001h12.609c-8.618-24.453-4.306-52.709 13.781-73.809 26.957-31.449 74.303-35.092 105.753-8.135l116.667 100c16.623 14.25 26.19 35.05 26.19 56.943 0 21.897-9.567 42.697-26.19 56.947l-116.667 100c-31.45 26.956-78.796 23.313-105.753-8.137-18.087-21.1-22.399-49.357-13.781-73.81h-12.609v58.333c0 94.28 0 141.42 29.29 170.71s76.43 29.29 170.71 29.29h33.333c94.28 0 141.42 0 170.71-29.29s29.29-76.43 29.29-170.71v-266.666c0-94.281 0-141.422-29.29-170.711s-76.43-29.289-170.71-29.289h-33.333c-94.28 0-141.42 0-170.71 29.289s-29.29 76.43-29.29 170.711z"\n' +
                '              fill-rule="nonzero"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;

        case "minimize":
            svgToReturn = '<svg clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 334 334"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g fill="' + color + '" transform="scale(.416667)">\n' +
                '        <path d="m537.5 400c0-13.807-11.193-25-25-25h-365.752l65.355-56.019c10.483-8.985 11.697-24.768 2.712-35.251-8.986-10.483-24.768-11.697-35.251-2.711l-116.667 100.001c-5.541 4.747-8.73 11.683-8.73 18.98s3.189 14.233 8.73 18.98l116.667 100c10.483 8.987 26.265 7.773 35.251-2.71 8.985-10.483 7.771-26.267-2.712-35.25l-65.355-56.02h365.752c13.807 0 25-11.193 25-25z"/>\n' +
                '        <path d="m312.5 266.667c0 23.406 0 35.109 5.617 43.516 2.432 3.641 5.558 6.766 9.198 9.199 8.408 5.617 20.112 5.617 43.518 5.617h141.667c41.42 0 75 33.578 75 75.001 0 41.42-33.58 75-75 75h-141.667c-23.406 0-35.113 0-43.52 5.617-3.639 2.433-6.763 5.556-9.195 9.196-5.618 8.407-5.618 20.11-5.618 43.52 0 94.28 0 141.42 29.29 170.71s76.423 29.29 170.703 29.29h33.334c94.28 0 141.42 0 170.71-29.29s29.29-76.43 29.29-170.71v-266.666c0-94.281 0-141.422-29.29-170.711s-76.43-29.289-170.71-29.289h-33.334c-94.28 0-141.413 0-170.703 29.289s-29.29 76.43-29.29 170.711z"\n' +
                '              fill-rule="nonzero"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
    }
    return svgToReturn;
}

function checkAllSupportedProtocols(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined || json["https://" + getUrlWithoutProtocol(url)] !== undefined || json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined)
            return true;
        else
            return false;
    } else {
        return json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)] !== undefined;
    }
}

function checkAllSupportedProtocolsSticky(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined && json["http://" + getUrlWithoutProtocol(url)]["sticky"] !== undefined || json["https://" + getUrlWithoutProtocol(url)] !== undefined && json["https://" + getUrlWithoutProtocol(url)]["sticky"] !== undefined || json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)]["sticky"] !== undefined)
            return true;
        else
            return false;
    } else {
        return json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)] !== undefined && json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)]["sticky"] !== undefined;
    }
}

function checkAllSupportedProtocolsLastUpdate(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined && json["http://" + getUrlWithoutProtocol(url)]["last-update"] !== undefined && json["http://" + getUrlWithoutProtocol(url)]["last-update"] !== null || json["https://" + getUrlWithoutProtocol(url)] !== undefined && json["https://" + getUrlWithoutProtocol(url)]["last-update"] !== undefined && json["https://" + getUrlWithoutProtocol(url)]["last-update"] !== null || json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)]["last-update"] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)]["last-update"] !== null)
            return true;
        else
            return false;
    } else {
        return json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)] !== undefined && json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)]["last-update"] !== undefined && json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)]["last-update"] !== null;
    }
}

function checkAllSupportedProtocolsNotes(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined && json["http://" + getUrlWithoutProtocol(url)]["notes"] !== undefined && json["http://" + getUrlWithoutProtocol(url)]["notes"] !== "" || json["https://" + getUrlWithoutProtocol(url)] !== undefined && json["https://" + getUrlWithoutProtocol(url)]["notes"] !== undefined && json["https://" + getUrlWithoutProtocol(url)]["notes"] !== "" || json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)]["notes"] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)]["notes"] !== "")
            return true;
        else
            return false;
    } else {
        return json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)] !== undefined && json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)]["notes"] !== undefined && json[getTheProtocol(url) + "://" + getUrlWithoutProtocol(url)]["notes"] !== "";
    }
}

function getUrlWithSupportedProtocol(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined) return "http://" + getUrlWithoutProtocol(url);
        else if (json["https://" + getUrlWithoutProtocol(url)] !== undefined) return "https://" + getUrlWithoutProtocol(url);
        else if (json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined) return "moz-extension://" + getUrlWithoutProtocol(url);
        else return "";
    } else {
        return getTheProtocol(url) + "://" + getUrlWithoutProtocol(url);
    }
}

function getUrlWithSupportedProtocolSticky(url, json) {
    //Supported: http, https, moz-extension
    let checkInAllSupportedProtocols = settings_json["check-with-all-supported-protocols"] === "yes";
    if (checkInAllSupportedProtocols) {
        if (json["http://" + getUrlWithoutProtocol(url)] !== undefined && json["http://" + getUrlWithoutProtocol(url)] !== undefined) return "http://" + getUrlWithoutProtocol(url);
        else if (json["https://" + getUrlWithoutProtocol(url)] !== undefined && json["https://" + getUrlWithoutProtocol(url)] !== undefined) return "https://" + getUrlWithoutProtocol(url);
        else if (json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined && json["moz-extension://" + getUrlWithoutProtocol(url)] !== undefined) return "moz-extension://" + getUrlWithoutProtocol(url);
        else return "";
    } else {
        return getTheProtocol(url) + "://" + getUrlWithoutProtocol(url);
    }
}

function getUrlWithoutProtocol(url) {
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

    if (urlToReturn.includes("/")) {
        let urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] === "" && urlPartsTemp[1] === "") {
            urlToReturn = urlPartsTemp[2];
        }
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
    if (settings_json["consider-sections"] === "no") {
        if (url.includes("#")) urlToReturn = urlToReturn.split("#")[0];
    }

    //https://page.example/search?parameters
    if (settings_json["consider-parameters"] === "no") {
        if (url.includes("?")) urlToReturn = urlToReturn.split("?")[0];
    }

    //console.log(urlToReturn);

    if (with_protocol) return protocol + "://" + urlToReturn;
    else return urlToReturn;
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

                            //console("QAZ-2")
                            sync_local.set({
                                "websites": websites_json,
                                "last-update": getDate()
                            }).then(result => {
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

                            //console.log("QAZ-3")
                            sync_local.set({
                                "websites": websites_json,
                                "last-update": getDate()
                            }).then(result => {
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

                            //console.log("QAZ-4")
                            sync_local.set({
                                "websites": websites_json,
                                "last-update": getDate()
                            }).then(result => {
                                //console.log(websites_json[url]);
                            });
                        }
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
                            settings: settings_json,
                            icons: icons_json,
                            theme_colours: theme_colours_json
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
                            minimized: websites_json[url_to_use]["minimized"],
                            settings_json: settings_json,
                            icons: icons_json,
                            theme_colours: theme_colours_json
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

function listenerAllNotes() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.from !== undefined && message.from === "all-notes") {
            if (message.type !== undefined && message.type === "inline-edit") {
                if (message.url !== undefined && message.url !== "") {
                    sync_local.get("websites").then(result => {
                        websites_json = result["websites"];
                        if (websites_json !== undefined && websites_json[message.url] !== undefined) {
                            if (message.data.title !== undefined) websites_json[message.url]["title"] = message.data.title;
                            if (message.data.notes !== undefined) websites_json[message.url]["notes"] = message.data.notes;
                            if (message.data.lastUpdate !== undefined) websites_json[message.url]["last-update"] = message.data.lastUpdate;

                            let deleted = false;
                            if (websites_json[message.url]["notes"] === "" || websites_json[message.url]["notes"] === undefined || websites_json[message.url]["notes"] === "<br>") {
                                delete websites_json[message.url];
                                deleted = true;
                            }

                            sync_local.set({
                                "websites": websites_json,
                                "last-update": getDate()
                            });

                            if (deleted) browser.runtime.sendMessage({"updated": true});
                        }
                    });
                }
            }
        }
    });
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
    let domain_condition = checkAllSupportedProtocols(getDomainUrl(tab_url), websites_json) && checkAllSupportedProtocolsSticky(getDomainUrl(tab_url), websites_json) && getUrlWithSupportedProtocolSticky(getDomainUrl(tab_url), websites_json) || do_not_check_opened;
    let page_condition = checkAllSupportedProtocols(getPageUrl(tab_url), websites_json) && checkAllSupportedProtocolsSticky(getPageUrl(tab_url), websites_json) && getUrlWithSupportedProtocolSticky(getPageUrl(tab_url), websites_json) || do_not_check_opened;
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
function closeStickyNotes(update = true) {
    checkIcon();
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        const activeTab = tabs[0];
        if (tabs !== undefined && tabs.length > 0) {
            browser.tabs.executeScript({
                code: "if (document.getElementById(\"sticky-notes-notefox-addon\")){ document.getElementById(\"sticky-notes-notefox-addon\").remove(); } if (document.getElementById(\"restore--sticky-notes-notefox-addon\")) { document.getElementById(\"restore--sticky-notes-notefox-addon\").remove(); }"
            }).then(function () {
                //console.log("Sticky notes ('close')");
                if (update) tabUpdated(false);
            }).catch(function (error) {
                console.error("E1: " + error + "\nin " + activeTab.url);
            });
        }
    });
    opening_sticky = false;
}

function checkIcon() {
    let domain_url = getUrlWithSupportedProtocol(getDomainUrl(tab_url), websites_json);
    let page_url = getUrlWithSupportedProtocol(getPageUrl(tab_url), websites_json);
    let global_url = getGlobalUrl();
    let check_domain = (settings_json["check-green-icon-domain"] === "yes" || settings_json["check-green-icon-domain"] === true) && checkAllSupportedProtocols(getDomainUrl(tab_url), websites_json) && checkAllSupportedProtocolsLastUpdate(getDomainUrl(tab_url), websites_json) && checkAllSupportedProtocolsNotes(getDomainUrl(tab_url), websites_json);
    //let check_tab_url = (settings_json["check-green-icon-domain"] === "yes" || settings_json["check-green-icon-domain"] === true || settings_json["check-green-icon-page"] === "yes" || settings_json["check-green-icon-page"] === true) && websites_json[tab_url] !== undefined && websites_json[tab_url]["last-update"] !== undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] !== undefined && websites_json[tab_url]["notes"] !== "";
    let check_tab_url = false;
    let check_page = (settings_json["check-green-icon-page"] === "yes" || settings_json["check-green-icon-page"] === true) && checkAllSupportedProtocols(getPageUrl(tab_url), websites_json) && checkAllSupportedProtocolsLastUpdate(getPageUrl(tab_url), websites_json) && checkAllSupportedProtocolsNotes(getPageUrl(tab_url), websites_json);
    let check_global = (settings_json["check-green-icon-global"] === "yes" || settings_json["check-green-icon-global"] === true) && websites_json[global_url] !== undefined && websites_json[global_url]["last-update"] !== undefined && websites_json[global_url]["last-update"] != null && websites_json[global_url]["notes"] !== undefined && websites_json[global_url]["notes"] !== "";
    let check_subdomains = false;
    let subdomains = getAllOtherPossibleUrls(tab_url);
    if (settings_json["check-green-icon-subdomain"] === "yes" || settings_json["check-green-icon-subdomain"] === true) {
        subdomains.forEach(subdomain => {
            let subdomain_url = domain_url + subdomain;
            let tmp_check = checkAllSupportedProtocols(subdomain_url, websites_json) && checkAllSupportedProtocolsLastUpdate(subdomain_url, websites_json) && checkAllSupportedProtocolsNotes(subdomain_url, websites_json);
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

            //console.log("QAZ-6")
            sync_local.set({
                "websites": websites_json, "last-update": getDate()
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