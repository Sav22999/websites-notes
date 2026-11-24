/**
 * Revision-based synchronisation (Sav Account API v2).
 *
 * The server owns a single snapshot per account with its own "revision": the
 * client sends the revision it owns as "base-revision" and the server answers
 * 409 with its current data when they differ. Dates are informational only, so
 * a device whose clock is wrong is no longer able to win (or to lose) forever.
 */

const SYNC_STATE_KEYS = ["sync-revision", "sync-status", "sync-last-error"];

const SYNC_STATUS_IDLE = "idle";
const SYNC_STATUS_SYNCING = "syncing";
const SYNC_STATUS_SYNCED = "synced";
const SYNC_STATUS_CONFLICT = "conflict";
const SYNC_STATUS_FAILED = "failed";
const SYNC_STATUS_NEEDS_LOGIN = "needs-login";

let sync_running = false;

/**
 * Current state of the synchronisation
 * @returns {Promise<{revision: (number|null), status: string, error: (number|null)}>}
 */
async function getSyncState() {
    const result = await browser.storage.local.get(SYNC_STATE_KEYS);
    return {
        revision: result["sync-revision"] !== undefined && result["sync-revision"] !== null ? Number.parseInt(result["sync-revision"], 10) : null,
        status: result["sync-status"] !== undefined ? result["sync-status"] : SYNC_STATUS_IDLE,
        error: result["sync-last-error"] !== undefined ? result["sync-last-error"] : null
    };
}

async function setSyncRevision(revision) {
    if (revision === undefined || revision === null) return;
    const value = Number.parseInt(revision, 10);
    if (Number.isNaN(value)) return;
    await browser.storage.local.set({"sync-revision": value});
}

async function setSyncStatus(status, error = null) {
    await browser.storage.local.set({"sync-status": status, "sync-last-error": error});
}

/**
 * The stored session, or null when the user is not logged in
 * @returns {Promise<{"login-id": string, token: string}|null>}
 */
async function getSyncAccount() {
    const result = await browser.storage.sync.get(["notefox-account"]);
    const account = result["notefox-account"];
    if (account === undefined || account === null || account["login-id"] === undefined || account["token"] === undefined) return null;
    return account;
}

/**
 * Build the snapshot of this device, exactly as it is stored on the server
 * @returns {Promise<object>}
 */
async function buildLocalSnapshot() {
    const getStorageTemp = await browser.storage.local.get(["storage"]);
    const result = await sync_local.get(["sticky-notes-coords", "sticky-notes-opacity", "sticky-notes-sizes", "websites", "websites-archive", "labels-registry", DELETED_NOTES_KEY, "last-update"]);

    //every note needs an id, so that its deletion can be recognized on the other devices
    let with_new_ids = {};
    ["websites", "websites-archive"].forEach((key) => {
        migrateWebsites(result[key]);
        if (ensureNoteIds(result[key])) with_new_ids[key] = result[key];
    });
    if (Object.keys(with_new_ids).length > 0) await sync_local.set(with_new_ids);

    let sticky_notes = {};
    sticky_notes.coords = result["sticky-notes-coords"];
    sticky_notes.sizes = result["sticky-notes-sizes"];
    sticky_notes.opacity = result["sticky-notes-opacity"];

    if (sticky_notes.coords === undefined || sticky_notes.coords === null) {
        sticky_notes.coords = {x: "20px", y: "20px"};
    }
    if (sticky_notes.sizes === undefined || sticky_notes.sizes === null) {
        sticky_notes.sizes = {w: "300px", h: "300px"};
    }
    if (sticky_notes.opacity === undefined || sticky_notes.opacity === null) {
        sticky_notes.opacity = {value: 0.7};
    }
    sticky_notes.opacity.value = Number.parseFloat(sticky_notes.opacity.value).toFixed(2);

    for (let setting in settings_json) {
        if (settings_json[setting] === "yes") settings_json[setting] = true; else if (settings_json[setting] === "no") settings_json[setting] = false;
    }

    const snapshot = {
        "notefox": notefox_json,
        "settings": settings_json,
        "websites": result["websites"],
        "sticky-notes": sticky_notes,
        "storage": getStorageTemp["storage"],
        "last-update": result["last-update"]
    };
    if (result["websites-archive"] !== undefined && result["websites-archive"] !== null && Object.keys(result["websites-archive"]).length > 0) {
        snapshot["websites-archive"] = result["websites-archive"];
    }
    if (result["labels-registry"] !== undefined && result["labels-registry"] !== null) {
        snapshot["labels-registry"] = result["labels-registry"];
    }
    if (result[DELETED_NOTES_KEY] !== undefined && result[DELETED_NOTES_KEY] !== null && Object.keys(result[DELETED_NOTES_KEY]).length > 0) {
        snapshot[DELETED_NOTES_KEY] = result[DELETED_NOTES_KEY];
    }
    return snapshot;
}

