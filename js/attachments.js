/**
 * Screenshots attached to the notes: what both the pages and the background need.
 *
 * The note keeps only the description of each screenshot (note["attachments"],
 * small, it travels with the sync). The image is stored on its own, one key per
 * image ("attachment:<id>"), so that saving a note never rewrites the images, and
 * it is uploaded separately to the Notefox server (see js/attachments-background.js).
 *
 * "attachments-index" keeps, for every image of this device, whether it has
 * already been uploaded: it avoids reading all the images to know it.
 */

const ATTACHMENT_IMAGE_PREFIX = "attachment:";
const ATTACHMENTS_INDEX_KEY = "attachments-index";
const ATTACHMENTS_TO_DELETE_KEY = "attachments-to-delete";
const ATTACHMENTS_QUOTA_FULL_KEY = "attachments-quota-full";
const ATTACHMENTS_MAX_PER_NOTE = 20;
const ATTACHMENT_MAX_IMAGE_BYTES = 1024 * 1024; //its base64 must stay within the 1.5 MB "data" limit of the API

function attachmentImageKey(id) {
    return ATTACHMENT_IMAGE_PREFIX + id;
}

/**
 * The valid descriptions of the screenshots of a note
 */
function getNoteAttachments(note) {
    if (!note || !Array.isArray(note["attachments"])) return [];
    return note["attachments"].filter((item) => item && typeof item === "object" && typeof item["id"] === "string" && /^[A-Za-z0-9-]{8,64}$/.test(item["id"]));
}

/**
 * Ids of the screenshots referenced by the notes of one or more stores ("websites", "websites-archive")
 */
function collectAttachmentIds(...stores) {
    const ids = new Set();
    stores.forEach((store) => {
        if (!store || typeof store !== "object") return;
        Object.keys(store).forEach((url) => {
            const notes = store[url] && store[url]["all-notes"];
            if (Array.isArray(notes)) notes.forEach((note) => getNoteAttachments(note).forEach((item) => ids.add(item["id"])));
        });
    });
    return ids;
}

/**
 * Size of the image of a "data:" URL, without decoding it
 */
function getDataUrlImageBytes(dataUrl) {
    const comma = typeof dataUrl === "string" ? dataUrl.indexOf(",") : -1;
    if (comma === -1) return 0;
    const base64 = dataUrl.substring(comma + 1);
    const padding = base64.endsWith("==") ? 2 : (base64.endsWith("=") ? 1 : 0);
    return Math.floor(base64.length * 3 / 4) - padding;
}

function isAttachmentDataUrl(dataUrl) {
    return typeof dataUrl === "string" && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl) && getDataUrlImageBytes(dataUrl) <= ATTACHMENT_MAX_IMAGE_BYTES;
}

async function getAttachmentImage(id) {
    const result = await browser.storage.local.get(attachmentImageKey(id));
    const image = result[attachmentImageKey(id)];
    return image && typeof image["data"] === "string" ? image["data"] : null;
}

let attachmentsIndexQueue = Promise.resolve();

/**
 * Change the index (and the queue of the images to delete on the server) one at a time
 */
function changeAttachmentsIndex(change) {
    attachmentsIndexQueue = attachmentsIndexQueue.then(async () => {
        const result = await browser.storage.local.get([ATTACHMENTS_INDEX_KEY, ATTACHMENTS_TO_DELETE_KEY]);
        const index = Object.assign({}, result[ATTACHMENTS_INDEX_KEY]);
        const toDelete = Array.isArray(result[ATTACHMENTS_TO_DELETE_KEY]) ? result[ATTACHMENTS_TO_DELETE_KEY].slice() : [];
        const extra = await change(index, toDelete);
        await browser.storage.local.set(Object.assign({[ATTACHMENTS_INDEX_KEY]: index, [ATTACHMENTS_TO_DELETE_KEY]: Array.from(new Set(toDelete))}, extra || {}));
    }).catch((e) => {
        console.error("[attachments.js::changeAttachmentsIndex] ", e);
        if (typeof onError === "function") onError("attachments.js::changeAttachmentsIndex", e.message);
    });
    return attachmentsIndexQueue;
}

/**
 * @param uploaded {boolean} - true when the image already is on the server (downloaded from it)
 */
function storeAttachmentImage(id, dataUrl, uploaded = false) {
    return changeAttachmentsIndex(async (index) => {
        index[id] = {"uploaded": uploaded, "created": Date.now()};
        return {[attachmentImageKey(id)]: {"data": dataUrl}};
    });
}

/**
 * Delete images from this device and, unless onlyLocal, also from the server (at the next synchronisation)
 */
function deleteAttachmentImages(ids, onlyLocal = false) {
    const list = Array.from(ids || []);
    if (list.length === 0) return Promise.resolve();
    return changeAttachmentsIndex(async (index, toDelete) => {
        await browser.storage.local.remove(list.map(attachmentImageKey));
        list.forEach((id) => {
            delete index[id];
            if (!onlyLocal) toDelete.push(id);
        });
    });
}

/**
 * The images of the given ids which are on this device, as {id: dataUrl}
 */
async function getAttachmentImages(ids) {
    const list = Array.from(ids || []);
    if (list.length === 0) return {};
    const result = await browser.storage.local.get(list.map(attachmentImageKey));
    const images = {};
    list.forEach((id) => {
        const image = result[attachmentImageKey(id)];
        if (image && typeof image["data"] === "string") images[id] = image["data"];
    });
    return images;
}

/**
 * Store the images of a backup which aren't on this device yet
 * @returns {Promise<number>} - how many images have been added
 */
async function importAttachmentImages(images) {
    if (!images || typeof images !== "object") return 0;
    const ids = Object.keys(images).filter((id) => /^[A-Za-z0-9-]{8,64}$/.test(id) && isAttachmentDataUrl(images[id]));
    const existing = await getAttachmentImages(ids);
    const toAdd = ids.filter((id) => existing[id] === undefined);
    for (const id of toAdd) await storeAttachmentImage(id, images[id], false);
    return toAdd.length;
}

/**
 * The keys of all the screenshots of this device (logout)
 */
async function getAttachmentStorageKeys() {
    const result = await browser.storage.local.get(ATTACHMENTS_INDEX_KEY);
    const ids = Object.keys(result[ATTACHMENTS_INDEX_KEY] || {});
    return [ATTACHMENTS_INDEX_KEY, ATTACHMENTS_TO_DELETE_KEY, ATTACHMENTS_QUOTA_FULL_KEY].concat(ids.map(attachmentImageKey));
}
