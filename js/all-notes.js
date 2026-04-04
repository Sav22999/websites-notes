let websites_json = {};
let websites_json_by_domain = {};
let websites_json_to_show = {};
let settings_json = {};

const all_strings = strings[languageToUse];
const linkAcceptPrivacy = "/privacy/index.html";

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
let filtersFolder = [];
let filtersTagsText = [];
let filtersSearchTerms = [];

function getExistingFolders() {
    let folders = new Set();
    for (let url in websites_json) {
        let folder = websites_json[url]["tag-folder"];
        if (folder && folder !== "") {
            folders.add(folder);
        }
    }
    return Array.from(folders).sort();
}

function hideAllDropdowns(event) {
    if (event && event.type === "scroll") {
        const activeDropdown = document.querySelector(".autocomplete-dropdown:not(.hidden)");
        if (activeDropdown && event.target && typeof event.target.contains === "function" && activeDropdown.contains(event.target)) {
            return;
        }
    }
    document.querySelectorAll(".autocomplete-dropdown").forEach(d => {
        d.classList.add("hidden");
        // Se è una select custom, la rimuoviamo proprio per coerenza con definitions.js
        if (d.classList.contains("custom-select-dropdown")) {
            document.querySelectorAll(".custom-select-trigger.active").forEach(t => t.classList.remove("active"));
            d.remove();
        }
    });
}

// Chiudi tutte le dropdown allo scroll
window.addEventListener("scroll", hideAllDropdowns, true);

function checkSyncLocal() {
    sync_local = browser.storage.local;
    checkTheme();
}

function loaded() {
    browser.storage.sync.get("privacy").then(result => {
        if (result.privacy === undefined) {
            //not accepted privacy policy -> open 'privacy' page
            browser.tabs.create({url: linkAcceptPrivacy});
            window.close()
        }
    });

    browser.runtime.onMessage.addListener((message) => {
        if (message["sync_update"] !== undefined && message["sync_update"]) {
            location.reload();
        }
        if (message["updated"] !== undefined && message["updated"]) {
            loadDataFromBrowser("A", true);
        }
        if (message["check-user--expired"] !== undefined && message["check-user--expired"]) {
            //console.log("User expired! Log in again | script");
            loginExpired();
        }
        if (message["check-user--exception"] !== undefined && message["check-user--exception"]) {
            //console.log("User not logged! Log in | script");
            //console.log(message);
            browser.storage.local.get("notefox-server-error-shown").then(result => {
                if (result["notefox-server-error-shown"] === undefined || result["notefox-server-error-shown"] === false) {
                    notefoxServerError();
                }
            });
        }
    });
    browser.runtime.sendMessage({"check-user": true});

    checkSyncLocal();
    checkOperatingSystem();
    setLanguageUI();
    //checkTheme();

    //browser.tabs.onActivated.addListener(tabUpdated);
    //browser.tabs.onUpdated.addListener(tabUpdated);

    loadAsideBar();

    try {
        document.getElementById("refresh-all-notes-button").onclick = function () {
            //location.reload();
            loadDataFromBrowser("B", true);
            sendTelemetry("refresh-button");
        }
        document.getElementById("settings-all-notes-button").onclick = function () {
            sendTelemetry("settings-button");
            window.open("../settings/index.html", "_self");
        }
        document.getElementById("buy-me-a-coffee-button").onclick = function () {
            sendTelemetry("donate-button");
            browser.tabs.create({url: links["donate"]});
        }

        // renderSearchChips() inizializza già l'input di ricerca internamente
        // document.getElementById("search-all-notes-text").onkeyup = function () {
        //     search(document.getElementById("search-all-notes-text").value);
        // }

        window.onscroll = function (e) {
            hideAllDropdowns(e);
            if (window.scrollY > 30) {
                //hide because it's visible
                document.getElementById("filters").classList.add("hidden");
                if (document.getElementById("search-filter-sortby").classList.contains("filters-visibile")) document.getElementById("search-filter-sortby").classList.remove("filters-visibile");
            }
        }

        document.onkeyup = function (e) {
            if (e.key === "Escape") {
                hideAllPopups();
            }
        };

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
                if (document.getElementById("search-filter-sortby").classList.contains("filters-visibile")) document.getElementById("search-filter-sortby").classList.remove("filters-visibile");
            }
            sendTelemetry("filter-button");
        }

        document.getElementById("sort-by-all-notes-button").value = sort_by_selected;
        document.getElementById("sort-by-all-notes-button").onchange = function () {
            sort_by_selected = document.getElementById("sort-by-all-notes-button").value;
            loadAllWebsites(true, sort_by_selected);
            initCustomSelects();
        }

        renderSearchChips();

        setTimeout(function () {
            loadDataFromBrowser("C", true);
        }, 10);

        document.getElementById("all-notes-dedication-section").onscroll = function (e) {
            hideAllDropdowns(e);
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
        onError("all-notes.js::loaded", e.message);
    }

    let titleAllNotes = document.getElementById("title-all-notes-dedication-section");
    titleAllNotes.textContent = all_strings["all-notes-title"];
    let versionNumber = document.createElement("div");
    versionNumber.classList.add("float-right", "small-button");
    versionNumber.textContent = browser.runtime.getManifest().version;
    versionNumber.id = "version";
    titleAllNotes.append(versionNumber);

    let splashScreen = document.getElementById("splash-screen-all-notes");
    if (splashScreen !== undefined && splashScreen !== null) {
        splashScreen.classList.add("splash-screen-hidden");
    }
}

function sendTelemetry(action, context = "all-notes.js", url = null, other = null) {
    onTelemetry(action, context, url, currentOS, other);
}

function tabUpdated() {
    checkTheme();
    browser.storage.local.get(["websites"]).then(result => {
        if (result.websites !== undefined && result.websites !== websites_json) {
            loadDataFromBrowser("D", true);
        }
    });
}

