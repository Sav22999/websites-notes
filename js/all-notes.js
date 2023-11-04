let websites_json = {};
let websites_json_by_domain = {};
let websites_json_to_show = {};
let settings_json = {};
let notefox_json = {};

const all_strings = strings[languageToUse];

let colourListDefault = sortObjectByKeys({
    "red": all_strings["red-colour"],
    "yellow": all_strings["yellow-colour"],
    "black": all_strings["black-colour"],
    "orange": all_strings["orange-colour"],
    "pink": all_strings["pink-colour"],
    "purple": all_strings["purple-colour"],
    "gray": all_strings["grey-colour"],
    "green": all_strings["green-colour"],
    "blue": all_strings["blue-colour"],
    "white": all_strings["white-colour"],
    "aquamarine": all_strings["aquamarine-colour"],
    "turquoise": all_strings["turquoise-colour"],
    "brown": all_strings["brown-colour"],
    "coral": all_strings["coral-colour"],
    "cyan": all_strings["cyan-colour"],
    "darkgreen": all_strings["darkgreen-colour"],
    "violet": all_strings["violet-colour"],
    "lime": all_strings["lime-colour"],
    "fuchsia": all_strings["fuchsia-colour"],
    "indigo": all_strings["indigo-colour"],
    "lavender": all_strings["lavender-colour"],
    "teal": all_strings["teal-colour"],
    "navy": all_strings["navy-colour"],
    "olive": all_strings["olive-colour"],
    "plum": all_strings["plum-colour"],
    "salmon": all_strings["salmon-colour"],
    "snow": all_strings["snow-colour"]
});

let show_conversion_message_attention = false;

let sync_local = browser.storage.local;
checkSyncLocal();

let sort_by_selected = "name-az";
let filtersColors = [];
let filtersTypes = [];

function checkSyncLocal() {
    sync_local = browser.storage.local;
    browser.storage.local.get("storage").then(result => {
        if (result.storage === "sync") sync_local = browser.storage.sync;
        else {
            browser.storage.local.set({"storage": "local"});
            sync_local = browser.storage.local;
        }
        checkTheme();
    });
}

