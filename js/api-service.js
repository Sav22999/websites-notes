var api_url = "https://www.notefox.eu/api/v1"

loadAPI();

/**
 * Use this function to capture errors and save on the local storage (to be used as logs)
 * @param context {string} - context of the error (where it happened) || use format "file::function[::line]"
 * @param text {string} - text to be saved as error || it's automatically saved also the date and time
 * @param url {string} - url of the page where the error happened (if applicable)
 */
function onError(context, text, url = undefined) {
    const error = {"datetime": getDate(), "context": context, "error": text, url: url};
    browser.storage.local.get("error-logs").then(result => {
        let error_logs = [];
        if (result["error-logs"] !== undefined) {
            error_logs = result["error-logs"];
        }
        error_logs.push(error);
        browser.storage.local.set({"error-logs": error_logs});
    });
}

/**
 * Load the API service
 */
function loadAPI() {

    // Listen for messages
    (typeof browser !== 'undefined' ? browser : chrome).runtime.onMessage.addListener((message) => {
        if (message["api"] !== undefined && message["api"]) {
            api_request(message);
        }
    });
}

/**
 * Handle the API response
 * @param message - the response message (JSON object)
 * @returns {Promise<void>}
 */
async function api_request(message) {
    //console.log("API request received");
    //console.log(message);
    let data = message["data"];
    switch (message["type"]) {
        case "login":
            await login(data["email"], data["password"]);
            break;
        case "login-new-code":
            await login_new_code(data["email"], data["password"], data["login-id"]);
            break;
        case "login-verify":
            await login_verify(data["email"], data["password"], data["login-id"], data["verification-code"]);
            break;
        case "signup":
            await signup(data["username"], data["email"], data["password"]);
            break;
        case "signup-new-code":
            await signup_new_code(data["email"], data["password"]);
            break;
        case "signup-verify":
            await signup_verify(data["email"], data["password"], data["verification-code"]);
            break;
        case "logout":
            await logout(data["login-id"], false);
            break;
        case "logout-all":
            await logout(data["login-id"], true);
            break;
        case "get-data":
            await get_data(data["login-id"], data["token"]);
            break;
        case "get-data-after-check-id":
            //do not call this function directly, it's called automatically by get-date
            await get_data_after_check_id(data["login-id"], data["token"]);
            break;
        case "send-data":
            await send_data(data["login-id"], data["token"], data["updated-locally"], data["data"]);
            break;
        case "send-data-after-check-id":
            //do not call this function directly, it's called automatically by send-date
            await send_data_after_check_id(data["login-id"], data["token"], data["updated-locally"], data["data"]);
            break;
        case "check-user":
            await check_user(data["login-id"], data["token"]);
            break;
        case "change-password":
            await change_password(data["login-id"], data["token"], data["old-password"], data["new-password"]);
            break;
        case "delete-account":
            await delete_account(data["login-id"], data["token"], data["email"], data["password"]);
            break;
        case "delete-account-verify":
            await delete_account_verify(data["login-id"], data["token"], data["email"], data["password"], data["deleting-code"]);
            break;
        case "delete-account-new-code":
            await delete_account_verify_new_code(data["email"], data["password"]);
            break;
        default:
            console.error("Unknown API request type (" + message["type"] + ")");
            onError("api-service.js::api_request", "Unknown API request type (" + message["type"] + ")");
    }
}

/**
 * Make an API call
 * @param endpoint - the API endpoint (e.g. /login/)
 * @param body - the request body (JSON object)
 * @returns {Promise<{error: boolean, message}|any>} - returns the response data or an error object
 */
async function api_call(endpoint, body) {
    try {
        const response = await fetch(api_url + endpoint, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`[api-service.js::api_call::${endpoint}] API request failed:`, error);
        onError("api-service.js::api_call", "API request failed: " + error.message);

        return {error: true, message: error.message};
    }
}

