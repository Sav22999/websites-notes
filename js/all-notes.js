let websites_json = {};
let websites_json_by_domain = {};
let websites_json_to_show = {};
let settings_json = {};

const all_strings = strings[languageToUse];

//Do not add "None" because it's treated in a different way!
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

let sync_local = browser.storage.local;
checkSyncLocal();

let sort_by_selected = "name-az";
let filtersColors = [];
let filtersTypes = [];

function checkSyncLocal() {
    sync_local = browser.storage.local;
    checkTheme();
}

function loaded() {
    browser.runtime.onMessage.addListener((message) => {
        if (message["sync_update"] !== undefined && message["sync_update"]) {
            location.reload();
        }
        if (message["updated"] !== undefined && message["updated"]) {
            loadDataFromBrowser(true);
        }
        if (message["check-user--expired"] !== undefined && message["check-user--expired"]) {
            //console.log("User expired! Log in again | script");
            loginExpired();
        }
    });
    browser.runtime.sendMessage({"check-user": true});

    checkSyncLocal();
    setLanguageUI();
    checkTheme();

    browser.tabs.onActivated.addListener(tabUpdated);
    browser.tabs.onUpdated.addListener(tabUpdated);

    loadAsideBar();

    try {
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

        document.getElementById("search-all-notes-text").onkeyup = function () {
            search(document.getElementById("search-all-notes-text").value);
        }

        window.onscroll = function () {
            if (window.scrollY > 30) {
                //hide because it's visible
                document.getElementById("filters").classList.add("hidden");
                if (document.getElementById("search-filter-sortby").classList.contains("filters-visibile"))
                    document.getElementById("search-filter-sortby").classList.remove("filters-visibile");
            }
        }

        document.getElementById("filter-all-notes-button").onclick = function () {
            window.scrollTo({
                top: 0,
            });
            if (document.getElementById("filters").classList.contains("hidden")) {
                //show because it's hidden
                document.getElementById("filters").classList.remove("hidden");
                document.getElementById("search-filter-sortby").classList.add("filters-visibile");
            } else {
                //hide because it's visible
                document.getElementById("filters").classList.add("hidden");
                if (document.getElementById("search-filter-sortby").classList.contains("filters-visibile"))
                    document.getElementById("search-filter-sortby").classList.remove("filters-visibile");
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
    titleAllNotes.append(versionNumber);
}

function tabUpdated() {
    checkTheme();
    browser.storage.local.get([
        "websites"
    ]).then(result => {
        if (result.websites !== undefined && result.websites !== websites_json) {
            loadDataFromBrowser(true);
        }
    });
}

function setLanguageUI() {
    try {
        document.getElementById("refresh-all-notes-button").value = all_strings["refresh-data-button"];
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

        document.getElementById("info-tooltip-search").onclick = function () {
            window.open(links["help-search"], "_blank");
        }

        let globalFilterButton = document.getElementById("filter-type-global-button");
        let domainFilterButton = document.getElementById("filter-type-domain-button");
        let pageFilterButton = document.getElementById("filter-type-page-button");

        // <input type="button" value="Tag: Red" id="filter-tag-red-button"
        //                class="button filter-button-tag"/>
        let containerColours = document.getElementById("filter-colours-container");
        containerColours.innerHTML = ""
        for (let colour in colourListDefault) {
            let colourFilterButton = document.createElement("input");
            colourFilterButton.type = "button";
            colourFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", colourListDefault[colour]);
            colourFilterButton.id = `filter-tag-${colour}-button`;
            colourFilterButton.classList.add("button", "filter-button-tag", `tag-colour-${colour}`);
            colourFilterButton.onclick = function () {
                filterByColor(colour, colourFilterButton);
            }
            containerColours.appendChild(colourFilterButton);
        }

        let noneFilterButton = document.createElement("input");
        noneFilterButton.type = "button";
        noneFilterButton.value = (all_strings["filter-by-tag-button"] + "").replaceAll("{{color}}", all_strings["none-colour"]);
        noneFilterButton.id = `filter-tag-none-button`;
        noneFilterButton.classList.add("button", "filter-button-tag");
        noneFilterButton.onclick = function () {
            filterByColor("none", noneFilterButton);
        }
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

function loadAsideBar() {
    let all_notes = document.getElementById("all-notes-aside");
    let settings = document.getElementById("settings-aside");
    let help = document.getElementById("help-aside");
    let website = document.getElementById("website-aside");
    let donate = document.getElementById("donate-aside");
    let translate = document.getElementById("translate-aside");
    let version = document.getElementById("version-aside");

    all_notes.innerHTML = all_strings["all-notes-aside"];
    all_notes.onclick = function () {
        window.open(links_aside_bar["all-notes"], "_self");
    }
    settings.innerHTML = all_strings["settings-aside"];
    settings.onclick = function () {
        window.open(links_aside_bar["settings"], "_self");
    }
    help.innerHTML = all_strings["help-aside"];
    help.onclick = function () {
        window.open(links_aside_bar["help"], "_self");
    }
    website.innerHTML = all_strings["website-aside"];
    website.onclick = function () {
        window.open(links_aside_bar["website"], "_self")
    }
    donate.innerHTML = all_strings["donate-aside"];
    donate.onclick = function () {
        window.open(links_aside_bar["donate"], "_self");
    }
    translate.innerHTML = all_strings["translate-aside"];
    translate.onclick = function () {
        window.open(links_aside_bar["translate"], "_self");
    }

    version.innerHTML = all_strings["version-aside"].replaceAll("{{version}}", browser.runtime.getManifest().version);
}

function filterByColor(color, tagButton) {
    //console.log(color)
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

function listenerLinks(element) {
    let notes = element;
    if (notes.innerHTML !== "" && notes.innerHTML !== "<br>") {
        let links = notes.querySelectorAll('a');
        links.forEach(link => {
            function onMouseOverDown(event, settings_json, link) {
                if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    link.style.textDecorationStyle = "solid";
                    link.style.cursor = "pointer";
                }
            }

            function onMouseLeaveUp(link) {
                link.style.textDecorationStyle = "dotted";
                link.style.cursor = "inherit";
            }

            link.onmousedown = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseover = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseup = function (event) {
                onMouseLeaveUp(link);
            }
            link.onmouseleave = function (event) {
                onMouseLeaveUp(link);
            }
            link.onclick = function (event) {
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
                        browser.tabs.create({
                            url: link.href,
                            index: tabs[0].index + 1
                        });
                    });
                } else {
                    // Prevent the default link behavior
                }
                event.preventDefault();
            }
        });
    }
}

function updateLastUpdate() {
    sync_local.set({"last-update": getDate()});
}

function loadDataFromBrowser(generate_section = true) {
    try {
        sync_local.get(["websites", "settings"], function (value) {
            websites_json = {};
            if (value["websites"] !== undefined) {
                websites_json = value["websites"];
                websites_json_to_show = websites_json;
            }
            //console.log(JSON.stringify(websites_json));

            settings_json = {};
            if (value["settings"] !== undefined) settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "page";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = false;
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = false;
            if (settings_json["open-popup-default"] === undefined) settings_json["open-popup-default"] = "Ctrl+Alt+O";
            if (settings_json["open-popup-domain"] === undefined) settings_json["open-popup-domain"] = "Ctrl+Alt+D";
            if (settings_json["open-popup-page"] === undefined) settings_json["open-popup-page"] = "Ctrl+Alt+P";
            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = true;
            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = true;
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = false;
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = false;
            if (settings_json["theme"] === undefined) settings_json["theme"] = "light";
            if (settings_json["check-green-icon-global"] === undefined) settings_json["check-green-icon-global"] = true;
            if (settings_json["check-green-icon-domain"] === undefined) settings_json["check-green-icon-domain"] = true;
            if (settings_json["check-green-icon-page"] === undefined) settings_json["check-green-icon-page"] = true;
            if (settings_json["check-green-icon-subdomain"] === undefined) settings_json["check-green-icon-subdomain"] = true;
            if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
            if (settings_json["font-family"] === undefined || (settings_json["font-family"] !== "Shantell Sans" && settings_json["font-family"] !== "Open Sans")) settings_json["font-family"] = "Shantell Sans";

            //console.log(JSON.stringify(settings_json));
            if (generate_section) {
                websites_json_by_domain = {};
                loadAllWebsites(true, sort_by_selected);
            }
        });
        applyFilter();
    } catch (e) {
        console.error(`E-L3: ${e}`);
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
            updateLastUpdate();
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
            updateLastUpdate();
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

                    let input_clear_all_notes_domain = document.createElement("input");

                    if (domain !== "**global") {
                        input_clear_all_notes_domain.type = "button";
                        input_clear_all_notes_domain.value = all_strings["clear-all-notes-of-this-domain-button"];
                        input_clear_all_notes_domain.classList.add("button", "margin-top-5-px", "margin-right-5-px", "small-button", "clear-button", "clear-button-float-right");
                        input_clear_all_notes_domain.onclick = function () {
                            clearAllNotesDomain(domain);
                        }

                        let h2_container = document.createElement("div");
                        h2_container.classList.add("h2-container");
                        h2_container.classList.add("h2-container")
                        let h2 = document.createElement("h2");
                        h2.textContent = domain;
                        if (isUrlSupported(domain)) {
                            h2.classList.add("link", "go-to-external", "domain");
                            h2.onclick = function () {
                                browser.tabs.create({url: domain});
                            }
                        }
                        h2_container.append(h2);

                        section.append(input_clear_all_notes_domain);
                        section.append(h2_container);
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

                    let hr = document.createElement("hr");
                    hr.classList.add("hr-big-space", "hr-domain");
                    document.getElementById("all-website-sections").append(hr);
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

function getAbsoluteTop(element) {
    var absoluteTop = 0;
    while (element) {
        absoluteTop += element.offsetTop;
        element = element.offsetParent;
    }
    return absoluteTop;
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

/**
 * Used for edit notes inline
 * @param url this is the "ID" in the websites_json
 * @param data the new data to save: {notes, title}
 * @param pageLastUpdate the element to update the last update
 */
function onInputText(url, data, pageLastUpdate) {
    browser.runtime.sendMessage({from: "all-notes", type: "inline-edit", url: url, data: data});
    pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", data["lastUpdate"]);
    sendMessageUpdateToBackground();
}

function sendMessageUpdateToBackground() {
    browser.runtime.sendMessage({"updated": true});
}

function generateNotes(page, url, notes, title, lastUpdate, type, fullUrl, type_to_use, domain_again) {
    try {
        let row1 = document.createElement("div");
        row1.classList.add("rows");

        let pageType = document.createElement("div");
        pageType.classList.add("sub-section-type");
        pageType.textContent = type;

        let subrowUrl = document.createElement("div");
        subrowUrl.classList.add("subrow-url");

        let subrowButtons = document.createElement("div");
        subrowButtons.classList.add("subrow-buttons");

        let inputClearAllNotesPage = document.createElement("input");

        inputClearAllNotesPage.type = "button";
        inputClearAllNotesPage.value = all_strings["clear-notes-of-this-page-button"];
        inputClearAllNotesPage.classList.add("button", "very-small-button", "clear2-button", "button-no-text-on-mobile");
        inputClearAllNotesPage.onclick = function () {
            let isDomain = false;
            if (fullUrl === url) {
                isDomain = true;
            }
            clearAllNotesPage(fullUrl, isDomain);
        }
        let inputInlineEdit = document.createElement("input");
        let pageTitleH3 = document.createElement("h3");
        let textNotes = document.createElement("div");
        let row2 = document.createElement("div");

        inputInlineEdit.type = "button";
        inputInlineEdit.value = all_strings["edit-notes-button"];
        inputInlineEdit.classList.add("button", "very-small-button", "edit-button", "button-no-text-on-mobile");
        inputInlineEdit.onclick = function () {
            if (textNotes.contentEditable === "true") {
                textNotes.contentEditable = "false";
                if (inputInlineEdit.classList.contains("finish-edit-button")) inputInlineEdit.classList.remove("finish-edit-button");
                if (pageTitleH3.classList.contains("inline-edit-title")) pageTitleH3.classList.remove("inline-edit-title");
                if (textNotes.classList.contains("inline-edit-notes")) textNotes.classList.remove("inline-edit-notes");
                inputInlineEdit.value = all_strings["edit-notes-button"];
                pageTitleH3.contentEditable = "false";
                textNotes.readOnly = true;

                if (pageTitleH3.textContent.replaceAll("<br>", "") !== "") {
                    if (row2.classList.contains("hidden")) row2.classList.remove("hidden");
                } else {
                    row2.classList.add("hidden");
                }
            } else {
                textNotes.contentEditable = "true";
                inputInlineEdit.classList.add("finish-edit-button");
                inputInlineEdit.value = all_strings["finish-edit-notes-button"];
                pageTitleH3.contentEditable = "true";
                textNotes.readOnly = false;
                pageTitleH3.classList.add("inline-edit-title");
                textNotes.classList.add("inline-edit-notes");

                if (row2.classList.contains("hidden")) row2.classList.remove("hidden");
            }
        }
        pageTitleH3.onkeypress = function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                inputInlineEdit.click();
            }
        }

        let inputCopyNotes = document.createElement("input");

        inputCopyNotes.type = "button";
        inputCopyNotes.value = all_strings["copy-notes-button"];
        inputCopyNotes.classList.add("button", "very-small-button", "copy-button", "button-no-text-on-mobile");
        inputCopyNotes.onclick = function () {
            copyNotes(textNotes, notes);
            inputCopyNotes.value = all_strings["copied-button"];

            textNotes.innerHTML = notes;
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
            if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tag-colour"] !== undefined && websites_json[fullUrl]["tag-colour"] === colour) {
                tagColour.selected = true;
                page.classList.add("tag-colour-left", "tag-colour-" + colour, "sub-section-domain");
            }
            tagColour.textContent = colourList[colour];
            //tagColour.classList.add(colour + "-background-tag");
            tagsColour.classList.add("select-tag-all-notes", "button", "very-small-button", "tag-button", "select-grid-no-text");
            tagsColour.append(tagColour);
        }
        tagsColour.onchange = function () {
            changeTagColour(fullUrl, tagsColour.value, type_to_use);
        }
        page.id = fullUrl;

        subrowUrl.append(pageType);

        subrowButtons.append(tagsColour);
        subrowButtons.append(inputInlineEdit);
        subrowButtons.append(inputCopyNotes);
        subrowButtons.append(inputClearAllNotesPage);

        if (type_to_use.toLowerCase() !== "domain" && type_to_use.toLowerCase() !== "global") {
            //it's a page
            let pageUrl = document.createElement("h3");
            pageUrl.textContent = url;

            let fullUrlToUse = fullUrl;
            if (fullUrlToUse.substring(fullUrlToUse.length - 1, fullUrlToUse.length) === "*") {
                fullUrlToUse = fullUrlToUse.substring(0, fullUrlToUse.length - 1);
            }
            if (isUrlSupported(fullUrlToUse)) {
                pageUrl.classList.add("link", "go-to-external");
                pageUrl.onclick = function () {
                    browser.tabs.create({url: fullUrlToUse});
                }
            }

            subrowUrl.append(pageUrl);
        }

        row1.append(subrowUrl);
        row1.append(subrowButtons)

        page.append(row1);

        let pageLastUpdate = document.createElement("div");

        row2.classList.add("rows");

        let pageTitle = document.createElement("div");
        pageTitle.classList.add("sub-section-title");
        pageTitle.textContent = all_strings["title-label"];

        pageTitleH3.classList.add("title", "single-line");
        pageTitleH3.textContent = title;
        pageTitleH3.oninput = function () {
            let data = {
                title: pageTitleH3.textContent,
                lastUpdate: getDate()
            }
            onInputText(fullUrl, data, pageLastUpdate);
        }
        row2.classList.add("hidden");
        row2.append(pageTitle)
        if (title !== undefined && title !== "") {
            if (row2.classList.contains("hidden")) row2.classList.remove("hidden");
        }
        row2.append(pageTitleH3);
        page.append(row2);
        let pageNotes = document.createElement("pre");
        pageNotes.classList.add("sub-section-notes");

        let textNotesContainer = document.createElement("div");
        textNotesContainer.classList.add("div-textnotes-container");

        textNotes.readOnly = true;
        textNotes.innerHTML = notes;
        textNotes.contentEditable = false;
        textNotes.classList.add("textarea-all-notes");
        textNotes.oninput = function () {
            let data = {
                notes: textNotes.innerHTML,
                lastUpdate: getDate()
            }
            onInputText(fullUrl, data, pageLastUpdate);
        }
        textNotes.onkeydown = function (e) {
            if (actions.length === 0) {
                //first action on notes add the "initial state" of it
                actions.push({text: sanitizeHTML(notes.innerHTML), position: 0});
            }

            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") {
                //redo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                //redo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                //undo();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                bold();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                italic();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
                underline();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                strikethrough();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
                insertLink();
            }
        }
        listenerLinks(textNotes);
        let disable_word_wrap = false;
        if (settings_json["disable-word-wrap"] !== undefined) {
            if (settings_json["disable-word-wrap"] === "yes" || settings_json["disable-word-wrap"] === true) disable_word_wrap = true;
            else disable_word_wrap = false;
        }
        if (disable_word_wrap) {
            textNotes.whiteSpace = "none";
        } else {
            textNotes.style.whiteSpace = "pre-wrap";
        }

        if (settings_json["font-family"] === undefined || (settings_json["font-family"] !== "Shantell Sans" && settings_json["font-family"] !== "Open Sans")) settings_json["font-family"] = "Shantell Sans";

        textNotes.style.fontFamily = `'${settings_json["font-family"]}'`;

        textNotesContainer.appendChild(textNotes);

        pageNotes.append(textNotesContainer);

        page.append(pageNotes);

        pageLastUpdate.classList.add("sub-section-last-update");
        pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", lastUpdate);
        page.append(pageLastUpdate);

        return page;
    } catch (e) {
        console.error(`E-G1: ${e}`);

        return undefined;
    }
}

function bold() {
    //console.log("Bold B")
    document.execCommand("bold", false);
}

function italic() {
    //console.log("Italic I")
    document.execCommand("italic", false);
}

function underline() {
    //console.log("Underline U")
    document.execCommand("underline", false);
}

function strikethrough() {
    //console.log("Strikethrough S")
    document.execCommand("strikethrough", false);
}

function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
    let isLink = hasAncestorTagName(window.getSelection().anchorNode, 'a');

    // If it's already a link, remove the link; otherwise, add the link
    if (isLink) {
        // Remove the link
        let elements = getTheAncestorTagName(window.getSelection().anchorNode, 'a');
        let anchorElement = elements[0];
        let parentAnchor = elements[1];

        if (anchorElement && parentAnchor) {
            // Move children of the anchor element to its parent
            while (anchorElement.firstChild) {
                parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
            }
            // Remove the anchor element itself
            parentAnchor.removeChild(anchorElement);
        }
        saveNotes();
    } else {
        /*let url = prompt("Enter the URL:");
        if (url) {
            document.execCommand('createLink', false, url);
        }*/
        document.execCommand('createLink', false, selectedText);
    }
    //}
}

function hasAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return true; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return false; // Reached the top of the DOM tree without finding an anchor element
}

function getTheAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return [element, element.parentNode]; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return [false, false]; // Reached the top of the DOM tree without finding an anchor element
}

function changeTagColour(url, colour) {
    sync_local.get("websites", function (value) {
        websites_json = {};
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        }
        //console.log(`url ${url}`);
        websites_json[url]["tag-colour"] = colour;
        websites_json[url]["last-update"] = getDate();
        websites_json_to_show = websites_json;
        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser(true);
            updateLastUpdate();
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
 * Show the login expired section
 */
function loginExpired() {
    let section = document.getElementById("login-expired-section");
    let background = document.getElementById("background-opacity");

    section.style.display = "block";
    background.style.display = "block";

    let loginExpiredTitle = document.getElementById("login-expired-title");
    loginExpiredTitle.textContent = all_strings["notefox-account-login-expired-title"];
    let loginExpiredText = document.getElementById("login-expired-text");
    loginExpiredText.innerHTML = all_strings["notefox-account-login-expired-text2"];
    let loginExpiredButton = document.getElementById("login-expired-button");
    loginExpiredButton.value = all_strings["notefox-account-button-settings-login"];
    loginExpiredButton.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
        window.open(links_aside_bar["settings"], "_blank");
    }
    let loginExpiredClose = document.getElementById("login-expired-cancel-button");
    loginExpiredClose.value = all_strings["notefox-account-login-later-button"];
    loginExpiredClose.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
    }
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        //document.getElementById("all-notes-dedication-section").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("all-notes-dedication-section").style.color = primary;
        var open_external_svg = window.btoa(getIconSvgEncoded("open-external", primary));
        var donate_svg = window.btoa(getIconSvgEncoded("donate", on_primary));
        var settings_svg = window.btoa(getIconSvgEncoded("settings", on_primary));
        var all_notes_aside_svg = window.btoa(getIconSvgEncoded("all-notes", on_primary));
        var settings_aside_svg = window.btoa(getIconSvgEncoded("settings", primary));
        var help_aside_svg = window.btoa(getIconSvgEncoded("help", primary));
        var review_aside_svg = window.btoa(getIconSvgEncoded("review", primary));
        var website_aside_svg = window.btoa(getIconSvgEncoded("website", primary));
        var donate_aside_svg = window.btoa(getIconSvgEncoded("donate", primary));
        var translate_aside_svg = window.btoa(getIconSvgEncoded("translate", primary));
        var download_svg = window.btoa(getIconSvgEncoded("download", on_primary));
        var delete_svg = window.btoa(getIconSvgEncoded("delete", on_primary));
        var delete2_svg = window.btoa(getIconSvgEncoded("delete2", on_primary));
        var copy_svg = window.btoa(getIconSvgEncoded("copy", on_primary));
        var edit_svg = window.btoa(getIconSvgEncoded("edit", on_primary));
        var finish_edit_svg = window.btoa(getIconSvgEncoded("finish-edit", on_primary));
        var filter = window.btoa(getIconSvgEncoded("filter", on_primary));
        var sort_by = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        var tag_svg = window.btoa(getIconSvgEncoded("tag", on_primary));
        var refresh_svg = window.btoa(getIconSvgEncoded("refresh", on_primary));
        var sort_by_svg = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        var info_tooltip_svg = window.btoa(getIconSvgEncoded("search-icon-tooltip", on_primary));
        let arrow_select_svg = window.btoa(getIconSvgEncoded("arrow-select", on_primary));
        let search_svg = window.btoa(getIconSvgEncoded("search", primary));

        let tertiary = backgroundSection;
        let tertiaryTransparent = primary;
        let tertiaryTransparent2 = primary;
        if (tertiaryTransparent.includes("rgb(")) {
            let rgb_temp = tertiaryTransparent.replace("rgb(", "");
            let rgb_temp_arr = rgb_temp.split(",");
            if (rgb_temp_arr.length >= 3) {
                let red = rgb_temp_arr[0].replace(" ", "");
                let green = rgb_temp_arr[1].replace(" ", "");
                let blue = rgb_temp_arr[2].replace(")", "").replace(" ", "");
                tertiaryTransparent = `rgba(${red}, ${green}, ${blue}, 0.2)`;
                tertiaryTransparent2 = `rgba(${red}, ${green}, ${blue}, 0.8)`;
            }
        } else if (tertiaryTransparent.includes("#")) {
            tertiaryTransparent += "22";
            tertiaryTransparent2 += "88";
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
                    --tertiary-transparent-2: ${tertiaryTransparent2};
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
                #settings-aside {
                background-image: url('data:image/svg+xml;base64,${settings_aside_svg}');
                }
                #all-notes-aside {
                    background-image: url('data:image/svg+xml;base64,${all_notes_aside_svg}');
                }
                #help-aside {
                    background-image: url('data:image/svg+xml;base64,${help_aside_svg}');
                }
                #review-aside {
                    background-image: url('data:image/svg+xml;base64,${review_aside_svg}');
                }
                #website-aside {
                    background-image: url('data:image/svg+xml;base64,${website_aside_svg}');
                }
                #donate-aside {
                    background-image: url('data:image/svg+xml;base64,${donate_aside_svg}');
                }
                #translate-aside {
                    background-image: url('data:image/svg+xml;base64,${translate_aside_svg}');
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
                .edit-button {
                    background-image: url('data:image/svg+xml;base64,${edit_svg}');
                }
                .finish-edit-button {
                    background-image: url('data:image/svg+xml;base64,${finish_edit_svg}');
                }
                .filter-button {
                    background-image: url('data:image/svg+xml;base64,${filter}');
                }
                .tag-button {
                    background-image: url('data:image/svg+xml;base64,${tag_svg}');
                }
                .refresh-button {
                    background-image: url('data:image/svg+xml;base64,${refresh_svg}');
                }
                .sort-by-button {
                    background-image: url('data:image/svg+xml;base64,${sort_by_svg}'), url('data:image/svg+xml;base64,${arrow_select_svg}');
                }
                #info-tooltip-search {
                    background-image: url('data:image/svg+xml;base64,${info_tooltip_svg}');
                }
                .select-tag-all-notes {
                    background-image: url('data:image/svg+xml;base64,${tag_svg}'), url('data:image/svg+xml;base64,${arrow_select_svg}');
                }
                .search-all-notes-text {
                    background-image: url('data:image/svg+xml;base64,${search_svg}');
                }
                
                h2.domain, div.h2-container {
                    background-color: ${background};
                }
            </style>`;
    }
}

loaded();