function loaded() {
    checkSyncLocal();
    setLanguageUI();
    checkTheme();

    /*
    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        //console.log("local: " + JSON.stringify(result));
    });
    browser.storage.sync.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        //console.log("sync: " + JSON.stringify(result));
    });
    */

    /*
    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        //console.log("1" + JSON.stringify(result));
        if (result.storage !== undefined && result.storage === "sync" && result.storage !== "local") {
            browser.storage.sync.get([
                "storage",
                "settings",
                "websites",
                "sticky-notes-coords",
                "sticky-notes-sizes",
                "sticky-notes-opacity"
            ]).then(result2 => {
                //console.log("2" + JSON.stringify(result2));
                if (JSON.stringify(result) !== `{"storage":"sync"}` && JSON.stringify(result2) !== JSON.stringify(result)) {
                    show_conversion_message_attention = true;
                }
                if (JSON.stringify(result2) === `{}`)
                    alert("Pay attention: from the version 3.3 data are synchronised with your Firefox account. To do this I've changed the way to save notes back-end. I've converted automatically data.\n" +
                        "Although it looks the process of conversion didn't work in your case. Keep calm! You didn't lose all your notes! I've inserted a button in the 'Import…' section which permits you to restore those data – the 'Get local data' button. You can press there and it should show you local data, then you need to press on 'Import' manually.\n" +
                        "If this doesn't work, please, contact me on GitHub, Telegram or via email. I'll support you! I'm so sorry about this inconvenience.\nIn the meanwhile you can set the saving of sync off: go to the addon Settings > Save locally instead of sync > Yes.");
            });
        }
    });
    */

    try {
        browser.storage.local.get([
            "storage"
        ]).then(result => {
            let property1 = all_strings["save-on-local-instead-of-sync"];
            let property2 = all_strings["settings-select-button-yes"];
            let alert_message = all_strings["disable-sync-message"]
            alert_message = alert_message.replace("{{property1}}", `<span class="button-code" id="string-save-on-local-instead-of-sync">${property1}</span>`);
            alert_message = alert_message.replace("{{property2}}", `<span class="button-code" id="string-save-on-local-instead-of-sync-yes">${property2}</span>`);
            document.getElementById("disable-sync").innerHTML = alert_message;

            if (result.storage !== undefined && result.storage === "sync") {
                if (document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.remove("hidden");
            } else {
                if (!document.getElementById("disable-sync").classList.contains("hidden")) document.getElementById("disable-sync").classList.add("hidden");
            }
        });

        document.getElementById("refresh-all-notes-button").onclick = function () {
            //location.reload();
            loadDataFromBrowser(true);
        }
        document.getElementById("settings-all-notes-button").onclick = function () {
            window.open("../settings/index.html", "_self");
        }
        document.getElementById("buy-me-a-coffee-button").onclick = function () {
            browser.tabs.create({url: links["donate"]});
        }
        document.getElementById("clear-all-notes-button").onclick = function () {
            clearAllNotes();
        }
        document.getElementById("import-all-notes-button").onclick = function () {
            importAllNotes();
        }
        document.getElementById("export-all-notes-button").onclick = function () {
            exportAllNotes();
        }
        document.getElementById("export-to-file-button").onclick = function () {
            const permissionsToRequest = {
                permissions: ["downloads"]
            }
            try {
                browser.permissions.request(permissionsToRequest).then(response => {
                    if (response) {
                        //granted / obtained
                        exportAllNotes(to_file = true);
                        //console.log("Granted");
                    } else {
                        //rejected
                        //console.log("Rejected!");
                    }
                });
            } catch (e) {
                console.error("P3)) " + e);
            }
        }
        document.getElementById("import-from-file-button").onclick = function () {
            importAllNotes(from_file = true);
        }

        document.getElementById("search-all-notes-text").onkeyup = function () {
            search(document.getElementById("search-all-notes-text").value);
        }

        document.getElementById("filter-all-notes-button").onclick = function () {
            if (document.getElementById("filters").classList.contains("hidden")) {
                //show because it's hidden
                document.getElementById("filters").classList.remove("hidden");
            } else {
                //hide because it's visible
                document.getElementById("filters").classList.add("hidden");
            }
        }

        document.getElementById("sort-by-all-notes-button").value = sort_by_selected;
        document.getElementById("sort-by-all-notes-button").onchange = function () {
            sort_by_selected = document.getElementById("sort-by-all-notes-button").value;
            loadAllWebsites(true, sort_by_selected);
        }

        setTimeout(function () {
            loadDataFromBrowser(true);
        }, 10);

        document.getElementById("all-notes-dedication-section").onscroll = function () {
            if (document.getElementById("all-notes-dedication-section").scrollTop > 30) {
                document.getElementById("actions").classList.add("section-selected");
            } else {
                if (document.getElementById("actions").classList.contains("section-selected")) {
                    document.getElementById("actions").classList.remove("section-selected");
                }
            }
        }
    } catch (e) {
        console.error(`E-L1: ${e}`);
    }

    let titleAllNotes = document.getElementById("title-all-notes-dedication-section");
    titleAllNotes.textContent = all_strings["all-notes-title"];
    let versionNumber = document.createElement("div");
    versionNumber.classList.add("float-right", "small-button");
    versionNumber.textContent = browser.runtime.getManifest().version;
    versionNumber.id = "version";
    notefox_json = {
        "version": browser.runtime.getManifest().version,
        "author": browser.runtime.getManifest().author,
        "manifest_version": browser.runtime.getManifest().manifest_version
    };
    titleAllNotes.append(versionNumber);
}

function setLanguageUI() {
    try {
        document.getElementById("refresh-all-notes-button").value = all_strings["refresh-data-button"];
        document.getElementById("clear-all-notes-button").value = all_strings["clear-all-notes-button"];
        document.getElementById("import-all-notes-button").value = all_strings["import-notes-button"];
        document.getElementById("export-all-notes-button").value = all_strings["export-all-notes-button"];
        document.getElementById("search-all-notes-text").placeholder = all_strings["search-textbox"];
        document.getElementById("settings-all-notes-button").value = all_strings["settings-button"];
        document.getElementById("buy-me-a-coffee-button").value = all_strings["donate-button"];
        //document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
        document.getElementById("filter-all-notes-button").value = all_strings["filter-button"];
        document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
        document.getElementById("sort-by-name-az-select").textContent = all_strings["sort-by-az-button"];
        document.getElementById("sort-by-name-za-select").textContent = all_strings["sort-by-za-button"];
        document.getElementById("sort-by-date-09-select").textContent = all_strings["sort-by-edit-first-button"];
        document.getElementById("sort-by-date-90-select").textContent = all_strings["sort-by-edit-last-button"];
        document.title = all_strings["all-notes-title-page"];

        document.getElementById("info-tooltip-search").title = all_strings["tooltip-info-search"];

        document.getElementById("text-import").innerHTML = all_strings["import-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
        document.getElementById("text-export").innerHTML = all_strings["export-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
        document.getElementById("cancel-import-all-notes-button").value = all_strings["cancel-button"];
        document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
        document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
        document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];

        let redFilterButton = document.getElementById("filter-tag-red-button");
        let yellowFilterButton = document.getElementById("filter-tag-yellow-button");
        let blackFilterButton = document.getElementById("filter-tag-black-button");
        let orangeFilterButton = document.getElementById("filter-tag-orange-button");
        let pinkFilterButton = document.getElementById("filter-tag-pink-button");
        let purpleFilterButton = document.getElementById("filter-tag-purple-button");
        let grayFilterButton = document.getElementById("filter-tag-gray-button");
        let greenFilterButton = document.getElementById("filter-tag-green-button");
        let blueFilterButton = document.getElementById("filter-tag-blue-button");
        let whiteFilterButton = document.getElementById("filter-tag-white-button");
        let noneFilterButton = document.getElementById("filter-tag-none-button");
        let globalFilterButton = document.getElementById("filter-type-global-button");
        let domainFilterButton = document.getElementById("filter-type-domain-button");
        let pageFilterButton = document.getElementById("filter-type-page-button");
        redFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["red-colour"]);
        redFilterButton.onclick = function () {
            //search("red");
            filterByColor("red", redFilterButton);
        };
        yellowFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["yellow-colour"]);
        yellowFilterButton.onclick = function () {
            filterByColor("yellow", yellowFilterButton);
        };
        blackFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["black-colour"]);
        blackFilterButton.onclick = function () {
            filterByColor("black", blackFilterButton);
        };
        orangeFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["orange-colour"]);
        orangeFilterButton.onclick = function () {
            filterByColor("orange", orangeFilterButton);
        };
        pinkFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["pink-colour"]);
        pinkFilterButton.onclick = function () {
            filterByColor("pink", pinkFilterButton);
        };
        purpleFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["purple-colour"]);
        purpleFilterButton.onclick = function () {
            filterByColor("purple", purpleFilterButton);
        };
        grayFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["grey-colour"]);
        grayFilterButton.onclick = function () {
            filterByColor("gray", grayFilterButton);
        };
        greenFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["green-colour"]);
        greenFilterButton.onclick = function () {
            filterByColor("green", greenFilterButton);
        };
        blueFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["blue-colour"]);
        blueFilterButton.onclick = function () {
            filterByColor("blue", blueFilterButton);
        };
        whiteFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["white-colour"]);
        whiteFilterButton.onclick = function () {
            filterByColor("white", whiteFilterButton);
        };
        noneFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["none-colour"]);
        noneFilterButton.onclick = function () {
            filterByColor("none", noneFilterButton);
        };
        globalFilterButton.value = (all_strings["filter-by-type-button"] + "").replaceAll("{{type}}", all_strings["global-label"]);
        globalFilterButton.onclick = function () {
            filterByType("global", globalFilterButton);
        };
        domainFilterButton.value = (all_strings["filter-by-type-button"] + "").replaceAll("{{type}}", all_strings["domain-label"]);
        domainFilterButton.onclick = function () {
            filterByType("domain", domainFilterButton);
        };
        pageFilterButton.value = (all_strings["filter-by-type-button"] + "").replaceAll("{{type}}", all_strings["page-label"]);
        pageFilterButton.onclick = function () {
            filterByType("page", pageFilterButton);
        };
    } catch (e) {
        console.error(`E-L2: ${e}`);
    }
}

