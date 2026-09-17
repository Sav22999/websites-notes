/**
 * Sav Account API v2 - transport layer
 *
 * Single funnel for every network call: it builds the JSON request, parses the
 * v2 envelope ({status, code, data, description}) for *every* HTTP status (v2
 * uses real HTTP statuses, so a 409 body must still be read) and returns a
 * normalised answer.
 */

const API_ENDPOINT_DEFAULT = "https://www.notefox.eu/api/v2";
const API_ENDPOINT_LEGACY_SUFFIXES = ["/api/v1", "/api/v1/"];

const API_MAX_BODY_SIZE = 2 * 1024 * 1024; //2 MB
const API_MAX_DATA_SIZE = Math.floor(1.5 * 1024 * 1024); //1.5 MB

const API_CODE_PAYLOAD_TOO_LARGE = 407;
const API_CODE_CONFLICT = 409;
const API_CODE_RATE_LIMITED = 429;
const API_CODE_KEY_UNAVAILABLE = 430;
const API_CODE_NETWORK_ERROR = 499;

let api_url = API_ENDPOINT_DEFAULT; //default API URL
let api_status_cache = undefined;

/**
 * Get the API url to be used, honouring settings["api-endpoint"].
 * An endpoint still pointing to /api/v1 is migrated to /api/v2.
 * @returns {Promise<string>} the API url
 */
async function getCorrectAPIUrl() {
    try {
        const result = await browser.storage.local.get("settings");
        let custom = undefined;
        if (result["settings"] !== undefined && result["settings"]["api-endpoint"] !== undefined && result["settings"]["api-endpoint"] !== "") {
            custom = result["settings"]["api-endpoint"];
        }

        if (custom === undefined) {
            api_url = API_ENDPOINT_DEFAULT;
            return api_url;
        }

        const migrated = migrateLegacyAPIUrl(custom);
        api_url = migrated;

        if (migrated !== custom) {
            //the stored endpoint still pointed to v1: keep it aligned
            let settings = result["settings"];
            settings["api-endpoint"] = migrated;
            browser.storage.local.set({"settings": settings});
        }

        return api_url;
    } catch (error) {
        onError("api-client.js::getCorrectAPIUrl", error.message);
        return api_url;
    }
}

/**
 * Migrate an url that still ends with /api/v1 to /api/v2
 * @param url {string} - the stored url
 * @returns {string} - the url to be used
 */
function migrateLegacyAPIUrl(url) {
    let value = url.trim();
    while (value.endsWith("/")) value = value.slice(0, -1);
    if (value.startsWith("http://notefox.eu") || value.startsWith("https://notefox.eu") || value.startsWith("http://www.notefox.eu")) {
        const apiIndex = value.indexOf("/api");
        value = "https://www.notefox.eu" + (apiIndex !== -1 ? value.substring(apiIndex) : "");
    }
    for (const suffix of API_ENDPOINT_LEGACY_SUFFIXES) {
        const clean = suffix.endsWith("/") ? suffix.slice(0, -1) : suffix;
        if (value.endsWith(clean)) {
            let base = value.slice(0, value.length - clean.length);
            if (base === "https://notefox.eu" || base === "http://notefox.eu" || base === "http://www.notefox.eu") {
                base = "https://www.notefox.eu";
            }
            return base + "/api/v2";
        }
    }
    return value;
}

/**
 * Normalise an answer of the API
 * @param code {number} - the code of the catalogue (not the HTTP status)
 * @param httpStatus {number} - the real HTTP status
 * @param data {any} - the payload
 * @param description {string|undefined} - the description of the error
 * @returns {{ok: boolean, status: string, code: number, httpStatus: number, data: any, description: (string|undefined)}}
 */
function apiResult(code, httpStatus, data, description = undefined) {
    return {
        ok: code === 200 || code === 201,
        status: code === 200 || code === 201 ? "Successful" : "Error",
        code: code,
        httpStatus: httpStatus,
        data: data === undefined ? null : data,
        description: description
    };
}

