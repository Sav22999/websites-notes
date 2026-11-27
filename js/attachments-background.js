/**
 * Screenshots attached to the notes: the part which runs in the background.
 *
 *   - capture of the visible page, or of an area/element chosen on the page
 *     (js/inject/screenshot-picker.js), cropped and compressed here;
 *   - the description is added to the note, the image is stored apart (js/attachments.js);
 *   - "Show on the page" and the check of the linked elements (js/inject/screenshot-anchor.js);
 *   - upload/download/deletion on the Notefox server, and the cleanup of the
 *     images no note refers to anymore.
 */

const ATTACHMENT_MAX_SIDE = 2000;
const ATTACHMENT_ORPHAN_GRACE = 24 * 60 * 60 * 1000;
const ATTACHMENT_PICKER_TIMEOUT = 10 * 60 * 1000;

let attachmentPickers = {};
let attachmentsQueueRunning = false;

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.from !== "attachments") return;
    let task = null;
    if (message.type === "capture") task = startAttachmentCapture(message);
    else if (message.type === "picked") task = finishAttachmentPick(message, sender);
    else if (message.type === "fetch") task = fetchAttachmentImage(message.id).then((data) => ({ok: data !== null, data: data}));
    else if (message.type === "check") task = checkAttachmentAnchors(message.tabId, message.items);
    else if (message.type === "show") task = showAttachmentOnPage(message);
    else if (message.type === "probe") task = probeAttachmentPage(message.tabId);
    else if (message.type === "capture-raw") task = captureAttachmentRaw(message.windowId);
    else if (message.type === "attach-crop") task = attachAttachmentCrop(message);
    if (task === null) return;
    task.then(sendResponse).catch((e) => {
        console.error("[attachments-background.js] ", e);
        onError("attachments-background.js::" + message.type, e.message);
        sendResponse({ok: false, error: "internal"});
    });
    return true;
});

/**
 * Why a capture/injection failed, in a form the pages can show
 */
function getAttachmentErrorKind(error) {
    const text = (error && error.message ? error.message : String(error)).toLowerCase();
    if (text.includes("permission") || text.includes("activetab") || text.includes("all_urls") || text.includes("host")) return "permission";
    return "restricted";
}

async function startAttachmentCapture(message) {
    if (typeof message.url !== "string" || typeof message.noteId !== "string") return {ok: false, error: "internal"};
    if (message.mode === "visible") {
        let shot;
        try {
            shot = await browser.tabs.captureVisibleTab(message.windowId, {format: "png"});
        } catch (e) {
            return {ok: false, error: getAttachmentErrorKind(e)};
        }
        const image = await prepareAttachmentImage(shot, null);
        return await attachImageToNote(message.url, message.noteId, image, {"kind": "visible", "page": message.pageUrl || ""});
    }

    //area or element: the choice happens on the page
    const token = generateSecureUUID();
    Object.keys(attachmentPickers).forEach((key) => {
        if (Date.now() - attachmentPickers[key].created > ATTACHMENT_PICKER_TIMEOUT) delete attachmentPickers[key];
    });
    attachmentPickers[token] = {
        url: message.url, noteId: message.noteId, link: message.link !== false, mode: message.mode === "element" ? "element" : "area",
        pageUrl: message.pageUrl || "", windowId: message.windowId, created: Date.now()
    };
    try {
        await browser.tabs.executeScript(message.tabId, {code: "window.__notefoxPicker = " + JSON.stringify({token: token, mode: attachmentPickers[token].mode, link: attachmentPickers[token].link, strings: message.strings || {}}) + ";"});
        await browser.tabs.executeScript(message.tabId, {file: "/js/inject/screenshot-picker.js"});
    } catch (e) {
        delete attachmentPickers[token];
        return {ok: false, error: getAttachmentErrorKind(e)};
    }
    return {ok: true, started: true};
}

/**
 * Whether a script can run on the page: it can't on the pages of the browser and
 * of the extensions (about:, chrome:, moz-extension:, addons.mozilla.org...), so
 * there the area is chosen on the screenshot, in the popup, and no element can be picked
 */
