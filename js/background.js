const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];

var currentUrl = []; //[global, email]

function changeIcon(index) {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        browser.browserAction.setIcon({path: icons[index], tabId: tabs.id});
    });
}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        if (activeTab.url !== undefined) {
            setUrl(activeTab.url);
        } else {
            setUrl("**global");
        }

        checkStatus();
    });

    //catch changing of tab
    browser.tabs.onUpdated.addListener(tabUpdated);
    browser.tabs.onActivated.addListener(tabUpdated);

    browser.runtime.onMessage.addListener((message) => {
        if (message["updated"] != undefined && message["updated"]) {
            checkStatus();
        }
    });
}

function setUrl(url) {
    if (url === undefined) url = "**global";
    currentUrl[0] = "**global";
    currentUrl[1] = url;
}

function tabUpdated() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0].url !== undefined) {
            setUrl(tabs[0].url);
        } else {
            setUrl("**global");
        }

        checkStatus();
    });
}

function checkStatus() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            let email_condition = websites_json[currentUrl[1]] !== undefined && websites_json[currentUrl[1]]["last-update"] !== undefined && websites_json[currentUrl[1]]["last-update"] !== null && websites_json[currentUrl[1]]["notes"] !== undefined && websites_json[currentUrl[1]]["notes"] !== "";
            let global_condition = websites_json[currentUrl[0]] !== undefined && websites_json[currentUrl[0]]["last-update"] !== undefined && websites_json[currentUrl[0]]["last-update"] !== null && websites_json[currentUrl[0]]["notes"] !== undefined && websites_json[currentUrl[0]]["notes"] !== "";

            if (email_condition) {
                changeIcon(1);
            } else {
                changeIcon(0);
            }
        } else {
            changeIcon(0);
        }

        //console.log(JSON.stringify(websites_json));
    });
}

loaded();