/**
 * Make a call to the API v2
 * @param path {string} - the path of the endpoint (e.g. "/login")
 * @param body {object} - the request body (JSON object)
 * @param options {{method: (string|undefined)}} - the options of the request
 * @returns {Promise<{ok: boolean, code: number, httpStatus: number, data: any, description: (string|undefined)}>}
 */
async function apiCall(path, body = {}, options = {}) {
    const method = options["method"] !== undefined ? options["method"] : "POST";

    await getCorrectAPIUrl();

    let normalizedPath = path.startsWith("/") ? path : "/" + path;
    if (!normalizedPath.endsWith("/")) {
        normalizedPath += "/";
    }

    let payload = undefined;
    if (method !== "GET") {
        if (body !== undefined && body !== null && body["data"] !== undefined && typeof body["data"] === "string" && body["data"].length > API_MAX_DATA_SIZE) {
            console.error(`[api-client.js::apiCall::${normalizedPath}] Data field too large (${body["data"].length} bytes)`);
            return apiResult(API_CODE_PAYLOAD_TOO_LARGE, 413, null, "Data field too large");
        }

        payload = JSON.stringify(body === undefined || body === null ? {} : body);

        if (payload.length > API_MAX_BODY_SIZE) {
            console.error(`[api-client.js::apiCall::${normalizedPath}] Body too large (${payload.length} bytes)`);
            return apiResult(API_CODE_PAYLOAD_TOO_LARGE, 413, null, "Body too large");
        }
    }

    try {
        const request = {
            method: method, headers: {"Content-Type": "application/json"}
        };
        if (payload !== undefined) request.body = payload;

        const response = await fetch(api_url + normalizedPath, request);

        let json = undefined;
        try {
            //the envelope must be read even when the status is not 2xx (e.g. 409)
            json = await response.json();
        } catch (parsingError) {
            json = undefined;
        }

        if (json === undefined || json === null || json["code"] === undefined) {
            console.error(`[api-client.js::apiCall::${normalizedPath}] HTTP error! Status: ${response.status}`);
            if (response.ok) {
                onError("api-client.js::apiCall", `Invalid answer from ${normalizedPath} (status ${response.status})`);
            }
            return apiResult(response.ok ? 500 : response.status, response.status, null, `HTTP error! Status: ${response.status}`);
        }

        browser.storage.local.remove("notefox-server-error-shown");

        return apiResult(Number.parseInt(json["code"], 10), response.status, json["data"], json["description"]);
    } catch (error) {
        if (isNetworkError(error)) {
            console.error(`[api-client.js::apiCall::${normalizedPath}] Network error:`, error);
        } else {
            console.error(`[api-client.js::apiCall::${normalizedPath}] API request failed:`, error);
            onError("api-client.js::apiCall", "API request failed: " + error.message);
        }
        return apiResult(API_CODE_NETWORK_ERROR, 0, null, error.message);
    }
}

/**
 * Tell a network error (offline, DNS, …) from a generic one
 * @param error {any} - the caught error
 * @returns {boolean}
 */
function isNetworkError(error) {
    if (error === undefined || error === null) return false;
    const message = error.message !== undefined ? error.message : String(error);
    return error instanceof TypeError || message.includes("NetworkError") || message.includes("Failed to fetch");
}

/**
 * Health check of the server (GET /status), cached for the session
 * @param force {boolean} - true to ignore the cache
 * @returns {Promise<{ok: boolean, code: number, httpStatus: number, data: any, description: (string|undefined)}>}
 */
async function getStatus(force = false) {
    if (!force && api_status_cache !== undefined) return api_status_cache;
    const result = await apiCall("/status/", undefined, {method: "GET"});
    if (result.ok) api_status_cache = result;
    return result;
}

function isAuthError(code) {
    return code === 402 || code === 403 || code === 404 || code === 405;
}

function isConflict(code) {
    return code === API_CODE_CONFLICT;
}

function isRateLimited(code) {
    return code === API_CODE_RATE_LIMITED;
}

function needsKey(code) {
    return code === API_CODE_KEY_UNAVAILABLE;
}

function isPayloadTooLarge(code) {
    return code === API_CODE_PAYLOAD_TOO_LARGE;
}

function isNetworkFailure(code) {
    return code === API_CODE_NETWORK_ERROR;
}