/**
 * Apply a snapshot locally
 * @param snapshot {object} - the snapshot to be written
 * @returns {Promise<void>}
 */
async function applySnapshot(snapshot) {
    if (snapshot === undefined || snapshot === null) return;

    await sync_local.set(snapshot);

    //the snapshot keeps the sticky notes together, the local storage keeps them apart
    const sticky_notes = snapshot["sticky-notes"];
    if (sticky_notes !== undefined && sticky_notes !== null) {
        let to_set = {};
        if (sticky_notes["coords"] !== undefined) to_set["sticky-notes-coords"] = sticky_notes["coords"];
        if (sticky_notes["sizes"] !== undefined) to_set["sticky-notes-sizes"] = sticky_notes["sizes"];
        if (sticky_notes["opacity"] !== undefined) to_set["sticky-notes-opacity"] = sticky_notes["opacity"];
        if (Object.keys(to_set).length > 0) await sync_local.set(to_set);
    }
}

/**
 * Time of a date of the API ("YYYY-MM-DD HH:MM:SS"), 0 when it is missing
 * @param value {string|undefined|null}
 * @returns {number}
 */
function syncDateToTime(value) {
    if (value === undefined || value === null || value === "") return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
}

/**
 * Merge two "websites" objects key by key: the entry with the newest
 * "last-update" wins and an entry present on one side only is always kept.
 * Both sides are normalized to the all-notes[] model before comparing, so an
 * old-format snapshot (from the server or a not-yet-updated client) merges
 * homogeneously.
 * @param localDict {object} - the notes of this device
 * @param serverDict {object} - the notes answered by the server
 * @returns {object} - the merged notes
 */
function mergeWebsitesDictByRecency(localDict, serverDict) {
    const local_ws = localDict !== undefined && localDict !== null ? localDict : {};
    const server_ws = serverDict !== undefined && serverDict !== null ? serverDict : {};

    migrateWebsites(local_ws);
    migrateWebsites(server_ws);

    let merged = {};
    for (let url in server_ws) {
        merged[url] = server_ws[url];
    }
    for (let url in local_ws) {
        if (merged[url] === undefined) {
            merged[url] = local_ws[url];
        } else {
            const local_entry_time = getEntryLastUpdate(local_ws[url]);
            const server_entry_time = getEntryLastUpdate(merged[url]);
            if ((local_entry_time === null ? -Infinity : local_entry_time) >= (server_entry_time === null ? -Infinity : server_entry_time)) {
                merged[url] = local_ws[url];
            }
        }
    }
    return merged;
}

function getSyncNotes(websites, url) {
    const entry = websites !== undefined && websites !== null ? websites[url] : undefined;
    return entry && Array.isArray(entry["all-notes"]) ? entry["all-notes"].filter((note) => note && typeof note === "object") : [];
}

/**
 * Same note on two sides: same "note-id" (see js/note-identity.js) or, when one
 * of the two has no id, same content.
 */
