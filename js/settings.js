let settings_json = {
    "open-default": "domain",
    "consider-parameters": "yes",
    "consider-sections": "yes",
    "open-popup-default": "Ctrl+Alt+O",
    "open-popup-domain": "Ctrl+Alt+D",
    "open-popup-page": "Ctrl+Alt+P",
};

const all_strings = strings[languageToUse];
const link_translate = "https://crowdin.com/project/notefox";

var currentOS = "default"; //default: win, linux, ecc. | mac
var letters_and_numbers = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
var ctrl_alt_shift = ["default", "domain", "page"];

function loaded() {
    checkOperatingSystem();
    setLanguageUI();

    document.getElementById("save-settings-button").onclick = function () {
        saveSettings();
    }
    document.getElementById("translate-addon").onclick = function () {
        browser.tabs.create({url: link_translate});
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

    loadSettings();

    let titleAllNotes = document.getElementById("title-settings-dedication-section");
    titleAllNotes.textContent = all_strings["settings-title"];
}

function setLanguageUI() {
    let buttonSave = document.getElementById("save-settings-button");
    buttonSave.value = all_strings["save-settings-button"];

    document.title = all_strings["settings-title-page"];

    document.getElementById("open-by-default-text").innerText = all_strings["open-popup-by-default"];
    document.getElementById("open-by-default-domain-text").innerText = all_strings["domain-label"];
    document.getElementById("open-by-default-page-text").innerText = all_strings["page-label"];
    document.getElementById("consider-parameters-text").innerText = all_strings["consider-parameters"];
    document.getElementById("consider-parameters-button-yes").innerText = all_strings["settings-select-button-yes"];
    document.getElementById("consider-parameters-button-no").innerText = all_strings["settings-select-button-no"];
    document.getElementById("consider-parameters-detailed-text").innerText = all_strings["consider-parameters-detailed"];
    document.getElementById("consider-sections-text").innerText = all_strings["consider-sections"];
    document.getElementById("consider-sections-button-yes").innerText = all_strings["settings-select-button-yes"];
    document.getElementById("consider-sections-button-no").innerText = all_strings["settings-select-button-no"];
    document.getElementById("consider-sections-detailed-text").innerText = all_strings["consider-sections-detailed"];
    document.getElementById("open-popup-default-shortcut-text").innerText = all_strings["open-popup-default-shortcut-text"];
    document.getElementById("open-popup-domain-shortcut-text").innerText = all_strings["open-popup-domain-shortcut-text"];
    document.getElementById("open-popup-page-shortcut-text").innerText = all_strings["open-popup-page-shortcut-text"];

    letters_and_numbers.forEach(letterNumber => {
        document.getElementById("key-shortcut-default-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-default'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-domain-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-domain'>" + letterNumber + "</option>";
        document.getElementById("key-shortcut-page-selected").innerHTML += "<option value='" + letterNumber + "' id='select-" + letterNumber.toLowerCase() + "-shortcut-page'>" + letterNumber + "</option>";
    });
}

function loadSettings() {
    let shortcuts = browser.commands.getAll();
    shortcuts.then(getCurrentShortcuts);

    browser.storage.local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";
            if (settings_json["open-popup-default"] === undefined) settings_json["open-popup-default"] = "Ctrl+Alt+O";
            if (settings_json["open-popup-domain"] === undefined) settings_json["open-popup-domain"] = "Ctrl+Alt+D";
            if (settings_json["open-popup-page"] === undefined) settings_json["open-popup-page"] = "Ctrl+Alt+P";

            document.getElementById("open-by-default-select").value = settings_json["open-default"];
            document.getElementById("consider-parameters-select").value = settings_json["consider-parameters"];
            document.getElementById("consider-sections-select").value = settings_json["consider-sections"];

            let keyboardShortcutCtrlAltShiftDefault = document.getElementById("key-shortcut-ctrl-alt-shift-default-selected");
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
                let splitKeyboardShortcut = settings_json["open-popup-" + value].split("+");
                let letterNumberShortcut = splitKeyboardShortcut[splitKeyboardShortcut.length - 1];
                let ctrlAltShiftShortcut = settings_json["open-popup-" + value].substring(0, settings_json["open-popup-" + value].length - 2);
                keyboardShortcutLetterNumber.value = letterNumberShortcut;
                keyboardShortcutCtrlAltShift.value = ctrlAltShiftShortcut;

                let commandName = "_execute_browser_action";
                if (value === "domain") commandName = "opened-by-domain";
                else if (value === "page") commandName = "opened-by-page";

                document.getElementById("key-shortcut-ctrl-alt-shift-" + value + "-selected").onchange = function () {
                    settings_json["open-popup-" + value] = document.getElementById("key-shortcut-ctrl-alt-shift-" + value + "-selected").value + "+" + document.getElementById("key-shortcut-" + value + "-selected").value;
                    updateShortcut(commandName, settings_json["open-popup-" + value]);
                }
                document.getElementById("key-shortcut-" + value + "-selected").onchange = function () {
                    settings_json["open-popup-" + value] = document.getElementById("key-shortcut-ctrl-alt-shift-" + value + "-selected").value + "+" + document.getElementById("key-shortcut-" + value + "-selected").value;
                    updateShortcut(commandName, settings_json["open-popup-" + value]);
                }
            });
        }
        //console.log(JSON.stringify(settings_json));
    });
}

function saveSettings() {
    browser.storage.local.set({"settings": settings_json}, function () {
        //Saved
        let buttonSave = document.getElementById("save-settings-button");
        buttonSave.value = all_strings["saved-button"];
        setTimeout(function () {
            buttonSave.value = all_strings["save-settings-button"];
        }, 2000);
        //console.log(JSON.stringify(settings_json));
    });
}

function checkOperatingSystem() {
    let info = browser.runtime.getPlatformInfo();
    info.then(getOperatingSystem);
    //"mac", "win", "linux", "openbsd", "cros", ...
    // Docs: (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformOs)ˇ
}

function getOperatingSystem(info) {
    if (info.os === "mac") currentOS = "mac";
    else currentOS = "default";

    ctrl_alt_shift.forEach(value => {
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
    browser.commands.update({
        name: commandName, shortcut: shortcut
    });
}

loaded();