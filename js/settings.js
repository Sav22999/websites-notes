let settings_json = {};

const all_strings = strings[languageToUse];

let sync_local;
checkSyncLocal();

function checkSyncLocal() {
    sync_local = chrome.storage.local;
    chrome.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = chrome.storage.sync;
        else {
            chrome.storage.local.set({"storage": "local"});
            sync_local = chrome.storage.local;
        }
        checkTheme();
    });
}

var currentOS = "default"; //default: win, linux, ecc. | mac
var letters_and_numbers = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
var ctrl_alt_shift = ["default", "domain", "page"];

function loaded() {
    checkSyncLocal()
    checkOperatingSystem();
    setLanguageUI();
    checkTheme();

    document.getElementById("save-settings-button").onclick = function () {
        saveSettings();
    }
    document.getElementById("translate-addon").onclick = function () {
        chrome.tabs.create({url: links.translate});
    }
    document.getElementById("support-telegram-button").onclick = function () {
        chrome.tabs.create({url: links.support_telegram});
    }
    document.getElementById("support-email-button").onclick = function () {
        chrome.tabs.create({url: links.support_email});
    }
    document.getElementById("support-github-button").onclick = function () {
        chrome.tabs.create({url: links.support_github});
    }
    document.getElementById("review-on-chrome-addons-button").onclick = function () {
        chrome.tabs.create({url: links.review});
    }

    document.getElementById("open-by-default-select").onchange = function () {
        settings_json["open-default"] = document.getElementById("open-by-default-select").value;
    };

    document.getElementById("consider-parameters-select").onchange = function () {
        settings_json["consider-parameters"] = document.getElementById("consider-parameters-select").value;
    };
    document.getElementById("consider-sections-select").onchange = function () {
        settings_json["consider-sections"] = document.getElementById("consider-sections-select").value;
    };

    document.getElementById("save-on-local-instead-of-sync-select").onchange = function () {
        settings_json["save-on-local-not-sync"] = document.getElementById("save-on-local-instead-of-sync-select").value;
    };

    document.getElementById("advanced-managing-select").onchange = function () {
        settings_json["advanced-managing"] = document.getElementById("advanced-managing-select").value;
    };

    document.getElementById("html-text-formatting-select").onchange = function () {
        settings_json["html-text-formatting"] = document.getElementById("html-text-formatting-select").value;
    };

    document.getElementById("disable-word-wrap-select").onchange = function () {
        settings_json["disable-word-wrap"] = document.getElementById("disable-word-wrap-select").value;
    };

    document.getElementById("spellcheck-detection-select").onchange = function () {
        settings_json["spellcheck-detection"] = document.getElementById("spellcheck-detection-select").value;
    };

    document.getElementById("theme-select").onchange = function () {
        settings_json["theme"] = document.getElementById("theme-select").value;
    };

    document.getElementById("check-green-icon-global-select").onchange = function () {
        settings_json["check-green-icon-global"] = document.getElementById("check-green-icon-global-select").value;
    };

    document.getElementById("check-green-icon-domain-select").onchange = function () {
        settings_json["check-green-icon-domain"] = document.getElementById("check-green-icon-domain-select").value;
    };

    document.getElementById("check-green-icon-page-select").onchange = function () {
        settings_json["check-green-icon-page"] = document.getElementById("check-green-icon-page-select").value;
    };

    document.getElementById("check-green-icon-subdomain-select").onchange = function () {
        settings_json["check-green-icon-subdomain"] = document.getElementById("check-green-icon-subdomain-select").value;
    };

    document.getElementById("open-links-only-with-ctrl-select").onchange = function () {
        settings_json["open-links-only-with-ctrl"] = document.getElementById("open-links-only-with-ctrl-select").value;
    };

    document.getElementById("check-with-all-supported-protocols-select").onchange = function () {
        settings_json["check-with-all-supported-protocols"] = document.getElementById("check-with-all-supported-protocols-select").value;
    };

    loadSettings();

    let titleAllNotes = document.getElementById("title-settings-dedication-section");
    titleAllNotes.textContent = all_strings["settings-title"];
}