/**
 * Send a response to the background-service
 * @param message - the response message (JSON object)
 * @returns {Promise<void>} - returns nothing (void)
 */
async function sendMessage(message) {
    //console.log("[sendMessage] message", message);
    // Used '(typeof browser !== 'undefined' ? browser : chrome)' instead 'browser' so it's compatible both with Firefox and Chrome
    (typeof browser !== 'undefined' ? browser : chrome).runtime.sendMessage(message);
}

async function signup(username, email, password) {
    const data = await api_call("/signup/", {"username": username, "email": email, "password": password});
    //console.log("[api-service.js::signup] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "signup",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "signup",
            data: data
        });
    }
}

/*async function signup(username_value, email_value, password_value) {
    try {
        const response = await fetch(api_url + '/signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": username_value,
                "email": email_value,
                "password": password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup",
            "data": data
        });

    } catch (error) {
        console.error('Signup request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function signup_new_code(email, password) {
    const data = await api_call("/signup/verify/get-new-code/", {"email": email, "password": password});
    //console.log("[api-service.js::signup_new_code] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "signup-new-code",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "signup-new-code",
            data: data
        });
    }
}

/*async function signup_new_code(email_value, password_value) {
    try {
        const response = await fetch(api_url + '/signup/verify/get-new-code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup-new-code",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup-new-code",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function signup_verify(email, password, verification_code) {
    const data = await api_call("/signup/verify/", {
        "email": email,
        "password": password,
        "verification-code": verification_code
    });
    //console.log("[api-service.js::signup_verify] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "signup-verify",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "signup-verify",
            data: data
        });
    }
}

/*async function signup_verify(email_value, password_value, verification_code_value) {
    try {
        const response = await fetch(api_url + '/signup/verify/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value,
                "verification-code": verification_code_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup-verify",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "signup-verify",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function login(email, password) {
    const data = await api_call("/login/", {"email": email, "password": password});
    //console.log("[api-service.js::login] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "get-data",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "login",
            data: data
        });
    }
}

/*
async function login(email_value, password_value) {
    try {
        const response = await fetch(api_url + '/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function login_new_code(email, password, login_id) {
    const data = await api_call("/login/verify/get-new-code/", {
        "email": email,
        "password": password,
        "login-id": login_id
    });
    //console.log("[api-service.js::login_new_code] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "login-new-code",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "login-new-code",
            data: data
        });
    }
}

/*async function login_new_code(email_value, password_value, login_id_value) {
    try {
        const response = await fetch(api_url + '/login/verify/get-new-code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value,
                "login-id": login_id_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login-new-code",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login-new-code",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function login_verify(email, password, login_id, verification_code) {
    const data = await api_call("/login/verify/", {
        "email": email,
        "password": password,
        "login-id": login_id,
        "verification-code": verification_code
    });
    //console.log("[api-service.js::login_verify] data", data);
    if (data.error) {
        sendMessage({
            api_response: true,
            type: "login-verify",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        sendMessage({
            api_response: true,
            type: "login-verify",
            data: data
        });
    }
}

/*async function login_verify(email_value, password_value, login_id_value, verification_code_value) {
    try {
        const response = await fetch(api_url + '/login/verify/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value,
                "login-id": login_id_value,
                "verification-code": verification_code_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login-verify",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "login-verify",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function logout(login_id, all_devices, send_response) {
    let get_params = all_devices ? "?all-devices=true" : "";
    const data = await api_call("/logout/" + get_params, {"login-id": login_id});
    //console.log("[api-service.js::logout] data", data);
    if (send_response) {
        if (data.error) {
            sendMessage({
                api_response: true,
                type: "logout",
                data: {
                    error: true,
                    message: data.message
                }
            });
        } else {
            sendMessage({
                api_response: true,
                type: "logout",
                data: data
            });
        }
    }
}

/*async function logout(login_id_value, all_devices_value = false, send_response = true) {
    let get_params = all_devices_value ? "?all-devices=true" : "";

    try {
        const response = await fetch(api_url + '/logout/' + get_params, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value
            })
        });

        const data = await response.json();

        if (send_response) {
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "logout",
                "data": data
            });
        }

    } catch (error) {
        console.error('Request failed:', error);

        if (send_response) {
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "logout",
                "data": {
                    "error": true,
                    "message": error.message
                }
            });
        }
    }
}*/

