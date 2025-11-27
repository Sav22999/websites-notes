var lang = "";

var strings = []; //strings[language_code] = {};

//TODO!manually: add new languages here
const supportedLanguages = [
    "en",
    "it",
    "ar",
    "zh-cn",
    "zh-tw",
    "cs",
    "da",
    "nl",
    "fi",
    "fr",
    "de",
    "el",
    "ja",
    "pl",
    "pt-pt",
    "pt-br",
    "ro",
    "ru",
    "es",
    "sv-SE",
    "uk",
    "ia",
];

//TODO!manually: add new fonts here
const supportedFontFamily = [
    "Open Sans",
    "Shantell Sans",
    "Inter",
    "Lora",
    "Noto Sans",
    "Noto Serif",
    "Roboto",
    "Merienda",
    "Playfair Display",
    "Victor Mono",
    "Source Code Pro",
];

//TODO!manually: add new datetime formats here
const supportedDatetimeFormat = [
    "yyyymmdd1",
    "yyyyddmm1",
    "ddmmyyyy1",
    "ddmmyyyy2",
    "ddmmyyyy1-12h",
    "mmddyyyy1",
];

const supportedTextSize = ["extra-small", "small", "standard", "large", "extra-large"];
const textSizeValues = {
    "extra-small": "0.7em",
    "small": "0.85em",
    "standard": "1em",
    "large": "1.5em",
    "extra-large": "2em",
}

const webBrowserUsed = "firefox"; //TODO:change manually
let languageToUse = browser.i18n.getUILanguage().toString();
if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";
if (supportedLanguages.includes(languageToUse.split("-")[0]))
    languageToUse = languageToUse.split("-")[0];

let links = {
    donate: "https://liberapay.com/Sav22999",
    telegram: "https://t.me/sav_projects/7",
    support_telegram: "https://t.me/sav_projects/7",
    support_email: "mailto:saverio.morelli@protonmail.com",
    support_github: "https://github.com/Sav22999/websites-notes/issues",
    translate: "https://crowdin.com/project/notefox",
    review: "https://addons.mozilla.org/firefox/addon/websites-notes/",
    "help-search": "https://www.notefox.eu/help/search/",
    privacy: "https://www.notefox.eu/privacy/",
    terms: "https://www.notefox.eu/terms/",
};

const links_aside_bar = {
    "all-notes": "../all-notes/index.html",
    settings: "../settings/index.html",
    help: "https://www.notefox.eu/help/",
    review: "https://www.notefox.eu/install/",
    website: "https://www.notefox.eu",
    donate: "https://www.notefox.eu/donate/",
    translate: "https://crowdin.com/project/notefox",
};

var currentOS = "default"; //default: win, linux, ecc. | mac

/**
 * Recursive function to get the sanitized html code from an unsafe one
 * @param element the element to sanitize
 * @param allowedTags
 * @param allowedAttributes
 * @returns {*}
 */
function sanitize(element, allowedTags = -1, allowedAttributes = -1) {
    if (allowedTags === -1)
        allowedTags = [
            "b",
            "i",
            "u",
            "a",
            "strike",
            "code",
            "span",
            "div",
            "img",
            "br",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "p",
            "small",
            "big",
            "em",
            "strong",
            "s",
            "sub",
            "sup",
            "blockquote",
            "q",
            "mark",
        ];
    if (allowedAttributes === -1)
        allowedAttributes = ["src", "alt", "title", "cite", "href"];

    let sanitizedHTML = element;

    for (var i = sanitizedHTML.childNodes.length - 1; i >= 0; i--) {
        var node = sanitize(
            sanitizedHTML.childNodes[i],
            allowedTags,
            allowedAttributes
        );

        //console.log(node.nodeType + " : " + node.tagName);

        if (node.nodeType === Node.ELEMENT_NODE) {
            if (allowedTags.includes(node.tagName.toLowerCase())) {
                // Remove attributes unsupported of allowedTags
                //console.log(`Checking tag ... ${node.tagName}`)
                let attributes_to_remove = [];
                for (var j = 0; j < node.attributes.length; j++) {
                    var attribute = node.attributes[j];
                    if (!allowedAttributes.includes(attribute.name.toLowerCase())) {
                        //console.log(`Removing attribute ... ${attribute.name} from ${node.tagName}`)
                        //element.removeAttribute(attribute.name);
                        attributes_to_remove.push(attribute.name);
                    } else {
                        //console.log(`OK attribute ${attribute.name} from ${node.tagName}`)
                    }
                }
                attributes_to_remove.forEach((attribute) => {
                    node.removeAttribute(attribute);
                });
            } else {
                // Remove unsupported tags
                //console.log(`Removing tag ... ${node.tagName}`)
                //console.log(node.innerHTML)
                let tmpNode = document.createElement("span");
                if (node.innerHTML !== undefined) tmpNode.innerHTML = node.innerHTML;
                else if (node.value !== undefined) tmpNode.innerHTML = node.value;
                else tmpNode.innerText = "";
                node.replaceWith(tmpNode);
                //sanitizedHTML.remove(nod);
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            //console.log("Text supported")
            // Text nodes are allowed and can be kept
        } else {
            //console.log("????")
        }
    }
    return sanitizedHTML;
}

function bold() {
    //console.log("Bold B")
    document.execCommand("bold", false);
    addAction();
}

function italic() {
    //console.log("Italic I")
    document.execCommand("italic", false);
    addAction();
}

function underline() {
    //console.log("Underline U")
    document.execCommand("underline", false);
    addAction();
}

function strikethrough() {
    //console.log("Strikethrough S")
    document.execCommand("strikethrough", false);
    addAction();
}

function subscript() {
    //console.log("Subscript")
    document.execCommand("subscript", false);
    addAction();
}

function superscript() {
    //console.log("Superscript")
    document.execCommand("superscript", false);
    addAction();
}

function hightlighter() {
    insertHTMLFromTagName("mark");
    addAction();
}

function insertCode() {
    insertHTMLFromTagName("code");
    addAction();
}

function insertHeader(header_size = "h1") {
    insertHTMLFromTagName(header_size);
    addAction();
}

function small() {
    insertHTMLFromTagName("small");
    addAction();
}

function big() {
    insertHTMLFromTagName("big");
    addAction();
}

function clearFormatting() {
    document.execCommand("removeFormat", false);
    addAction();
}

function insertHTMLFromTagName(tagName, properties = "") {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    let isTagName = hasAncestorTagName(window.getSelection().anchorNode, tagName);

    if (isTagName) {
        let elements = getTheAncestorTagName(
            window.getSelection().anchorNode,
            tagName
        );
        let anchorElement = elements[0];
        let parentAnchor = elements[1];

        if (anchorElement && parentAnchor) {
            // Move children of the anchor element to its parent
            while (anchorElement.firstChild) {
                parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
            }
            // Remove the anchor element itself
            parentAnchor.removeChild(anchorElement);
        }
        saveNotes();
    } else {
        let openTag = "<" + tagName + " " + properties + ">";
        let closeTag = "</" + tagName + ">";
        //let html = "<" + tagName + ">" + selectedText + "</" + tagName + ">";
        //document.execCommand("insertHTML", false, html);
        document.execCommand("insertHTML", false, openTag);
        document.execCommand("insertText", false, selectedText);
        document.execCommand("insertHTML", false, closeTag);

    }
}

function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== "Control") {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    insertHTMLFromTagName("a", selectedText);
    addAction();
}

/*function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    if (selectedText !== "") {
        // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
        let isLink = hasAncestorTagName(window.getSelection().anchorNode, 'a');

        // If it's already a link, remove the link; otherwise, add the link
        if (isLink) {
            // Remove the link
            let elements = getTheAncestorTagName(window.getSelection().anchorNode, 'a');
            let anchorElement = elements[0];
            let parentAnchor = elements[1];

            if (anchorElement && parentAnchor) {
                // Move children of the anchor element to its parent
                while (anchorElement.firstChild) {
                    parentAnchor.insertBefore(anchorElement.firstChild, anchorElement);
                }
                // Remove the anchor element itself
                parentAnchor.removeChild(anchorElement);
            }
            saveNotes();
        } else {
            //let url = prompt("Enter the URL:");
            //if (url) {
            //    document.execCommand('createLink', false, url);
            //}
            let section = document.getElementById("link-section");
            let background = document.getElementById("background-opacity");
            let linkUrl = "";
            if (isValidURL(selectedText)) linkUrl = selectedText;

            section.style.display = "block";
            background.style.display = "block";

            let linkText = document.getElementById("link-text");
            linkText.innerHTML = all_strings["insert-link-text"];
            let linkInput = document.getElementById("link-url-text");
            linkInput.value = linkUrl;
            linkInput.placeholder = all_strings["insert-link-placeholder"];
            let linkButton = document.getElementById("link-button");
            linkButton.value = all_strings["insert-link-button"];
            linkButton.onclick = function () {
                section.style.display = "none";
                background.style.display = "none";
                document.execCommand('createLink', false, linkInput.value);
            }
            let linkButtonClose = document.getElementById("link-cancel-button");
            linkButtonClose.value = all_strings["cancel-link-button"];
            linkButtonClose.onclick = function () {
                section.style.display = "none";
                background.style.display = "none";
            }

            setTimeout(() => {
                linkInput.focus()
            }, 100);
        }
        addAction();
    }
    //}
}*/

function hasAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return true; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return false; // Reached the top of the DOM tree without finding an anchor element
}

function getTheAncestorTagName(element, tagName) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === tagName) {
            return [element, element.parentNode]; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return [false, false]; // Reached the top of the DOM tree without finding an anchor element
}

function isValidURL(url) {
    var urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return urlPattern.test(url);
}

function undo() {
    hideTabSubDomains();
    if (actions.length > 0 && currentAction > 0) {
        undoAction = true;
        document.getElementById("notes").innerHTML = actions[--currentAction].text;
        saveNotes();
        setPosition(
            document.getElementById("notes"),
            actions[currentAction].position
        );
    }
    document.getElementById("notes").focus();
}

function redo() {
    hideTabSubDomains();
    if (currentAction < actions.length - 1) {
        undoAction = false;
        document.getElementById("notes").innerHTML = actions[++currentAction].text;
        saveNotes();
        setPosition(
            document.getElementById("notes"),
            actions[currentAction].position
        );
    }
    document.getElementById("notes").focus();
}

function spellcheck(force = false, value = false) {
    hideTabSubDomains();
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined)
                settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined)
                settings_json["consider-parameters"] = true;
            if (settings_json["consider-sections"] === undefined)
                settings_json["consider-sections"] = true;

            if (settings_json["advanced-managing"] === undefined)
                settings_json["advanced-managing"] = true;
            if (
                settings_json["advanced-managing"] === "yes" ||
                settings_json["advanced-managing"] === true
            )
                advanced_managing = true;
            else advanced_managing = false;

            if (settings_json["html-text-formatting"] === undefined)
                settings_json["html-text-formatting"] = true;
            if (settings_json["disable-word-wrap"] === undefined)
                settings_json["disable-word-wrap"] = false;
            if (settings_json["spellcheck-detection"] === undefined)
                settings_json["spellcheck-detection"] = false;
        }

        if (!document.getElementById("notes").spellcheck || (force && value)) {
            //enable spellCheck
            document.getElementById("notes").spellcheck = true;
            settings_json["spellcheck-detection"] = true;
            if (document.getElementById("text-spellcheck")) {
                document
                    .getElementById("text-spellcheck")
                    .classList.add("text-spellcheck-sel");
            }
        } else {
            //disable spellCheck
            document.getElementById("notes").spellcheck = false;
            settings_json["spellcheck-detection"] = false;
            if (
                document.getElementById("text-spellcheck") &&
                document
                    .getElementById("text-spellcheck")
                    .classList.contains("text-spellcheck-sel")
            ) {
                document
                    .getElementById("text-spellcheck")
                    .classList.remove("text-spellcheck-sel");
            }
        }
        document.getElementById("notes").focus();
        //console.log("QAZ-11")
        sync_local
            .set({settings: settings_json, "last-update": getDate()})
            .then(() => {
                sendMessageUpdateToBackground();
            });
    });
}

/**
 * Load the current theme for the page
 */
