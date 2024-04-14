var api_url = "https://www.notefox.eu/api/v1"

load();

function load() {
    browser.runtime.onMessage.addListener((message) => {
        if (message["api"] !== undefined && message["api"]) {
            api_request(message);
        }
    });
}

function api_request(message) {
    console.log("API request received");
    console.log(message);
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
            logout();
            break;
        case "get-data":
            get_data();
            break;
        case "force-sync":
            force_sync();
            break;
        case "send-data":
            send_data();
            break;
        case "delete-account":
            delete_account();
            break;
        default:
            console.error("Unknown API request type (" + message["type"] + ")");
    }
}

function signup(username_value, email_value, password_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/signup/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "signup",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "signup",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "signup",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "username": username_value,
        "email": email_value,
        "password": password_value
    }));
}

function signup_new_code(email_value, password_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/signup/verify/get-new-code/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "signup-new-code",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "signup-new-code",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "signup-new-code",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "email": email_value,
        "password": password_value
    }));
}

function signup_verify(email_value, password_value, verification_code_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/signup/verify/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "signup-verify",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "signup-verify",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "signup-verify",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "email": email_value,
        "password": password_value,
        "verification-code": verification_code_value
    }));
}

function login(email_value, password_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/login/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "login",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "login",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "login",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "email": email_value,
        "password": password_value
    }));
}

function login_new_code(email_value, password_value, login_id_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/login/verify/get-new-code/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "login-new-code",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "login-new-code",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "login-new-code",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "email": email_value,
        "password": password_value,
        "login-id": login_id_value
    }));
}

function login_verify(email_value, password_value, login_id_value, verification_code_value) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', api_url + '/login/verify/', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        // Check if the request was successful
        if (xhr.status >= 200 && xhr.status < 300) {
            // Parse the response JSON if needed
            console.log(xhr.responseText);
            var data = JSON.parse(xhr.responseText);
            // Do something with the data
            browser.runtime.sendMessage({
                "api_response": true,
                "type": "login-verify",
                "data": data
            });
        } else {
            // Handle errors
            console.error('Request failed with status:', xhr.status);
            browser.runtime.sendMessage({
                "api": true,
                "type": "login-verify",
                "data": {
                    "error": true,
                    "status": xhr.status
                }
            });
        }
    };
    xhr.onerror = function () {
        browser.runtime.sendMessage({
            "api": true,
            "type": "login-verify",
            "data": {
                "error": true,
                "status": xhr.status
            }
        });
    };
    xhr.send(JSON.stringify({
        "email": email_value,
        "password": password_value,
        "login-id": login_id_value,
        "verification-code": verification_code_value
    }));
}