const linkFirstLaunch = "https://notefox.eu/help/first-run";

window.onload = function () {
    initConsent();
};

function initConsent() {
    const telemetryCheckbox = document.getElementById("telemetry-consent");
    const errorlogsCheckbox = document.getElementById("errorlogs-consent");
    const continueBtn = document.getElementById("continue-button");
    const uninstallBtn = document.getElementById("uninstall-button");

    // Get state from of the checkboxes
    Promise.all([(typeof browser !== 'undefined' ? browser : chrome).storage.local.get("settings"), hasNotefoxServerPermission()]).then(([data, granted]) => {
        const settings = data.settings || {};
        // Without the access to the Notefox servers nothing is sent, so they are shown as disabled
        telemetryCheckbox.checked = granted && (settings["send-telemetry"] || false);
        errorlogsCheckbox.checked = granted && (settings["sending-error-logs-automatically"] || false);
    });

    // Save state on change (the access to the Notefox servers is requested only when it's enabled)
    telemetryCheckbox.addEventListener("change", () => {
        (telemetryCheckbox.checked ? requestNotefoxServerPermission() : Promise.resolve(true)).then(granted => {
            if (!granted) telemetryCheckbox.checked = false;
            (typeof browser !== 'undefined' ? browser : chrome).storage.local.get("settings").then(data => {
                const settings = data.settings || {};
                settings["send-telemetry"] = telemetryCheckbox.checked;
                (typeof browser !== 'undefined' ? browser : chrome).storage.local.set({settings});
            });
        });
    });

    errorlogsCheckbox.addEventListener("change", () => {
        (errorlogsCheckbox.checked ? requestNotefoxServerPermission() : Promise.resolve(true)).then(granted => {
            if (!granted) errorlogsCheckbox.checked = false;
            (typeof browser !== 'undefined' ? browser : chrome).storage.local.get("settings").then(data => {
                const settings = data.settings || {};
                settings["sending-error-logs-automatically"] = errorlogsCheckbox.checked;
                (typeof browser !== 'undefined' ? browser : chrome).storage.local.set({settings});
            });
        });
    });

    // Toggle sections
    document.getElementById("telemetry-header").addEventListener("click", () => toggleSection("telemetry-details", "telemetry-header"));
    document.getElementById("errorlogs-header").addEventListener("click", () => toggleSection("errorlogs-details", "errorlogs-header"));

    // Button actions
    continueBtn.onclick = continueNotefox;
    uninstallBtn.onclick = uninstall;

    // Check if privacy was already accepted
    (typeof browser !== 'undefined' ? browser : chrome).storage.sync.get("privacy").then(result => {
        if (result.privacy !== undefined) {
            continueBtn.disabled = false;
            uninstallBtn.disabled = true;
        }
    });
}

/**
 * The access to the Notefox servers is an optional permission: it's requested only when it's needed.
 * NB: it must be called directly by a user action (e.g. onchange), otherwise Firefox rejects the request
 * @returns {Promise<boolean>} - true if the permission is granted
 */
function requestNotefoxServerPermission() {
    try {
        return (typeof browser !== 'undefined' ? browser : chrome).permissions.request({origins: ["https://*.notefox.eu/*"]}).catch(() => false);
    } catch (e) {
        console.error("P-privacy)) " + e);
        return Promise.resolve(false);
    }
}

function hasNotefoxServerPermission() {
    return (typeof browser !== 'undefined' ? browser : chrome).permissions.contains({origins: ["https://*.notefox.eu/*"]}).catch(() => false);
}

function toggleSection(sectionId, headerId) {
    const section = document.getElementById(sectionId);
    const header = document.getElementById(headerId);
    const isShown = section.classList.toggle("show");
    header.classList.toggle("active", isShown);
}

function uninstall() {
    if (confirm("Notefox will be uninstalled, are you sure?")) {
        (typeof browser !== 'undefined' ? browser : chrome).management.uninstallSelf();
    }
}

function continueNotefox() {
    (typeof browser !== 'undefined' ? browser : chrome).storage.sync.get("privacy").then(result => {
        if (result.privacy === undefined) {
            (typeof browser !== 'undefined' ? browser : chrome).storage.sync.set({
                "privacy": {
                    date: getDate(),
                    version: (typeof browser !== 'undefined' ? browser : chrome).runtime.getManifest().version
                }
            }).then(() => {
                (typeof browser !== 'undefined' ? browser : chrome).storage.sync.get("installation").then(result => {
                    if (result.installation === undefined) {
                        (typeof browser !== 'undefined' ? browser : chrome).storage.sync.set({
                            "installation": {
                                date: getDate(),
                                version: (typeof browser !== 'undefined' ? browser : chrome).runtime.getManifest().version
                            }
                        });
                        // Open first launch page
                        (typeof browser !== 'undefined' ? browser : chrome).tabs.create({url: linkFirstLaunch});
                    }
                    window.close();
                });
            });
        } else {
            // privacy already accepted, just close
            window.close();
        }
    });
}

function getDate() {
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}