/**
 * Sav Account API v2 - endpoints
 *
 * Declarative table of the v2 endpoints plus one thin wrapper each.
 * The "service" field is never sent: the API defaults to "notefox".
 */

const API_V2 = {
    status: {path: "/status/", method: "GET"},
    signup: {path: "/signup/"},
    signupVerify: {path: "/signup/verify/"},
    signupNewCode: {path: "/signup/verify/get-new-code/"},
    login: {path: "/login/"},
    loginVerify: {path: "/login/verify/"},
    loginNewCode: {path: "/login/verify/get-new-code/"},
    loginCheckId: {path: "/login/check-id/"},
    logout: {path: "/logout/"},
    otpStatus: {path: "/otp/status/"},
    otpEnable: {path: "/otp/enable/"},
    otpDisable: {path: "/otp/disable/"},
    otpDisableVerify: {path: "/otp/disable/verify/"},
    dataGet: {path: "/data/get/"},
    dataInsert: {path: "/data/insert/"},
    dataLastUpdate: {path: "/data/get/last-update/"},
    dataHistory: {path: "/data/get/history/"},
    dataHistoryDownload: {path: "/data/get/history/download/"},
    dataServices: {path: "/data/services/"},
    passwordEdit: {path: "/password/edit/"},
    passwordEditVerify: {path: "/password/edit/verify/"},
    passwordEditNewCode: {path: "/password/edit/get-new-code/"},
    deleteAccount: {path: "/delete/"},
    deleteVerify: {path: "/delete/verify/"},
    deleteNewCode: {path: "/delete/verify/get-new-code/"},
    sessions: {path: "/sessions/"},
    sessionsRevoke: {path: "/sessions/revoke/"},
    errorLogs: {path: "/error-logs/insert/"},
    telemetry: {path: "/telemetry/insert/"}
};

/**
 * Call an endpoint of the table
 * @param name {string} - the key of API_V2
 * @param body {object} - the request body
 * @returns {Promise<{ok: boolean, status: string, code: number, httpStatus: number, data: any, description: (string|undefined)}>}
 */
async function apiEndpoint(name, body = {}) {
    const endpoint = API_V2[name];
    if (endpoint === undefined) {
        console.error("[api-endpoints.js::apiEndpoint] Unknown endpoint (" + name + ")");
        onError("api-endpoints.js::apiEndpoint", "Unknown endpoint (" + name + ")");
        return apiResult(400, 0, null, "Unknown endpoint (" + name + ")");
    }
    return await apiCall(endpoint["path"], body, {method: endpoint["method"] !== undefined ? endpoint["method"] : "POST"});
}

/* Signup */

async function apiSignup(username, email, password) {
    return await apiEndpoint("signup", {"username": username, "email": email, "password": password});
}

async function apiSignupVerify(email, password, verification_code) {
    return await apiEndpoint("signupVerify", {
        "email": email, "password": password, "verification-code": verification_code
    });
}

async function apiSignupNewCode(email, password) {
    return await apiEndpoint("signupNewCode", {"email": email, "password": password});
}

/* Login */

async function apiLogin(email, password) {
    return await apiEndpoint("login", {"email": email, "password": password});
}

async function apiLoginVerify(login_id, email, password, verification_code) {
    return await apiEndpoint("loginVerify", {
        "login-id": login_id, "email": email, "password": password, "verification-code": verification_code
    });
}

async function apiLoginNewCode(login_id, email, password) {
    return await apiEndpoint("loginNewCode", {"login-id": login_id, "email": email, "password": password});
}

async function apiLoginCheckId(login_id, token) {
    return await apiEndpoint("loginCheckId", {"login-id": login_id, "token": token});
}

/**
 * Log out. The token is mandatory on v2.
 */
async function apiLogout(login_id, token, all_devices = false) {
    return await apiEndpoint("logout", {"login-id": login_id, "token": token, "all-devices": all_devices});
}

/* Two-factor authentication (login only) */

