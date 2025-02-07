var api_url = "https://www.notefox.eu/api/v1"

loadAPI();

function loadAPI() {
    browser.runtime.onMessage.addListener((message) => {
        if (message["api"] !== undefined && message["api"]) {
            api_request(message);
        }
    });
}

function api_request(message) {
    //console.log("API request received");
    //console.log(message);
    let data = message["data"];
    switch (message["type"]) {
        case "login":
            login(data["email"], data["password"]);
            break;
        case "login-new-code":
            login_new_code(data["email"], data["password"], data["login-id"]);
            break;
        case "login-verify":
            login_verify(data["email"], data["password"], data["login-id"], data["verification-code"]);
            break;
        case "signup":
            signup(data["username"], data["email"], data["password"]);
            break;
        case "signup-new-code":
            signup_new_code(data["email"], data["password"]);
            break;
        case "signup-verify":
            signup_verify(data["email"], data["password"], data["verification-code"]);
            break;
        case "logout":
            logout(data["login-id"], false);
            break;
        case "logout-all":
            logout(data["login-id"], true);
            break;
        case "get-data":
            get_data(data["login-id"], data["token"]);
            break;
        case "get-data-after-check-id":
            //do not call this function directly, it's called automatically by get-date
            get_data_after_check_id(data["login-id"], data["token"]);
            break;
        case "send-data":
            send_data(data["login-id"], data["token"], data["updated-locally"], data["data"]);
            break;
        case "send-data-after-check-id":
            //do not call this function directly, it's called automatically by send-date
            send_data_after_check_id(data["login-id"], data["token"], data["updated-locally"], data["data"]);
            break;
        case "check-user":
            check_user(data["login-id"], data["token"]);
            break;
        case "change-password":
            change_password(data["login-id"], data["token"], data["old-password"], data["new-password"]);
            break;
        case "delete-account":
            delete_account(data["login-id"], data["token"], data["email"], data["password"]);
            break;
        case "delete-account-verify":
            delete_account_verify(data["login-id"], data["token"], data["email"], data["password"], data["deleting-code"]);
            break;
        case "delete-account-new-code":
            delete_account_verify_new_code(data["email"], data["password"]);
            break;
        default:
            console.error("Unknown API request type (" + message["type"] + ")");
    }
}

//TODO optimise api calls, follow the optimisation below
/*
//in the switch-case call in this way:
await login(data["email"], data["password"]);

async function api_call(endpoint, body) {
    try {
        const response = await fetch(api_url + endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("API request failed:", error);
        return { error: true, message: error.message };
    }
}

async function login(email, password) {
    const data = await api_call("/login/", { email, password });
    handleResponse("login", data, runtime, sendResponse, runtime=true); //runtime=true means that the response is sent to the runtime (sendMessage), false means that the response is sent to the background-service/api-service (actionResponse)
}

async function handleResponse(type, data, runtime, sendResponse, runtime=true) {
    if(runtime) {
        browser.runtime.sendMessage({
            api_response: true,
            type: type,
            data: data
        });
    } else {
        actionResponse({
            api_response: true,
            type: type,
            data: data
        });
    }
}

//to use the same function in Firefox (browser) and Chromium based (chrome) browsers:
//use (typeof browser !== 'undefined' ? browser : chrome) instead of browser
//example: browser.runtime.sendMessage() becomes (typeof browser !== 'undefined' ? browser : chrome).runtime.sendMessage()
 */

async function signup(username_value, email_value, password_value) {
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
}

async function signup_new_code(email_value, password_value) {
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
}

async function signup_verify(email_value, password_value, verification_code_value) {
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
}

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
}

async function login_new_code(email_value, password_value, login_id_value) {
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
}

async function login_verify(email_value, password_value, login_id_value, verification_code_value) {
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
}

async function logout(login_id_value, all_devices_value = false, send_response = true) {
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
}

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

async function send_data_after_check_id(login_id_value, token_value, updated_locally_value, data_value) {
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
}

async function send_data(login_id_value, token_value, updated_locally_value, data_value) {
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
}

async function check_user(login_id_value, token_value) {
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
            browser.runtime.sendMessage({ "check-user--expired": true }).then(response => {
                //logout(login_id_value, false, false);
                browser.storage.sync.remove("notefox-account");
            });
        }

    } catch (error) {
        console.error('Request failed:', error);
        /*browser.runtime.sendMessage({"check-user--expired": true}).then(response => {
            //logout(login_id_value, false, false);
            browser.storage.sync.remove("notefox-account");
        });*/
    }
}

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