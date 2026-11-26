/**
 * Screenshots attached to the notes: the popup and the sidebar.
 *
 * The camera button opens a small menu (visible page, area, element) with the
 * switch "Link to the page element" (on every time the popup opens). The
 * thumbnails of the current note are shown under it; a click opens the viewer
 * (show on the page, unlink, delete). The capture itself happens in the
 * background (js/attachments-background.js).
 */

let popupAttachmentsSignature = null;
let popupAnchorResults = {};
let popupAnchorsChecked = {};
let popupActiveTab = null;

function popupAttachmentString(key, fallback) {
    return (typeof all_strings !== "undefined" && all_strings[key]) ? all_strings[key] : fallback;
}

function isPopupSidebar() {
    return document.getElementById("popup-content").classList.contains("opened-as-sidebar");
}

/**
 * The url key and the note currently open in the editor
 */
function getPopupCurrentNote() {
    if (typeof currentUrl === "undefined" || !currentUrl[selected_tab]) return null;
    const url = getUrlWithSupportedProtocol(currentUrl[selected_tab], websites_json);
    const entry = websites_json[url];
    const note = entry && Array.isArray(entry["all-notes"]) ? entry["all-notes"][current_note_index] : undefined;
    if (!note) return null;
    return {url: url, note: note, index: current_note_index};
}

function getPopupActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        popupActiveTab = tabs[0] || null;
        return popupActiveTab;
    });
}

function withoutHash(url) {
    return typeof url === "string" ? url.split("#")[0] : "";
}

/**
 * Called by updateActionButtonsLive() (js/script.js) whenever the editor changes
 */
function refreshPopupAttachments(editorVisible) {
    const button = document.getElementById("screenshot-button");
    const strip = document.getElementById("attachments-strip");
    if (!button || !strip) return;

    const current = editorVisible ? getPopupCurrentNote() : null;
    if (current) button.classList.remove("hidden");
    else {
        button.classList.add("hidden");
        hideScreenshotMenu();
    }

    const attachments = current ? getNoteAttachments(current.note) : [];
    const signature = JSON.stringify([current ? current.url : "", attachments.map((item) => [item.id, !!item.anchor])]);
    if (signature === popupAttachmentsSignature) return;
    popupAttachmentsSignature = signature;
    renderPopupAttachments(current, attachments);
}

async function renderPopupAttachments(current, attachments) {
    const strip = document.getElementById("attachments-strip");
    strip.innerHTML = "";
    if (attachments.length === 0) {
        strip.classList.add("hidden");
        return;
    }
    strip.classList.remove("hidden");

    const quota = await browser.storage.local.get(ATTACHMENTS_QUOTA_FULL_KEY);
    attachments.forEach((attachment) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "attachment-thumb";
        thumb.dataset.attachmentId = attachment.id;
        thumb.title = getAttachmentKindLabel(attachment);
        const img = document.createElement("img");
        img.alt = "";
        thumb.appendChild(img);
        if (attachment.anchor) {
            const badge = document.createElement("span");
            badge.className = "attachment-thumb-badge attachment-thumb-linked";
            badge.title = popupAttachmentString("screenshot-linked", "Linked to an element of the page");
            badge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
            thumb.appendChild(badge);
        }
        thumb.onclick = () => openAttachmentViewer(current.url, current.note, attachment);
        strip.appendChild(thumb);
        loadAttachmentThumb(img, thumb, attachment.id);
    });
    if (quota[ATTACHMENTS_QUOTA_FULL_KEY] === true) {
        const notice = document.createElement("div");
        notice.className = "attachments-notice";
        notice.textContent = popupAttachmentString("screenshot-quota-full", "The space for the screenshots on the server is full: the new ones stay on this device");
        strip.appendChild(notice);
    }
    checkPopupAnchors(attachments);
}

