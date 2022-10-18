let settings_json = {
    "open-default": "domain"
};

const all_strings = strings[languageToUse];

function loaded() {
    setLanguageUI();

    document.getElementById("save-settings-button").onclick = function () {
        saveSettings();
    }
    document.getElementById("open-by-default-select").onchange = function () {
        settings_json["open-default"] = document.getElementById("open-by-default-select").value;
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
}

function loadSettings() {
    browser.storage.local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            document.getElementById("open-by-default-select").value = settings_json["open-default"];
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