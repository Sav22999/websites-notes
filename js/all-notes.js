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
const colourListWithNone = Object.assign({}, {"none": all_strings["none-colour"]}, colourListDefault);

let sync_local = browser.storage.local;
checkSyncLocal();

let sort_by_selected = "name-az";
let filtersColors = [];
let filtersTypes = [];
let filtersFolder = [];
let filtersTagsText = [];
let filtersSearchTerms = [];

let isLoadingData = true;
let currentLoadToken = 0;
let currentRenderToken = 0;
let searchDebounceTimer = null;
let scrollToRestore = null; //scroll position to restore while the notes are loaded again

function restoreScroll(isLastChunk) {
    if (scrollToRestore === null) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (!isLastChunk && maxScroll < scrollToRestore) return;
    window.scrollTo(0, scrollToRestore);
    scrollToRestore = null;
}

//the user is already scrolling: don't move the page
["wheel", "touchmove", "keydown"].forEach((name) => window.addEventListener(name, () => scrollToRestore = null, {passive: true}));

function showLoadingNotes(loadedCount = null, totalCount = null, compact = false) {
    let section = document.getElementById("loading-notes-section");
    let textEl = document.getElementById("loading-notes-text");
    if (!section || !textEl) return;

    if (loadedCount !== null && totalCount !== null && totalCount > 0) {
        let template = all_strings["loading-notes-progress-text"] || "Loading… {{loaded}} / {{total}}";
        textEl.textContent = template
            .replaceAll("{{loaded}}", String(loadedCount))
            .replaceAll("{{total}}", String(totalCount));
    } else {
        textEl.textContent = all_strings["loading-notes-text"] || "Loading…";
    }

    if (compact) {
        section.classList.add("section-loading-compact");
    } else {
        section.classList.remove("section-loading-compact");
    }
    section.classList.remove("hidden");
}

function hideLoadingNotes() {
    let section = document.getElementById("loading-notes-section");
    if (!section) return;
    section.classList.add("hidden");
    section.classList.remove("section-loading-compact");
}

const sharedNoteDropdowns = {};
function getSharedNoteAutocompleteDropdown(type) {
    if (!sharedNoteDropdowns[type] || !document.body.contains(sharedNoteDropdowns[type])) {
        let dd = document.createElement("div");
        dd.id = `shared-note-${type}-dropdown`;
        dd.className = "autocomplete-dropdown hidden";
        dd.style.position = "fixed";
        dd.style.zIndex = "20000";
        document.body.appendChild(dd);
        sharedNoteDropdowns[type] = dd;
    }
    return sharedNoteDropdowns[type];
}

const NOTE_SELECTION_SEP = "\u0000";
let selectedNoteKeys = new Set();
let visibleNoteKeys = [];
let domainNoteKeysMap = new Map();
let json_to_export_selected = null;

function makeNoteSelectionKey(fullUrl, noteIndex = 0) {
    return `${fullUrl}${NOTE_SELECTION_SEP}${noteIndex}`;
}

function pruneSelectedNoteKeys() {
    const next = new Set();
    selectedNoteKeys.forEach((key) => {
        const sepIdx = key.lastIndexOf(NOTE_SELECTION_SEP);
        if (sepIdx === -1) return;
        const url = key.substring(0, sepIdx);
        const noteIdx = Number.parseInt(key.substring(sepIdx + NOTE_SELECTION_SEP.length), 10);
        if (websites_json[url] && Array.isArray(websites_json[url]["all-notes"]) && websites_json[url]["all-notes"][noteIdx]) {
            next.add(key);
        }
    });
    selectedNoteKeys = next;
}

function syncDomainCheckbox(domain) {
    let keys = domainNoteKeysMap.get(domain);
    if (!keys || keys.length === 0) return;
    let domainCheckboxes = document.querySelectorAll(".domain-select-checkbox");
    let cb = null;
    for (let i = 0; i < domainCheckboxes.length; i++) {
        if (domainCheckboxes[i].dataset.domainKey === domain) {
            cb = domainCheckboxes[i];
            break;
        }
    }
    if (!cb) return;
    let selectedInDomain = 0;
    for (let i = 0; i < keys.length; i++) {
        if (selectedNoteKeys.has(keys[i])) selectedInDomain++;
    }
    cb.checked = selectedInDomain === keys.length;
    cb.indeterminate = selectedInDomain > 0 && selectedInDomain < keys.length;
}

function syncVisibleCheckboxes() {
    let itemCheckboxes = document.querySelectorAll(".note-item-checkbox");
    itemCheckboxes.forEach((cb) => {
        let isSelected = selectedNoteKeys.has(cb.dataset.noteKey);
        cb.checked = isSelected;
        let pageEl = cb.closest(".notes-pages");
        if (pageEl) {
            if (isSelected) pageEl.classList.add("note-selected");
            else pageEl.classList.remove("note-selected");
        }
    });

    let domainCheckboxes = document.querySelectorAll(".domain-select-checkbox");
    domainCheckboxes.forEach((cb) => {
        let keys = domainNoteKeysMap.get(cb.dataset.domainKey) || [];
        let selectedInDomain = 0;
        for (let i = 0; i < keys.length; i++) {
            if (selectedNoteKeys.has(keys[i])) selectedInDomain++;
        }
        cb.checked = keys.length > 0 && selectedInDomain === keys.length;
        cb.indeterminate = selectedInDomain > 0 && selectedInDomain < keys.length;
    });
}

function updateSelectionToolbar() {
    let toolbar = document.getElementById("selection-toolbar");
    let selectAllCheckbox = document.getElementById("select-all-notes-checkbox");
    let countSpan = document.getElementById("selected-notes-count");
    let bulkLabelsBtn = document.getElementById("bulk-labels-button");
    let bulkArchiveBtn = document.getElementById("bulk-archive-button");
    let exportBtn = document.getElementById("export-selected-notes-button");
    if (!toolbar || !selectAllCheckbox) return;

    if (visibleNoteKeys.length === 0 && selectedNoteKeys.size === 0) {
        toolbar.classList.add("hidden");
        closeBulkLabelsMenu();
        return;
    }
    toolbar.classList.remove("hidden");

    let selectedVisibleCount = 0;
    for (let i = 0; i < visibleNoteKeys.length; i++) {
        if (selectedNoteKeys.has(visibleNoteKeys[i])) selectedVisibleCount++;
    }

    selectAllCheckbox.disabled = visibleNoteKeys.length === 0 && selectedNoteKeys.size === 0;
    selectAllCheckbox.checked = visibleNoteKeys.length > 0 && selectedVisibleCount === visibleNoteKeys.length;
    selectAllCheckbox.indeterminate = (selectedVisibleCount > 0 && selectedVisibleCount < visibleNoteKeys.length) || (selectedVisibleCount === 0 && selectedNoteKeys.size > 0);

    let totalSelected = selectedNoteKeys.size;
    if (totalSelected > 0) {
        if (countSpan) {
            let tpl = all_strings["selected-notes-count-text"] || "{{count}} selected";
            countSpan.textContent = tpl.replaceAll("{{count}}", String(totalSelected));
            countSpan.classList.remove("hidden");
        }
        if (bulkLabelsBtn) bulkLabelsBtn.classList.remove("hidden");
        if (bulkArchiveBtn) {
            const inArchive = currentViewMode === "archive";
            bulkArchiveBtn.value = inArchive
                ? (all_strings["unarchive-selected-button"] || "Move out of Archive")
                : (all_strings["archive-selected-button"] || "Archive");
            if (inArchive) {
                bulkArchiveBtn.classList.remove("archive-button");
                bulkArchiveBtn.classList.add("unarchive-button");
            } else {
                bulkArchiveBtn.classList.remove("unarchive-button");
                bulkArchiveBtn.classList.add("archive-button");
            }
            bulkArchiveBtn.classList.remove("hidden");
        }
        if (exportBtn) exportBtn.classList.remove("hidden");
    } else {
        if (countSpan) countSpan.classList.add("hidden");
        if (bulkLabelsBtn) bulkLabelsBtn.classList.add("hidden");
        if (bulkArchiveBtn) bulkArchiveBtn.classList.add("hidden");
        if (exportBtn) exportBtn.classList.add("hidden");
        closeBulkLabelsMenu();
    }
}

function triggerDownloadJsonBlob(dataStr, filename) {
    const blob = new Blob([dataStr], {type: "application/json"});
    const objectUrl = URL.createObjectURL(blob);

    const fallbackLinkDownload = () => {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    };

    if (browser && browser.permissions && typeof browser.permissions.request === "function") {
        try {
            browser.permissions.request({permissions: ["downloads"]}).then((granted) => {
                if (granted && browser.downloads && typeof browser.downloads.download === "function") {
                    browser.downloads.download({
                        url: objectUrl,
                        filename: filename,
                        saveAs: false,
                    });
                } else {
                    fallbackLinkDownload();
                }
            }).catch(() => {
                fallbackLinkDownload();
            });
        } catch (e) {
            fallbackLinkDownload();
        }
    } else {
        fallbackLinkDownload();
    }
}

