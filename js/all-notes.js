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
    "white": all_strings["white-colour"]
});

let show_conversion_message_attention = false;

let sync_local = browser.storage.sync;
checkSyncLocal();

function checkSyncLocal() {
    browser.storage.local.get("storage").then(result => {
        if (result === "sync") sync_local = browser.storage.sync;
        else if (result === "local") sync_local = browser.storage.local;
        else {
            browser.storage.local.set({"storage": "sync"});
            sync_local = browser.storage.sync;
        }
    });
}

function loaded() {
    setLanguageUI();

    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        console.log("local: " + JSON.stringify(result));
    });
    browser.storage.sync.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity"
    ]).then(result => {
        console.log("sync: " + JSON.stringify(result));
    });

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
                if (JSON.stringify(result) !== `{"storage":"sync"}` && JSON.stringify(result2) != JSON.stringify(result)) {
                    show_conversion_message_attention = true;
                    alert("Pay attention: from the version 3.3 data are synchronised with your Firefox account. To do this I've changed the way to save notes back-end. I've converted automatically data.\n" +
                        "Although it looks the process of conversion didn't work in your case. Keep calm! You didn't lose all your notes! I've inserted a button in the 'Import…' section which permits you to restore those data – the 'Get local data' button. You can press there and it should show you local data, then you need to press on 'Import' manually.\n" +
                        "If this doesn't work, please, contact me on GitHub, Telegram or via email. I'll support you! I'm so sorry about this inconvenience.\nIn the meanwhile you can set the saving of sync off: go to the addon Settings > Save locally instead of sync > Yes.");
                }
            });
        }
    });

    document.getElementById("refresh-all-notes-button").onclick = function () {
        //location.reload();
        loadDataFromBrowser(true);
    }
    document.getElementById("settings-all-notes-button").onclick = function () {
        browser.tabs.create({url: "../settings/index.html"});
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

    loadDataFromBrowser(true);

    document.getElementById("all-notes-dedication-section").onscroll = function () {
        if (document.getElementById("all-notes-dedication-section").scrollTop > 30) {
            document.getElementById("actions").classList.add("section-selected");
        } else {
            if (document.getElementById("actions").classList.contains("section-selected")) {
                document.getElementById("actions").classList.remove("section-selected");
            }
        }
    }

    let titleAllNotes = document.getElementById("title-all-notes-dedication-section");
    titleAllNotes.textContent = all_strings["all-notes-title"];
    let versionNumber = document.createElement("div");
    versionNumber.classList.add("float-right", "small-button");
    versionNumber.textContent = browser.runtime.getManifest().version;
    versionNumber.id = "version";
    notefox_json = {
        "version": browser.runtime.getManifest().version,
        "id": browser.runtime.getManifest().author,
        "manifest_version": browser.runtime.getManifest().manifest_version
    };
    titleAllNotes.append(versionNumber);
}

function setLanguageUI() {
    document.getElementById("refresh-all-notes-button").value = all_strings["refresh-data-button"];
    document.getElementById("clear-all-notes-button").value = all_strings["clear-all-notes-button"];
    document.getElementById("import-all-notes-button").value = all_strings["import-notes-button"];
    document.getElementById("export-all-notes-button").value = all_strings["export-all-notes-button"];
    document.getElementById("search-all-notes-text").placeholder = all_strings["search-textbox"];
    document.getElementById("settings-all-notes-button").value = all_strings["settings-button"];
    //document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
    document.getElementById("filter-all-notes-button").value = all_strings["filter-button"];
    document.title = all_strings["all-notes-title-page"];

    document.getElementById("text-import").innerHTML = all_strings["import-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("text-export").innerHTML = all_strings["export-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("cancel-import-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
    document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];

    let colourList = colourListDefault;
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
    redFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["red-colour"]);
    redFilterButton.onclick = function () {
        search("red");
    };
    yellowFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["yellow-colour"]);
    yellowFilterButton.onclick = function () {
        search("yellow");
    };
    blackFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["black-colour"]);
    blackFilterButton.onclick = function () {
        search("black");
    };
    orangeFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["orange-colour"]);
    orangeFilterButton.onclick = function () {
        search("orange");
    };
    pinkFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["pink-colour"]);
    pinkFilterButton.onclick = function () {
        search("pink");
    };
    purpleFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["purple-colour"]);
    purpleFilterButton.onclick = function () {
        search("purple");
    };
    grayFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["grey-colour"]);
    grayFilterButton.onclick = function () {
        search("gray");
    };
    redFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["red-colour"]);
    redFilterButton.onclick = function () {
        search("red");
    };
    greenFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["green-colour"]);
    greenFilterButton.onclick = function () {
        search("green");
    };
    blueFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["blue-colour"]);
    blueFilterButton.onclick = function () {
        search("blue");
    };
    whiteFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["white-colour"]);
    whiteFilterButton.onclick = function () {
        search("white");
    };
}

