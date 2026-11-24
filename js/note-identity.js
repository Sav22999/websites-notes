/**
 * Identity of the notes and registry of the deleted ones.
 *
 * Loaded both in the pages and in the background scripts. A note is considered
 * deleted only when the user deletes it (and it's recorded here): a note which is
 * just missing on a device is never a deletion, so a device with an empty or an
 * old storage can't delete the notes of the others.
 */

const DELETED_NOTES_KEY = "deleted-notes";
const DELETED_NOTES_MAX = 5000;
const DELETED_NOTES_MAX_AGE = 365 * 24 * 60 * 60 * 1000;

function getNoteFingerprint(note) {
    return JSON.stringify([note["title"] || "", note["notes"] || "", note["content"] || "", note["last-update"] || ""]);
}

/**
 * Not cryptographic: it only has to be the same on every device
 */
function hashNoteText(text) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ code, 2654435761);
        h2 = Math.imul(h2 ^ code, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

/**
 * Ids of the notes of an url. A note without an id gets it from its content, so
 * that the devices which have the same note give it the same id.
 */
function getNoteIds(url, notes) {
    const used = new Set();
    notes.forEach((note) => {
        if (note && note["note-id"]) used.add(note["note-id"]);
    });
    return notes.map((note) => {
        if (!note || typeof note !== "object") return null;
        if (note["note-id"]) return note["note-id"];
        const base = hashNoteText(url + "\n" + getNoteFingerprint(note));
        let id = base;
        for (let i = 2; used.has(id); i++) id = base + "-" + i;
        used.add(id);
        return id;
    });
}

/**
 * Give an id to the notes which haven't one (in place)
 * @returns {boolean} - true if something has been changed
 */
function ensureNoteIds(websites) {
    let changed = false;
    if (!websites || typeof websites !== "object") return changed;
    Object.keys(websites).forEach((url) => {
        const notes = websites[url] && websites[url]["all-notes"];
        if (!Array.isArray(notes)) return;
        getNoteIds(url, notes).forEach((id, index) => {
            if (id !== null && !notes[index]["note-id"]) {
                notes[index]["note-id"] = id;
                changed = true;
            }
        });
    });
    return changed;
}

function noteDateToTime(value) {
    const time = value ? new Date(value).getTime() : NaN;
    return Number.isNaN(time) ? 0 : time;
}

function getDeletedNoteKey(url, id) {
    return url + "\n" + id;
}

function pruneDeletedNotes(deleted) {
    const oldest = Date.now() - DELETED_NOTES_MAX_AGE;
    const result = {};
    Object.keys(deleted)
        .filter((key) => deleted[key] && typeof deleted[key] === "object" && noteDateToTime(deleted[key]["at"]) > oldest)
        .sort((a, b) => noteDateToTime(deleted[b]["at"]) - noteDateToTime(deleted[a]["at"]))
        .slice(0, DELETED_NOTES_MAX)
        .sort()
        .forEach((key) => result[key] = deleted[key]);
    return result;
}

let deletedNotesQueue = Promise.resolve();

/**
 * Record the notes the user is deleting: call it before removing them
 * @param items {Array<{url: string, notes: Array, indexes: (Array<number>|undefined)}>} -
 * all the notes of the url and the indexes of the deleted ones (all when it is omitted)
 * @returns {Promise<void>}
 */
function recordDeletedNotes(items) {
    const toRecord = {};
    items.forEach((item) => {
        if (!Array.isArray(item.notes)) return;
        const ids = getNoteIds(item.url, item.notes);
        (item.indexes === undefined ? ids.map((id, index) => index) : item.indexes).forEach((index) => {
            const note = item.notes[index];
            if (!note || typeof note !== "object") return;
            toRecord[getDeletedNoteKey(item.url, ids[index])] = {
                "version": note["last-update"] || "",
                "moves": Number(note["move-count"]) || 0,
                "at": getDate()
            };
        });
    });
    if (Object.keys(toRecord).length === 0) return Promise.resolve();

    //one at a time, otherwise two close deletions would overwrite each other
    deletedNotesQueue = deletedNotesQueue.then(async () => {
        const result = await browser.storage.local.get(DELETED_NOTES_KEY);
        await browser.storage.local.set({[DELETED_NOTES_KEY]: pruneDeletedNotes(Object.assign({}, result[DELETED_NOTES_KEY], toRecord))});
    }).catch((e) => {
        console.error("[note-identity.js::recordDeletedNotes] ", e);
        onError("note-identity.js::recordDeletedNotes", e.message);
    });
    return deletedNotesQueue;
}

function mergeDeletedNotes(a, b) {
    const merged = Object.assign({}, a);
    Object.keys(b || {}).forEach((key) => {
        const current = merged[key];
        if (!current || noteDateToTime(b[key] && b[key]["at"]) > noteDateToTime(current["at"])) merged[key] = b[key];
    });
    return pruneDeletedNotes(merged);
}

/**
 * Remove the deleted notes (in place). A note edited or moved after the version
 * which has been deleted is kept: who deleted it has never seen that version.
 */
function applyDeletedNotes(websites, deleted) {
    if (!websites || typeof websites !== "object") return;
    Object.keys(websites).forEach((url) => {
        const notes = websites[url] && websites[url]["all-notes"];
        if (!Array.isArray(notes)) return;
        const ids = getNoteIds(url, notes);
        const remaining = notes.filter((note, index) => {
            const record = ids[index] !== null ? deleted[getDeletedNoteKey(url, ids[index])] : undefined;
            if (record === undefined) return true;
            return noteDateToTime(note["last-update"]) > noteDateToTime(record["version"])
                || (Number(note["move-count"]) || 0) > (Number(record["moves"]) || 0);
        });
        if (remaining.length === notes.length) return;
        if (remaining.length === 0) delete websites[url];
        else websites[url]["all-notes"] = remaining;
    });
}