async function loadAttachmentThumb(img, thumb, id) {
    const data = await getPopupAttachmentImage(id);
    if (data !== null) img.src = data;
    else {
        thumb.classList.add("attachment-thumb-missing");
        thumb.title = popupAttachmentString("screenshot-only-on-device", "Screenshot available only on the device where it has been taken");
    }
}

async function getPopupAttachmentImage(id) {
    const local = await getAttachmentImage(id);
    if (local !== null) return local;
    const answer = await browser.runtime.sendMessage({from: "attachments", type: "fetch", id: id}).catch(() => null);
    return answer && answer.ok ? answer.data : null;
}

function getAttachmentKindLabel(attachment) {
    if (attachment.kind === "area") return popupAttachmentString("screenshot-kind-area", "Area");
    if (attachment.kind === "element") return popupAttachmentString("screenshot-kind-element", "Element");
    return popupAttachmentString("screenshot-kind-visible", "Visible page");
}

/**
 * Mark the linked elements which aren't on the current page anymore (only the
 * screenshots taken on this very page can be checked)
 */
async function checkPopupAnchors(attachments) {
    const tab = await getPopupActiveTab();
    if (!tab) return;
    const items = attachments.filter((item) => item.anchor && withoutHash(item.page) === withoutHash(tab.url) && popupAnchorsChecked[item.id] !== tab.url)
        .map((item) => ({id: item.id, anchor: item.anchor}));
    if (items.length === 0) {
        applyPopupAnchorResults();
        return;
    }
    const answer = await browser.runtime.sendMessage({from: "attachments", type: "check", tabId: tab.id, items: items}).catch(() => null);
    if (answer && answer.ok) {
        items.forEach((item, index) => {
            popupAnchorResults[item.id] = answer.results[index] === true;
            popupAnchorsChecked[item.id] = tab.url;
        });
    }
    applyPopupAnchorResults();
}

function applyPopupAnchorResults() {
    document.querySelectorAll("#attachments-strip .attachment-thumb").forEach((thumb) => {
        const missing = popupAnchorResults[thumb.dataset.attachmentId] === false;
        thumb.classList.toggle("attachment-thumb-element-missing", missing);
        if (missing) thumb.title = popupAttachmentString("screenshot-element-missing", "The element is no longer on the page");
    });
}

/* Menu */

function hideScreenshotMenu() {
    const menu = document.getElementById("screenshot-menu");
    if (menu) menu.classList.add("hidden");
}

function showScreenshotMessage(text, permissionButton = false) {
    const message = document.getElementById("screenshot-menu-message");
    message.textContent = text;
    message.classList.toggle("hidden", text === "");
    document.getElementById("screenshot-grant-permission").classList.toggle("hidden", !permissionButton);
}

let popupPageInjectable = true;

/**
 * On the pages of the browser and of the extensions no script can run: the area
 * is then chosen on the screenshot (in the popup), no element can be picked and
 * nothing can be linked
 */
function applyPopupPageCapabilities(injectable) {
    popupPageInjectable = injectable;
    const element = document.getElementById("screenshot-menu-element");
    const link = document.getElementById("screenshot-link-check");
    const toggle = document.querySelector(".screenshot-link-toggle");
    const restricted = document.getElementById("screenshot-menu-restricted");
    element.disabled = !injectable;
    link.disabled = !injectable;
    toggle.classList.toggle("screenshot-link-toggle-disabled", !injectable);
    if (!injectable) link.checked = false;
    restricted.textContent = injectable ? "" : popupAttachmentString("screenshot-element-unavailable", "On this page the browser doesn't allow picking elements: the area is chosen on the screenshot and isn't linked");
    restricted.classList.toggle("hidden", injectable);
}

async function probePopupPage() {
    const tab = await getPopupActiveTab();
    if (!tab) return;
    const answer = await browser.runtime.sendMessage({from: "attachments", type: "probe", tabId: tab.id}).catch(() => null);
    const injectable = !answer || answer.injectable !== false;
    if (injectable && !popupPageInjectable) document.getElementById("screenshot-link-check").checked = true;
    applyPopupPageCapabilities(injectable);
    positionScreenshotMenu();
}

