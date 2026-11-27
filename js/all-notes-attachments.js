/**
 * Screenshots attached to the notes: "All notes".
 *
 * Thumbnails in the card of the note; a click opens the viewer (show on the
 * page, unlink, delete). The images are read from this device or downloaded by
 * the background (js/attachments-background.js).
 */

function allNotesAttachmentString(key, fallback) {
    return (typeof all_strings !== "undefined" && all_strings[key]) ? all_strings[key] : fallback;
}

function getAllNotesAttachmentKindLabel(attachment) {
    if (attachment.kind === "area") return allNotesAttachmentString("screenshot-kind-area", "Area");
    if (attachment.kind === "element") return allNotesAttachmentString("screenshot-kind-element", "Element");
    return allNotesAttachmentString("screenshot-kind-visible", "Visible page");
}

async function getAllNotesAttachmentImage(id) {
    const local = await getAttachmentImage(id);
    if (local !== null) return local;
    const answer = await browser.runtime.sendMessage({from: "attachments", type: "fetch", id: id}).catch(() => null);
    return answer && answer.ok ? answer.data : null;
}

/**
 * The thumbnails of a note, or null when it has no screenshot
 */
function renderAllNotesAttachments(fullUrl, noteIndex) {
    const entry = websites_json[fullUrl];
    const note = entry && Array.isArray(entry["all-notes"]) ? entry["all-notes"][noteIndex] : undefined;
    const attachments = getNoteAttachments(note);
    if (attachments.length === 0) return null;

    const strip = document.createElement("div");
    strip.className = "all-notes-attachments";
    attachments.forEach((attachment) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "attachment-thumb";
        thumb.title = getAllNotesAttachmentKindLabel(attachment);
        const img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        thumb.appendChild(img);
        if (attachment.anchor) {
            const badge = document.createElement("span");
            badge.className = "attachment-thumb-badge attachment-thumb-linked";
            badge.title = allNotesAttachmentString("screenshot-linked", "Linked to an element of the page");
            badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
            thumb.appendChild(badge);
        }
        thumb.onclick = () => openAllNotesAttachmentViewer(attachment);
        strip.appendChild(thumb);
        getAllNotesAttachmentImage(attachment.id).then((data) => {
            if (data !== null) img.src = data;
            else {
                thumb.classList.add("attachment-thumb-missing");
                thumb.title = allNotesAttachmentString("screenshot-only-on-device", "Screenshot available only on the device where it has been taken");
            }
        });
    });
    return strip;
}

async function openAllNotesAttachmentViewer(attachment) {
    const viewer = document.getElementById("attachment-viewer");
    const img = document.getElementById("attachment-viewer-image");
    img.removeAttribute("src");
    const data = await getAllNotesAttachmentImage(attachment.id);
    if (data !== null) img.src = data;

    const info = [getAllNotesAttachmentKindLabel(attachment)];
    if (attachment.created) info.push(datetimeToDisplay(attachment.created));
    if (attachment.page) info.push(attachment.page);
    document.getElementById("attachment-viewer-info").textContent = info.join(" · ");

    const warning = document.getElementById("attachment-viewer-warning");
    warning.textContent = data === null ? allNotesAttachmentString("screenshot-only-on-device", "Screenshot available only on the device where it has been taken") : "";
    warning.classList.toggle("hidden", data !== null);

    const showButton = document.getElementById("attachment-viewer-show");
    const unlinkButton = document.getElementById("attachment-viewer-unlink");
    showButton.classList.toggle("hidden", !attachment.anchor || !attachment.page);
    unlinkButton.classList.toggle("hidden", !attachment.anchor);
    showButton.onclick = () => {
        //the page is opened in a new tab: the access to the websites is needed to highlight there
        browser.permissions.request({origins: ["<all_urls>"]}).catch(() => false).then((granted) => {
            if (!granted) return;
            browser.runtime.sendMessage({
                from: "attachments", type: "show", id: attachment.id, anchor: attachment.anchor, tabId: null, pageUrl: attachment.page,
                strings: {missing: allNotesAttachmentString("screenshot-element-missing", "The element is no longer on the page")}
            }).catch(() => null);
            closeAllNotesAttachmentViewer();
        });
    };
    unlinkButton.onclick = () => changeAllNotesAttachment(attachment.id, "unlink");
    document.getElementById("attachment-viewer-delete").onclick = () => {
        const confirmationDisabled = settings_json["disable-confirmation-popup"] === true || settings_json["disable-confirmation-popup"] === "yes";
        if (confirmationDisabled || confirm(allNotesAttachmentString("screenshot-delete-confirmation", "Delete this screenshot?"))) {
            changeAllNotesAttachment(attachment.id, "delete");
        }
    };
    viewer.classList.remove("hidden");
}

function closeAllNotesAttachmentViewer() {
    document.getElementById("attachment-viewer").classList.add("hidden");
}

/**
 * Remove the screenshot from its note (and its image), or only its link to the page
 */
function changeAllNotesAttachment(attachmentId, action) {
    refreshNotesThen(function (storageKey) {
        let target = null;
        Object.keys(websites_json).forEach((url) => {
            const notes = websites_json[url] && websites_json[url]["all-notes"];
            if (Array.isArray(notes)) notes.forEach((note) => {
                if (getNoteAttachments(note).some((attachment) => attachment.id === attachmentId)) target = note;
            });
        });
        closeAllNotesAttachmentViewer();
        if (target === null) {
            loadDataFromBrowser("ATTACHMENT-NOT-FOUND", true);
            return;
        }
        if (action === "delete") {
            target["attachments"] = getNoteAttachments(target).filter((attachment) => attachment.id !== attachmentId);
        } else {
            target["attachments"] = getNoteAttachments(target).map((attachment) => {
                if (attachment.id !== attachmentId) return attachment;
                const copy = Object.assign({}, attachment);
                delete copy.anchor;
                return copy;
            });
        }
        target["last-update"] = getDate();
        sync_local.set({[storageKey]: websites_json, "last-update": getDate()}, function () {
            const done = () => {
                loadDataFromBrowser("ATTACHMENT-" + action.toUpperCase(), true);
                if (storageKey === "websites") sendMessageUpdateToBackground();
            };
            if (action === "delete") deleteAttachmentImages([attachmentId]).then(done);
            else done();
            sendTelemetry("screenshot-" + action, "all-notes-attachments.js");
        });
    });
}

function initAllNotesAttachments() {
    document.getElementById("attachment-viewer-show").textContent = allNotesAttachmentString("screenshot-show-on-page", "Show on the page");
    document.getElementById("attachment-viewer-unlink").textContent = allNotesAttachmentString("screenshot-unlink", "Unlink");
    document.getElementById("attachment-viewer-delete").textContent = allNotesAttachmentString("screenshot-delete", "Delete");
    document.getElementById("attachment-viewer-close").textContent = allNotesAttachmentString("close-button", "Close");
    document.getElementById("attachment-viewer-close").onclick = closeAllNotesAttachmentViewer;
    document.getElementById("attachment-viewer").addEventListener("click", (e) => {
        if (e.target.id === "attachment-viewer" || e.target.id === "attachment-viewer-image-container") closeAllNotesAttachmentViewer();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !document.getElementById("attachment-viewer").classList.contains("hidden")) {
            e.stopPropagation();
            closeAllNotesAttachmentViewer();
        }
    }, true);
}

initAllNotesAttachments();