function filterByColor(color, tagButton) {
    if (filtersColors.indexOf(color) !== -1) {
        //present: remove red
        filtersColors.splice(filtersColors.indexOf(color), 1);
        tagButton.classList.remove("button-sel");
    } else {
        //not present: add red
        filtersColors.push(color);
        tagButton.classList.add("button-sel");
    }
    applyFilter();
}

function filterByType(type, tagButton) {
    if (filtersTypes.indexOf(type) !== -1) {
        //present: remove red
        filtersTypes.splice(filtersTypes.indexOf(type), 1);
        tagButton.classList.remove("button-sel");
    } else {
        //not present: add red
        filtersTypes.push(type);
        tagButton.classList.add("button-sel");
    }
    applyFilter();
}

function loadDataFromBrowser(generate_section = true) {
    try {
        sync_local.get("websites", function (value) {
            websites_json = {};
            if (value["websites"] !== undefined) {
                websites_json = value["websites"];
                websites_json_to_show = websites_json;
            }
            if (generate_section) {
                websites_json_by_domain = {};
                loadAllWebsites(true, sort_by_selected);
            }
            //console.log(JSON.stringify(websites_json));
        });
        sync_local.get("settings", function (value) {
            settings_json = {};
            if (value["settings"] !== undefined) {
                settings_json = value["settings"];
            }
            //console.log(JSON.stringify(settings_json));
        });
        applyFilter();
    } catch (e) {
        console.error(`E-L3: ${e}`);
    }
}

function clearAllNotes() {
    let confirmationClearAllNotes = confirm(all_strings["clear-all-notes-confirmation"]);
    if (confirmationClearAllNotes) {
        sync_local.set({
            "websites": undefined,
            "settings": undefined,
            "sticky-notes-coords": undefined,
            "sticky-notes-sizes": undefined,
            "sticky-notes-opacity": undefined
        }).then(result => {
            websites_json_to_show = {};
            loadDataFromBrowser(true);
        });
    }
}

function clearAllNotesDomain(url) {
    let confirmation = confirm(all_strings["clear-all-notes-domain-confirmation"]);
    if (confirmation) {
        for (let index in websites_json_by_domain[url]) {
            //delete all pages
            delete websites_json[url + "" + websites_json_by_domain[url][index]];
            websites_json_to_show = websites_json;
        }
        //delete domain
        delete websites_json[url];
        websites_json_to_show = websites_json;

        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
        });
    }
}

function clearAllNotesPage(url, isDomain = false) {
    let messageToShow = all_strings["clear-all-notes-page-without-url-confirmation"];
    if (!isDomain) {
        messageToShow = all_strings["clear-all-notes-page-with-confirmation"].replaceAll("{{url}}", url);
    }
    let confirmation = confirm(messageToShow);
    if (confirmation) {
        //delete the selected page
        delete websites_json[url];
        websites_json_to_show = websites_json;

        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
        });
    }
}

function onCleared() {
    //all notes clear || successful
    loadDataFromBrowser(true);
    //loadAllWebsites(true, true);
}

function onError(e) {
    console.error(e);
}