function positionScreenshotMenu() {
    const menu = document.getElementById("screenshot-menu");
    if (menu.classList.contains("hidden")) return;
    const button = document.getElementById("screenshot-button").getBoundingClientRect();
    const width = menu.offsetWidth;
    menu.style.left = Math.max(6, Math.min(window.innerWidth - width - 6, button.right - width)) + "px";
    const top = button.top - menu.offsetHeight - 6;
    menu.style.top = (top >= 6 ? top : button.bottom + 6) + "px";
}

function toggleScreenshotMenu() {
    const menu = document.getElementById("screenshot-menu");
    if (!menu.classList.contains("hidden")) {
        hideScreenshotMenu();
        return;
    }
    showScreenshotMessage("");
    menu.classList.remove("hidden");
    probePopupPage();
    positionScreenshotMenu();
}

function getScreenshotErrorText(error) {
    if (error === "permission") return popupAttachmentString("screenshot-error-permission", "Taking screenshots from here needs the access to the websites");
    if (error === "restricted") return popupAttachmentString("screenshot-error-restricted", "This page doesn't allow screenshots");
    if (error === "too-many") return popupAttachmentString("screenshot-error-too-many", "This note already has the maximum number of screenshots");
    if (error === "note-missing") return popupAttachmentString("screenshot-error-note-missing", "The note doesn't exist anymore");
    return popupAttachmentString("screenshot-failed", "The screenshot couldn't be attached");
}

/**
 * The note must have its id saved: the background finds it by id, also after
 * the notes have changed in the meantime
 */
async function ensurePopupNoteId(url, index) {
    const result = await sync_local.get("websites");
    const websites = result["websites"] || {};
    migrateWebsites(websites);
    const entry = websites[url];
    if (!entry || !Array.isArray(entry["all-notes"]) || !entry["all-notes"][index]) return null;
    if (!entry["all-notes"][index]["note-id"]) {
        ensureNoteIds({[url]: entry});
        await sync_local.set({"websites": websites});
    }
    websites_json = websites;
    return entry["all-notes"][index]["note-id"];
}

function getPickerStrings() {
    return {
        area: popupAttachmentString("screenshot-picker-area", "Drag to select the area to attach to the note · Esc to cancel"),
        element: popupAttachmentString("screenshot-picker-element", "Click an element to attach it to the note · ↑ selects the container · Esc to cancel"),
        cancel: popupAttachmentString("cancel-button", "Cancel"),
        saved: popupAttachmentString("screenshot-saved", "Screenshot attached to the note"),
        failed: popupAttachmentString("screenshot-failed", "The screenshot couldn't be attached")
    };
}

async function startPopupScreenshot(mode) {
    const current = getPopupCurrentNote();
    if (!current) return;
    const link = document.getElementById("screenshot-link-check").checked;

    //from the sidebar there is no "activeTab": the access to the websites is needed (asked within the click)
    let permission = Promise.resolve(true);
    if (isPopupSidebar()) permission = browser.permissions.request({origins: ["<all_urls>"]}).catch(() => false);
    if (!(await permission)) {
        showScreenshotMessage(getScreenshotErrorText("permission"), true);
        return;
    }

    const tab = await getPopupActiveTab();
    const noteId = await ensurePopupNoteId(current.url, current.index);
    if (!tab || !noteId) {
        showScreenshotMessage(getScreenshotErrorText("note-missing"));
        return;
    }
    if (mode === "area" && !popupPageInjectable) {
        await startPopupCrop(current.url, noteId, tab);
        return;
    }
    if (mode !== "visible") showScreenshotMessage(popupAttachmentString("screenshot-select-on-page", "Select on the page…"));

    const answer = await browser.runtime.sendMessage({
        from: "attachments", type: "capture", mode: mode, link: link, url: current.url, noteId: noteId,
        tabId: tab.id, windowId: tab.windowId, pageUrl: tab.url, strings: getPickerStrings()
    }).catch(() => null);

    if (answer && !answer.ok && answer.error === "restricted" && mode !== "visible") {
        //the page doesn't accept scripts after all
        applyPopupPageCapabilities(false);
        positionScreenshotMenu();
        if (mode === "area") await startPopupCrop(current.url, noteId, tab);
        else showScreenshotMessage("");
        return;
    }
    if (!answer || !answer.ok) {
        const error = answer ? answer.error : "internal";
        showScreenshotMessage(getScreenshotErrorText(error), error === "permission");
        return;
    }
    sendTelemetry("screenshot-" + mode + (link ? "-linked" : ""), "popup-attachments.js");
    if (mode === "visible") {
        hideScreenshotMenu();
        await reloadPopupNotes();
    } else if (!isPopupSidebar()) {
        //the choice happens on the page: the popup would close anyway at the first click
        window.close();
    }
}

