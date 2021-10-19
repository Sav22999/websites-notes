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

        setMessageSubject(tab_id);

        checkStatus();
    });

    //catch changing of tab
    browser.tabs.onUpdated.addListener(tabUpdated);

    browser.runtime.onMessage.addListener((message) => {
        if (message["updated"] != undefined && message["updated"]) {
            checkStatus();
        }
    });
}

async function setMessageSubject(tabId) {
    let message = await messenger.messageDisplay.getDisplayedMessage(tabId);
    message_subject = message.subject;
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    tab_id = tabId;
    tab_url = tabInfo.url;

    setMessageSubject(tab_id).then(r => checkStatus());
}

function checkStatus() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];

            let domain_url = getShortUrl(tab_url);

            if (websites_json[domain_url] != undefined && websites_json[domain_url]["last-update"] != undefined && websites_json[domain_url]["last-update"] != null && websites_json[domain_url]["notes"] != undefined && websites_json[domain_url]["notes"] != "") {
                changeIcon(1);
            } else if (websites_json[tab_url] != undefined && websites_json[tab_url]["last-update"] != undefined && websites_json[tab_url]["last-update"] != null && websites_json[tab_url]["notes"] != undefined && websites_json[tab_url]["notes"] != "") {
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

function getShortUrl(url) {
    let urlToReturn = "";
    let protocol = getTheProtocol(url);
    if (url.includes(":")) {
        urlParts = url.split(":");
        urlToReturn = urlParts[1];
    }

    if (urlToReturn.includes("/")) {
        urlPartsTemp = urlToReturn.split("/");
        if (urlPartsTemp[0] == "" && urlPartsTemp[1] == "") {
            urlToReturn = urlPartsTemp[2];
        }
    }

    return (protocol + "://" + urlToReturn);
}

function getTheProtocol(url) {
    return url.split(":")[0];
}

loaded();