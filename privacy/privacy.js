const linkFirstLaunch = "https://notefox.eu/help/first-run"

const all_strings = strings[languageToUse];

window.onload = function () {
    loaded()
}

function loaded() {
    chrome.storage.sync.get("privacy").then(result => {
        //console.log(">> Installation", result)
        if (result.privacy !== undefined) {
            //Already accepted privacy policy
            //console.log(result.privacy);

            document.getElementById("uninstall-button").disabled = true;
            document.getElementById("continue-button").disabled = true;
            if (document.getElementById("privacy-policy-already-accepted").classList.contains("hidden")) {
                document.getElementById("privacy-policy-already-accepted").classList.remove("hidden");
            }
            document.getElementById("buttons").classList.add("red");

            window.close();
        }
    });

    document.getElementById("uninstall-button").onclick = uninstall;
    document.getElementById("continue-button").onclick = continueNotefox;
    //document.getElementById("privacy").onclick = uninstall;

    this.loadUI();
}

function loadUI() {
    document.getElementById("title").innerHTML = all_strings["privacy"]["title"];
    document.getElementById("description1").innerHTML = all_strings["privacy"]["description1"];
    document.getElementById("description2-evidence").innerHTML = all_strings["privacy"]["description2-evidence"];
    document.getElementById("description3").innerHTML = all_strings["privacy"]["description3"];
    document.getElementById("description4").innerHTML = all_strings["privacy"]["description4"];
    document.getElementById("description5").innerHTML = all_strings["privacy"]["description5"];
    document.getElementById("description6").innerHTML = all_strings["privacy"]["description6"];
    document.getElementById("description7").innerHTML = all_strings["privacy"]["description7"];
    document.getElementById("description8").innerHTML = all_strings["privacy"]["description8"];
    document.getElementById("description9").innerHTML = all_strings["privacy"]["description9"];
    document.getElementById("description10").innerHTML = all_strings["privacy"]["description10"];
    document.getElementById("description11").innerHTML = all_strings["privacy"]["description11"];
    document.getElementById("description12").innerHTML = all_strings["privacy"]["description12"];
    document.getElementById("description13").innerHTML = all_strings["privacy"]["description13"];
    document.getElementById("footer-message").innerHTML = all_strings["privacy"]["footer-message"];
    document.getElementById("footer-message2").innerHTML = all_strings["privacy"]["footer-message2"];
    document.getElementById("privacy-policy-already-accepted").innerHTML = all_strings["privacy"]["you-have-already-accepted"];
    document.getElementById("uninstall-button").innerHTML = all_strings["privacy"]["i-dont-want-to-use-notefox-anymore-button"];
    document.getElementById("continue-button").innerHTML = all_strings["privacy"]["continue-to-use-notefox-button"];
}

function uninstall() {
    if (confirm("Notefox will be uninstalled, are you sure?")) {
        chrome.management.uninstallSelf();
    } else {
        // Do nothing
    }
}

function continueNotefox() {
    chrome.storage.sync.get("privacy").then(result => {
        //console.log(">> Installation", result)
        if (result.privacy === undefined) {
            chrome.storage.sync.set({
                "privacy": {
                    "date": getDate(),
                    "version": chrome.runtime.getManifest().version
                }
            }).then(
                () => {
                    chrome.storage.sync.get("installation").then(result => {
                        if (result.installation === undefined) {
                            chrome.storage.sync.set({
                                "installation": {
                                    "date": getDate(),
                                    "version": chrome.runtime.getManifest().version
                                }
                            });

                            //first launch -> open 'first launch' page
                            chrome.tabs.create({url: linkFirstLaunch});
                        }

                        window.close();
                    });
                }
            )
        }
    });
}

function getDate() {
    let todayDate = new Date();
    let today = "";
    today = todayDate.getFullYear() + "-";
    let month = todayDate.getMonth() + 1;
    if (month < 10) today = today + "0" + month + "-"; else today = today + "" + month + "-";
    let day = todayDate.getDate();
    if (day < 10) today = today + "0" + day + " "; else today = today + "" + day + " ";
    let hour = todayDate.getHours();
    if (hour < 10) today = today + "0" + hour + ":"; else today = today + "" + hour + ":"
    let minute = todayDate.getMinutes();
    if (minute < 10) today = today + "0" + minute + ":"; else today = today + "" + minute + ":"
    let second = todayDate.getSeconds();
    if (second < 10) today = today + "0" + second; else today = today + "" + second

    return today;
}