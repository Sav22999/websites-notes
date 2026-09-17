/**
 * Bridge between the UI (settings, popup) and the API v2 layer.
 *
 * The listener *returns* the answer, so the caller can simply await it
 * (see callApi() in js/settings.js). The transport lives in
 * js/api/api-client.js and the endpoints in js/api/api-endpoints.js.
 */

try {
    loadAPI();
} catch (error) {
    console.error("[api-service.js] Error loading API service:", error);
    onError("api-service.js::loadAPI", "Error loading API service: " + error.message);
}

/**
 * Use this function to capture errors and save on the local storage (to be used as logs)
 * @param context {string} - context of the error (where it happened) || use format "file::function[::line]"
 * @param text {string} - text to be saved as error || it's automatically saved also the date and time
 * @param url {string} - url of the page where the error happened (if applicable)
 */
function onError(context, text, url = undefined) {
    browser.storage.sync.get("anonymous-userid").then(resultSync => {
        let anonymous_userid = null;
        if (resultSync["anonymous-userid"] !== undefined) {
            anonymous_userid = resultSync["anonymous-userid"];
        } else {
            anonymous_userid = generateSecureUUID();
            browser.storage.sync.set({"anonymous-userid": anonymous_userid});
        }

        //if url !== "" and url starts with "about:", skip it
        if (url !== undefined && url.startsWith("about:")) {
            //do nothing
        } else {
            const error = {
                "datetime": getDate(),
                "context": context,
                "error": text,
                url: url,
                "notefox-version": browser.runtime.getManifest().version,
                "anonymous-userid": anonymous_userid
            };
            browser.storage.local.get("error-logs").then(result => {
                let error_logs = [];
                if (result["error-logs"] !== undefined) {
                    error_logs = result["error-logs"];
                }
                error_logs.push(error);
                browser.storage.local.set({"error-logs": error_logs});
            });
        }
    });
}

/**
 * Load the API service
 */
function loadAPI() {
    getCorrectAPIUrl().then(() => {
        // Listen for messages: the promise returned is the answer of the API
        (typeof browser !== 'undefined' ? browser : chrome).runtime.onMessage.addListener((message) => {
            if (message["api"] !== undefined && message["api"]) {
                return api_request(message);
            }
        });
    });
}

/**
 * Resolve a message type to its endpoint and return the answer of the API
 * @param message - the request message ({api: true, type: "...", data: {...}})
 * @returns {Promise<{ok: boolean, status: string, code: number, httpStatus: number, data: any, description: (string|undefined)}>}
 */
async function api_request(message) {
    const data = message["data"] !== undefined && message["data"] !== null ? message["data"] : {};

    switch (message["type"]) {
        case "api-status":
            return await getStatus(data["force"] === true);
        case "login":
            return await apiLogin(data["email"], data["password"]);
        case "login-new-code":
            return await apiLoginNewCode(data["login-id"], data["email"], data["password"]);
        case "login-verify":
            return await apiLoginVerify(data["login-id"], data["email"], data["password"], data["verification-code"]);
        case "signup":
            return await apiSignup(data["username"], data["email"], data["password"]);
        case "signup-new-code":
            return await apiSignupNewCode(data["email"], data["password"]);
        case "signup-verify":
            return await apiSignupVerify(data["email"], data["password"], data["verification-code"]);
        case "logout":
            return await apiLogout(data["login-id"], data["token"], false);
        case "logout-all":
            return await apiLogout(data["login-id"], data["token"], true);
        case "otp-status":
            return await apiOtpStatus(data["login-id"], data["token"]);
        case "otp-enable":
            return await apiOtpEnable(data["login-id"], data["token"], data["password"], data["email"]);
        case "otp-disable":
            return await apiOtpDisable(data["login-id"], data["token"], data["password"], data["email"]);
        case "otp-disable-verify":
            return await apiOtpDisableVerify(data["login-id"], data["token"], data["password"], data["verification-code"], data["email"]);
        case "get-data":
            return await apiDataGet(data["login-id"], data["token"]);
        case "send-data":
            return await apiDataInsert(data["login-id"], data["token"], data["updated-locally"], data["data"], data["base-revision"]);
        case "get-data-last-update":
            return await apiDataLastUpdate(data["login-id"], data["token"]);
        case "get-history":
            return await apiDataHistory(data["login-id"], data["token"]);
        case "get-history-download":
            return await apiDataHistoryDownload(data["login-id"], data["token"], data["id"]);
        case "get-services":
            return await apiDataServices(data["login-id"], data["token"]);
        case "check-user":
            return await check_user(data["login-id"], data["token"]);
        case "change-password":
            return await apiPasswordEdit(data["login-id"], data["token"], data["password"], data["new-password"], data["email"]);
        case "change-password-verify":
            return await apiPasswordEditVerify(data["login-id"], data["token"], data["password"], data["new-password"], data["verification-code"], data["email"]);
        case "change-password-new-code":
            return await apiPasswordEditNewCode(data["login-id"], data["token"], data["password"], data["email"]);
        case "delete-account":
            return await apiDeleteAccount(data["email"], data["password"]);
        case "delete-account-verify":
            return await apiDeleteVerify(data["email"], data["password"], data["deleting-code"]);
        case "delete-account-new-code":
            return await apiDeleteNewCode(data["email"], data["password"]);
        case "send-error-logs":
            return await apiErrorLogs(data["error-logs"]);
        case "send-telemetry":
            return await apiTelemetry(data["telemetry"]);
        case "sync-pull":
            return await syncPull();
        case "sync-push":
            return await syncPush();
        case "sync-restore":
            return await syncRestoreSnapshot(parseSnapshot(data["snapshot"]));
        default:
            console.error("Unknown API request type (" + message["type"] + ")");
            onError("api-service.js::api_request", "Unknown API request type (" + message["type"] + ")");
            return apiResult(400, 0, null, "Unknown API request type (" + message["type"] + ")");
    }
}

/**
 * Send a message to the other parts of the extension (fire and forget)
 * @param message - the message (JSON object)
 * @returns {Promise<void>} - returns nothing (void)
 */
async function sendMessage(message) {
    // Used '(typeof browser !== 'undefined' ? browser : chrome)' instead 'browser' so it's compatible both with Firefox and Chrome
    if (message !== undefined) {
        try {
            await (typeof browser !== 'undefined' ? browser : chrome).runtime.sendMessage(message);
        } catch (e) {
            //nobody is listening: it's not an error
        }
    }
}

/**
 * Check the validity of the current session
 * @param login_id - the login-id
 * @param token - the token
 * @returns {Promise<{ok: boolean, status: string, code: number, httpStatus: number, data: any, description: (string|undefined)}>}
 */
async function check_user(login_id, token) {
    const result = await apiLoginCheckId(login_id, token);

    if (result.code === 200) {
        //console.log("User is valid");
    } else if (isNetworkFailure(result.code)) {
        //the server is unreachable: the session is not invalid, just unverifiable
        console.error("[api-service.js::check_user] Server unreachable", result);
    } else if (isAuthError(result.code) || result.code === 403) {
        console.error("[api-service.js::check_user] User is not valid: " + result.code);
        onError("api-service.js::check_user", "User is not valid: " + result.code);
        await sendMessage({"check-user--expired": true});
        browser.storage.sync.remove("notefox-account");
    } else {
        console.error("[api-service.js::check_user::exception] User is not valid", result);
        onError("api-service.js::check_user::exception", "User is not valid" + JSON.stringify(result));
        await sendMessage({"check-user--exception": true});
    }

    return result;
}