function isSameSyncNote(a, b) {
    if (a["note-id"] && b["note-id"]) return a["note-id"] === b["note-id"];
    return getNoteFingerprint(a) === getNoteFingerprint(b);
}

/**
 * Compare two versions of the same note
 * @returns {number} - positive when "a" is newer than "b"
 */
function compareSyncNotes(a, b) {
    const moves = (Number(a["move-count"]) || 0) - (Number(b["move-count"]) || 0);
    //same content: only the moves tell them apart, and counting them doesn't depend on the clocks
    if (getNoteFingerprint(a) === getNoteFingerprint(b)) return moves;
    const time_a = Math.max(syncDateToTime(a["last-update"]), syncDateToTime(a["moved-at"]));
    const time_b = Math.max(syncDateToTime(b["last-update"]), syncDateToTime(b["moved-at"]));
    return time_a !== time_b ? time_a - time_b : moves;
}

/**
 * Merge two archives note by note. An archived note exists nowhere else, so
 * (unlike "websites") choosing a whole entry would lose the notes of the other.
 * @returns {object} - the merged archive
 */
function mergeArchives(localArchive, serverArchive) {
    const merged = mergeWebsitesDictByRecency(localArchive, serverArchive);
    for (let url in merged) {
        //the server comes first (also when the versions are equivalent): otherwise two
        //devices would keep on sending to each other their own order and their own copy
        const notes = getSyncNotes(serverArchive, url).slice();
        const already_matched = new Set();
        getSyncNotes(localArchive, url).forEach((local_note) => {
            let index = -1;
            for (let i = 0; i < notes.length; i++) {
                if (!already_matched.has(i) && isSameSyncNote(notes[i], local_note)) {
                    index = i;
                    break;
                }
            }
            if (index === -1) {
                already_matched.add(notes.length);
                notes.push(local_note);
            } else {
                already_matched.add(index);
                if (compareSyncNotes(local_note, notes[index]) > 0) notes[index] = local_note;
            }
        });
        merged[url] = Object.assign({}, merged[url], {"all-notes": notes});
    }
    return merged;
}

/**
 * Make a note which was moved on one side only exist once: in the place where
 * the newest of its versions is. "websites" and "archive" are changed in place.
 */
function reconcileArchive(websites, archive, local, server) {
    for (let url in archive) {
        const sides = [local, server];
        //a side which has the note both active (without an id) and archived has two different notes
        const knows = sides.map((side) => {
            const archived = getSyncNotes(side["websites-archive"], url);
            return (note) => archived.some((item) => isSameSyncNote(item, note));
        });
        const isSameActive = (active, archived, side) => isSameSyncNote(active, archived) && (!!active["note-id"] || !knows[side](archived));

        const websites_side = local["websites"] && websites[url] === local["websites"][url] ? 0 : 1;
        const kept = [];
        getSyncNotes(archive, url).forEach((archived) => {
            let newest = null;
            sides.forEach((side, index) => {
                getSyncNotes(side["websites"], url).forEach((active) => {
                    if (active["note-id"] && isSameActive(active, archived, index) && (newest === null || compareSyncNotes(active, newest) > 0)) newest = active;
                });
            });

            if (newest !== null && compareSyncNotes(newest, archived) > 0) {
                //moved out of the archive
                const notes = getSyncNotes(websites, url);
                if (!notes.some((active) => isSameSyncNote(active, newest))) {
                    websites[url] = Object.assign({}, websites[url] !== undefined ? websites[url] : archive[url], {"all-notes": notes.concat([newest])});
                }
                return;
            }

            //archived: the copy of the side which didn't know it must go
            kept.push(archived);
            if (websites[url] !== undefined) {
                const notes = getSyncNotes(websites, url);
                const remaining = notes.filter((active) => !isSameActive(active, archived, websites_side));
                if (remaining.length !== notes.length) {
                    if (remaining.length === 0) delete websites[url];
                    else websites[url] = Object.assign({}, websites[url], {"all-notes": remaining});
                }
            }
        });

        if (kept.length === 0) delete archive[url];
        else archive[url]["all-notes"] = kept;
    }
}