function loadDataFromBrowser(generate_section = true) {
    sync_local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
            websites_json_to_show = websites_json;
        }
        if (generate_section) {
            websites_json_by_domain = {};
            loadAllWebsites(true);
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
}

function clearAllNotes() {
    let confirmationClearAllNotes = confirm(all_strings["clear-all-notes-confirmation"]);
    if (confirmationClearAllNotes) {
        sync_local.set({
            "websites": {},
            "settings": {},
            "sticky-notes-coords": {},
            "sticky-notes-sizes": {},
            "sticky-notes-opacity": {}
        }).then(result => {
            websites_json_to_show = {};
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

function importAllNotes() {
    browser.storage.local.get([
        "storage",
        "settings",
        "websites",
        "sticky-notes-coords",
        "sticky-notes-sizes",
        "sticky-notes-opacity",
    ]).then(result => {
            let jsonImportElement = document.getElementById("json-import");

            //console.log(JSON.stringify(result));
            if (show_conversion_message_attention) {
                if (document.getElementById("import-now-all-notes-from-local-button")) {
                    document.getElementById("import-now-all-notes-from-local-button").onclick = function () {
                        result["notefox"] = {};
                        result["notefox"]["version"] = "3.2";
                        jsonImportElement.value = JSON.stringify(result);
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
                if (value.replaceAll(" ", "") != "") {
                    let error = false;
                    let error_description = "";
                    try {
                        //json_to_export = {"notefox": notefox_json, "websites": websites_json, "settings": settings_json, "sticky-notes": sticky_notes_json};
                        let json_to_export_temp = JSON.parse(value);
                        if (json_to_export_temp["notefox"] === undefined || (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["notefox"]["version"] === undefined)) {
                            //version before 2.0 (export in a different way)
                            let confirmation = confirm(all_strings["notefox-version-too-old-try-to-import-data-anyway"]);
                            if (confirmation) {
                                websites_json = json_to_export_temp;
                                websites_json_to_show = websites_json;
                            }
                        }
                        let continue_ok = false;
                        if (json_to_export_temp["notefox"] !== undefined) {
                            if (json_to_export_temp["notefox"]["version"] != notefox_json["version"]) {
                                continue_ok = confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                            } else {
                                continue_ok = true;
                            }
                        } else {
                            continue_ok = confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
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

                                if (sticky_notes.coords === undefined) sticky_notes.coords = {x: "20px", y: "20px"};
                                if (sticky_notes.sizes === undefined) sticky_notes.sizes = {w: "300px", h: "300px"};
                                if (sticky_notes.opacity === undefined) sticky_notes.opacity = {value: 0.7};
                            }
                        }

                        //console.log(JSON.stringify(json_to_export_temp));

                        let storageTemp = json_to_export_temp["storage"];
                        if (storageTemp === undefined || !(storageTemp !== undefined && (storageTemp === "sync" || storageTemp === "local"))) storageTemp = "sync";

                        if (continue_ok) {
                            browser.storage.local.set({"storage": json_to_export_temp}).then(resultSyncLocal => {
                                checkSyncLocal();

                                document.getElementById("import-now-all-notes-button").disabled = true;
                                document.getElementById("cancel-import-all-notes-button").disabled = true;
                                document.getElementById("import-now-all-notes-button").value = all_strings["importing-button"];
                                ;
                                setTimeout(function () {
                                    document.getElementById("import-now-all-notes-button").disabled = false;
                                    document.getElementById("cancel-import-all-notes-button").disabled = false;
                                    document.getElementById("import-now-all-notes-button").value = all_strings["imported-button"];
                                    ;
                                    setTimeout(function () {
                                        document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
                                        ;
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
                                            "storage",
                                            "settings",
                                            "websites",
                                            "sticky-notes-coords",
                                            "sticky-notes-sizes",
                                            "sticky-notes-opacity"
                                        ]).then(result => {
                                            if (result !== undefined && JSON.stringify(result) !== "{}" && result.storage !== undefined && result.storage === "sync") {
                                                browser.storage.local.clear().then(result => {
                                                    browser.storage.sync.set({"storage": "sync"})
                                                });
                                            }
                                        });
                                        loadDataFromBrowser(true);

                                        document.getElementById("import-section").style.display = "none";
                                        hideBackgroundOpacity()
                                    }).catch(function (error) {
                                        console.error("E4: " + error);
                                    });
                                }, 2000);
                            });
                        }


                        if (!continue_ok) {
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
        }
    )
    ;
}

function exportAllNotes() {
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

            if (sticky_notes.coords === undefined) sticky_notes.coords = {x: "20px", y: "20px"};
            if (sticky_notes.sizes === undefined) sticky_notes.sizes = {w: "300px", h: "300px"};
            if (sticky_notes.opacity === undefined) sticky_notes.opacity = {value: 0.7};
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
        }).catch((error) => {
            console.error("Error retrieving data:", error);
        });
    });
}

function showBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "block";
}

function hideBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "none";
}

function loadAllWebsites(clear = false) {
    if (clear) {
        document.getElementById("all-website-sections").textContent = "";
    }
    if (!isEmpty(websites_json_to_show)) {
        //there are websites saved

        websites_json_by_domain = [];

        for (let domain in websites_json_to_show) {
            if (websites_json_to_show[domain]["type"] === undefined) {
                websites_json_to_show[domain]["type"] = 0;
                websites_json_to_show[domain]["domain"] = "";
                websites_json_to_show[domain]["tag-colour"] = "none";
            }


            if (websites_json_to_show[domain]["type"] === 0) {
                //domain
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

        websites_json_by_domain = sortOnKeys(websites_json_by_domain);

        for (let domain in websites_json_by_domain) {
            let section = document.createElement("div");
            section.classList.add("section");

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
            h2.classList.add("link", "go-to-external");
            h2.onclick = function () {
                browser.tabs.create({url: domain});
            }
            let all_pages = document.createElement("div");

            section.append(h2);

            websites_json_by_domain[domain].sort();

            //console.log(JSON.stringify(websites_json_by_domain[domain]));

            if (websites_json_to_show[domain] !== undefined) {
                //there is notes also for the domain
                let urlPageDomain = domain;
                let page = document.createElement("div");
                page.classList.add("sub-section");
                let lastUpdate = websites_json_to_show[urlPageDomain]["last-update"];
                let notes = websites_json_to_show[urlPageDomain]["notes"];

                page = generateNotes(page, urlPageDomain, notes, lastUpdate, all_strings["domain-label"], urlPageDomain);

                all_pages.append(page);
            }

            for (let index = 0; index < websites_json_by_domain[domain].length; index++) {
                let urlPage = websites_json_by_domain[domain][index];
                let urlPageDomain = domain + websites_json_by_domain[domain][index];
                let page = document.createElement("div");
                page.classList.add("sub-section");

                // console.log(urlPageDomain);
                // console.log(websites_json_by_domain);
                // console.log(websites_json_to_show);
                let lastUpdate = websites_json_to_show[urlPageDomain]["last-update"];
                let notes = websites_json_to_show[urlPageDomain]["notes"];

                page = generateNotes(page, urlPage, notes, lastUpdate, all_strings["page-label"], urlPageDomain);

                all_pages.append(page);
            }

            section.append(all_pages);

            document.getElementById("all-website-sections").append(section);
        }

    } else {
        //no websites
        let section = document.createElement("div");
        section.classList.add("section-empty");
        section.textContent = all_strings["no-notes-found-text"];

        document.getElementById("all-website-sections").append(section);
    }
}

function applyFilter() {
    if (document.getElementById("search-all-notes-text").value.replaceAll(" ", "") !== "") {
        search(document.getElementById("search-all-notes-text").value);
    }
}

function search(value) {
    websites_json_to_show = {};
    document.getElementById("search-all-notes-text").value = value.toString();
    let valueToUse = value.toLowerCase();
    for (const website in websites_json) {
        let current_website_json = websites_json[website];
        if (current_website_json["notes"].toLowerCase().includes(valueToUse) || current_website_json["tag-colour"].toLowerCase().includes(valueToUse) || current_website_json["domain"].toLowerCase().includes(valueToUse)) {
            websites_json_to_show[website] = websites_json[website];
        }
    }
    loadAllWebsites(true);
}

function sortObjectByKeys(o) {
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
}

function generateNotes(page, url, notes, lastUpdate, type, fullUrl) {
    let pageType = document.createElement("div");
    pageType.classList.add("sub-section-type");
    pageType.textContent = type;

    page.append(pageType)

    let input_clear_all_notes_page = document.createElement("input");
    input_clear_all_notes_page.type = "button";
    input_clear_all_notes_page.value = all_strings["clear-notes-of-this-page-button"];
    input_clear_all_notes_page.classList.add("button", "float-right", "very-small-button", "clear2-button");
    input_clear_all_notes_page.onclick = function () {
        let isDomain = false;
        if (fullUrl == url) {
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
        }, 3000);
    }

    let tagsColour = document.createElement("select");
    let colourList = colourListDefault;
    colourList = Object.assign({}, {"none": all_strings["none-colour"]}, colourList);
    for (let colour in colourList) {
        let tagColour = document.createElement("option");
        tagColour.value = colour;
        if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tag-colour"] != undefined && websites_json[fullUrl]["tag-colour"] == colour) {
            tagColour.selected = true;
            page.classList.add("tag-colour-left", "tag-colour-" + colour);
        }
        tagColour.textContent = colourList[colour];
        //tagColour.classList.add(colour + "-background-tag");
        tagsColour.classList.add("button", "float-right", "very-small-button", "margin-right-5-px", "tag-button");
        tagColour.onclick = function () {
            changeTagColour(page, fullUrl, colour);
        }
        tagsColour.append(tagColour);
    }

    page.id = fullUrl;

    page.append(input_clear_all_notes_page);
    page.append(inputCopyNotes);
    page.append(tagsColour);

    if (type.toLowerCase() != "domain") {
        let pageUrl = document.createElement("h3");
        pageUrl.classList.add("link", "go-to-external");
        pageUrl.textContent = url;
        pageUrl.onclick = function () {
            browser.tabs.create({url: fullUrl});
        }

        page.append(pageUrl);
    }

    let pageNotes = document.createElement("div");
    pageNotes.classList.add("sub-section-notes");

    let textNotes = document.createElement("textarea");
    textNotes.readOnly = true;
    textNotes.textContent = notes;
    textNotes.classList.add("textarea-all-notes");

    pageNotes.append(textNotes);

    page.append(pageNotes);

    let pageLastUpdate = document.createElement("div");
    pageLastUpdate.classList.add("sub-section-last-update");
    pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", lastUpdate);
    page.append(pageLastUpdate);

    return page;
}

function changeTagColour(page, url, colour) {
    sync_local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        }
        websites_json[url]["tag-colour"] = colour;
        websites_json_to_show = websites_json;
        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
            hideBackgroundOpacity();
            applyFilter();
            setTimeout(function () {
                search(document.getElementById("search-all-notes-text").value);
            }, 50);
        });
    });
}

function copyNotes(page, text) {
    page.value = text;
    page.select();
    document.execCommand("copy");
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0
}

function sortOnKeys(dict) {
    var sorted = [];
    for (var key in dict) {
        sorted[sorted.length] = key;
    }
    sorted.sort();

    var tempDict = {};
    for (var i = 0; i < sorted.length; i++) {
        tempDict[sorted[i]] = dict[sorted[i]];
    }

    return tempDict;
}

loaded();