function setLanguageUI() {
    try {
        document.getElementById("refresh-all-notes-button").value = all_strings["refresh-data-button"];
        let searchInput = document.getElementById("search-all-notes-text");
        if (searchInput) {
            searchInput.placeholder = all_strings["search-textbox"];
        }
        document.getElementById("settings-all-notes-button").value = all_strings["settings-button"];
        document.getElementById("buy-me-a-coffee-button").value = all_strings["donate-button"];
        //document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
        document.getElementById("filter-all-notes-button").value = all_strings["filter-button"];
        // document.getElementById("sort-by-all-notes-button").value = all_strings["sort-by-button"];
        document.getElementById("sort-by-name-az-select").textContent = all_strings["sort-by-az-button"];
        document.getElementById("sort-by-name-za-select").textContent = all_strings["sort-by-za-button"];
        document.getElementById("sort-by-date-09-select").textContent = all_strings["sort-by-edit-first-button"];
        document.getElementById("sort-by-date-90-select").textContent = all_strings["sort-by-edit-last-button"];
        document.title = all_strings["all-notes-title-page"];

        document.getElementById("filter-folder-label-span").textContent = all_strings["filter-folder-label"];
        document.getElementById("filter-tags-text-label-span").textContent = all_strings["filter-tags-text-label"];
        document.getElementById("filter-colour-label-span").textContent = all_strings["filter-colour-label"] || "Filter by colour";
        document.getElementById("filter-type-label-span").textContent = all_strings["filter-type-label"] || "Filter by type";

        let folderInput = document.getElementById("filter-folder-input");
        folderInput.contentEditable = "false";
        folderInput.onclick = function () {
            let input = document.getElementById("filter-folder-inner-input");
            if (input) input.focus();
        };

        function addFolderToFilterDiv(folder) {
            folder = folder.trim();
            let noFolderLabel = all_strings["no-folder-label"] || "No folder";
            let folders = getExistingFolders();

            let finalFolder = folder;
            if (folder === noFolderLabel) {
                finalFolder = "";
            }

            if (finalFolder !== "" && !folders.includes(finalFolder)) {
                return;
            }

            // Hide any open dropdowns
            document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.classList.add("hidden"));

            if (!filtersFolder.includes(finalFolder)) {
                filtersFolder.push(finalFolder);
                renderFilterFolders();
                applyFilter();
            }
        }

        function renderFilterFolders() {
            let container = document.getElementById("filter-folder-input");
            container.innerHTML = "";
            container.className = "custom-tag-input-container filter-input-container";

            filtersFolder.forEach((folder, index) => {
                let chip = document.createElement("span");
                chip.className = "tag-chip filter-chip folder-chip";

                let text = document.createElement("span");
                text.className = "tag-chip-text";
                text.textContent = folder === "" ? all_strings["no-folder-label"] : folder;
                chip.appendChild(text);

                let remove = document.createElement("span");
                remove.className = "tag-chip-remove";
                remove.textContent = "×";
                remove.onclick = function (e) {
                    e.stopPropagation();
                    filtersFolder.splice(index, 1);
                    // Hide any open dropdowns
                    document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.classList.add("hidden"));
                    renderFilterFolders();
                    applyFilter();
                };
                chip.appendChild(remove);
                container.appendChild(chip);
            });

            let input = document.createElement("input");
            input.type = "text";
            input.id = "filter-folder-inner-input";
            input.className = "tag-inner-input";
            input.placeholder = all_strings["filter-folder-label"] || "...";

            let dropdown = document.createElement("div");
            dropdown.className = "autocomplete-dropdown hidden";
            dropdown.style.position = "fixed";
            dropdown.style.zIndex = "20000";
            document.body.appendChild(dropdown);

            function updateDropdown(text) {
                dropdown.innerHTML = "";
                let folders = getExistingFolders();
                let matches = folders.filter(f => f.toLowerCase().includes(text.toLowerCase()) && !filtersFolder.includes(f));

                if (matches.length > 0) {
                    matches.forEach(match => {
                        let item = document.createElement("div");
                        item.className = "autocomplete-item";
                        item.textContent = match;
                        item.onclick = function (e) {
                            e.stopPropagation();
                            addFolderToFilterDiv(match);
                            input.value = "";
                            dropdown.classList.add("hidden");
                        };
                        dropdown.appendChild(item);
                    });
                    hideAllDropdowns();
                    dropdown.classList.remove("hidden");
                    checkDropdownScrollbar(dropdown, input);
                } else {
                    dropdown.classList.add("hidden");
                }
            }

            input.oninput = function () {
                if (this.value.includes(" ")) {
                    this.value = this.value.replace(/\s/g, "");
                }
                updateDropdown(this.value.trim());
            };

            input.onfocus = function () {
                updateDropdown(this.value.trim());
            };

            input.onclick = function () {
                updateDropdown(this.value.trim());
            };

            input.onkeydown = function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    let text = this.value.trim();
                    if (text) {
                        // Se c'è un solo match nell'autocomplete, lo usiamo, altrimenti proviamo ad aggiungere il testo se valido
                        let folders = getExistingFolders();
                        let matches = folders.filter(f => f.toLowerCase().includes(text.toLowerCase()) && !filtersFolder.includes(f));
                        if (matches.length > 0) {
                            // Se c'è un match esatto tra i suggerimenti, lo preferiamo
                            let exactMatch = matches.find(m => m.toLowerCase() === text.toLowerCase());
                            addFolderToFilterDiv(exactMatch || matches[0]);
                        } else {
                            addFolderToFilterDiv(text);
                        }
                        this.value = "";
                        dropdown.classList.add("hidden");
                    }
                } else if (e.key === "Backspace" && this.value === "" && filtersFolder.length > 0) {
                    filtersFolder.pop();
                    renderFilterFolders();
                    applyFilter();
                } else if (e.key === "Escape") {
                    dropdown.classList.add("hidden");
                }
            };

            // Chiudi il dropdown se si clicca fuori
            document.addEventListener("click", function (e) {
                if (!container.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add("hidden");
                }
            });

            container.appendChild(input);

            let allFolders = getExistingFolders();
            let availableFolders = allFolders.filter(f => !filtersFolder.includes(f));

            if (allFolders.length === 0) {
                input.disabled = true;
                container.classList.add("disabled");
                input.placeholder = all_strings["no-folders-available"] || "No folders available";
            } else if (availableFolders.length === 0 && filtersFolder.length > 0) {
                input.style.display = "none";
            } else {
                input.disabled = false;
                container.classList.remove("disabled");
                input.placeholder = all_strings["choose-placeholder"] || "Choose...";
                input.focus();
            }

            container.onclick = function () {
                if (!input.disabled) input.focus();
            };
        }

        renderFilterFolders();
        // renderSearchChips(); // Già chiamato sopra

        let tagsTextInput = document.getElementById("filter-tags-text-input");
        tagsTextInput.contentEditable = "false"; // Lo gestiamo noi con un input interno
        tagsTextInput.onclick = function () {
            let input = document.getElementById("filter-tags-text-inner-input");
            if (input) input.focus();
        };

        function addTagToFilterDiv(tag) {
            tag = tag.trim().toLowerCase();
            if (!tag) return;

            // Hide any open dropdowns
            document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.classList.add("hidden"));

            let tags = filtersTagsText;
            if (!tags.includes(tag)) {
                filtersTagsText.push(tag);
                renderFilterTags();
                applyFilter();
            }
        }

        function renderFilterTags() {
            let container = document.getElementById("filter-tags-text-input");
            container.innerHTML = "";
            container.className = "custom-tag-input-container filter-input-container";

            filtersTagsText.forEach((tag, index) => {
                let chip = document.createElement("span");
                chip.className = "tag-chip filter-chip";

                let text = document.createElement("span");
                text.className = "tag-chip-text";
                text.textContent = tag;
                chip.appendChild(text);

                let remove = document.createElement("span");
                remove.className = "tag-chip-remove";
                remove.textContent = "×";
                remove.onclick = function (e) {
                    e.stopPropagation();
                    filtersTagsText.splice(index, 1);
                    // Hide any open dropdowns
                    document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.classList.add("hidden"));
                    renderFilterTags();
                    applyFilter();
                };
                chip.appendChild(remove);
                container.appendChild(chip);
            });

            let input = document.createElement("input");
            input.type = "text";
            input.id = "filter-tags-text-inner-input";
            input.className = "tag-inner-input";
            input.placeholder = all_strings["add-tag-placeholder"] || "...";

            let dropdown = document.createElement("div");
            dropdown.className = "autocomplete-dropdown hidden";
            dropdown.style.position = "fixed";
            dropdown.style.zIndex = "20000";
            document.body.appendChild(dropdown);

            function getAllTags() {
                let tags = new Set();
                for (let url in websites_json) {
                    if (websites_json[url]["tags-text"]) {
                        websites_json[url]["tags-text"].forEach(t => tags.add(t.toLowerCase()));
                    }
                }
                return Array.from(tags).sort();
            }

            function updateDropdown(text) {
                dropdown.innerHTML = "";
                let allTags = getAllTags();
                let matches = allTags.filter(t => t.includes(text.toLowerCase()) && !filtersTagsText.includes(t));

                if (matches.length > 0) {
                    matches.forEach(match => {
                        let item = document.createElement("div");
                        item.className = "autocomplete-item";
                        item.textContent = match;
                        item.onclick = function (e) {
                            e.stopPropagation();
                            addTagToFilterDiv(match);
                            input.value = "";
                            dropdown.classList.add("hidden");
                        };
                        dropdown.appendChild(item);
                    });
                    hideAllDropdowns();
                    dropdown.classList.remove("hidden");
                    checkDropdownScrollbar(dropdown, input);
                } else {
                    dropdown.classList.add("hidden");
                }
            }

            input.oninput = function () {
                if (this.value.includes(" ")) {
                    this.value = this.value.replace(/\s/g, "");
                }
                updateDropdown(this.value.trim());
            };

            input.onfocus = function () {
                updateDropdown(this.value.trim());
            };

            input.onclick = function () {
                updateDropdown(this.value.trim());
            };

            input.onkeydown = function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    let text = this.value.trim().toLowerCase();
                    if (text) {
                        let allTags = getAllTags();
                        let matches = allTags.filter(t => t.includes(text) && !filtersTagsText.includes(t));
                        if (matches.length > 0) {
                            let exactMatch = matches.find(m => m === text);
                            addTagToFilterDiv(exactMatch || matches[0]);
                        }
                        this.value = "";
                        dropdown.classList.add("hidden");
                    }
                } else if (e.key === "Backspace" && this.value === "" && filtersTagsText.length > 0) {
                    filtersTagsText.pop();
                    renderFilterTags();
                    applyFilter();
                    document.getElementById("filter-tags-text-inner-input").focus();
                } else if (e.key === "Escape") {
                    dropdown.classList.add("hidden");
                }
            };

            document.addEventListener("click", function (e) {
                if (!container.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add("hidden");
                }
            });

            container.appendChild(input);

            let allTags = getAllTags();
            let availableTags = allTags.filter(t => !filtersTagsText.includes(t));

            if (allTags.length === 0) {
                input.disabled = true;
                container.classList.add("disabled");
                input.placeholder = all_strings["no-tags-available"] || "No tags available";
            } else if (availableTags.length === 0 && filtersTagsText.length > 0) {
                input.style.display = "none";
            } else {
                input.disabled = false;
                container.classList.remove("disabled");
                input.placeholder = all_strings["choose-placeholder"] || "Choose...";
                input.focus();
            }

            container.onclick = function () {
                if (!input.disabled) input.focus();
            };
        }

        renderFilterTags();
        window.addFolderToFilterDiv = addFolderToFilterDiv;
        window.renderFilterFolders = renderFilterFolders;
        window.addTagToFilterDiv = addTagToFilterDiv;
        window.renderFilterTags = renderFilterTags;

        // ── Filter by colour ──────────────────────────────────────────────
        function renderFilterColours(shouldFocus = false) {
            let container = document.getElementById("filter-colour-input");
            if (!container) return;
            container.innerHTML = "";
            container.className = "custom-tag-input-container filter-input-container";

            filtersColors.forEach((colour, index) => {
                let chip = document.createElement("span");
                chip.className = "tag-chip filter-chip";

                let bgColor = (colour !== "none") ? colour : "";
                let fgColor = bgColor ? getWCAGTextColor(bgColor) : "";

                let text = document.createElement("span");
                text.className = "tag-chip-text";
                let colourLabel = colour === "none" ? all_strings["none-colour"] : (colourListDefault[colour] || colour);
                text.textContent = colourLabel;
                if (bgColor) { text.style.backgroundColor = bgColor; text.style.color = fgColor; }
                chip.appendChild(text);

                let remove = document.createElement("span");
                remove.className = "tag-chip-remove";
                remove.textContent = "×";
                if (bgColor) {
                    remove.style.backgroundColor = bgColor;
                    remove.style.color = fgColor;
                    remove.style.borderLeftColor = fgColor === "#ffffff" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)";
                }
                remove.onclick = function (e) {
                    e.stopPropagation();
                    filtersColors.splice(index, 1);
                    renderFilterColours(true);
                    applyFilter();
                };
                chip.appendChild(remove);
                container.appendChild(chip);
            });

            let input = document.createElement("input");
            input.type = "text";
            input.id = "filter-colour-inner-input";
            input.className = "tag-inner-input";
            input.placeholder = all_strings["choose-placeholder"] || "Choose...";

            let dropdown = document.createElement("div");
            dropdown.className = "autocomplete-dropdown hidden";
            dropdown.style.position = "fixed";
            dropdown.style.zIndex = "20000";
            document.body.appendChild(dropdown);

            function getAllColourOptions() {
                let list = [{key: "none", label: all_strings["none-colour"]}];
                list = list.concat(Object.entries(colourListDefault).map(([k, v]) => ({key: k, label: v})));
                return list;
            }

            function updateColourDropdown(text) {
                dropdown.innerHTML = "";
                let matches = getAllColourOptions().filter(c =>
                    c.label.toLowerCase().includes(text.toLowerCase()) && !filtersColors.includes(c.key)
                );
                if (matches.length > 0) {
                    matches.forEach(match => {
                        let item = document.createElement("div");
                        item.className = "autocomplete-item";
                        item.textContent = match.label;
                        if (match.key !== "none") {
                            item.classList.add("color-bg-item");
                            item.style.backgroundColor = match.key;
                            item.style.color = getWCAGTextColor(match.key);
                        }
                        item.onclick = function (e) {
                            e.stopPropagation();
                            if (!filtersColors.includes(match.key)) {
                                filtersColors.push(match.key);
                                renderFilterColours(true);
                                applyFilter();
                            }
                        };
                        dropdown.appendChild(item);
                    });
                    hideAllDropdowns();
                    dropdown.classList.remove("hidden");
                    checkDropdownScrollbar(dropdown, input);
                } else {
                    dropdown.classList.add("hidden");
                }
            }

            input.oninput = function () { updateColourDropdown(this.value.trim()); };
            input.onfocus = function () { updateColourDropdown(this.value.trim()); };
            input.onclick = function (e) { e.stopPropagation(); updateColourDropdown(this.value.trim()); };

            input.onkeydown = function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    let text = this.value.trim().toLowerCase();
                    let matches = getAllColourOptions().filter(c =>
                        c.label.toLowerCase().includes(text) && !filtersColors.includes(c.key)
                    );
                    if (matches.length > 0) {
                        let exact = matches.find(m => m.label.toLowerCase() === text);
                        let toAdd = (exact || matches[0]).key;
                        if (!filtersColors.includes(toAdd)) {
                            filtersColors.push(toAdd);
                            renderFilterColours(true);
                            applyFilter();
                        }
                    }
                    this.value = "";
                    dropdown.classList.add("hidden");
                } else if (e.key === "Backspace" && this.value === "" && filtersColors.length > 0) {
                    filtersColors.pop();
                    renderFilterColours(true);
                    applyFilter();
                } else if (e.key === "Escape") {
                    dropdown.classList.add("hidden");
                }
            };

            document.addEventListener("click", function (e) {
                if (!container.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add("hidden");
            });

            container.appendChild(input);
            let available = getAllColourOptions().filter(c => !filtersColors.includes(c.key));
            if (available.length === 0 && filtersColors.length > 0) {
                input.style.display = "none";
                hideAllDropdowns(); // hide any dropdown left open before this render
            } else if (shouldFocus) {
                input.focus({preventScroll: true});
            }
            container.onclick = function () { input.focus({preventScroll: true}); };
        }

        renderFilterColours();
        window.renderFilterColours = renderFilterColours;

        // ── Filter by type ────────────────────────────────────────────────
        const typeOptions = [
            {key: "global",  label: () => all_strings["global-label"]},
            {key: "domain",  label: () => all_strings["domain-label"]},
            {key: "page",    label: () => all_strings["page-label"]},
        ];

        function renderFilterTypes(shouldFocus = false) {
            let container = document.getElementById("filter-type-input");
            if (!container) return;
            container.innerHTML = "";
            container.className = "custom-tag-input-container filter-input-container";

            filtersTypes.forEach((type, index) => {
                let opt = typeOptions.find(o => o.key === type);
                let chip = document.createElement("span");
                chip.className = "tag-chip filter-chip";

                let text = document.createElement("span");
                text.className = "tag-chip-text";
                text.textContent = opt ? opt.label() : type;
                chip.appendChild(text);

                let remove = document.createElement("span");
                remove.className = "tag-chip-remove";
                remove.textContent = "×";
                remove.onclick = function (e) {
                    e.stopPropagation();
                    filtersTypes.splice(index, 1);
                    renderFilterTypes(true);
                    applyFilter();
                };
                chip.appendChild(remove);
                container.appendChild(chip);
            });

            let input = document.createElement("input");
            input.type = "text";
            input.id = "filter-type-inner-input";
            input.className = "tag-inner-input";
            input.placeholder = all_strings["choose-placeholder"] || "Choose...";

            let dropdown = document.createElement("div");
            dropdown.className = "autocomplete-dropdown hidden";
            dropdown.style.position = "fixed";
            dropdown.style.zIndex = "20000";
            document.body.appendChild(dropdown);

            function updateTypeDropdown(text) {
                dropdown.innerHTML = "";
                let matches = typeOptions.filter(o =>
                    o.label().toLowerCase().includes(text.toLowerCase()) && !filtersTypes.includes(o.key)
                );
                if (matches.length > 0) {
                    matches.forEach(opt => {
                        let item = document.createElement("div");
                        item.className = "autocomplete-item";
                        item.textContent = opt.label();
                        item.onclick = function (e) {
                            e.stopPropagation();
                            if (!filtersTypes.includes(opt.key)) {
                                filtersTypes.push(opt.key);
                                renderFilterTypes(true);
                                applyFilter();
                            }
                        };
                        dropdown.appendChild(item);
                    });
                    hideAllDropdowns();
                    dropdown.classList.remove("hidden");
                    checkDropdownScrollbar(dropdown, input);
                } else {
                    dropdown.classList.add("hidden");
                }
            }

            input.oninput = function () { updateTypeDropdown(this.value.trim()); };
            input.onfocus = function () { updateTypeDropdown(this.value.trim()); };
            input.onclick = function (e) { e.stopPropagation(); updateTypeDropdown(this.value.trim()); };

            input.onkeydown = function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    let text = this.value.trim().toLowerCase();
                    let matches = typeOptions.filter(o =>
                        o.label().toLowerCase().includes(text) && !filtersTypes.includes(o.key)
                    );
                    if (matches.length > 0) {
                        let exact = matches.find(m => m.label().toLowerCase() === text);
                        let toAdd = (exact || matches[0]).key;
                        if (!filtersTypes.includes(toAdd)) {
                            filtersTypes.push(toAdd);
                            renderFilterTypes(true);
                            applyFilter();
                        }
                    }
                    this.value = "";
                    dropdown.classList.add("hidden");
                } else if (e.key === "Backspace" && this.value === "" && filtersTypes.length > 0) {
                    filtersTypes.pop();
                    renderFilterTypes(true);
                    applyFilter();
                } else if (e.key === "Escape") {
                    dropdown.classList.add("hidden");
                }
            };

            document.addEventListener("click", function (e) {
                if (!container.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add("hidden");
            });

            container.appendChild(input);
            let available = typeOptions.filter(o => !filtersTypes.includes(o.key));
            if (available.length === 0 && filtersTypes.length > 0) {
                input.style.display = "none";
                hideAllDropdowns(); // hide any dropdown left open before this render
            } else if (shouldFocus) {
                input.focus({preventScroll: true});
            }
            container.onclick = function () { input.focus({preventScroll: true}); };
        }

        renderFilterTypes();
        window.renderFilterTypes = renderFilterTypes;
    } catch (e) {
        console.error(`E-L2: ${e}`);
        onError("all-notes.js::setLanguageUI", e.message);
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
        sendTelemetry("all-notes-aside");
        window.open(links_aside_bar["all-notes"], "_self");
    }
    settings.innerHTML = all_strings["settings-aside"];
    settings.onclick = function () {
        sendTelemetry("settings-aside");
        window.open(links_aside_bar["settings"], "_self");
    }
    help.innerHTML = all_strings["help-aside"];
    help.onclick = function () {
        sendTelemetry("help-aside");
        window.open(links_aside_bar["help"], "_self");
    }
    website.innerHTML = all_strings["website-aside"];
    website.onclick = function () {
        sendTelemetry("website-aside");
        window.open(links_aside_bar["website"], "_self")
    }
    donate.innerHTML = all_strings["donate-aside"];
    donate.onclick = function () {
        sendTelemetry("donate-aside");
        window.open(links_aside_bar["donate"], "_self");
    }
    translate.innerHTML = all_strings["translate-aside"];
    translate.onclick = function () {
        sendTelemetry("translate-aside");
        window.open(links_aside_bar["translate"], "_self");
    }

    version.innerHTML = all_strings["version-aside"].replaceAll("{{version}}", browser.runtime.getManifest().version);

    //get the current tabUrl
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        if (tabs.length > 0) {
            let tabUrl = tabs[0].url;
            //if it starts with "about:addons"
            if (tabUrl.startsWith("about:addons")) {
                document.getElementById("all-notes-dedication-section").classList.add("from-firefox-addons");
            } else {
                if (document.getElementById("all-notes-dedication-section").classList.contains("from-firefox-addons")) {
                    document.getElementById("all-notes-dedication-section").classList.remove("from-firefox-addons");
                }
            }
        }
    });
}