function importAllNotes(from_file = false) {
    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity",
    ]).then(result => {
        let jsonImportElement = document.getElementById("json-import");
        let json_old_version = {};

        document.getElementById("import-from-file-button").value = all_strings["import-notes-from-file-button"];

        //console.log(JSON.stringify(result));
        if (show_conversion_message_attention) {
            if (document.getElementById("import-now-all-notes-from-local-button")) {
                document.getElementById("import-now-all-notes-from-local-button").onclick = function () {
                    result["notefox"] = {};
                    result["notefox"]["version"] = "3.2";
                    result["storage"] = "sync";
                    result["sticky-notes"] = {};
                    result["sticky-notes"]["coords"] = result["sticky-notes-coords"];
                    result["sticky-notes"]["sizes"] = result["sticky-notes-sizes"];
                    result["sticky-notes"]["opacity"] = result["sticky-notes-opacity"];
                    delete result["sticky-notes-coords"];
                    delete result["sticky-notes-sizes"];
                    delete result["sticky-notes-opacity"];
                    jsonImportElement.value = JSON.stringify(result);
                    json_old_version = result;
                }
            }
        } else {
            if (document.getElementById("import-now-all-notes-from-local-button")) document.getElementById("import-now-all-notes-from-local-button").remove();
        }

        let n_errors = 0;
        showBackgroundOpacity();
        document.getElementById("import-section").style.display = "block";
        jsonImportElement.value = "";
        jsonImportElement.focus();

        document.getElementById("cancel-import-all-notes-button").onclick = function () {
            hideBackgroundOpacity();
            document.getElementById("import-section").style.display = "none";
        }
        document.getElementById("import-now-all-notes-button").onclick = function () {
            let value = jsonImportElement.value;
            if (value.replaceAll(" ", "") !== "") {
                let error = false;
                let error_description = "";
                try {
                    //json_to_export = {"notefox": notefox_json, "websites": websites_json, "settings": settings_json, "sticky-notes": sticky_notes_json};
                    let json_to_export_temp = JSON.parse(value);
                    let continue_ok = false;
                    let cancel = false;
                    if (json_to_export_temp["notefox"] === undefined || (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["notefox"]["version"] === undefined)) {
                        //version before 2.0 (export in a different way)
                        cancel = !confirm(all_strings["notefox-version-too-old-try-to-import-data-anyway"]);
                        if (!cancel) {
                            websites_json = json_to_export_temp;
                            websites_json_to_show = websites_json;
                        }
                    }
                    if (json_to_export_temp["notefox"] !== undefined) {
                        let check_version = checkTwoVersions(json_to_export_temp["notefox"]["version"], "3.3.1.8");
                        if (check_version === "<") {
                            cancel = !confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                            continue_ok = !cancel
                        } else {
                            continue_ok = true;
                        }
                    } else {
                        cancel = !confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                        continue_ok = !cancel;
                    }

                    let sticky_notes = {};

                    if (continue_ok) {
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["websites"] !== undefined) {
                            websites_json = json_to_export_temp["websites"];
                            websites_json_to_show = websites_json;
                        }
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["settings"] !== undefined) settings_json = json_to_export_temp["settings"];
                        if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["sticky-notes"] !== undefined) {
                            if (json_to_export_temp["sticky-notes"].coords !== undefined) sticky_notes.coords = json_to_export_temp["sticky-notes"].coords;

                            if (json_to_export_temp["sticky-notes"].sizes !== undefined) sticky_notes.sizes = json_to_export_temp["sticky-notes"].sizes;

                            if (json_to_export_temp["sticky-notes"].opacity !== undefined) sticky_notes.opacity = json_to_export_temp["sticky-notes"].opacity;

                            if (sticky_notes.coords === undefined || sticky_notes.coords === null) sticky_notes.coords = {
                                x: "20px",
                                y: "20px"
                            };
                            if (sticky_notes.sizes === undefined || sticky_notes.sizes === null) sticky_notes.sizes = {
                                w: "300px",
                                h: "300px"
                            };
                            if (sticky_notes.opacity === undefined || sticky_notes.opacity === null) sticky_notes.opacity = {value: 0.7};
                        }
                    }

                    //console.log(JSON.stringify(json_to_export_temp));

                    browser.storage.local.get([
                        "storage"
                    ]).then(resultSyncOrLocalToUse => {
                            let storageTemp;
                            if (json_to_export_temp["storage"] !== undefined) storageTemp = json_to_export_temp["storage"];

                            if (storageTemp === undefined && resultSyncOrLocalToUse["storage"] !== undefined) storageTemp = resultSyncOrLocalToUse["storage"];
                            else if ((storageTemp === "sync" || storageTemp === "local")) storageTemp = storageTemp; //do not do anything
                            else storageTemp = "local";

                            if (continue_ok) {
                                browser.storage.local.set({"storage": storageTemp}).then(resultSyncLocal => {
                                    checkSyncLocal();

                                    document.getElementById("import-now-all-notes-button").disabled = true;
                                    document.getElementById("cancel-import-all-notes-button").disabled = true;
                                    document.getElementById("import-now-all-notes-button").value = all_strings["importing-button"];
                                    setTimeout(function () {
                                        document.getElementById("import-now-all-notes-button").disabled = false;
                                        document.getElementById("cancel-import-all-notes-button").disabled = false;
                                        document.getElementById("import-now-all-notes-button").value = all_strings["imported-button"];
                                        setTimeout(function () {
                                            document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
                                        }, 500);
                                        sync_local.set({
                                            "websites": websites_json,
                                            "settings": settings_json,
                                            "sticky-notes-coords": sticky_notes.coords,
                                            "sticky-notes-sizes": sticky_notes.sizes,
                                            "sticky-notes-opacity": sticky_notes.opacity
                                        }).then(function () {
                                            //Imported all correctly
                                            sync_local.get([
                                                "settings",
                                                "websites",
                                                "sticky-notes-coords",
                                                "sticky-notes-sizes",
                                                "sticky-notes-opacity"
                                            ]).then(result => {
                                                //console.log(JSON.stringify(storageTemp));
                                                if (storageTemp === "sync") {
                                                    if (JSON.stringify(json_old_version) === jsonImportElement.value) {
                                                        browser.storage.local.clear().then(result1 => {
                                                            browser.storage.local.set({"storage": "sync"})
                                                        });
                                                    } else browser.storage.local.set({"storage": "sync"})
                                                } else {
                                                    if (JSON.stringify(json_old_version) === jsonImportElement.value) {
                                                        browser.storage.local.clear().then(result1 => {
                                                            browser.storage.local.set({"storage": "local"})
                                                        });
                                                    } else browser.storage.local.set({"storage": "local"})
                                                }
                                            })
                                            ;
                                            loadDataFromBrowser(true);

                                            document.getElementById("import-section").style.display = "none";
                                            hideBackgroundOpacity()
                                        }).catch(function (error) {
                                            console.error("E10: " + error);
                                        });
                                    }, 2000);
                                });
                            }
                        }
                    )
                    ;


                    if (!continue_ok && !cancel) {
                        error = true;
                        error_description = "One or more parameters are not correct and it's not possible import data.";
                    }
                    //console.log(JSON.stringify(json_to_export_temp));
                } catch
                    (e) {
                    //console.log("Error: " + e.toString());
                    error = true;
                    error_description = e.toString()
                }

                if (error) {
                    let errorSubSection = document.createElement("div");
                    errorSubSection.classList.add("sub-section", "background-light-red");
                    errorSubSection.id = "error-message-" + n_errors;
                    errorSubSection.textContent = "Error: " + error_description;
                    setTimeout(function () {
                        errorSubSection.remove();
                    }, 10000);
                    n_errors++;

                    let mainSection = document.getElementById("import-sub-sections");
                    mainSection.insertBefore(errorSubSection, mainSection.childNodes[0]);
                }
            }
        }

        if (from_file) {
            importFromFile();
        }
    });
}

function importFromFile() {
    try {
        let input = document.getElementById("import-from-file-input-hidden");
        input.value = ""; //Reset to empty
        input.onchange = function (e) {
            const file = this.files[0];
            //console.log(file);
            if (file === undefined || file.name === '') {
                return;
            }
            if (file.type === undefined || file.type !== undefined && file.type !== "application/json") {
                return;
            }

            const filename = file.name;

            const fileReaderOnLoadHandler = function () {
                let data = undefined;
                try {
                    data = JSON.parse(this.result);
                    //console.log(data);

                    document.getElementById("json-import").value = JSON.stringify(data);
                    document.getElementById("import-now-all-notes-button").click();
                } catch (e) {
                    console.error(`I-E2: ${e}`)
                }
            };

            const fr = new FileReader();
            fr.onload = fileReaderOnLoadHandler;
            fr.readAsText(file);
        };
        input.click();
    } catch (e) {
        console.error(`I-E1: ${e}`);
    }
}

