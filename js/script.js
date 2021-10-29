var websites_json = {};

var currentUrl = []; //[domain, page]

var selected_tab = 0; //{0:domain | 1:page}

const all_strings = strings[languageToUse];

const linkReview = ["https://addons.mozilla.org/firefox/addon/websites-notes/"]; //{firefox add-ons}
const linkDonate = ["https://www.paypal.me/saveriomorelli", "https://ko-fi.com/saveriomorelli", "https://liberapay.com/Sav22999/donate"]; //{paypal, ko-fi}

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

function setLanguageUI() {
    document.getElementById("domain-button").value = all_strings["domain-label"];
    document.getElementById("page-button").value = all_strings["page-label"];
    document.getElementById("all-notes-button").value = all_strings["see-all-notes-button"];
    document.getElementById("last-updated-section").value = all_strings["last-update-text"].replaceAll("{{date_time}}", "----/--/-- --:--:--");
}

function loadUI() {
    setLanguageUI();
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        let activeTab = tabs[0];
        let activeTabId = activeTab.id;
        let activeTabUrl = activeTab.url;

        setUrl(activeTabUrl);

        if (currentUrl[0] != "" && currentUrl[1] != "") {
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

                //console.log(JSON.stringify(websites_json));
            });
        } else {
            //console.log("unsupported");
        }
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
    document.getElementById("all-notes-button").onclick = function () {
        browser.tabs.create({url: "./all-notes/index.html"});
        window.close();
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
        if (websites_json[currentUrl[selected_tab]]["tag-colour"] == undefined) {
            websites_json[currentUrl[selected_tab]]["tag-colour"] = "none";
        }
        if (selected_tab == 0) {
            websites_json[currentUrl[selected_tab]]["type"] = 0;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else {
            websites_json[currentUrl[selected_tab]]["type"] = 1;
            websites_json[currentUrl[selected_tab]]["domain"] = currentUrl[0];
        }
        if (notes == "") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
        }
        if (currentUrl[0] != "" && currentUrl[1] != "") {
            //selected_tab : {0:domain | 1:page}
            browser.storage.local.set({"websites": websites_json}, function () {
                let notes = "";
                if (websites_json[currentUrl[selected_tab]] != undefined && websites_json[currentUrl[selected_tab]]["notes"] != undefined) notes = websites_json[currentUrl[selected_tab]]["notes"];
                document.getElementById("notes").textContent = notes;

                let last_update = all_strings["never-update"];
                if (websites_json[currentUrl[selected_tab]] != undefined && websites_json[currentUrl[selected_tab]]["last-update"] != undefined) last_update = websites_json[currentUrl[selected_tab]]["last-update"];
                document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", last_update);

                let colour = "none";
                document.getElementById("tag-colour-section").removeAttribute("class");
                if (websites_json[currentUrl[selected_tab]] != undefined && websites_json[currentUrl[selected_tab]]["tag-colour"] != undefined) colour = websites_json[currentUrl[selected_tab]]["tag-colour"];
                document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);

                //console.log(JSON.stringify(websites_json));

                //send message to "background.js" to update the icon
                browser.runtime.sendMessage({"updated": true});
            });
        }
    });
}

function tabUpdated(tabId, changeInfo, tabInfo) {
    setUrl(tabInfo.url);

    loadUI();
}

function setUrl(url) {
    if (isUrlSupported(url)) {
        currentUrl[0] = getShortUrl(url);
        currentUrl[1] = url;
        document.getElementById("tabs-section").style.display = "block";
    } else {
        currentUrl[0] = url;
        currentUrl[1] = url;
        document.getElementById("tabs-section").style.display = "none";
    }
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

function isUrlSupported(url) {
    let valueToReturn = false;
    switch (getTheProtocol(url)) {
        case "http":
        case "https":
            //the URL is supported
            valueToReturn = true;
            break;

        default:
            //this disable all unsupported website
            valueToReturn = false;//todo | true->for testing, false->stable release
    }
    return valueToReturn;
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

    let last_update = all_strings["never-update"];
    if (websites_json[url] != undefined && websites_json[url]["last-update"] != undefined) last_update = websites_json[url]["last-update"];
    document.getElementById("last-updated-section").textContent = all_strings["last-update-text"].replaceAll("{{date_time}}", last_update);

    let colour = "none";
    document.getElementById("tag-colour-section").removeAttribute("class");
    if (websites_json[url] != undefined && websites_json[url]["tag-colour"] != undefined) colour = websites_json[url]["tag-colour"];
    document.getElementById("tag-colour-section").classList.add("tag-colour-top", "tag-colour-" + colour);

    document.getElementById("notes").focus();
}

loaded();