function hideAllPopups() {
    let backgroundOpacity = document.getElementById("background-opacity");

    if (document.getElementById("fullscreen-notes-viewer").style.display === "block") {
        document.getElementById("fullscreen-notes-viewer").style.display = "none";
    }

    if (document.getElementById("notefox-server-error-section").style.display === "block") {
        //nothing: notefox server error is NOT "skippable"
    } else {
        //hide background opacity only if no other popup is shown (account-section is excluded)
        hideBackgroundOpacity();
    }
}

function hideBackgroundOpacity() {
    document.getElementById("background-opacity").style.display = "none";
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
                            url: link.href, index: tabs[0].index + 1
                        });
                    });
                } else {
                    // Prevent the default link behavior
                }
                event.preventDefault();
                sendTelemetry(`link-clicked`, "all-notes.js", link.href);
            }
        });
    }
}

function updateLastUpdate() {
    sync_local.set({"last-update": getDate()});
}

function loadDataFromBrowser(called_by = null, generate_section = true) {
    console.log(`Loading data from browser | called by: ${called_by}`);

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
            if (settings_json["open-popup-sidebar"] === undefined) settings_json["open-popup-sidebar"] = "Ctrl+Alt+S";
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
            if (settings_json["font-family"] === undefined || !supportedFontFamily.includes(settings_json["font-family"])) settings_json["font-family"] = "Merienda";
            if (settings_json["datetime-format"] === undefined || !supportedDatetimeFormat.includes(settings_json["datetime-format"])) settings_json["datetime-format"] = "yyyymmdd1";
            if (settings_json["notes-background-follow-tag-colour"] === undefined) settings_json["notes-background-follow-tag-colour"] = false;

            //console.log(JSON.stringify(settings_json));
            if (generate_section) {
                websites_json_by_domain = {};
                loadAllWebsites(true, sort_by_selected);
            }
            // Aggiorna i filtri dopo il caricamento dei dati
            renderFilterFolders();
            renderFilterTags();
            if (typeof renderFilterColours === "function") renderFilterColours();
            if (typeof renderFilterTypes === "function") renderFilterTypes();
            renderSearchChips();
            initCustomSelects();
        });
        applyFilter();
    } catch (e) {
        console.error(`E-L3: ${e}`);
        onError("all-notes.js::loadDataFromBrowser", e.message);
    }
}