function setLanguageUI() {
    document.title = all_strings["settings-title-page"];

    document.getElementById("open-by-default-text").innerText = all_strings["open-popup-by-default"];
    document.getElementById("open-by-default-domain-text").innerText = all_strings["domain-label"];
    document.getElementById("open-by-default-page-text").innerText = all_strings["page-label"];
    document.getElementById("consider-parameters-text").innerText = all_strings["consider-parameters"];
    document.getElementById("consider-parameters-button-yes").innerText = all_strings["settings-select-button-yes"];
    document.getElementById("consider-parameters-button-no").innerText = all_strings["settings-select-button-no"];
    document.getElementById("consider-parameters-detailed-text").innerHTML = all_strings["consider-parameters-detailed"];
    document.getElementById("consider-sections-text").innerText = all_strings["consider-sections"];
    document.getElementById("consider-sections-button-yes").innerText = all_strings["settings-select-button-yes"];
    document.getElementById("consider-sections-button-no").innerText = all_strings["settings-select-button-no"];
    document.getElementById("consider-sections-detailed-text").innerHTML = all_strings["consider-sections-detailed"];
    document.getElementById("save-on-local-instead-of-sync-text").innerText = all_strings["save-on-local-instead-of-sync"];
    document.getElementById("save-on-local-instead-of-sync-button-yes").innerText = all_strings["settings-select-button-yes"];
    document.getElementById("save-on-local-instead-of-sync-button-no").innerText = all_strings["settings-select-button-no"];
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

    document.getElementById("theme-text").innerText = all_strings["theme-text"];
    document.getElementById("theme-select-light").innerText = all_strings["theme-choose-light-select"];
    document.getElementById("theme-select-dark").innerText = all_strings["theme-choose-dark-select"];
    document.getElementById("theme-select-firefox").innerText = all_strings["theme-choose-firefox-select"];
    document.getElementById("theme-detailed-text").innerHTML = all_strings["theme-detailed-text"].replace("{{property1}}", `<span class="button-code very-small-button">` + all_strings["theme-choose-firefox-select"] + `</span>`);

    document.getElementById("support-telegram-button").value = all_strings["support-telegram-button"];
    document.getElementById("support-email-button").value = all_strings["support-email-button"];
    document.getElementById("support-github-button").value = all_strings["support-github-button"];
    document.getElementById("review-on-chrome-addons-button").value = all_strings["review-on-firefox-addons-button"];
    document.getElementById("save-settings-button").value = all_strings["save-settings-button"];
    document.getElementById("translate-addon").value = all_strings["translate-addon-button"];

    letters_and_numbers.forEach(letterNumber => {
        document.getElementById("key-shortcut-default-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-default'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-domain-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-domain'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-page-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-page'>" + letterNumber + "</option>";
    });
}

function loadSettings() {
    //let shortcuts = chrome.commands.getAll();//TODO:chrome
    //shortcuts.then(getCurrentShortcuts);//TODO:chrome

    chrome.storage.local.get([
        "storage"
    ]).then(result => {
        let property1 = all_strings["save-on-local-instead-of-sync"];
        let property2 = all_strings["settings-select-button-yes"];
        let alert_message = all_strings["disable-sync-settings-message"]
        alert_message = alert_message.replace("{{property1}}", `<span class="button-code" id="string-save-on-local-instead-of-sync">${property1}</span>`);
        alert_message = alert_message.replace("{{property2}}", `<span class="button-code" id="string-save-on-local-instead-of-sync-yes">${property2}</span>`);
        document.getElementById("disable-sync").innerHTML = alert_message;

        if (result.storage !== undefined && result.storage === "sync") {
            if (document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.remove("hidden");
            if (document.getElementById("sync-instead-of-local").classList.contains("hidden")) document.getElementById("sync-instead-of-local").classList.remove("hidden");
        } else {
            if (!document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.add("hidden");
            if (!document.getElementById("sync-instead-of-local").classList.contains("hidden")) document.getElementById("sync-instead-of-local").classList.add("hidden");
        }
    });

    chrome.storage.local.get(["storage"]).then(result => {
        sync_local.get("settings", function (value) {
            settings_json = {};
            if (value["settings"] !== undefined) settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "no";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "no";
            if (settings_json["open-popup-default"] === undefined) settings_json["open-popup-default"] = "Ctrl+Alt+O";
            if (settings_json["open-popup-domain"] === undefined) settings_json["open-popup-domain"] = "Ctrl+Alt+D";
            if (settings_json["open-popup-page"] === undefined) settings_json["open-popup-page"] = "Ctrl+Alt+P";
            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = "yes";
            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = "yes";
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = "no";
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = "yes";
            if (settings_json["theme"] === undefined) settings_json["theme"] = "light";
            if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = "yes";
            if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = "yes";
            if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = "yes";
            if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = "yes";
            if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = "yes";
            if (settings_json["check-with-all-supported-protocols"] === undefined) settings_json["check-with-all-supported-protocols"] = "no";

            let sync_or_local_settings = result["storage"];
            if (sync_or_local_settings === undefined) sync_or_local_settings = "local";

            document.getElementById("open-by-default-select").value = settings_json["open-default"];
            document.getElementById("consider-parameters-select").value = settings_json["consider-parameters"];
            document.getElementById("consider-sections-select").value = settings_json["consider-sections"];
            document.getElementById("advanced-managing-select").value = settings_json["advanced-managing"];
            document.getElementById("html-text-formatting-select").value = settings_json["html-text-formatting"];
            document.getElementById("disable-word-wrap-select").value = settings_json["disable-word-wrap"];
            document.getElementById("spellcheck-detection-select").value = settings_json["spellcheck-detection"];

            if (settings_json["theme"] === "auto") settings_json["theme"] = "light"; //TODO:chrome

            document.getElementById("theme-select").value = settings_json["theme"];
            document.getElementById("check-green-icon-global-select").value = settings_json["check-green-icon-global"];
            document.getElementById("check-green-icon-domain-select").value = settings_json["check-green-icon-domain"];
            document.getElementById("check-green-icon-page-select").value = settings_json["check-green-icon-page"];
            document.getElementById("check-green-icon-subdomain-select").value = settings_json["check-green-icon-subdomain"];
            document.getElementById("open-links-only-with-ctrl-select").value = settings_json["open-links-only-with-ctrl"];
            document.getElementById("check-with-all-supported-protocols-select").value = settings_json["check-with-all-supported-protocols"];
            if (sync_or_local_settings === "sync") document.getElementById("save-on-local-instead-of-sync-select").value = "no";
            else if (sync_or_local_settings === "local") document.getElementById("save-on-local-instead-of-sync-select").value = "yes";

            //TODO:chrome
            /*let keyboardShortcutCtrlAltShiftDefault = document.getElementById("key-shortcut-ctrl-alt-shift-default-selected");
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
            */
            //console.log(JSON.stringify(settings_json));
        });
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
    }
}

function sendMessageUpdateToBackground() {
    chrome.runtime.sendMessage({"updated": true});
}

function saveSettings() {
    //console.log(JSON.stringify(settings_json));
    chrome.storage.local.get(["storage"]).then(resultSyncLocalValue => {
        sync_local.set({"settings": settings_json}).then(resultF => {
            //Saved
            let buttonSave = document.getElementById("save-settings-button");
            buttonSave.value = all_strings["saved-button"];

            let sync_or_local_settings = document.getElementById("save-on-local-instead-of-sync-select").value;
            if (sync_or_local_settings === undefined) sync_or_local_settings = "yes";

            if (sync_or_local_settings === "yes") {
                //use local (from sync)
                sync_local = chrome.storage.local;
                chrome.storage.local.set({"storage": "local"});
                chrome.storage.sync.get([
                    "settings",
                    "websites",
                    "sticky-notes-coords",
                    "sticky-notes-sizes",
                    "sticky-notes-opacity"
                ]).then(result => {
                    chrome.storage.local.set(result).then(resultSet => {
                        chrome.storage.sync.get([
                            "settings",
                            "websites",
                            "sticky-notes-coords",
                            "sticky-notes-sizes",
                            "sticky-notes-opacity"
                        ]).then(result2 => {

                            if (result2["settings"] === {} || result2["settings"] === null) chrome.storage.sync.remove("settings");
                            if (result2["websites"] === {} || result2["websites"] === null) chrome.storage.sync.remove("websites");
                            if (result2["sticky-notes-coords"] === {} || result2["sticky-notes-coords"] === null) chrome.storage.sync.remove("sticky-notes-coords");
                            if (result2["sticky-notes-sizes"] === {} || result2["sticky-notes-sizes"] === null) chrome.storage.sync.remove("sticky-notes-sizes");
                            if (result2["sticky-notes-opacity"] === {} || result2["sticky-notes-opacity"] === null) chrome.storage.sync.remove("sticky-notes-opacity");

                            //TODO:chrome
                            /*ctrl_alt_shift.forEach(value => {
                                let commandName = "_execute_browser_action";
                                if (value === "domain") commandName = "opened-by-domain";
                                else if (value === "page") commandName = "opened-by-page";
                                else if (value === "global") commandName = "opened-by-global";

                                //commandName = "open-by-"+value;
                                let shortcutToSet = settings_json["open-popup-" + value];
                                if (shortcutToSet === "disabled") shortcutToSet = "";

                                updateShortcut(commandName, shortcutToSet);
                            });*/

                            //console.log("-1->" + JSON.stringify(result));
                            //console.log("-2->" + JSON.stringify(result2));
                            //console.log(JSON.stringify(result) === JSON.stringify(result2));
                            if (JSON.stringify(result) === JSON.stringify(result2)) {
                                chrome.storage.sync.clear().then(
                                    result3 => {
                                        chrome.storage.local.set({"storage": "local"});
                                    });
                            }
                        });
                        chrome.storage.local.set({"storage": "local"});
                    }).catch((error) => {
                        console.error("Error importing data to local:", error);
                    });
                }).catch((error) => {
                    console.error("Error retrieving data from sync:", error);
                });
            } else if (sync_or_local_settings === "no") {
                //use sync (from local)
                sync_local = chrome.storage.sync;
                chrome.storage.local.set({"storage": "sync"});
                chrome.storage.local.get([
                    "settings",
                    "websites",
                    "sticky-notes-coords",
                    "sticky-notes-sizes",
                    "sticky-notes-opacity"
                ]).then(result => {
                    //console.log(JSON.stringify(result));
                    chrome.storage.sync.set(result).then(resultSet => {
                        chrome.storage.local.get([
                            "settings",
                            "websites",
                            "sticky-notes-coords",
                            "sticky-notes-sizes",
                            "sticky-notes-opacity"
                        ]).then(result2 => {

                            if (result2["settings"] === {} || result2["settings"] === null) chrome.storage.local.remove("settings");
                            if (result2["websites"] === {} || result2["websites"] === null) chrome.storage.local.remove("websites");
                            if (result2["sticky-notes-coords"] === {} || result2["sticky-notes-coords"] === null) chrome.storage.local.remove("sticky-notes-coords");
                            if (result2["sticky-notes-sizes"] === {} || result2["sticky-notes-sizes"] === null) chrome.storage.local.remove("sticky-notes-sizes");
                            if (result2["sticky-notes-opacity"] === {} || result2["sticky-notes-opacity"] === null) chrome.storage.local.remove("sticky-notes-opacity");
                            //console.log("-1->" + JSON.stringify(result));
                            //console.log("-2->" + JSON.stringify(result2));
                            //console.log(JSON.stringify(result) === JSON.stringify(result2));

                            //TODO:chrome
                            /*ctrl_alt_shift.forEach(value => {
                                //console.log("1>"+settings_json["open-popup-" + value])
                                let commandName = "_execute_browser_action";
                                if (value === "domain") commandName = "opened-by-domain";
                                else if (value === "page") commandName = "opened-by-page";
                                else if (value === "global") commandName = "opened-by-global";

                                //commandName = "open-by-"+value;
                                let shortcutToSet = settings_json["open-popup-" + value];
                                if (shortcutToSet === "disabled") shortcutToSet = "";

                                updateShortcut(commandName, shortcutToSet);
                            });*/

                            if (JSON.stringify(result) === JSON.stringify(result2)) chrome.storage.local.clear().then(
                                result3 => {
                                    chrome.storage.local.set({"storage": "sync"});
                                });
                        });
                        chrome.storage.local.set({"storage": "sync"});
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

            checkTheme();
            loadSettings();
        });
    });
}

function checkOperatingSystem() {
    chrome.runtime.getPlatformInfo((platformInfo) => {
        getOperatingSystem(platformInfo.os);
    });
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
    chrome.commands.update({
        name: commandName, shortcut: shortcut
    });
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        document.getElementById("settings-dedication-section").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("settings-dedication-section").style.color = primary;
        var save_svg = window.btoa(getIconSvgEncoded("save", on_primary));
        var translate_svg = window.btoa(getIconSvgEncoded("translate", on_primary));
        var github_svg = window.btoa(getIconSvgEncoded("github", on_primary));
        var email_svg = window.btoa(getIconSvgEncoded("email", on_primary));
        var firefox_svg = window.btoa(getIconSvgEncoded("firefox", on_primary));
        var telegram_svg = window.btoa(getIconSvgEncoded("telegram", on_primary));

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
            </style>`;
    }
}

loaded();