function exportAllNotes(to_file = false) {
    showBackgroundOpacity();
    browser.storage.local.get(["storage"]).then(getStorageTemp => {
        sync_local.get([
            "sticky-notes-coords",
            "sticky-notes-opacity",
            "sticky-notes-sizes",
        ]).then((result) => {
            // Handle the result
            let sticky_notes = {};
            sticky_notes.coords = result["sticky-notes-coords"];
            sticky_notes.sizes = result["sticky-notes-sizes"];
            sticky_notes.opacity = result["sticky-notes-opacity"];

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

            document.getElementById("export-section").style.display = "block";
            json_to_export = {
                "notefox": notefox_json,
                "settings": settings_json,
                "websites": websites_json,
                "sticky-notes": sticky_notes,
                "storage": getStorageTemp["storage"]
            };
            document.getElementById("json-export").value = JSON.stringify(json_to_export);

            document.getElementById("cancel-export-all-notes-button").onclick = function () {
                hideBackgroundOpacity();
                document.getElementById("export-section").style.display = "none";

                document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
                document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];
            }
            document.getElementById("copy-now-all-notes-button").onclick = function () {
                document.getElementById("cancel-export-all-notes-button").value = all_strings["close-button"];
                document.getElementById("copy-now-all-notes-button").value = all_strings["copied-button"];

                document.getElementById("json-export").value = JSON.stringify(json_to_export);
                document.getElementById("json-export").select();
                document.execCommand("copy");
            }

            document.getElementById("export-to-file-button").value = all_strings["export-notes-to-file-button"];
            if (to_file) {
                exportToFile();
            }
        }).catch((e) => {
            console.error(`E-E2: ${e}`);
        });
    });
}

function exportToFile() {
    const data = JSON.stringify(json_to_export);
    const blob = new Blob([data], {type: "application/json"});

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-based, so add 1
    const day = String(today.getDate()).padStart(2, '0');

    const formattedDate = `${year}_${month}_${day}`;

    browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: "notefox_" + notefox_json.version.toString() + "_" + formattedDate + "_" + Date.now() + ".json",
        saveAs: false, // Show the file save dialog
    });

    setTimeout(function () {
        if (document.getElementById("export-section").style.display !== "none") {
            document.getElementById("cancel-export-all-notes-button").click();
        }
    }, 1000);

    document.getElementById("cancel-export-all-notes-button").value = all_strings["close-button"];
    document.getElementById("export-to-file-button").value = all_strings["exported-notes-to-file-button"];
}

function showBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "block";
}

function hideBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "none";
}

function loadAllWebsites(clear = false, sort_by = "name-az", apply_filter = true) {
    try {
        if (clear) {
            document.getElementById("all-website-sections").textContent = "";
        }
        let n_websites = 0;
        if (!isEmpty(websites_json_to_show)) {
            //there are websites saved

            websites_json_by_domain = [];

            for (let domain in websites_json_to_show) {
                if (websites_json_to_show[domain]["type"] === undefined) {
                    websites_json_to_show[domain]["type"] = 1;
                    websites_json_to_show[domain]["domain"] = "";
                    websites_json_to_show[domain]["tag-colour"] = "none";
                }


                if (websites_json_to_show[domain]["type"] === 0 || websites_json_to_show[domain]["type"] === 1 && websites_json_to_show[domain]["domain"] === "") {
                    //global (0) or domain (1)
                    if (websites_json_by_domain[domain] === undefined) {
                        websites_json_by_domain[domain] = [];
                    }
                } else {
                    //page
                    let root_domain = websites_json_to_show[domain]["domain"];
                    let domain_to_add = domain.replace(root_domain, "");
                    if (websites_json_by_domain[root_domain] === undefined) {
                        websites_json_by_domain[root_domain] = [];
                    }
                    if (websites_json_by_domain[root_domain].indexOf(domain_to_add) === -1) {
                        websites_json_by_domain[root_domain].push(domain_to_add);
                    }
                }

                if (websites_json_to_show[domain]["tag-colour"] === undefined) {
                    websites_json_to_show[domain]["tag-colour"] = "none";
                }
            }
            //console.log(JSON.stringify(websites_json_by_domain));

            websites_json_by_domain = sortOnKeys(websites_json_by_domain, websites_json_to_show, sort_by);
            //console.log(JSON.stringify(sortOnKeys(websites_json_by_domain, websites_json_to_show, "date-90")));

            for (let domain in websites_json_by_domain) {
                if (domain !== undefined && domain !== "undefined" && domain !== "") {
                    n_websites++;

                    websites_json_by_domain[domain].sort();

                    let section = document.createElement("div");
                    section.classList.add("section", "section-domain");

                    //console.log(domain);

                    if (domain !== "**global") {
                        let input_clear_all_notes_domain = document.createElement("input");
                        input_clear_all_notes_domain.type = "button";
                        input_clear_all_notes_domain.value = all_strings["clear-all-notes-of-this-domain-button"];
                        input_clear_all_notes_domain.classList.add("button", "float-right", "margin-top-5-px", "margin-right-5-px", "small-button", "clear-button");
                        input_clear_all_notes_domain.onclick = function () {
                            clearAllNotesDomain(domain);
                        }
                        section.append(input_clear_all_notes_domain);

                        let h2 = document.createElement("h2");
                        h2.textContent = domain;
                        if (isUrlSupported(domain)) {
                            h2.classList.add("link", "go-to-external");
                            h2.onclick = function () {
                                browser.tabs.create({url: domain});
                            }
                        }
                        section.append(h2);
                    }

                    let all_pages = document.createElement("div");

                    //console.log(JSON.stringify(websites_json_by_domain[domain]));
                    let pages_added = 0;

                    if (websites_json_to_show[domain] !== undefined) {
                        //there is notes also for the domain
                        let urlPageDomain = domain;
                        let page = document.createElement("div");
                        page.classList.add("sub-section");
                        let lastUpdate = websites_json_to_show[urlPageDomain]["last-update"];
                        let notes = websites_json_to_show[urlPageDomain]["notes"];
                        let title = websites_json_to_show[urlPageDomain]["title"];

                        let type_to_show = all_strings["domain-label"];
                        let type_to_use = "domain";
                        if (domain === getGlobalUrl()) {
                            type_to_show = all_strings["global-label"];
                            type_to_use = "global";
                        }
                        page = generateNotes(page, urlPageDomain, notes, title, lastUpdate, type_to_show, urlPageDomain, type_to_use, true);

                        if (page !== -1) {
                            all_pages.append(page);
                            pages_added++;
                        }
                    }

                    if (domain !== getGlobalUrl()) {
                        for (let index = 0; index < websites_json_by_domain[domain].length; index++) {
                            let urlPage = websites_json_by_domain[domain][index];
                            let urlPageDomain = domain + websites_json_by_domain[domain][index];
                            if (websites_json_to_show[urlPageDomain] !== undefined) {
                                let page = document.createElement("div");
                                page.classList.add("sub-section");

                                // console.log(urlPageDomain);
                                // console.log(websites_json_by_domain);
                                // console.log(websites_json_to_show);
                                let lastUpdate = websites_json_to_show[urlPageDomain]["last-update"];
                                let notes = websites_json_to_show[urlPageDomain]["notes"];
                                let title = websites_json_to_show[urlPageDomain]["title"];

                                page = generateNotes(page, urlPage, notes, title, lastUpdate, all_strings["page-label"], urlPageDomain, "page", false);

                                if (page !== -1) {
                                    all_pages.append(page);
                                    pages_added++;
                                }
                            }
                        }
                    }

                    if (pages_added > 0) section.append(all_pages);

                    document.getElementById("all-website-sections").append(section);
                }
            }
        }

        if (n_websites === 0) {
            //no websites
            let section = document.createElement("div");
            section.classList.add("section-empty");
            section.textContent = all_strings["no-notes-found-text"];

            document.getElementById("all-website-sections").append(section);
        } else {
            if (apply_filter) {
                applyFilter();
            }
        }
    } catch (e) {
        console.error(`E-L4: ${e}`);
    }
}