/**
 * Merge two registries of labels: a label is kept when it is on one side at
 * least, unless the newest recorded change (see "changes") is its deletion.
 */
function mergeLabelsRegistriesForSync(localReg, serverReg) {
    const result = {tags: [], folders: [], changes: {tags: {}, folders: {}}};
    ["tags", "folders"].forEach((kind) => {
        const normalize = (name) => kind === "tags" ? name.trim().toLowerCase() : name.trim();
        const names = new Set();
        const changes = new Map();
        [localReg, serverReg].forEach((reg) => {
            if (!reg || typeof reg !== "object") return;
            if (Array.isArray(reg[kind])) reg[kind].forEach((name) => {
                if (typeof name === "string" && name.trim()) names.add(normalize(name));
            });
            const side_changes = reg["changes"] && reg["changes"][kind];
            if (!side_changes || typeof side_changes !== "object") return;
            Object.keys(side_changes).forEach((name) => {
                const change = side_changes[name];
                if (!change || typeof change["at"] !== "string") return;
                const current = changes.get(name);
                if (current === undefined || syncDateToTime(change["at"]) > syncDateToTime(current["at"])) changes.set(name, {"at": change["at"], "deleted": change["deleted"] === true});
            });
        });
        //sorted: the same content must be written in the same way by every device
        Array.from(changes.keys()).sort().forEach((name) => {
            const change = changes.get(name);
            result["changes"][kind][name] = change;
            if (change["deleted"]) names.delete(name);
            else names.add(name);
        });
        result[kind] = Array.from(names).sort();
    });
    return result;
}

/**
 * Merge two snapshots without ever losing a note the user has not deleted:
 * - the notes the user has deleted on a device (see js/note-identity.js) are
 *   removed from both sides, unless the other side has a newer version;
 * - "websites" is merged key by key: the entry with the newest "last-update"
 *   wins and an entry present on one side only is always kept;
 * - "websites-archive" is merged note by note, then reconciled with "websites";
 * - the other sections are taken from the side with the newest "last-update";
 * - "last-update" becomes the newest of the two.
 * @param local {object} - the snapshot of this device
 * @param server {object} - the snapshot answered by the server
 * @returns {object} - the merged snapshot
 */
function mergeSnapshots(local, server) {
    if (local === undefined || local === null) return server;
    if (server === undefined || server === null) return local;

    const local_archive = local["websites-archive"];
    const server_archive = server["websites-archive"];
    const deleted = mergeDeletedNotes(local[DELETED_NOTES_KEY], server[DELETED_NOTES_KEY]);
    //copies: the original snapshots are still compared with the result
    [local, server] = [local, server].map((side) => {
        const copy = Object.assign({}, side);
        ["websites", "websites-archive"].forEach((key) => {
            if (copy[key] === undefined || copy[key] === null) return;
            copy[key] = migrateWebsites(JSON.parse(JSON.stringify(copy[key])));
            ensureNoteIds(copy[key]);
            applyDeletedNotes(copy[key], deleted);
        });
        return copy;
    });

    const local_time = syncDateToTime(local["last-update"]);
    const server_time = syncDateToTime(server["last-update"]);
    const newest = local_time >= server_time ? local : server;

    const websites = mergeWebsitesDictByRecency(local["websites"], server["websites"]);
    //the originals: when all the archived notes have been deleted, the archive must be emptied
    const hasArchive = [local_archive, server_archive].some((archive) => archive && Object.keys(archive).length > 0);
    const hasRegistry = local["labels-registry"] !== undefined || server["labels-registry"] !== undefined;

    const merged = {
        "notefox": newest["notefox"] !== undefined ? newest["notefox"] : local["notefox"],
        "settings": newest["settings"] !== undefined ? newest["settings"] : local["settings"],
        "websites": websites,
        "sticky-notes": newest["sticky-notes"] !== undefined ? newest["sticky-notes"] : local["sticky-notes"],
        "storage": local["storage"] !== undefined ? local["storage"] : newest["storage"],
        "last-update": local_time >= server_time ? local["last-update"] : server["last-update"]
    };
    if (hasArchive) {
        const archive = mergeArchives(local["websites-archive"], server["websites-archive"]);
        reconcileArchive(websites, archive, local, server);
        //written also when it becomes empty: it must replace the archive of this device
        merged["websites-archive"] = archive;
    }
    if (hasRegistry) {
        merged["labels-registry"] = mergeLabelsRegistriesForSync(local["labels-registry"], server["labels-registry"]);
    }
    if (Object.keys(deleted).length > 0) merged[DELETED_NOTES_KEY] = deleted;
    return merged;
}