function clearAllNotesDomain(url) {
    // Check if confirmation popup is disabled
    let shouldConfirm = !(settings_json["disable-confirmation-popup"] === true || settings_json["disable-confirmation-popup"] === "yes");

    let confirmation = true;
    if (shouldConfirm) {
        confirmation = confirm(all_strings["clear-all-notes-domain-confirmation"]);
    }

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
            loadDataFromBrowser("E", true);
            updateLastUpdate();
        });
    }
}

function clearAllNotesPage(url, isDomain = false) {
    let messageToShow = all_strings["clear-all-notes-page-without-url-confirmation"];
    if (!isDomain) {
        messageToShow = all_strings["clear-all-notes-page-with-confirmation"].replaceAll("{{url}}", url);
    }

    // Check if confirmation popup is disabled
    let shouldConfirm = !(settings_json["disable-confirmation-popup"] === true || settings_json["disable-confirmation-popup"] === "yes");

    let confirmation = true;
    if (shouldConfirm) {
        confirmation = confirm(messageToShow);
    }

    if (confirmation) {
        //delete the selected page
        delete websites_json[url];
        websites_json_to_show = websites_json;

        sync_local.set({"websites": websites_json}, function () {
            loadDataFromBrowser("F", true);
            updateLastUpdate();
        });
    }
}

function onCleared() {
    //all notes clear || successful
    loadDataFromBrowser("G", true);
    //loadAllWebsites(true, true);
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
                        input_clear_all_notes_domain.classList.add("button", "small-button", "clear-button", "clear-button-float-right");
                        input_clear_all_notes_domain.onclick = function () {
                            clearAllNotesDomain(domain);
                            sendTelemetry(`clear-all-notes-domain`, "all-notes.js", domain);
                        }

                        let h2_container = document.createElement("div");
                        h2_container.classList.add("h2-container");
                        h2_container.classList.add("h2-container")
                        let h2 = document.createElement("h2");
                        h2.textContent = domain;
                        if (isUrlSupported(domain)) {
                            h2.classList.add("link", "go-to-external", "domain");
                            h2.onclick = function () {
                                sendTelemetry(`go-to-domain`, "all-notes.js", domain);
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
                        page = generateNotes(page, urlPageDomain, notes, title, "", lastUpdate, type_to_show, urlPageDomain, type_to_use, true);

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
                                let title = websites_json_to_show[urlPageDomain]["title"];
                                let notes = websites_json_to_show[urlPageDomain]["notes"];
                                let content = websites_json_to_show[urlPageDomain]["content"] || "";

                                page = generateNotes(page, urlPage, notes, title, content, lastUpdate, all_strings["page-label"], urlPageDomain, "page", false);

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
        onError("all-notes.js::loadAllWebsites", e.message);
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
    let searchInput = document.getElementById("search-all-notes-text");
    let searchValue = searchInput ? searchInput.value : "";
    search(searchValue);
}

function renderSearchChips() {
    let container = document.getElementById("search-all-notes-container");
    if (!container) return;

    // Preserve the input
    let input = document.getElementById("search-all-notes-text");
    if (!input) {
        input = document.createElement("input");
        input.type = "text";
        input.id = "search-all-notes-text";
        input.className = "tag-inner-input search-all-notes-text";
        input.placeholder = all_strings["search-textbox"] || "Search...";
    }

    container.className = "custom-tag-input-container";
    container.innerHTML = "";

    filtersSearchTerms.forEach((term, index) => {
        let chip = document.createElement("span");
        chip.className = "tag-chip";

        let termText = document.createElement("span");
        termText.className = "tag-chip-text";
        termText.textContent = term;
        chip.appendChild(termText);

        let remove = document.createElement("span");
        remove.className = "tag-chip-remove";
        remove.textContent = "×";
        remove.onclick = function (e) {
            e.stopPropagation();
            filtersSearchTerms.splice(index, 1);
            renderSearchChips();
            applyFilter();
        };
        chip.appendChild(remove);
        container.appendChild(chip);
    });

    input.onkeydown = function (e) {
        if (e.key === "Enter") {
            let val = this.value.trim();
            if (val && !filtersSearchTerms.includes(val.toLowerCase())) {
                e.preventDefault();
                filtersSearchTerms.push(val.toLowerCase());
                this.value = "";
                renderSearchChips();
                applyFilter();
                document.getElementById("search-all-notes-text").focus();
            } else if (val) {
                e.preventDefault();
                this.value = "";
            }
        } else if (e.key === "Backspace" && this.value === "" && filtersSearchTerms.length > 0) {
            filtersSearchTerms.pop();
            renderSearchChips();
            applyFilter();
            document.getElementById("search-all-notes-text").focus();
        }
    };

    input.oninput = function () {
        applyFilter();
    };

    container.appendChild(input);

    container.onclick = function () {
        input.focus();
    };
}

function search(value = "") {
    try {
        //console.log(JSON.stringify(websites_json_to_show))
        websites_json_to_show = {};

        let valueToUse = [...filtersSearchTerms];
        if (value && value.trim() !== "") {
            valueToUse.push(value.trim().toLowerCase());
        }

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

            let condition_folder = true;
            if (filtersFolder.length > 0) {
                condition_folder = filtersFolder.includes(current_website_json["tag-folder"] || "");
            }

            let condition_tags_text = true;
            if (filtersTagsText.length > 0) {
                if (current_website_json["tags-text"] && Array.isArray(current_website_json["tags-text"])) {
                    condition_tags_text = filtersTagsText.every(ft => current_website_json["tags-text"].some(t => t.toLowerCase() === ft.toLowerCase()));
                } else {
                    condition_tags_text = false;
                }
            }

            //if (condition_type) console.log(getType(websites_json[website], website) + "   " + JSON.stringify(websites_json[website]))
            let title_to_use = "";
            if (current_website_json["title"] !== undefined) title_to_use = current_website_json["title"].toLowerCase();

            if (valid_results === 0) {
                if (condition_tag_color && condition_type && condition_folder && condition_tags_text) {
                    websites_json_to_show[website] = websites_json[website];
                }
            } else {
                let anyMatch = valueToUse.some(key => {
                    key = key.toLowerCase();
                    let contentMatch = settings_json["search-page-content"] && current_website_json["content"] && current_website_json["content"].toLowerCase().includes(key);
                    let folderMatch = current_website_json["tag-folder"] && current_website_json["tag-folder"].toLowerCase().includes(key);
                    let tagsMatch = current_website_json["tags-text"] && Array.isArray(current_website_json["tags-text"]) && current_website_json["tags-text"].some(t => t.toLowerCase().includes(key));
                    return (current_website_json["notes"].toLowerCase().includes(key) || contentMatch || current_website_json["domain"].toLowerCase().includes(key) || current_website_json["last-update"].toLowerCase().includes(key) || title_to_use.includes(key) || website.includes(key) || folderMatch || tagsMatch);
                });

                if (anyMatch && condition_tag_color && condition_type && condition_folder && condition_tags_text) {
                    websites_json_to_show[website] = websites_json[website];
                }
            }
        }
        loadAllWebsites(true, sort_by_selected, false);
    } catch (e) {
        console.error(`E-S1: ${e}`);
        onError("all-notes.js::search", e.message);
    }
}

function getType(website, url) {
    let valueToReturn = "";
    if (website !== undefined && website["domain"] !== undefined && url !== undefined) {
        if (url === "**global") valueToReturn = "global"; else if (website["domain"] !== "") valueToReturn = "page"; else valueToReturn = "domain";
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
    pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(data["lastUpdate"]));
    sendMessageUpdateToBackground();
}

function stripWildcardSuffix(url) {
    if (typeof url !== "string") return "";
    return url.endsWith("*") ? url.substring(0, url.length - 1) : url;
}

function getPageDisplayUrl(fullUrl) {
    try {
        let parsed = new URL(stripWildcardSuffix(fullUrl));
        let relative = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        return relative === "" ? "/" : relative;
    } catch (e) {
        return fullUrl;
    }
}

function normalizeEditedLink(rawValue, currentFullUrl, typeToUse) {
    let value = (rawValue || "").trim();
    if (value === "") return null;

    let normalizedType = (typeToUse || "").toLowerCase();
    let candidate = value;

    if (!candidate.includes("://")) {
        if (normalizedType === "page") {
            let currentDomain = websites_json[currentFullUrl] && websites_json[currentFullUrl]["domain"] ? websites_json[currentFullUrl]["domain"] : "";
            if (currentDomain === "") return null;
            candidate = candidate.startsWith("/") ? `${currentDomain}${candidate}` : `${currentDomain}/${candidate}`;
        } else if (normalizedType === "domain") {
            let protocol = getTheProtocol(currentFullUrl);
            candidate = `${protocol}://${candidate.replace(/^\/+/, "")}`;
        } else {
            return null;
        }
    }

    try {
        let parsed = new URL(stripWildcardSuffix(candidate));
        if (!isUrlSupported(parsed.href)) return null;
        if (normalizedType === "domain") return parsed.origin;
        return parsed.href;
    } catch (e) {
        return null;
    }
}

function updateWebsiteLink(oldUrl, newUrl, typeToUse) {
    return new Promise((resolve) => {
        if (!oldUrl || !newUrl || oldUrl === newUrl) {
            resolve(true);
            return;
        }

        sync_local.get("websites", function (value) {
            websites_json = value["websites"] || {};
            if (websites_json[oldUrl] === undefined) {
                resolve(false);
                return;
            }

            if (websites_json[newUrl] !== undefined) {
                alert("A note with this link already exists.");
                resolve(false);
                return;
            }

            websites_json[newUrl] = websites_json[oldUrl];
            delete websites_json[oldUrl];

            let normalizedType = (typeToUse || "").toLowerCase();
            if (normalizedType === "domain") {
                websites_json[newUrl]["domain"] = "";
            } else if (normalizedType === "page") {
                try {
                    websites_json[newUrl]["domain"] = new URL(stripWildcardSuffix(newUrl)).origin;
                } catch (e) {
                    resolve(false);
                    return;
                }
            }

            websites_json[newUrl]["last-update"] = getDate();
            websites_json_to_show = websites_json;

            sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
                resolve(true);
            });
        });
    });
}

