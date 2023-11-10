const icons = ["../img/icon.svg", "../img/icon-bordered.svg"];

var tab_id = 0;
var tab_url = "";
var message_subject = "";

function changeIcon(index) {
    browser.browserAction.setIcon({path: icons[index], tabId: tab_id});
}

function loaded() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;
        tab_url = activeTab.url;

        setMessageSubject(activeTab);

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

async function setMessageSubject(activeTab) {
    tab_id = activeTab.id;

    //console.log(JSON.stringify(activeTab));

    if (activeTab["type"] !== undefined && activeTab["type"] === "messageDisplay") {
        tab_url = activeTab.url;
        let message = await messenger.messageDisplay.getDisplayedMessage(tab_id);
        message_subject = message.subject;
    } else {
        tab_url = "**global";
        message_subject = "";
    }
}

function tabUpdated() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        let activeTab = tabs[0];
        tab_id = activeTab.id;

        setMessageSubject(activeTab).then(r => checkStatus());
    });
}

function checkStatus() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];

            if (websites_json[tab_url] !== undefined && websites_json[tab_url]["last-update"] !== undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] !== undefined && websites_json[tab_url]["notes"] !== "") {
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