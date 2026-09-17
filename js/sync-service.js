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
    const result = await sync_local.get(["sticky-notes-coords", "sticky-notes-opacity", "sticky-notes-sizes", "websites", "last-update"]);

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

    return {
        "notefox": notefox_json,
        "settings": settings_json,
        "websites": result["websites"],
        "sticky-notes": sticky_notes,
        "storage": getStorageTemp["storage"],
        "last-update": result["last-update"]
    };
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
 * Merge two snapshots without ever losing a note:
 * - "websites" is merged key by key: the entry with the newest "last-update"
 *   wins and an entry present on one side only is always kept;
 * - the other sections are taken from the side with the newest "last-update";
 * - "last-update" becomes the newest of the two.
 * @param local {object} - the snapshot of this device
 * @param server {object} - the snapshot answered by the server
 * @returns {object} - the merged snapshot
 */
function mergeSnapshots(local, server) {
    if (local === undefined || local === null) return server;
    if (server === undefined || server === null) return local;

    const local_time = syncDateToTime(local["last-update"]);
    const server_time = syncDateToTime(server["last-update"]);
    const newest = local_time >= server_time ? local : server;

    const local_websites = local["websites"] !== undefined && local["websites"] !== null ? local["websites"] : {};
    const server_websites = server["websites"] !== undefined && server["websites"] !== null ? server["websites"] : {};

    let websites = {};
    for (let url in server_websites) {
        websites[url] = server_websites[url];
    }
    for (let url in local_websites) {
        if (websites[url] === undefined) {
            websites[url] = local_websites[url];
        } else {
            const local_entry_time = syncDateToTime(local_websites[url] !== null && local_websites[url] !== undefined ? local_websites[url]["last-update"] : null);
            const server_entry_time = syncDateToTime(websites[url] !== null && websites[url] !== undefined ? websites[url]["last-update"] : null);
            if (local_entry_time >= server_entry_time) websites[url] = local_websites[url];
        }
    }

    return {
        "notefox": newest["notefox"] !== undefined ? newest["notefox"] : local["notefox"],
        "settings": newest["settings"] !== undefined ? newest["settings"] : local["settings"],
        "websites": websites,
        "sticky-notes": newest["sticky-notes"] !== undefined ? newest["sticky-notes"] : local["sticky-notes"],
        "storage": local["storage"] !== undefined ? local["storage"] : newest["storage"],
        "last-update": local_time >= server_time ? local["last-update"] : server["last-update"]
    };
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