async function apiOtpStatus(login_id, token) {
    return await apiEndpoint("otpStatus", {"login-id": login_id, "token": token});
}

async function apiOtpEnable(login_id, token, password, email) {
    return await apiEndpoint("otpEnable", {
        "login-id": login_id, "token": token, "password": password, "email": email
    });
}

async function apiOtpDisable(login_id, token, password, email) {
    return await apiEndpoint("otpDisable", {
        "login-id": login_id, "token": token, "password": password, "email": email
    });
}

async function apiOtpDisableVerify(login_id, token, password, verification_code, email) {
    return await apiEndpoint("otpDisableVerify", {
        "login-id": login_id,
        "token": token,
        "password": password,
        "verification-code": verification_code,
        "email": email
    });
}

/* Sync */

async function apiDataGet(login_id, token) {
    return await apiEndpoint("dataGet", {"login-id": login_id, "token": token});
}

/**
 * Insert the snapshot. base_revision is omitted when no revision is known yet.
 */
async function apiDataInsert(login_id, token, updated_locally, data_value, base_revision = null) {
    let body = {
        "login-id": login_id, "token": token, "updated-locally": updated_locally, "data": data_value
    };
    if (base_revision !== null && base_revision !== undefined) body["base-revision"] = base_revision;
    return await apiEndpoint("dataInsert", body);
}

/**
 * Last update of the snapshot. The token is mandatory on v2.
 */
async function apiDataLastUpdate(login_id, token) {
    return await apiEndpoint("dataLastUpdate", {"login-id": login_id, "token": token});
}

async function apiDataHistory(login_id, token) {
    return await apiEndpoint("dataHistory", {"login-id": login_id, "token": token});
}

async function apiDataHistoryDownload(login_id, token, id) {
    return await apiEndpoint("dataHistoryDownload", {"login-id": login_id, "token": token, "id": id});
}

/**
 * Inventory of the services of the account: it also carries "history-enabled",
 * the sync history permission of the account (read-only).
 */
async function apiDataServices(login_id, token) {
    return await apiEndpoint("dataServices", {"login-id": login_id, "token": token});
}

/* Account */

async function apiPasswordEdit(login_id, token, password, new_password, email) {
    let body = {"login-id": login_id, "token": token, "password": password, "email": email};
    if (new_password !== undefined && new_password !== null && new_password !== "") body["new-password"] = new_password;
    return await apiEndpoint("passwordEdit", body);
}

async function apiPasswordEditVerify(login_id, token, password, new_password, verification_code, email) {
    return await apiEndpoint("passwordEditVerify", {
        "login-id": login_id,
        "token": token,
        "password": password,
        "new-password": new_password,
        "verification-code": verification_code,
        "email": email
    });
}

async function apiPasswordEditNewCode(login_id, token, password, email) {
    return await apiEndpoint("passwordEditNewCode", {
        "login-id": login_id, "token": token, "password": password, "email": email
    });
}

/**
 * Delete the account: v2 takes only the email and the password.
 */
async function apiDeleteAccount(email, password) {
    return await apiEndpoint("deleteAccount", {"email": email, "password": password});
}

async function apiDeleteVerify(email, password, deleting_code) {
    return await apiEndpoint("deleteVerify", {
        "email": email, "password": password, "deleting-code": deleting_code
    });
}

async function apiDeleteNewCode(email, password) {
    return await apiEndpoint("deleteNewCode", {"email": email, "password": password});
}

/* Sessions */

async function apiSessions(login_id, token) {
    return await apiEndpoint("sessions", {"login-id": login_id, "token": token});
}

async function apiSessionsRevoke(login_id, token, target) {
    return await apiEndpoint("sessionsRevoke", {"login-id": login_id, "token": token, "target": target});
}

/* Diagnostics */

async function apiErrorLogs(error_logs) {
    return await apiEndpoint("errorLogs", {"error-logs": error_logs});
}

async function apiTelemetry(telemetry_logs) {
    return await apiEndpoint("telemetry", {"telemetry": telemetry_logs});
}