function getGlobalUrl() {
    return "**global";
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
        case "moz-extension":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disables all unsupported website
            valueToReturn = false;//TODO!TESTING | true->for testing, false->stable release
    }
    return valueToReturn;
}

function applyFilter() {
    search(document.getElementById("search-all-notes-text").value);
}

function search(value = "") {
    try {
        //console.log(JSON.stringify(websites_json_to_show))
        websites_json_to_show = {};
        document.getElementById("search-all-notes-text").value = value.toString();
        let valueToUse = value.toLowerCase().split(";");
        let results = document.getElementById("results-searching");
        let keywordsHTML = "";
        let valid_results = 0;
        valueToUse.forEach(key => {
            if (key.replaceAll(" ", "") !== "") {
                keywordsHTML += `<span class='button-code result-button'>${key}</span>`;
                valid_results++;
            }
        });
        results.innerHTML = all_strings["label-results-for"].replaceAll("{{keywords}}", keywordsHTML);
        if (valid_results > 0) {
            if (results.classList.contains("hidden")) results.classList.remove("hidden");
        } else results.classList.add("hidden");
        for (const website in websites_json) {
            let current_website_json = websites_json[website];
            let condition_tag_color = filtersColors.indexOf(current_website_json["tag-colour"].toLowerCase()) !== -1 || filtersColors.length === 0;
            let condition_type = filtersTypes.indexOf(getType(websites_json[website], website)) !== -1 || filtersTypes.length === 0;
            //if (condition_type) console.log(getType(websites_json[website], website) + "   " + JSON.stringify(websites_json[website]))
            let title_to_use = "";
            if (current_website_json["title"] !== undefined) title_to_use = current_website_json["title"].toLowerCase();
            valueToUse.forEach(key => {
                if (valid_results > 0 && key.replaceAll(" ", "") !== "" || valid_results === 0) {
                    if ((current_website_json["notes"].toLowerCase().includes(key) || current_website_json["domain"].toLowerCase().includes(key) || current_website_json["last-update"].toLowerCase().includes(key) || title_to_use.includes(key) || website.includes(key)) && condition_tag_color && condition_type) {
                        websites_json_to_show[website] = websites_json[website];
                    }
                }
            });
            //console.log(valueToUse)
        }
        loadAllWebsites(true, sort_by_selected, false);
    } catch (e) {
        console.error(`E-S1: ${e}`);
    }
}

function getType(website, url) {
    let valueToReturn = "";
    if (website !== undefined && website["domain"] !== undefined && url !== undefined) {
        if (url === "**global") valueToReturn = "global";
        else if (website["domain"] !== "") valueToReturn = "page";
        else valueToReturn = "domain";
    }
    return valueToReturn;
}

