let websites_json = {};
let websites_json_by_domain = {};
let websites_json_to_show = {};
let settings_json = {};
let notefox_json = {};

const all_strings = strings[languageToUse];

function loaded() {
    setLanguageUI();

    document.getElementById("refresh-all-notes-button").onclick = function () {
        //location.reload();
        loadDataFromBrowser(true);
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
    document.getElementById("search-all-notes-text").onkeyup = function () {
        search(document.getElementById("search-all-notes-text").value);
    }
    //document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
    document.getElementById("filter-all-notes-button").value = all_strings["filter-button"];
    document.getElementById("filter-all-notes-button").onclick = function () {
        if (document.getElementById("filters").classList.contains("hidden")) {
            //show because it's hidden
            document.getElementById("filters").classList.remove("hidden");
        } else {
            //hide because it's visible
            document.getElementById("filters").classList.add("hidden");
        }
    }
    document.title = all_strings["all-notes-title-page"];

    document.getElementById("text-import").innerHTML = all_strings["import-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("text-export").innerHTML = all_strings["export-json-message-dialog-text"].replaceAll("{{parameters}}", "class='button-code'");
    document.getElementById("cancel-import-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("import-now-all-notes-button").value = all_strings["import-now-button"];
    document.getElementById("cancel-export-all-notes-button").value = all_strings["cancel-button"];
    document.getElementById("copy-now-all-notes-button").value = all_strings["copy-now-button"];

    let colourList = sortObjectByKeys({
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
    browser.storage.local.get("websites", function (value) {
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
    browser.storage.local.get("settings", function (value) {
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
        let clearStorage = browser.storage.local.clear();
        clearStorage.then(onCleared, onError);
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

        browser.storage.local.set({"websites": websites_json}, function () {
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

        browser.storage.local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
        });
    }
}

function onCleared() {
    //all notes clear || successful
    loadDataFromBrowser(true);
}

function onError(e) {
}

function importAllNotes() {
    showBackgroundOpacity();
    document.getElementById("import-section").style.display = "block";
    let jsonImportElement = document.getElementById("json-import")
    jsonImportElement.value = "";
    jsonImportElement.focus();

    document.getElementById("cancel-import-all-notes-button").onclick = function () {
        hideBackgroundOpacity();
        document.getElementById("import-section").style.display = "none";
    }
    document.getElementById("import-now-all-notes-button").onclick = function () {
        let value = jsonImportElement.value;
        if (value.replaceAll(" ", "") != "") {
            try {
                //json_to_export = {"notefox": notefox_json, "websites": websites_json, "settings": settings_json};
                let json_to_export_temp = JSON.parse(value);
                if (json_to_export_temp["notefox"] === undefined || (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["notefox"]["version"] === undefined)) {
                    //version before 2.0 (export in a different way)
                    let confirmation = confirm(all_strings["notefox-version-too-old-try-to-import-data-anyway"]);
                    if (confirmation) {
                        websites_json = json_to_export_temp;
                        websites_json_to_show = websites_json;
                    }
                }
                if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["websites"] !== undefined) {
                    if (json_to_export_temp["notefox"]["version"] != notefox_json["version"]) {
                        let confirmation = confirm(all_strings["notefox-version-different-try-to-import-data-anyway"]);
                        if (confirmation) {
                            websites_json = json_to_export_temp["websites"];
                            websites_json_to_show = websites_json;
                        }
                    } else {
                        websites_json = json_to_export_temp["websites"];
                        websites_json_to_show = websites_json;
                    }
                }
                document.getElementById("import-section").style.display = "none";
                browser.storage.local.set({"websites": websites_json}, function () {
                    loadDataFromBrowser(true);
                    hideBackgroundOpacity()
                    //Imported websites
                });
                if (json_to_export_temp["notefox"] !== undefined && json_to_export_temp["settings"] !== undefined) {
                    settings_json = json_to_export_temp["settings"]
                    browser.storage.local.set({"settings": settings_json}, function () {
                        //Imported settings as well
                    });
                }

            } catch (e) {
                //console.log("Error: " + e.toString());
                let errorSubSection = document.createElement("div");
                errorSubSection.classList.add("sub-section", "background-light-red");
                errorSubSection.textContent = "Error: " + e.toString();

                let mainSection = document.getElementById("import-sub-sections");
                mainSection.insertBefore(errorSubSection, mainSection.childNodes[0]);
            }
        }
    }
}

function exportAllNotes() {
    showBackgroundOpacity();
    document.getElementById("export-section").style.display = "block";
    json_to_export = {"notefox": notefox_json, "settings": settings_json, "websites": websites_json};
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
    for (const website in websites_json) {
        let current_website_json = websites_json[website];
        if (current_website_json["notes"].includes(value) || current_website_json["tag-colour"].includes(value) || current_website_json["domain"].includes(value)) {
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
    input_clear_all_notes_page.classList.add("button", "float-right", "very-small-button", "clear-button");
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
    let colourList = sortObjectByKeys({
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
    colourList = Object.assign({}, {"none": all_strings["none-colour"]}, colourList);
    for (let colour in colourList) {
        let tagColour = document.createElement("option");
        tagColour.value = colour;
        if (websites_json[fullUrl]["tag-colour"] != undefined && websites_json[fullUrl]["tag-colour"] == colour) {
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
    browser.storage.local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        }
        websites_json[url]["tag-colour"] = colour;
        websites_json_to_show = websites_json;
        browser.storage.local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
            hideBackgroundOpacity();
            applyFilter();
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