async function probeAttachmentPage(tabId) {
    try {
        await browser.tabs.executeScript(tabId, {code: "true;"});
        return {ok: true, injectable: true};
    } catch (e) {
        return {ok: true, injectable: false};
    }
}

/**
 * The screenshot of the visible page, as it is: the popup lets the user choose the area on it
 */
async function captureAttachmentRaw(windowId) {
    try {
        return {ok: true, data: await browser.tabs.captureVisibleTab(windowId, {format: "png"})};
    } catch (e) {
        return {ok: false, error: getAttachmentErrorKind(e)};
    }
}

/**
 * An area chosen on the screenshot (rectangle in pixels of the image): it can't be linked to an element
 */
async function attachAttachmentCrop(message) {
    if (typeof message.url !== "string" || typeof message.noteId !== "string" || typeof message.data !== "string" || !message.data.startsWith("data:image/")) return {ok: false, error: "internal"};
    const image = await prepareAttachmentImage(message.data, {rect: message.rect, viewport: {w: message.imageWidth}});
    return await attachImageToNote(message.url, message.noteId, image, {"kind": "area", "page": message.pageUrl || ""});
}

async function finishAttachmentPick(message, sender) {
    const picker = attachmentPickers[message.token];
    if (picker === undefined) return {ok: false, error: "expired"};
    delete attachmentPickers[message.token];
    if (message.cancelled) return {ok: true, cancelled: true};

    let shot;
    try {
        shot = await browser.tabs.captureVisibleTab(sender && sender.tab ? sender.tab.windowId : picker.windowId, {format: "png"});
    } catch (e) {
        return {ok: false, error: getAttachmentErrorKind(e)};
    }
    const image = await prepareAttachmentImage(shot, {rect: message.rect, viewport: message.viewport});
    if (image === null) return {ok: false, error: "empty"};

    const description = {"kind": picker.mode, "page": picker.pageUrl};
    if (picker.link && message.anchor && typeof message.anchor === "object") description["anchor"] = message.anchor;
    return await attachImageToNote(picker.url, picker.noteId, image, description);
}

/**
 * The part of the screenshot to keep, in pixels of the image: the page may be
 * zoomed or on a high density screen, so the ratio is measured, not assumed.
 */
function getAttachmentCropBox(imageWidth, imageHeight, crop) {
    if (!crop || !crop.rect || !crop.viewport || !(crop.viewport.w > 0)) return {x: 0, y: 0, w: imageWidth, h: imageHeight};
    const ratio = imageWidth / crop.viewport.w;
    const x = Math.max(0, Math.round(crop.rect.x * ratio));
    const y = Math.max(0, Math.round(crop.rect.y * ratio));
    const w = Math.min(imageWidth - x, Math.round(crop.rect.w * ratio));
    const h = Math.min(imageHeight - y, Math.round(crop.rect.h * ratio));
    return {x: x, y: y, w: w, h: h};
}