function sendMessageUpdateToBackground() {
    browser.runtime.sendMessage({"updated": true});
}

function generateNotes(page, url, notes, title, content, lastUpdate, type, fullUrl, type_to_use, domain_again) {
    try {
        let pageContentLeft = document.createElement("div")
        pageContentLeft.classList.add("page-content-left")
        let pageContentRight = document.createElement("div");
        pageContentRight.classList.add("page-content-right");

        let row1 = document.createElement("div");
        row1.classList.add("rows");

        let pageType = document.createElement("div");
        pageType.classList.add("sub-section-type");
        pageType.textContent = type;

        let subrowUrl = document.createElement("div");
        subrowUrl.classList.add("subrow-url");

        let subrowButtons = document.createElement("div");
        subrowButtons.classList.add("subrow-buttons");

        //Button "Clear notes"
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
            sendTelemetry(`clear-all-notes-page`, "all-notes.js", fullUrl);
        }
        let pageTitleH3 = document.createElement("h3");
        let textNotes = document.createElement("div");
        let row2 = document.createElement("div");

        //Button "Edit notes"
        let inputInlineEdit = document.createElement("input");
        inputInlineEdit.type = "button";
        inputInlineEdit.value = all_strings["edit-notes-button"];
        inputInlineEdit.classList.add("button", "very-small-button", "edit-button", "button-no-text-on-mobile");
        let pageUrl = null;
        let openUrlOnClick = stripWildcardSuffix(fullUrl);

        inputInlineEdit.onclick = async function () {
            if (textNotes.contentEditable === "true") {
                let previousFullUrl = fullUrl;

                textNotes.contentEditable = "false";
                if (inputInlineEdit.classList.contains("finish-edit-button")) inputInlineEdit.classList.remove("finish-edit-button");
                if (pageTitleH3.classList.contains("inline-edit-title")) pageTitleH3.classList.remove("inline-edit-title");
                if (textNotes.classList.contains("inline-edit-notes")) textNotes.classList.remove("inline-edit-notes");
                inputInlineEdit.value = all_strings["edit-notes-button"];
                pageTitleH3.contentEditable = "false";
                textNotes.readOnly = true;

                if (pageUrl !== null) {
                    pageUrl.contentEditable = "false";
                    if (pageUrl.classList.contains("inline-edit-title")) pageUrl.classList.remove("inline-edit-title");
                    if (pageUrl.classList.contains("link-editing")) pageUrl.classList.remove("link-editing");

                    let normalizedLink = normalizeEditedLink(pageUrl.textContent, previousFullUrl, type_to_use);
                    if (normalizedLink === null) {
                        alert("Invalid link. Please enter a valid URL.");
                        pageUrl.textContent = (type_to_use.toLowerCase() === "page") ? getPageDisplayUrl(previousFullUrl) : previousFullUrl;
                    } else if (normalizedLink !== previousFullUrl) {
                        let changed = await updateWebsiteLink(previousFullUrl, normalizedLink, type_to_use);
                        if (changed) {
                            fullUrl = normalizedLink;
                            page.id = fullUrl;
                        }
                    }

                    openUrlOnClick = stripWildcardSuffix(fullUrl);
                    if (type_to_use.toLowerCase() === "page") {
                        pageUrl.textContent = getPageDisplayUrl(fullUrl);
                    } else {
                        pageUrl.textContent = fullUrl;
                    }
                }

                if (pageTitleH3.textContent.replaceAll("<br>", "") !== "") {
                    if (row2.classList.contains("hidden")) row2.classList.remove("hidden");
                } else {
                    row2.classList.add("hidden");
                }
                sendTelemetry(`finish-edit-notes`, "all-notes.js", fullUrl);
                if (previousFullUrl !== fullUrl) {
                    loadDataFromBrowser("LNK-EDIT", true);
                    return;
                }
            } else {
                textNotes.contentEditable = "true";
                inputInlineEdit.classList.add("finish-edit-button");
                inputInlineEdit.value = all_strings["finish-edit-notes-button"];
                pageTitleH3.contentEditable = "true";
                textNotes.readOnly = false;
                pageTitleH3.classList.add("inline-edit-title");
                textNotes.classList.add("inline-edit-notes");

                if (pageUrl !== null) {
                    pageUrl.contentEditable = "true";
                    pageUrl.classList.add("inline-edit-title");
                    pageUrl.classList.add("link-editing");
                    pageUrl.textContent = fullUrl;
                }

                setTimeout(() => {
                    if (pageUrl !== null) {
                        pageUrl.focus();
                    } else {
                        pageTitleH3.focus();
                    }
                }, 100);

                if (row2.classList.contains("hidden")) row2.classList.remove("hidden");

                sendTelemetry(`start-edit-notes`, "all-notes.js", fullUrl);
            }

        }
        pageTitleH3.onkeyup = function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                inputInlineEdit.click();
            }
        }

        //Button "Copy notes"
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

            sendTelemetry(`copy-notes`, "all-notes.js", fullUrl);
        }

        page.id = fullUrl;
        page.classList.add("notes-pages");
        if (settings_json["notes-background-follow-tag-colour"]) page.classList.add("background-as-tag-colour");

        subrowUrl.append(pageType);

        // Tag Color select — built here so it can be the leftmost element in subrowButtons
        let tagsColour = document.createElement("select");
        let colourList = colourListDefault;
        colourList = Object.assign({}, {"none": all_strings["none-colour"]}, colourList);
        for (let colour in colourList) {
            let tagColour = document.createElement("option");
            tagColour.value = colour;
            if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tag-colour"] !== undefined && websites_json[fullUrl]["tag-colour"] === colour) {
                tagColour.selected = true;
                pageContentLeft.classList.add("tag-colour-" + colour + "-bg");
            }
            tagColour.textContent = colourList[colour];
            tagsColour.classList.add("select-tag-all-notes", "button", "very-small-button", "tag-button", "no-text");
            tagsColour.dataset.colorValues = "true";
            tagsColour.append(tagColour);
        }
        tagsColour.onchange = function () {
            changeTagColour(fullUrl, tagsColour.value, type_to_use);
            sendTelemetry(`change-tag-colour::${tagsColour.value}`, "all-notes.js", fullUrl);
        }

        // Tag color goes first (leftmost), then show-content, edit, copy, clear
        subrowButtons.append(tagsColour);

        if (content !== undefined && content !== "") {
            //Button "Show content"
            let inputShowContent = document.createElement("input");
            inputShowContent.type = "button";
            inputShowContent.value = all_strings["show-content-button"];
            inputShowContent.classList.add("button", "very-small-button", "show-content-button", "button-no-text-on-mobile");
            inputShowContent.onclick = function () {
                sendTelemetry(`show-content`, "all-notes.js", fullUrl);
                alert(content); // Display the content in an alert for now, until a better UI is implemented.
            }

            subrowButtons.append(inputShowContent);
        }
        subrowButtons.append(inputInlineEdit);
        subrowButtons.append(inputCopyNotes);
        subrowButtons.append(inputClearAllNotesPage);

        if (type_to_use.toLowerCase() !== "global") {
            pageUrl = document.createElement("h3");
            pageUrl.classList.add("url");
            pageUrl.textContent = (type_to_use.toLowerCase() === "page") ? getPageDisplayUrl(fullUrl) : fullUrl;

            if (isUrlSupported(openUrlOnClick)) {
                pageUrl.classList.add("link", "go-to-external");
                pageUrl.onclick = function (e) {
                    if (textNotes.contentEditable === "true") {
                        e.preventDefault();
                        return;
                    }
                    let openAction = (type_to_use.toLowerCase() === "domain") ? "go-to-domain" : "go-to-page";
                    sendTelemetry(openAction, "all-notes.js", openUrlOnClick);
                    browser.tabs.create({url: openUrlOnClick});
                }
            }

            subrowUrl.append(pageUrl);
        }

        row1.append(subrowUrl);
        row1.append(subrowButtons)

        pageContentRight.append(row1);

        let pageLastUpdate = document.createElement("div");

        row2.classList.add("rows");

        let pageTitle = document.createElement("div");
        pageTitle.classList.add("sub-section-title");
        pageTitle.textContent = all_strings["title-label"];

        pageTitleH3.classList.add("title", "single-line");
        pageTitleH3.textContent = title;
        pageTitleH3.oninput = function () {
            let data = {
                title: pageTitleH3.textContent, lastUpdate: getDate()
            }
            onInputText(fullUrl, data, pageLastUpdate);
        }
        row2.classList.add("hidden");
        row2.append(pageTitle)
        if (title !== undefined && title !== "") {
            if (row2.classList.contains("hidden")) row2.classList.remove("hidden");
        }
        row2.append(pageTitleH3);

        pageContentRight.append(row2);

        let contentNotesContainer = document.createElement("div");
        contentNotesContainer.classList.add("content-notes--container");

        let contentNotes = document.createElement("div");
        contentNotes.classList.add("content-notes", "sub-section-notes");

        textNotes.readOnly = true;
        textNotes.innerHTML = notes;
        textNotes.contentEditable = false;
        textNotes.classList.add("textarea-all-notes");
        textNotes.oninput = function () {
            let data = {
                notes: textNotes.innerHTML, lastUpdate: getDate()
            }
            onInputText(fullUrl, data, pageLastUpdate);
        }
        textNotes.onpaste = function (e) {
            //Ctrl+V (or Cmd+V on Mac) to paste WITH HTML formatting, Ctrl+Shift+V (or Cmd+Shift+V on Mac) to paste WITHOUT HTML formatting
            if (((e.originalEvent || e).clipboardData).getData("text/html") !== "") {
                e.preventDefault(); // Prevent the default paste action
                let clipboardData = (e.originalEvent || e).clipboardData;
                let pastedText = clipboardData.getData("text/html");
                let sanitizedHTML = document.createElement("div");
                sanitizedHTML.innerHTML = pastedText;
                document.execCommand("insertHTML", false, sanitize(sanitizedHTML).innerHTML);
            } else if (((e.originalEvent || e).clipboardData).getData("text/plain") !== "") {
                e.preventDefault(); // Prevent the default paste action
                let clipboardData = (e.originalEvent || e).clipboardData;
                let pastedText = clipboardData.getData("text/plain");
                document.execCommand("insertText", false, pastedText);
            }
        }
        textNotes.onkeydown = function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
                bold();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
                italic();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
                underline();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                strikethrough();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
                insertLink();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
                hightlighter()
            }
        }
        listenerLinks(textNotes);

        let disable_word_wrap = false;
        if (settings_json["disable-word-wrap"] !== undefined) {
            if (settings_json["disable-word-wrap"] === "yes" || settings_json["disable-word-wrap"] === true) disable_word_wrap = true; else disable_word_wrap = false;
        }
        if (disable_word_wrap) {
            textNotes.style.whiteSpace = "normal";
        } else {
            textNotes.style.whiteSpace = "pre-wrap";
        }

        if (settings_json["font-family"] === undefined || !supportedFontFamily.includes(settings_json["font-family"])) settings_json["font-family"] = "Merienda";

        textNotes.style.fontFamily = `'${settings_json["font-family"]}'`;
        textNotes.style.setProperty("font-size", textSizeValues[settings_json["text-size"]], "important");

        let openFullscreenNotesButton = document.createElement("button");
        openFullscreenNotesButton.classList.add("button-format", "button");
        openFullscreenNotesButton.id = "open-fullscreen-notes-button";
        openFullscreenNotesButton.onclick = function () {
            showFullscreenNotes(textNotes);
            sendTelemetry(`open-fullscreen-notes`, "all-notes.js", fullUrl);
        }

        contentNotes.append(textNotes);
        contentNotesContainer.appendChild(contentNotes);
        if (settings_json["show-fullscreen-button-in-all-notes"]) {
            contentNotesContainer.appendChild(openFullscreenNotesButton);
        }

        pageContentRight.append(contentNotesContainer);

        pageLastUpdate.classList.add("sub-section-last-update");
        pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(lastUpdate));
        pageContentRight.append(pageLastUpdate);

        // --- TAGS SECTION IN BOTTOM (folder + tags-text only; tag-color is now in the action row) ---
        let tagsBottomContainer = document.createElement("div");
        tagsBottomContainer.className = "tags-bottom-container";

        // 1. Folder View Component
        let folderViewContainer = document.createElement("div");
        folderViewContainer.className = "folder-view-container";
        renderFolderView(folderViewContainer, fullUrl);
        tagsBottomContainer.append(folderViewContainer);

        // 2. Tags Text
        let tagsTextContainerAll = document.createElement("div");
        tagsTextContainerAll.className = "tags-text-container-all";
        renderTagsAllNotes(tagsTextContainerAll, fullUrl);
        tagsBottomContainer.append(tagsTextContainerAll);

        pageContentRight.append(tagsBottomContainer);

        page.append(pageContentLeft);
        page.append(pageContentRight);

        setTimeout(() => initCustomSelects(), 0);

        return page;
    } catch (e) {
        console.error(`E-G1: ${e}`);
        onError("all-notes.js::generateNotes", e.message);

        return undefined;
    }
}

