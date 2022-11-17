let settings_json = {
    "open-default": "domain",
    "consider-parameters": "yes",
    "consider-sections": "yes"
};

const all_strings = strings[languageToUse];
const link_translate = "https://crowdin.com/project/notefox";

function loaded() {
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
}

function loadSettings() {
    browser.storage.local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = "yes";
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = "yes";

            document.getElementById("open-by-default-select").value = settings_json["open-default"];
            document.getElementById("consider-parameters-select").value = settings_json["consider-parameters"];
            document.getElementById("consider-sections-select").value = settings_json["consider-sections"];
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

loaded();