async function reloadPopupNotes() {
    const result = await sync_local.get("websites");
    websites_json = result["websites"] || {};
    migrateWebsites(websites_json);
    popupAttachmentsSignature = null;
    updateActionButtonsLive();
}

/* Area chosen on the screenshot */

let popupCrop = null;

async function startPopupCrop(url, noteId, tab) {
    const shot = await browser.runtime.sendMessage({from: "attachments", type: "capture-raw", windowId: tab.windowId}).catch(() => null);
    if (!shot || !shot.ok) {
        const error = shot ? shot.error : "internal";
        showScreenshotMessage(getScreenshotErrorText(error), error === "permission");
        return;
    }
    hideScreenshotMenu();
    popupCrop = {url: url, noteId: noteId, pageUrl: tab.url, data: shot.data, rect: null};
    const img = document.getElementById("screenshot-crop-image");
    img.src = shot.data;
    document.getElementById("screenshot-crop-box").classList.add("hidden");
    document.getElementById("screenshot-crop-confirm").disabled = true;
    document.getElementById("screenshot-crop").classList.remove("hidden");
}

function closePopupCrop() {
    popupCrop = null;
    document.getElementById("screenshot-crop").classList.add("hidden");
    document.getElementById("screenshot-crop-image").removeAttribute("src");
}

function initPopupCrop() {
    const img = document.getElementById("screenshot-crop-image");
    const box = document.getElementById("screenshot-crop-box");
    let start = null;
    const point = (e) => {
        const r = img.getBoundingClientRect();
        return {x: Math.max(0, Math.min(r.width, e.clientX - r.left)), y: Math.max(0, Math.min(r.height, e.clientY - r.top))};
    };
    const draw = (a, b) => {
        const rect = {x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y)};
        box.style.left = (img.offsetLeft + rect.x) + "px";
        box.style.top = (img.offsetTop + rect.y) + "px";
        box.style.width = rect.w + "px";
        box.style.height = rect.h + "px";
        box.classList.remove("hidden");
        return rect;
    };
    img.addEventListener("pointerdown", (e) => {
        if (!popupCrop) return;
        e.preventDefault();
        img.setPointerCapture(e.pointerId);
        start = point(e);
        draw(start, start);
    });
    img.addEventListener("pointermove", (e) => {
        if (start) draw(start, point(e));
    });
    img.addEventListener("pointerup", (e) => {
        if (!start || !popupCrop) return;
        const rect = draw(start, point(e));
        start = null;
        //from the size on the screen to the pixels of the image
        const ratio = img.naturalWidth / img.getBoundingClientRect().width;
        popupCrop.rect = rect.w >= 4 && rect.h >= 4 ? {x: rect.x * ratio, y: rect.y * ratio, w: rect.w * ratio, h: rect.h * ratio} : null;
        if (popupCrop.rect === null) box.classList.add("hidden");
        document.getElementById("screenshot-crop-confirm").disabled = popupCrop.rect === null;
    });
    document.getElementById("screenshot-crop-cancel").onclick = closePopupCrop;
    document.getElementById("screenshot-crop-confirm").onclick = async () => {
        if (!popupCrop || !popupCrop.rect) return;
        document.getElementById("screenshot-crop-confirm").disabled = true;
        const answer = await browser.runtime.sendMessage({
            from: "attachments", type: "attach-crop", url: popupCrop.url, noteId: popupCrop.noteId, pageUrl: popupCrop.pageUrl,
            data: popupCrop.data, rect: popupCrop.rect, imageWidth: img.naturalWidth
        }).catch(() => null);
        closePopupCrop();
        if (answer && answer.ok) {
            sendTelemetry("screenshot-area-on-screenshot", "popup-attachments.js");
            await reloadPopupNotes();
        } else {
            document.getElementById("screenshot-menu").classList.remove("hidden");
            positionScreenshotMenu();
            showScreenshotMessage(getScreenshotErrorText(answer ? answer.error : "internal"));
        }
    };
}