function sortObjectByKeys(o) {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

function generateNotes(page, url, notes, title, lastUpdate, type, fullUrl, type_to_use, domain_again) {
    try {
        let row1 = document.createElement("div");
        row1.classList.add("rows");

        let pageType = document.createElement("div");
        pageType.classList.add("sub-section-type");
        pageType.textContent = type;

        let input_clear_all_notes_page = document.createElement("input");

        input_clear_all_notes_page.type = "button";
        input_clear_all_notes_page.value = all_strings["clear-notes-of-this-page-button"];
        input_clear_all_notes_page.classList.add("button", "float-right", "very-small-button", "clear2-button");
        input_clear_all_notes_page.onclick = function () {
            let isDomain = false;
            if (fullUrl === url) {
                isDomain = true;
            }
            clearAllNotesPage(fullUrl, isDomain);
        }
        let inputCopyNotes = document.createElement("input");

        inputCopyNotes.type = "button";
        inputCopyNotes.value = all_strings["copy-notes-button"];
        inputCopyNotes.classList.add("button", "float-right", "very-small-button", "margin-right-5-px", "copy-button");
        inputCopyNotes.onclick = function () {
            copyNotes(textNotes, notes);
            inputCopyNotes.value = all_strings["copied-button"];
            setTimeout(function () {
                inputCopyNotes.value = all_strings["copy-notes-button"];
                textNotes.innerHTML = notes;
            }, 3000);
        }

        let tagsColour = document.createElement("select");

        let colourList = colourListDefault;
        colourList = Object.assign({}, {"none": all_strings["none-colour"]}, colourList);
        for (let colour in colourList) {
            let tagColour = document.createElement("option");
            tagColour.value = colour;
            if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tag-colour"] !== undefined && websites_json[fullUrl]["tag-colour"] === colour) {
                tagColour.selected = true;
                page.classList.add("tag-colour-left", "tag-colour-" + colour, "sub-section-domain");
            }
            tagColour.textContent = colourList[colour];
            //tagColour.classList.add(colour + "-background-tag");
            tagsColour.classList.add("button", "float-right", "very-small-button", "margin-right-5-px", "tag-button");
            tagsColour.append(tagColour);
        }
        tagsColour.onchange = function () {
            changeTagColour(fullUrl, tagsColour.value, type_to_use);
        }
        page.id = fullUrl;

        row1.append(pageType)

        row1.append(input_clear_all_notes_page);
        row1.append(inputCopyNotes);
        row1.append(tagsColour);

        if (type_to_use.toLowerCase() !== "domain" && type_to_use.toLowerCase() !== "global") {
            //it's a page
            let pageUrl = document.createElement("h3");
            pageUrl.textContent = url;

            if (isUrlSupported(fullUrl)) {
                pageUrl.classList.add("link", "go-to-external");
                pageUrl.onclick = function () {
                    browser.tabs.create({url: fullUrl});
                }
            }

            row1.append(pageUrl);
        }

        page.append(row1);

        if (title !== undefined && title !== "") {
            let row2 = document.createElement("div");
            row2.classList.add("rows");

            let pageTitle = document.createElement("div");
            pageTitle.classList.add("sub-section-title");
            pageTitle.textContent = all_strings["title-label"];

            let pageTitleH3 = document.createElement("h3");
            pageTitleH3.classList.add("title");
            pageTitleH3.textContent = title;
            row2.append(pageTitle)
            row2.append(pageTitleH3);
            page.append(row2);
        }

        let pageNotes = document.createElement("pre");
        pageNotes.classList.add("sub-section-notes");

        let textNotesContainer = document.createElement("div");
        textNotesContainer.classList.add("div-textnotes-container");
        let textNotes = document.createElement("div");
        textNotes.readOnly = true;
        textNotes.innerHTML = notes;
        textNotes.contentEditable = false;
        textNotes.classList.add("textarea-all-notes");
        let disable_word_wrap = false;
        if (settings_json["disable-word-wrap"] !== undefined) {
            if (settings_json["disable-word-wrap"] === "yes") disable_word_wrap = true;
            else disable_word_wrap = false;
        }
        if (disable_word_wrap) {
            textNotes.whiteSpace = "none";
        } else {
            textNotes.style.whiteSpace = "pre-wrap";
        }
        textNotesContainer.appendChild(textNotes);

        pageNotes.append(textNotesContainer);

        page.append(pageNotes);

        let pageLastUpdate = document.createElement("div");
        pageLastUpdate.classList.add("sub-section-last-update");
        pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", lastUpdate);
        page.append(pageLastUpdate);

        return page;
    } catch (e) {
        console.error(`E-G1: ${e}`);

        return undefined;
    }
}

function changeTagColour(url, colour) {
    sync_local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        }
        //console.log(`url ${url}`);
        websites_json[url]["tag-colour"] = colour;
        websites_json_to_show = websites_json;
        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
            hideBackgroundOpacity();
        });
    });
}

function copyNotes(page, text) {
    let div_sanitize = document.createElement("div");
    div_sanitize.innerHTML = text;
    page.innerHTML = sanitize(div_sanitize, -1, -1).innerHTML;
    var range = document.createRange();
    range.selectNodeContents(page);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    //page.select();
    //document.execCommand("select")
    document.execCommand("copy");
    page.innerText = text;
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0
}

/**
 * Sort websites
 * @param dict the dictionary to sort
 * @param sort_by how to sort {name-az, name-za, date-09, date-90}
 * @returns {{}} returns the dictionary (websites) sorted
 */
function sortOnKeys(dict, dict2, sort_by) {
    try {
        //console.log(JSON.stringify(dict))
        //console.log(JSON.stringify(dict2))

        let tempDict = {};

        //console.log(JSON.stringify(tempDict));

        if (sort_by !== "name-az" && sort_by !== "name-za" && sort_by !== "date-09" && sort_by !== "date-90") sort_by = "name-az";
        if (sort_by === "name-az") {
            //Sort by name: from "A" to "Z"
            tempDict = {};
            var sorted = [];
            for (var key in dict) {
                sorted[sorted.length] = key;
            }
            sorted.sort();

            for (let i = 0; i < sorted.length; i++) {
                tempDict[sorted[i]] = dict[sorted[i]];
            }
        } else if (sort_by === "name-za") {
            //Sort by name: from "Z" to "A"
            tempDict = {};
            var sorted = [];
            for (var key in dict) {
                sorted[sorted.length] = key;
            }
            sorted.sort().reverse();

            for (let i = 0; i < sorted.length; i++) {
                tempDict[sorted[i]] = dict[sorted[i]];
            }
        } else if (sort_by === "date-09") {
            //Sort by updated date: from the newer to the oldest
            //for the same domain: get its MIN date, and sort by that
            let dictToSortDate = {};
            for (let domain in dict) {
                dictToSortDate[domain] = {};
                dictToSortDate[domain]["last-update"] = null;
                dictToSortDate[domain]["pages"] = [];
                if (dict2[domain] !== undefined) dictToSortDate[domain]["last-update"] = dict2[domain]["last-update"];
                for (let website in dict2) {
                    if (website.includes(domain)) {
                        let date1 = new Date(dict2[website]["last-update"]);
                        let date2 = new Date(dictToSortDate[domain]["last-update"]);
                        if (dictToSortDate[domain]["last-update"] === null || dictToSortDate[domain]["last-update"] !== null && date1 < date2) dictToSortDate[domain]["last-update"] = dict2[website]["last-update"];
                    }
                }
            }

            const sortedEntries = Object.entries(dictToSortDate).sort(([, a], [, b]) => {
                const dateA = new Date(a["last-update"]);
                const dateB = new Date(b["last-update"]);
                return dateA - dateB;
            });


            let temp2 = {};
            var sorted = [];
            for (var key in dict) {
                sorted[sorted.length] = key;
            }
            sorted.sort();

            for (let i = 0; i < sorted.length; i++) {
                temp2[sorted[i]] = dict[sorted[i]];
            }

            let tempDict2 = Object.fromEntries(sortedEntries);

            for (let temp in tempDict2) {
                tempDict[temp] = temp2[temp];
            }
        } else if (sort_by === "date-90") {
            //Sort by updated date: from the oldest to the newer
            //for the same domain: get its MAX date, and sort by that
            let dictToSortDate = {};
            for (let domain in dict) {
                dictToSortDate[domain] = {};
                dictToSortDate[domain]["last-update"] = null;
                dictToSortDate[domain]["pages"] = [];
                if (dict2[domain] !== undefined) dictToSortDate[domain]["last-update"] = dict2[domain]["last-update"];
                for (let website in dict2) {
                    if (website.includes(domain)) {
                        let date1 = new Date(dict2[website]["last-update"]);
                        let date2 = new Date(dictToSortDate[domain]["last-update"]);
                        if (dictToSortDate[domain]["last-update"] === null || dictToSortDate[domain]["last-update"] !== null && date1 > date2) dictToSortDate[domain]["last-update"] = dict2[website]["last-update"];
                    }
                }
            }

            const sortedEntries = Object.entries(dictToSortDate).sort(([, a], [, b]) => {
                const dateA = new Date(a["last-update"]);
                const dateB = new Date(b["last-update"]);
                return dateB - dateA;
            });

            let temp2 = {};
            var sorted = [];
            for (var key in dict) {
                sorted[sorted.length] = key;
            }
            sorted.sort();

            for (let i = 0; i < sorted.length; i++) {
                temp2[sorted[i]] = dict[sorted[i]];
            }

            let tempDict2 = Object.fromEntries(sortedEntries);

            for (let temp in tempDict2) {
                tempDict[temp] = temp2[temp];
            }
        }
        //console.log(JSON.stringify(tempDict));

        return tempDict;
    } catch (e) {
        console.error(`E-S2: ${e}`);

        return undefined;
    }
}