function renderTagsAllNotes(container, fullUrl, shouldFocus = false) {
    if (!container) return;

    // Aggiorna il timestamp nella UI risalendo al genitore
    let pageContentRight = container.closest(".page-content-right");
    if (pageContentRight) {
        let lastUpdateElem = pageContentRight.querySelector(".sub-section-last-update");
        if (lastUpdateElem && websites_json[fullUrl] && websites_json[fullUrl]["last-update"]) {
            lastUpdateElem.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(websites_json[fullUrl]["last-update"]));
        }
    }

    container.innerHTML = "";
    container.className = "custom-tag-input-container tags-text-container-all";

    let tags = [];
    if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tags-text"] !== undefined) {
        tags = websites_json[fullUrl]["tags-text"];
    }

    if (Array.isArray(tags)) {
        tags.forEach((tag, index) => {
            let chip = document.createElement("div");
            chip.className = "tag-chip tag-chip-interactive";

            let tagText = document.createElement("span");
            tagText.className = "tag-chip-text";
            tagText.textContent = tag;
            tagText.onclick = function (e) {
                e.stopPropagation();
                applyTagFilter(tag);
            };
            chip.appendChild(tagText);

            let remove = document.createElement("span");
            remove.className = "tag-chip-remove";
            remove.textContent = "×";
            remove.onclick = function (e) {
                e.stopPropagation();
                removeTagAllNotes(fullUrl, index, container);
            };
            chip.appendChild(remove);
            container.appendChild(chip);
        });
    }

    let input = document.createElement("input");
    input.type = "text";
    input.className = "tag-inner-input";
    input.placeholder = all_strings["add-tag-placeholder"] || "...";

    // Custom autocomplete dropdown (non-binding): show tags used elsewhere, excluding those already on this note
    let dropdownId = "note-tag-dropdown-" + btoa(unescape(encodeURIComponent(fullUrl))).replace(/[^a-z0-9]/gi, "").substring(0, 24);
    let existingDd = document.getElementById(dropdownId);
    if (existingDd) existingDd.remove();
    let tagDropdown = document.createElement("div");
    tagDropdown.id = dropdownId;
    tagDropdown.className = "autocomplete-dropdown hidden";
    tagDropdown.style.position = "fixed";
    tagDropdown.style.zIndex = "20000";
    document.body.appendChild(tagDropdown);

    function getAvailableTags() {
        let all = new Set();
        for (let url in websites_json) {
            if (websites_json[url]["tags-text"]) {
                websites_json[url]["tags-text"].forEach(t => all.add(t.toLowerCase()));
            }
        }
        let current = tags.map(t => t.toLowerCase());
        return Array.from(all).filter(t => !current.includes(t)).sort();
    }

    function updateTagDropdown(text) {
        tagDropdown.innerHTML = "";
        let available = getAvailableTags();
        let matches = available.filter(t => t.includes(text.toLowerCase()));
        if (matches.length > 0) {
            matches.forEach(match => {
                let item = document.createElement("div");
                item.className = "autocomplete-item";
                item.textContent = match;
                item.onmousedown = function (e) {
                    e.preventDefault();
                    input.value = match;
                    addTagAllNotes(input, fullUrl, container);
                    tagDropdown.classList.add("hidden");
                };
                tagDropdown.appendChild(item);
            });
            hideAllDropdowns();
            tagDropdown.classList.remove("hidden");
            checkDropdownScrollbar(tagDropdown, input);
        } else {
            tagDropdown.classList.add("hidden");
        }
    }

    input.oninput = function () {
        updateTagDropdown(this.value.trim());
    };
    input.onfocus = function () {
        updateTagDropdown(this.value.trim());
    };
    input.onclick = function () {
        updateTagDropdown(this.value.trim());
    };
    input.onblur = function () {
        setTimeout(() => tagDropdown.classList.add("hidden"), 150);
    };
    input.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            addTagAllNotes(this, fullUrl, container);
            tagDropdown.classList.add("hidden");
        } else if (e.key === "Backspace" && this.value === "" && tags.length > 0) {
            removeTagAllNotes(fullUrl, tags.length - 1, container);
        } else if (e.key === "Escape") {
            tagDropdown.classList.add("hidden");
        }
    };
    container.appendChild(input);

    container.onclick = function () {
        input.focus();
    };

    if (shouldFocus) {
        input.focus();
    }

    initCustomSelects();
}