/* Viewer */

async function openAttachmentViewer(url, note, attachment) {
    const viewer = document.getElementById("attachment-viewer");
    const img = document.getElementById("attachment-viewer-image");
    img.removeAttribute("src");
    const data = await getPopupAttachmentImage(attachment.id);
    if (data !== null) img.src = data;

    const info = [getAttachmentKindLabel(attachment)];
    if (attachment.created) info.push(datetimeToDisplay(attachment.created));
    document.getElementById("attachment-viewer-info").textContent = info.join(" · ");

    const warning = document.getElementById("attachment-viewer-warning");
    let warningText = "";
    if (data === null) warningText = popupAttachmentString("screenshot-only-on-device", "Screenshot available only on the device where it has been taken");
    else if (popupAnchorResults[attachment.id] === false) warningText = popupAttachmentString("screenshot-element-missing", "The element is no longer on the page");
    warning.textContent = warningText;
    warning.classList.toggle("hidden", warningText === "");

    const showButton = document.getElementById("attachment-viewer-show");
    const unlinkButton = document.getElementById("attachment-viewer-unlink");
    showButton.classList.toggle("hidden", !attachment.anchor);
    unlinkButton.classList.toggle("hidden", !attachment.anchor);
    showButton.onclick = () => showPopupAttachmentOnPage(attachment);
    unlinkButton.onclick = () => changePopupAttachment(url, note, attachment.id, "unlink");
    document.getElementById("attachment-viewer-delete").onclick = () => {
        const confirmationDisabled = settings_json["disable-confirmation-popup"] === true || settings_json["disable-confirmation-popup"] === "yes";
        if (confirmationDisabled || confirm(popupAttachmentString("screenshot-delete-confirmation", "Delete this screenshot?"))) {
            changePopupAttachment(url, note, attachment.id, "delete");
        }
    };
    viewer.classList.remove("hidden");
}

function closeAttachmentViewer() {
    document.getElementById("attachment-viewer").classList.add("hidden");
}

async function showPopupAttachmentOnPage(attachment) {
    const tab = await getPopupActiveTab();
    const samePage = tab && withoutHash(tab.url) === withoutHash(attachment.page);
    //on another page a new tab is opened: the access to the websites is needed to highlight there
    if (!samePage && !(await browser.permissions.request({origins: ["<all_urls>"]}).catch(() => false))) return;
    const answer = await browser.runtime.sendMessage({
        from: "attachments", type: "show", id: attachment.id, anchor: attachment.anchor,
        tabId: samePage ? tab.id : null, pageUrl: attachment.page,
        strings: {missing: popupAttachmentString("screenshot-element-missing", "The element is no longer on the page")}
    }).catch(() => null);
    if (answer && answer.ok) {
        popupAnchorResults[attachment.id] = answer.found;
        applyPopupAnchorResults();
        if (!isPopupSidebar()) window.close();
    }
}

/**
 * Remove the screenshot from the note (and its image), or only its link to the page
 */
