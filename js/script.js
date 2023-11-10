var websites_json = {};

var currentUrl = []; //[domain, page]
var currentSubject = [];

var selected_tab = 0; //{0:domain | 1:page}

const all_strings = strings[languageToUse];

const linkReview = ["https://addons.thunderbird.net/en-US/thunderbird/addon/notebird/"]; //{thunderbird add-ons}
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

        setMessageSubject(activeTab).then(r => {
            if (activeTabUrl !== undefined) {
                setUrl(activeTabUrl);
            } else {
                setUrl("**global");
            }
            loadUI();
        });
    });

    browser.tabs.onUpdated.addListener(tabUpdated);
    browser.tabs.onActivated.addListener(tabUpdated);
}

async function setMessageSubject(activeTab) {
    //console.log(JSON.stringify(activeTab));
    if (activeTab["url"] !== undefined) {
        setUrl(activeTab.url);
        let message = await messenger.messageDisplay.getDisplayedMessage(activeTab.id);
        currentSubject = message.subject;
    } else {
        setUrl("**global");
        currentSubject = "Global notes";
    }
}

function setLanguageUI() {
    document.getElementById("global-button").value = all_strings["global-label"];
    document.getElementById("email-button").value = all_strings["email-label"];
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
                    if (websites_json[currentUrl[1]] != undefined && websites_json[currentUrl[1]]["last-update"] != undefined && websites_json[currentUrl[1]]["last-update"] != null && websites_json[currentUrl[1]]["notes"] != undefined && websites_json[currentUrl[1]]["notes"] != "") {
                        setTab(1, currentUrl[1]);
                    } else if (websites_json[currentUrl[0]] != undefined && websites_json[currentUrl[0]]["last-update"] != undefined && websites_json[currentUrl[0]]["last-update"] != null && websites_json[currentUrl[0]]["notes"] != undefined && websites_json[currentUrl[0]]["notes"] != "") {
                        setTab(0, currentUrl[0]);
                    } else {
                        setTab(1, currentUrl[1]);
                    }
                } else {
                    setTab(0, currentUrl[0]);
                }

                document.getElementById("notes").focus();
                //console.log(JSON.stringify(websites_json));
            });
        } else {
            //console.log("unsupported");
        }
    });

    document.getElementById("global-button").onclick = function () {
        setTab(0, currentUrl[0]);
    }
    document.getElementById("email-button").onclick = function () {
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
        if (value["websites"] !== undefined) {
            websites_json = value["websites"];
        } else {
            websites_json = {};
        }
        if (websites_json[currentUrl[selected_tab]] === undefined) websites_json[currentUrl[selected_tab]] = {};
        let notes = document.getElementById("notes").value;
        websites_json[currentUrl[selected_tab]]["notes"] = notes;
        websites_json[currentUrl[selected_tab]]["last-update"] = getDate();
        websites_json[currentUrl[selected_tab]]["subject"] = currentSubject;
        if (websites_json[currentUrl[selected_tab]]["tag-colour"] === undefined) {
            websites_json[currentUrl[selected_tab]]["tag-colour"] = "none";
        }
        if (selected_tab === 0) {
            websites_json[currentUrl[selected_tab]]["type"] = 0;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        } else {
            websites_json[currentUrl[selected_tab]]["type"] = 1;
            websites_json[currentUrl[selected_tab]]["domain"] = "";
        }
        if (notes === "") {
            //if notes field is empty, I delete the element from the "dictionary" (notes list)
            delete websites_json[currentUrl[selected_tab]];
        }
        if (currentUrl[0] !== "" && currentUrl[1] !== "") {
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

function tabUpdated() {
    browser.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.url !== undefined) {
            setUrl(tabs.url);
        } else {
            setUrl("**global");
        }

        loadUI();
    });
}

function setUrl(url) {
    if (url === undefined) url = "**global";
    console.log(url);
    currentUrl[0] = "**global";
    currentUrl[1] = url;
    if (currentUrl[1] === "**global") {
        document.getElementById("tabs-section").style.display = "none";
    }
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
    document.getElementById("global-button").classList.remove("tab-sel");
    document.getElementById("email-button").classList.remove("tab-sel");

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