function exportSelectedNotes() {
    pruneSelectedNoteKeys();
    const {websites: exportedWebsites, count} = buildPartialExportWebsites(websites_json, selectedNoteKeys, NOTE_SELECTION_SEP);
    if (count === 0) {
        updateSelectionToolbar();
        return;
    }

    const manifest = browser.runtime.getManifest();
    const notefoxMeta = {
        version: manifest.version,
        author: manifest.author,
        manifest_version: manifest.manifest_version,
        os: currentOS || "?",
        browser: typeof webBrowserUsed !== "undefined" ? webBrowserUsed : "firefox",
    };

    json_to_export_selected = {
        notefox: notefoxMeta,
        websites: currentViewMode === "archive" ? {} : exportedWebsites,
        "last-update": getDate(),
    };
    if (currentViewMode === "archive") json_to_export_selected["websites-archive"] = exportedWebsites;

    const jsonString = JSON.stringify(json_to_export_selected);
    const exportSection = document.getElementById("export-section");
    const background = document.getElementById("background-opacity");
    const textExport = document.getElementById("text-export");
    const jsonExportEl = document.getElementById("json-export");
    const cancelBtn = document.getElementById("cancel-export-all-notes-button");
    const copyBtn = document.getElementById("copy-now-all-notes-button");
    const toFileBtn = document.getElementById("export-to-file-button");

    if (!exportSection || !jsonExportEl) return;

    if (textExport) {
        let tpl = all_strings["export-selected-json-message-dialog-text"] ||
            "Exporting {{count}} selected notes. You can download them as a JSON file or click <span {{parameters}}>Copy now</span> to copy the code.";
        textExport.innerHTML = tpl
            .replaceAll("{{count}}", String(count))
            .replaceAll("{{parameters}}", "class='button-code'");
    }
    jsonExportEl.value = jsonString;
    if (cancelBtn) cancelBtn.value = all_strings["cancel-button"] || "Cancel";
    if (copyBtn) copyBtn.value = all_strings["copy-now-button"] || "Copy now";
    if (toFileBtn) toFileBtn.value = all_strings["export-notes-to-file-button"] || "Export directly to file";

    if (background) background.style.display = "block";
    exportSection.style.display = "block";

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            exportSection.style.display = "none";
            hideBackgroundOpacity();
        };
    }

    if (copyBtn) {
        copyBtn.onclick = function () {
            jsonExportEl.value = jsonString;
            jsonExportEl.select();
            document.execCommand("copy");
            if (cancelBtn) cancelBtn.value = all_strings["close-button"] || "Close";
            copyBtn.value = all_strings["copied-button"] || "Copied";
            sendTelemetry("copy-selected-notes-export", "all-notes.js");
        };
    }

    if (toFileBtn) {
        toFileBtn.onclick = function () {
            const today = new Date();
            const formattedDate = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, "0")}_${String(today.getDate()).padStart(2, "0")}`;
            const filename = `notefox_selected_${notefoxMeta.version}_${formattedDate}_${Date.now()}.json`;
            triggerDownloadJsonBlob(jsonString, filename);
            if (cancelBtn) cancelBtn.value = all_strings["close-button"] || "Close";
            toFileBtn.value = all_strings["exported-notes-to-file-button"] || "Exported to file";
            sendTelemetry("export-selected-notes-to-file", "all-notes.js");
            setTimeout(() => {
                if (exportSection.style.display !== "none" && cancelBtn) {
                    cancelBtn.click();
                }
            }, 1000);
        };
    }

    sendTelemetry("export-selected-notes", "all-notes.js");
}

let currentViewMode = "active"; // "active" | "archive"
let labels_registry = normalizeLabelsRegistry(null);

function getCurrentWebsitesStorageKey() {
    return currentViewMode === "archive" ? "websites-archive" : "websites";
}

function getExistingFolders() {
    let folders = new Set();
    if (labels_registry && Array.isArray(labels_registry.folders)) {
        labels_registry.folders.forEach((f) => {
            if (f && f.trim() !== "") folders.add(f.trim());
        });
    }
    for (let url in websites_json) {
        let entry = websites_json[url];
        if (entry && Array.isArray(entry["all-notes"])) {
            for (let note of entry["all-notes"]) {
                let folder = note["tag-folder"];
                if (folder && folder !== "") folders.add(folder);
            }
        }
    }
    return Array.from(folders).sort();
}

function getExistingTags() {
    let tags = new Set();
    if (labels_registry && Array.isArray(labels_registry.tags)) {
        labels_registry.tags.forEach((t) => {
            if (t && t.trim() !== "") tags.add(t.trim().toLowerCase());
        });
    }
    for (let url in websites_json) {
        let entry = websites_json[url];
        if (entry && Array.isArray(entry["all-notes"])) {
            for (let note of entry["all-notes"]) {
                if (Array.isArray(note["tags-text"])) {
                    note["tags-text"].forEach((t) => {
                        if (t && t.trim() !== "") tags.add(t.trim().toLowerCase());
                    });
                }
            }
        }
    }
    return Array.from(tags).sort();
}

function closeBulkLabelsMenu() {
    let menu = document.getElementById("bulk-labels-menu");
    if (menu) menu.classList.add("hidden");
}

function switchViewMode(mode) {
    const nextMode = mode === "archive" ? "archive" : "active";
    if (nextMode === currentViewMode) return;
    currentViewMode = nextMode;
    selectedNoteKeys.clear();
    closeBulkLabelsMenu();

    let activeBtn = document.getElementById("view-active-notes-button");
    let archiveBtn = document.getElementById("view-archive-notes-button");
    if (activeBtn) {
        if (currentViewMode === "active") activeBtn.classList.add("view-tab-active");
        else activeBtn.classList.remove("view-tab-active");
    }
    if (archiveBtn) {
        if (currentViewMode === "archive") archiveBtn.classList.add("view-tab-active");
        else archiveBtn.classList.remove("view-tab-active");
    }

    loadDataFromBrowser("VIEW-" + currentViewMode, true);
    scrollToRestore = null; //another list: it starts from the top
}

function countNotesInStore(store) {
    if (!store || typeof store !== "object") return 0;
    let total = 0;
    for (const url in store) {
        if (!Object.prototype.hasOwnProperty.call(store, url)) continue;
        const entry = store[url];
        if (!entry) continue;
        if (Array.isArray(entry["all-notes"])) {
            total += entry["all-notes"].length;
        } else if (entry["notes"] !== undefined) {
            total += 1;
        }
    }
    return total;
}

function updateArchiveTabLabel(archiveStore) {
    const archiveBtn = document.getElementById("view-archive-notes-button");
    if (!archiveBtn) return;
    const baseLabel = (all_strings && all_strings["archive-tab-label"]) ? all_strings["archive-tab-label"] : "Archive";
    const count = countNotesInStore(archiveStore);
    archiveBtn.value = count > 0 ? `${baseLabel} (${count})` : baseLabel;
}

/**
 * Read again the notes of the current view before changing them: the ones in
 * memory may be older than the saved ones (popup, sticky notes, inline edits).
 */
function refreshNotesThen(callback) {
    const storageKey = getCurrentWebsitesStorageKey();
    sync_local.get([storageKey, "labels-registry"], function (value) {
        if (storageKey !== getCurrentWebsitesStorageKey()) return;
        const fresh = (value && value[storageKey]) ? value[storageKey] : {};
        migrateWebsites(fresh);
        selectedNoteKeys = remapNoteKeys(selectedNoteKeys, websites_json, fresh, NOTE_SELECTION_SEP);
        websites_json = fresh;
        labels_registry = normalizeLabelsRegistry(value && value["labels-registry"]);
        callback(storageKey);
    });
}

function archiveOrUnarchiveSingleNote(fullUrl, noteIndex, toArchive) {
    const shownWebsites = websites_json;
    closeBulkLabelsMenu();

    sync_local.get(["websites", "websites-archive"], function (result) {
        const activeWs = (result && result["websites"]) ? result["websites"] : {};
        const archiveWs = (result && result["websites-archive"]) ? result["websites-archive"] : {};

        const source = toArchive ? activeWs : archiveWs;
        const target = toArchive ? archiveWs : activeWs;
        migrateWebsites(source);
        const singleSet = remapNoteKeys(new Set([makeNoteSelectionKey(fullUrl, noteIndex)]), shownWebsites, source, NOTE_SELECTION_SEP);
        const moved = moveSelectedNotesBetweenStores(source, target, singleSet, NOTE_SELECTION_SEP);
        if (moved.movedCount === 0) {
            loadDataFromBrowser("ARCHIVE-SINGLE-NOT-FOUND", true);
            return;
        }

        const nextActive = toArchive ? moved.source : moved.target;
        const nextArchive = toArchive ? moved.target : moved.source;

        sync_local.set({
            "websites": nextActive,
            "websites-archive": nextArchive,
            "last-update": getDate(),
        }, function () {
            for (const k of Array.from(selectedNoteKeys)) {
                if (k.startsWith(fullUrl + NOTE_SELECTION_SEP)) {
                    selectedNoteKeys.delete(k);
                }
            }
            updateArchiveTabLabel(nextArchive);
            loadDataFromBrowser(toArchive ? "ARCHIVE-SINGLE" : "UNARCHIVE-SINGLE", true);
            sendMessageUpdateToBackground();
            sendTelemetry(toArchive ? "archive-note" : "unarchive-note", "all-notes.js");
        });
    });
}

function archiveOrUnarchiveSelected(toArchive) {
    pruneSelectedNoteKeys();
    if (selectedNoteKeys.size === 0) return;
    closeBulkLabelsMenu();

    sync_local.get(["websites", "websites-archive"], function (result) {
        const activeWs = (result && result["websites"]) ? result["websites"] : {};
        const archiveWs = (result && result["websites-archive"]) ? result["websites-archive"] : {};

        const source = toArchive ? activeWs : archiveWs;
        const target = toArchive ? archiveWs : activeWs;
        migrateWebsites(source);
        selectedNoteKeys = remapNoteKeys(selectedNoteKeys, websites_json, source, NOTE_SELECTION_SEP);
        const moved = moveSelectedNotesBetweenStores(source, target, selectedNoteKeys, NOTE_SELECTION_SEP);
        if (moved.movedCount === 0) {
            loadDataFromBrowser("ARCHIVE-NOT-FOUND", true);
            return;
        }

        const nextActive = toArchive ? moved.source : moved.target;
        const nextArchive = toArchive ? moved.target : moved.source;

        sync_local.set({
            "websites": nextActive,
            "websites-archive": nextArchive,
            "last-update": getDate(),
        }, function () {
            selectedNoteKeys.clear();
            updateArchiveTabLabel(nextArchive);
            loadDataFromBrowser(toArchive ? "ARCHIVE" : "UNARCHIVE", true);
            sendMessageUpdateToBackground();
        });
    });
}

function getSelectedNotesArray() {
    const out = [];
    const byUrl = parseSelectionKeysByUrl(selectedNoteKeys, NOTE_SELECTION_SEP);
    byUrl.forEach((indicesSet, url) => {
        const entry = websites_json[url];
        if (!entry || !Array.isArray(entry["all-notes"])) return;
        indicesSet.forEach((idx) => {
            if (entry["all-notes"][idx]) out.push(entry["all-notes"][idx]);
        });
    });
    return out;
}

function applyBulkTagAction(tag, add) {
    refreshNotesThen(function (storageKey) {
        const {websites: updatedWs, updatedCount} = bulkApplyTagToSelected(websites_json, selectedNoteKeys, tag, add, NOTE_SELECTION_SEP);
        const labelAdded = add && addLabelToRegistry(labels_registry, "tag", tag);
        websites_json = updatedWs;
        saveBulkLabels(storageKey, updatedCount > 0, labelAdded, renderFilterTags);
    });
}

function applyBulkFolderAction(folder) {
    refreshNotesThen(function (storageKey) {
        const {websites: updatedWs, updatedCount} = bulkSetFolderOnSelected(websites_json, selectedNoteKeys, folder, NOTE_SELECTION_SEP);
        const labelAdded = addLabelToRegistry(labels_registry, "folder", folder);
        websites_json = updatedWs;
        saveBulkLabels(storageKey, updatedCount > 0, labelAdded, renderFilterFolders);
    });
}

function saveBulkLabels(storageKey, notesChanged, registryChanged, renderFilter) {
    const refreshUI = function () {
        renderFilter();
        applyFilter();
        renderBulkLabelsMenu();
    };
    if (!notesChanged && !registryChanged) {
        refreshUI();
        return;
    }
    const payload = {"last-update": getDate()};
    if (notesChanged) payload[storageKey] = websites_json;
    if (registryChanged) payload["labels-registry"] = labels_registry;
    sync_local.set(payload, function () {
        refreshUI();
        if (notesChanged && storageKey === "websites") sendMessageUpdateToBackground();
    });
}

let bulkLabelsCreateKind = "tag"; // "tag" | "folder"
let manageLabelsCancelInlineHandler = null;

const LABEL_UI_ICONS = {
    tag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    close: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
};

function getNewLabelPlaceholder(kind) {
    if (kind === "folder") {
        return all_strings["manage-labels-new-folder-placeholder"] || "New folder name…";
    }
    return all_strings["manage-labels-new-tag-placeholder"] || "New tag name…";
}

function renderBulkLabelsMenu() {
    let menu = document.getElementById("bulk-labels-menu");
    if (!menu) return;
    menu.onclick = function (e) {
        e.stopPropagation();
    };
    menu.innerHTML = "";

    const selectedNotes = getSelectedNotesArray();
    const totalSel = selectedNotes.length;

    // Header: title + selected count badge + close button
    let header = document.createElement("div");
    header.className = "bulk-labels-header";
    let headerLeft = document.createElement("div");
    headerLeft.className = "bulk-labels-header-left";
    let headerIcon = document.createElement("span");
    headerIcon.className = "bulk-labels-icon";
    headerIcon.innerHTML = LABEL_UI_ICONS.tag;
    let headerTitle = document.createElement("span");
    headerTitle.className = "bulk-labels-header-title";
    headerTitle.textContent = all_strings["bulk-labels-button"] || "Labels";
    let headerCount = document.createElement("span");
    headerCount.className = "bulk-labels-header-badge";
    let countTpl = all_strings["selected-notes-count-text"] || "{{count}} selected";
    headerCount.textContent = countTpl.replaceAll("{{count}}", String(totalSel));
    headerLeft.appendChild(headerIcon);
    headerLeft.appendChild(headerTitle);
    headerLeft.appendChild(headerCount);

    let closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "bulk-labels-close-btn";
    closeBtn.title = all_strings["close-button"] || "Close";
    closeBtn.setAttribute("aria-label", all_strings["close-button"] || "Close");
    closeBtn.innerHTML = LABEL_UI_ICONS.close;
    closeBtn.onclick = function (e) {
        e.stopPropagation();
        closeBulkLabelsMenu();
    };
    header.appendChild(headerLeft);
    header.appendChild(closeBtn);
    menu.appendChild(header);

    // Scrollable body
    let body = document.createElement("div");
    body.className = "bulk-labels-body";

    // 1. Tags section
    let tagsHeader = document.createElement("div");
    tagsHeader.className = "bulk-labels-section-title";
    tagsHeader.textContent = all_strings["labels-menu-tags-section"] || "Tags";
    body.appendChild(tagsHeader);

    let allTags = getExistingTags();
    let tagsList = document.createElement("div");
    tagsList.className = "bulk-labels-items-list";
    if (allTags.length === 0) {
        let emptyTag = document.createElement("div");
        emptyTag.className = "bulk-labels-empty";
        emptyTag.textContent = all_strings["no-tags-available"] || "No tags available";
        tagsList.appendChild(emptyTag);
    } else {
        allTags.forEach((tag) => {
            let countWithTag = 0;
            selectedNotes.forEach((n) => {
                if (Array.isArray(n["tags-text"]) && n["tags-text"].some((t) => (t || "").toLowerCase() === tag)) {
                    countWithTag++;
                }
            });
            let isAll = totalSel > 0 && countWithTag === totalSel;
            let isPartial = countWithTag > 0 && countWithTag < totalSel;

            let row = document.createElement("label");
            row.className = "bulk-labels-check-row" + (isAll ? " bulk-labels-item-active" : "");
            let cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "note-select-checkbox";
            cb.checked = isAll;
            cb.indeterminate = isPartial;
            cb.onchange = function (e) {
                e.stopPropagation();
                applyBulkTagAction(tag, this.checked);
            };
            let span = document.createElement("span");
            span.className = "bulk-labels-item-name";
            span.textContent = tag;
            row.appendChild(cb);
            row.appendChild(span);
            if (isPartial) {
                let partialBadge = document.createElement("span");
                partialBadge.className = "bulk-labels-partial-count";
                partialBadge.textContent = `${countWithTag}/${totalSel}`;
                row.appendChild(partialBadge);
            }
            tagsList.appendChild(row);
        });
    }
    body.appendChild(tagsList);

    // 2. Folders section
    let foldersHeader = document.createElement("div");
    foldersHeader.className = "bulk-labels-section-title";
    foldersHeader.textContent = all_strings["labels-menu-folders-section"] || "Folders";
    body.appendChild(foldersHeader);

    let allFolders = getExistingFolders();
    let foldersList = document.createElement("div");
    foldersList.className = "bulk-labels-items-list";

    const addFolderRow = (folderVal, labelText) => {
        let matchCount = 0;
        selectedNotes.forEach((n) => {
            if ((n["tag-folder"] || "") === folderVal) matchCount++;
        });
        let allMatch = totalSel > 0 && matchCount === totalSel;
        let partialMatch = matchCount > 0 && matchCount < totalSel;

        let btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bulk-labels-action-item" + (allMatch ? " bulk-labels-item-active" : "");

        let iconSpan = document.createElement("span");
        iconSpan.className = "bulk-labels-icon";
        iconSpan.innerHTML = LABEL_UI_ICONS.folder;
        let textSpan = document.createElement("span");
        textSpan.className = "bulk-labels-item-name";
        textSpan.textContent = labelText;

        btn.appendChild(iconSpan);
        btn.appendChild(textSpan);

        if (allMatch) {
            let checkSpan = document.createElement("span");
            checkSpan.className = "bulk-labels-active-check";
            checkSpan.innerHTML = LABEL_UI_ICONS.check;
            btn.appendChild(checkSpan);
        } else if (partialMatch) {
            let partialBadge = document.createElement("span");
            partialBadge.className = "bulk-labels-partial-count";
            partialBadge.textContent = `${matchCount}/${totalSel}`;
            btn.appendChild(partialBadge);
        }

        btn.onclick = function (e) {
            e.stopPropagation();
            applyBulkFolderAction(folderVal);
        };
        foldersList.appendChild(btn);
    };

    addFolderRow("", all_strings["no-folder-label"] || "No folder");
    allFolders.forEach((folder) => addFolderRow(folder, folder));
    body.appendChild(foldersList);

    // 3. Create new inline block (segmented kind toggle + full-width input)
    let createHeader = document.createElement("div");
    createHeader.className = "bulk-labels-section-title";
    createHeader.textContent = all_strings["labels-menu-create-new"] || "Create new";
    body.appendChild(createHeader);

    let createBlock = document.createElement("div");
    createBlock.className = "bulk-labels-create-block";
    createBlock.onclick = (e) => e.stopPropagation();

    let kindTabs = document.createElement("div");
    kindTabs.className = "bulk-labels-kind-tabs";

    let kindTagBtn = document.createElement("button");
    kindTagBtn.type = "button";
    kindTagBtn.className = "bulk-labels-kind-tab" + (bulkLabelsCreateKind === "tag" ? " view-tab-active" : "");
    kindTagBtn.textContent = all_strings["labels-menu-tags-section"] || "Tags";

    let kindFolderBtn = document.createElement("button");
    kindFolderBtn.type = "button";
    kindFolderBtn.className = "bulk-labels-kind-tab" + (bulkLabelsCreateKind === "folder" ? " view-tab-active" : "");
    kindFolderBtn.textContent = all_strings["labels-menu-folders-section"] || "Folders";

    let createRow = document.createElement("div");
    createRow.className = "bulk-labels-create-row";

    let createInput = document.createElement("input");
    createInput.type = "text";
    createInput.className = "textbox bulk-labels-create-input";
    createInput.placeholder = getNewLabelPlaceholder(bulkLabelsCreateKind);

    const updateKindButtons = () => {
        if (bulkLabelsCreateKind === "tag") {
            kindTagBtn.classList.add("view-tab-active");
            kindFolderBtn.classList.remove("view-tab-active");
        } else {
            kindFolderBtn.classList.add("view-tab-active");
            kindTagBtn.classList.remove("view-tab-active");
        }
        createInput.placeholder = getNewLabelPlaceholder(bulkLabelsCreateKind);
    };
    kindTagBtn.onclick = function (e) {
        e.stopPropagation();
        bulkLabelsCreateKind = "tag";
        updateKindButtons();
        createInput.focus();
    };
    kindFolderBtn.onclick = function (e) {
        e.stopPropagation();
        bulkLabelsCreateKind = "folder";
        updateKindButtons();
        createInput.focus();
    };
    kindTabs.appendChild(kindTagBtn);
    kindTabs.appendChild(kindFolderBtn);

    let createBtn = document.createElement("input");
    createBtn.type = "button";
    createBtn.className = "button very-small-button bulk-labels-create-btn";
    createBtn.value = all_strings["manage-labels-create-button"] || "Create";

    const commitCreate = () => {
        let val = createInput.value.trim();
        if (!val) return;
        if (bulkLabelsCreateKind === "tag") {
            applyBulkTagAction(val, true);
        } else {
            applyBulkFolderAction(val);
        }
    };
    createBtn.onclick = function (e) {
        e.stopPropagation();
        commitCreate();
    };
    createInput.onkeydown = function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            commitCreate();
        }
    };
    createRow.appendChild(createInput);
    createRow.appendChild(createBtn);

    createBlock.appendChild(kindTabs);
    createBlock.appendChild(createRow);
    body.appendChild(createBlock);

    menu.appendChild(body);

    // 4. Footer: Manage labels action
    let footer = document.createElement("div");
    footer.className = "bulk-labels-footer";

    let manageBtn = document.createElement("button");
    manageBtn.type = "button";
    manageBtn.className = "button very-small-button button-close-notefox-account bulk-labels-manage-btn";
    let manageIcon = document.createElement("span");
    manageIcon.className = "bulk-labels-icon";
    manageIcon.innerHTML = LABEL_UI_ICONS.tag;
    let manageText = document.createElement("span");
    manageText.textContent = all_strings["manage-labels-button"] || "Manage labels";
    manageBtn.appendChild(manageIcon);
    manageBtn.appendChild(manageText);
    manageBtn.onclick = function (e) {
        e.stopPropagation();
        closeBulkLabelsMenu();
        openManageLabelsModal();
    };

    footer.appendChild(manageBtn);
    menu.appendChild(footer);

    if (!menu.classList.contains("hidden")) {
        positionBulkLabelsMenu();
    }
}

function positionBulkLabelsMenu() {
    let menu = document.getElementById("bulk-labels-menu");
    let btn = document.getElementById("bulk-labels-button");
    if (!menu || !btn) return;

    if (menu.parentElement !== document.body) {
        document.body.appendChild(menu);
    }

    const rect = btn.getBoundingClientRect();
    const gap = 6;
    const margin = 12;

    menu.style.visibility = "hidden";
    menu.classList.remove("hidden");

    const menuWidth = menu.offsetWidth || 320;
    const menuHeight = menu.offsetHeight || 360;
    const vw = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 1024;
    const vh = window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 768;

    let left = rect.right - menuWidth;
    if (left < margin) left = Math.max(margin, rect.left);
    if (left + menuWidth > vw - margin) left = Math.max(margin, vw - menuWidth - margin);

    let top = rect.bottom + gap;
    if (top + menuHeight > vh - margin && rect.top - gap - menuHeight >= margin) {
        top = rect.top - gap - menuHeight;
    } else if (top + menuHeight > vh - margin) {
        top = Math.max(margin, vh - menuHeight - margin);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.right = "auto";
    menu.style.visibility = "visible";
}

function toggleBulkLabelsMenu(e) {
    if (e) e.stopPropagation();
    let menu = document.getElementById("bulk-labels-menu");
    if (!menu) return;
    if (menu.classList.contains("hidden")) {
        hideAllDropdowns();
        renderBulkLabelsMenu();
        positionBulkLabelsMenu();
    } else {
        menu.classList.add("hidden");
    }
}

window.addEventListener("resize", () => {
    let menu = document.getElementById("bulk-labels-menu");
    if (menu && !menu.classList.contains("hidden")) {
        positionBulkLabelsMenu();
    }
});

let manageLabelsActiveTab = "tag"; // "tag" | "folder"

function openManageLabelsModal() {
    const section = document.getElementById("manage-labels-section");
    const background = document.getElementById("background-opacity");
    const titleEl = document.getElementById("manage-labels-title");
    const tabTags = document.getElementById("manage-labels-tab-tags");
    const tabFolders = document.getElementById("manage-labels-tab-folders");
    const newInput = document.getElementById("manage-labels-new-input");
    const createBtn = document.getElementById("manage-labels-create-button");
    const listEl = document.getElementById("manage-labels-list");
    const closeBtn = document.getElementById("close-manage-labels-button");
    if (!section || !listEl) return;

    closeBulkLabelsMenu();

    if (titleEl) titleEl.textContent = all_strings["manage-labels-title"] || "Manage labels";
    if (newInput) {
        newInput.value = "";
        newInput.placeholder = getNewLabelPlaceholder(manageLabelsActiveTab);
    }
    if (createBtn) createBtn.value = all_strings["manage-labels-create-button"] || "Create";
    if (closeBtn) closeBtn.value = all_strings["close-button"] || "Close";

    let cachedActive = {};
    let cachedArchived = {};
    let cachedRegistry = normalizeLabelsRegistry(labels_registry);
    let editingName = null;
    let confirmDeleteName = null;
    let highlightedName = null;

    const closeModal = () => {
        editingName = null;
        confirmDeleteName = null;
        manageLabelsCancelInlineHandler = null;
        section.style.display = "none";
        hideBackgroundOpacity();
    };

    manageLabelsCancelInlineHandler = () => {
        if (editingName !== null || confirmDeleteName !== null) {
            editingName = null;
            confirmDeleteName = null;
            renderList();
            return true;
        }
        return false;
    };

    const setTabContent = (tabBtn, iconHtml, labelText, count, isActive) => {
        if (!tabBtn) return;
        tabBtn.innerHTML = "";
        const iconSpan = document.createElement("span");
        iconSpan.className = "manage-labels-tab-icon";
        iconSpan.innerHTML = iconHtml;
        const textSpan = document.createElement("span");
        textSpan.textContent = labelText;
        const countBadge = document.createElement("span");
        countBadge.className = "manage-labels-tab-count";
        countBadge.textContent = String(count);
        tabBtn.appendChild(iconSpan);
        tabBtn.appendChild(textSpan);
        tabBtn.appendChild(countBadge);
        if (isActive) {
            tabBtn.classList.add("view-tab-active");
            tabBtn.setAttribute("aria-selected", "true");
        } else {
            tabBtn.classList.remove("view-tab-active");
            tabBtn.setAttribute("aria-selected", "false");
        }
    };

    //the notes are read again at each change: they may have been edited while the modal is open
    const changeStores = (change) => {
        sync_local.get(["websites", "websites-archive", "labels-registry"], function (result) {
            const active = (result && result["websites"]) ? result["websites"] : {};
            const archived = (result && result["websites-archive"]) ? result["websites-archive"] : {};
            migrateWebsites(active);
            migrateWebsites(archived);
            const changed = change(active, archived, normalizeLabelsRegistry(result && result["labels-registry"]));

            cachedActive = changed.active;
            cachedArchived = changed.archived;
            cachedRegistry = changed.registry;
            labels_registry = cachedRegistry;

            const payload = {"labels-registry": cachedRegistry, "last-update": getDate()};
            if (changed.updatedNotes > 0) {
                payload["websites"] = cachedActive;
                payload["websites-archive"] = cachedArchived;
            }
            sync_local.set(payload, function () {
                renderList();
                if (changed.updatedNotes > 0) {
                    loadDataFromBrowser("MANAGE-LABELS", true);
                    sendMessageUpdateToBackground();
                } else {
                    if (typeof renderFilterFolders === "function") renderFilterFolders();
                    if (typeof renderFilterTags === "function") renderFilterTags();
                }
            });
        });
    };

    const executeDelete = (labelName) => {
        confirmDeleteName = null;
        const kind = manageLabelsActiveTab;
        if (manageLabelsActiveTab === "tag") {
            filtersTagsText = filtersTagsText.filter((t) => t.toLowerCase() !== labelName.toLowerCase());
        } else {
            filtersFolder = filtersFolder.filter((f) => f !== labelName);
        }
        changeStores((active, archived, registry) => deleteLabelAcrossStores(active, archived, registry, kind, labelName));
    };

    const executeRename = (oldName, rawNewName) => {
        const trimmed = (rawNewName || "").trim();
        editingName = null;
        if (!trimmed || (manageLabelsActiveTab === "tag" ? trimmed.toLowerCase() === oldName.toLowerCase() : trimmed === oldName)) {
            renderList();
            return;
        }
        const kind = manageLabelsActiveTab;
        if (manageLabelsActiveTab === "tag") {
            filtersTagsText = filtersTagsText.map((t) => t.toLowerCase() === oldName.toLowerCase() ? trimmed.toLowerCase() : t);
            highlightedName = trimmed.toLowerCase();
        } else {
            filtersFolder = filtersFolder.map((f) => f === oldName ? trimmed : f);
            highlightedName = trimmed;
        }
        changeStores((active, archived, registry) => renameLabelAcrossStores(active, archived, registry, kind, oldName, trimmed));
    };

    const renderList = () => {
        listEl.innerHTML = "";
        const {tags, folders} = collectLabelsWithCounts(cachedActive, cachedArchived, cachedRegistry);

        setTabContent(
            tabTags,
            LABEL_UI_ICONS.tag,
            all_strings["labels-menu-tags-section"] || "Tags",
            tags.length,
            manageLabelsActiveTab === "tag"
        );
        setTabContent(
            tabFolders,
            LABEL_UI_ICONS.folder,
            all_strings["labels-menu-folders-section"] || "Folders",
            folders.length,
            manageLabelsActiveTab === "folder"
        );
        if (newInput) {
            newInput.placeholder = getNewLabelPlaceholder(manageLabelsActiveTab);
        }

        const items = manageLabelsActiveTab === "tag" ? tags : folders;

        if (items.length === 0) {
            const empty = document.createElement("div");
            empty.className = "manage-labels-empty";
            empty.textContent = manageLabelsActiveTab === "tag"
                ? (all_strings["no-tags-available"] || "No tags available")
                : (all_strings["no-folders-available"] || "No folders available");
            listEl.appendChild(empty);
            return;
        }

        const renameText = all_strings["manage-labels-rename-button"] || "Rename";
        const deleteText = all_strings["manage-labels-delete-button"] || "Delete";
        const saveText = all_strings["save-button"] || "Save";
        const cancelText = all_strings["cancel-button"] || "Cancel";
        const rowIconSvg = manageLabelsActiveTab === "tag" ? LABEL_UI_ICONS.tag : LABEL_UI_ICONS.folder;
        let rowToScroll = null;

        items.forEach((item) => {
            const row = document.createElement("div");
            row.className = "manage-labels-row";

            if (highlightedName !== null && item.name === highlightedName) {
                row.classList.add("manage-labels-row-highlight");
                rowToScroll = row;
            }

            if (editingName === item.name) {
                // Inline rename mode
                row.classList.add("manage-labels-row-editing");

                const renameInput = document.createElement("input");
                renameInput.type = "text";
                renameInput.className = "textbox manage-labels-rename-input";
                renameInput.value = item.name;
                renameInput.onkeydown = function (e) {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        executeRename(item.name, renameInput.value);
                    } else if (e.key === "Escape") {
                        e.preventDefault();
                        e.stopPropagation();
                        editingName = null;
                        renderList();
                    }
                };
                renameInput.onkeyup = function (e) {
                    if (e.key === "Escape") e.stopPropagation();
                };

                const actions = document.createElement("div");
                actions.className = "manage-labels-row-actions";

                const saveBtn = document.createElement("input");
                saveBtn.type = "button";
                saveBtn.className = "button very-small-button finish-edit-button";
                saveBtn.value = saveText;
                saveBtn.onclick = function () {
                    executeRename(item.name, renameInput.value);
                };

                const cancelBtn = document.createElement("input");
                cancelBtn.type = "button";
                cancelBtn.className = "button very-small-button button-close-notefox-account";
                cancelBtn.value = cancelText;
                cancelBtn.onclick = function () {
                    editingName = null;
                    renderList();
                };

                actions.appendChild(saveBtn);
                actions.appendChild(cancelBtn);
                row.appendChild(renameInput);
                row.appendChild(actions);
                listEl.appendChild(row);

                setTimeout(() => {
                    if (typeof renameInput.focus === "function") renameInput.focus();
                    if (typeof renameInput.select === "function") renameInput.select();
                }, 0);
                return;
            }

            if (confirmDeleteName === item.name) {
                // Inline delete confirmation mode
                row.classList.add("manage-labels-row-confirm-delete");

                const confirmMsg = document.createElement("div");
                confirmMsg.className = "manage-labels-confirm-text";
                confirmMsg.textContent = (all_strings["manage-labels-delete-confirmation"] || "Delete \"{{name}}\"? The label will be removed from all notes without deleting the notes themselves.").replaceAll("{{name}}", item.name);

                const actions = document.createElement("div");
                actions.className = "manage-labels-row-actions manage-labels-confirm-actions";

                const cancelBtn = document.createElement("input");
                cancelBtn.type = "button";
                cancelBtn.className = "button very-small-button button-close-notefox-account";
                cancelBtn.value = cancelText;
                cancelBtn.onclick = function () {
                    confirmDeleteName = null;
                    renderList();
                };

                const confirmBtn = document.createElement("input");
                confirmBtn.type = "button";
                confirmBtn.className = "button very-small-button manage-labels-confirm-delete-btn";
                confirmBtn.value = deleteText;
                confirmBtn.onclick = function () {
                    executeDelete(item.name);
                };

                actions.appendChild(cancelBtn);
                actions.appendChild(confirmBtn);
                row.appendChild(confirmMsg);
                row.appendChild(actions);
                listEl.appendChild(row);
                return;
            }

            // Default row display
            const info = document.createElement("div");
            info.className = "manage-labels-info";
            const iconSpan = document.createElement("span");
            iconSpan.className = "manage-labels-row-icon";
            iconSpan.innerHTML = rowIconSvg;
            const nameSpan = document.createElement("span");
            nameSpan.className = "manage-labels-name";
            nameSpan.textContent = item.name;
            const countSpan = document.createElement("span");
            countSpan.className = "manage-labels-count" + (item.count === 0 ? " manage-labels-count-zero" : "");
            countSpan.textContent = String(item.count);
            info.appendChild(iconSpan);
            info.appendChild(nameSpan);
            info.appendChild(countSpan);

            const actions = document.createElement("div");
            actions.className = "manage-labels-row-actions";

            const renameBtn = document.createElement("input");
            renameBtn.type = "button";
            renameBtn.className = "button very-small-button edit-button";
            renameBtn.value = renameText;
            renameBtn.onclick = function () {
                editingName = item.name;
                confirmDeleteName = null;
                renderList();
            };

            const deleteBtn = document.createElement("input");
            deleteBtn.type = "button";
            deleteBtn.className = "button very-small-button clear2-button";
            deleteBtn.value = deleteText;
            deleteBtn.onclick = function () {
                if (settings_json["disable-confirmation-popup"]) {
                    executeDelete(item.name);
                    return;
                }
                confirmDeleteName = item.name;
                editingName = null;
                renderList();
            };

            actions.appendChild(renameBtn);
            actions.appendChild(deleteBtn);
            row.appendChild(info);
            row.appendChild(actions);
            listEl.appendChild(row);
        });

        highlightedName = null;
        if (rowToScroll && typeof rowToScroll.scrollIntoView === "function") {
            rowToScroll.scrollIntoView({block: "nearest", behavior: "smooth"});
        }
    };

    const createNewLabel = () => {
        if (!newInput) return;
        const val = newInput.value.trim();
        if (!val) return;
        editingName = null;
        confirmDeleteName = null;
        const kind = manageLabelsActiveTab;
        highlightedName = kind === "tag" ? val.toLowerCase() : val;
        newInput.value = "";
        changeStores((active, archived, registry) => {
            addLabelToRegistry(registry, kind, val);
            return {active, archived, registry, updatedNotes: 0};
        });
    };

    if (tabTags) {
        tabTags.onclick = () => {
            manageLabelsActiveTab = "tag";
            editingName = null;
            confirmDeleteName = null;
            renderList();
        };
    }
    if (tabFolders) {
        tabFolders.onclick = () => {
            manageLabelsActiveTab = "folder";
            editingName = null;
            confirmDeleteName = null;
            renderList();
        };
    }
    if (createBtn) createBtn.onclick = createNewLabel;
    if (newInput) {
        newInput.onkeydown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                createNewLabel();
            }
        };
    }
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    section.onclick = (e) => {
        if (e.target === section) {
            closeModal();
        }
    };

    sync_local.get(["websites", "websites-archive", "labels-registry"], function (result) {
        cachedActive = (result && result["websites"]) ? result["websites"] : {};
        cachedArchived = (result && result["websites-archive"]) ? result["websites-archive"] : {};
        cachedRegistry = normalizeLabelsRegistry(result && result["labels-registry"]);
        migrateWebsites(cachedActive);
        migrateWebsites(cachedArchived);
        renderList();
        if (background) background.style.display = "block";
        section.style.display = "block";
    });
}

function hideAllDropdowns(event) {
    if (event && event.type === "scroll") {
        const activeDropdown = document.querySelector(".autocomplete-dropdown:not(.hidden)");
        if (activeDropdown && event.target && typeof event.target.contains === "function" && activeDropdown.contains(event.target)) {
            return;
        }
        const bulkMenu = document.getElementById("bulk-labels-menu");
        if (bulkMenu && !bulkMenu.classList.contains("hidden") && event.target && typeof event.target.contains === "function" && bulkMenu.contains(event.target)) {
            return;
        }
    }
    closeBulkLabelsMenu();
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

function checkDonationAlert(times) {
    if (times >= 1000) {
        browser.storage.local.get(["donation-popup-choice", "donation-popup-remind-date"], function (result) {
            let choice = result["donation-popup-choice"];
            let remindDate = result["donation-popup-remind-date"];
            let show = false;

            if (choice === undefined) {
                show = true;
            } else if (choice === "remind") {
                if (new Date().getTime() > remindDate) {
                    show = true;
                }
            }

            if (show) {
                let section = document.getElementById("donation-alert-section");
                let background = document.getElementById("background-opacity");

                section.style.display = "block";
                background.style.display = "block";

                let title = document.getElementById("donation-title");
                title.textContent = all_strings["donation-alert-title"];
                let description = document.getElementById("donation-text");
                description.innerHTML = all_strings["donation-alert-text-long"].replace("{{times}}", times);

                let buttonBuy = document.getElementById("donation-buy-button");
                buttonBuy.value = all_strings["donation-alert-button-1"];
                buttonBuy.onclick = function () {
                    section.style.display = "none";
                    background.style.display = "none";
                    browser.tabs.create({url: "https://liberapay.com/Sav22999/donate"});
                    browser.storage.local.set({"donation-popup-choice": "never"});
                }

                let buttonRemind = document.getElementById("donation-remind-button");
                buttonRemind.value = all_strings["donation-alert-button-2"];
                buttonRemind.onclick = function () {
                    section.style.display = "none";
                    background.style.display = "none";
                    let thirtyDays = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
                    browser.storage.local.set({
                        "donation-popup-choice": "remind",
                        "donation-popup-remind-date": thirtyDays
                    });
                }

                let buttonNever = document.getElementById("donation-never-button");
                buttonNever.value = all_strings["donation-alert-button-3"];
                buttonNever.onclick = function () {
                    section.style.display = "none";
                    background.style.display = "none";
                    browser.storage.local.set({"donation-popup-choice": "never"});
                }

                window.addEventListener("keydown", function (e) {
                    if (e.key === "Escape") {
                        section.style.display = "none";
                        background.style.display = "none";
                    }
                });
            }
        });
    }
}

function checkSyncLocal() {
    sync_local = browser.storage.local;
    checkTheme();
}

function loaded() {
    sync_local.get("times-opened").then(result => {
        if (result !== undefined && result["times-opened"] !== undefined) {
            checkDonationAlert(result["times-opened"]);
        }
    });
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
            if (!isLoadingData) {
                applyFilter();
            }
            initCustomSelects(document.getElementById("search-filter-sortby"));
        }

        let selectAllCheckbox = document.getElementById("select-all-notes-checkbox");
        if (selectAllCheckbox) {
            selectAllCheckbox.onchange = function () {
                if (this.checked && visibleNoteKeys.length > 0) {
                    for (let i = 0; i < visibleNoteKeys.length; i++) {
                        selectedNoteKeys.add(visibleNoteKeys[i]);
                    }
                } else {
                    selectedNoteKeys.clear();
                }
                syncVisibleCheckboxes();
                updateSelectionToolbar();
            };
        }

        let exportSelectedBtn = document.getElementById("export-selected-notes-button");
        if (exportSelectedBtn) {
            exportSelectedBtn.onclick = function () {
                exportSelectedNotes();
            };
        }

        let bulkLabelsBtn = document.getElementById("bulk-labels-button");
        if (bulkLabelsBtn) {
            bulkLabelsBtn.onclick = toggleBulkLabelsMenu;
        }

        let bulkArchiveBtn = document.getElementById("bulk-archive-button");
        if (bulkArchiveBtn) {
            bulkArchiveBtn.onclick = function () {
                archiveOrUnarchiveSelected(currentViewMode !== "archive");
            };
        }

        let viewActiveBtn = document.getElementById("view-active-notes-button");
        if (viewActiveBtn) {
            viewActiveBtn.onclick = function () {
                switchViewMode("active");
            };
        }

        let viewArchiveBtn = document.getElementById("view-archive-notes-button");
        if (viewArchiveBtn) {
            viewArchiveBtn.onclick = function () {
                switchViewMode("archive");
            };
        }

        let manageLabelsBtn = document.getElementById("manage-labels-open-button");
        if (manageLabelsBtn) {
            manageLabelsBtn.onclick = function () {
                closeBulkLabelsMenu();
                openManageLabelsModal();
            };
        }

        document.addEventListener("click", function (e) {
            let menu = document.getElementById("bulk-labels-menu");
            let btn = document.getElementById("bulk-labels-button");
            if (menu && !menu.classList.contains("hidden")) {
                if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
                    closeBulkLabelsMenu();
                }
            }
        });

        renderSearchChips();
        showLoadingNotes();

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
        let loadingNotesText = document.getElementById("loading-notes-text");
        if (loadingNotesText) {
            loadingNotesText.textContent = all_strings["loading-notes-text"] || "Loading…";
        }
        let selectAllLabel = document.getElementById("select-all-notes-label");
        if (selectAllLabel) {
            selectAllLabel.textContent = all_strings["select-all-notes-label"] || "Select all";
        }
        let exportSelectedBtn = document.getElementById("export-selected-notes-button");
        if (exportSelectedBtn) {
            exportSelectedBtn.value = all_strings["export-selected-notes-button"] || "Export selected…";
        }
        let bulkLabelsBtn = document.getElementById("bulk-labels-button");
        if (bulkLabelsBtn) {
            bulkLabelsBtn.value = all_strings["bulk-labels-button"] || "Labels";
        }
        let bulkArchiveBtn = document.getElementById("bulk-archive-button");
        if (bulkArchiveBtn) {
            bulkArchiveBtn.value = currentViewMode === "archive"
                ? (all_strings["unarchive-selected-button"] || "Move out of Archive")
                : (all_strings["archive-selected-button"] || "Archive");
        }
        let viewActiveBtn = document.getElementById("view-active-notes-button");
        if (viewActiveBtn) {
            viewActiveBtn.value = all_strings["all-notes-title"] || "All notes";
        }
        let viewArchiveBtn = document.getElementById("view-archive-notes-button");
        if (viewArchiveBtn) {
            viewArchiveBtn.value = all_strings["archive-tab-label"] || "Archive";
        }
        let manageLabelsBtn = document.getElementById("manage-labels-open-button");
        if (manageLabelsBtn) {
            manageLabelsBtn.value = all_strings["manage-labels-button"] || "Manage labels";
        }

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
                return getExistingTags();
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
    let exportSection = document.getElementById("export-section");
    if (exportSection && exportSection.style.display === "block") {
        exportSection.style.display = "none";
    }
    let manageLabelsSection = document.getElementById("manage-labels-section");
    if (manageLabelsSection && manageLabelsSection.style.display === "block") {
        if (typeof manageLabelsCancelInlineHandler === "function" && manageLabelsCancelInlineHandler()) {
            return;
        }
        manageLabelsCancelInlineHandler = null;
        manageLabelsSection.style.display = "none";
    }
    closeBulkLabelsMenu();

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
    let links = notes.getElementsByTagName('a');
    if (links.length > 0) {
        Array.from(links).forEach(link => {
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
    const loadToken = ++currentLoadToken;
    isLoadingData = true;
    currentRenderToken++;

    if (generate_section) {
        let sectionsEl = document.getElementById("all-website-sections");
        if (scrollToRestore === null && sectionsEl && sectionsEl.childNodes.length > 0) scrollToRestore = window.scrollY;
        if (sectionsEl) sectionsEl.textContent = "";
        showLoadingNotes();
    }

    try {
        const storageKey = getCurrentWebsitesStorageKey();
        const keysToFetch = storageKey === "websites"
            ? ["websites", "websites-archive", "settings", "labels-registry"]
            : ["websites-archive", "settings", "labels-registry"];
        sync_local.get(keysToFetch, function (value) {
            if (loadToken !== currentLoadToken) return;

            try {
                const previous_websites_json = websites_json;
                websites_json = {};
                if (value && value[storageKey] !== undefined) {
                    websites_json = value[storageKey];
                    migrateWebsites(websites_json);
                    websites_json_to_show = websites_json;
                } else {
                    websites_json_to_show = {};
                }
                updateArchiveTabLabel(value ? value["websites-archive"] : undefined);
                labels_registry = normalizeLabelsRegistry(value && value["labels-registry"]);
                //console.log(JSON.stringify(websites_json));

                settings_json = {};
                if (value && value["settings"] !== undefined) settings_json = value["settings"];
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
                if (settings_json["expand-all-websites"] === undefined) settings_json["expand-all-websites"] = true;

                isLoadingData = false;
                selectedNoteKeys = remapNoteKeys(selectedNoteKeys, previous_websites_json, websites_json, NOTE_SELECTION_SEP);

                // Aggiorna i filtri dopo il caricamento dei dati
                renderFilterFolders();
                renderFilterTags();
                if (typeof renderFilterColours === "function") renderFilterColours();
                if (typeof renderFilterTypes === "function") renderFilterTypes();
                renderSearchChips();
                initCustomSelects(document.getElementById("search-filter-sortby"));

                //console.log(JSON.stringify(settings_json));
                if (generate_section) {
                    websites_json_by_domain = {};
                    applyFilter();
                }
            } catch (e) {
                isLoadingData = false;
                hideLoadingNotes();
                console.error(`E-L3b: ${e}`);
                onError("all-notes.js::loadDataFromBrowser", e.message);
            }
        });
    } catch (e) {
        isLoadingData = false;
        hideLoadingNotes();
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
        const urls = [url].concat((websites_json_by_domain[url] || []).map((page) => url + page));
        refreshNotesThen(function (storageKey) {
            //delete the domain and all its pages
            recordDeletedNotes(urls.filter((item) => websites_json[item] !== undefined).map((item) => ({url: item, notes: websites_json[item]["all-notes"]})));
            urls.forEach((item) => delete websites_json[item]);
            saveAfterClear(storageKey, "E");
        });
    }
}

function clearAllNotesPage(url, isDomain = false, noteIndex = 0) {
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
        const shownWebsites = websites_json;
        refreshNotesThen(function (storageKey) {
            const keys = parseSelectionKeysByUrl(remapNoteKeys(new Set([makeNoteSelectionKey(url, noteIndex)]), shownWebsites, websites_json, NOTE_SELECTION_SEP), NOTE_SELECTION_SEP);
            if (!keys.has(url)) {
                //the note doesn't exist anymore
                loadDataFromBrowser("F-NOT-FOUND", true);
                return;
            }
            const indexToRemove = Array.from(keys.get(url))[0];
            let entry = websites_json[url];
            recordDeletedNotes([{url: url, notes: entry["all-notes"], indexes: [indexToRemove]}]);
            entry["all-notes"].splice(indexToRemove, 1);
            selectedNoteKeys = shiftNoteKeysAfterRemoval(selectedNoteKeys, url, indexToRemove, NOTE_SELECTION_SEP);
            if (entry["all-notes"].length === 0) delete websites_json[url];
            saveAfterClear(storageKey, "F");
        });
    }
}

function saveAfterClear(storageKey, calledBy) {
    websites_json_to_show = websites_json;
    sync_local.set({[storageKey]: websites_json}, function () {
        loadDataFromBrowser(calledBy, true);
        updateLastUpdate();
    });
}

function onCleared() {
    //all notes clear || successful
    loadDataFromBrowser("G", true);
    //loadAllWebsites(true, true);
}

function buildDomainSectionHeader(domain, hasNotes, shouldCollapse) {
    let section = document.createElement("div");
    section.classList.add("section", "section-domain");

    if (domain !== "**global") {
        let input_clear_all_notes_domain = document.createElement("input");
        input_clear_all_notes_domain.type = "button";
        input_clear_all_notes_domain.value = all_strings["clear-all-notes-of-this-domain-button"];
        input_clear_all_notes_domain.classList.add("button", "small-button", "clear-button", "clear-button-float-right");
        input_clear_all_notes_domain.onclick = function () {
            clearAllNotesDomain(domain);
            sendTelemetry(`clear-all-notes-domain`, "all-notes.js", domain);
        };

        let h2_container = document.createElement("div");
        h2_container.classList.add("h2-container");
        let h2 = document.createElement("h2");
        h2.textContent = domain;
        if (isUrlSupported(domain)) {
            h2.classList.add("link", "go-to-external", "domain");
            h2.onclick = function () {
                sendTelemetry(`go-to-domain`, "all-notes.js", domain);
                browser.tabs.create({url: domain});
            };
        }
        let toggleBtn = document.createElement("span");
        toggleBtn.className = "domain-toggle";
        toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        h2_container.prepend(toggleBtn);
        if (hasNotes) {
            let domainCheckbox = document.createElement("input");
            domainCheckbox.type = "checkbox";
            domainCheckbox.className = "note-select-checkbox domain-select-checkbox";
            domainCheckbox.dataset.domainKey = domain;
            let keysInDomain = domainNoteKeysMap.get(domain) || [];
            let selInDomain = 0;
            for (let i = 0; i < keysInDomain.length; i++) {
                if (selectedNoteKeys.has(keysInDomain[i])) selInDomain++;
            }
            domainCheckbox.checked = keysInDomain.length > 0 && selInDomain === keysInDomain.length;
            domainCheckbox.indeterminate = selInDomain > 0 && selInDomain < keysInDomain.length;
            domainCheckbox.onclick = function (e) {
                e.stopPropagation();
            };
            domainCheckbox.onchange = function (e) {
                e.stopPropagation();
                let domainKeys = domainNoteKeysMap.get(domain) || [];
                if (this.checked) {
                    for (let i = 0; i < domainKeys.length; i++) {
                        selectedNoteKeys.add(domainKeys[i]);
                    }
                } else {
                    for (let i = 0; i < domainKeys.length; i++) {
                        selectedNoteKeys.delete(domainKeys[i]);
                    }
                }
                syncVisibleCheckboxes();
                updateSelectionToolbar();
            };
            h2_container.append(domainCheckbox);
        }
        h2_container.append(h2);

        section.append(input_clear_all_notes_domain);
        section.append(h2_container);

        if (hasNotes) {
            if (shouldCollapse) toggleBtn.classList.add("collapsed");
            h2_container.style.cursor = "pointer";
            h2_container.addEventListener("click", function (e) {
                if (e.target.closest(".go-to-external") || e.target.closest(".note-select-checkbox")) return;
                let pages = this.parentElement.querySelector(".domain-pages");
                let toggle = this.querySelector(".domain-toggle");
                if (pages && toggle) {
                    if (pages.classList.contains("collapsed")) {
                        pages.classList.remove("collapsed");
                        toggle.classList.remove("collapsed");
                    } else {
                        pages.classList.add("collapsed");
                        toggle.classList.add("collapsed");
                    }
                }
            });
        }
    }

    let all_pages = document.createElement("div");
    all_pages.className = "domain-pages";
    if (hasNotes && shouldCollapse) {
        all_pages.classList.add("collapsed");
    }

    return {section, all_pages};
}

function loadAllWebsites(clear = false, sort_by = "name-az", apply_filter = true, highlightTerms = []) {
    try {
        const renderToken = ++currentRenderToken;
        const allWebsiteSections = document.getElementById("all-website-sections");
        if (clear && allWebsiteSections) {
            allWebsiteSections.textContent = "";
        }

        if (isLoadingData) {
            showLoadingNotes();
            return;
        }

        let domainEntries = [];
        let totalNotes = 0;
        visibleNoteKeys = [];
        domainNoteKeysMap = new Map();

        if (!isEmpty(websites_json_to_show)) {
            //there are websites saved
            websites_json_by_domain = {};
            let domainPageSets = {};

            for (let domain in websites_json_to_show) {
                if (websites_json_to_show[domain]["type"] === undefined) {
                    websites_json_to_show[domain]["type"] = 1;
                    websites_json_to_show[domain]["domain"] = "";
                    websites_json_to_show[domain]["tag-colour"] = "none";
                }

                if (websites_json_to_show[domain]["type"] === 0 || (websites_json_to_show[domain]["type"] === 1 && websites_json_to_show[domain]["domain"] === "")) {
                    //global (0) or domain (1)
                    if (domainPageSets[domain] === undefined) {
                        domainPageSets[domain] = new Set();
                    }
                } else {
                    //page
                    let root_domain = websites_json_to_show[domain]["domain"];
                    let domain_to_add = domain.replace(root_domain, "");
                    if (domainPageSets[root_domain] === undefined) {
                        domainPageSets[root_domain] = new Set();
                    }
                    domainPageSets[root_domain].add(domain_to_add);
                }

                if (websites_json_to_show[domain]["tag-colour"] === undefined) {
                    websites_json_to_show[domain]["tag-colour"] = "none";
                }
            }

            for (let d in domainPageSets) {
                websites_json_by_domain[d] = Array.from(domainPageSets[d]);
            }

            websites_json_by_domain = sortOnKeys(websites_json_by_domain, websites_json_to_show, sort_by);
            const globalUrl = getGlobalUrl();

            for (let domain in websites_json_by_domain) {
                if (domain !== undefined && domain !== "undefined" && domain !== "") {
                    websites_json_by_domain[domain].sort();
                    let notesForDomain = [];
                    let keysForDomain = [];

                    if (websites_json_to_show[domain] !== undefined) {
                        let type_to_show = all_strings["domain-label"];
                        let type_to_use = "domain";
                        if (domain === globalUrl) {
                            type_to_show = all_strings["global-label"];
                            type_to_use = "global";
                        }

                        let allNotes = Array.isArray(websites_json_to_show[domain]["all-notes"]) ? websites_json_to_show[domain]["all-notes"] : [];
                        for (let noteIdx = 0; noteIdx < allNotes.length; noteIdx++) {
                            let selKey = makeNoteSelectionKey(domain, noteIdx);
                            visibleNoteKeys.push(selKey);
                            keysForDomain.push(selKey);
                            notesForDomain.push({
                                url: domain,
                                fullUrl: domain,
                                noteObj: allNotes[noteIdx],
                                noteIdx: noteIdx,
                                type_to_show: type_to_show,
                                type_to_use: type_to_use,
                                domain_again: true
                            });
                        }
                    }

                    if (domain !== globalUrl) {
                        let pagesList = websites_json_by_domain[domain];
                        for (let index = 0; index < pagesList.length; index++) {
                            let urlPage = pagesList[index];
                            let urlPageDomain = domain + urlPage;
                            if (websites_json_to_show[urlPageDomain] !== undefined) {
                                let allNotes = Array.isArray(websites_json_to_show[urlPageDomain]["all-notes"]) ? websites_json_to_show[urlPageDomain]["all-notes"] : [];
                                for (let noteIdx = 0; noteIdx < allNotes.length; noteIdx++) {
                                    let selKey = makeNoteSelectionKey(urlPageDomain, noteIdx);
                                    visibleNoteKeys.push(selKey);
                                    keysForDomain.push(selKey);
                                    notesForDomain.push({
                                        url: urlPage,
                                        fullUrl: urlPageDomain,
                                        noteObj: allNotes[noteIdx],
                                        noteIdx: noteIdx,
                                        type_to_show: all_strings["page-label"],
                                        type_to_use: "page",
                                        domain_again: false
                                    });
                                }
                            }
                        }
                    }

                    domainNoteKeysMap.set(domain, keysForDomain);
                    totalNotes += notesForDomain.length;
                    domainEntries.push({domain: domain, notes: notesForDomain});
                }
            }
        }

        //the notes hidden by the filters are unselected, otherwise an action would reach them unseen
        const shownKeys = new Set(visibleNoteKeys);
        selectedNoteKeys.forEach((key) => {
            if (!shownKeys.has(key)) selectedNoteKeys.delete(key);
        });
        updateSelectionToolbar();

        if (domainEntries.length === 0) {
            scrollToRestore = null;
            hideLoadingNotes();
            let section = document.createElement("div");
            section.classList.add("section-empty");
            section.textContent = all_strings["no-notes-found-text"];

            allWebsiteSections.append(section);
            return;
        }

        const hasHighlight = Array.isArray(highlightTerms) && highlightTerms.length > 0;
        const shouldCollapse = !hasHighlight && !(settings_json["expand-all-websites"] === true || settings_json["expand-all-websites"] === "yes");
        const CHUNK_TIME_BUDGET_MS = 16;
        const MAX_NOTES_PER_CHUNK = 50;

        let domainIdx = 0;
        let noteCursor = 0;
        let renderedNotes = 0;
        let currentDomainState = null;

        function scheduleNextChunk() {
            if (document.hidden) {
                setTimeout(renderNextChunk, 0);
            } else {
                requestAnimationFrame(renderNextChunk);
            }
        }

        function renderNextChunk() {
            if (renderToken !== currentRenderToken) return;

            try {
                const startTime = performance.now();
                let chunkNotes = 0;
                let sectionsFragment = document.createDocumentFragment();

                while (domainIdx < domainEntries.length) {
                    let entry = domainEntries[domainIdx];

                    if (currentDomainState === null) {
                        let {section, all_pages} = buildDomainSectionHeader(entry.domain, entry.notes.length > 0, shouldCollapse);
                        let hr = document.createElement("hr");
                        hr.classList.add("hr-big-space", "hr-domain");
                        currentDomainState = {
                            section: section,
                            all_pages: all_pages,
                            hr: hr,
                            hasNotes: entry.notes.length > 0,
                            mounted: false,
                            pagesFragment: document.createDocumentFragment()
                        };
                        noteCursor = 0;
                    }

                    let budgetExceeded = false;
                    while (noteCursor < entry.notes.length) {
                        let item = entry.notes[noteCursor];
                        let noteObj = item.noteObj;
                        let page = document.createElement("div");
                        page.classList.add("sub-section");
                        page = generateNotes(
                            page,
                            item.url,
                            noteObj["notes"],
                            noteObj["title"],
                            noteObj["content"] || "",
                            noteObj["last-update"],
                            item.type_to_show,
                            item.fullUrl,
                            item.type_to_use,
                            item.domain_again,
                            item.noteIdx
                        );
                        if (page !== -1 && page !== undefined) {
                            if (hasHighlight) {
                                highlightInNotePage(page, highlightTerms);
                            }
                            currentDomainState.pagesFragment.appendChild(page);
                        }
                        noteCursor++;
                        renderedNotes++;
                        chunkNotes++;

                        if (chunkNotes >= MAX_NOTES_PER_CHUNK || (chunkNotes % 5 === 0 && (performance.now() - startTime) >= CHUNK_TIME_BUDGET_MS)) {
                            budgetExceeded = true;
                            break;
                        }
                    }

                    if (noteCursor >= entry.notes.length) {
                        if (currentDomainState.pagesFragment.childNodes.length > 0) {
                            currentDomainState.all_pages.appendChild(currentDomainState.pagesFragment);
                        }
                        if (!currentDomainState.mounted) {
                            if (currentDomainState.hasNotes) {
                                currentDomainState.section.append(currentDomainState.all_pages);
                            }
                            sectionsFragment.appendChild(currentDomainState.section);
                            sectionsFragment.appendChild(currentDomainState.hr);
                        }
                        currentDomainState = null;
                        domainIdx++;
                    }

                    if (budgetExceeded || (performance.now() - startTime) >= CHUNK_TIME_BUDGET_MS) {
                        break;
                    }
                }

                if (currentDomainState !== null) {
                    if (currentDomainState.pagesFragment.childNodes.length > 0) {
                        currentDomainState.all_pages.appendChild(currentDomainState.pagesFragment);
                        currentDomainState.pagesFragment = document.createDocumentFragment();
                    }
                    if (!currentDomainState.mounted) {
                        if (currentDomainState.hasNotes) {
                            currentDomainState.section.append(currentDomainState.all_pages);
                        }
                        sectionsFragment.appendChild(currentDomainState.section);
                        sectionsFragment.appendChild(currentDomainState.hr);
                        currentDomainState.mounted = true;
                    }
                }

                if (sectionsFragment.childNodes.length > 0) {
                    allWebsiteSections.appendChild(sectionsFragment);
                }

                restoreScroll(domainIdx >= domainEntries.length);

                if (domainIdx < domainEntries.length) {
                    showLoadingNotes(renderedNotes, totalNotes, true);
                    scheduleNextChunk();
                } else {
                    hideLoadingNotes();
                    if (apply_filter) {
                        applyFilter();
                    }
                }
            } catch (e) {
                hideLoadingNotes();
                console.error(`E-L4b: ${e}`);
                onError("all-notes.js::loadAllWebsites::chunk", e.message);
            }
        }

        renderNextChunk();
    } catch (e) {
        hideLoadingNotes();
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
    if (searchDebounceTimer !== null) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = null;
    }
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
        if (searchDebounceTimer !== null) {
            clearTimeout(searchDebounceTimer);
        }
        searchDebounceTimer = setTimeout(() => {
            searchDebounceTimer = null;
            applyFilter();
        }, 150);
    };

    container.appendChild(input);

    container.onclick = function () {
        input.focus();
    };
}

function search(value = "") {
    try {
        if (isLoadingData) {
            showLoadingNotes();
            return;
        }

        //console.log(JSON.stringify(websites_json_to_show))
        websites_json_to_show = {};

        let valueToUse = [...filtersSearchTerms];
        if (value && value.trim() !== "") {
            valueToUse.push(value.trim().toLowerCase());
        }

        let results = document.getElementById("results-searching");
        let keywordsHTML = "";
        let validTerms = [];
        valueToUse.forEach(key => {
            if (key.replaceAll(" ", "") !== "") {
                keywordsHTML += `<span class='button-code result-button'>${key}</span>`;
                validTerms.push(key);
            }
        });
        let valid_results = validTerms.length;
        results.innerHTML = all_strings["label-results-for"].replaceAll("{{keywords}}", keywordsHTML);
        if (valid_results > 0) {
            if (results.classList.contains("hidden")) results.classList.remove("hidden");
        } else results.classList.add("hidden");
        for (const website in websites_json) {
            let current_website_json = websites_json[website];
            let notesArr = Array.isArray(current_website_json["all-notes"]) ? current_website_json["all-notes"] : [];
            let condition_type = filtersTypes.indexOf(getType(websites_json[website], website)) !== -1 || filtersTypes.length === 0;

            // the entry is shown if ANY of its notes satisfies all active per-note conditions
            let entryMatches = condition_type && notesArr.some(note => {
                let noteColour = (note["tag-colour"] || "none").toLowerCase();
                let cColor = filtersColors.length === 0 || filtersColors.indexOf(noteColour) !== -1;

                let cFolder = true;
                if (filtersFolder.length > 0) {
                    cFolder = filtersFolder.includes(note["tag-folder"] || "");
                }

                let cTags = true;
                if (filtersTagsText.length > 0) {
                    cTags = Array.isArray(note["tags-text"]) && filtersTagsText.every(ft => note["tags-text"].some(t => t.toLowerCase() === ft.toLowerCase()));
                }

                let termOk = true;
                if (valid_results > 0) {
                    let title_to_use = (note["title"] || "").toLowerCase();
                    termOk = validTerms.some(key => {
                        key = key.toLowerCase();
                        let contentMatch = settings_json["search-page-content"] && note["content"] && note["content"].toLowerCase().includes(key);
                        let folderMatch = note["tag-folder"] && note["tag-folder"].toLowerCase().includes(key);
                        let tagsMatch = Array.isArray(note["tags-text"]) && note["tags-text"].some(t => t.toLowerCase().includes(key));
                        let notesMatch = (note["notes"] || "").toLowerCase().includes(key);
                        let domainMatch = (current_website_json["domain"] || "").toLowerCase().includes(key);
                        let lastUpdateMatch = (note["last-update"] || "").toLowerCase().includes(key);
                        return notesMatch || contentMatch || domainMatch || lastUpdateMatch || title_to_use.includes(key) || website.includes(key) || folderMatch || tagsMatch;
                    });
                }

                return cColor && cFolder && cTags && termOk;
            });

            if (entryMatches) {
                websites_json_to_show[website] = websites_json[website];
            }
        }
        loadAllWebsites(true, sort_by_selected, false, valid_results > 0 ? validTerms : []);
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
function onInputText(url, data, pageLastUpdate, noteIndex = 0) {
    if (currentViewMode === "archive") {
        let note = ensureNoteAt(url, noteIndex);
        if (data["notes"] !== undefined) note["notes"] = data["notes"];
        if (data["title"] !== undefined) note["title"] = data["title"];
        if (data["lastUpdate"] !== undefined) note["last-update"] = data["lastUpdate"];
        sync_local.set({"websites-archive": websites_json, "last-update": data["lastUpdate"] || getDate()});
        pageLastUpdate.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(data["lastUpdate"]));
        return;
    }
    //keep the note in memory aligned with the one saved by the background
    let editedNote = (websites_json[url] !== undefined && Array.isArray(websites_json[url]["all-notes"])) ? websites_json[url]["all-notes"][noteIndex] : undefined;
    if (editedNote) {
        if (data["notes"] !== undefined) editedNote["notes"] = data["notes"];
        if (data["title"] !== undefined) editedNote["title"] = data["title"];
        if (data["lastUpdate"] !== undefined) editedNote["last-update"] = data["lastUpdate"];
    }
    browser.runtime.sendMessage({from: "all-notes", type: "inline-edit", url: url, data: data, noteIndex: noteIndex});
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

        const storageKey = getCurrentWebsitesStorageKey();
        sync_local.get(storageKey, function (value) {
            websites_json = value[storageKey] || {};
            migrateWebsites(websites_json);
            if (websites_json[oldUrl] === undefined) {
                resolve(false);
                return;
            }

            if (websites_json[newUrl] !== undefined) {
                alert("A note with this link already exists.");
                resolve(false);
                return;
            }

            if ((typeToUse || "").toLowerCase() === "page") {
                try {
                    new URL(stripWildcardSuffix(newUrl));
                } catch (e) {
                    resolve(false);
                    return;
                }
            }

            ensureNoteIds({[oldUrl]: websites_json[oldUrl]});
            recordDeletedNotes([{url: oldUrl, notes: websites_json[oldUrl]["all-notes"]}]);
            websites_json[newUrl] = websites_json[oldUrl];
            websites_json[newUrl]["all-notes"].forEach(markNoteAsMoved);
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

            websites_json_to_show = websites_json;

            sync_local.set({[storageKey]: websites_json, "last-update": getDate()}, function () {
                resolve(true);
            });
        });
    });
}

function sendMessageUpdateToBackground() {
    browser.runtime.sendMessage({"updated": true});
}

function generateNotes(page, url, notes, title, content, lastUpdate, type, fullUrl, type_to_use, domain_again, noteIndex = 0) {
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
            clearAllNotesPage(fullUrl, isDomain, noteIndex);
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

        let noteSelectionKey = makeNoteSelectionKey(fullUrl, noteIndex);
        let noteDomainKey = (type_to_use === "global")
            ? getGlobalUrl()
            : ((websites_json[fullUrl] && websites_json[fullUrl]["domain"]) ? websites_json[fullUrl]["domain"] : fullUrl);
        let noteCheckbox = document.createElement("input");
        noteCheckbox.type = "checkbox";
        noteCheckbox.className = "note-select-checkbox note-item-checkbox";
        noteCheckbox.dataset.noteKey = noteSelectionKey;
        noteCheckbox.dataset.domainKey = noteDomainKey;
        if (selectedNoteKeys.has(noteSelectionKey)) {
            noteCheckbox.checked = true;
            page.classList.add("note-selected");
        }
        noteCheckbox.onchange = function () {
            if (this.checked) {
                selectedNoteKeys.add(noteSelectionKey);
                page.classList.add("note-selected");
            } else {
                selectedNoteKeys.delete(noteSelectionKey);
                page.classList.remove("note-selected");
            }
            syncDomainCheckbox(noteDomainKey);
            updateSelectionToolbar();
        };

        subrowUrl.append(noteCheckbox);
        subrowUrl.append(pageType);

        // Tag Color select — built here so it can be the leftmost element in subrowButtons
        let tagsColour = document.createElement("select");
        tagsColour.classList.add("select-tag-all-notes", "button", "very-small-button", "tag-button", "no-text");
        tagsColour.dataset.colorValues = "true";
        let noteForColour = (websites_json[fullUrl] !== undefined && Array.isArray(websites_json[fullUrl]["all-notes"])) ? websites_json[fullUrl]["all-notes"][noteIndex] : undefined;
        let selectedColour = (noteForColour !== undefined && noteForColour["tag-colour"] !== undefined) ? noteForColour["tag-colour"] : null;
        if (selectedColour !== null && colourListWithNone[selectedColour] !== undefined) {
            pageContentLeft.classList.add("tag-colour-" + selectedColour + "-bg");
        }
        tagsColour._populateOptions = function () {
            if (tagsColour.options.length > 0) return;
            let optFrag = document.createDocumentFragment();
            for (let colour in colourListWithNone) {
                let tagColour = document.createElement("option");
                tagColour.value = colour;
                if (selectedColour !== null && selectedColour === colour) {
                    tagColour.selected = true;
                }
                tagColour.textContent = colourListWithNone[colour];
                optFrag.appendChild(tagColour);
            }
            tagsColour.appendChild(optFrag);
        };
        tagsColour.onchange = function () {
            changeTagColour(fullUrl, tagsColour.value, type_to_use, noteIndex);
            sendTelemetry(`change-tag-colour::${tagsColour.value}`, "all-notes.js", fullUrl);
        }

        // Tag color goes first (leftmost), then show-content, edit, copy, clear
        subrowButtons.append(tagsColour);
        createCustomSelect(tagsColour);

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
        //Button "Archive / Move out of Archive"
        let inputArchiveNote = document.createElement("input");
        inputArchiveNote.type = "button";
        const isArchiveView = currentViewMode === "archive";
        const archiveBtnLabel = isArchiveView
            ? (all_strings["unarchive-selected-button"] || "Move out of Archive")
            : (all_strings["archive-selected-button"] || "Archive");
        inputArchiveNote.value = archiveBtnLabel;
        inputArchiveNote.title = archiveBtnLabel;
        inputArchiveNote.classList.add("button", "very-small-button", isArchiveView ? "unarchive-button" : "archive-button", "button-no-text-on-mobile");
        inputArchiveNote.onclick = function () {
            archiveOrUnarchiveSingleNote(fullUrl, noteIndex, !isArchiveView);
        };

        subrowButtons.append(inputInlineEdit);
        subrowButtons.append(inputCopyNotes);
        subrowButtons.append(inputArchiveNote);
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
            onInputText(fullUrl, data, pageLastUpdate, noteIndex);
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
            onInputText(fullUrl, data, pageLastUpdate, noteIndex);
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

        contentNotes.append(textNotes);
        contentNotesContainer.appendChild(contentNotes);
        if (settings_json["show-fullscreen-button-in-all-notes"]) {
            let openFullscreenNotesButton = document.createElement("button");
            openFullscreenNotesButton.classList.add("button-format", "button");
            openFullscreenNotesButton.id = "open-fullscreen-notes-button";
            openFullscreenNotesButton.onclick = function () {
                showFullscreenNotes(textNotes);
                sendTelemetry(`open-fullscreen-notes`, "all-notes.js", fullUrl);
            }
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
        renderFolderView(folderViewContainer, fullUrl, false, noteIndex);
        tagsBottomContainer.append(folderViewContainer);

        // 2. Tags Text
        let tagsTextContainerAll = document.createElement("div");
        tagsTextContainerAll.className = "tags-text-container-all";
        renderTagsAllNotes(tagsTextContainerAll, fullUrl, false, noteIndex);
        tagsBottomContainer.append(tagsTextContainerAll);

        pageContentRight.append(tagsBottomContainer);

        page.append(pageContentLeft);
        page.append(pageContentRight);

        return page;
    } catch (e) {
        console.error(`E-G1: ${e}`);
        onError("all-notes.js::generateNotes", e.message);

        return undefined;
    }
}

function renderTagsAllNotes(container, fullUrl, shouldFocus = false, noteIndex = 0) {
    if (!container) return;

    let noteObj = (websites_json[fullUrl] !== undefined && Array.isArray(websites_json[fullUrl]["all-notes"])) ? websites_json[fullUrl]["all-notes"][noteIndex] : undefined;

    // Aggiorna il timestamp nella UI risalendo al genitore
    let pageContentRight = container.closest(".page-content-right");
    if (pageContentRight) {
        let lastUpdateElem = pageContentRight.querySelector(".sub-section-last-update");
        if (lastUpdateElem && noteObj && noteObj["last-update"]) {
            lastUpdateElem.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(noteObj["last-update"]));
        }
    }

    container.innerHTML = "";
    container.className = "custom-tag-input-container tags-text-container-all";

    let tags = [];
    if (noteObj !== undefined && noteObj["tags-text"] !== undefined) {
        tags = noteObj["tags-text"];
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
                removeTagAllNotes(fullUrl, index, container, noteIndex);
            };
            chip.appendChild(remove);
            container.appendChild(chip);
        });
    }

    let input = document.createElement("input");
    input.type = "text";
    input.className = "tag-inner-input";
    input.placeholder = all_strings["add-tag-placeholder"] || "...";

    function getAvailableTags() {
        let all = getExistingTags();
        let current = tags.map(t => t.toLowerCase());
        return all.filter(t => !current.includes(t));
    }

    function updateTagDropdown(text) {
        let tagDropdown = getSharedNoteAutocompleteDropdown("tags");
        tagDropdown._ownerInput = input;
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
                    addTagAllNotes(input, fullUrl, container, noteIndex);
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
        // committing on blur (not only on Enter) so a typed-but-unconfirmed tag is not lost
        if (this.value.trim() !== "") {
            addTagAllNotes(this, fullUrl, container, noteIndex);
        }
        let dd = sharedNoteDropdowns["tags"];
        if (dd) {
            setTimeout(() => {
                if (dd._ownerInput === input) dd.classList.add("hidden");
            }, 150);
        }
    };
    input.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            addTagAllNotes(this, fullUrl, container, noteIndex);
            let dd = sharedNoteDropdowns["tags"];
            if (dd) dd.classList.add("hidden");
        } else if (e.key === "Backspace" && this.value === "" && tags.length > 0) {
            removeTagAllNotes(fullUrl, tags.length - 1, container, noteIndex);
        } else if (e.key === "Escape") {
            let dd = sharedNoteDropdowns["tags"];
            if (dd) dd.classList.add("hidden");
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

function renderFolderView(container, fullUrl, shouldFocus = false, noteIndex = 0) {
    if (!container) return;

    let noteObj = (websites_json[fullUrl] && Array.isArray(websites_json[fullUrl]["all-notes"])) ? websites_json[fullUrl]["all-notes"][noteIndex] : undefined;

    // Aggiorna il timestamp nella UI risalendo al genitore
    let pageContentRight = container.closest(".page-content-right");
    if (pageContentRight) {
        let lastUpdateElem = pageContentRight.querySelector(".sub-section-last-update");
        if (lastUpdateElem && noteObj && noteObj["last-update"]) {
            lastUpdateElem.textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", datetimeToDisplay(noteObj["last-update"]));
        }
    }

    container.innerHTML = "";
    container.className = "custom-tag-input-container folder-view-container";
    container.style.flexWrap = "nowrap";
    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";

    let currentFolder = (noteObj && noteObj["tag-folder"]) ? noteObj["tag-folder"] : "";

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
            changeFolderAllNotes(fullUrl, "", container, noteIndex);
        };
        chip.appendChild(remove);
        container.appendChild(chip);
    } else {
        let input = document.createElement("input");
        input.type = "text";
        input.className = "tag-inner-input";
        input.placeholder = all_strings["new-folder-placeholder"] || "Folder...";

        function updateFolderDropdown(text) {
            let dropdown = getSharedNoteAutocompleteDropdown("folder");
            dropdown._ownerInput = input;
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
                        changeFolderAllNotes(fullUrl, match, container, noteIndex);
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
            // committing on blur (not only on Enter) so a typed-but-unconfirmed folder is not lost
            let val = this.value.trim();
            if (val !== "") {
                changeFolderAllNotes(fullUrl, val, container, noteIndex);
            }
            let dd = sharedNoteDropdowns["folder"];
            if (dd) {
                setTimeout(() => {
                    if (dd._ownerInput === input) dd.classList.add("hidden");
                }, 150);
            }
        };
        input.onkeydown = function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                let val = this.value.trim();
                if (val) {
                    changeFolderAllNotes(fullUrl, val, container, noteIndex);
                    let dd = sharedNoteDropdowns["folder"];
                    if (dd) dd.classList.add("hidden");
                }
            } else if (e.key === "Escape") {
                let dd = sharedNoteDropdowns["folder"];
                if (dd) dd.classList.add("hidden");
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


function ensureNoteAt(entryUrl, noteIndex) {
    if (websites_json[entryUrl] === undefined) websites_json[entryUrl] = {"all-notes": []};
    migrateEntryToAllNotes(websites_json[entryUrl]);
    if (!Array.isArray(websites_json[entryUrl]["all-notes"])) websites_json[entryUrl]["all-notes"] = [];
    if (!websites_json[entryUrl]["all-notes"][noteIndex]) {
        websites_json[entryUrl]["all-notes"][noteIndex] = {"notes": "", "title": "", "tags-text": [], "tag-folder": ""};
    }
    return websites_json[entryUrl]["all-notes"][noteIndex];
}

function addTagAllNotes(input, fullUrl, container, noteIndex = 0) {
    let tag = input.value.trim().toLowerCase();
    if (tag !== "") {
        const storageKey = getCurrentWebsitesStorageKey();
        sync_local.get([storageKey, "labels-registry"], function (value) {
            websites_json = value[storageKey] || {};
            labels_registry = normalizeLabelsRegistry(value["labels-registry"]);
            let note = ensureNoteAt(fullUrl, noteIndex);
            if (note["tags-text"] === undefined) note["tags-text"] = [];
            if (!note["tags-text"].includes(tag)) {
                note["tags-text"].push(tag);
                note["last-update"] = getDate();
                addLabelToRegistry(labels_registry, "tag", tag);
                input.value = "";
                sync_local.set({[storageKey]: websites_json, "labels-registry": labels_registry, "last-update": getDate()}, function () {
                    renderTagsAllNotes(container, fullUrl, true, noteIndex);
                    if (storageKey === "websites") sendMessageUpdateToBackground();
                });
            }
        });
    }
}

function removeTagAllNotes(fullUrl, index, container, noteIndex = 0) {
    const storageKey = getCurrentWebsitesStorageKey();
    sync_local.get(storageKey, function (value) {
        websites_json = value[storageKey] || {};
        migrateWebsites(websites_json);
        let note = (websites_json[fullUrl] !== undefined && Array.isArray(websites_json[fullUrl]["all-notes"])) ? websites_json[fullUrl]["all-notes"][noteIndex] : undefined;
        if (note !== undefined && note["tags-text"] !== undefined) {
            note["tags-text"].splice(index, 1);
            note["last-update"] = getDate();
            sync_local.set({[storageKey]: websites_json, "last-update": getDate()}, function () {
                renderTagsAllNotes(container, fullUrl, true, noteIndex);
                if (storageKey === "websites") sendMessageUpdateToBackground();
            });
        }
    });
}

function changeFolderAllNotes(fullUrl, folder, container, noteIndex = 0) {
    const storageKey = getCurrentWebsitesStorageKey();
    sync_local.get([storageKey, "labels-registry"], function (value) {
        websites_json = value[storageKey] || {};
        labels_registry = normalizeLabelsRegistry(value["labels-registry"]);
        let note = ensureNoteAt(fullUrl, noteIndex);
        note["tag-folder"] = folder;
        note["last-update"] = getDate();
        addLabelToRegistry(labels_registry, "folder", folder);
        sync_local.set({[storageKey]: websites_json, "labels-registry": labels_registry, "last-update": getDate()}, function () {
            // Se avevamo passato un container per renderFolderView, ri-renderizziamo con focus
            if (typeof container !== 'undefined') {
                renderFolderView(container, fullUrl, true, noteIndex);
            }
            loadDataFromBrowser("FOLDER-ALL", true);
            if (storageKey === "websites") sendMessageUpdateToBackground();
        });
    });
}

function changeTagColour(url, colour, type_to_use, noteIndex = 0) {
    const storageKey = getCurrentWebsitesStorageKey();
    sync_local.get(storageKey, function (value) {
        let storeWs = value[storageKey] || {};
        migrateWebsites(storeWs);
        if (storeWs[url] === undefined) {
            storeWs[url] = {"all-notes": []};
        }
        if (!Array.isArray(storeWs[url]["all-notes"])) storeWs[url]["all-notes"] = [];
        if (!storeWs[url]["all-notes"][noteIndex]) {
            storeWs[url]["all-notes"][noteIndex] = {"notes": "", "title": "", "tags-text": [], "tag-folder": ""};
        }
        storeWs[url]["all-notes"][noteIndex]["tag-colour"] = colour;
        storeWs[url]["all-notes"][noteIndex]["last-update"] = getDate();
        sync_local.set({[storageKey]: storeWs, "last-update": getDate()}, function () {
            loadDataFromBrowser("H", true);
            if (storageKey === "websites") sendMessageUpdateToBackground();
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
        } else if (sort_by === "date-09" || sort_by === "date-90") {
            // date-09: min date ascending; date-90: max date descending
            const isAsc = sort_by === "date-09";
            let domainTimes = [];
            for (let domain in dict) {
                let bestTime = null;
                if (dict2[domain] !== undefined) {
                    let lu = entryLastUpdateStr(dict2[domain]);
                    if (lu !== null) {
                        let t = new Date(lu).getTime();
                        if (!isNaN(t)) bestTime = t;
                    }
                }
                let pages = dict[domain];
                if (Array.isArray(pages)) {
                    for (let i = 0; i < pages.length; i++) {
                        let pageKey = domain + pages[i];
                        if (dict2[pageKey] !== undefined) {
                            let lu = entryLastUpdateStr(dict2[pageKey]);
                            if (lu !== null) {
                                let t = new Date(lu).getTime();
                                if (!isNaN(t)) {
                                    if (bestTime === null || (isAsc ? t < bestTime : t > bestTime)) {
                                        bestTime = t;
                                    }
                                }
                            }
                        }
                    }
                }
                domainTimes.push([domain, bestTime === null ? 0 : bestTime]);
            }

            domainTimes.sort((a, b) => isAsc ? (a[1] - b[1]) : (b[1] - a[1]));

            for (let i = 0; i < domainTimes.length; i++) {
                let domainKey = domainTimes[i][0];
                tempDict[domainKey] = dict[domainKey];
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
        let export_svg = window.btoa(getIconSvgEncoded("export", on_primary));
        let delete_svg = window.btoa(getIconSvgEncoded("delete", on_primary));
        let delete2_svg = window.btoa(getIconSvgEncoded("delete2", on_primary));
        let copy_svg = window.btoa(getIconSvgEncoded("copy", on_primary));
        let show_content_svg = window.btoa(getIconSvgEncoded("show-content", on_primary));
        let archive_svg = window.btoa(getIconSvgEncoded("archive", on_primary));
        let unarchive_svg = window.btoa(getIconSvgEncoded("unarchive", on_primary));
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
                .export-button {
                    background-image: url('data:image/svg+xml;base64,${export_svg}');
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
                .archive-button {
                    background-image: url('data:image/svg+xml;base64,${archive_svg}');
                }
                .unarchive-button {
                    background-image: url('data:image/svg+xml;base64,${unarchive_svg}');
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

function highlightInNotePage(page, terms) {
    if (!page || !terms || terms.length === 0) return;
    let noteElements = page.querySelectorAll(".textarea-all-notes, .title, .url");
    noteElements.forEach(el => {
        if (el.contentEditable === "true") return;
        highlightInElement(el, terms);
    });
}

function highlightSearchResults(terms) {
    let noteElements = document.querySelectorAll("#all-website-sections .textarea-all-notes, #all-website-sections .title, #all-website-sections .url");
    noteElements.forEach(el => {
        if (el.contentEditable === "true") return;
        highlightInElement(el, terms);
    });
}

function highlightInElement(element, terms) {
    let walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }
    textNodes.forEach(node => {
        let text = node.textContent;
        let lower = text.toLowerCase();
        let ranges = [];

        terms.forEach(term => {
            let t = term.toLowerCase();
            let idx = lower.indexOf(t);
            while (idx !== -1) {
                ranges.push({start: idx, end: idx + t.length});
                idx = lower.indexOf(t, idx + 1);
            }
        });

        if (ranges.length === 0) return;

        ranges.sort((a, b) => a.start - b.start);
        let merged = [ranges[0]];
        for (let i = 1; i < ranges.length; i++) {
            let last = merged[merged.length - 1];
            if (ranges[i].start <= last.end) {
                last.end = Math.max(last.end, ranges[i].end);
            } else {
                merged.push(ranges[i]);
            }
        }

        let frag = document.createDocumentFragment();
        let lastIdx = 0;
        merged.forEach(r => {
            if (r.start > lastIdx) frag.appendChild(document.createTextNode(text.substring(lastIdx, r.start)));
            let mark = document.createElement("mark");
            mark.className = "search-highlight";
            mark.textContent = text.substring(r.start, r.end);
            frag.appendChild(mark);
            lastIdx = r.end;
        });
        if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.substring(lastIdx)));
        node.parentNode.replaceChild(frag, node);
    });
}

loaded();