function createAttachmentCanvas(width, height) {
    if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function attachmentCanvasToBlob(canvas, type, quality) {
    if (typeof canvas.convertToBlob === "function") return canvas.convertToBlob({type: type, quality: quality});
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * Crop, scale (longest side at most ATTACHMENT_MAX_SIDE) and compress, until the
 * image fits the limit of the server
 * @returns {Promise<{data: string, mime: string, w: number, h: number}|null>}
 */
async function prepareAttachmentImage(dataUrl, crop) {
    const source = await createImageBitmap(await (await fetch(dataUrl)).blob());
    const box = getAttachmentCropBox(source.width, source.height, crop);
    if (box.w < 4 || box.h < 4) return null;

    let scale = Math.min(1, ATTACHMENT_MAX_SIDE / Math.max(box.w, box.h));
    let quality = 0.85;
    for (let attempt = 0; attempt < 12; attempt++) {
        const width = Math.max(1, Math.round(box.w * scale));
        const height = Math.max(1, Math.round(box.h * scale));
        const canvas = createAttachmentCanvas(width, height);
        canvas.getContext("2d").drawImage(source, box.x, box.y, box.w, box.h, 0, 0, width, height);
        let blob = await attachmentCanvasToBlob(canvas, "image/webp", quality);
        if (!blob || blob.type !== "image/webp") blob = await attachmentCanvasToBlob(canvas, "image/jpeg", quality);
        if (blob && blob.size <= ATTACHMENT_MAX_IMAGE_BYTES) {
            return {data: await blobToDataUrl(blob), mime: blob.type, w: width, h: height};
        }
        quality -= 0.15;
        if (quality < 0.5) {
            quality = 0.85;
            scale *= 0.75;
        }
    }
    return null;
}

/**
 * Store the image and add its description to the note (found by its id: the
 * user may have changed the notes while choosing the area)
 */
async function attachImageToNote(url, noteId, image, description) {
    if (image === null) return {ok: false, error: "empty"};
    const result = await sync_local.get("websites");
    const websites = result["websites"] || {};
    migrateWebsites(websites);
    const entry = websites[url];
    const notes = entry && Array.isArray(entry["all-notes"]) ? entry["all-notes"] : [];
    const ids = getNoteIds(url, notes);
    const index = ids.indexOf(noteId);
    if (index === -1) return {ok: false, error: "note-missing"};
    const note = notes[index];
    if (getNoteAttachments(note).length >= ATTACHMENTS_MAX_PER_NOTE) return {ok: false, error: "too-many"};

    const attachment = Object.assign({
        "id": generateSecureUUID(), "created": getDate(), "mime": image.mime, "w": image.w, "h": image.h
    }, description);
    await storeAttachmentImage(attachment["id"], image.data, false);

    note["note-id"] = noteId;
    note["attachments"] = getNoteAttachments(note).concat([attachment]);
    note["last-update"] = getDate();
    await sync_local.set({"websites": websites, "last-update": getDate()});
    browser.runtime.sendMessage({"updated": true, "attachment-added": true}).catch(() => {});
    return {ok: true, attachment: attachment};
}

/**
 * The image, from this device or downloaded from the server
 */
async function fetchAttachmentImage(id) {
    if (typeof id !== "string") return null;
    const local = await getAttachmentImage(id);
    if (local !== null) return local;
    const account = await getSyncAccount();
    if (account === null) return null;
    const result = await apiAttachmentGet(account["login-id"], account["token"], id);
    if (result.code !== 200 || !result.data || !isAttachmentDataUrl(result.data["data"])) return null;
    await storeAttachmentImage(id, result.data["data"], true);
    return result.data["data"];
}

async function runAttachmentAnchorScript(tabId, args) {
    await browser.tabs.executeScript(tabId, {code: "window.__notefoxAnchor = " + JSON.stringify(args) + ";"});
    const results = await browser.tabs.executeScript(tabId, {file: "/js/inject/screenshot-anchor.js"});
    return Array.isArray(results) ? results[0] : undefined;
}

/**
 * Which linked elements are still on the page
 */
async function checkAttachmentAnchors(tabId, items) {
    if (!Array.isArray(items) || items.length === 0) return {ok: true, results: []};
    try {
        const results = await runAttachmentAnchorScript(tabId, {action: "check", items: items});
        return {ok: true, results: Array.isArray(results) ? results : []};
    } catch (e) {
        return {ok: false, error: getAttachmentErrorKind(e)};
    }
}

/**
 * Highlight the linked element: on the given tab, or on a new tab opened on the page
 */
async function showAttachmentOnPage(message) {
    const args = {action: "show", items: [{id: message.id, anchor: message.anchor}], strings: message.strings || {}};
    try {
        let tabId = message.tabId;
        if (tabId === undefined || tabId === null) {
            const tab = await browser.tabs.create({url: message.pageUrl});
            await waitForTabComplete(tab.id);
            tabId = tab.id;
        }
        const result = await runAttachmentAnchorScript(tabId, args);
        return {ok: true, found: Array.isArray(result) && result[0] === true};
    } catch (e) {
        return {ok: false, error: getAttachmentErrorKind(e)};
    }
}

function waitForTabComplete(tabId) {
    return new Promise((resolve) => {
        const done = () => {
            browser.tabs.onUpdated.removeListener(listener);
            clearTimeout(timer);
            resolve();
        };
        const listener = (id, info) => {
            if (id === tabId && info.status === "complete") done();
        };
        const timer = setTimeout(done, 20000);
        browser.tabs.onUpdated.addListener(listener);
    });
}

/**
 * Upload the new images, delete on the server the deleted ones, and remove from
 * this device the images no note refers to anymore (after a grace period: the
 * image is stored a moment before its note is updated)
 */
async function processAttachments() {
    if (attachmentsQueueRunning) return;
    attachmentsQueueRunning = true;
    try {
        await cleanOrphanAttachments();
        const account = await getSyncAccount();
        if (account !== null) await syncAttachmentsWithServer(account);
    } catch (e) {
        console.error("[attachments-background.js::processAttachments] ", e);
        onError("attachments-background.js::processAttachments", e.message);
    } finally {
        attachmentsQueueRunning = false;
    }
}

async function cleanOrphanAttachments() {
    const result = await sync_local.get(["websites", "websites-archive", ATTACHMENTS_INDEX_KEY]);
    const referenced = collectAttachmentIds(result["websites"], result["websites-archive"]);
    const index = result[ATTACHMENTS_INDEX_KEY] || {};
    const now = Date.now();
    const expired = [];
    let changed = false;
    Object.keys(index).forEach((id) => {
        if (referenced.has(id)) {
            if (index[id]["orphan-since"] !== undefined) changed = true;
        } else if (index[id]["orphan-since"] === undefined) {
            changed = true;
        } else if (now - index[id]["orphan-since"] > ATTACHMENT_ORPHAN_GRACE) {
            expired.push(id);
        }
    });
    if (changed) {
        await changeAttachmentsIndex(async (current) => {
            Object.keys(current).forEach((id) => {
                if (referenced.has(id)) delete current[id]["orphan-since"];
                else if (current[id]["orphan-since"] === undefined) current[id]["orphan-since"] = now;
            });
        });
    }
    if (expired.length > 0) await deleteAttachmentImages(expired);
}

async function syncAttachmentsWithServer(account) {
    const result = await browser.storage.local.get([ATTACHMENTS_INDEX_KEY, ATTACHMENTS_TO_DELETE_KEY]);

    const toDelete = Array.isArray(result[ATTACHMENTS_TO_DELETE_KEY]) ? result[ATTACHMENTS_TO_DELETE_KEY] : [];
    for (let i = 0; i < toDelete.length; i += 200) {
        const chunk = toDelete.slice(i, i + 200);
        const answer = await apiAttachmentDelete(account["login-id"], account["token"], chunk);
        if (answer.code !== 200) return;
        await changeAttachmentsIndex(async (index, queue) => {
            queue.splice(0, queue.length, ...queue.filter((id) => !chunk.includes(id)));
        });
    }

    const index = result[ATTACHMENTS_INDEX_KEY] || {};
    const toUpload = Object.keys(index).filter((id) => index[id]["uploaded"] === false && index[id]["orphan-since"] === undefined).slice(0, 20);
    for (const id of toUpload) {
        const data = await getAttachmentImage(id);
        if (data === null) continue;
        const answer = await apiAttachmentUpload(account["login-id"], account["token"], id, data);
        if (answer.code === 200) {
            await changeAttachmentsIndex(async (current) => {
                if (current[id]) current[id]["uploaded"] = true;
            });
            await browser.storage.local.set({[ATTACHMENTS_QUOTA_FULL_KEY]: false});
        } else if (answer.code === 444) {
            await browser.storage.local.set({[ATTACHMENTS_QUOTA_FULL_KEY]: true});
            return;
        } else if (answer.code === 400) {
            //refused by the server (not a valid image): never retried, it stays on this device
            await changeAttachmentsIndex(async (current) => {
                if (current[id]) current[id]["uploaded"] = "refused";
            });
        } else {
            //server not ready (503), offline, rate limited...: retried at the next synchronisation
            return;
        }
    }
}