/**
 * Parse the "data" field of an answer of the API
 * @param value {string|object|undefined|null}
 * @returns {object|null}
 */
function parseSnapshot(value) {
    if (value === undefined || value === null) return null;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch (e) {
        console.error("[sync-service.js::parseSnapshot] Invalid snapshot", e);
        onError("sync-service.js::parseSnapshot", "Invalid snapshot: " + e.message);
        return null;
    }
}

/**
 * Report a failing answer of the API
 * @param context {string} - where it happened
 * @param result {object} - the answer of the API
 * @returns {Promise<void>}
 */
async function handleSyncError(context, result) {
    if (needsKey(result.code)) {
        //the account has never completed a login through v2: nothing is overwritten
        await setSyncStatus(SYNC_STATUS_NEEDS_LOGIN, result.code);
        return;
    }

    if (isRateLimited(result.code)) {
        //back off: it is retried at the next scheduled synchronisation
        await setSyncStatus(SYNC_STATUS_FAILED, result.code);
        return;
    }

    await setSyncStatus(SYNC_STATUS_FAILED, result.code);

    if (!isNetworkFailure(result.code)) {
        console.error(`[sync-service.js::${context}] Error: `, result);
        onError("sync-service.js::" + context, JSON.stringify({code: result.code, description: result.description}));
    }
}

/**
 * Read the snapshot of the server and reconcile it with the local one
 * @returns {Promise<object|null>} - the answer of the API
 */
async function syncPull() {
    const account = await getSyncAccount();
    if (account === null) return null;

    if (sync_running) return null;
    sync_running = true;

    try {
        await setSyncStatus(SYNC_STATUS_SYNCING);

        const result = await apiDataGet(account["login-id"], account["token"]);

        if (result.code === 201) {
            //no data on the server yet: send the local snapshot
            await syncPush(true);
            return result;
        }

        if (result.code !== 200 || result.data === null) {
            await handleSyncError("syncPull", result);
            return result;
        }

        const server_revision = result.data["revision"] !== undefined ? Number.parseInt(result.data["revision"], 10) : null;
        const server_snapshot = parseSnapshot(result.data["data"]);
        const state = await getSyncState();
        const local_snapshot = await buildLocalSnapshot();

        if (server_snapshot === null) {
            await setSyncRevision(server_revision);
            await syncPush(true);
            return result;
        }

        if (state.revision !== null && server_revision !== null && state.revision === server_revision) {
            //nothing new on the server: send the local changes, if any
            await setSyncRevision(server_revision);
            if (JSON.stringify(local_snapshot) !== JSON.stringify(server_snapshot)) {
                await syncPush(true);
            } else {
                await setSyncStatus(SYNC_STATUS_SYNCED);
            }
            return result;
        }

        //the server has something this device has never seen: merge, never choose
        const merged = mergeSnapshots(local_snapshot, server_snapshot);
        await applySnapshot(merged);
        await setSyncRevision(server_revision);

        if (JSON.stringify(merged) !== JSON.stringify(server_snapshot)) {
            //the merge added something: it must be sent back
            await syncPush(true);
        } else {
            await setSyncStatus(SYNC_STATUS_SYNCED);
        }

        syncUpdateFromServer();

        return result;
    } catch (e) {
        console.error("[sync-service.js::syncPull] ", e);
        onError("sync-service.js::syncPull", e.message);
        await setSyncStatus(SYNC_STATUS_FAILED);
        return null;
    } finally {
        sync_running = false;
    }
}