/**
 * Get data from the API (need to check the login-id and token first: get_data function)
 * @param login_id - the login-id
 * @param token - the token
 * @returns {Promise<void>}
 */
async function get_data_after_check_id(login_id, token) {
    const data = await api_call("/data/get/", {"login-id": login_id, "token": token});
    //console.log("[api-service.js::get_data_after_check_id] data", data);
    if (data.error) {
        actionResponse({
            api_response: true,
            type: "get-data",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        actionResponse({
            api_response: true,
            type: "get-data",
            data: data
        })
    }
}

/*
async function get_data_after_check_id(login_id_value, token_value) {
    try {
        const response = await fetch(api_url + '/data/get/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value
            })
        });

        const data = await response.json();

        const response_to_send = {
            "api_response": true,
            "type": "get-data",
            "data": data
        };

        actionResponse(response_to_send);

    } catch (error) {
        console.error('Request failed:', error);

        const response_to_send = {
            "api_response": true,
            "type": "get-data",
            "data": {
                "error": true,
                "message": error.message
            }
        };

        actionResponse(response_to_send);
    }
}
*/

/**
 * Get data from the API (check only the login-id and token, after that call get_data_after_check_id function)
 * @param login_id - the login-id
 * @param token - the token
 * @returns {Promise<void>}
 */
async function get_data(login_id, token) {
    const data = await api_call("/data/get/", {"login-id": login_id, "token": token});
    //console.log("[api-service.js::get_data] data", data);
    api_request({
        "api": true,
        "type": "get-data-after-check-id",
        "data": {
            "login-id": login_id,
            "token": token
        }
    });
}

/*
async function get_data(login_id_value, token_value) {
    try {
        const response = await fetch(api_url + '/login/check-id/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value
            })
        });

        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();

        // Call get_data_after_check_id if the request was successful
        api_request({
            "api": true,
            "type": "get-data-after-check-id",
            "data": {
                "login-id": login_id_value,
                "token": token_value
            }
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "check-id-get",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}
*/

async function send_data_after_check_id(login_id, token, updated_locally, data_value) {
    const data = await api_call("/data/insert/", {
        "login-id": login_id,
        "token": token,
        "updated-locally": updated_locally,
        "data": data_value
    });
    //console.log("[api-service.js::send_data_after_check_id] data", data);
    if (data.error) {
        actionResponse({
            api_response: true,
            type: "send-data",
            data: {
                error: true,
                message: data.message
            }
        });
    } else {
        actionResponse({
            api_response: true,
            type: "send-data",
            data: data
        });
    }
}

/*async function send_data_after_check_id(login_id_value, token_value, updated_locally_value, data_value) {
    try {
        const response = await fetch(api_url + '/data/insert/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value,
                "updated-locally": updated_locally_value,
                "data": data_value
            })
        });

        const data = await response.json();

        const response_to_send = {
            "api_response": true,
            "type": "send-data",
            "data": data
        };

        actionResponse(response_to_send);

    } catch (error) {
        console.error('Request failed:', error);

        const response_to_send = {
            "api_response": true,
            "type": "send-data",
            "data": {
                "error": true,
                "message": error.message
            }
        };

        actionResponse(response_to_send);
    }
}*/

async function send_data(login_id, token, updated_locally, data_value) {
    const data = await api_call("/data/insert/", {
        "login-id": login_id,
        "token": token,
        "updated-locally": updated_locally,
        "data": data_value
    });
    //console.log("[api-service.js::send_data] data", data);
    api_request({
        "api": true,
        "type": "send-data-after-check-id",
        "data": {
            "login-id": login_id,
            "token": token,
            "updated-locally": updated_locally,
            "data": data_value
        }
    })
}

/*async function send_data(login_id_value, token_value, updated_locally_value, data_value) {
    try {
        const response = await fetch(api_url + '/login/check-id/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value
            })
        });

        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();

        // Call send_data_after_check_id if the request was successful
        api_request({
            "api": true,
            "type": "send-data-after-check-id",
            "data": {
                "login-id": login_id_value,
                "token": token_value,
                "updated-locally": updated_locally_value,
                "data": data_value
            }
        });

    } catch (error) {
        console.error('Request failed:', error);

        browser.runtime.sendMessage({
            "api": true,
            "type": "check-id-send",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}*/

async function check_user(login_id, token) {
    const data = await api_call("/login/check-id/", {"login-id": login_id, "token": token});
    //console.log("[api-service.js::check_user] data", data);

    if (data.code !== undefined && data.code === 200) {
        //console.log("User is valid");
    } else {
        //console.log("User is not valid: " + data.code);
        console.error("[api-service.js::check_user] User is not valid: " + data.code);
        onError("api-service.js::check_user", "User is not valid: " + data.code);
        browser.runtime.sendMessage({"check-user--expired": true}).then(response => {
            //logout(login_id, false, false);
            browser.storage.sync.remove("notefox-account");
        });
    }
}

/*async function check_user(login_id_value, token_value) {
    try {
        const response = await fetch(api_url + '/login/check-id/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value
            })
        });

        if (!response.ok) {
            throw new Error(`Request failed with status: ${response.status}`);
        }

        const data = await response.json();

        if (data["code"] !== undefined && data["code"] === 200) {
            //console.log("User is valid");
        } else {
            //console.log("User is not valid: " + data.code);
            browser.runtime.sendMessage({"check-user--expired": true}).then(response => {
                //logout(login_id_value, false, false);
                browser.storage.sync.remove("notefox-account");
            });
        }

    } catch (error) {
        console.error('Request failed:', error);
        //browser.runtime.sendMessage({"check-user--expired": true}).then(response => {
        //    //logout(login_id_value, false, false);
        //    browser.storage.sync.remove("notefox-account");
        //});
    }
}*/

async function change_password(login_id_value, token_value, old_password_value, new_password_value) {
    try {
        const response = await fetch(api_url + '/password/edit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value,
                "password": old_password_value,
                "new-password": new_password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "change-password",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);
        onError("api-service.js::change_password", error.message);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "change-password",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}

async function delete_account(login_id_value, token_value, email_value, password_value) {
    try {
        const response = await fetch(api_url + '/delete/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value,
                "email": email_value,
                "password": password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-account",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);
        onError("api-service.js::delete_account", error.message);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-account",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}

async function delete_account_verify(login_id_value, token_value, email_value, password_value, deleting_code_value) {
    try {
        const response = await fetch(api_url + '/delete/verify/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "login-id": login_id_value,
                "token": token_value,
                "email": email_value,
                "password": password_value,
                "deleting-code": deleting_code_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-verify",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);
        onError("api-service.js::delete_account_verify", error.message);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-verify",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}

async function delete_account_verify_new_code(email_value, password_value) {
    try {
        const response = await fetch(api_url + '/delete/verify/get-new-code/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "email": email_value,
                "password": password_value
            })
        });

        const data = await response.json();

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-account-new-code",
            "data": data
        });

    } catch (error) {
        console.error('Request failed:', error);
        onError("api-service.js::delete_account_verify_new_code", error.message);

        browser.runtime.sendMessage({
            "api_response": true,
            "type": "delete-account-new-code",
            "data": {
                "error": true,
                "message": error.message
            }
        });
    }
}