async function changePopupAttachment(url, note, attachmentId, action) {
    const result = await sync_local.get("websites");
    const websites = result["websites"] || {};
    migrateWebsites(websites);
    const notes = websites[url] && Array.isArray(websites[url]["all-notes"]) ? websites[url]["all-notes"] : [];
    const target = notes.find((item) => getNoteAttachments(item).some((attachment) => attachment.id === attachmentId));
    if (target) {
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
        await sync_local.set({"websites": websites, "last-update": getDate()});
        if (action === "delete") await deleteAttachmentImages([attachmentId]);
        sendMessageUpdateToBackground();
        sendTelemetry("screenshot-" + action, "popup-attachments.js");
    }
    closeAttachmentViewer();
    await reloadPopupNotes();
}

function setPopupAttachmentsLanguage() {
    document.getElementById("screenshot-button").title = popupAttachmentString("screenshot-button-title", "Attach a screenshot");
    document.getElementById("screenshot-menu-visible").textContent = popupAttachmentString("screenshot-visible", "Visible page");
    document.getElementById("screenshot-menu-area").textContent = popupAttachmentString("screenshot-area", "Select an area");
    document.getElementById("screenshot-menu-element").textContent = popupAttachmentString("screenshot-element", "Select an element");
    document.getElementById("screenshot-link-text").textContent = popupAttachmentString("screenshot-link-toggle", "Link to the page element");
    document.getElementById("screenshot-link-detail").textContent = popupAttachmentString("screenshot-link-detail", "Highlights it when you come back to the page and warns you if it's gone");
    document.getElementById("screenshot-grant-permission").textContent = popupAttachmentString("screenshot-grant-permission", "Allow access");
    document.getElementById("attachment-viewer-show").textContent = popupAttachmentString("screenshot-show-on-page", "Show on the page");
    document.getElementById("attachment-viewer-unlink").textContent = popupAttachmentString("screenshot-unlink", "Unlink");
    document.getElementById("attachment-viewer-delete").textContent = popupAttachmentString("screenshot-delete", "Delete");
    document.getElementById("attachment-viewer-close").textContent = popupAttachmentString("close-button", "Close");
    document.getElementById("screenshot-crop-hint").textContent = popupAttachmentString("screenshot-crop-hint", "Drag on the screenshot to choose the area to attach");
    document.getElementById("screenshot-crop-cancel").textContent = popupAttachmentString("cancel-button", "Cancel");
    document.getElementById("screenshot-crop-confirm").textContent = popupAttachmentString("screenshot-crop-confirm", "Attach");
}

function initPopupAttachments() {
    setPopupAttachmentsLanguage();
    document.getElementById("screenshot-button").onclick = (e) => {
        e.stopPropagation();
        toggleScreenshotMenu();
    };
    document.querySelectorAll(".screenshot-menu-item").forEach((item) => {
        item.onclick = () => startPopupScreenshot(item.dataset.mode);
    });
    document.getElementById("screenshot-grant-permission").onclick = () => {
        browser.permissions.request({origins: ["<all_urls>"]}).then((granted) => {
            if (granted) showScreenshotMessage("");
        }).catch(() => {
        });
    };
    document.getElementById("attachment-viewer-close").onclick = closeAttachmentViewer;
    initPopupCrop();
    document.addEventListener("click", (e) => {
        const menu = document.getElementById("screenshot-menu");
        if (!menu.classList.contains("hidden") && !menu.contains(e.target)) hideScreenshotMenu();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        if (!document.getElementById("screenshot-crop").classList.contains("hidden")) {
            e.stopPropagation();
            closePopupCrop();
        } else if (!document.getElementById("attachment-viewer").classList.contains("hidden")) {
            e.stopPropagation();
            closeAttachmentViewer();
        } else hideScreenshotMenu();
    }, true);
    //a screenshot chosen on the page while the sidebar is open
    browser.runtime.onMessage.addListener((message) => {
        if (message && message["attachment-added"]) reloadPopupNotes();
    });
}

initPopupAttachments();
