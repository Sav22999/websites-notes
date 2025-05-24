const linkFirstLaunch = "https://notefox.eu/help/first-run"

window.onload = function () {
    loaded()
}

function loaded() {
    browser.storage.sync.get("privacy").then(result => {
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
}

function uninstall() {
    if (confirm("Notefox will be uninstalled, are you sure?")) {
        browser.management.uninstallSelf();
    } else {
        // Do nothing
    }
}

function continueNotefox() {
    browser.storage.sync.get("privacy").then(result => {
        //console.log(">> Installation", result)
        if (result.privacy === undefined) {
            browser.storage.sync.set({
                "privacy": {
                    "date": getDate(),
                    "version": browser.runtime.getManifest().version
                }
            }).then(
                () => {
                    browser.storage.sync.get("installation").then(result => {
                        if (result.installation === undefined) {
                            browser.storage.sync.set({
                                "installation": {
                                    "date": getDate(),
                                    "version": browser.runtime.getManifest().version
                                }
                            });

                            //first launch -> open 'first launch' page
                            browser.tabs.create({url: linkFirstLaunch});
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