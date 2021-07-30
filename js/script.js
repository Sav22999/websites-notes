var websites_json = {};

var currentUrl = []; //[domain, page]

var selected_tab = 0;

const linkReview = ["https://addons.mozilla.org/firefox/addon/websites-notes/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.com/pools/c/8yl6auiU6e", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

function loaded() {
    document.addEventListener("contextmenu",
        function (e) {
            if (!(e.target.nodeName == "TEXTAREA")) {
                e.preventDefault();
            }
        }, false);

    document.getElementById("notes").focus();

    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;
        var activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);
        loadUI();
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
}

function loadUI() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let activeTab = tabs[0];
        let activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);

        browser.storage.local.get("websites", function (value) {
            if (value["websites"] != undefined) {
                websites_json = value["websites"];
                if (websites_json[currentUrl[0]] != undefined && websites_json[currentUrl[0]]["last-update"] != undefined && websites_json[currentUrl[0]]["last-update"] != null && websites_json[currentUrl[0]]["notes"] != undefined && websites_json[currentUrl[0]]["notes"] != "") {
                    setTab(0, currentUrl[0]);
                } else if (websites_json[currentUrl[1]] != undefined && websites_json[currentUrl[1]]["last-update"] != undefined && websites_json[currentUrl[1]]["last-update"] != null && websites_json[currentUrl[1]]["notes"] != undefined && websites_json[currentUrl[1]]["notes"] != "") {
                    setTab(1, currentUrl[1]);
                } else {
                    setTab(0, currentUrl[0]);
                }
            } else {
                setTab(0, currentUrl[0]);
            }
        })
    });

    document.getElementById("domain-button").onclick = function () {
        setTab(0, currentUrl[0]);
    }
    document.getElementById("page-button").onclick = function () {
        setTab(1, currentUrl[1]);
    }
    document.getElementById("notes").oninput = function () {
        saveNotes();
    }
}

function saveNotes() {
    browser.storage.local.get("websites", function (value) {
        if (value["websites"] != undefined) {
            websites_json = value["websites"];
        } else {
            websites_json = {};
        }
        if (websites_json[currentUrl[selected_tab]] == undefined) websites_json[currentUrl[selected_tab]] = {};
        let notes = document.getElementById("notes").value;
        websites_json[currentUrl[selected_tab]]["notes"] = notes;
        websites_json[currentUrl[selected_tab]]["last-update"] = getDate();
        browser.storage.local.set({"websites": websites_json}, function () {
            let notes = "";
            if (websites_json[currentUrl[selected_tab]] != undefined && websites_json[currentUrl[selected_tab]]["notes"] != undefined) notes = websites_json[currentUrl[selected_tab]]["notes"];
            document.getElementById("notes").textContent = notes;

            let last_update = "Never";
            if (websites_json[currentUrl[selected_tab]] != undefined && websites_json[currentUrl[selected_tab]]["last-update"] != undefined) last_update = websites_json[currentUrl[selected_tab]]["last-update"];
            document.getElementById("last-updated-section").textContent = "Last update: " + last_update;
        });
    });
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(tabInfo.url);

    loadUI();
}

function setUrl(url) {
    currentUrl[0] = getShortUrl(url);
    currentUrl[1] = url;
}

function getShortUrl(url) {
    let urlToReturn = url;
    let urlParts, urlPartsTemp;

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

    if (urlToReturn.includes(".")) {
        urlPartsTemp = urlToReturn.split(".");
        if (urlPartsTemp[0] == "www") {
            urlToReturn = urlToReturn.substr(4);
        }
    }

    return urlToReturn;
}

function getDate() {
    let todayDate = new Date();
    let today = "";
    today = todayDate.getFullYear() + "-";
    let month = todayDate.getMonth() + 1;
    if (month < 10) today = today + "0" + month + "-";
    else today = today + "" + month + "-";
    let day = todayDate.getDate();
    if (day < 10) today = today + "0" + day + " ";
    else today = today + "" + day + " ";
    let hour = todayDate.getHours();
    if (hour < 10) today = today + "0" + hour + ":";
    else today = today + "" + hour + ":"
    let minute = todayDate.getMinutes();
    if (minute < 10) today = today + "0" + minute + ":";
    else today = today + "" + minute + ":"
    let second = todayDate.getSeconds();
    if (second < 10) today = today + "0" + second;
    else today = today + "" + second

    return today;
}

function setTab(index, url) {
    selected_tab = index;
    document.getElementById("domain-button").classList.remove("tab-sel");
    document.getElementById("page-button").classList.remove("tab-sel");

    document.getElementsByClassName("tab")[index].classList.add("tab-sel");

    let notes = "";
    if (websites_json[url] != undefined && websites_json[url]["notes"] != undefined) notes = websites_json[url]["notes"];
    document.getElementById("notes").value = notes;

    let last_update = "Never";
    if (websites_json[url] != undefined && websites_json[url]["last-update"] != undefined) last_update = websites_json[url]["last-update"];
    document.getElementById("last-updated-section").textContent = "Last update: " + last_update;

    document.getElementById("notes").focus();
}

loaded();