/**
 * Compare two versions (they have to be in this form: W.Z.Y.Z, it's ok also sub-parts of it: W, W.Z, W.Z.Y)
 * @param version1 the first version
 * @param version2 the second version
 * @returns {string} ">" the first version is major than the second one, "=" equals, "<" minor, "!" wrong version form
 */
function checkTwoVersions(version1, version2) {
    let valueToReturn = "";

    let v1 = version1.toString().split(".");
    let v2 = version2.toString().split(".");

    if (v1.length > 0 && v2.length > 0 && v1[0].length > 0 && v2[0].length > 0) {
        if (parseInt(v1[0]) > parseInt(v2[0])) {
            valueToReturn = ">"
        } else if (parseInt(v1[0]) < parseInt(v2[0])) {
            valueToReturn = "<";
        } else {
            let index = 1;
            while (index < 4 && valueToReturn === "") {
                if (v1.length > 0 && v2.length > 0) {
                    if (v1.length === index && v2.length === index) {
                        valueToReturn = "=";
                    } else if (v1.length > index && v2.length === index) {
                        if (v1[index] !== "0") valueToReturn = ">";
                        else valueToReturn = "=";
                    } else if (v1.length === index && v2.length > index) {
                        if (v2[index] !== "0") valueToReturn = "<";
                        else valueToReturn = "=";
                    } else {
                        if (parseInt(v1[index]) > parseInt(v2[index])) valueToReturn = ">";
                        else if (parseInt(v1[index]) < parseInt(v2[index])) valueToReturn = "<";
                        else {
                            if (!(v1.length > index + 1 || v2.length > index + 1)) valueToReturn = "=";
                        }
                    }
                } else {
                    valueToReturn = "!";
                }
                index++;
            }
        }
    } else {
        valueToReturn = "!";
    }

    return valueToReturn;
}


function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        document.getElementById("all-notes-dedication-section").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("all-notes-dedication-section").style.color = primary;
        document.getElementById("export-sub-sections").style.cssText = 'opacity:1 !important';
        document.getElementById("import-sub-sections").style.cssText = 'opacity:1 !important';
        var open_external_svg = window.btoa(getIconSvgEncoded("open-external", primary));
        var donate_svg = window.btoa(getIconSvgEncoded("donate", on_primary));
        var settings_svg = window.btoa(getIconSvgEncoded("settings", on_primary));
        var import_svg = window.btoa(getIconSvgEncoded("import", on_primary));
        var export_svg = window.btoa(getIconSvgEncoded("export", on_primary));
        var download_svg = window.btoa(getIconSvgEncoded("download", on_primary));
        var delete_svg = window.btoa(getIconSvgEncoded("delete", on_primary));
        var delete2_svg = window.btoa(getIconSvgEncoded("delete2", on_primary));
        var copy_svg = window.btoa(getIconSvgEncoded("copy", on_primary));
        var filter = window.btoa(getIconSvgEncoded("filter", on_primary));
        var sort_by = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        var tag_svg = window.btoa(getIconSvgEncoded("tag", on_primary));
        var refresh_svg = window.btoa(getIconSvgEncoded("refresh", on_primary));
        var sort_by_svg = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        var info_tooltip_svg = window.btoa(getIconSvgEncoded("search-icon-tooltip", primary));

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
                .go-to-external:hover::after {
                    content: url('data:image/svg+xml;base64,${open_external_svg}');
                }
                .donate-button {
                    background-image: url('data:image/svg+xml;base64,${donate_svg}');
                }
                .settings-button {
                    background-image: url('data:image/svg+xml;base64,${settings_svg}');
                }
                .import-button {
                    background-image: url('data:image/svg+xml;base64,${import_svg}');
                }
                .export-button {
                    background-image: url('data:image/svg+xml;base64,${export_svg}');
                }
                .download-button {
                    background-image: url('data:image/svg+xml;base64,${download_svg}');
                }
                .clear-button {
                    background-image: url('data:image/svg+xml;base64,${delete_svg}');
                }
                .clear2-button {
                    background-image: url('data:image/svg+xml;base64,${delete2_svg}');
                }
                .copy-button {
                    background-image: url('data:image/svg+xml;base64,${copy_svg}');
                }
                .filter-button {
                    background-image: url('data:image/svg+xml;base64,${filter}');
                }
                .sort-by-button {
                    background-image: url('data:image/svg+xml;base64,${sort_by}');
                }
                .tag-button {
                    background-image: url('data:image/svg+xml;base64,${tag_svg}');
                }
                .refresh-button {
                    background-image: url('data:image/svg+xml;base64,${refresh_svg}');
                }
                .sort-by-button {
                    background-image: url('data:image/svg+xml;base64,${sort_by_svg}');
                }
                #info-tooltip-search {
                    background-image: url('data:image/svg+xml;base64,${info_tooltip_svg}');
                }
            </style>`;
    }
}

loaded();