function applyTagFilter(tag) {
    let filterInput = document.getElementById("filter-tags-text-input");
    if (filterInput) {
        // Se è il div editable (nuova versione)
        if (filterInput.tagName === "DIV") {
            addTagToFilterDiv(tag);
        } else {
            // Vecchia versione o fallback
            let current = filterInput.value.trim();
            let tags = current ? current.split(";").map(t => t.trim()) : [];
            if (!tags.includes(tag)) {
                tags.push(tag);
                filterInput.value = tags.join(";");
                // Trigger input event
                filterInput.dispatchEvent(new Event('input'));
            }
        }
        // Mostra la sezione filtri se nascosta
        let filtersSection = document.getElementById("filters");
        if (filtersSection && filtersSection.classList.contains("hidden")) {
            document.getElementById("filter-all-notes-button").click();
        }
    }
}

function applyFolderFilter(folder) {
    if (!filtersFolder.includes(folder)) {
        filtersFolder.push(folder);
        window.renderFilterFolders();
        applyFilter();
    }
    let filtersSection = document.getElementById("filters");
    if (filtersSection && filtersSection.classList.contains("hidden")) {
        document.getElementById("filter-all-notes-button").click();
    }
}

function renderFolderView(container, fullUrl, shouldFocus = false) {
    if (!container) return;

    // Aggiorna il timestamp nella UI risalendo al genitore
    let pageContentRight = container.closest(".page-content-right");
    if (pageContentRight) {
        let lastUpdateElem = pageContentRight.querySelector(".sub-section-last-update");
        if (lastUpdateElem && websites_json[fullUrl] && websites_json[fullUrl]["last-update"]) {
            lastUpdateElem.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(websites_json[fullUrl]["last-update"]));
        }
    }

    container.innerHTML = "";
    container.className = "custom-tag-input-container folder-view-container";
    container.style.flexWrap = "nowrap";
    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";

    let currentFolder = (websites_json[fullUrl] && websites_json[fullUrl]["tag-folder"]) ? websites_json[fullUrl]["tag-folder"] : "";

    if (currentFolder) {
        let chip = document.createElement("div");
        chip.className = "tag-chip tag-chip-interactive";
        chip.style.margin = "0";

        let tagText = document.createElement("span");
        tagText.className = "tag-chip-text";
        tagText.textContent = currentFolder;
        tagText.title = all_strings["filter-folder-label"] || "Filter by folder";
        tagText.onclick = function (e) {
            e.stopPropagation();
            applyFolderFilter(currentFolder);
        };
        chip.appendChild(tagText);

        let remove = document.createElement("span");
        remove.className = "tag-chip-remove";
        remove.textContent = "×";
        remove.onclick = function (e) {
            e.stopPropagation();
            changeFolderAllNotes(fullUrl, "", container);
        };
        chip.appendChild(remove);
        container.appendChild(chip);
    } else {
        let input = document.createElement("input");
        input.type = "text";
        input.className = "tag-inner-input";
        input.placeholder = all_strings["new-folder-placeholder"] || "Folder...";

        // Custom autocomplete dropdown (non-binding)
        let dropdownId = "note-folder-dropdown-" + btoa(unescape(encodeURIComponent(fullUrl))).replace(/[^a-z0-9]/gi, "").substring(0, 24);
        let existingDd = document.getElementById(dropdownId);
        if (existingDd) existingDd.remove();
        let dropdown = document.createElement("div");
        dropdown.id = dropdownId;
        dropdown.className = "autocomplete-dropdown hidden";
        dropdown.style.position = "fixed";
        dropdown.style.zIndex = "20000";
        document.body.appendChild(dropdown);

        function updateFolderDropdown(text) {
            dropdown.innerHTML = "";
            let folders = getExistingFolders();
            let matches = folders.filter(f => f.toLowerCase().includes(text.toLowerCase()));
            if (matches.length > 0) {
                matches.forEach(match => {
                    let item = document.createElement("div");
                    item.className = "autocomplete-item";
                    item.textContent = match;
                    item.onmousedown = function (e) {
                        e.preventDefault();
                        changeFolderAllNotes(fullUrl, match, container);
                        dropdown.classList.add("hidden");
                    };
                    dropdown.appendChild(item);
                });
                hideAllDropdowns();
                dropdown.classList.remove("hidden");
                checkDropdownScrollbar(dropdown, input);
            } else {
                dropdown.classList.add("hidden");
            }
        }

        input.oninput = function () {
            updateFolderDropdown(this.value.trim());
        };
        input.onfocus = function () {
            updateFolderDropdown(this.value.trim());
        };
        input.onclick = function () {
            updateFolderDropdown(this.value.trim());
        };
        input.onblur = function () {
            setTimeout(() => dropdown.classList.add("hidden"), 150);
        };
        input.onkeydown = function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                let val = this.value.trim();
                if (val) {
                    changeFolderAllNotes(fullUrl, val, container);
                    dropdown.classList.add("hidden");
                }
            } else if (e.key === "Escape") {
                dropdown.classList.add("hidden");
            }
        };

        container.appendChild(input);
        container.onclick = function () {
            input.focus();
        };

        if (shouldFocus) {
            input.focus();
        }
    }
}


function addTagAllNotes(input, fullUrl, container) {
    let tag = input.value.trim().toLowerCase();
    if (tag !== "") {
        sync_local.get("websites", function (value) {
            websites_json = value["websites"] || {};
            if (websites_json[fullUrl] === undefined) {
                websites_json[fullUrl] = {
                    "notes": "",
                    "title": "",
                    "last-update": getDate(),
                    "tag-colour": "none",
                    "tags-text": [],
                    "tag-folder": ""
                };
            }
            if (websites_json[fullUrl]["tags-text"] === undefined) {
                websites_json[fullUrl]["tags-text"] = [];
            }
            if (!websites_json[fullUrl]["tags-text"].includes(tag)) {
                websites_json[fullUrl]["tags-text"].push(tag);
                websites_json[fullUrl]["last-update"] = getDate();
                input.value = "";
                sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
                    renderTagsAllNotes(container, fullUrl, true);
                    sendMessageUpdateToBackground();
                });
            }
        });
    }
}

function removeTagAllNotes(fullUrl, index, container) {
    sync_local.get("websites", function (value) {
        websites_json = value["websites"] || {};
        if (websites_json[fullUrl] !== undefined && websites_json[fullUrl]["tags-text"] !== undefined) {
            websites_json[fullUrl]["tags-text"].splice(index, 1);
            websites_json[fullUrl]["last-update"] = getDate();
            sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
                renderTagsAllNotes(container, fullUrl, true);
                sendMessageUpdateToBackground();
            });
        }
    });
}

function changeFolderAllNotes(fullUrl, folder, container) {
    sync_local.get("websites", function (value) {
        websites_json = value["websites"] || {};
        if (websites_json[fullUrl] === undefined) {
            websites_json[fullUrl] = {
                "notes": "",
                "title": "",
                "last-update": getDate(),
                "tag-colour": "none",
                "tags-text": [],
                "tag-folder": ""
            };
        }
        websites_json[fullUrl]["tag-folder"] = folder;
        websites_json[fullUrl]["last-update"] = getDate();
        sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
            // Se avevamo passato un container per renderFolderView, ri-renderizziamo con focus
            if (typeof container !== 'undefined') {
                renderFolderView(container, fullUrl, true);
            }
            loadDataFromBrowser("FOLDER-ALL", true);
            sendMessageUpdateToBackground();
        });
    });
}