/**
 * Send the local snapshot to the server with the revision this device owns
 * @param already_running {boolean} - true when it is called by syncPull()
 * @returns {Promise<object|null>} - the answer of the API
 */
async function syncPush(already_running = false) {
    const account = await getSyncAccount();
    if (account === null) return null;

    if (!already_running) {
        if (sync_running) return null;
        sync_running = true;
    }

    try {
        if (!already_running) await setSyncStatus(SYNC_STATUS_SYNCING);

        const snapshot = await buildLocalSnapshot();
        const state = await getSyncState();

        const result = await apiDataInsert(account["login-id"], account["token"], correctDatetime(snapshot["last-update"]), JSON.stringify(snapshot), state.revision);

        if (result.code === 200) {
            if (result.data !== null && result.data !== undefined) await setSyncRevision(result.data["revision"]);
            await setSyncStatus(SYNC_STATUS_SYNCED);
            return result;
        }

        if (isConflict(result.code)) {
            return await resolveSyncConflict(account, result.data, 0);
        }

        await handleSyncError("syncPush", result);
        return result;
    } catch (e) {
        console.error("[sync-service.js::syncPush] ", e);
        onError("sync-service.js::syncPush", e.message);
        await setSyncStatus(SYNC_STATUS_FAILED);
        return null;
    } finally {
        if (!already_running) sync_running = false;
    }
}

/**
 * Resolve a revision conflict: merge the snapshot of the server with the local
 * one, apply it locally and send it again once with the revision of the answer
 * @param account - the stored session
 * @param conflict - the "data" of the 409 answer ({revision, data})
 * @param attempt {number} - 0 for the first try, the cycle aborts after that
 * @returns {Promise<object|null>}
 */
async function resolveSyncConflict(account, conflict, attempt = 0) {
    if (conflict === undefined || conflict === null) {
        await setSyncStatus(SYNC_STATUS_CONFLICT, API_CODE_CONFLICT);
        return null;
    }

    const server_snapshot = parseSnapshot(conflict["data"]);
    const revision = conflict["revision"] !== undefined ? Number.parseInt(conflict["revision"], 10) : null;
    const local_snapshot = await buildLocalSnapshot();
    const merged = mergeSnapshots(local_snapshot, server_snapshot);

    await applySnapshot(merged);
    await setSyncRevision(revision);
    syncUpdateFromServer();

    if (attempt > 0) {
        //a second conflict in a row: it is retried at the next scheduled tick
        await setSyncStatus(SYNC_STATUS_CONFLICT, API_CODE_CONFLICT);
        return null;
    }

    const result = await apiDataInsert(account["login-id"], account["token"], correctDatetime(merged["last-update"]), JSON.stringify(merged), revision);

    if (result.code === 200) {
        if (result.data !== null && result.data !== undefined) await setSyncRevision(result.data["revision"]);
        await setSyncStatus(SYNC_STATUS_SYNCED);
        return result;
    }

    if (isConflict(result.code)) {
        return await resolveSyncConflict(account, result.data, attempt + 1);
    }

    await handleSyncError("resolveSyncConflict", result);
    return result;
}

/**
 * Apply a snapshot coming from the synchronisation history and send it as a
 * normal insert
 * @param snapshot {object} - the snapshot to be restored
 * @returns {Promise<object|null>}
 */
async function syncRestoreSnapshot(snapshot) {
    if (snapshot === undefined || snapshot === null) return null;
    await applySnapshot(snapshot);
    syncUpdateFromServer();
    return await syncPush();
}