function checkTheme(
    set_theme = true,
    theme = "",
    function_to_execute = function (params) {
    }
) {
    //before to set theme -> check if "Follow theme system" is enabled, otherwise use the default orange theme

    let force_theme = theme; //TODO!TESTING this is used only for test, after testing set to "" (empty) -- {"light", "dark", "auto"}

    sync_local.get("settings").then((result) => {
        let background;
        let backgroundSection;
        let primary;
        let secondary;
        let on_primary;
        let on_secondary;
        let textbox_background;
        let textbox_color;

        let default_theme = false;

        if (
            force_theme !== "" ||
            (result !== undefined &&
                result["settings"] !== undefined &&
                result["settings"]["theme"] !== undefined)
        ) {
            if (
                force_theme === "auto" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] &&
                    result["settings"]["theme"] === "auto")
            ) {
                browser.theme.getCurrent().then((theme) => {
                    //console.log(JSON.stringify(theme));
                    if (
                        theme !== undefined &&
                        theme["colors"] !== undefined &&
                        theme["colors"] !== null
                    ) {
                        background = theme.colors.frame;
                        backgroundSection = theme.colors.toolbar;
                        primary = theme.colors.toolbar_text;
                        secondary = theme.colors.toolbar_field;
                        on_primary = theme.colors.toolbar;
                        on_secondary = theme.colors.toolbar_field_text;
                        textbox_background = theme.colors.toolbar_field;
                        textbox_color = theme.colors.toolbar_field_text;

                        if (
                            background === undefined ||
                            backgroundSection === undefined ||
                            primary === undefined ||
                            secondary === undefined ||
                            on_primary === undefined ||
                            on_secondary === undefined ||
                            textbox_background === undefined ||
                            textbox_color === undefined
                        ) {
                            default_theme = true;
                        } else {
                            if (set_theme)
                                setTheme(
                                    background,
                                    backgroundSection,
                                    primary,
                                    secondary,
                                    on_primary,
                                    on_secondary,
                                    textbox_background,
                                    textbox_color
                                );
                            else
                                function_to_execute([
                                    background,
                                    backgroundSection,
                                    primary,
                                    secondary,
                                    on_primary,
                                    on_secondary,
                                    textbox_background,
                                    textbox_color,
                                ]);
                        }
                    } else {
                        default_theme = true;
                    }
                });
            } else if (
                force_theme === "dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "dark")
            ) {
                //use the dark theme
                background = "#000000";
                backgroundSection = "#222222";
                primary = "#ffa56f";
                secondary = "#ffd8be";
                on_primary = "#222222";
                on_secondary = "#444444";
                textbox_background = "#000000";
                textbox_color = "#ffa56f";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            } else if (
                force_theme === "lighter" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "lighter")
            ) {
                //use the lighter theme
                background = "#FFFFFF";
                backgroundSection = "#EEEEEE";
                primary = "#333333";
                secondary = "#666666";
                on_primary = "#FFFFFF";
                on_secondary = "#FFFFFF";
                textbox_background = "#ffffff";
                textbox_color = "#333333";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            } else if (
                force_theme === "darker" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "darker")
            ) {
                //use the darker theme
                background = "#000000";
                backgroundSection = "#222222";
                primary = "#ffffff";
                secondary = "#dddddd";
                on_primary = "#222222";
                on_secondary = "#444444";
                textbox_background = "#000000";
                textbox_color = "#ffffff";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Blue Theme (Light Mode)
            else if (
                force_theme === "blue-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "blue-light")
            ) {
                //use the blue light theme
                background = "#FFFFFF";
                backgroundSection = "#F1F5F9";
                primary = "#3B82F6";
                secondary = "#E2E8F0";
                on_primary = "#FFFFFF";
                on_secondary = "#475569";
                textbox_background = "#FFFFFF";
                textbox_color = "#3B82F6";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Blue Theme (Dark Mode)
            else if (
                force_theme === "blue-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "blue-dark")
            ) {
                //use the blue dark theme
                background = "#0f172a";
                backgroundSection = "#1e293b";
                primary = "#3b82f6";
                secondary = "#64748b";
                on_primary = "#ffffff";
                on_secondary = "#f1f5f9";
                textbox_background = "#334155";
                textbox_color = "#f8fafc";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Lavender Theme (Light Mode)
            else if (
                force_theme === "lavender-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "lavender-light")
            ) {
                //use the lavender light theme
                background = "#FFFFFF";
                backgroundSection = "#F8F6FF";
                primary = "#7B68EE";
                secondary = "#E6E6FA";
                on_primary = "#FFFFFF";
                on_secondary = "#4B0082";
                textbox_background = "#FFFFFF";
                textbox_color = "#7B68EE";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Lavender Theme (Dark Mode)
            else if (
                force_theme === "lavender-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "lavender-dark")
            ) {
                //use the lavender dark theme
                background = "#1a0f1f";
                backgroundSection = "#2d1b3d";
                primary = "#8b7cf6";
                secondary = "#6b5b95";
                on_primary = "#ffffff";
                on_secondary = "#e8e5f3";
                textbox_background = "#4c3d5a";
                textbox_color = "#f3f1f7";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Retro Pink Theme (Light Mode)
            else if (
                force_theme === "retro-pink-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "retro-pink-light")
            ) {
                //use the retro pink light theme
                background = "#FFFFFF";
                backgroundSection = "#FDF2F8";
                primary = "#BE185D";
                secondary = "#F9A8D4";
                on_primary = "#FFFFFF";
                on_secondary = "#831843";
                textbox_background = "#FFFFFF";
                textbox_color = "#BE185D";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Retro Pink Theme (Dark Mode)
            else if (
                force_theme === "retro-pink-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "retro-pink-dark")
            ) {
                //use the retro pink dark theme
                background = "#1a0a14";
                backgroundSection = "#2d1b26";
                primary = "#ec4899";
                secondary = "#7c2d5a";
                on_primary = "#ffffff";
                on_secondary = "#fce7f3";
                textbox_background = "#4a2c3a";
                textbox_color = "#fdf2f8";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Matcha Theme (Light Mode)
            else if (
                force_theme === "matcha-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "matcha-light")
            ) {
                //use the matcha light theme
                background = "#FFFFFF";
                backgroundSection = "#F8FCF6";
                primary = "#4A7C59";
                secondary = "#E8F5E8";
                on_primary = "#FFFFFF";
                on_secondary = "#2D5016";
                textbox_background = "#FFFFFF";
                textbox_color = "#4A7C59";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Matcha Theme (Dark Mode)
            else if (
                force_theme === "matcha-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "matcha-dark")
            ) {
                //use the matcha dark theme
                background = "#0d1510";
                backgroundSection = "#1a2e20";
                primary = "#7cb342";
                secondary = "#5a6b4a";
                on_primary = "#ffffff";
                on_secondary = "#e8f0e4";
                textbox_background = "#334238";
                textbox_color = "#f0f4e8";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Forest Theme (Light Mode)
            else if (
                force_theme === "forest-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "forest-light")
            ) {
                //use the forest light theme
                background = "#FFFFFF";
                backgroundSection = "#F0FDF4";
                primary = "#166534";
                secondary = "#BBEFCD";
                on_primary = "#FFFFFF";
                on_secondary = "#14532D";
                textbox_background = "#FFFFFF";
                textbox_color = "#166534";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Forest Theme (Dark Mode)
            else if (
                force_theme === "forest-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "forest-dark")
            ) {
                //use the forest dark theme
                background = "#0a0f0a";
                backgroundSection = "#1a2518";
                primary = "#22c55e";
                secondary = "#4a5c47";
                on_primary = "#ffffff";
                on_secondary = "#dcfce7";
                textbox_background = "#2d3f2a";
                textbox_color = "#f0fdf4";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Retro Teal Theme (Light Mode)
            else if (
                force_theme === "retro-teal-light" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "retro-teal-light")
            ) {
                //use the retro teal light theme
                background = "#FFFFFF";
                backgroundSection = "#F0FDFA";
                primary = "#0F766E";
                secondary = "#99F6E4";
                on_primary = "#FFFFFF";
                on_secondary = "#134E4A";
                textbox_background = "#FFFFFF";
                textbox_color = "#0F766E";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            }

            // Retro Teal Theme (Dark Mode)
            else if (
                force_theme === "retro-teal-dark" ||
                (result["settings"] !== undefined &&
                    result["settings"]["theme"] !== undefined &&
                    result["settings"]["theme"] === "retro-teal-dark")
            ) {
                //use the retro teal dark theme
                background = "#0a1514";
                backgroundSection = "#1b2e2a";
                primary = "#14b8a6";
                secondary = "#4a6662";
                on_primary = "#ffffff";
                on_secondary = "#f0fdfa";
                textbox_background = "#2d4742";
                textbox_color = "#ccfbf1";
                if (set_theme)
                    setTheme(
                        background,
                        backgroundSection,
                        primary,
                        secondary,
                        on_primary,
                        on_secondary,
                        textbox_background,
                        textbox_color
                    );
                else function_to_execute();
            } else {
                //use the default one if: undefined, light or other value (probably wrong)
                default_theme = true;
            }
        } else {
            default_theme = true;
        }

        if (default_theme) {
            //use the default one
            background = "#FFFFFF";
            backgroundSection = "#EEEEEE";
            primary = "#FF6200";
            secondary = "#FFB788";
            on_primary = "#FFFFFF";
            on_secondary = "#FFFFFF";
            textbox_background = "#ffffff";
            textbox_color = "#FF6200";
            if (set_theme)
                setTheme(
                    background,
                    backgroundSection,
                    primary,
                    secondary,
                    on_primary,
                    on_secondary,
                    textbox_background,
                    textbox_color
                );
            else function_to_execute();
        }
    });
}

/**
 * Get svg images
 * @param icon what image you want (i.e. donate, save, settings, etc.)
 * @param color what color use for the svg image
 * @returns {string} returns the svg image specified
 */
function getIconSvgEncoded(icon, color) {
    let svgToReturn = "";
    switch (icon) {
        case "donate":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,99.9996,105.353)">' +
                '        <path fill="' + color + '" d="M16.5,13.287C18.162,11.463 20.072,11.768 21.147,13.02C21.673,13.632 22,14.471 22,15.4C22,18.224 19.789,19.73 18.171,21.077C17.6,21.552 17.05,22 16.5,22C15.95,22 15.4,21.552 14.829,21.077C14.69,20.961 14.547,20.845 14.402,20.726L14.358,20.691C12.814,19.434 11,17.958 11,15.4C11,12.575 14.025,10.571 16.5,13.287ZM8.106,18.247C5.298,16.083 2,13.542 2,9.137C2,4.274 7.5,0.825 12,5.501C16.5,0.825 22,4.274 22,9.137C22,9.971 21.882,10.738 21.671,11.448C20.952,10.87 20.051,10.506 19.052,10.5C18.162,10.495 17.294,10.775 16.499,11.31C15.11,10.377 13.543,10.252 12.17,10.915C10.534,11.704 9.5,13.471 9.5,15.399C9.5,17.705 10.648,19.322 11.841,20.494C10.894,20.418 9.945,19.686 8.962,18.911C8.685,18.693 8.398,18.472 8.106,18.247Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "settings":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,104.167,100)">' +
                '        <path fill="' + color + '" d="M14.279,2.152C13.909,2 13.439,2 12.5,2C11.561,2 11.092,2 10.721,2.152C10.227,2.355 9.835,2.745 9.631,3.235C9.537,3.458 9.501,3.719 9.486,4.098C9.465,4.656 9.177,5.172 8.69,5.451C8.203,5.73 7.609,5.72 7.111,5.459C6.773,5.281 6.528,5.183 6.286,5.151C5.756,5.082 5.22,5.224 4.796,5.547C4.478,5.789 4.243,6.193 3.774,7C3.304,7.807 3.07,8.21 3.017,8.605C2.948,9.131 3.091,9.663 3.417,10.084C3.565,10.276 3.774,10.437 4.098,10.639C4.574,10.936 4.88,11.442 4.88,12C4.88,12.558 4.574,13.064 4.098,13.361C3.774,13.563 3.565,13.724 3.416,13.917C3.091,14.337 2.947,14.869 3.017,15.395C3.07,15.789 3.304,16.193 3.774,17C4.243,17.807 4.478,18.211 4.796,18.453C5.22,18.776 5.756,18.918 6.286,18.849C6.528,18.817 6.773,18.719 7.111,18.541C7.609,18.28 8.203,18.27 8.69,18.549C9.177,18.828 9.465,19.344 9.486,19.902C9.501,20.282 9.537,20.542 9.631,20.765C9.835,21.255 10.227,21.645 10.721,21.848C11.092,22 11.561,22 12.5,22C13.439,22 13.909,22 14.279,21.848C14.773,21.645 15.165,21.255 15.369,20.765C15.463,20.542 15.499,20.282 15.514,19.902C15.535,19.344 15.823,18.828 16.31,18.549C16.797,18.27 17.391,18.28 17.889,18.541C18.227,18.719 18.472,18.817 18.714,18.849C19.244,18.918 19.78,18.776 20.204,18.453C20.522,18.211 20.757,17.807 21.226,17C21.696,16.193 21.93,15.789 21.983,15.395C22.052,14.869 21.909,14.337 21.583,13.916C21.435,13.724 21.226,13.563 20.902,13.361C20.426,13.064 20.12,12.558 20.12,12C20.12,11.442 20.426,10.936 20.902,10.639C21.226,10.437 21.435,10.276 21.584,10.084C21.909,9.663 22.052,9.131 21.983,8.605C21.93,8.211 21.696,7.807 21.226,7C20.757,6.193 20.522,5.789 20.204,5.547C19.78,5.224 19.244,5.082 18.714,5.151C18.472,5.183 18.227,5.281 17.889,5.459C17.392,5.72 16.797,5.73 16.31,5.451C15.823,5.172 15.535,4.656 15.514,4.098C15.499,3.718 15.463,3.458 15.369,3.235C15.165,2.745 14.773,2.355 14.279,2.152ZM12.5,15C14.169,15 15.523,13.657 15.523,12C15.523,10.343 14.169,9 12.5,9C10.831,9 9.477,10.343 9.477,12C9.477,13.657 10.83,15 12.5,15Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "import":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.750001,0,0,0.750001,102.083,99.9997)">' +
                '        <path fill="' + color + '" d="M650,500L650,666.667C650,703.333 620,733.333 583.333,733.333L183.333,733.333C146.667,733.333 116.667,703.333 116.667,666.667L116.667,133.333C116.667,96.667 146.667,66.667 183.333,66.667L583.333,66.667C620,66.667 650,96.667 650,133.333L650,300L450,300L450,142.608L143.991,400L450,657.392L450,500L650,500ZM400,450L400,550L221.667,400L400,250L400,350L700,350L700,450L400,450Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "export":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.750001,0,0,0.750001,103.541,99.9997)">' +
                '        <path fill="' + color + '" d="M650,517.205L650,666.667C650,703.333 620,733.333 583.333,733.333L183.333,733.333C146.667,733.333 116.667,703.333 116.667,666.667L116.667,133.333C116.667,96.667 146.667,66.667 183.333,66.667L583.333,66.667C620,66.667 650,96.667 650,133.333L650,282.795L483.333,142.609L483.333,300L183.333,300L183.333,500L483.333,500L483.333,657.391L650,517.205ZM533.333,450L233.333,450L233.333,350L533.333,350L533.333,250L711.667,400L533.333,550L533.333,450Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "delete":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(30.4878,0,0,30.4878,156.097,156.097)">' +
                '        <path fill="' + color + '" d="M14.2,14C14.2,15.207 13.207,16.2 12,16.2L4,16.2C2.793,16.2 1.8,15.207 1.8,14L1.8,2C1.8,0.793 2.793,-0.2 4,-0.2L9.5,-0.2C9.553,-0.2 9.604,-0.179 9.641,-0.141L14.141,4.359C14.179,4.396 14.2,4.447 14.2,4.5L14.2,14ZM9.3,3L9.3,1.2L4,1.2C3.561,1.2 3.2,1.561 3.2,2L3.2,14C3.2,14.439 3.561,14.8 4,14.8L12,14.8C12.439,14.8 12.8,14.439 12.8,14L12.8,4.7L11,4.7C10.067,4.7 9.3,3.933 9.3,3ZM8,8.01L9.005,7.005C9.136,6.873 9.314,6.799 9.5,6.799C9.884,6.799 10.201,7.116 10.201,7.5C10.201,7.686 10.127,7.864 9.995,7.995L8.99,9L9.995,10.005C10.127,10.136 10.201,10.314 10.201,10.5C10.201,10.884 9.884,11.201 9.5,11.201C9.314,11.201 9.136,11.127 9.005,10.995L8,9.99L6.995,10.995C6.864,11.127 6.686,11.201 6.5,11.201C6.116,11.201 5.799,10.884 5.799,10.5C5.799,10.314 5.873,10.136 6.005,10.005L7.01,9L6.005,7.995C5.873,7.864 5.799,7.686 5.799,7.5C5.799,7.116 6.116,6.799 6.5,6.799C6.686,6.799 6.864,6.873 6.995,7.005L8,8.01Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "delete2":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,99.9996,99.9996)">' +
                '        <path fill="' + color + '" d="M6.871,19.499C7.801,20 8.915,20 11.142,20L13.779,20C17.654,20 19.592,20 20.796,18.828C22,17.657 22,15.771 22,12C22,8.229 22,6.343 20.796,5.172C19.592,4 17.654,4 13.779,4L11.142,4C8.915,4 7.801,4 6.871,4.501C5.941,5.003 5.351,5.922 4.171,7.76L3.49,8.82C2.497,10.366 2,11.14 2,12C2,12.86 2.497,13.634 3.49,15.18L4.171,16.24C5.351,18.078 5.941,18.997 6.871,19.499ZM11.03,8.97C10.737,8.677 10.263,8.677 9.97,8.97C9.677,9.263 9.677,9.737 9.97,10.03L11.939,12L9.97,13.97C9.677,14.263 9.677,14.737 9.97,15.03C10.263,15.323 10.737,15.323 11.03,15.03L13,13.061L14.97,15.03C15.262,15.323 15.737,15.323 16.03,15.03C16.323,14.737 16.323,14.262 16.03,13.97L14.061,12L16.03,10.03C16.323,9.737 16.323,9.263 16.03,8.97C15.737,8.677 15.262,8.677 14.97,8.97L13,10.939L11.03,8.97Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "copy":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,99.9996,99.9996)">' +
                '        <path fill="' + color + '" d="M15.24,2C16.762,2 18.063,2.948 18.59,4.287C17.709,4.169 16.611,4.169 15.335,4.169L12.265,4.169C10.989,4.169 9.889,4.169 9.008,4.287C8.064,4.415 7.159,4.702 6.425,5.439C5.691,6.176 5.405,7.084 5.278,8.032C5.16,8.916 5.16,10.021 5.16,11.302L5.16,16.312C5.16,17.374 5.16,18.65 5.227,19.559C3.92,19.017 3,17.725 3,16.217L3,10.379C3,8.608 3,7.205 3.147,6.107C3.298,4.977 3.617,4.062 4.336,3.341C5.054,2.62 5.965,2.3 7.091,2.148C8.184,2 9.582,2 11.346,2L15.24,2ZM6.6,11.397C6.6,8.671 6.6,7.308 7.444,6.461C8.287,5.614 9.645,5.614 12.36,5.614L15.24,5.614C17.955,5.614 19.313,5.614 20.157,6.461C21,7.308 21,8.671 21,11.397L21,16.217C21,18.943 21,20.306 20.157,21.153C19.313,22 17.955,22 15.24,22L12.36,22C9.645,22 8.287,22 7.444,21.153C6.6,20.306 6.6,18.943 6.6,16.217L6.6,11.397Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "filter":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M19,3L5,3C3.586,3 2.879,3 2.439,3.412C2,3.824 2,4.488 2,5.815L2,6.504C2,7.542 2,8.061 2.26,8.491C2.519,8.922 2.993,9.189 3.942,9.723L6.855,11.362C7.491,11.721 7.81,11.9 8.038,12.098C8.512,12.51 8.804,12.994 8.936,13.587C9,13.872 9,14.206 9,14.873L9,17.542C9,18.452 9,18.907 9.252,19.261C9.504,19.616 9.951,19.791 10.846,20.141C12.725,20.875 13.664,21.242 14.332,20.824C15,20.407 15,19.452 15,17.542L15,14.873C15,14.206 15,13.872 15.064,13.587C15.196,12.994 15.488,12.51 15.962,12.098C16.19,11.9 16.508,11.721 17.145,11.362L20.058,9.723C21.007,9.189 21.481,8.922 21.74,8.491C22,8.061 22,7.542 22,6.504L22,5.815C22,4.488 22,3.824 21.561,3.412C21.121,3 20.414,3 19,3Z"' +
                '              style="fill-rule:nonzero;"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sort-by":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M3.464,20.536C4.929,22 7.286,22 12,22C16.714,22 19.071,22 20.536,20.536C22,19.071 22,16.714 22,12C22,7.286 22,4.929 20.536,3.464C19.071,2 16.714,2 12,2C7.286,2 4.929,2 3.464,3.464C2,4.929 2,7.286 2,12C2,16.714 2,19.071 3.464,20.536ZM14.75,16C14.75,16.414 14.414,16.75 14,16.75L10,16.75C9.586,16.75 9.25,16.414 9.25,16C9.25,15.586 9.586,15.25 10,15.25L14,15.25C14.414,15.25 14.75,15.586 14.75,16ZM16,12.75C16.414,12.75 16.75,12.414 16.75,12C16.75,11.586 16.414,11.25 16,11.25L8,11.25C7.586,11.25 7.25,11.586 7.25,12C7.25,12.414 7.586,12.75 8,12.75L16,12.75ZM18.75,8C18.75,8.414 18.414,8.75 18,8.75L6,8.75C5.586,8.75 5.25,8.414 5.25,8C5.25,7.586 5.586,7.25 6,7.25L18,7.25C18.414,7.25 18.75,7.586 18.75,8Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "tag":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M2.123,12.816C2.41,13.819 3.183,14.591 4.728,16.137L6.558,17.967C9.247,20.656 10.592,22 12.262,22C13.933,22 15.278,20.656 17.967,17.967C20.656,15.278 22,13.933 22,12.262C22,10.592 20.656,9.247 17.967,6.558L16.137,4.728C14.591,3.183 13.819,2.41 12.816,2.123C11.813,1.835 10.749,2.081 8.619,2.572L7.391,2.856C5.599,3.269 4.703,3.476 4.089,4.089C3.476,4.703 3.269,5.599 2.856,7.391L2.572,8.619C2.081,10.748 1.835,11.813 2.123,12.816ZM10.123,7.271C10.911,8.059 10.911,9.335 10.123,10.123C9.336,10.911 8.059,10.911 7.271,10.123C6.484,9.335 6.484,8.059 7.271,7.271C8.059,6.483 9.336,6.483 10.123,7.271ZM19.051,12.051L12.072,19.03C11.779,19.323 11.304,19.323 11.011,19.03C10.718,18.738 10.718,18.263 11.011,17.97L17.99,10.99C18.283,10.698 18.758,10.698 19.051,10.99C19.344,11.283 19.344,11.758 19.051,12.051Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "refresh":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(26.4566,0,0,26.4566,82.5206,86.6507)">' +
                '        <path fill="' + color + '" d="M18.372,3.231C18.765,3.394 19.021,3.777 19.021,4.201L19.021,8.444C19.021,9.024 18.551,9.494 17.971,9.494L13.728,9.494C13.303,9.494 12.92,9.238 12.758,8.846L12.758,8.846C12.596,8.453 12.685,8.002 12.986,7.701L14.261,6.426C11.829,5.592 9.026,6.145 7.086,8.086C4.371,10.8 4.371,15.2 7.086,17.914C9.8,20.629 14.2,20.629 16.914,17.914C18.493,16.336 19.153,14.189 18.896,12.131C18.824,11.556 19.232,11.031 19.807,10.959L19.807,10.959C20.383,10.887 20.907,11.295 20.98,11.87C21.314,14.545 20.455,17.344 18.399,19.399C14.865,22.934 9.135,22.934 5.601,19.399C2.066,15.865 2.066,10.135 5.601,6.601C8.379,3.823 12.512,3.229 15.87,4.817L17.228,3.459C17.529,3.158 17.98,3.069 18.372,3.231Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "download":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M2,12C2,7.286 2,4.929 3.464,3.464C4.929,2 7.286,2 12,2C16.714,2 19.071,2 20.535,3.464C22,4.929 22,7.286 22,12C22,16.714 22,19.071 20.535,20.535C19.071,22 16.714,22 12,22C7.286,22 4.929,22 3.464,20.535C2,19.071 2,16.714 2,12ZM8,16.25C7.586,16.25 7.25,16.586 7.25,17C7.25,17.414 7.586,17.75 8,17.75L16,17.75C16.414,17.75 16.75,17.414 16.75,17C16.75,16.586 16.414,16.25 16,16.25L8,16.25ZM12,6.25C11.586,6.25 11.25,6.586 11.25,7L11.25,12.189L9.53,10.47C9.237,10.177 8.763,10.177 8.47,10.47C8.177,10.763 8.177,11.237 8.47,11.53L11.47,14.53C11.61,14.671 11.801,14.75 12,14.75C12.199,14.75 12.39,14.671 12.53,14.53L15.53,11.53C15.823,11.237 15.823,10.763 15.53,10.47C15.237,10.177 14.763,10.177 14.47,10.47L12.75,12.189L12.75,7C12.75,6.586 12.414,6.25 12,6.25Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "save":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(27.7778,0,0,27.7778,66.6667,66.6667)">' +
                '        <path fill="' + color + '" d="M21,20L21,8.414C21,8.149 20.894,7.894 20.707,7.707L16.293,3.293C16.106,3.106 15.851,3 15.586,3L4,3C3.451,3 3,3.451 3,4L3,20C3,20.549 3.451,21 4,21L20,21C20.549,21 21,20.549 21,20ZM9,8L13,8C13.549,8 14,8.451 14,9C14,9.549 13.549,10 13,10L9,10C8.451,10 8,9.549 8,9C8,8.451 8.451,8 9,8ZM16,19L8,19L8,15C8,14.451 8.451,14 9,14L15,14C15.549,14 16,14.451 16,15L16,19Z"' +
                '              style="fill-rule:nonzero;"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "translate":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(22.3614,0,0,22.3614,142.636,131.664)">' +
                '        <path fill="' + color + '" d="M16.635,14.079L16.647,14.079C16.893,14.076 17.124,14.06 17.341,14.032C17.516,14.009 17.688,14.095 17.773,14.25C17.859,14.405 17.841,14.596 17.728,14.732C16.797,15.859 15.539,16.706 14.1,17.129C13.979,17.164 13.848,17.145 13.743,17.076C13.637,17.006 13.568,16.894 13.552,16.768C13.496,16.31 13.538,15.76 13.808,15.252C14.043,14.808 14.616,14.438 15.419,14.241C15.744,14.161 16.054,14.12 16.284,14.099L16.284,14.099C16.398,14.089 16.49,14.084 16.552,14.081L16.552,14.081C16.585,14.08 16.609,14.079 16.624,14.079L16.635,14.079L16.635,14.079C16.367,14.088 16.635,14.079 16.635,14.079ZM16.639,13.259L16.607,13.259C16.585,13.26 16.556,13.261 16.52,13.262C16.444,13.265 16.338,13.271 16.211,13.282L16.21,13.282C15.956,13.305 15.604,13.351 15.223,13.445C14.556,13.609 13.564,13.962 13.084,14.867C12.702,15.587 12.661,16.327 12.747,16.932C12.764,17.052 12.73,17.174 12.653,17.267C12.575,17.36 12.462,17.417 12.341,17.422C12.228,17.427 12.114,17.43 12,17.43C7.897,17.43 4.57,14.103 4.57,10C4.57,8.175 5.228,6.504 6.32,5.21C6.406,5.108 6.534,5.052 6.667,5.058C6.8,5.064 6.923,5.131 7,5.24C7.107,5.391 7.214,5.554 7.317,5.725C7.753,6.447 8.085,7.264 8.154,8.061C8.307,9.819 9.452,11.507 11.435,11.53C12.194,11.539 13.126,10.984 13.124,9.993C13.123,9.744 13.083,9.502 13.027,9.287C12.966,9.057 12.983,8.869 13.071,8.68C13.276,8.243 13.572,7.947 13.984,7.665C14.151,7.55 14.324,7.447 14.525,7.327L14.602,7.281C14.806,7.159 15.039,7.018 15.263,6.851C15.57,6.622 15.973,6.307 16.184,5.976L16.184,5.976C16.355,5.707 16.512,5.361 16.634,5.004C16.683,4.862 16.802,4.756 16.948,4.724C17.094,4.691 17.247,4.737 17.351,4.845C18.638,6.181 19.43,7.998 19.43,10C19.43,10.565 19.367,11.115 19.247,11.644C19.244,11.658 19.24,11.673 19.235,11.687C19.153,11.929 19.05,12.155 18.866,12.394C18.585,12.759 18.036,13.244 16.639,13.259ZM14.345,20.871C14.828,21.019 15.18,21.468 15.18,22C15.18,22.652 14.652,23.18 14,23.18L10,23.18C9.348,23.18 8.82,22.652 8.82,22C8.82,21.551 9.071,21.16 9.441,20.961C6.95,20.467 4.749,19.169 3.121,17.349C2.686,16.864 2.727,16.118 3.213,15.683C3.699,15.248 4.445,15.29 4.879,15.775C6.553,17.645 8.982,18.82 11.687,18.82C16.731,18.82 20.82,14.731 20.82,9.687C20.82,6.982 19.645,4.553 17.775,2.879C17.29,2.445 17.248,1.699 17.683,1.213C18.118,0.727 18.864,0.686 19.349,1.121C21.699,3.224 23.18,6.283 23.18,9.687C23.18,15.12 19.411,19.672 14.345,20.871ZM8.019,5.301C7.865,5.046 7.703,4.808 7.542,4.591C7.474,4.498 7.445,4.383 7.463,4.269C7.48,4.156 7.542,4.054 7.635,3.987C8.86,3.096 10.369,2.57 12,2.57C13.401,2.57 14.712,2.958 15.83,3.632C15.982,3.724 16.062,3.898 16.032,4.073C16.015,4.173 15.991,4.287 15.958,4.413C15.839,4.861 15.65,5.287 15.492,5.536C15.434,5.627 15.206,5.871 14.773,6.193C14.601,6.322 14.409,6.441 14.181,6.577L14.106,6.622C13.926,6.729 13.719,6.852 13.52,6.988L13.52,6.988C13.087,7.285 12.632,7.684 12.329,8.333C12.131,8.755 12.147,9.167 12.234,9.497C12.28,9.669 12.303,9.843 12.304,9.995L12.29,10.122L12.241,10.259L12.159,10.385L12.052,10.492C11.887,10.63 11.654,10.712 11.445,10.71L11.445,10.71C10.168,10.696 9.117,9.677 8.971,7.99C8.884,6.977 8.466,6.041 8.019,5.301Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "github":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(24.9999,0,0,24.9999,-1949.99,-184824)">' +
                '        <path fill="' + color + '" d="M94,7399C99.523,7399 104,7403.59 104,7409.25C104,7413.78 101.138,7417.62 97.167,7418.98C96.66,7419.08 96.48,7418.76 96.48,7418.49C96.48,7418.15 96.492,7417.05 96.492,7415.68C96.492,7414.72 96.172,7414.1 95.813,7413.78C98.04,7413.52 100.38,7412.66 100.38,7408.72C100.38,7407.6 99.992,7406.68 99.35,7405.97C99.454,7405.71 99.797,7404.66 99.252,7403.25C99.252,7403.25 98.414,7402.98 96.505,7404.3C95.706,7404.08 94.85,7403.96 94,7403.96C93.15,7403.96 92.295,7404.08 91.497,7404.3C89.586,7402.98 88.746,7403.25 88.746,7403.25C88.203,7404.66 88.546,7405.71 88.649,7405.97C88.01,7406.68 87.619,7407.6 87.619,7408.72C87.619,7412.65 89.954,7413.53 92.175,7413.78C91.889,7414.04 91.63,7414.49 91.54,7415.16C90.97,7415.42 89.522,7415.87 88.63,7414.3C88.63,7414.3 88.101,7413.32 87.097,7413.25C87.097,7413.25 86.122,7413.23 87.029,7413.87C87.029,7413.87 87.684,7414.19 88.139,7415.37C88.139,7415.37 88.726,7417.2 91.508,7416.58C91.513,7417.44 91.522,7418.24 91.522,7418.49C91.522,7418.76 91.338,7419.08 90.839,7418.98C86.865,7417.63 84,7413.78 84,7409.25C84,7403.59 88.478,7399 94,7399"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "email":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M15.604,15.466C14.694,16.412 13.416,17 12,17C9.239,17 7,14.761 7,12C7,9.239 9.239,7 12,7C14.761,7 17,9.239 17,12L17,13.5C17,14.328 17.672,15 18.5,15C19.328,15 20,14.328 20,13.5L20,12C20,7.582 16.418,4 12,4C7.582,4 4,7.582 4,12C4,16.418 7.582,20 12,20L16,20C16.552,20 17,20.448 17,21C17,21.552 16.552,22 16,22L12,22C6.477,22 2,17.523 2,12C2,6.477 6.477,2 12,2C17.523,2 22,6.477 22,12L22,13.5C22,15.433 20.433,17 18.5,17C17.296,17 16.234,16.392 15.604,15.466ZM15,12C15,10.343 13.657,9 12,9C10.343,9 9,10.343 9,12C9,13.657 10.343,15 12,15C13.657,15 15,13.657 15,12Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "telegram":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(16.6003,0,0,16.6003,134.102,135.11)">' +
                '        <path fill="' + color + '" d="M22.122,10.04L22.144,10.04C22.353,10.04 22.547,10.105 22.706,10.217L22.703,10.215C22.819,10.316 22.897,10.458 22.916,10.618L22.916,10.621C22.936,10.743 22.947,10.883 22.947,11.026C22.947,11.091 22.945,11.155 22.94,11.219L22.94,11.21C22.715,13.579 21.739,19.324 21.243,21.976C21.033,23.099 20.62,23.475 20.22,23.511C19.351,23.592 18.691,22.937 17.849,22.385C16.531,21.52 15.786,20.982 14.507,20.139C13.028,19.166 13.987,18.629 14.829,17.755C15.05,17.525 18.881,14.04 18.956,13.724C18.96,13.705 18.962,13.684 18.962,13.662C18.962,13.584 18.933,13.513 18.886,13.459C18.834,13.425 18.769,13.406 18.701,13.406C18.656,13.406 18.613,13.415 18.573,13.43L18.575,13.429C18.443,13.459 16.338,14.85 12.259,17.603C11.814,17.954 11.252,18.176 10.64,18.202L10.634,18.202C9.767,18.097 8.98,17.904 8.233,17.629L8.307,17.653C7.369,17.347 6.624,17.186 6.688,16.668C6.722,16.399 7.093,16.123 7.802,15.841C12.167,13.939 15.078,12.685 16.535,12.08C18.142,11.227 20.005,10.525 21.964,10.07L22.121,10.039L22.122,10.04ZM15.93,1.025C7.628,1.045 0.905,7.78 0.905,16.085C0.905,24.402 7.647,31.145 15.965,31.145C24.283,31.145 31.025,24.403 31.025,16.085C31.025,7.78 24.302,1.045 16.002,1.025L15.93,1.025Z"' +
                '              style="fill-rule:nonzero;"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "firefox":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(16.67,0,0,16.67,133.313,133.288)">' +
                '        <path fill="' + color + '" d="M29.469,11.061C28.856,9.546 27.852,8.296 26.579,7.401L26.553,7.384C27.227,8.66 27.74,10.141 28.011,11.705L28.024,11.795L28.027,11.82C26.385,7.724 23.598,6.072 21.321,2.476C21.207,2.292 21.091,2.111 20.98,1.919C20.922,1.821 20.868,1.721 20.818,1.619C20.731,1.454 20.658,1.263 20.607,1.062L20.603,1.044C20.603,1.025 20.588,1.009 20.569,1.007C20.565,1.006 20.561,1.005 20.556,1.005C20.551,1.005 20.547,1.006 20.543,1.007L20.536,1.008L20.524,1.014L20.53,1.004C17.959,2.605 16.143,5.211 15.625,8.259L15.616,8.322C14.559,8.383 13.577,8.647 12.689,9.076L12.735,9.056C12.611,9.118 12.528,9.244 12.528,9.389C12.528,9.435 12.537,9.48 12.552,9.521L12.551,9.518C12.603,9.662 12.738,9.763 12.896,9.763C12.95,9.763 13.002,9.751 13.048,9.73L13.046,9.731C13.779,9.377 14.632,9.143 15.533,9.079L15.556,9.078L15.64,9.072C15.763,9.065 15.906,9.06 16.051,9.06C16.776,9.06 17.476,9.166 18.137,9.362L18.085,9.349L18.204,9.386C18.517,9.482 18.772,9.579 19.02,9.689L18.974,9.671C19.074,9.716 19.174,9.762 19.271,9.811L19.405,9.88C19.562,9.962 19.715,10.05 19.865,10.144C20.921,10.805 21.779,11.69 22.388,12.738L22.407,12.774C21.611,12.215 20.621,11.881 19.553,11.881C19.324,11.881 19.099,11.896 18.878,11.926L18.904,11.923C20.792,12.962 22.05,14.938 22.05,17.208C22.05,20.528 19.358,23.22 16.038,23.22C15.843,23.22 15.65,23.211 15.46,23.193L15.484,23.195C14.798,23.166 14.152,23.035 13.548,22.816L13.593,22.83C13.326,22.735 13.104,22.637 12.89,22.525L12.921,22.54C11.079,21.637 9.772,19.889 9.5,17.815L9.497,17.784C9.497,17.784 10.168,15.285 14.302,15.285C15.061,14.96 15.667,14.399 16.04,13.696L16.049,13.677C14.7,13.024 13.546,12.327 12.464,11.536L12.529,11.581C12.002,11.061 11.752,10.811 11.529,10.623C11.418,10.529 11.295,10.436 11.168,10.349L11.153,10.339C10.989,9.785 10.894,9.149 10.894,8.49C10.894,7.885 10.974,7.298 11.124,6.74L11.113,6.787C9.734,7.463 8.571,8.373 7.626,9.475L7.614,9.49L7.607,9.49C7.266,8.636 7.068,7.646 7.068,6.611C7.068,6.343 7.081,6.078 7.107,5.817L7.104,5.85C6.918,5.926 6.758,6.012 6.608,6.113L6.617,6.107C6.09,6.486 5.626,6.886 5.199,7.322L5.197,7.324C4.713,7.815 4.268,8.347 3.868,8.912L3.841,8.952C2.947,10.203 2.271,11.676 1.905,13.268L1.889,13.351C1.885,13.367 1.752,13.959 1.652,14.692C1.636,14.804 1.62,14.918 1.606,15.032C1.565,15.309 1.537,15.587 1.52,15.866L1.518,15.909L1.489,16.393L1.488,16.468C1.49,24.493 7.996,30.998 16.022,30.998C23.179,30.998 29.128,25.825 30.333,19.013L30.346,18.925C30.371,18.739 30.39,18.553 30.411,18.365C30.48,17.824 30.52,17.199 30.52,16.564C30.52,14.583 30.134,12.692 29.434,10.962L29.47,11.062L29.469,11.061Z"' +
                '              style="fill-rule:nonzero;"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sticky-open":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.750001,0,0,0.750001,99.9997,99.9997)">' +
                '        <path fill="' + color + '" d="M66.667,600C66.667,537.147 66.667,505.72 86.193,486.193C105.719,466.667 137.146,466.667 200,466.667C262.854,466.667 294.281,466.667 313.807,486.193C333.333,505.72 333.333,537.147 333.333,600C333.333,662.853 333.333,694.28 313.807,713.807C294.281,733.333 262.854,733.333 200,733.333C137.146,733.333 105.719,733.333 86.193,713.807C66.667,694.28 66.667,662.853 66.667,600ZM115.482,115.482C164.298,66.667 242.865,66.667 400,66.667C557.133,66.667 635.703,66.667 684.517,115.482C733.333,164.298 733.333,242.865 733.333,400C733.333,557.133 733.333,635.703 684.517,684.517C635.703,733.333 557.133,733.333 400,733.333C386.813,733.333 374.183,733.333 362.073,733.303C373.18,716.367 378.04,697.707 380.447,679.813C383.34,658.293 383.337,631.84 383.333,602.983L383.333,597.017C383.337,568.163 383.34,541.707 380.447,520.187C377.26,496.487 369.763,471.44 349.163,450.837C328.561,430.237 303.513,422.74 279.814,419.553C258.294,416.66 231.838,416.663 202.984,416.667L197.017,416.667C168.163,416.663 141.707,416.66 120.187,419.553C102.294,421.96 83.632,426.823 66.696,437.927C66.667,425.82 66.667,413.187 66.667,400C66.667,242.865 66.667,164.298 115.482,115.482ZM525,425C538.807,425 550,413.807 550,400C550,386.193 538.807,375 525,375L460.357,375L584.343,251.011C594.107,241.248 594.107,225.419 584.343,215.656C574.58,205.893 558.753,205.893 548.99,215.656L425,339.643L425,275C425,261.193 413.807,250 400,250C386.193,250 375,261.193 375,275L375,400C375,413.807 386.193,425 400,425L525,425Z"' +
                '              style="stroke:white;stroke-width:1px;"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sticky-close":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.750001,0,0,0.750001,99.9997,99.9997)">' +
                '        <path fill="' + color + '" d="M66.667,600C66.667,537.147 66.667,505.72 86.193,486.193C105.719,466.667 137.146,466.667 200,466.667C262.854,466.667 294.281,466.667 313.807,486.193C333.333,505.72 333.333,537.147 333.333,600C333.333,662.853 333.333,694.28 313.807,713.807C294.281,733.333 262.854,733.333 200,733.333C137.146,733.333 105.719,733.333 86.193,713.807C66.667,694.28 66.667,662.853 66.667,600ZM115.482,115.482C164.298,66.667 242.865,66.667 400,66.667C557.133,66.667 635.703,66.667 684.517,115.482C733.333,164.298 733.333,242.865 733.333,400C733.333,557.133 733.333,635.703 684.517,684.517C635.703,733.333 557.133,733.333 400,733.333C386.813,733.333 374.183,733.333 362.073,733.303C373.18,716.367 378.04,697.707 380.447,679.813C383.34,658.293 383.337,631.84 383.333,602.983L383.333,597.017C383.337,568.163 383.34,541.707 380.447,520.187C377.26,496.487 369.763,471.44 349.163,450.837C328.561,430.237 303.513,422.74 279.814,419.553C258.294,416.66 231.838,416.663 202.984,416.667L197.017,416.667C168.163,416.663 141.707,416.66 120.187,419.553C102.294,421.96 83.632,426.823 66.696,437.927C66.667,425.82 66.667,413.187 66.667,400C66.667,242.865 66.667,164.298 115.482,115.482ZM441.667,208.333C427.86,208.333 416.667,219.526 416.667,233.333C416.667,247.14 427.86,258.333 441.667,258.333L506.31,258.333L382.323,382.323C372.56,392.087 372.56,407.913 382.323,417.677C392.087,427.44 407.913,427.44 417.677,417.677L541.667,293.689L541.667,358.333C541.667,372.14 552.86,383.333 566.667,383.333C580.473,383.333 591.667,372.14 591.667,358.333L591.667,233.333C591.667,219.526 580.473,208.333 566.667,208.333L441.667,208.333Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sticky-minimize":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.722892,0,0,0.722892,110.843,110.843)">' +
                '        <path fill="' + color + '" d="M54.167,400C54.167,386.193 65.36,375 79.167,375L444.92,375L379.563,318.981C369.08,309.996 367.867,294.213 376.853,283.73C385.837,273.247 401.62,272.033 412.103,281.019L528.77,381.02C534.31,385.767 537.5,392.703 537.5,400C537.5,407.297 534.31,414.233 528.77,418.98L412.103,518.98C401.62,527.967 385.837,526.753 376.853,516.27C367.867,505.787 369.08,490.003 379.563,481.02L444.92,425L79.167,425C65.36,425 54.167,413.807 54.167,400ZM312.5,325.001L312.5,266.667C312.5,172.386 312.5,125.245 341.79,95.956C371.08,66.667 418.22,66.667 512.5,66.667L545.833,66.667C640.113,66.667 687.253,66.667 716.543,95.956C745.833,125.245 745.833,172.386 745.833,266.667L745.833,533.333C745.833,627.613 745.833,674.753 716.543,704.043C687.253,733.333 640.113,733.333 545.833,733.333L512.5,733.333C418.22,733.333 371.08,733.333 341.79,704.043C312.5,674.753 312.5,627.613 312.5,533.333L312.5,475L325.109,475C316.491,499.453 320.803,527.71 338.89,548.81C365.847,580.26 413.193,583.903 444.643,556.947L561.31,456.947C577.933,442.697 587.5,421.897 587.5,400C587.5,378.107 577.933,357.307 561.31,343.057L444.643,243.057C413.193,216.1 365.847,219.743 338.89,251.192C320.803,272.292 316.491,300.548 325.109,325.001L312.5,325.001Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sticky-restore":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.722899,0,0,0.722899,110.843,110.841)">' +
                '        <path fill="' + color + '" d="M537.5,400C537.5,413.807 526.307,425 512.5,425L146.748,425L212.103,481.02C222.586,490.003 223.8,505.787 214.815,516.27C205.829,526.753 190.047,527.967 179.564,518.98L62.897,418.98C57.356,414.233 54.167,407.297 54.167,400C54.167,392.703 57.356,385.767 62.897,381.02L179.564,281.019C190.047,272.033 205.829,273.247 214.815,283.73C223.8,294.213 222.586,309.996 212.103,318.981L146.748,375L512.5,375C526.307,375 537.5,386.193 537.5,400ZM312.5,266.667C312.5,172.386 312.5,125.245 341.79,95.956C371.08,66.667 418.213,66.667 512.493,66.667L545.827,66.667C640.107,66.667 687.247,66.667 716.537,95.956C745.827,125.245 745.827,172.386 745.827,266.667L745.827,533.333C745.827,627.613 745.827,674.753 716.537,704.043C687.247,733.333 640.107,733.333 545.827,733.333L512.493,733.333C418.213,733.333 371.08,733.333 341.79,704.043C312.5,674.753 312.5,627.613 312.5,533.333C312.5,509.923 312.5,498.22 318.118,489.813C320.55,486.173 323.674,483.05 327.313,480.617C335.72,475 347.427,475 370.833,475L512.5,475C553.92,475 587.5,441.42 587.5,400C587.5,358.577 553.92,324.999 512.5,324.999L370.833,324.999C347.427,324.999 335.723,324.999 327.315,319.382C323.675,316.949 320.549,313.824 318.117,310.183C312.5,301.776 312.5,290.073 312.5,266.667Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "bold":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.892857,0,0,0.892857,-61.2205,326.719)">' +
                '        <path fill="' + color + '" d="M305.767,362.075L305.767,-197.925L476.167,-197.925C516.7,-197.925 553.633,-193.259 586.967,-183.925C620.3,-174.592 646.833,-158.059 666.567,-134.325C686.3,-110.592 696.167,-77.125 696.167,-33.925C696.167,-16.859 693.233,0.875 687.367,19.275C681.5,37.675 671.633,53.408 657.767,66.475C655.12,68.969 652.269,71.254 649.214,73.331C654.479,75.631 659.597,78.279 664.567,81.275C684.033,93.008 699.367,108.475 710.567,127.675C721.767,146.875 727.367,168.741 727.367,193.275C727.367,235.941 717.5,269.675 697.767,294.475C678.033,319.275 651.5,336.741 618.167,346.875C584.833,357.008 547.9,362.075 507.367,362.075L305.767,362.075ZM421.767,-97.125L421.767,29.275L476.167,29.275C493.767,29.275 510.167,27.941 525.367,25.275C540.567,22.608 552.7,16.741 561.767,7.675C570.833,-1.392 575.367,-15.259 575.367,-33.925C575.367,-52.592 570.833,-66.459 561.767,-75.525C552.7,-84.592 540.567,-90.459 525.367,-93.125C510.167,-95.792 493.767,-97.125 476.167,-97.125L421.767,-97.125ZM421.767,130.075L421.767,261.275L507.367,261.275C524.967,261.275 541.367,259.541 556.567,256.075C571.767,252.608 583.9,245.941 592.967,236.075C602.033,226.208 606.567,211.941 606.567,193.275C606.567,174.608 602.033,160.741 592.967,151.675C583.9,142.608 571.767,136.741 556.567,134.075C541.367,131.408 524.967,130.075 507.367,130.075L421.767,130.075Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "italic":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.767623,0,0,0.767623,143.689,105.974)">' +
                '        <path fill="' + color + '" d="M328.578,648.714L394.839,648.714C397.426,648.714 399.523,653.191 399.523,658.714L399.523,698.714C399.523,704.237 397.426,708.714 394.839,708.714L161.406,708.714C158.819,708.714 156.722,704.237 156.722,698.714L156.722,658.714C156.722,653.191 158.819,648.714 161.406,648.714L231.592,648.714L342.866,117.353L272.965,117.353C270.378,117.353 268.282,112.876 268.282,107.353L268.282,67.353C268.282,61.83 270.378,57.353 272.965,57.353L506.399,57.353C508.986,57.353 511.083,61.83 511.083,67.353L511.083,107.353C511.083,112.876 508.986,117.353 506.399,117.353L439.49,117.353L328.578,648.714Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "underline":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.753954,0,0,0.753954,-74.483,395.134)">' +
                '        <path fill="' + color + '" d="M501.047,-10.08C501.047,30.379 505.259,64.752 513.818,93.022C521.91,119.752 535.631,140.197 555.249,154.175C575.18,168.376 603.172,175.12 639.047,175.12C674.402,175.12 702.126,168.367 722.044,154.175C741.662,140.197 755.383,119.752 763.476,93.022C772.034,64.752 776.247,30.379 776.247,-10.08L776.247,-330.08C776.247,-335.603 780.724,-340.08 786.247,-340.08L846.247,-340.08C851.77,-340.08 856.247,-335.603 856.247,-330.08L856.247,-10.08C856.247,44.049 849.193,90.374 835.25,128.921C820.871,168.676 797.536,199.212 765.394,220.64C733.581,241.849 691.51,252.72 639.047,252.72C586.606,252.72 544.411,241.862 512.333,220.662C479.902,199.23 456.425,168.685 442.043,128.921C428.101,90.374 421.047,44.049 421.047,-10.08L421.047,-330.08C421.047,-335.603 425.524,-340.08 431.047,-340.08L491.047,-340.08C496.57,-340.08 501.047,-335.603 501.047,-330.08L501.047,-10.08ZM391.141,263.09L889.541,263.09C895.064,263.09 899.541,267.567 899.541,273.09L899.541,313.09C899.541,318.613 895.064,323.09 889.541,323.09L391.141,323.09C385.618,323.09 381.141,318.613 381.141,313.09L381.141,273.09C381.141,267.567 385.618,263.09 391.141,263.09Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "strikethrough":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.825627,0,0,0.825627,69.749,84.8712)">' +
                '        <path fill="' + color + '" d="M323.746,408L150.8,408C145.277,408 140.8,403.523 140.8,398L140.8,358C140.8,352.477 145.277,348 150.8,348L649.2,348C654.723,348 659.2,352.477 659.2,358L659.2,398C659.2,403.523 654.723,408 649.2,408L601.027,408C607.99,414.347 614.265,421.34 619.857,428.975C634.822,449.408 642.59,476.525 642.59,510.484C642.59,566.27 621.514,609.314 579.675,639.769C539.043,669.345 482.609,684.484 410.19,684.484C365.356,684.484 325.102,675.705 289.401,658.27C253.373,640.675 224.923,616.751 203.976,586.588C182.896,556.232 171.486,521.95 169.799,483.725C169.679,480.999 170.678,478.342 172.565,476.371C174.451,474.399 177.061,473.284 179.79,473.284L246.19,473.284C251.421,473.284 255.768,477.315 256.161,482.531C258.14,508.743 265.955,531.155 279.803,549.701C293.689,568.299 312.196,582.391 335.257,592.062C358.907,601.98 385.491,606.884 414.99,606.884C460.054,606.884 495.952,598.065 522.534,579.837C547.577,562.665 560.19,539.581 560.19,510.484C560.19,492.424 554.585,478.205 542.846,468.046C529.962,456.896 512.81,448.462 491.502,442.516C468.887,436.205 444.168,430.818 417.346,426.348C389.991,421.789 362.636,416.559 335.281,410.659C331.394,409.821 327.548,408.934 323.746,408ZM193.289,328C182.008,308.293 176.19,283.553 176.19,253.684C176.19,221.717 185.723,192.309 204.847,165.48C223.672,139.068 250.433,117.905 285.274,102.17C319.503,86.712 360.063,78.884 406.99,78.884C448.599,78.884 486.454,87.252 520.574,103.896C555.006,120.692 582.415,144.095 602.85,174.048C623.423,204.203 633.79,239.266 633.79,279.284C633.79,284.807 629.313,289.284 623.79,289.284L558.19,289.284C552.861,289.284 548.468,285.105 548.202,279.783C546.22,240.143 534.042,209.533 511,188.226C487.704,166.683 451.587,156.484 402.99,156.484C354.48,156.484 317.858,165.122 293.35,183.314C270.141,200.541 258.59,224.015 258.59,253.684C258.59,273.421 264.239,288.92 276.173,299.936C289.022,311.797 306.131,320.704 327.381,326.882C328.679,327.259 329.983,327.632 331.295,328L193.289,328Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "align-center":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(0.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_center_fill" transform="translate(0.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                "</path>\n" +
                '                <path d="M17,17.5 C17.8284,17.5 18.5,18.1716 18.5,19 C18.5,19.7796706 17.9050879,20.4204457 17.1444558,20.4931332 L17,20.5 L7,20.5 C6.17157,20.5 5.5,19.8284 5.5,19 C5.5,18.2203294 6.09488554,17.5795543 6.85553954,17.5068668 L7,17.5 L17,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M17,7.5 C17.8284,7.5 18.5,8.17157 18.5,9 C18.5,9.77969882 17.9050879,10.420449 17.1444558,10.4931335 L17,10.5 L7,10.5 C6.17157,10.5 5.5,9.82843 5.5,9 C5.5,8.22030118 6.09488554,7.579551 6.85553954,7.50686655 L7,7.5 L17,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' +
                color +
                '">\n' +
                "</path>\n" +
                "            </g>\n" +
                "        </g>\n" +
                "    </g>\n" +
                "</svg>";
            break;
        case "align-left":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-48.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_left_fill" transform="translate(48.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                "</path>\n" +
                '                <path d="M14,17.5 C14.8284,17.5 15.5,18.1716 15.5,19 C15.5,19.7796706 14.9050879,20.4204457 14.1444558,20.4931332 L14,20.5 L4,20.5 C3.17157,20.5 2.5,19.8284 2.5,19 C2.5,18.2203294 3.09488554,17.5795543 3.85553954,17.5068668 L4,17.5 L14,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M14,7.5 C14.8284,7.5 15.5,8.17157 15.5,9 C15.5,9.77969882 14.9050879,10.420449 14.1444558,10.4931335 L14,10.5 L4,10.5 C3.17157,10.5 2.5,9.82843 2.5,9 C2.5,8.22030118 3.09488554,7.579551 3.85553954,7.50686655 L4,7.5 L14,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' +
                color +
                '">\n' +
                "</path>\n" +
                "            </g>\n" +
                "        </g>\n" +
                "    </g>\n" +
                "</svg>";
            break;
        case "align-right":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-96.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_right_fill" transform="translate(96.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                "</path>\n" +
                '                <path d="M20,17.5 C20.8284,17.5 21.5,18.1716 21.5,19 C21.5,19.7796706 20.9050879,20.4204457 20.1444558,20.4931332 L20,20.5 L10,20.5 C9.17157,20.5 8.5,19.8284 8.5,19 C8.5,18.2203294 9.09488554,17.5795543 9.85553954,17.5068668 L10,17.5 L20,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M20,7.5 C20.8284,7.5 21.5,8.17157 21.5,9 C21.5,9.77969882 20.9050879,10.420449 20.1444558,10.4931335 L20,10.5 L10,10.5 C9.17157,10.5 8.5,9.82843 8.5,9 C8.5,8.22030118 9.09488554,7.579551 9.85553954,7.50686655 L10,7.5 L20,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' +
                color +
                '">\n' +
                "</path>\n" +
                "            </g>\n" +
                "        </g>\n" +
                "    </g>\n" +
                "</svg>";
            break;
        case "u-list":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-720.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="list_check_fill" transform="translate(720.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                "</path>\n" +
                '                <path d="M20,17.5 C20.8284,17.5 21.5,18.1716 21.5,19 C21.5,19.8284 20.8284,20.5 20,20.5 L9,20.5 C8.17157,20.5 7.5,19.8284 7.5,19 C7.5,18.1716 8.17157,17.5 9,17.5 L20,17.5 Z M4.5,17.5 C5.32843,17.5 6,18.1716 6,19 C6,19.8284 5.32843,20.5 4.5,20.5 C3.67157,20.5 3,19.8284 3,19 C3,18.1716 3.67157,17.5 4.5,17.5 Z M20,10.5 C20.8284,10.5 21.5,11.1716 21.5,12 C21.5,12.7796706 20.9050879,13.4204457 20.1444558,13.4931332 L20,13.5 L9,13.5 C8.17157,13.5 7.5,12.8284 7.5,12 C7.5,11.2203294 8.09488554,10.5795543 8.85553954,10.5068668 L9,10.5 L20,10.5 Z M4.5,10.5 C5.32843,10.5 6,11.1716 6,12 C6,12.8284 5.32843,13.5 4.5,13.5 C3.67157,13.5 3,12.8284 3,12 C3,11.1716 3.67157,10.5 4.5,10.5 Z M4.5,3.5 C5.32843,3.5 6,4.17157 6,5 C6,5.82843 5.32843,6.5 4.5,6.5 C3.67157,6.5 3,5.82843 3,5 C3,4.17157 3.67157,3.5 4.5,3.5 Z M20,3.5 C20.8284,3.5 21.5,4.17157 21.5,5 C21.5,5.77969882 20.9050879,6.420449 20.1444558,6.49313345 L20,6.5 L9,6.5 C8.17157,6.5 7.5,5.82843 7.5,5 C7.5,4.22030118 8.09488554,3.579551 8.85553954,3.50686655 L9,3.5 L20,3.5 Z" id="形状" fill="' +
                color +
                '">\n' +
                "</path>\n" +
                "            </g>\n" +
                "        </g>\n" +
                "    </g>\n" +
                "</svg>";
            break;
        case "o-list":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-768.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="list_ordered_fill" transform="translate(768.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                "</path>\n" +
                '                <path d="M5.43576,16.7201 C6.24693,16.7201 6.90006,17.3805 6.90006,18.1868 C6.90006,18.4773 6.81334,18.7582 6.65581,18.9952 C6.81328,19.2321 6.89997,19.513 6.89997,19.8035 C6.89997,20.6097 6.24685,21.2701 5.43567,21.2701 C4.84927,21.2701 4.30154,21.0591 4.0556,20.4795 C3.90259,20.1189 3.94402,19.6904 4.35318,19.5168 C4.68364,19.3766 5.06521,19.5308 5.20544,19.8612 C5.23345,19.9273 5.29823,19.9727 5.36993,19.971 C5.48374,19.9684 5.59997,19.9445 5.59997,19.8035 C5.59997,19.7025833 5.52687972,19.6598611 5.44355218,19.6484236 L5.39283,19.6451 C5.03384,19.6451 4.74283,19.3541 4.74283,18.9951 C4.74283,18.7504 4.87806,18.5373 5.07787,18.4264 C5.14009,18.3918667 5.20856778,18.3672444 5.28117296,18.3546667 L5.39291,18.3451 C5.49481,18.3451 5.60006,18.3078 5.60006,18.1868 C5.60006,18.0457 5.48385,18.0218 5.37005,18.0192 C5.29835,18.0175 5.23357,18.063 5.20556,18.129 C5.06533,18.4595 4.68376,18.6137 4.3533,18.4735 C3.94414,18.2998 3.90271,17.8713 4.05572,17.5107 C4.30166,16.9311 4.84937,16.7201 5.43576,16.7201 Z M20,17.5001 C20.8284,17.5001 21.5,18.1717 21.5,19.0001 C21.5,19.8285 20.8284,20.5001 20,20.5001 L9,20.5001 C8.17157,20.5001 7.5,19.8285 7.5,19.0001 C7.5,18.1717 8.17157,17.5001 9,17.5001 L20,17.5001 Z M6.08078,9.94527 C6.72558,10.2677 7.05451,11.0088 6.88063,11.7043 C6.81679,11.9597 6.68907,12.1946 6.50947,12.387 L5.95592,12.9801 L6.4256,12.9801 C6.78459,12.9801 7.0756,13.2711 7.0756,13.6301 C7.0756,13.9891 6.78459,14.2801 6.4256,14.2801 L4.5731,14.2801 C4.21155,14.2801 3.91846,13.987 3.91846,13.6255 C3.91846,13.4195 3.9468,13.2275 4.09452,13.0692 L5.5591,11.5 C5.70059,11.3484 5.58869,11.0272 5.35616,11.0853 C5.268656,11.10722 5.2330304,11.17394 5.22228032,11.2502344 L5.21846,11.3087 C5.21846,11.6677 4.92744,11.9587 4.56846,11.9587 C4.20947,11.9587 3.91846,11.6677 3.91846,11.3087 C3.91846,10.6174 4.357,9.99512 5.04087,9.82415 C5.3917,9.73644 5.75867,9.78422 6.08078,9.94527 Z M20,10.5001 C20.8284,10.5001 21.5,11.1717 21.5,12.0001 C21.5,12.7797706 20.9050879,13.4205457 20.1444558,13.4932332 L20,13.5001 L9,13.5001 C8.17157,13.5001 7.5,12.8285 7.5,12.0001 C7.5,11.2204294 8.09488554,10.5796543 8.85553954,10.5069668 L9,10.5001 L20,10.5001 Z M6.15004,3.3895 L6.15004,6.63016 C6.15004,6.98914 5.85903,7.28016 5.50004,7.28016 C5.14106,7.28016 4.85004,6.98914 4.85004,6.63016 L4.85004,4.52258 C4.60765,4.56015 4.35422,4.45823 4.20921,4.24071 C4.01008,3.94202 4.0908,3.53845 4.38949,3.33932 L5.13172,2.84451 C5.56699,2.55432 6.15004,2.86634 6.15004,3.3895 Z M20,3.50012 C20.8284,3.50012 21.5,4.17169 21.5,5.00012 C21.5,5.77981882 20.9050879,6.420569 20.1444558,6.49325345 L20,6.50012 L9,6.50012 C8.17157,6.50012 7.5,5.82855 7.5,5.00012 C7.5,4.22042118 8.09488554,3.579671 8.85553954,3.50698655 L9,3.50012 L20,3.50012 Z" id="形状" fill="' +
                color +
                '">\n' +
                "</path>\n" +
                "            </g>\n" +
                "        </g>\n" +
                "    </g>\n" +
                "</svg>";
            break;
        case "undo":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25.888,0,0,25.888,73.6303,85.1764)">' +
                '        <path fill="' + color + '"' +
                '              d="M5.05,12.628C6.947,10.937 8.942,9.422 11.599,9.048C13.757,8.744 15.955,9.15 17.862,10.204C19.769,11.259 21.282,12.904 22.172,14.893C22.409,15.422 22.172,16.043 21.643,16.28C21.114,16.517 20.492,16.28 20.256,15.751C19.551,14.178 18.354,12.876 16.846,12.042C15.337,11.208 13.599,10.887 11.892,11.128C9.786,11.424 8.197,12.608 6.696,13.95L10,13.95C10.58,13.95 11.05,14.42 11.05,15C11.05,15.58 10.58,16.05 10,16.05L4,16.05C3.848,16.05 3.703,16.017 3.572,15.959C3.441,15.901 3.32,15.815 3.219,15.701C3.13,15.603 3.064,15.492 3.019,15.376C2.975,15.259 2.95,15.132 2.95,15L2.95,9C2.95,8.42 3.42,7.95 4,7.95C4.58,7.95 5.05,8.42 5.05,9L5.05,12.628Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "redo":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(-25.888,0,0,25.888,726.37,85.1764)">' +
                '        <path fill="' + color + '"' +
                '              d="M5.05,12.628C6.947,10.937 8.942,9.422 11.599,9.048C13.757,8.744 15.955,9.15 17.862,10.204C19.769,11.259 21.282,12.904 22.172,14.893C22.409,15.422 22.172,16.043 21.643,16.28C21.114,16.517 20.492,16.28 20.256,15.751C19.551,14.178 18.354,12.876 16.846,12.042C15.337,11.208 13.599,10.887 11.892,11.128C9.786,11.424 8.197,12.608 6.696,13.95L10,13.95C10.58,13.95 11.05,14.42 11.05,15C11.05,15.58 10.58,16.05 10,16.05L4,16.05C3.848,16.05 3.703,16.017 3.572,15.959C3.441,15.901 3.32,15.815 3.219,15.701C3.13,15.603 3.064,15.492 3.019,15.376C2.975,15.259 2.95,15.132 2.95,15L2.95,9C2.95,8.42 3.42,7.95 4,7.95C4.58,7.95 5.05,8.42 5.05,9L5.05,12.628Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "spellcheck_sel":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.557253,0,0,0.557253,183.159,136.574)">' +
                '        <path fill="' + color + '" d="M767.417,599.036L582.386,830.325C575.807,838.537 565.835,843.325 555.312,843.325C546.105,843.325 537.267,839.66 530.763,833.146L415.118,717.502C408.079,710.943 404.077,701.742 404.077,692.12C404.077,691.627 404.087,691.136 404.108,690.648C404.891,672.287 420.231,657.427 438.77,657.427C448.392,657.427 457.592,661.429 464.152,668.469L552.411,756.682L713.203,555.646C719.782,547.413 729.767,542.611 740.306,542.611C748.193,542.611 755.851,545.3 762.005,550.234C769.751,556.424 774.46,565.629 774.99,575.474C775.024,576.093 775.04,576.714 775.04,577.338C775.04,585.224 772.351,592.882 767.417,599.036ZM389.215,687.97C381.154,685.897 373.149,682.816 365.198,678.729C349.064,670.434 335.163,658.173 323.495,641.948L323.495,684.608L252.122,684.608L252.122,283.714L328.965,283.714L328.965,428.102C352.665,401.12 380.74,387.629 413.191,387.629C448.558,387.629 477.819,400.436 500.972,426.051C524.125,451.665 535.701,488.445 535.701,536.392C535.701,585.98 523.897,624.173 500.288,650.972C495.042,656.927 489.547,662.22 483.802,666.851L474.952,658.005C465.571,648.051 452.468,642.392 438.77,642.392C412.886,642.392 391.353,662.6 389.215,687.97ZM328.418,533.111C328.418,563.191 333.158,585.433 342.638,599.835C355.946,620.254 373.63,630.463 395.689,630.463C412.644,630.463 427.092,623.216 439.033,608.723C450.974,594.229 456.944,571.395 456.944,540.221C456.944,507.041 450.928,483.113 438.896,468.437C426.864,453.761 411.459,446.423 392.681,446.423C374.268,446.423 358.954,453.579 346.74,467.89C334.525,482.201 328.418,503.941 328.418,533.111ZM610.711,659.719C607.566,656.982 604.536,654.066 601.621,650.972C576.371,624.173 563.746,587.074 563.746,539.674C563.746,491.727 576.417,454.399 601.757,427.691C627.098,400.983 661.372,387.629 704.579,387.629C739.946,387.629 768.067,395.241 788.942,410.463C809.816,425.686 824.81,448.885 833.926,480.059L758.177,493.732C755.625,478.601 749.837,467.207 740.812,459.55C731.788,451.893 720.075,448.064 705.673,448.064C686.53,448.064 671.262,454.673 659.868,467.89C648.474,481.107 642.777,503.212 642.777,534.204C642.777,564.977 647.393,587.679 656.627,602.311L610.711,659.719ZM790.071,578.042L837.754,586.162C829.915,620.8 814.875,646.962 792.633,664.645C772.397,680.735 745.898,689.505 713.137,690.955L779.158,608.429C786.074,599.803 789.914,589.098 790.071,578.042ZM18.159,482.794L-51.573,470.215C-43.734,442.139 -30.243,421.356 -11.101,407.865C8.041,394.375 36.481,387.629 74.219,387.629C108.493,387.629 134.016,391.686 150.788,399.798C167.56,407.911 179.365,418.211 186.201,430.699C193.038,443.188 196.456,466.113 196.456,499.475L195.635,589.17C195.635,614.693 196.866,633.516 199.327,645.64C201.788,657.763 206.392,670.753 213.137,684.608L137.115,684.608C135.109,679.503 132.648,671.938 129.731,661.911C128.455,657.353 127.544,654.345 126.997,652.887C113.871,665.648 99.833,675.219 84.884,681.6C69.935,687.981 53.983,691.171 37.028,691.171C7.13,691.171 -16.434,683.058 -33.662,666.833C-50.89,650.608 -59.504,630.098 -59.504,605.304C-59.504,588.897 -55.584,574.267 -47.745,561.414C-39.906,548.561 -28.922,538.717 -14.793,531.88C-0.664,525.044 19.709,519.073 46.326,513.968C82.24,507.223 107.125,500.933 120.981,495.1L120.981,487.443C120.981,472.676 117.334,462.147 110.042,455.858C102.75,449.568 88.986,446.423 68.75,446.423C55.076,446.423 44.411,449.113 36.755,454.491C29.098,459.869 22.899,469.303 18.159,482.794ZM120.981,545.143C111.136,548.424 95.549,552.344 74.219,556.902C52.889,561.459 38.942,565.926 32.379,570.301C22.352,577.411 17.339,586.436 17.339,597.374C17.339,608.13 21.35,617.428 29.371,625.267C37.393,633.106 47.602,637.026 59.999,637.026C73.854,637.026 87.071,632.468 99.651,623.353C108.948,616.425 115.056,607.948 117.972,597.921C119.978,591.358 120.981,578.87 120.981,560.457L120.981,545.143Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "spellcheck":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.557253,0,0,0.557253,183.159,136.713)">' +
                '        <path fill="' + color + '" d="M564.35,695.546L473.25,604.4C459.693,590.844 459.693,568.913 473.25,555.357C486.806,541.8 508.737,541.8 522.293,555.357L613.439,646.457L704.586,555.357C718.096,541.8 740.073,541.8 753.629,555.357C758.767,560.494 761.957,566.835 763.201,573.466C765.238,584.333 762.048,595.981 753.629,604.4L662.529,695.546L753.629,786.693C767.185,800.203 767.185,822.18 753.629,835.736C740.073,849.292 718.096,849.292 704.586,835.736L613.439,744.636L522.293,835.736C508.737,849.292 486.806,849.292 473.25,835.736C459.693,822.18 459.693,800.249 473.25,786.693L564.35,695.546ZM499.466,651.898C476.014,678.08 447.621,691.171 414.284,691.171C397.694,691.171 381.332,687.024 365.198,678.729C349.064,670.434 335.163,658.173 323.495,641.948L323.495,684.608L252.122,684.608L252.122,283.714L328.965,283.714L328.965,428.102C352.665,401.12 380.74,387.629 413.191,387.629C448.558,387.629 477.819,400.436 500.972,426.051C524.125,451.665 535.701,488.445 535.701,536.392C535.701,540.092 535.635,543.729 535.504,547.303L532.922,544.722C513.488,525.291 482.051,525.292 462.618,544.725C460.365,546.978 458.374,549.392 456.643,551.93C456.844,548.167 456.944,544.264 456.944,540.221C456.944,507.041 450.928,483.113 438.896,468.437C426.864,453.761 411.459,446.423 392.681,446.423C374.268,446.423 358.954,453.579 346.74,467.89C334.525,482.201 328.418,503.941 328.418,533.111C328.418,563.191 333.158,585.433 342.638,599.835C355.946,620.254 373.63,630.463 395.689,630.463C412.644,630.463 427.092,623.216 439.033,608.723C443.146,603.73 446.551,597.748 449.247,590.776C451.238,599.661 455.695,608.108 462.618,615.032L499.466,651.898ZM567.019,578.801C564.837,566.649 563.746,553.606 563.746,539.674C563.746,491.727 576.417,454.399 601.757,427.691C627.098,400.983 661.372,387.629 704.579,387.629C739.946,387.629 768.067,395.241 788.942,410.463C809.816,425.686 824.81,448.885 833.926,480.059L758.177,493.732C755.625,478.601 749.837,467.207 740.812,459.55C731.788,451.893 720.075,448.064 705.673,448.064C686.53,448.064 671.262,454.673 659.868,467.89C648.474,481.107 642.777,503.212 642.777,534.204C642.777,556.591 645.22,574.706 650.106,588.55L613.439,625.199L567.019,578.801ZM778.694,576.105L837.754,586.162C829.915,620.8 814.875,646.962 792.633,664.645C770.392,682.329 740.584,691.171 703.211,691.171C698.259,691.171 693.424,690.989 688.706,690.625L764.263,615.029C774.941,604.352 779.751,590.049 778.694,576.105ZM18.159,482.794L-51.573,470.215C-43.734,442.139 -30.243,421.356 -11.101,407.865C8.041,394.375 36.481,387.629 74.219,387.629C108.493,387.629 134.016,391.686 150.788,399.798C167.56,407.911 179.365,418.211 186.201,430.699C193.038,443.188 196.456,466.113 196.456,499.475L195.635,589.17C195.635,614.693 196.866,633.516 199.327,645.64C201.788,657.763 206.392,670.753 213.137,684.608L137.115,684.608C135.109,679.503 132.648,671.938 129.731,661.911C128.455,657.353 127.544,654.345 126.997,652.887C113.871,665.648 99.833,675.219 84.884,681.6C69.935,687.981 53.983,691.171 37.028,691.171C7.13,691.171 -16.434,683.058 -33.662,666.833C-50.89,650.608 -59.504,630.098 -59.504,605.304C-59.504,588.897 -55.584,574.267 -47.745,561.414C-39.906,548.561 -28.922,538.717 -14.793,531.88C-0.664,525.044 19.709,519.073 46.326,513.968C82.24,507.223 107.125,500.933 120.981,495.1L120.981,487.443C120.981,472.676 117.334,462.147 110.042,455.858C102.75,449.568 88.986,446.423 68.75,446.423C55.076,446.423 44.411,449.113 36.755,454.491C29.098,459.869 22.899,469.303 18.159,482.794ZM120.981,545.143C111.136,548.424 95.549,552.344 74.219,556.902C52.889,561.459 38.942,565.926 32.379,570.301C22.352,577.411 17.339,586.436 17.339,597.374C17.339,608.13 21.35,617.428 29.371,625.267C37.393,633.106 47.602,637.026 59.999,637.026C73.854,637.026 87.071,632.468 99.651,623.353C108.948,616.425 115.056,607.948 117.972,597.921C119.978,591.358 120.981,578.87 120.981,560.457L120.981,545.143Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "link":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(23.4403,0,0,23.4403,118.723,118.717)">' +
                '        <path fill="' + color + '" d="M9.165,19.281C7.841,20.029 6.218,20.023 4.899,19.261C4.492,19.026 4.084,18.653 3.301,17.87C2.518,17.087 2.146,16.679 1.911,16.272C1.142,14.941 1.142,13.301 1.911,11.971C2.146,11.563 2.518,11.156 3.301,10.373L6.13,7.544C6.913,6.761 7.32,6.389 7.728,6.154C9.059,5.385 10.698,5.385 12.029,6.154C12.436,6.389 12.844,6.761 13.627,7.544C14.41,8.327 14.783,8.735 15.018,9.142C15.786,10.473 15.786,12.113 15.018,13.444L15.013,13.451L15.017,13.445L15.015,13.447L15.015,13.447C15.012,13.452 15.01,13.456 15.007,13.46C15.01,13.456 15.012,13.452 15.015,13.447L15.011,13.455L14.984,13.496C14.989,13.488 14.995,13.479 15.002,13.468C14.954,13.541 14.965,13.524 14.984,13.496C14.959,13.535 14.969,13.524 15.005,13.465C14.856,13.719 14.659,13.975 14.359,14.296C13.868,14.821 13.044,14.849 12.519,14.359C11.994,13.869 11.966,13.044 12.456,12.519C12.596,12.37 12.696,12.26 12.764,12.142C13.067,11.617 13.067,10.969 12.764,10.444C12.604,10.167 12.319,9.917 11.787,9.385C11.254,8.852 11.005,8.568 10.728,8.408C10.202,8.104 9.555,8.104 9.029,8.408C8.752,8.568 8.503,8.852 7.97,9.385L5.142,12.213C4.609,12.746 4.325,12.995 4.165,13.272C3.861,13.798 3.861,14.445 4.165,14.971C4.325,15.248 4.609,15.497 5.142,16.03C5.674,16.562 5.924,16.847 6.201,17.007C6.726,17.31 7.374,17.31 7.899,17.007C8.017,16.938 8.128,16.839 8.277,16.699C8.802,16.209 9.626,16.237 10.116,16.762C10.606,17.288 10.578,18.112 10.053,18.602C9.723,18.91 9.462,19.11 9.201,19.261L9.199,19.261L9.165,19.281ZM15.013,13.451L15.005,13.465L15.011,13.455L15.013,13.451ZM9.165,19.281C9.175,19.275 9.186,19.269 9.197,19.263C9.158,19.285 9.156,19.286 9.165,19.281ZM12.002,17.865L11.97,17.846C11.563,17.611 11.155,17.239 10.372,16.456C9.589,15.673 9.217,15.265 8.982,14.858C8.227,13.551 8.213,11.947 8.94,10.629C8.954,10.605 8.967,10.581 8.981,10.557C8.972,10.572 8.977,10.565 8.982,10.556C8.989,10.545 8.997,10.53 8.982,10.556C9.133,10.295 9.332,10.034 9.641,9.704C10.131,9.179 10.955,9.151 11.48,9.641C12.005,10.131 12.033,10.956 11.543,11.481C11.404,11.63 11.304,11.74 11.236,11.858C10.932,12.383 10.932,13.031 11.236,13.556C11.396,13.833 11.68,14.083 12.213,14.615C12.745,15.148 12.995,15.432 13.272,15.592C13.797,15.896 14.445,15.896 14.97,15.592C15.247,15.432 15.497,15.148 16.029,14.615L18.858,11.787C19.39,11.255 19.674,11.005 19.834,10.728L19.835,10.728C19.831,10.735 19.827,10.742 19.828,10.739C19.819,10.755 19.835,10.728 19.835,10.728L19.835,10.728L19.842,10.716C20.138,10.193 20.136,9.551 19.835,9.03L19.835,9.029C19.675,8.752 19.39,8.503 18.858,7.971C18.325,7.438 18.076,7.153 17.799,6.993C17.273,6.69 16.626,6.69 16.1,6.994C16.054,7.02 16.002,7.034 15.949,7.034C15.949,7.034 16.013,7.044 16.1,6.994C15.982,7.062 15.872,7.162 15.723,7.301C15.197,7.791 14.373,7.763 13.883,7.238C13.393,6.713 13.421,5.888 13.946,5.398C14.277,5.09 14.538,4.89 14.799,4.739C16.13,3.971 17.769,3.971 19.1,4.739C19.507,4.974 19.915,5.347 20.698,6.13C21.481,6.913 21.854,7.321 22.089,7.728C22.857,9.059 22.857,10.699 22.089,12.029C21.854,12.437 21.481,12.844 20.698,13.627L17.87,16.456C17.087,17.239 16.679,17.611 16.272,17.846C14.952,18.609 13.327,18.615 12.002,17.865Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "search-icon-tooltip":
            svgToReturn =
                '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g id="Warning / Info">\n' +
                '        <path id="Vector"\n' +
                '              d="M12 11V16M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 8V8.1L11.9502 8.1002V8H12.0498Z"\n' +
                '              stroke="' +
                color +
                '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
                "    </g>\n" +
                "</svg>";
            break;
        case "arrow-select":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(33.3333,0,0,33.3333,0,0)">' +
                '        <path fill="' + color + '" d="M4.431,8.512C4.7,8.197 5.174,8.161 5.488,8.431L12,14.012L18.512,8.431C18.826,8.161 19.3,8.197 19.57,8.512C19.839,8.826 19.803,9.3 19.488,9.569L12.488,15.57C12.207,15.81 11.793,15.81 11.512,15.57L4.512,9.569C4.197,9.3 4.161,8.826 4.431,8.512Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "arrow-right":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.828729,0,0,0.828729,68.5083,68.5082)">' +
                '        <path fill="' + color + '" d="M441.919,175.251C455.587,161.582 477.746,161.582 491.414,175.251L691.414,375.252C705.084,388.922 705.084,411.078 691.414,424.748L491.414,624.748C477.746,638.417 455.587,638.416 441.919,624.748C428.251,611.078 428.251,588.922 441.919,575.252L582.168,435L133.333,435C114.003,435 98.333,419.33 98.333,400C98.333,380.67 114.003,365 133.333,365L582.168,365L441.919,224.749C428.251,211.081 428.251,188.919 441.919,175.251Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "review":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25.414,0,0,25.414,95.0305,94.4913)">' +
                '        <path fill="' + color + '" d="M8.559,8.036L10.356,4.004C10.563,3.539 10.712,3.244 10.845,3.069L11.09,2.813L11.333,2.656L11.66,2.539L12,2.5L12.34,2.539L12.666,2.656L12.91,2.813L13.155,3.069C13.288,3.244 13.437,3.539 13.644,4.004L15.441,8.036L19.831,8.499C20.337,8.552 20.664,8.603 20.871,8.675L21.19,8.829L21.414,9.012L21.414,9.012L21.627,9.286L21.769,9.598L21.837,9.933L21.826,10.28L21.752,10.56L21.585,10.872C21.46,11.052 21.225,11.285 20.847,11.626L17.568,14.581L18.484,18.899C18.589,19.397 18.642,19.723 18.638,19.943L18.59,20.294L18.485,20.564L18.29,20.85L18.037,21.082L17.739,21.25L17.406,21.347L17.406,21.348L17.117,21.363L16.769,21.301C16.558,21.237 16.265,21.086 15.823,20.832L12,18.626L8.176,20.832C7.735,21.086 7.441,21.237 7.231,21.301L6.883,21.363L6.594,21.348L6.593,21.347L6.26,21.25L5.962,21.082L5.71,20.85L5.515,20.564L5.41,20.294L5.362,19.943C5.357,19.723 5.41,19.397 5.516,18.899L6.432,14.581L3.153,11.626C2.775,11.285 2.54,11.053 2.415,10.872L2.247,10.56L2.173,10.28L2.173,10.28L2.163,9.933L2.231,9.598L2.373,9.286L2.585,9.012L2.81,8.829L3.129,8.675C3.336,8.603 3.663,8.552 4.169,8.499L8.559,8.036ZM4.825,10.441L7.856,13.172C8.1,13.392 8.203,13.519 8.28,13.653L8.28,13.653L8.407,13.939L8.473,14.246L8.473,14.246C8.489,14.399 8.48,14.562 8.412,14.883L7.566,18.875L11.1,16.836C11.384,16.673 11.537,16.614 11.687,16.582L11.689,16.582L12,16.549L12.311,16.582L12.312,16.582C12.463,16.614 12.616,16.673 12.899,16.836L16.434,18.875L15.587,14.883C15.519,14.563 15.511,14.399 15.527,14.246L15.592,13.939L15.719,13.653C15.796,13.52 15.899,13.392 16.143,13.173L19.174,10.441L15.116,10.012C14.79,9.978 14.632,9.936 14.491,9.873L14.491,9.873L14.22,9.716L13.987,9.506C13.884,9.391 13.795,9.254 13.661,8.956L12,5.228L10.338,8.955C10.205,9.255 10.116,9.392 10.013,9.506L10.012,9.506L9.78,9.716L9.508,9.873C9.367,9.936 9.209,9.978 8.883,10.012L4.825,10.441Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "help":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M2,12C2,6.477 6.477,2 12,2C17.523,2 22,6.477 22,12C22,17.523 17.523,22 12,22C6.477,22 2,17.523 2,12ZM12,9C11.702,9 11.434,9.13 11.25,9.339C10.884,9.753 10.252,9.792 9.838,9.427C9.424,9.061 9.385,8.429 9.75,8.015C10.299,7.394 11.104,7 12,7C13.657,7 15,8.343 15,10C15,11.307 14.165,12.417 13,12.829L13,13C13,13.552 12.552,14 12,14C11.448,14 11,13.552 11,13L11,12.5C11,11.628 11.687,11.112 12.248,10.969C12.681,10.859 13,10.466 13,10C13,9.448 12.552,9 12,9ZM12,15C11.448,15 11,15.448 11,16C11,16.552 11.448,17 12,17L12.01,17C12.562,17 13.01,16.552 13.01,16C13.01,15.448 12.562,15 12.01,15L12,15Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "website":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(9.20471,0,0,9.20471,105.449,105.972)">' +
                '        <path fill="' + color + '" d="M59.159,32.212C59.159,32.212 59.141,32.671 59.158,32.242C59.073,34.383 58.814,36.513 58.383,38.612C58.294,39.045 57.871,39.324 57.439,39.235L54.5,38.632C54.067,38.543 53.788,38.121 53.877,37.688C54.115,36.528 54.294,35.357 54.412,34.18L45.987,34.284C45.979,34.513 45.969,34.742 45.957,34.971C45.934,35.412 45.557,35.751 45.116,35.728L42.12,35.57C41.679,35.547 41.34,35.17 41.363,34.729C41.37,34.599 41.376,34.47 41.381,34.34L34.3,34.427L34.3,43.18L37.04,43.18C37.482,43.18 37.84,43.538 37.84,43.98L37.84,46.98C37.84,47.422 37.482,47.78 37.04,47.78L34.3,47.78L34.3,51.542C34.93,50.907 35.542,50.253 36.133,49.58C36.425,49.249 36.931,49.217 37.263,49.508L39.515,51.491C39.846,51.782 39.878,52.288 39.587,52.62C39.253,52.999 38.913,53.373 38.568,53.741C38.778,53.677 38.988,53.61 39.196,53.54C39.615,53.399 40.069,53.624 40.21,54.043L41.167,56.886C41.308,57.305 41.082,57.759 40.664,57.9C37.872,58.839 34.946,59.319 32,59.319C17.1,59.319 4.84,47.058 4.84,32.159C4.84,17.259 17.1,4.999 32,4.999C46.896,4.999 59.155,17.253 59.16,32.179C59.16,32.19 59.16,32.201 59.159,32.212ZM25.519,10.56C21.314,11.837 17.613,14.321 14.824,17.6L21.291,17.6C22.427,15.109 23.844,12.746 25.519,10.56ZM29.7,51.971L29.7,47.78L26.208,47.78C27.282,49.519 28.497,50.867 29.7,51.971ZM37.563,17.6C36.632,15.872 35.54,14.229 34.3,12.695L34.3,17.6L37.563,17.6ZM41.239,29.741C40.996,27.151 40.439,24.62 39.593,22.2L34.3,22.2L34.3,29.827L41.239,29.741ZM24.394,22.2C23.521,24.693 22.957,27.302 22.727,29.969L29.7,29.883L29.7,22.2L24.394,22.2ZM29.7,43.18L29.7,34.483L22.656,34.57C22.809,38.001 23.335,40.827 24.102,43.18L29.7,43.18ZM49.176,17.6C46.385,14.318 42.679,11.833 38.47,10.556C40.143,12.742 41.56,15.105 42.696,17.6L49.176,17.6ZM45.852,29.685L54.411,29.58C54.108,26.962 53.348,24.474 52.215,22.2L44.429,22.2C45.158,24.621 45.639,27.129 45.852,29.685ZM29.7,12.685C28.454,14.223 27.359,15.87 26.425,17.6L29.7,17.6L29.7,12.685ZM9.588,34.73C9.939,37.765 10.903,40.624 12.35,43.18L19.264,43.18C18.621,40.752 18.185,37.93 18.053,34.626L9.588,34.73ZM11.785,22.2C10.573,24.633 9.788,27.31 9.532,30.13L18.108,30.025C18.304,27.354 18.794,24.731 19.558,22.2L11.785,22.2ZM15.787,47.78C18.239,50.323 21.275,52.299 24.67,53.481C23.31,51.966 22.005,50.117 20.915,47.78L15.787,47.78ZM49.458,44.238C49.792,44.654 50.3,45.176 50.868,45.756C53.291,48.231 56.922,51.347 56.922,51.347C57.091,51.492 57.226,51.669 57.321,51.865C57.368,51.963 57.405,52.066 57.432,52.173L57.479,52.5L57.457,52.829C57.439,52.937 57.41,53.043 57.37,53.144C57.33,53.246 57.28,53.343 57.22,53.435L57.013,53.691L54.701,56.008C54.387,56.323 53.956,56.493 53.511,56.476L53.184,56.43C53.077,56.404 52.974,56.367 52.876,56.32C52.778,56.273 52.684,56.215 52.597,56.149L52.357,55.922C52.357,55.922 49.229,52.294 46.752,49.866C46.185,49.311 45.672,48.813 45.259,48.476C44.76,49.455 44.457,50.786 44.457,50.786L44.457,50.788C44.288,51.518 43.634,52.034 42.884,52.027C42.134,52.021 41.49,51.494 41.333,50.761L38.948,39.565L38.914,39.163C38.92,39.029 38.942,38.897 38.98,38.77C39.057,38.516 39.197,38.281 39.392,38.089C39.784,37.706 40.344,37.549 40.877,37.674L51.883,40.251C52.605,40.42 53.117,41.064 53.118,41.806C53.119,42.548 52.61,43.194 51.888,43.365L51.886,43.366C51.886,43.366 50.494,43.691 49.489,44.221L49.458,44.238Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "all-notes":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25.0017,0,0,25.0017,98.2456,99.9735)">' +
                '        <path fill="' + color + '" d="M2.755,14.716C2.15,12.461 1.848,11.333 2.076,10.358C2.255,9.587 2.659,8.887 3.237,8.346C3.911,7.715 4.922,7.409 6.842,6.892L6.824,6.962L6.289,8.956C6.001,10.031 5.761,10.929 5.627,11.678C5.487,12.459 5.436,13.213 5.615,13.982C5.862,15.041 6.418,16.004 7.211,16.747C7.788,17.287 8.466,17.619 9.213,17.889C9.923,18.146 10.812,18.385 11.876,18.67L11.901,18.676L12.008,18.705C12.986,18.967 13.813,19.189 14.509,19.327C14.852,19.395 15.189,19.449 15.523,19.477C15.466,19.537 15.408,19.596 15.347,19.653C14.616,20.338 13.488,20.64 11.233,21.244C8.978,21.848 7.85,22.15 6.875,21.923C6.104,21.743 5.404,21.339 4.864,20.762C4.179,20.031 3.876,18.903 3.272,16.648L2.755,14.716ZM20.829,10.715L20.312,12.647C19.707,14.902 19.405,16.03 18.72,16.761C18.18,17.339 17.48,17.743 16.709,17.922C16.613,17.945 16.515,17.962 16.415,17.974C15.5,18.087 14.383,17.788 12.351,17.244C10.096,16.639 8.968,16.337 8.237,15.652C7.659,15.111 7.255,14.411 7.076,13.641C6.848,12.665 7.15,11.538 7.755,9.283L8.272,7.351C8.359,7.027 8.44,6.725 8.516,6.446C8.971,4.78 9.277,3.863 9.864,3.237C10.404,2.659 11.104,2.255 11.875,2.076C12.85,1.848 13.978,2.15 16.233,2.755C18.488,3.359 19.616,3.661 20.347,4.346C20.924,4.887 21.328,5.587 21.508,6.357C21.736,7.333 21.434,8.46 20.829,10.715ZM11.052,9.806C10.945,10.206 11.183,10.617 11.583,10.724L16.412,12.018C16.813,12.126 17.224,11.888 17.331,11.488C17.438,11.088 17.201,10.677 16.801,10.57L11.971,9.276C11.571,9.168 11.16,9.406 11.052,9.806ZM10.276,12.703C10.168,13.103 10.406,13.515 10.806,13.622L13.704,14.398C14.104,14.506 14.515,14.268 14.622,13.868C14.729,13.468 14.492,13.057 14.092,12.949L11.194,12.173C10.794,12.066 10.383,12.303 10.276,12.703Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "signup":
        case "login":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M20.163,4.093C21.184,4.396 22,5.509 22,6.622L22,17.245C22,18.459 21.286,19.471 20.163,19.875L15.061,21.798C14.755,21.899 14.347,22 14.041,22C13.429,22 12.918,21.798 12.408,21.494C12.204,21.393 12,21.09 11.796,20.887L7.918,20.887C6.286,20.887 5.061,19.572 5.061,18.054L5.061,17.043C5.061,16.638 5.367,16.334 5.878,16.334C6.388,16.334 6.694,16.739 6.694,17.144L6.694,18.156C6.694,18.763 7.204,19.37 7.918,19.37L11.286,19.37L11.286,4.7L7.918,4.7C7.306,4.7 6.694,5.206 6.694,5.914L6.694,6.926C6.694,7.33 6.388,7.735 5.878,7.735C5.367,7.735 5.061,7.33 5.061,6.926L5.061,5.914C5.061,4.396 6.388,3.081 7.918,3.081L11.796,3.081C12,2.879 12.204,2.677 12.51,2.474C13.224,1.968 14.143,1.867 15.061,2.171L20.163,4.093ZM6.388,13.502L7.102,12.996L2.816,12.996C2.306,12.996 2,12.692 2,12.186C2,11.681 2.408,11.377 2.816,11.377L7,11.377L6.286,10.669C5.98,10.365 5.98,9.86 6.286,9.556C6.592,9.253 7.102,9.253 7.408,9.556C7.408,9.556 9.755,11.409 9.755,12.085C9.755,12.761 7.408,14.615 7.408,14.615C7.306,14.716 7.102,14.817 6.898,14.817C6.694,14.817 6.49,14.716 6.388,14.615C6.082,14.311 6.082,13.805 6.388,13.502Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "logout":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '"' +
                '              d="M22,6.622L22,17.245C22,18.358 21.286,19.471 20.163,19.875L15.061,21.798C14.755,21.899 14.449,22 14.041,22C13.531,22 12.918,21.798 12.408,21.494C12.204,21.292 11.898,21.09 11.796,20.887L7.918,20.887C6.388,20.887 5.061,19.673 5.061,18.054L5.061,17.043C5.061,16.638 5.367,16.233 5.878,16.233C6.388,16.233 6.694,16.537 6.694,17.043L6.694,18.054C6.694,18.763 7.306,19.268 7.918,19.268L11.286,19.268L11.286,4.7L7.918,4.7C7.204,4.7 6.694,5.206 6.694,5.914L6.694,6.926C6.694,7.33 6.388,7.735 5.878,7.735C5.367,7.735 5.061,7.33 5.061,6.926L5.061,5.914C5.061,4.396 6.286,3.081 7.918,3.081L11.796,3.081L12.408,2.474C13.224,1.968 14.143,1.867 15.061,2.171L20.163,4.093C21.184,4.396 22,5.509 22,6.622ZM4.857,14.817C4.653,14.817 4.449,14.716 4.347,14.615C4.347,14.615 2,12.928 2,12.085C2,11.242 4.347,9.556 4.347,9.556C4.653,9.253 5.163,9.253 5.469,9.556C5.776,9.86 5.776,10.365 5.469,10.669L4.755,11.377L8.939,11.377C9.347,11.377 9.755,11.681 9.755,12.187C9.755,12.692 9.347,12.794 8.939,12.794L4.653,12.794L5.367,13.502C5.673,13.805 5.673,14.311 5.367,14.615C5.265,14.716 5.061,14.817 4.857,14.817Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "account":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(33.3333,0,0,33.3333,0,0)">' +
                '        <path fill="' + color + '" d="M12,4.5C16.14,4.5 19.5,7.86 19.5,12C19.5,16.14 16.14,19.5 12,19.5C7.86,19.5 4.5,16.14 4.5,12C4.5,7.86 7.86,4.5 12,4.5ZM12,17.4C13.875,17.4 15.533,16.44 16.5,14.985C16.478,13.493 13.493,12.675 12,12.675C10.5,12.675 7.523,13.493 7.5,14.985C8.468,16.44 10.125,17.4 12,17.4ZM12,6.75C10.755,6.75 9.75,7.755 9.75,9C9.75,10.245 10.755,11.25 12,11.25C13.245,11.25 14.25,10.245 14.25,9C14.25,7.755 13.245,6.75 12,6.75Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "password":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(25,0,0,25,100,100)">' +
                '        <path fill="' + color + '" d="M3.172,5.172C4.343,4 6.229,4 10,4L14,4C17.771,4 19.657,4 20.828,5.172C22,6.343 22,8.229 22,12C22,15.771 22,17.657 20.828,18.828C19.657,20 17.771,20 14,20L10,20C6.229,20 4.343,20 3.172,18.828C2,17.657 2,15.771 2,12C2,8.229 2,6.343 3.172,5.172ZM6.733,9.25C6.318,9.25 5.983,9.586 5.983,10L5.983,10.701L5.375,10.351C5.017,10.143 4.558,10.266 4.351,10.625C4.144,10.984 4.267,11.442 4.625,11.649L5.232,12L4.625,12.351C4.266,12.558 4.143,13.016 4.35,13.375C4.558,13.734 5.016,13.857 5.375,13.649L5.983,13.299L5.983,14C5.983,14.414 6.318,14.75 6.733,14.75C7.147,14.75 7.483,14.414 7.483,14L7.483,13.299L8.089,13.649C8.448,13.857 8.907,13.734 9.114,13.375C9.321,13.016 9.198,12.558 8.839,12.351L8.232,12L8.839,11.649C9.198,11.442 9.321,10.984 9.114,10.625C8.907,10.266 8.448,10.143 8.089,10.351L7.483,10.701L7.483,10C7.483,9.586 7.147,9.25 6.733,9.25ZM18.018,10C18.018,9.586 17.682,9.25 17.268,9.25C16.854,9.25 16.518,9.586 16.518,10L16.518,10.701L15.911,10.351C15.552,10.143 15.093,10.266 14.886,10.625C14.679,10.984 14.802,11.442 15.161,11.649L15.768,12L15.16,12.351C14.802,12.558 14.679,13.016 14.886,13.375C15.093,13.734 15.552,13.857 15.91,13.649L16.518,13.299L16.518,14C16.518,14.414 16.854,14.75 17.268,14.75C17.682,14.75 18.018,14.414 18.018,14L18.018,13.299L18.625,13.649C18.983,13.857 19.442,13.734 19.649,13.375C19.856,13.016 19.733,12.558 19.375,12.351L18.768,12L19.374,11.649C19.733,11.442 19.856,10.984 19.649,10.625C19.442,10.266 18.983,10.143 18.624,10.351L18.018,10.701L18.018,10ZM12.75,10C12.75,9.586 12.414,9.25 12,9.25C11.586,9.25 11.25,9.586 11.25,10L11.25,10.701L10.643,10.351C10.284,10.143 9.825,10.266 9.618,10.625C9.411,10.984 9.534,11.442 9.893,11.649L10.5,12L9.893,12.351C9.534,12.558 9.411,13.016 9.618,13.375C9.825,13.734 10.284,13.857 10.643,13.649L11.25,13.299L11.25,14C11.25,14.414 11.586,14.75 12,14.75C12.414,14.75 12.75,14.414 12.75,14L12.75,13.299L13.357,13.649C13.716,13.857 14.174,13.734 14.381,13.375C14.588,13.016 14.466,12.558 14.107,12.351L13.5,12L14.107,11.649C14.465,11.442 14.588,10.984 14.381,10.625C14.174,10.266 13.715,10.143 13.357,10.351L12.75,10.701L12.75,10Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "syncing":
        case "sync":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(10.9215,0,0,10.9215,137.883,137.883)">' +
                '        <path fill="' + color + '" d="M4.1,24.88L4.09,24.88C2.51,24.88 1.21,23.58 1.21,22C1.21,21.904 1.214,21.808 1.224,21.712C2.388,10.076 12.296,1.109 23.991,1.109C29.582,1.109 34.96,3.159 39.12,6.825L39.12,5L39.12,5C39.135,5.701 39.119,4.977 39.119,4.977C39.119,3.397 40.42,2.097 42,2.097C42.145,2.097 42.289,2.108 42.432,2.13C42.444,2.131 42.456,2.133 42.468,2.136C43.88,2.41 44.902,3.669 44.88,5.107L44.88,14C44.88,15.58 43.58,16.88 42,16.88L33,16.88L32.977,16.844C32.977,16.844 32.904,16.726 32.977,16.844L32.977,16.881C31.397,16.881 30.097,15.58 30.097,14C30.097,13.855 30.108,13.711 30.13,13.568C30.131,13.556 30.133,13.544 30.136,13.532C30.41,12.12 31.669,11.098 33.107,11.12L35.254,11.12C32.155,8.42 28.163,6.907 24.007,6.907C15.269,6.907 7.862,13.596 6.976,22.288C6.828,23.756 5.575,24.886 4.1,24.88L4.09,24.865C4.09,24.865 4.036,24.779 4.09,24.865L4.1,24.88ZM39.12,5L39.119,4.983L39.12,5ZM33,16.88L32.977,16.881L32.978,16.845C32.992,16.868 33,16.88 33,16.88ZM8.739,43.141L8.881,43.023C8.881,44.603 7.58,45.903 6,45.903C5.855,45.903 5.711,45.892 5.568,45.87C5.556,45.869 5.544,45.867 5.532,45.864C4.12,45.59 3.098,44.331 3.12,42.893L3.12,34C3.12,32.42 4.42,31.12 6,31.12L15,31.12C14.452,31.132 15,31.12 15,31.12L15.023,31.119C16.603,31.119 17.903,32.42 17.903,34C17.903,34.145 17.892,34.289 17.87,34.432C17.869,34.444 17.867,34.456 17.864,34.468C17.59,35.88 16.331,36.902 14.893,36.88L12.746,36.88C15.845,39.58 19.837,41.093 23.993,41.093C32.731,41.093 40.138,34.404 41.024,25.712C41.172,24.242 42.427,23.112 43.904,23.12C43.325,23.123 43.904,23.12 43.904,23.12L43.91,23.12C45.49,23.12 46.79,24.42 46.79,26C46.79,26.096 46.786,26.192 46.776,26.288C45.612,37.924 35.704,46.891 24.009,46.891C18.418,46.891 13.04,44.841 8.88,41.175L8.88,42.996L8.88,43L8.739,43.141Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "sync-error":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(10.9215,0,0,10.9215,137.883,137.883)">' +
                '        <path fill="' + color + '" d="M32.977,16.881C31.397,16.881 30.097,15.58 30.097,14C30.097,13.855 30.108,13.711 30.13,13.568C30.131,13.556 30.133,13.544 30.136,13.532C30.41,12.12 31.669,11.098 33.107,11.12L35.254,11.12C32.155,8.42 28.163,6.907 24.007,6.907C15.269,6.907 7.862,13.596 6.976,22.288C6.828,23.756 5.575,24.886 4.1,24.88L4.09,24.88C2.51,24.88 1.21,23.58 1.21,22C1.21,21.904 1.214,21.808 1.224,21.712C2.388,10.076 12.296,1.109 23.991,1.109C29.582,1.109 34.96,3.159 39.12,6.825L39.12,5.022C39.123,5.169 39.133,5.591 39.12,5L39.12,5.022L39.119,4.977C39.119,3.397 40.42,2.097 42,2.097C42.145,2.097 42.289,2.108 42.432,2.13C42.444,2.131 42.456,2.133 42.468,2.136C43.88,2.41 44.902,3.669 44.88,5.107L44.88,14C44.88,15.58 43.58,16.88 42,16.88L33,16.88L32.977,16.881L32.978,16.845L32.977,16.844L32.977,16.881ZM8.739,43.141L8.881,43.023C8.881,44.603 7.58,45.903 6,45.903C5.855,45.903 5.711,45.892 5.568,45.87C5.556,45.869 5.544,45.867 5.532,45.864C4.12,45.59 3.098,44.331 3.12,42.893L3.12,34C3.12,32.42 4.42,31.12 6,31.12L15,31.12L15.017,31.119L15.023,31.119C16.603,31.119 17.903,32.42 17.903,34C17.903,34.145 17.892,34.289 17.87,34.432C17.869,34.444 17.867,34.456 17.864,34.468C17.59,35.88 16.331,36.902 14.893,36.88L12.746,36.88C15.845,39.58 19.837,41.093 23.993,41.093C32.731,41.093 40.138,34.404 41.024,25.712C41.172,24.242 42.427,23.112 43.904,23.12L43.91,23.12C45.49,23.12 46.79,24.42 46.79,26C46.79,26.096 46.786,26.192 46.776,26.288C45.612,37.924 35.704,46.891 24.009,46.891C18.418,46.891 13.04,44.841 8.88,41.175L8.88,43L8.739,43.141ZM24,28.092C22.42,28.092 21.12,26.792 21.12,25.212L21.12,15.212C21.12,13.632 22.42,12.332 24,12.332C25.58,12.332 26.88,13.632 26.88,15.212L26.88,25.212C26.88,26.792 25.58,28.092 24,28.092ZM24,29.908C25.59,29.908 26.88,31.198 26.88,32.788C26.88,34.378 25.59,35.668 24,35.668C22.41,35.668 21.12,34.378 21.12,32.788C21.12,31.198 22.41,29.908 24,29.908Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "code":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(1.07228,0,0,1.07228,125.496,123.928)">' +
                '        <path fill="' + color + '" d="M391,233.948C415.659,234.02 435.928,254.289 436,278.948L436,440.948C435.928,465.607 415.659,485.876 391,485.948L121,485.948C96.341,485.876 76.072,465.607 76,440.948L76,278.948C76.072,254.289 96.341,234.02 121,233.948L391,233.948ZM184.123,369.379L167.789,359.949L184.123,350.518C187.17,348.75 189.051,345.483 189.051,341.96C189.051,336.531 184.584,332.065 179.155,332.065C177.426,332.065 175.726,332.518 174.227,333.379L157.897,342.808L157.897,323.949C157.897,318.52 153.429,314.052 148,314.052C142.571,314.052 138.104,318.52 138.104,323.949L138.104,342.808L121.774,333.379C120.274,332.518 118.574,332.065 116.845,332.065C111.416,332.065 106.949,336.531 106.949,341.96C106.949,345.483 108.83,348.75 111.877,350.518L128.212,359.949L111.877,369.379C108.83,371.148 106.949,374.415 106.949,377.938C106.949,383.366 111.416,387.833 116.845,387.833C118.574,387.833 120.274,387.38 121.774,386.518L138.104,377.089L138.104,395.949C138.104,401.378 142.571,405.845 148,405.845C153.429,405.845 157.897,401.378 157.897,395.949L157.897,377.089L174.227,386.518C175.735,387.394 177.449,387.855 179.194,387.855C184.623,387.855 189.09,383.388 189.09,377.96C189.09,374.421 187.191,371.142 184.123,369.379ZM292.123,369.379L275.789,359.949L292.123,350.518C295.17,348.75 297.051,345.483 297.051,341.96C297.051,336.531 292.584,332.065 287.155,332.065C285.426,332.065 283.726,332.518 282.227,333.379L265.897,342.808L265.897,323.949C265.897,318.52 261.429,314.052 256,314.052C250.571,314.052 246.104,318.52 246.104,323.949L246.104,342.808L229.774,333.379C228.274,332.518 226.574,332.065 224.845,332.065C219.416,332.065 214.949,336.531 214.949,341.96C214.949,345.483 216.83,348.75 219.877,350.518L236.212,359.949L219.877,369.379C216.83,371.148 214.949,374.415 214.949,377.938C214.949,383.366 219.416,387.833 224.845,387.833C226.574,387.833 228.274,387.38 229.774,386.518L246.104,377.089L246.104,395.949C246.104,401.378 250.571,405.845 256,405.845C261.429,405.845 265.897,401.378 265.897,395.949L265.897,377.089L282.227,386.518C283.735,387.394 285.449,387.855 287.194,387.855C292.623,387.855 297.09,383.388 297.09,377.96C297.09,374.421 295.191,371.142 292.123,369.379ZM400.123,369.379L383.789,359.949L400.123,350.518C403.17,348.75 405.051,345.483 405.051,341.96C405.051,336.531 400.584,332.065 395.155,332.065C393.426,332.065 391.726,332.518 390.227,333.379L373.897,342.808L373.897,323.949C373.897,318.52 369.429,314.052 364,314.052C358.571,314.052 354.104,318.52 354.104,323.949L354.104,342.808L337.774,333.379C336.274,332.518 334.574,332.065 332.845,332.065C327.416,332.065 322.949,336.531 322.949,341.96C322.949,345.483 324.83,348.75 327.877,350.518L344.212,359.949L327.877,369.379C324.83,371.148 322.949,374.415 322.949,377.938C322.949,383.366 327.416,387.833 332.845,387.833C334.574,387.833 336.274,387.38 337.774,386.518L354.104,377.089L354.104,395.949C354.104,401.378 358.571,405.845 364,405.845C369.429,405.845 373.897,401.378 373.897,395.949L373.897,377.089L390.227,386.518C391.735,387.394 393.449,387.855 395.194,387.855C400.623,387.855 405.09,383.388 405.09,377.96C405.09,374.421 403.191,371.142 400.123,369.379ZM164.297,143.949L164.297,214.147C164.296,217.682 161.431,220.547 157.897,220.547L138.103,220.547C134.569,220.547 131.704,217.682 131.704,214.147L131.704,143.949C131.704,75.762 187.813,19.652 256,19.652C324.187,19.652 380.297,75.762 380.297,143.949L380.297,214.147C380.297,217.682 377.431,220.547 373.897,220.547L354.103,220.547C350.569,220.547 347.704,217.682 347.704,214.147L347.704,143.949C347.704,93.642 306.307,52.245 256,52.245C205.693,52.245 164.297,93.642 164.297,143.949Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "code-block":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(24.0385,0,0,24.0385,111.538,111.539)">' +
                '        <path fill="' + color + '" d="M6.05,6.971C6.618,6.447 7.505,6.483 8.029,7.05C8.553,7.618 8.517,8.505 7.95,9.029L4.981,11.769L8.026,15.047C8.552,15.614 8.519,16.5 7.953,17.026C7.386,17.552 6.5,17.519 5.974,16.953L1.974,12.645C1.721,12.372 1.587,12.01 1.601,11.638C1.615,11.267 1.777,10.916 2.05,10.664L6.05,6.971ZM16.05,9.029C15.483,8.505 15.447,7.618 15.971,7.05C16.495,6.483 17.382,6.447 17.95,6.971L21.95,10.664C22.223,10.916 22.385,11.267 22.399,11.638C22.413,12.01 22.279,12.372 22.026,12.645L18.026,16.953C17.5,17.519 16.614,17.552 16.047,17.026C15.481,16.5 15.448,15.614 15.974,15.047L19.019,11.769L16.05,9.029ZM11.728,5.489C11.915,4.739 12.676,4.283 13.425,4.47C14.175,4.657 14.632,5.418 14.444,6.168L11.358,18.511C11.171,19.261 10.41,19.717 9.66,19.53C8.911,19.343 8.454,18.582 8.642,17.832L11.728,5.489Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "clear-formatting":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(33.0043,0,0,33.0043,135.982,125.639)">' +
                '        <path fill="' + color + '" d="M7.944,2.348C7.926,2.33 7.911,2.308 7.901,2.284C7.87,2.209 7.887,2.123 7.945,2.066C8.798,1.212 10.202,1.212 11.055,2.066L14.934,5.945C15.788,6.798 15.788,8.202 14.934,9.055L9.434,14.555C9.022,14.968 8.462,15.2 7.879,15.2L5.12,15.2C4.537,15.2 3.977,14.968 3.565,14.555L1.065,12.055C0.211,11.202 0.211,9.798 1.065,8.945L7.944,2.066C7.886,2.123 7.869,2.209 7.9,2.284C7.91,2.308 7.925,2.33 7.944,2.348L7.944,2.348ZM10.066,3.055C9.755,2.745 9.245,2.745 8.934,3.055L4.443,7.547L9.453,12.557L13.945,8.066C14.255,7.755 14.255,7.245 13.945,6.934L10.066,3.055ZM8.464,13.548L3.453,8.537L2.055,9.934C1.745,10.245 1.745,10.755 2.055,11.066L4.555,13.566C4.705,13.716 4.909,13.8 5.121,13.8L7.88,13.8C8.092,13.8 8.296,13.716 8.446,13.566L8.464,13.548Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "superscript":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.682859,0,0,0.682859,89.0718,113.08)">' +
                '        <path fill="' + color + '" d="M277.897,706.503L277.897,211.425L99.225,211.425C93.702,211.425 89.225,206.947 89.225,201.425L89.225,133.846C89.225,128.324 93.702,123.846 99.225,123.846L553.131,123.846C558.654,123.846 563.131,128.324 563.131,133.846L563.131,201.425C563.131,206.947 558.654,211.425 553.131,211.425L373.678,211.425L373.678,706.503C373.678,712.026 369.201,716.503 363.678,716.503L287.897,716.503C282.374,716.503 277.897,712.026 277.897,706.503ZM571.673,371.136L661.24,137.913C663.658,131.617 669.705,127.463 676.447,127.463L709.697,127.463C716.31,127.463 722.268,131.461 724.773,137.583L820.227,370.805C822.282,375.829 821.701,381.547 818.676,386.055C815.651,390.563 810.578,393.267 805.15,393.267L769.991,393.267C763.253,393.267 757.211,389.118 754.789,382.831L731.604,322.631L656.687,322.631L634.968,382.53C632.631,388.974 626.509,393.267 619.654,393.267L586.882,393.267C581.516,393.267 576.493,390.625 573.455,386.202C570.417,381.78 569.751,376.144 571.673,371.136ZM693.631,222.287L677.669,264.915L709.693,264.915L693.66,222.365L693.631,222.287Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "subscript":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.843659,0,0,0.843659,15.8545,45.516)">' +
                '        <path fill="' + color + '" d="M311.716,651.929L311.716,251.212L167.098,251.212C162.628,251.212 159.004,247.588 159.004,243.118L159.004,188.42C159.004,183.95 162.628,180.326 167.098,180.326L534.491,180.326C538.961,180.326 542.585,183.95 542.585,188.42L542.585,243.118C542.585,247.588 538.961,251.212 534.491,251.212L389.241,251.212L389.241,651.929C389.241,656.4 385.617,660.023 381.147,660.023L319.81,660.023C315.34,660.023 311.716,656.4 311.716,651.929ZM549.499,642.111L621.994,453.34C623.952,448.243 628.846,444.881 634.303,444.881L661.216,444.881C666.568,444.881 671.391,448.117 673.418,453.072L750.679,641.843C752.342,645.91 751.872,650.538 749.424,654.186C746.975,657.835 742.869,660.023 738.476,660.023L710.018,660.023C704.564,660.023 699.674,656.665 697.713,651.576L678.947,602.85L618.309,602.85L600.73,651.333C598.838,656.549 593.883,660.023 588.335,660.023L561.809,660.023C557.466,660.023 553.4,657.885 550.941,654.305C548.482,650.727 547.943,646.164 549.499,642.111ZM648.212,521.632L635.292,556.135L661.212,556.135L648.235,521.696L648.212,521.632Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h1":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(1.17994,0,0,1.17994,-74.8706,-71.9764)">' +
                '        <path fill="' + color + '" d="M213.452,538.894L213.452,262.47C213.452,259.608 215.772,257.288 218.634,257.288L255.214,257.288C258.075,257.288 260.395,259.608 260.395,262.47L260.395,370.8L393.712,370.8L393.712,262.47C393.712,259.608 396.032,257.288 398.895,257.288L435.474,257.288C438.336,257.288 440.656,259.608 440.656,262.47L440.656,538.894C440.656,541.756 438.336,544.075 435.474,544.075L398.895,544.075C396.032,544.075 393.712,541.756 393.712,538.894L393.712,413.783L260.395,413.783L260.395,538.894C260.395,541.756 258.075,544.075 255.214,544.075L218.634,544.075C215.772,544.075 213.452,541.756 213.452,538.894ZM586.273,543.843L552.333,543.843C549.47,543.843 547.15,541.524 547.15,538.661L547.15,333.749C540.264,339.246 532.153,344.745 522.809,350.235C509.241,358.209 497.049,364.179 486.246,368.165C484.656,368.752 482.88,368.524 481.489,367.555C480.098,366.586 479.27,364.998 479.27,363.304L479.27,330.495C479.27,328.487 480.43,326.66 482.247,325.806C500.75,317.105 516.931,306.575 530.778,294.2C544.397,282.027 554.09,270.257 559.756,258.808C560.63,257.042 562.429,255.925 564.4,255.925L586.273,255.925C589.134,255.925 591.454,258.244 591.454,261.106L591.454,538.661C591.454,541.524 589.134,543.843 586.273,543.843Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h2":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.906754,0,0,0.906754,37.2985,37.2985)">' +
                '        <path fill="' + color + '" d="M124.811,579.838L124.811,221.928C124.811,217.706 128.233,214.284 132.455,214.284L179.818,214.284C184.04,214.284 187.462,217.706 187.462,221.928L187.462,361.257L358.21,361.257L358.21,221.928C358.21,217.706 361.632,214.284 365.854,214.284L413.217,214.284C417.439,214.284 420.861,217.706 420.861,221.928L420.861,579.838C420.861,584.06 417.439,587.482 413.217,587.482L365.854,587.482C361.632,587.482 358.21,584.06 358.21,579.838L358.21,418.781L187.462,418.781L187.462,579.838C187.462,584.06 184.04,587.482 179.818,587.482L132.455,587.482C128.233,587.482 124.811,584.06 124.811,579.838ZM675.189,537.301L675.189,579.537C675.189,583.759 671.767,587.181 667.545,587.181L430.973,587.181C426.843,587.181 423.46,583.901 423.332,579.772C422.975,568.174 424.85,557.021 428.951,546.313C435.258,529.448 445.319,512.819 459.203,496.465C472.699,480.567 492.178,462.166 517.68,441.301C555.899,409.958 581.787,385.195 595.22,366.885C607.746,349.811 614.247,333.761 614.247,318.551C614.247,303.315 608.81,290.461 597.918,279.995C586.836,269.347 572.326,264.183 554.508,264.183C535.63,264.183 520.459,269.661 509.132,280.987C497.746,292.373 492.229,308.227 492.084,328.371C492.068,330.525 491.145,332.572 489.541,334.009C487.937,335.446 485.802,336.14 483.659,335.92L438.493,331.282C434.326,330.854 431.279,327.151 431.662,322.979C434.961,287.029 447.617,259.742 469.152,240.898C490.602,222.13 519.331,212.518 555.484,212.518C592.08,212.518 620.963,222.895 642.295,243.187C663.884,263.723 674.701,289.164 674.701,319.527C674.701,334.86 671.579,349.935 665.307,364.745C659.171,379.231 649.039,394.52 634.808,410.542C621.057,426.021 598.226,447.283 566.279,474.291L566.259,474.308C540.229,496.16 523.501,510.964 516.109,518.757C512.671,522.383 509.52,526.015 506.659,529.657L667.545,529.657C671.767,529.657 675.189,533.079 675.189,537.301Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h3":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.679997,0,0,0.679997,128,128)">' +
                '        <path fill="' + color + '" d="M36.499,631.972L36.499,162.415C36.499,156.838 41.019,152.317 46.596,152.317L108.733,152.317C114.31,152.317 118.83,156.838 118.83,162.415L118.83,345.137L342.705,345.137L342.705,162.415C342.705,156.838 347.224,152.317 352.801,152.317L414.939,152.317C420.516,152.317 425.035,156.838 425.035,162.415L425.035,631.972C425.035,637.547 420.516,642.068 414.939,642.068L352.801,642.068C347.224,642.068 342.705,637.547 342.705,631.972L342.705,420.743L118.83,420.743L118.83,631.972C118.83,637.547 114.31,642.068 108.733,642.068L46.596,642.068C41.019,642.068 36.499,637.547 36.499,631.972ZM444.586,497.612L502.239,489.925C507.505,489.223 512.415,492.722 513.469,497.929C519.558,527.977 529.514,549.821 544.145,563.076C558.189,575.802 575.327,582.083 595.5,582.083C619.786,582.083 640.31,573.703 657.043,556.874C673.815,540.006 682.132,519.086 682.132,494.168C682.132,470.606 674.56,451.126 659.167,435.83C643.75,420.508 624.095,412.981 600.304,412.981C590.098,412.981 577.403,415.053 562.196,419.054C558.95,419.908 555.493,419.095 552.971,416.883C550.446,414.671 549.187,411.351 549.608,408.022L556.014,357.414C556.707,351.942 561.665,348.038 567.147,348.646C570.53,349.023 573.253,349.226 575.321,349.226C597.83,349.226 618.099,343.392 636.107,331.648C652.898,320.697 660.992,303.665 660.992,280.851C660.992,262.642 654.921,247.523 642.598,235.569C630.124,223.468 613.952,217.599 594.218,217.599C574.586,217.599 558.18,223.649 545.092,235.989C531.556,248.751 523.19,268.047 519.322,293.574C518.915,296.266 517.437,298.679 515.225,300.266C513.012,301.852 510.253,302.479 507.572,302.002L449.918,291.753C447.274,291.282 444.926,289.778 443.393,287.573C441.861,285.368 441.271,282.643 441.752,280C449.268,238.777 466.541,206.937 493.189,184.276C519.94,161.526 553.154,150 592.938,150C620.223,150 645.343,155.887 668.31,167.597C691.669,179.508 709.489,195.808 721.863,216.392C734.268,237.028 740.442,258.946 740.442,282.131C740.442,304.442 734.438,324.751 722.46,343.068C714.481,355.272 703.962,365.838 690.85,374.705C710.3,382.798 726.122,394.934 738.377,411.017C755.004,432.841 763.503,460.093 763.503,492.888C763.503,536.758 747.521,573.949 715.533,604.452C683.787,634.724 643.704,650.002 595.18,650.002C551.23,650.002 514.794,636.755 485.761,610.567C456.666,584.326 439.978,550.368 435.871,508.61C435.339,503.194 439.193,498.331 444.586,497.612Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h4":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.679997,0,0,0.679997,128,128)">' +
                '        <path fill="' + color + '" d="M426.496,534.758L426.496,639.73C426.496,645.404 421.895,650.003 416.222,650.003L352.828,650.003C347.154,650.003 342.555,645.404 342.555,639.73L342.555,424.202L114.098,424.202L114.098,639.73C114.098,645.404 109.498,650.003 103.824,650.003L40.43,650.003C34.756,650.003 30.157,645.404 30.157,639.73L30.157,160.678C30.157,155.003 34.756,150.404 40.43,150.404L103.824,150.404C109.498,150.404 114.098,155.003 114.098,160.678L114.098,347.123L342.555,347.123L342.555,160.678C342.555,155.003 347.154,150.404 352.828,150.404L416.222,150.404C421.895,150.404 426.496,155.003 426.496,160.678L426.496,455.321L638.436,154.359C640.36,151.627 643.494,150.001 646.836,150.001L694.872,150.001C700.546,150.001 705.145,154.6 705.145,160.274L705.145,460.437L759.574,460.437C765.248,460.437 769.847,465.037 769.847,470.711L769.847,524.628C769.847,530.302 765.248,534.902 759.574,534.902L705.145,534.902L705.145,639.327C705.145,645.001 700.546,649.6 694.872,649.6L636.052,649.6C630.378,649.6 625.779,645.001 625.779,639.327L625.779,534.902L428.224,534.902C427.635,534.902 427.058,534.853 426.496,534.758ZM625.779,460.437L625.779,287.52L505.704,460.437L625.779,460.437Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h5":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.998719,0,0,0.998719,0.511286,0.511286)">' +
                '        <path fill="' + color + '" d="M150.001,558.065L150.001,236.728C150.001,232.893 153.11,229.783 156.946,229.783L199.469,229.783C203.304,229.783 206.413,232.893 206.413,236.728L206.413,361.738L359.55,361.738L359.55,236.728C359.55,232.893 362.659,229.783 366.495,229.783L409.018,229.783C412.853,229.783 415.962,232.893 415.962,236.728L415.962,558.065C415.962,561.9 412.853,565.009 409.018,565.009L366.495,565.009C362.659,565.009 359.55,561.9 359.55,558.065L359.55,413.547L206.413,413.547L206.413,558.065C206.413,561.9 203.304,565.009 199.469,565.009L156.946,565.009C153.11,565.009 150.001,561.9 150.001,558.065ZM429.415,466.704L470.842,463.197C474.485,462.889 477.744,465.458 478.293,469.073C481.079,487.376 487.322,501.241 497.469,510.46C507.353,519.439 519.286,523.89 533.24,523.89C550.227,523.89 564.588,517.46 576.348,504.656C588.401,491.53 594.246,474.058 594.246,452.362C594.246,431.935 588.723,415.744 577.25,403.939C565.891,392.251 550.968,386.535 532.583,386.535C521.134,386.535 510.794,389.099 501.582,394.296C492.401,399.477 485.167,406.175 479.921,414.438C478.474,416.717 475.838,417.951 473.162,417.602L436.118,412.78C434.224,412.534 432.514,411.517 431.393,409.97C430.272,408.424 429.836,406.484 430.191,404.607L461.316,239.554C461.935,236.273 464.801,233.897 468.141,233.897L627.932,233.897C631.767,233.897 634.876,237.006 634.876,240.841L634.876,278.543C634.876,282.377 631.767,285.487 627.932,285.487L505.395,285.487L492.318,350.703C508.636,342.077 525.571,337.794 543.105,337.794C573.112,337.794 598.422,348.212 619.052,368.999C639.611,389.714 650.001,416.304 650.001,448.856C650.001,479.609 640.986,506.174 623.062,528.583C601.119,556.276 571.208,570.219 533.24,570.219C502.114,570.219 476.758,561.354 457.071,543.924C437.288,526.409 425.904,503.228 423.089,474.297C422.909,472.448 423.477,470.605 424.666,469.178C425.854,467.752 427.565,466.861 429.415,466.704Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "h6":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.680003,0,0,0.680003,128,128)">' +
                '        <path fill="' + color + '" d="M36.423,632.282L36.423,162.418C36.423,156.84 40.944,152.318 46.522,152.318L108.7,152.318C114.279,152.318 118.8,156.84 118.8,162.418L118.8,345.264L342.829,345.264L342.829,162.418C342.829,156.84 347.35,152.318 352.929,152.318L415.107,152.318C420.685,152.318 425.206,156.84 425.206,162.418L425.206,632.282C425.206,637.859 420.685,642.381 415.107,642.381L352.929,642.381C347.35,642.381 342.829,637.859 342.829,632.282L342.829,420.911L118.8,420.911L118.8,632.282C118.8,637.859 114.279,642.381 108.7,642.381L46.522,642.381C40.944,642.381 36.423,637.859 36.423,632.282ZM745.93,287.153L688.559,291.64C683.559,292.03 679.029,288.693 677.921,283.802C673.295,263.368 667.059,248.375 658.568,239.077C644.967,224.773 628.203,217.634 608.285,217.634C592.196,217.634 578.05,222.062 565.888,231.043L565.84,231.078C549.058,243.319 535.954,261.281 526.28,284.776C518.54,303.573 513.756,328.495 511.754,359.516C522.302,348.742 534.045,340.07 546.963,333.473C568.507,322.472 591.088,316.984 614.696,316.984C656.012,316.984 691.2,332.164 720.236,362.576C749,392.705 763.575,431.573 763.575,479.325C763.575,510.438 756.846,539.349 743.431,566.067C729.81,593.195 711.043,613.922 687.234,628.345C663.471,642.741 636.525,649.998 606.362,649.998C555.143,649.998 513.396,631.106 481.071,593.431C449.559,556.703 433.125,496.349 433.125,412.018C433.125,318.214 451.058,250.169 485.709,207.571L485.717,207.562C516.942,169.272 558.934,150 611.811,150C651.516,150 683.977,161.336 709.338,183.598C734.707,205.867 750.108,236.537 755.159,275.795C755.512,278.539 754.724,281.307 752.981,283.454C751.236,285.6 748.688,286.937 745.93,287.153ZM519.669,479.645C519.669,498.035 523.577,515.632 531.388,532.44C538.941,548.692 549.432,561.135 563.009,569.644C576.481,578.088 590.6,582.364 605.401,582.364C626.86,582.364 645.246,573.575 660.682,556.258C676.71,538.274 684.403,513.735 684.403,482.85C684.403,453.322 676.866,429.948 661.129,412.95C645.789,396.378 626.452,388.143 603.157,388.143C579.935,388.143 560.235,396.47 544.056,413.126C527.652,430.012 519.669,452.239 519.669,479.645Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "small":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.831485,0,0,0.831485,67.4061,67.4061)">' +
                '        <path fill="' + color + '" d="M616.198,292.969L668.389,237.607C669.993,235.907 672.225,234.944 674.562,234.944C676.899,234.944 679.131,235.907 680.735,237.607L698.356,256.299C701.437,259.567 701.437,264.669 698.356,267.937L601.426,370.756C599.822,372.457 597.59,373.42 595.252,373.42C592.917,373.42 590.683,372.457 589.081,370.756L492.149,267.937C489.069,264.669 489.069,259.567 492.149,256.299L509.772,237.607C511.374,235.907 513.606,234.944 515.944,234.944C518.279,234.944 520.513,235.907 522.115,237.607L574.307,292.969L574.307,153.429C574.307,148.744 578.105,144.947 582.791,144.947L607.715,144.947C612.4,144.947 616.198,148.744 616.198,153.429L616.198,292.969ZM616.198,507.031L616.198,646.571C616.198,651.256 612.4,655.053 607.715,655.053L582.791,655.053C578.105,655.053 574.307,651.256 574.307,646.571L574.307,507.031L522.115,562.393C520.513,564.093 518.279,565.056 515.944,565.056C513.606,565.056 511.374,564.093 509.772,562.393L492.149,543.701C489.069,540.433 489.069,535.331 492.149,532.063L589.081,429.244C590.683,427.543 592.917,426.58 595.252,426.58C597.59,426.58 599.822,427.543 601.426,429.244L698.356,532.063C701.437,535.331 701.437,540.433 698.356,543.701L680.735,562.393C679.131,564.093 676.899,565.056 674.562,565.056C672.225,565.056 669.993,564.093 668.389,562.393L616.198,507.031ZM209.236,525.887L171.519,640.18C170.372,643.657 167.124,646.005 163.464,646.005L107.816,646.005C105.074,646.005 102.502,644.68 100.91,642.448C99.318,640.216 98.903,637.352 99.795,634.761L263.346,159.717C264.524,156.293 267.746,153.995 271.366,153.995L335.837,153.995C339.418,153.995 342.613,156.244 343.822,159.615L514.158,634.659C515.09,637.257 514.7,640.146 513.11,642.404C511.522,644.662 508.933,646.005 506.173,646.005L450.526,646.005C446.905,646.005 443.683,643.707 442.505,640.283L403.12,525.887L209.236,525.887ZM304.124,238.348L229.615,464.131L381.858,464.131L304.124,238.348Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "big":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(0.831485,0,0,0.831485,109.767,67.4061)">' +
                '        <path fill="' + color + '" d="M565.251,225.398L565.251,364.938C565.251,369.623 561.453,373.421 556.768,373.421L531.844,373.421C527.159,373.421 523.361,369.623 523.361,364.938L523.361,225.398L471.169,280.76C469.566,282.46 467.333,283.424 464.997,283.424C462.66,283.424 460.427,282.46 458.824,280.76L441.202,262.068C438.122,258.8 438.122,253.698 441.202,250.43L538.134,147.611C539.736,145.911 541.97,144.947 544.306,144.947C546.643,144.947 548.876,145.911 550.479,147.611L647.41,250.43C650.491,253.698 650.491,258.8 647.41,262.068L629.788,280.76C628.185,282.46 625.952,283.424 623.616,283.424C621.279,283.424 619.046,282.46 617.443,280.76L565.251,225.398ZM565.251,574.602L617.443,519.24C619.046,517.54 621.279,516.576 623.616,516.576C625.952,516.576 628.185,517.54 629.788,519.24L647.41,537.932C650.491,541.2 650.491,546.302 647.41,549.57L550.479,652.389C548.876,654.089 546.643,655.053 544.306,655.053C541.97,655.053 539.736,654.089 538.134,652.389L441.202,549.57C438.122,546.302 438.122,541.2 441.202,537.932L458.824,519.24C460.427,517.54 462.66,516.576 464.997,516.576C467.333,516.576 469.566,517.54 471.169,519.24L523.361,574.602L523.361,435.062C523.361,430.377 527.159,426.579 531.844,426.579L556.768,426.579C561.453,426.579 565.251,430.377 565.251,435.062L565.251,574.602ZM158.289,525.886L120.573,640.18C119.426,643.656 116.178,646.004 112.517,646.004L56.869,646.004C54.128,646.004 51.556,644.679 49.964,642.447C48.371,640.216 47.956,637.352 48.849,634.76L212.399,159.717C213.578,156.294 216.799,153.996 220.42,153.996L284.89,153.996C288.472,153.996 291.666,156.244 292.875,159.616L463.212,634.658C464.144,637.257 463.753,640.146 462.164,642.403C460.575,644.661 457.987,646.004 455.227,646.004L399.579,646.004C395.958,646.004 392.737,643.706 391.558,640.283L352.173,525.886L158.289,525.886ZM253.178,238.348L178.669,464.131L330.912,464.131L253.178,238.348Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "highlighter":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(1.1782,0,0,1.1782,177.885,151.789)">' +
                '        <path fill="' + color + '" d="M405.333,381.71L362.667,424.376L85.333,424.376L128,381.71L405.333,381.71ZM41.168,299.372L103.67,361.874L42.667,392.376L0,403.043L10.667,360.376L41.168,299.372ZM61.1,191.304L212.137,342.341L206.972,347.655L201.097,347.365L194.944,347.269C184.457,347.272 172.809,348.085 160,349.71L151.97,350.837L144.124,352.129L136.617,353.518L127.387,355.421L48.949,276.983C50.507,270.71 52.086,262.939 53.333,253.71C55.865,234.979 56.794,216.011 56.122,196.806L59.428,193.084L61.1,191.304ZM282.327,0L403.007,120.68L384.971,143.929L352.416,185.429L333.317,209.394L316.303,230.396L304.91,244.205L291.543,260.024L282.885,269.945L275.4,278.199L269.086,284.788L254.094,299.615L227.035,327.069L75.976,176.01L78.539,173.389L116.393,135.765L128.06,124.569L141.034,112.688L152.353,102.69L164.509,92.253L177.5,81.378L191.328,70.064L205.992,58.312L229.556,39.861L246.31,27.013L263.901,13.726L282.327,0Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "edit":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(33.1988,0,0,33.1988,123.678,142.693)">' +
                '        <path fill="' + color + '" d="M15.662,1.808C15.922,2.083 15.917,2.523 15.649,2.792L14.606,3.836C14.567,3.875 14.514,3.897 14.459,3.897C14.404,3.897 14.351,3.875 14.313,3.836L12.313,1.836C12.232,1.756 12.232,1.625 12.312,1.544L13.356,0.5C13.63,0.225 14.081,0.225 14.355,0.5L15.648,1.793C15.653,1.797 15.658,1.802 15.662,1.808ZM15.614,2.114C15.649,2.092 15.677,2.059 15.693,2.019C15.704,1.993 15.709,1.966 15.709,1.939C15.709,1.966 15.704,1.993 15.693,2.018C15.677,2.058 15.649,2.091 15.614,2.113C15.614,2.114 15.614,2.114 15.614,2.114ZM13.959,4.396C13.959,4.423 13.954,4.45 13.943,4.475C13.932,4.502 13.916,4.525 13.897,4.544L13.898,4.543L7.085,11.357L7.085,11.358C7.007,11.435 6.912,11.493 6.808,11.528L4.394,12.333C4.348,12.348 4.299,12.356 4.25,12.356C4,12.356 3.793,12.149 3.793,11.899C3.793,11.85 3.801,11.801 3.816,11.755L4.621,9.341C4.656,9.236 4.715,9.141 4.793,9.064L11.606,2.25C11.644,2.211 11.697,2.189 11.752,2.189C11.807,2.189 11.86,2.211 11.898,2.25L13.898,4.25C13.938,4.289 13.959,4.342 13.959,4.396ZM13.754,4.603L13.753,4.603L13.752,4.604L13.754,4.603ZM0.793,13.5L0.793,2.5C0.793,1.563 1.563,0.793 2.5,0.793L9,0.793C9.388,0.793 9.707,1.112 9.707,1.5C9.707,1.888 9.388,2.207 9,2.207L2.5,2.207C2.339,2.207 2.207,2.339 2.207,2.5L2.207,13.5C2.207,13.661 2.339,13.793 2.5,13.793L13.5,13.793C13.661,13.793 13.793,13.661 13.793,13.5L13.793,7.5C13.793,7.112 14.112,6.793 14.5,6.793C14.888,6.793 15.207,7.112 15.207,7.5L15.207,13.5C15.207,14.437 14.437,15.207 13.5,15.207L2.5,15.207C1.563,15.207 0.793,14.437 0.793,13.5Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "finish-edit":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(17.8571,0,0,17.8571,114.286,114.286)">' +
                '        <path fill="' + color + '"' +
                '              d="M28,2L4,2C2.9,2 2,2.9 2,4L2,28C2,29.1 2.9,30 4,30L28,30C29.1,30 30,29.1 30,28L30,4C30,2.9 29.1,2 28,2ZM24.414,14.414L15.414,23.414C15.024,23.805 14.512,24 14,24C13.488,24 12.976,23.805 12.586,23.414L7.586,18.414C6.805,17.633 6.805,16.367 7.586,15.586C8.366,14.805 9.634,14.805 10.414,15.586L14,19.171L21.586,11.586C22.366,10.805 23.634,10.805 24.414,11.586C25.195,12.367 25.195,13.633 24.414,14.414Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "search":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(24.1316,0,0,24.1316,110.42,110.42)">' +
                '        <path fill="' + color + '" d="M18.512,16.585L21.962,20.039C22.493,20.57 22.492,21.432 21.961,21.962C21.43,22.493 20.568,22.492 20.038,21.961L16.589,18.509C15.029,19.672 13.095,20.36 11,20.36C5.831,20.36 1.64,16.169 1.64,11C1.64,5.831 5.831,1.64 11,1.64C16.169,1.64 20.36,5.831 20.36,11C20.36,13.093 19.673,15.026 18.512,16.585ZM15.696,15.694L15.697,15.693C16.898,14.492 17.64,12.833 17.64,11C17.64,7.333 14.667,4.36 11,4.36C7.333,4.36 4.36,7.333 4.36,11C4.36,14.667 7.333,17.64 11,17.64C12.834,17.64 14.494,16.896 15.696,15.694ZM11,7.36C10.249,7.36 9.64,6.751 9.64,6C9.64,5.249 10.249,4.64 11,4.64C14.513,4.64 17.36,7.487 17.36,11C17.36,11.751 16.751,12.36 16,12.36C15.249,12.36 14.64,11.751 14.64,11C14.64,8.99 13.01,7.36 11,7.36Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "show-content":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(8.33333,0,0,8.33333,100,100)">' +
                '        <path fill="' + color + '" d="M18.75,6L36,6L36,23.25C36,26.973 39.027,30 42.75,30L60,30L60,59.25C60,62.973 56.973,66 53.25,66L18.75,66C15.027,66 12,62.973 12,59.25L12,12.75C12,9.027 15.027,6 18.75,6ZM26.25,37.5C25.008,37.5 24,38.508 24,39.75C24,40.992 25.008,42 26.25,42L45.75,42C46.992,42 48,40.992 48,39.75C48,38.508 46.992,37.5 45.75,37.5L26.25,37.5ZM26.234,48L25.93,48.02C24.832,48.168 23.988,49.113 23.988,50.25C23.988,51.492 24.996,52.5 26.238,52.5L39.73,52.5L40.035,52.48C41.137,52.332 41.98,51.387 41.98,50.25C41.98,49.008 40.973,48 39.73,48L26.234,48ZM40.5,7.316L58.684,25.5L42.75,25.5C41.508,25.5 40.5,24.492 40.5,23.25L40.5,7.316Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "external-link":
            svgToReturn =
                '<svg width="20px" height="20px" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(24.0385,0,0,24.0385,111.538,111.538)">' +
                '        <path fill="' + color + '" d="M12,1.6C12.773,1.6 13.4,2.227 13.4,3C13.4,3.773 12.773,4.4 12,4.4C10.272,4.4 8.882,4.484 7.771,4.73C6.884,4.928 6.204,5.218 5.711,5.711C5.218,6.204 4.928,6.884 4.73,7.771C4.484,8.882 4.4,10.272 4.4,12C4.4,13.728 4.484,15.118 4.73,16.229C4.928,17.116 5.218,17.796 5.711,18.289C6.204,18.782 6.884,19.072 7.771,19.27C8.882,19.516 10.272,19.6 12,19.6C13.728,19.6 15.118,19.516 16.229,19.27C17.116,19.072 17.796,18.782 18.289,18.289C18.782,17.796 19.072,17.116 19.27,16.229C19.516,15.118 19.6,13.728 19.6,12C19.6,11.227 20.227,10.6 21,10.6C21.773,10.6 22.4,11.227 22.4,12C22.4,16.231 21.78,18.758 20.269,20.269C18.758,21.78 16.231,22.4 12,22.4C7.769,22.4 5.242,21.78 3.731,20.269C2.22,18.758 1.6,16.231 1.6,12C1.6,7.769 2.22,5.242 3.731,3.731C5.242,2.22 7.769,1.6 12,1.6ZM19.6,6.38L15.99,9.99C15.444,10.536 14.556,10.536 14.01,9.99C13.464,9.444 13.464,8.556 14.01,8.01L17.62,4.4L16,4.4C15.227,4.4 14.6,3.773 14.6,3C14.6,2.227 15.227,1.6 16,1.6L20.672,1.6C20.685,1.6 20.699,1.601 20.712,1.602L20.978,1.629C21.005,1.632 21.031,1.637 21.057,1.645L21.308,1.723C21.345,1.735 21.38,1.751 21.412,1.773L21.834,2.057C21.877,2.086 21.914,2.123 21.943,2.166L22.227,2.588C22.249,2.62 22.265,2.655 22.277,2.692L22.355,2.943C22.363,2.969 22.368,2.995 22.371,3.022L22.398,3.288C22.399,3.301 22.4,3.315 22.4,3.328L22.4,8C22.4,8.773 21.773,9.4 21,9.4C20.227,9.4 19.6,8.773 19.6,8L19.6,6.38Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "fullscreen":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(30.0481,0,0,30.0481,159.615,159.615)">' +
                '        <path fill="' + color + '" d="M-0.32,3.5C-0.32,2.502 0.502,1.68 1.5,1.68L14.5,1.68C15.498,1.68 16.32,2.502 16.32,3.5L16.32,12.5C16.32,13.498 15.498,14.32 14.5,14.32L1.5,14.32C0.502,14.32 -0.32,13.498 -0.32,12.5L-0.32,3.5ZM1.5,3.32C1.401,3.32 1.32,3.401 1.32,3.5L1.32,12.5C1.32,12.599 1.401,12.68 1.5,12.68L14.5,12.68C14.599,12.68 14.68,12.599 14.68,12.5L14.68,3.5C14.68,3.401 14.599,3.32 14.5,3.32L1.5,3.32ZM1.68,4.5C1.68,4.05 2.05,3.68 2.5,3.68L5.5,3.68C5.95,3.68 6.32,4.05 6.32,4.5C6.32,4.95 5.95,5.32 5.5,5.32L3.32,5.32L3.32,7.5C3.32,7.95 2.95,8.32 2.5,8.32C2.05,8.32 1.68,7.95 1.68,7.5L1.68,4.5ZM14.32,11.5C14.32,11.95 13.95,12.32 13.5,12.32L10.5,12.32C10.05,12.32 9.68,11.95 9.68,11.5C9.68,11.05 10.05,10.68 10.5,10.68L12.68,10.68L12.68,8.5C12.68,8.05 13.05,7.68 13.5,7.68C13.95,7.68 14.32,8.05 14.32,8.5L14.32,11.5Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "close":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(26.705,0,0,26.705,78.5488,78.5492)">' +
                '        <path fill="' + color + '" d="M21,3.074C21.531,3.605 21.531,4.466 21,4.997L13.961,12.037L21,19.077C21.531,19.608 21.531,20.469 21,21C20.469,21.531 19.608,21.531 19.077,21L12.037,13.961L4.997,21C4.466,21.531 3.605,21.531 3.074,21C2.543,20.469 2.543,19.608 3.074,19.077L10.114,12.037L3.074,4.997C2.543,4.466 2.543,3.605 3.074,3.074C3.605,2.543 4.466,2.543 4.997,3.074L12.037,10.114L19.077,3.074C19.608,2.543 20.469,2.543 21,3.074Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        case "warning":
            svgToReturn =
                '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">' +
                '    <g transform="matrix(26.0273,0,0,26.0273,87.6768,86.1326)">' +
                '        <path fill="' + color + '"' +
                '              d="M9.377,4.661C10.52,2.604 13.479,2.604 14.622,4.661L21.223,16.543C22.334,18.543 20.888,21 18.601,21L5.399,21C3.111,21 1.665,18.543 2.776,16.543L9.377,4.661ZM10.616,16.348C10.616,17.113 11.236,17.732 12,17.732C12.765,17.732 13.384,17.113 13.384,16.348L13.384,16.337C13.384,15.572 12.765,14.953 12,14.953C11.236,14.953 10.616,15.572 10.616,16.337L10.616,16.348ZM10.616,12.595C10.616,13.36 11.236,13.98 12,13.98C12.765,13.98 13.384,13.36 13.384,12.595L13.384,9.595C13.384,8.831 12.765,8.211 12,8.211C11.236,8.211 10.616,8.831 10.616,9.595L10.616,12.595Z"/>' +
                '    </g>' +
                '</svg>';
            break;
        /*
        case "":
            svgToReturn = '';
            break;
             */
    }
    return svgToReturn;
}

function sortObjectByKeys(o) {
    return Object.keys(o)
        .sort()
        .reduce((r, k) => ((r[k] = o[k]), r), {});
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
    else today = today + "" + hour + ":";
    let minute = todayDate.getMinutes();
    if (minute < 10) today = today + "0" + minute + ":";
    else today = today + "" + minute + ":";
    let second = todayDate.getSeconds();
    if (second < 10) today = today + "0" + second;
    else today = today + "" + second;

    return today;
}

function correctDatetime(datetime) {
    let todayDate = new Date(datetime);
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
    else today = today + "" + hour + ":";
    let minute = todayDate.getMinutes();
    if (minute < 10) today = today + "0" + minute + ":";
    else today = today + "" + minute + ":";
    let second = todayDate.getSeconds();
    if (second < 10) today = today + "0" + second;
    else today = today + "" + second;

    return today;
}

/**
 * This function is used to convert a datetime string to a displayable format
 * @param datetime The datetime string to convert
 * @param format The format to use (to force): if undefined, the format will be taken from the settings["datetime-format"]
 * @param also_time If true (default), the time will be included in the displayable format
 * @returns {string} The datetime string in the displayable format
 */
function datetimeToDisplay(datetime, format = undefined, also_time = true) {
    //if datetime is not a valid Date, it probably it's "Never", return it as it is
    if (isNaN(new Date(datetime).getTime())) {
        return datetime;
    }

    let date = new Date(datetime);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    if (month < 10) month = "0" + month;
    else month = "" + month;
    let day = date.getDate();
    if (day < 10) day = "0" + day;
    else day = "" + day;
    let hour = date.getHours();
    if (hour < 10) hour = "0" + hour;
    else hour = "" + hour;
    let minute = date.getMinutes();
    if (minute < 10) minute = "0" + minute;
    else minute = "" + minute;
    let second = date.getSeconds();
    if (second < 10) second = "0" + second;
    else second = "" + second;

    let formatToUse = format;
    if (format === undefined) {
        formatToUse = settings_json["datetime-format"];
    }
    if (!supportedDatetimeFormat.includes(formatToUse)) {
        formatToUse = "yyyymmdd1";
    }

    let time_12h = false; //if "-12h" is in the format, the time will be displayed in 12h format (am/pm too)
    if (formatToUse !== undefined && formatToUse.toString().includes("-12h")) {
        time_12h = true;
    }

    let datetimeToReturn = "";

    if (formatToUse === "yyyymmdd1") {
        //YYYY-MM-DD HH:MM:SS
        datetimeToReturn = `${year}-${month}-${day}`;
    } else if (formatToUse === "yyyyddmm1") {
        //YYYY-DD-MM HH:MM:SS
        datetimeToReturn = `${year}-${day}-${month}`;
    } else if (formatToUse === "ddmmyyyy1") {
        //DD/MM/YYYY HH:MM:SS
        datetimeToReturn = `${day}/${month}/${year}`;
    } else if (formatToUse === "ddmmyyyy2") {
        //DD.MM.YYYY HH:MM:SS
        datetimeToReturn = `${day}.${month}.${year}`;
    } else if (formatToUse === "mmddyyyy1") {
        //MM/DD/YYYY HH:MM:SS
        datetimeToReturn = `${month}/${day}/${year}`;
    } else if (formatToUse === "ddmmyyyy1-12h") {
        //DD/MM/YYYY HH:MM:SS a.m./p.m.
        datetimeToReturn = `${month}.${day}.${year}`;
    }

    if (also_time) {
        if (time_12h) {
            let am_pm = "a.m.";
            if (hour >= 12) {
                am_pm = "p.m.";
                if (hour > 12) hour -= 12;
            }
            datetimeToReturn += ` ${hour}:${minute}:${second} ${am_pm}`;
        } else {
            datetimeToReturn += ` ${hour}:${minute}:${second}`;
        }
    }

    return datetimeToReturn;
}

/**
 * Use this function to capture errors and save on the local storage (to be used as logs)
 * @param context {string} - context of the error (where it happened) || use format "file::function[::line]"
 * @param text {string} - text to be saved as error || it's automatically saved also the date and time
 * @param url {string} - url of the page where the error happened (if applicable)
 */
function onError(context, text, url = undefined) {
    browser.storage.sync.get("anonymous-userid").then((resultSync) => {
        let anonymous_userid = null;
        if (resultSync["anonymous-userid"] !== undefined) {
            anonymous_userid = resultSync["anonymous-userid"];
        } else {
            anonymous_userid = generateSecureUUID();
            browser.storage.sync.set({"anonymous-userid": anonymous_userid});
        }
        const error = {
            datetime: getDate(),
            context: context,
            error: text,
            url: url,
            "notefox-version": browser.runtime.getManifest().version,
            "anonymous-userid": anonymous_userid,
        };
        browser.storage.local.get("error-logs").then((result) => {
            let error_logs = [];
            if (result["error-logs"] !== undefined) {
                error_logs = result["error-logs"];
            }
            error_logs.push(error);
            browser.storage.local.set({"error-logs": error_logs});
        });
    });
}

function onTelemetry(action, context = null, url = null, os, other = null) {
    //check if the telemetry is enabled
    if (
        settings_json["send-telemetry"] !== undefined &&
        settings_json["send-telemetry"] === false
    ) {
        return;
    }
    const notefox_version = browser.runtime.getManifest().version;
    const browser_name = webBrowserUsed;
    let notefox_account = null;
    let anonymous_userid = null;
    let language = languageToUse;
    let browser_version = null;
    const current_datetime = getDate();
    browser.storage.sync
        .get(["notefox-account", "anonymous-userid"])
        .then((resultSync) => {
            if (resultSync !== undefined) {
                notefox_account = resultSync["notefox-account"] !== undefined;
                if (resultSync["anonymous-userid"] !== undefined) {
                    anonymous_userid = resultSync["anonymous-userid"];
                } else {
                    anonymous_userid = generateSecureUUID();
                    browser.storage.sync.set({"anonymous-userid": anonymous_userid});
                }
            } else {
                notefox_account = false;
            }

            browser.runtime
                .getBrowserInfo()
                .then((info) => {
                    if (info !== undefined && info.version !== undefined) {
                        browser_version = info.version;
                    } else {
                        browser_version = null;
                    }
                    const telemetry_logs = {
                        "client-datetime": current_datetime,
                        action: action,
                        context: context,
                        url: url,
                        browser: browser_name,
                        "browser-version": browser_version,
                        os: os,
                        "notefox-version": notefox_version,
                        "notefox-account": notefox_account,
                        "anonymous-userid": anonymous_userid,
                        language: language,
                        other: other,
                    };
                    //console.log("Telemetry log:", telemetry_logs);
                    browser.storage.local.get("telemetry").then((result) => {
                        let telemetry = [];
                        if (result["telemetry"] !== undefined) {
                            telemetry = result["telemetry"];
                        }
                        telemetry.push(telemetry_logs);
                        browser.storage.local.set({telemetry: telemetry});
                    });
                })
                .catch((error) => {
                    console.error("Error getting browser info for telemetry:", error);
                    onError(
                        "telemetry::onTelemetry",
                        "Error getting browser info for telemetry: " + error
                    );
                    browser_version = null;
                });
        });
}

function generateSecureUUID() {
    if (crypto && crypto.getRandomValues) {
        // Crittograficamente sicuro
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);

        array[6] = (array[6] & 0x0f) | 0x40; // Version 4
        array[8] = (array[8] & 0x3f) | 0x80; // Variant

        const hex = Array.from(array)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        return [
            hex.substring(0, 8),
            hex.substring(8, 12),
            hex.substring(12, 16),
            hex.substring(16, 20),
            hex.substring(20, 32),
        ].join("-");
    }

    // Fallback alla tua funzione
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function checkOperatingSystem() {
    let info = browser.runtime.getPlatformInfo();
    info.then(getOperatingSystem);
    //"mac", "win", "linux", "bsd", "android", "ios", "other", ...
    // Docs: (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/PlatformOs)ˇ
}

function getOperatingSystem(info) {
    if (info.os === "mac") currentOS = "mac";
    else currentOS = info.os;
}