function changeTagColour(url, colour) {
    sync_local.get("websites", function (value) {
        let websites_json = value["websites"] || {};
        if (websites_json[url] === undefined) {
            websites_json[url] = {
                "notes": "",
                "title": "",
                "last-update": getDate(),
                "tag-colour": colour,
                "tags-text": [],
                "tag-folder": ""
            };
        } else {
            websites_json[url]["tag-colour"] = colour;
            websites_json[url]["last-update"] = getDate();
        }
        sync_local.set({"websites": websites_json, "last-update": getDate()}, function () {
            loadDataFromBrowser("H", true);
            sendMessageUpdateToBackground();
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
        onError("all-notes.js::sortOnKeys", e.message);

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
        sendTelemetry(`login-expired-settings`);
        window.open(links_aside_bar["settings"], "_blank");
    }
    let loginExpiredClose = document.getElementById("login-expired-cancel-button");
    loginExpiredClose.value = all_strings["notefox-account-login-later-button"];
    loginExpiredClose.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
        sendTelemetry(`login-expired-close`);
    }
}

function showFullscreenNotes(notesText) {
    let section = document.getElementById("fullscreen-notes-viewer");
    let background = document.getElementById("background-opacity");

    section.style.display = "block";
    background.style.display = "block";

    let notesContent = document.getElementById("fullscreen-notes-viewer-content");
    notesContent.innerHTML = notesText.innerHTML;

    if (notesContent) {
        let disable_word_wrap = false;
        if (settings_json["disable-word-wrap"] !== undefined) {
            if (settings_json["disable-word-wrap"] === "yes" || settings_json["disable-word-wrap"] === true) disable_word_wrap = true; else disable_word_wrap = false;
        }
        if (disable_word_wrap) {
            notesContent.style.whiteSpace = "normal";
        } else {
            notesContent.style.whiteSpace = "pre-wrap";
        }

        if (settings_json["font-family"] === undefined || !supportedFontFamily.includes(settings_json["font-family"])) settings_json["font-family"] = "Merienda";

        notesContent.style.fontFamily = `'${settings_json["font-family"]}'`;
        notesContent.style.setProperty("font-size", textSizeValues[settings_json["text-size"]], "important");
    }

    sendTelemetry(`open-fullscreen-notes`);

    let closeButton = document.getElementById("close-fullscreen-notes-button");
    closeButton.onclick = function () {
        section.style.display = "none";
        background.style.display = "none";
        sendTelemetry(`close-fullscreen-notes`);
    }
}

function notefoxServerError() {
    let section = document.getElementById("notefox-server-error-section");
    let background = document.getElementById("background-opacity");

    section.style.display = "block";
    background.style.display = "block";

    let title = document.getElementById("notefox-server-error-title");
    title.textContent = all_strings["notefox-account-message-server-error-title"];
    let text = document.getElementById("notefox-server-error-text");
    text.innerHTML = all_strings["notefox-account-message-server-error-text"];
    let text2 = document.getElementById("notefox-server-error-text2");
    text2.innerHTML = all_strings["notefox-account-message-server-error-text2"];
    let text3 = document.getElementById("notefox-server-error-text3");
    text3.innerHTML = all_strings["notefox-account-message-server-error-text3"];
    let button1 = document.getElementById("notefox-server-error-button1");
    button1.value = all_strings["notefox-account-message-button1"];
    button1.onclick = function () {
        //log out
        section.style.display = "none";
        background.style.display = "none";

        browser.storage.sync.remove("notefox-account");
        browser.storage.local.set({"notefox-server-error-shown": true});
        sendTelemetry("notefox-server-error-logout");
        window.close();
    }
    let button2 = document.getElementById("notefox-server-error-button2");
    button2.value = all_strings["notefox-account-message-button2"];
    button2.onclick = function () {
        //close the message
        section.style.display = "none";
        background.style.display = "none";

        browser.storage.local.set({"notefox-server-error-shown": true}).then(() => {
            //console.log("Notefox server error shown set to true");
        });
        sendTelemetry("notefox-server-error-continue");
    }
}

function setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color) {
    if (background !== undefined && backgroundSection !== undefined && primary !== undefined && secondary !== undefined && on_primary !== undefined && on_secondary !== undefined) {
        document.body.style.backgroundColor = background;
        document.body.color = primary;
        //document.getElementById("all-notes-dedication-section").style.backgroundColor = backgroundSection;
        //document.getElementById("all-notes-dedication-section").style.color = theme.colors.icons;
        document.getElementById("all-notes-dedication-section").style.color = primary;
        let open_external_svg = window.btoa(getIconSvgEncoded("external-link", primary));
        let donate_svg = window.btoa(getIconSvgEncoded("donate", on_primary));
        let settings_svg = window.btoa(getIconSvgEncoded("settings", on_primary));
        let all_notes_aside_svg = window.btoa(getIconSvgEncoded("all-notes", on_primary));
        let settings_aside_svg = window.btoa(getIconSvgEncoded("settings", primary));
        let help_aside_svg = window.btoa(getIconSvgEncoded("help", primary));
        let review_aside_svg = window.btoa(getIconSvgEncoded("review", primary));
        let website_aside_svg = window.btoa(getIconSvgEncoded("website", primary));
        let donate_aside_svg = window.btoa(getIconSvgEncoded("donate", primary));
        let translate_aside_svg = window.btoa(getIconSvgEncoded("translate", primary));
        let external_link_aside_svg = window.btoa(getIconSvgEncoded("external-link", primary));
        let download_svg = window.btoa(getIconSvgEncoded("download", on_primary));
        let delete_svg = window.btoa(getIconSvgEncoded("delete", on_primary));
        let delete2_svg = window.btoa(getIconSvgEncoded("delete2", on_primary));
        let copy_svg = window.btoa(getIconSvgEncoded("copy", on_primary));
        let show_content_svg = window.btoa(getIconSvgEncoded("show-content", on_primary));
        let edit_svg = window.btoa(getIconSvgEncoded("edit", on_primary));
        let finish_edit_svg = window.btoa(getIconSvgEncoded("finish-edit", on_primary));
        let filter = window.btoa(getIconSvgEncoded("filter", on_primary));
        let sort_by = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        let tag_svg = window.btoa(getIconSvgEncoded("tag", on_primary));
        let refresh_svg = window.btoa(getIconSvgEncoded("refresh", on_primary));
        let sort_by_svg = window.btoa(getIconSvgEncoded("sort-by", on_primary));
        let arrow_select_svg = window.btoa(getIconSvgEncoded("arrow-select", on_primary));
        let search_svg = window.btoa(getIconSvgEncoded("search", primary));
        let fullscreen_svg = window.btoa(getIconSvgEncoded("fullscreen", on_primary));
        let close_svg = window.btoa(getIconSvgEncoded("close", on_primary));
        let login_svg = window.btoa(getIconSvgEncoded("login", on_primary));
        let logout_svg = window.btoa(getIconSvgEncoded("logout", on_primary));

        let primaryTransparent = primary;
        if (primaryTransparent.includes("rgb(")) {
            let rgb_temp = primaryTransparent.replace("rgb(", "");
            let rgb_temp_arr = rgb_temp.split(",");
            if (rgb_temp_arr.length >= 3) {
                let red = rgb_temp_arr[0].replace(" ", "");
                let green = rgb_temp_arr[1].replace(" ", "");
                let blue = rgb_temp_arr[2].replace(")", "").replace(" ", "");
                primaryTransparent = `rgba(${red}, ${green}, ${blue}, 0.8)`;
            }
        } else if (primaryTransparent.includes("#")) {
            primaryTransparent += "88";
        }
        let tertiary = backgroundSection;
        let tertiaryTransparent = primary;
        let tertiaryTransparent2 = primary;
        let tertiaryTransparent3 = primary;
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
            tertiaryTransparent3 += "BB";
        }
        //console.log(tertiaryTransparent);

        document.head.innerHTML += `
            <style>
                :root {
                    --primary-color: ${primary};
                    --primary-color-transparent: ${primaryTransparent};
                    --secondary-color: ${secondary};
                    --on-primary-color: ${on_primary};
                    --on-secondary-color: ${on_secondary};
                    --textbox-color: ${textbox_background};
                    --on-textbox-color: ${textbox_color};
                    --tertiary: ${tertiary};
                    --tertiary-transparent: ${tertiaryTransparent};
                    --tertiary-transparent-2: ${tertiaryTransparent2};
                    --tertiary-transparent-3: ${tertiaryTransparent3};
                    --background-color: ${background};
                    --background-section-color: ${backgroundSection};
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
                    background-image: url('data:image/svg+xml;base64,${help_aside_svg}'), url('data:image/svg+xml;base64,${external_link_aside_svg}');
                }
                #review-aside {
                    background-image: url('data:image/svg+xml;base64,${review_aside_svg}'), url('data:image/svg+xml;base64,${external_link_aside_svg}');
                }
                #website-aside {
                    background-image: url('data:image/svg+xml;base64,${website_aside_svg}'), url('data:image/svg+xml;base64,${external_link_aside_svg}');
                }
                #donate-aside {
                    background-image: url('data:image/svg+xml;base64,${donate_aside_svg}'), url('data:image/svg+xml;base64,${external_link_aside_svg}');
                }
                #translate-aside {
                    background-image: url('data:image/svg+xml;base64,${translate_aside_svg}'), url('data:image/svg+xml;base64,${external_link_aside_svg}');
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
                .show-content-button {
                    background-image: url('data:image/svg+xml;base64,${show_content_svg}');
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
                .cst-arrow {
                    background-image: url('data:image/svg+xml;base64,${arrow_select_svg}') !important;
                }
                #custom-select-trigger-sort-by-all-notes-button .cst-label {
                    background-image: url('data:image/svg+xml;base64,${sort_by_svg}') !important;
                }
                .custom-select-trigger.select-tag-all-notes .cst-label {
                    background-image: url('data:image/svg+xml;base64,${tag_svg}') !important;
                }
                .search-all-notes-text {
                    background-image: url('data:image/svg+xml;base64,${search_svg}');
                }
                
                .login-button {
                    background-image: url('data:image/svg+xml;base64,${login_svg}');
                }
                .logout-button {
                    background-image: url('data:image/svg+xml;base64,${logout_svg}');
                }
                
                #open-fullscreen-notes-button {
                    background-image: url('data:image/svg+xml;base64,${fullscreen_svg}');
                }
                #close-fullscreen-notes-button {
                    background-image: url('data:image/svg+xml;base64,${close_svg}');
                }
                
                h2.domain, div.h2-container {
                    background-color: ${background};
                }
            </style>`;
    }
}

loaded();

