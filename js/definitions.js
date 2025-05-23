var lang = "";

var strings = []; //strings[language_code] = {};

//TODO!manually: add new languages here
const supportedLanguages = ["en", "it", "ar", "zh-cn", "zh-tw", "cs", "da", "nl", "fi", "fr", "de", "el", "ja", "pl", "pt-pt", "pt-br", "ro", "ru", "es", "sv-SE", "uk", "ia"];

//TODO!manually: add new fonts here
const supportedFontFamily = ["Open Sans", "Shantell Sans", "Inter", "Lora", "Noto Sans", "Noto Serif", "Roboto", "Merienda", "Playfair Display", "Victor Mono", "Source Code Pro"];

//TODO!manually: add new datetime formats here
const supportedDatetimeFormat = ["yyyymmdd1", "yyyyddmm1", "ddmmyyyy1", "ddmmyyyy2", "ddmmyyyy1-12h", "mmddyyyy1"];

let languageToUse = browser.i18n.getUILanguage().toString();
if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";
if (supportedLanguages.includes(languageToUse.split("-")[0])) languageToUse = languageToUse.split("-")[0];

let links = {
    "donate": "https://liberapay.com/Sav22999",
    "telegram": "https://t.me/sav_projects/7",
    "support_telegram": "https://t.me/sav_projects/7",
    "support_email": "mailto:saverio.morelli@protonmail.com",
    "support_github": "https://github.com/Sav22999/websites-notes/issues",
    "translate": "https://crowdin.com/project/notefox",
    "review": "https://addons.mozilla.org/firefox/addon/websites-notes/",
    "help-search": "https://www.notefox.eu/help/search/",
    "privacy": "https://www.notefox.eu/privacy/",
    "terms": "https://www.notefox.eu/terms/",
};

const links_aside_bar = {
    "all-notes": "../all-notes/index.html",
    "settings": "../settings/index.html",
    "help": "https://www.notefox.eu/help/",
    "review": "https://www.notefox.eu/install/",
    "website": "https://www.notefox.eu",
    "donate": "https://www.notefox.eu/donate/",
    "translate": "https://crowdin.com/project/notefox"
};


/**
 * Recursive function to get the sanitized html code from an unsafe one
 * @param element
 * @param allowedTags
 * @param allowedAttributes
 * @returns {*}
 */
function sanitize(element, allowedTags, allowedAttributes) {
    if (allowedTags === -1) allowedTags = ["b", "i", "u", "a", "strike", "code", "span", "div", "img", "br", "h1", "h2", "h3", "h4", "h5", "h6", "p", "small", "big", "em", "strong", "s", "sub", "sup", "blockquote", "q", "mark"];
    if (allowedAttributes === -1) allowedAttributes = ["src", "alt", "title", "cite", "href"];

    let sanitizedHTML = element;

    for (var i = sanitizedHTML.childNodes.length - 1; i >= 0; i--) {
        var node = sanitize(sanitizedHTML.childNodes[i], allowedTags, allowedAttributes);

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
                attributes_to_remove.forEach(attribute => {
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
    return sanitizedHTML
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

function insertHTMLFromTagName(tagName) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    let isTagName = hasAncestorTagName(window.getSelection().anchorNode, tagName);

    if (isTagName) {
        let elements = getTheAncestorTagName(window.getSelection().anchorNode, tagName);
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
        let html = '<' + tagName + '>' + selectedText + '</' + tagName + '>';
        document.execCommand('insertHTML', false, html);
    }
}

function insertLink() {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

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
        /*let url = prompt("Enter the URL:");
        if (url) {
            document.execCommand('createLink', false, url);
        }*/
        document.execCommand('createLink', false, selectedText);
    }
    addAction();
    //}
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
        setPosition(document.getElementById("notes"), actions[currentAction].position);
    }
    document.getElementById("notes").focus();
}

function redo() {
    hideTabSubDomains();
    if (currentAction < actions.length - 1) {
        undoAction = false;
        document.getElementById("notes").innerHTML = actions[++currentAction].text;
        saveNotes();
        setPosition(document.getElementById("notes"), actions[currentAction].position);
    }
    document.getElementById("notes").focus();
}

function spellcheck(force = false, value = false) {
    hideTabSubDomains();
    sync_local.get("settings", function (value) {
        if (value["settings"] !== undefined) {
            settings_json = value["settings"];
            if (settings_json["open-default"] === undefined) settings_json["open-default"] = "domain";
            if (settings_json["consider-parameters"] === undefined) settings_json["consider-parameters"] = true;
            if (settings_json["consider-sections"] === undefined) settings_json["consider-sections"] = true;

            if (settings_json["advanced-managing"] === undefined) settings_json["advanced-managing"] = true;
            if (settings_json["advanced-managing"] === "yes" || settings_json["advanced-managing"] === true) advanced_managing = true;
            else advanced_managing = false;

            if (settings_json["html-text-formatting"] === undefined) settings_json["html-text-formatting"] = true;
            if (settings_json["disable-word-wrap"] === undefined) settings_json["disable-word-wrap"] = false;
            if (settings_json["spellcheck-detection"] === undefined) settings_json["spellcheck-detection"] = false;
        }

        if (!document.getElementById("notes").spellcheck || (force && value)) {
            //enable spellCheck
            document.getElementById("notes").spellcheck = true;
            settings_json["spellcheck-detection"] = true;
            if (document.getElementById("text-spellcheck")) {
                document.getElementById("text-spellcheck").classList.add("text-spellcheck-sel");
            }
        } else {
            //disable spellCheck
            document.getElementById("notes").spellcheck = false;
            settings_json["spellcheck-detection"] = false;
            if (document.getElementById("text-spellcheck") && document.getElementById("text-spellcheck").classList.contains("text-spellcheck-sel")) {
                document.getElementById("text-spellcheck").classList.remove("text-spellcheck-sel")
            }
        }
        document.getElementById("notes").focus();
        //console.log("QAZ-11")
        sync_local.set({"settings": settings_json, "last-update": getDate()}).then(() => {
            sendMessageUpdateToBackground();
        });
    });
}

/**
 * Load the current theme for the page
 */
function checkTheme(set_theme = true, theme = "", function_to_execute = function (params) {
}) {
    //before to set theme -> check if "Follow theme system" is enabled, otherwise use the default orange theme

    let force_theme = theme; //TODO!TESTING this is used only for test, after testing set to "" (empty) -- {"light", "dark", "auto"}

    sync_local.get("settings").then(result => {
        let background;
        let backgroundSection;
        let primary;
        let secondary;
        let on_primary;
        let on_secondary;
        let textbox_background;
        let textbox_color;

        let default_theme = false;

        if (force_theme !== "" || result !== undefined && result["settings"] !== undefined && result["settings"]["theme"] !== undefined) {
            if (force_theme === "auto" || result["settings"] !== undefined && result["settings"]["theme"] && result["settings"]["theme"] === "auto") {
                browser.theme.getCurrent().then(theme => {
                    //console.log(JSON.stringify(theme));
                    if (theme !== undefined && theme["colors"] !== undefined && theme["colors"] !== null) {
                        background = theme.colors.frame;
                        backgroundSection = theme.colors.toolbar;
                        primary = theme.colors.toolbar_text;
                        secondary = theme.colors.toolbar_field;
                        on_primary = theme.colors.toolbar;
                        on_secondary = theme.colors.toolbar_field_text;
                        textbox_background = theme.colors.toolbar_field;
                        textbox_color = theme.colors.toolbar_field_text;

                        if (background === undefined || backgroundSection === undefined || primary === undefined || secondary === undefined || on_primary === undefined || on_secondary === undefined || textbox_background === undefined || textbox_color === undefined) {
                            default_theme = true;
                        } else {
                            if (set_theme) setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color);
                            else function_to_execute([background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color]);
                        }
                    } else {
                        default_theme = true;
                    }
                });
            } else if (force_theme === "dark" || result["settings"] !== undefined && result["settings"]["theme"] !== undefined && result["settings"]["theme"] === "dark") {
                //use the dark theme
                background = "#000000";
                backgroundSection = "#222222";
                primary = "#ffa56f";
                secondary = "#ffd8be";
                on_primary = "#222222";
                on_secondary = "#444444";
                textbox_background = "#000000";
                textbox_color = "#ffa56f";
                if (set_theme) setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color);
                else function_to_execute();
            } else if (force_theme === "lighter" || result["settings"] !== undefined && result["settings"]["theme"] !== undefined && result["settings"]["theme"] === "lighter") {
                //use the lighter theme
                background = "#FFFFFF";
                backgroundSection = "#EEEEEE";
                primary = "#333333";
                secondary = "#666666";
                on_primary = "#FFFFFF";
                on_secondary = "#FFFFFF";
                textbox_background = "#ffffff";
                textbox_color = "#333333";
                if (set_theme) setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color);
                else function_to_execute();
            } else if (force_theme === "darker" || result["settings"] !== undefined && result["settings"]["theme"] !== undefined && result["settings"]["theme"] === "darker") {
                //use the darker theme
                background = "#000000";
                backgroundSection = "#222222";
                primary = "#ffffff";
                secondary = "#dddddd";
                on_primary = "#222222";
                on_secondary = "#444444";
                textbox_background = "#000000";
                textbox_color = "#ffffff";
                if (set_theme) setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color);
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
            if (set_theme) setTheme(background, backgroundSection, primary, secondary, on_primary, on_secondary, textbox_background, textbox_color);
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
        case "open-external":
            svgToReturn = '<svg width="10px" height="10px" viewBox="0 0 10 10" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-miterlimit:2;">\n' +
                '    <path d="M8.854,5C8.854,7.129 7.129,8.854 5,8.854C2.871,8.854 1.146,7.129 1.146,5C1.146,2.871 2.871,1.146 5,1.146C5.173,1.146 5.313,1.006 5.313,0.833C5.313,0.661 5.173,0.521 5,0.521C2.526,0.521 0.521,2.526 0.521,5C0.521,7.474 2.526,9.479 5,9.479C7.474,9.479 9.479,7.474 9.479,5C9.479,4.827 9.339,4.688 9.167,4.688C8.994,4.688 8.854,4.827 8.854,5Z"\n' +
                '          style="fill:' + color + ';fill-rule:nonzero;stroke:' + color + ';stroke-width:0.5px;"/>\n' +
                '    <path d="M5.196,4.362C5.074,4.484 5.074,4.682 5.196,4.804C5.318,4.926 5.516,4.926 5.638,4.804L8.854,1.588L8.854,3.06C8.854,3.232 8.994,3.372 9.167,3.372C9.339,3.372 9.479,3.232 9.479,3.06L9.479,0.833C9.479,0.661 9.339,0.521 9.167,0.521L6.94,0.521C6.768,0.521 6.628,0.661 6.628,0.833C6.628,1.006 6.768,1.146 6.94,1.146L8.412,1.146L5.196,4.362Z"\n' +
                '          style="fill:' + color + ';fill-rule:nonzero;stroke:' + color + ';stroke-width:0.5px;"/>\n' +
                '</svg>'
            break;

        case "donate":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M16.5 13.2871C14.0251 10.5713 11 12.5746 11 15.3995C11 17.9583 12.814 19.4344 14.3584 20.6912L14.4018 20.7265C14.5474 20.8449 14.6903 20.9615 14.829 21.0769C15.4 21.5523 15.95 22 16.5 22C17.05 22 17.6 21.5523 18.171 21.0769C19.7893 19.7296 22 18.2243 22 15.3995C22 14.4715 21.6735 13.6321 21.1474 13.0197C20.0718 11.7677 18.1619 11.4635 16.5 13.2871Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path d="M8.10627 18.2468C5.29819 16.0833 2 13.5422 2 9.1371C2 4.27416 7.50016 0.825464 12 5.50063C16.4998 0.825464 22 4.27416 22 9.1371C22 9.97067 21.8819 10.7375 21.6714 11.4477C20.9524 10.8701 20.051 10.5056 19.052 10.5C18.162 10.495 17.2936 10.7745 16.4988 11.3101C15.1099 10.3773 13.5429 10.2518 12.1698 10.9147C10.5345 11.7042 9.5 13.4705 9.5 15.3994C9.5 17.7046 10.6485 19.3217 11.8415 20.4937C10.8942 20.4184 9.94514 19.6861 8.96173 18.9109C8.68471 18.6925 8.39814 18.4717 8.10627 18.2468Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;

        case "settings":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224ZM12.5 15C14.1695 15 15.5228 13.6569 15.5228 12C15.5228 10.3431 14.1695 9 12.5 9C10.8305 9 9.47716 10.3431 9.47716 12C9.47716 13.6569 10.8305 15 12.5 15Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "import":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <path d="M650,500L650,666.667C650,703.333 620,733.333 583.333,733.333L183.333,733.333C146.667,733.333 116.667,703.333 116.667,666.667L116.667,133.333C116.667,96.667 146.667,66.667 183.333,66.667L583.333,66.667C620,66.667 650,96.667 650,133.333L650,300L450,300L450,142.608L143.991,400L450,657.392L450,500L650,500ZM400,450L400,550L221.667,400L400,250L400,350L700,350L700,450L400,450Z"' +
                '           fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "export":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <path d="M650,517.205L650,666.667C650,703.333 620,733.333 583.333,733.333L183.333,733.333C146.667,733.333 116.667,703.333 116.667,666.667L116.667,133.333C116.667,96.667 146.667,66.667 183.333,66.667L583.333,66.667C620,66.667 650,96.667 650,133.333L650,282.795L483.333,142.609L483.333,300L183.333,300L183.333,500L483.333,500L483.333,657.391L650,517.205ZM533.333,450L233.333,450L233.333,350L533.333,350L533.333,250L711.667,400L533.333,550L533.333,450Z"' +
                '           fill="' + color + '"/>\n' +
                '</svg>\n';
            break;
        case "delete":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M19.3517 7.61665L15.3929 4.05375C14.2651 3.03868 13.7012 2.53114 13.0092 2.26562L13 5.00011C13 7.35713 13 8.53564 13.7322 9.26787C14.4645 10.0001 15.643 10.0001 18 10.0001H21.5801C21.2175 9.29588 20.5684 8.71164 19.3517 7.61665Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14V13.5629C22 12.6901 22 12.0344 21.9574 11.5001H18L17.9051 11.5001C16.808 11.5002 15.8385 11.5003 15.0569 11.3952C14.2098 11.2813 13.3628 11.0198 12.6716 10.3285C11.9803 9.63726 11.7188 8.79028 11.6049 7.94316C11.4998 7.16164 11.4999 6.19207 11.5 5.09497L11.5092 2.26057C11.5095 2.17813 11.5166 2.09659 11.53 2.01666C11.1214 2 10.6358 2 10.0298 2C6.23869 2 4.34315 2 3.17157 3.17157C2 4.34315 2 6.22876 2 10V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22ZM5.46967 14.4697C5.76256 14.1768 6.23744 14.1768 6.53033 14.4697L7.5 15.4393L8.46967 14.4697C8.76256 14.1768 9.23744 14.1768 9.53033 14.4697C9.82322 14.7626 9.82322 15.2374 9.53033 15.5303L8.56066 16.5L9.53033 17.4697C9.82322 17.7626 9.82322 18.2374 9.53033 18.5303C9.23744 18.8232 8.76256 18.8232 8.46967 18.5303L7.5 17.5607L6.53033 18.5303C6.23744 18.8232 5.76256 18.8232 5.46967 18.5303C5.17678 18.2374 5.17678 17.7626 5.46967 17.4697L6.43934 16.5L5.46967 15.5303C5.17678 15.2374 5.17678 14.7626 5.46967 14.4697Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "delete2":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M6.87114 19.4986C7.80085 20 8.91458 20 11.142 20H13.779C17.6544 20 19.5921 20 20.7961 18.8284C22 17.6569 22 15.7712 22 12C22 8.22876 22 6.34315 20.7961 5.17157C19.5921 4 17.6544 4 13.779 4H11.142C8.91458 4 7.80085 4 6.87114 4.50143C5.94144 5.00286 5.35117 5.92191 4.17061 7.76001L3.48981 8.82001C2.4966 10.3664 2 11.1396 2 12C2 12.8604 2.4966 13.6336 3.48981 15.18L4.17061 16.24C5.35117 18.0781 5.94144 18.9971 6.87114 19.4986ZM11.0303 8.96967C10.7374 8.67678 10.2625 8.67678 9.96965 8.96967C9.67676 9.26256 9.67676 9.73744 9.96965 10.0303L11.9393 12L9.96967 13.9697C9.67678 14.2626 9.67678 14.7374 9.96967 15.0303C10.2626 15.3232 10.7374 15.3232 11.0303 15.0303L13 13.0607L14.9696 15.0303C15.2625 15.3232 15.7374 15.3232 16.0303 15.0303C16.3232 14.7374 16.3232 14.2625 16.0303 13.9697L14.0606 12L16.0303 10.0304C16.3232 9.73746 16.3232 9.26258 16.0303 8.96969C15.7374 8.6768 15.2625 8.6768 14.9696 8.96969L13 10.9394L11.0303 8.96967Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "copy":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M15.24 2H11.3458C9.58159 1.99999 8.18418 1.99997 7.09054 2.1476C5.96501 2.29953 5.05402 2.61964 4.33559 3.34096C3.61717 4.06227 3.29833 4.97692 3.14701 6.10697C2.99997 7.205 2.99999 8.60802 3 10.3793V16.2169C3 17.725 3.91995 19.0174 5.22717 19.5592C5.15989 18.6498 5.15994 17.3737 5.16 16.312L5.16 11.3976L5.16 11.3024C5.15993 10.0207 5.15986 8.91644 5.27828 8.03211C5.40519 7.08438 5.69139 6.17592 6.4253 5.43906C7.15921 4.70219 8.06404 4.41485 9.00798 4.28743C9.88877 4.16854 10.9887 4.1686 12.2652 4.16867L12.36 4.16868H15.24L15.3348 4.16867C16.6113 4.1686 17.7088 4.16854 18.5896 4.28743C18.0627 2.94779 16.7616 2 15.24 2Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path d="M6.6001 11.3974C6.6001 8.67119 6.6001 7.3081 7.44363 6.46118C8.28716 5.61426 9.64481 5.61426 12.3601 5.61426H15.2401C17.9554 5.61426 19.313 5.61426 20.1566 6.46118C21.0001 7.3081 21.0001 8.6712 21.0001 11.3974V16.2167C21.0001 18.9429 21.0001 20.306 20.1566 21.1529C19.313 21.9998 17.9554 21.9998 15.2401 21.9998H12.3601C9.64481 21.9998 8.28716 21.9998 7.44363 21.1529C6.6001 20.306 6.6001 18.9429 6.6001 16.2167V11.3974Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "filter":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M19 3H5C3.58579 3 2.87868 3 2.43934 3.4122C2 3.8244 2 4.48782 2 5.81466V6.50448C2 7.54232 2 8.06124 2.2596 8.49142C2.5192 8.9216 2.99347 9.18858 3.94202 9.72255L6.85504 11.3624C7.49146 11.7206 7.80967 11.8998 8.03751 12.0976C8.51199 12.5095 8.80408 12.9935 8.93644 13.5872C9 13.8722 9 14.2058 9 14.8729L9 17.5424C9 18.452 9 18.9067 9.25192 19.2613C9.50385 19.6158 9.95128 19.7907 10.8462 20.1406C12.7248 20.875 13.6641 21.2422 14.3321 20.8244C15 20.4066 15 19.4519 15 17.5424V14.8729C15 14.2058 15 13.8722 15.0636 13.5872C15.1959 12.9935 15.488 12.5095 15.9625 12.0976C16.1903 11.8998 16.5085 11.7206 17.145 11.3624L20.058 9.72255C21.0065 9.18858 21.4808 8.9216 21.7404 8.49142C22 8.06124 22 7.54232 22 6.50448V5.81466C22 4.48782 22 3.8244 21.5607 3.4122C21.1213 3 20.4142 3 19 3Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "sort-by":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355ZM14.75 16C14.75 16.4142 14.4142 16.75 14 16.75H10C9.58579 16.75 9.25 16.4142 9.25 16C9.25 15.5858 9.58579 15.25 10 15.25H14C14.4142 15.25 14.75 15.5858 14.75 16ZM16 12.75C16.4142 12.75 16.75 12.4142 16.75 12C16.75 11.5858 16.4142 11.25 16 11.25H8C7.58579 11.25 7.25 11.5858 7.25 12C7.25 12.4142 7.58579 12.75 8 12.75H16ZM18.75 8C18.75 8.41421 18.4142 8.75 18 8.75H6C5.58579 8.75 5.25 8.41421 5.25 8C5.25 7.58579 5.58579 7.25 6 7.25H18C18.4142 7.25 18.75 7.58579 18.75 8Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "tag":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M2.12264 12.816C2.41018 13.8186 3.18295 14.5914 4.72848 16.1369L6.55812 17.9665C9.24711 20.6555 10.5916 22 12.2623 22C13.933 22 15.2775 20.6555 17.9665 17.9665C20.6555 15.2775 22 13.933 22 12.2623C22 10.5916 20.6555 9.24711 17.9665 6.55812L16.1369 4.72848C14.5914 3.18295 13.8186 2.41018 12.816 2.12264C11.8134 1.83509 10.7485 2.08083 8.61875 2.57231L7.39057 2.85574C5.5988 3.26922 4.70292 3.47597 4.08944 4.08944C3.47597 4.70292 3.26922 5.59881 2.85574 7.39057L2.57231 8.61875C2.08083 10.7485 1.83509 11.8134 2.12264 12.816ZM10.1234 7.27098C10.911 8.05856 10.911 9.33549 10.1234 10.1231C9.33581 10.9107 8.05888 10.9107 7.27129 10.1231C6.48371 9.33549 6.48371 8.05856 7.27129 7.27098C8.05888 6.48339 9.33581 6.48339 10.1234 7.27098ZM19.0511 12.0511L12.0721 19.0303C11.7792 19.3232 11.3043 19.3232 11.0114 19.0303C10.7185 18.7375 10.7185 18.2626 11.0114 17.9697L17.9904 10.9904C18.2833 10.6975 18.7582 10.6975 19.0511 10.9904C19.344 11.2833 19.344 11.7582 19.0511 12.0511Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "refresh":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M18.2577 3.50828C18.538 3.62437 18.7207 3.89785 18.7207 4.20119V8.44383C18.7207 8.85805 18.3849 9.19383 17.9707 9.19383H13.728C13.4247 9.19383 13.1512 9.0111 13.0351 8.73085C12.9191 8.45059 12.9832 8.128 13.1977 7.9135L14.8007 6.3105C12.1674 5.20912 9.01606 5.7309 6.87348 7.87348C4.04217 10.7048 4.04217 15.2952 6.87348 18.1265C9.70478 20.9578 14.2952 20.9578 17.1265 18.1265C18.7727 16.4803 19.4622 14.2401 19.1935 12.0937C19.142 11.6827 19.4335 11.3078 19.8445 11.2563C20.2555 11.2049 20.6304 11.4963 20.6819 11.9073C21.0057 14.4934 20.1746 17.1997 18.1872 19.1872C14.7701 22.6043 9.2299 22.6043 5.81282 19.1872C2.39573 15.7701 2.39573 10.2299 5.81282 6.81282C8.55119 4.07444 12.6515 3.5312 15.9309 5.18028L17.4404 3.67086C17.6549 3.45637 17.9774 3.3922 18.2577 3.50828Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "download":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12ZM12 6.25C12.4142 6.25 12.75 6.58579 12.75 7V12.1893L14.4697 10.4697C14.7626 10.1768 15.2374 10.1768 15.5303 10.4697C15.8232 10.7626 15.8232 11.2374 15.5303 11.5303L12.5303 14.5303C12.3897 14.671 12.1989 14.75 12 14.75C11.8011 14.75 11.6103 14.671 11.4697 14.5303L8.46967 11.5303C8.17678 11.2374 8.17678 10.7626 8.46967 10.4697C8.76256 10.1768 9.23744 10.1768 9.53033 10.4697L11.25 12.1893V7C11.25 6.58579 11.5858 6.25 12 6.25ZM8 16.25C7.58579 16.25 7.25 16.5858 7.25 17C7.25 17.4142 7.58579 17.75 8 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H8Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "save":
            svgToReturn = '<svg fill="' + color + '" width="800px" height="800px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M21,20V8.414a1,1,0,0,0-.293-.707L16.293,3.293A1,1,0,0,0,15.586,3H4A1,1,0,0,0,3,4V20a1,1,0,0,0,1,1H20A1,1,0,0,0,21,20ZM9,8h4a1,1,0,0,1,0,2H9A1,1,0,0,1,9,8Zm7,11H8V15a1,1,0,0,1,1-1h6a1,1,0,0,1,1,1Z"/>\n' +
                '</svg>';
            break;
        case "translate":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M8.38729 5.07916C8.2258 4.8117 8.05626 4.56198 7.8878 4.3346C9.04232 3.49515 10.4633 3 12 3C13.32 3 14.5547 3.36536 15.6084 4.00047C15.5932 4.08959 15.5717 4.19054 15.5419 4.30292C15.4363 4.70203 15.2701 5.08295 15.1288 5.3053C15.0801 5.38197 14.8798 5.5778 14.5164 5.84854C14.3544 5.96924 14.1745 6.08008 13.9603 6.20811L13.886 6.25243C13.6985 6.36416 13.4839 6.49199 13.2771 6.63373C12.7891 6.96807 12.2809 7.41998 11.9391 8.15075C11.6919 8.67927 11.7089 9.19402 11.8182 9.60686C11.8539 9.74163 11.8735 9.87731 11.8738 9.99652C11.8739 10.0336 11.8594 10.0928 11.7766 10.1619C11.6876 10.2363 11.5622 10.2812 11.4495 10.28C10.3725 10.2678 9.52299 9.37575 9.3997 7.95271C9.306 6.8712 8.8641 5.86882 8.38729 5.07916Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path d="M16.6517 14.5089C16.9162 14.5062 17.1643 14.4888 17.3969 14.4582C16.5193 15.5195 15.3346 16.3175 13.9791 16.7163C13.9326 16.3349 13.9631 15.8766 14.1879 15.4531C14.3798 15.0914 14.8657 14.8197 15.5216 14.6585C15.8229 14.5844 16.1094 14.5464 16.3222 14.5273C16.4277 14.5179 16.5125 14.5133 16.569 14.511C16.5972 14.5099 16.6181 14.5094 16.6308 14.5092L16.6429 14.509L16.6517 14.5089Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path d="M5 10C5 8.28063 5.6199 6.70604 6.64838 5.48753C6.74956 5.63106 6.85097 5.78497 6.94913 5.94753C7.35056 6.61238 7.66238 7.36367 7.72597 8.09772C7.89674 10.0688 9.20746 11.9347 11.4305 11.9599C12.3923 11.9708 13.5569 11.2479 13.5538 9.99234C13.5531 9.70484 13.5079 9.42468 13.4423 9.17689C13.4107 9.05761 13.4152 8.96019 13.4609 8.86248C13.6314 8.49787 13.8831 8.25497 14.2266 8.01963C14.3866 7.91002 14.5529 7.81086 14.7452 7.69614L14.8222 7.65014C15.0375 7.52146 15.283 7.37244 15.5202 7.1957C15.865 6.93877 16.3107 6.57794 16.5468 6.20623C16.7338 5.912 16.907 5.5347 17.0412 5.14341C18.2541 6.40212 19 8.11395 19 10C19 10.5323 18.9406 11.0508 18.828 11.5491C18.7606 11.7487 18.6766 11.9352 18.5253 12.1315C18.2881 12.4393 17.8131 12.8167 16.6342 12.829L16.6282 12.829L16.5995 12.8295C16.5758 12.8299 16.5432 12.8307 16.5027 12.8323C16.4218 12.8355 16.3087 12.8418 16.1721 12.8541C15.9008 12.8784 15.5264 12.9273 15.1206 13.027C14.3624 13.2134 13.2498 13.6368 12.7039 14.6656C12.2731 15.4773 12.2246 16.3106 12.3216 16.9927C12.215 16.9976 12.1078 17 12 17C8.13401 17 5 13.866 5 10Z"\n' +
                '          fill="' + color + '"/>\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M18.0035 1.49982C18.2797 1.19118 18.7539 1.16491 19.0625 1.44116C21.3246 3.4658 22.75 6.41044 22.75 9.687C22.75 15.4384 18.3612 20.1647 12.75 20.6996V21.25H14C14.4142 21.25 14.75 21.5858 14.75 22C14.75 22.4142 14.4142 22.75 14 22.75H10C9.58579 22.75 9.25001 22.4142 9.25001 22C9.25001 21.5858 9.58579 21.25 10 21.25H11.25V20.7415C8.14923 20.621 5.37537 19.2236 3.44116 17.0625C3.16491 16.7539 3.19118 16.2797 3.49982 16.0035C3.80847 15.7272 4.28261 15.7535 4.55886 16.0622C6.31098 18.0198 8.85483 19.25 11.687 19.25C16.9685 19.25 21.25 14.9685 21.25 9.687C21.25 6.85483 20.0198 4.31098 18.0622 2.55886C17.7535 2.28261 17.7272 1.80847 18.0035 1.49982Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "github":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <title>github</title>\n' +
                '    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Dribbble-Light-Preview" transform="translate(-140.000000, -7559.000000)" fill="' + color + '">\n' +
                '            <g id="icons" transform="translate(56.000000, 160.000000)">\n' +
                '                <path d="M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399"\n' +
                '                      id="github-[#142]">\n' +
                '                </path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "email":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12ZM16 12V13.5C16 14.8807 17.1193 16 18.5 16V16C19.8807 16 21 14.8807 21 13.5V12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21H16"\n' +
                '          stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
                '</svg>';
            break;
        case "telegram":
            svgToReturn = '<svg fill="' + color + '" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="M22.122 10.040c0.006-0 0.014-0 0.022-0 0.209 0 0.403 0.065 0.562 0.177l-0.003-0.002c0.116 0.101 0.194 0.243 0.213 0.403l0 0.003c0.020 0.122 0.031 0.262 0.031 0.405 0 0.065-0.002 0.129-0.007 0.193l0-0.009c-0.225 2.369-1.201 8.114-1.697 10.766-0.21 1.123-0.623 1.499-1.023 1.535-0.869 0.081-1.529-0.574-2.371-1.126-1.318-0.865-2.063-1.403-3.342-2.246-1.479-0.973-0.52-1.51 0.322-2.384 0.221-0.23 4.052-3.715 4.127-4.031 0.004-0.019 0.006-0.040 0.006-0.062 0-0.078-0.029-0.149-0.076-0.203l0 0c-0.052-0.034-0.117-0.053-0.185-0.053-0.045 0-0.088 0.009-0.128 0.024l0.002-0.001q-0.198 0.045-6.316 4.174c-0.445 0.351-1.007 0.573-1.619 0.599l-0.006 0c-0.867-0.105-1.654-0.298-2.401-0.573l0.074 0.024c-0.938-0.306-1.683-0.467-1.619-0.985q0.051-0.404 1.114-0.827 6.548-2.853 8.733-3.761c1.607-0.853 3.47-1.555 5.429-2.010l0.157-0.031zM15.93 1.025c-8.302 0.020-15.025 6.755-15.025 15.060 0 8.317 6.742 15.060 15.060 15.060s15.060-6.742 15.060-15.060c0-8.305-6.723-15.040-15.023-15.060h-0.002q-0.035-0-0.070 0z"></path>\n' +
                '</svg>';
            break;
        case "firefox":
            svgToReturn = '<svg fill="' + color + '" width="800px" height="800px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <title>firefoxbrowser</title>\n' +
                '    <path d="M29.469 11.061c-0.613-1.515-1.617-2.765-2.89-3.66l-0.026-0.017c0.674 1.276 1.187 2.757 1.458 4.321l0.013 0.090 0.003 0.025c-1.642-4.096-4.429-5.748-6.706-9.344-0.114-0.184-0.23-0.365-0.341-0.557q-0.087-0.147-0.162-0.3c-0.087-0.165-0.16-0.356-0.211-0.557l-0.004-0.018c0-0 0-0 0-0 0-0.019-0.015-0.035-0.034-0.037h-0c-0.004-0.001-0.008-0.002-0.013-0.002s-0.009 0.001-0.013 0.002l0-0-0.007 0.001-0.012 0.006 0.006-0.010c-2.571 1.601-4.387 4.207-4.905 7.255l-0.009 0.063c-1.057 0.061-2.039 0.325-2.927 0.754l0.046-0.020c-0.124 0.062-0.207 0.188-0.207 0.333 0 0.046 0.009 0.091 0.024 0.132l-0.001-0.003c0.052 0.144 0.187 0.245 0.345 0.245 0.054 0 0.106-0.012 0.152-0.033l-0.002 0.001c0.733-0.354 1.586-0.588 2.487-0.652l0.023-0.001 0.084-0.006c0.123-0.007 0.266-0.012 0.411-0.012 0.725 0 1.425 0.106 2.086 0.302l-0.052-0.013 0.119 0.037c0.313 0.096 0.568 0.193 0.816 0.303l-0.046-0.018c0.1 0.045 0.2 0.091 0.297 0.14l0.134 0.069q0.235 0.123 0.46 0.264c1.056 0.661 1.914 1.546 2.523 2.594l0.019 0.036c-0.796-0.559-1.786-0.893-2.854-0.893-0.229 0-0.454 0.015-0.675 0.045l0.026-0.003c1.888 1.039 3.146 3.015 3.146 5.285 0 3.32-2.692 6.012-6.012 6.012-0.195 0-0.388-0.009-0.578-0.027l0.024 0.002c-0.686-0.029-1.332-0.16-1.936-0.379l0.045 0.014c-0.267-0.095-0.489-0.193-0.703-0.305l0.031 0.015c-1.842-0.903-3.149-2.651-3.421-4.725l-0.003-0.031s0.671-2.499 4.805-2.499c0.759-0.325 1.365-0.886 1.738-1.589l0.009-0.019c-1.349-0.653-2.503-1.35-3.585-2.141l0.065 0.045c-0.527-0.52-0.777-0.77-1-0.958-0.111-0.094-0.234-0.187-0.361-0.274l-0.015-0.010c-0.164-0.554-0.259-1.19-0.259-1.849 0-0.605 0.080-1.192 0.23-1.75l-0.011 0.047c-1.379 0.676-2.542 1.586-3.487 2.688l-0.012 0.015h-0.007c-0.341-0.854-0.539-1.844-0.539-2.879 0-0.268 0.013-0.533 0.039-0.794l-0.003 0.033c-0.186 0.076-0.346 0.162-0.496 0.263l0.009-0.006c-0.527 0.379-0.991 0.779-1.418 1.215l-0.002 0.002c-0.484 0.491-0.929 1.023-1.329 1.588l-0.027 0.040c-0.894 1.251-1.57 2.724-1.936 4.316l-0.016 0.083c-0.004 0.016-0.137 0.608-0.237 1.341-0.016 0.112-0.032 0.226-0.046 0.34q-0.061 0.415-0.086 0.834l-0.002 0.043-0.029 0.484-0.001 0.075c0.002 8.025 6.508 14.53 14.534 14.53 7.157 0 13.106-5.173 14.311-11.985l0.013-0.088c0.025-0.186 0.044-0.372 0.065-0.56 0.069-0.541 0.109-1.166 0.109-1.801 0-1.981-0.386-3.872-1.086-5.602l0.036 0.1z"></path>\n' +
                '</svg>';
            break;
        case "sticky-open":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M66.667,600c-0,-62.853 -0,-94.28 19.526,-113.807c19.526,-19.526 50.953,-19.526 113.807,-19.526c62.854,-0 94.281,-0 113.807,19.526c19.526,19.527 19.526,50.954 19.526,113.807c0,62.853 0,94.28 -19.526,113.807c-19.526,19.526 -50.953,19.526 -113.807,19.526c-62.854,0 -94.281,0 -113.807,-19.526c-19.526,-19.527 -19.526,-50.954 -19.526,-113.807Z" style="fill:' + color + ';fill-rule:nonzero;stroke:' + color + ';stroke-width:1px;"/>\n' +
                '    <path d="M115.482,115.482c-48.815,48.816 -48.815,127.383 -48.815,284.518c-0,13.187 -0,25.82 0.029,37.927c16.936,-11.104 35.598,-15.967 53.491,-18.374c21.52,-2.893 47.976,-2.89 76.83,-2.886l5.967,-0c28.854,-0.004 55.31,-0.007 76.83,2.886c23.699,3.187 48.747,10.684 69.349,31.284c20.6,20.603 28.097,45.65 31.284,69.35c2.893,21.52 2.89,47.976 2.886,76.83l0,5.966c0.004,28.857 0.007,55.31 -2.886,76.83c-2.407,17.894 -7.267,36.554 -18.374,53.49c12.11,0.03 24.74,0.03 37.927,0.03c157.133,0 235.703,0 284.517,-48.816c48.816,-48.814 48.816,-127.384 48.816,-284.517c0,-157.135 0,-235.702 -48.816,-284.518c-48.814,-48.815 -127.384,-48.815 -284.517,-48.815c-157.135,-0 -235.702,-0 -284.518,48.815Zm409.518,309.518c13.807,0 25,-11.193 25,-25c0,-13.807 -11.193,-25 -25,-25l-64.643,-0l123.986,-123.989c9.764,-9.763 9.764,-25.592 0,-35.355c-9.763,-9.763 -25.59,-9.763 -35.353,-0l-123.99,123.987l0,-64.643c0,-13.807 -11.193,-25 -25,-25c-13.807,-0 -25,11.193 -25,25l0,125c0,13.807 11.193,25 25,25l125,-0Z"\n' +
                '          style="fill:' + color + ';stroke:' + color + ';stroke-width:1px;"/>\n' +
                '</svg>';
            break;
        case "sticky-close":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><path d="M66.667,600c-0,-62.853 -0,-94.28 19.526,-113.807c19.526,-19.526 50.953,-19.526 113.807,-19.526c62.854,-0 94.281,-0 113.807,19.526c19.526,19.527 19.526,50.954 19.526,113.807c0,62.853 0,94.28 -19.526,113.807c-19.526,19.526 -50.953,19.526 -113.807,19.526c-62.854,0 -94.281,0 -113.807,-19.526c-19.526,-19.527 -19.526,-50.954 -19.526,-113.807Z" style="fill:' + color + ';fill-rule:nonzero;stroke:' + color + ';stroke-width:1px;"/>\n' +
                '    <path d="M115.482,115.482c-48.815,48.816 -48.815,127.383 -48.815,284.518c-0,13.187 -0,25.82 0.029,37.927c16.936,-11.104 35.598,-15.967 53.491,-18.374c21.52,-2.893 47.976,-2.89 76.83,-2.886l5.967,-0c28.854,-0.004 55.31,-0.007 76.83,2.886c23.699,3.187 48.747,10.684 69.349,31.284c20.6,20.603 28.097,45.65 31.284,69.35c2.893,21.52 2.89,47.976 2.886,76.83l0,5.966c0.004,28.857 0.007,55.31 -2.886,76.83c-2.407,17.894 -7.267,36.554 -18.374,53.49c12.11,0.03 24.74,0.03 37.927,0.03c157.133,0 235.703,0 284.517,-48.816c48.816,-48.814 48.816,-127.384 48.816,-284.517c0,-157.135 0,-235.702 -48.816,-284.518c-48.814,-48.815 -127.384,-48.815 -284.517,-48.815c-157.135,-0 -235.702,-0 -284.518,48.815Zm326.185,92.851c-13.807,0 -25,11.193 -25,25c-0,13.807 11.193,25 25,25l64.643,0l-123.987,123.99c-9.763,9.764 -9.763,25.59 0,35.354c9.764,9.763 25.59,9.763 35.354,-0l123.99,-123.988l-0,64.644c-0,13.807 11.193,25 25,25c13.806,0 25,-11.193 25,-25l-0,-125c-0,-13.807 -11.194,-25 -25,-25l-125,0Z"\n' +
                '          style="fill:' + color + ';stroke:' + color + ';stroke-width:1px;"/>\n' +
                '</svg>';
            break;
        case "sticky-minimize":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 334 334" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g transform="matrix(0.416667,0,0,0.416667,0,0)">\n' +
                '        <path d="M54.167,400C54.167,413.807 65.36,425 79.167,425L444.92,425L379.563,481.02C369.08,490.003 367.867,505.787 376.853,516.27C385.837,526.753 401.62,527.967 412.103,518.98L528.77,418.98C534.31,414.233 537.5,407.297 537.5,400C537.5,392.703 534.31,385.767 528.77,381.02L412.103,281.019C401.62,272.033 385.837,273.247 376.853,283.73C367.867,294.213 369.08,309.996 379.563,318.981L444.92,375L79.167,375C65.36,375 54.167,386.193 54.167,400Z" style="fill:' + color + ';"/>\n' +
                '        <path d="M312.5,325.001L325.109,325.001C316.491,300.548 320.803,272.292 338.89,251.192C365.847,219.743 413.193,216.1 444.643,243.057L561.31,343.057C577.933,357.307 587.5,378.107 587.5,400C587.5,421.897 577.933,442.697 561.31,456.947L444.643,556.947C413.193,583.903 365.847,580.26 338.89,548.81C320.803,527.71 316.491,499.453 325.109,475L312.5,475L312.5,533.333C312.5,627.613 312.5,674.753 341.79,704.043C371.08,733.333 418.22,733.333 512.5,733.333L545.833,733.333C640.113,733.333 687.253,733.333 716.543,704.043C745.833,674.753 745.833,627.613 745.833,533.333L745.833,266.667C745.833,172.386 745.833,125.245 716.543,95.956C687.253,66.667 640.113,66.667 545.833,66.667L512.5,66.667C418.22,66.667 371.08,66.667 341.79,95.956C312.5,125.245 312.5,172.386 312.5,266.667L312.5,325.001Z" style="fill:' + color + ';fill-rule:nonzero;"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "sticky-restore":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 334 334" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g transform="matrix(0.416667,0,0,0.416667,0,0)">\n' +
                '        <path d="M537.5,400C537.5,386.193 526.307,375 512.5,375L146.748,375L212.103,318.981C222.586,309.996 223.8,294.213 214.815,283.73C205.829,273.247 190.047,272.033 179.564,281.019L62.897,381.02C57.356,385.767 54.167,392.703 54.167,400C54.167,407.297 57.356,414.233 62.897,418.98L179.564,518.98C190.047,527.967 205.829,526.753 214.815,516.27C223.8,505.787 222.586,490.003 212.103,481.02L146.748,425L512.5,425C526.307,425 537.5,413.807 537.5,400Z" style="fill:' + color + ';"/>\n' +
                '        <path d="M312.5,266.667C312.5,290.073 312.5,301.776 318.117,310.183C320.549,313.824 323.675,316.949 327.315,319.382C335.723,324.999 347.427,324.999 370.833,324.999L512.5,324.999C553.92,324.999 587.5,358.577 587.5,400C587.5,441.42 553.92,475 512.5,475L370.833,475C347.427,475 335.72,475 327.313,480.617C323.674,483.05 320.55,486.173 318.118,489.813C312.5,498.22 312.5,509.923 312.5,533.333C312.5,627.613 312.5,674.753 341.79,704.043C371.08,733.333 418.213,733.333 512.493,733.333L545.827,733.333C640.107,733.333 687.247,733.333 716.537,704.043C745.827,674.753 745.827,627.613 745.827,533.333L745.827,266.667C745.827,172.386 745.827,125.245 716.537,95.956C687.247,66.667 640.107,66.667 545.827,66.667L512.493,66.667C418.213,66.667 371.08,66.667 341.79,95.956C312.5,125.245 312.5,172.386 312.5,266.667Z" style="fill:' + color + ';fill-rule:nonzero;"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "bold":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <path d="M160,40C138.057,40 120,58.057 120,80L120,720C120,741.943 138.057,760 160,760L160,720L160,760L480.149,760C589.866,760 680.149,669.717 680.149,560C680.149,476.599 627.981,401.565 549.8,372.52C582.139,335.965 600.005,288.807 600.005,240C600.005,130.283 509.722,40 400.005,40L160,40ZM400,360C465.83,360 520,305.83 520,240C520,174.17 465.83,120 400,120L200,120L200,360L400,360ZM200,440L200,680L480,680C545.83,680 600,625.83 600,560C600,494.17 545.83,440 480,440L200,440Z"\n' +
                '          style="fill:' + color + ';stroke:' + color + ';stroke-width:30px;"/>\n' +
                '</svg>';
            break;
        case "italic":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">\n' +
                '    <path stroke="' + color + '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"\n' +
                '          d="M12 3L8 17m4-14H8m4 0h4M8 17H4m4 0h4"/>\n' +
                '</svg>';
            break;
        case "underline":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">\n' +
                '    <path fill="' + color + '" fill-rule="evenodd"\n' +
                '          d="M5 2a1 1 0 00-2 0v6a7 7 0 1014 0V2a1 1 0 10-2 0v6A5 5 0 015 8V2zM3.01 17.636a1 1 0 01.855-1.127L4 17.5l.135.99a1 1 0 01-1.126-.854zM4 17.5l.135.99h.01l.03-.005.116-.015a67.291 67.291 0 011.933-.225C7.425 18.12 8.883 18 10 18s2.575.12 3.776.245a77.975 77.975 0 011.933.225l.117.015.03.005h.008a1 1 0 00.271-1.98l-.134.98.134-.98-.003-.001-.009-.001-.032-.005-.123-.016a78.927 78.927 0 00-1.986-.232C12.768 16.13 11.226 16 10 16c-1.226 0-2.768.13-3.982.255a78.898 78.898 0 00-1.986.232l-.123.016-.033.005h-.008l-.002.001h-.001L4 17.5z"/>\n' +
                '</svg>';
            break;
        case "strikethrough":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" fill="none">\n' +
                '    <path fill="' + color + '" fill-rule="evenodd"\n' +
                '          d="M5 3a1 1 0 10-2 0v6H2v1-1a1 1 0 000 2v-1 1h1a7 7 0 1014 0h.999L18 10v1a1 1 0 100-2v1-1h-1V3a1 1 0 10-2 0v6H5V3zm0 8a5 5 0 0010 0H5z"/>\n' +
                '</svg>';
            break;
        case "align-center":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(0.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_center_fill" transform="translate(0.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M17,17.5 C17.8284,17.5 18.5,18.1716 18.5,19 C18.5,19.7796706 17.9050879,20.4204457 17.1444558,20.4931332 L17,20.5 L7,20.5 C6.17157,20.5 5.5,19.8284 5.5,19 C5.5,18.2203294 6.09488554,17.5795543 6.85553954,17.5068668 L7,17.5 L17,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M17,7.5 C17.8284,7.5 18.5,8.17157 18.5,9 C18.5,9.77969882 17.9050879,10.420449 17.1444558,10.4931335 L17,10.5 L7,10.5 C6.17157,10.5 5.5,9.82843 5.5,9 C5.5,8.22030118 6.09488554,7.579551 6.85553954,7.50686655 L7,7.5 L17,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "align-left":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-48.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_left_fill" transform="translate(48.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M14,17.5 C14.8284,17.5 15.5,18.1716 15.5,19 C15.5,19.7796706 14.9050879,20.4204457 14.1444558,20.4931332 L14,20.5 L4,20.5 C3.17157,20.5 2.5,19.8284 2.5,19 C2.5,18.2203294 3.09488554,17.5795543 3.85553954,17.5068668 L4,17.5 L14,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M14,7.5 C14.8284,7.5 15.5,8.17157 15.5,9 C15.5,9.77969882 14.9050879,10.420449 14.1444558,10.4931335 L14,10.5 L4,10.5 C3.17157,10.5 2.5,9.82843 2.5,9 C2.5,8.22030118 3.09488554,7.579551 3.85553954,7.50686655 L4,7.5 L14,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "align-right":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-96.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="align_right_fill" transform="translate(96.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M20,17.5 C20.8284,17.5 21.5,18.1716 21.5,19 C21.5,19.7796706 20.9050879,20.4204457 20.1444558,20.4931332 L20,20.5 L10,20.5 C9.17157,20.5 8.5,19.8284 8.5,19 C8.5,18.2203294 9.09488554,17.5795543 9.85553954,17.5068668 L10,17.5 L20,17.5 Z M20,12.5 C20.8284,12.5 21.5,13.1716 21.5,14 C21.5,14.8284 20.8284,15.5 20,15.5 L4,15.5 C3.17157,15.5 2.5,14.8284 2.5,14 C2.5,13.1716 3.17157,12.5 4,12.5 L20,12.5 Z M20,7.5 C20.8284,7.5 21.5,8.17157 21.5,9 C21.5,9.77969882 20.9050879,10.420449 20.1444558,10.4931335 L20,10.5 L10,10.5 C9.17157,10.5 8.5,9.82843 8.5,9 C8.5,8.22030118 9.09488554,7.579551 9.85553954,7.50686655 L10,7.5 L20,7.5 Z M20,2.5 C20.8284,2.5 21.5,3.17157 21.5,4 C21.5,4.77969882 20.9050879,5.420449 20.1444558,5.49313345 L20,5.5 L4,5.5 C3.17157,5.5 2.5,4.82843 2.5,4 C2.5,3.22030118 3.09488554,2.579551 3.85553954,2.50686655 L4,2.5 L20,2.5 Z" id="形状" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "u-list":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-720.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="list_check_fill" transform="translate(720.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M20,17.5 C20.8284,17.5 21.5,18.1716 21.5,19 C21.5,19.8284 20.8284,20.5 20,20.5 L9,20.5 C8.17157,20.5 7.5,19.8284 7.5,19 C7.5,18.1716 8.17157,17.5 9,17.5 L20,17.5 Z M4.5,17.5 C5.32843,17.5 6,18.1716 6,19 C6,19.8284 5.32843,20.5 4.5,20.5 C3.67157,20.5 3,19.8284 3,19 C3,18.1716 3.67157,17.5 4.5,17.5 Z M20,10.5 C20.8284,10.5 21.5,11.1716 21.5,12 C21.5,12.7796706 20.9050879,13.4204457 20.1444558,13.4931332 L20,13.5 L9,13.5 C8.17157,13.5 7.5,12.8284 7.5,12 C7.5,11.2203294 8.09488554,10.5795543 8.85553954,10.5068668 L9,10.5 L20,10.5 Z M4.5,10.5 C5.32843,10.5 6,11.1716 6,12 C6,12.8284 5.32843,13.5 4.5,13.5 C3.67157,13.5 3,12.8284 3,12 C3,11.1716 3.67157,10.5 4.5,10.5 Z M4.5,3.5 C5.32843,3.5 6,4.17157 6,5 C6,5.82843 5.32843,6.5 4.5,6.5 C3.67157,6.5 3,5.82843 3,5 C3,4.17157 3.67157,3.5 4.5,3.5 Z M20,3.5 C20.8284,3.5 21.5,4.17157 21.5,5 C21.5,5.77969882 20.9050879,6.420449 20.1444558,6.49313345 L20,6.5 L9,6.5 C8.17157,6.5 7.5,5.82843 7.5,5 C7.5,4.22030118 8.09488554,3.579551 8.85553954,3.50686655 L9,3.5 L20,3.5 Z" id="形状" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "o-list":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Editor" transform="translate(-768.000000, -48.000000)" fill-rule="nonzero">\n' +
                '            <g id="list_ordered_fill" transform="translate(768.000000, 48.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M5.43576,16.7201 C6.24693,16.7201 6.90006,17.3805 6.90006,18.1868 C6.90006,18.4773 6.81334,18.7582 6.65581,18.9952 C6.81328,19.2321 6.89997,19.513 6.89997,19.8035 C6.89997,20.6097 6.24685,21.2701 5.43567,21.2701 C4.84927,21.2701 4.30154,21.0591 4.0556,20.4795 C3.90259,20.1189 3.94402,19.6904 4.35318,19.5168 C4.68364,19.3766 5.06521,19.5308 5.20544,19.8612 C5.23345,19.9273 5.29823,19.9727 5.36993,19.971 C5.48374,19.9684 5.59997,19.9445 5.59997,19.8035 C5.59997,19.7025833 5.52687972,19.6598611 5.44355218,19.6484236 L5.39283,19.6451 C5.03384,19.6451 4.74283,19.3541 4.74283,18.9951 C4.74283,18.7504 4.87806,18.5373 5.07787,18.4264 C5.14009,18.3918667 5.20856778,18.3672444 5.28117296,18.3546667 L5.39291,18.3451 C5.49481,18.3451 5.60006,18.3078 5.60006,18.1868 C5.60006,18.0457 5.48385,18.0218 5.37005,18.0192 C5.29835,18.0175 5.23357,18.063 5.20556,18.129 C5.06533,18.4595 4.68376,18.6137 4.3533,18.4735 C3.94414,18.2998 3.90271,17.8713 4.05572,17.5107 C4.30166,16.9311 4.84937,16.7201 5.43576,16.7201 Z M20,17.5001 C20.8284,17.5001 21.5,18.1717 21.5,19.0001 C21.5,19.8285 20.8284,20.5001 20,20.5001 L9,20.5001 C8.17157,20.5001 7.5,19.8285 7.5,19.0001 C7.5,18.1717 8.17157,17.5001 9,17.5001 L20,17.5001 Z M6.08078,9.94527 C6.72558,10.2677 7.05451,11.0088 6.88063,11.7043 C6.81679,11.9597 6.68907,12.1946 6.50947,12.387 L5.95592,12.9801 L6.4256,12.9801 C6.78459,12.9801 7.0756,13.2711 7.0756,13.6301 C7.0756,13.9891 6.78459,14.2801 6.4256,14.2801 L4.5731,14.2801 C4.21155,14.2801 3.91846,13.987 3.91846,13.6255 C3.91846,13.4195 3.9468,13.2275 4.09452,13.0692 L5.5591,11.5 C5.70059,11.3484 5.58869,11.0272 5.35616,11.0853 C5.268656,11.10722 5.2330304,11.17394 5.22228032,11.2502344 L5.21846,11.3087 C5.21846,11.6677 4.92744,11.9587 4.56846,11.9587 C4.20947,11.9587 3.91846,11.6677 3.91846,11.3087 C3.91846,10.6174 4.357,9.99512 5.04087,9.82415 C5.3917,9.73644 5.75867,9.78422 6.08078,9.94527 Z M20,10.5001 C20.8284,10.5001 21.5,11.1717 21.5,12.0001 C21.5,12.7797706 20.9050879,13.4205457 20.1444558,13.4932332 L20,13.5001 L9,13.5001 C8.17157,13.5001 7.5,12.8285 7.5,12.0001 C7.5,11.2204294 8.09488554,10.5796543 8.85553954,10.5069668 L9,10.5001 L20,10.5001 Z M6.15004,3.3895 L6.15004,6.63016 C6.15004,6.98914 5.85903,7.28016 5.50004,7.28016 C5.14106,7.28016 4.85004,6.98914 4.85004,6.63016 L4.85004,4.52258 C4.60765,4.56015 4.35422,4.45823 4.20921,4.24071 C4.01008,3.94202 4.0908,3.53845 4.38949,3.33932 L5.13172,2.84451 C5.56699,2.55432 6.15004,2.86634 6.15004,3.3895 Z M20,3.50012 C20.8284,3.50012 21.5,4.17169 21.5,5.00012 C21.5,5.77981882 20.9050879,6.420569 20.1444558,6.49325345 L20,6.50012 L9,6.50012 C8.17157,6.50012 7.5,5.82855 7.5,5.00012 C7.5,4.22042118 8.09488554,3.579671 8.85553954,3.50698655 L9,3.50012 L20,3.50012 Z" id="形状" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "undo":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Arrow" transform="translate(-480.000000, -50.000000)" fill-rule="nonzero">\n' +
                '            <g id="back_2_fill" transform="translate(480.000000, 50.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z"\n' +
                '                      id="MingCute" fill-rule="nonzero">\n' +
                '                </path>\n' +
                '                <path d="M7.16075,10.9724 C8.44534,9.45943 10.3615,8.5 12.5,8.5 C16.366,8.5 19.5,11.634 19.5,15.5 C19.5,16.3284 20.1715,17 21,17 C21.8284,17 22.5,16.3284 22.5,15.5 C22.5,9.97715 18.0228,5.5 12.5,5.5 C9.55608,5.5 6.91086,6.77161 5.08155,8.79452 L4.73527,6.83068 C4.59142,6.01484 3.81343,5.47009 2.99759,5.61394 C2.18175,5.7578 1.637,6.53578 1.78085,7.35163 L2.82274,13.2605 C2.89182,13.6523 3.11371,14.0005 3.43959,14.2287 C3.84283,14.5111 4.37354,14.5736 4.82528,14.4305 L10.4693,13.4353 C11.2851,13.2915 11.8299,12.5135 11.686,11.6976 C11.5422,10.8818 10.7642,10.337 9.94833,10.4809 L7.16075,10.9724 Z"\n' +
                '                      fill="' + color + '">\n' +
                '                </path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "redo":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n' +
                '    <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n' +
                '        <g id="Arrow" transform="translate(-528.000000, -50.000000)" fill-rule="nonzero">\n' +
                '            <g id="forward_2_fill" transform="translate(528.000000, 50.000000)">\n' +
                '                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero">\n' +
                '</path>\n' +
                '                <path d="M16.8392,10.9724 C15.5546,9.45943 13.6384,8.5 11.5,8.5 C7.63401,8.5 4.5,11.634 4.5,15.5 C4.5,16.3284 3.82843,17 3,17 C2.17157,17 1.5,16.3284 1.5,15.5 C1.5,9.97715 5.97715,5.5 11.5,5.5 C14.4439,5.5 17.0891,6.77161 18.9184,8.79452 L19.2647,6.83068 C19.4085,6.01484 20.1865,5.47009 21.0024,5.61394 C21.8182,5.7578 22.363,6.53578 22.2191,7.35163 L21.1772,13.2605 C21.1081,13.6523 20.8863,14.0005 20.5604,14.2287 C20.1571,14.5111 19.6264,14.5736 19.1747,14.4305 L13.5307,13.4353 C12.7149,13.2915 12.1701,12.5135 12.314,11.6976 C12.4578,10.8818 13.2358,10.337 14.0516,10.4809 L16.8392,10.9724 Z" fill="' + color + '">\n' +
                '</path>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "spellcheck_sel":
            svgToReturn = '<svg fill="' + color + '" width="800px" height="800px" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd"\n' +
                '          d="M5.54045123,6.00229535 L2.45653991,6.00229535 L1.95069073,7.38869124 C1.78049224,7.8551593 1.21680255,8.11075033 0.691654566,7.95956978 C0.166506582,7.80838924 -0.121236838,7.30768613 0.0489616489,6.84121807 L2.09676649,1.22873845 C2.43716347,0.29580234 3.56454285,-0.215379716 4.61483881,0.0869813682 C5.22459088,0.262517886 5.70260629,0.687119952 5.90022465,1.22873845 L7.94802949,6.84121807 C8.11822798,7.30768613 7.83048456,7.80838924 7.30533658,7.95956978 C6.78018859,8.11075033 6.2164989,7.8551593 6.04630042,7.38869124 L5.54045123,6.00229535 Z M4.81043941,4.00153023 L3.99849557,1.77621162 L3.18655173,4.00153023 L4.81043941,4.00153023 Z M7.34609832,11.5848629 L12.2936504,6.63322182 C12.6840015,6.24254813 13.3168856,6.24254813 13.7072367,6.63322182 C14.0975878,7.02389551 14.0975878,7.65730271 13.7072367,8.0479764 L8.05289148,13.7069947 C7.6625404,14.0976684 7.02965625,14.0976684 6.63930517,13.7069947 L3.81213257,10.8774856 C3.42178149,10.4868119 3.42178149,9.85340468 3.81213257,9.46273099 C4.20248364,9.0720573 4.83536779,9.0720573 5.22571887,9.46273099 L7.34609832,11.5848629 Z"/>\n' +
                '</svg>';
            break;
        case "spellcheck":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <path d="M316.597,342.988L140.374,342.988L111.468,422.211C101.742,448.866 69.532,463.471 39.523,454.833C9.515,446.194 -6.928,417.582 2.798,390.927L119.815,70.214C139.266,16.903 203.688,-12.307 263.705,4.97C298.548,15.001 325.863,39.264 337.156,70.214L454.173,390.927C463.899,417.582 447.456,446.194 417.448,454.833C387.439,463.471 355.229,448.866 345.503,422.211L316.597,342.988ZM274.882,228.659L228.485,101.498L182.089,228.659L274.882,228.659Z"\n' +
                '          style="fill:' + color + ';stroke:' + color + ';stroke-width:1px;"/>\n' +
                '    <g transform="matrix(1.27545,0,0,1.27545,57.4755,57.1694)">\n' +
                '        <path d="M233.162,233.545C220.144,246.563 220.144,267.668 233.162,280.686L352.667,400.19L233.162,519.697C220.144,532.713 220.144,553.82 233.162,566.837C246.179,579.853 267.285,579.853 280.302,566.837L399.807,447.33L519.313,566.837C532.33,579.853 553.437,579.853 566.453,566.837C579.47,553.82 579.47,532.713 566.453,519.697L446.947,400.19L566.453,280.686C579.47,267.669 579.47,246.563 566.453,233.546C553.433,220.528 532.33,220.528 519.313,233.546L399.807,353.05L280.302,233.545C267.285,220.528 246.179,220.528 233.162,233.545Z"\n' +
                '              style="fill-rule:nonzero;fill:' + color + ';stroke:' + color + ';stroke-width:11.76px;"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "link":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 693 504" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g transform="matrix(1,0,0,1,-106.185,-106.185)">\n' +
                '        <g transform="matrix(1,0,0,1,52.3274,-41.9636)">\n' +
                '            <path d="M282.296,563.495C296.013,550.691 317.546,551.432 330.351,565.15C343.155,578.867 342.414,600.4 328.696,613.205C318.341,622.87 310.192,629.166 302.001,633.897L301.999,633.898C260.538,657.836 209.458,657.835 167.999,633.898C154.895,626.332 141.868,614.224 116.677,589.035C91.484,563.842 79.376,550.814 71.81,537.709C47.874,496.249 47.874,445.169 71.811,403.71C79.376,390.608 91.484,377.581 116.676,352.388L210.957,258.107C236.148,232.917 249.175,220.808 262.279,213.242C303.74,189.306 354.821,189.306 396.282,213.243C409.383,220.809 422.41,232.917 447.601,258.107C472.793,283.299 484.902,296.326 492.467,309.429C516.405,350.889 516.406,401.971 492.467,443.432L492.466,443.434C487.735,451.625 481.437,459.779 471.764,470.135C458.955,483.849 437.422,484.583 423.709,471.774C409.995,458.965 409.261,437.432 422.07,423.719C427.323,418.094 431.01,413.876 433.58,409.427C445.368,389.008 445.368,363.85 433.579,343.431C427.977,333.73 418.169,324.841 399.519,306.191C380.868,287.541 371.978,277.733 362.279,272.131C341.859,260.342 316.7,260.343 296.279,272.132C286.579,277.733 277.69,287.541 259.041,306.191L164.76,400.472C146.109,419.122 136.301,428.011 130.701,437.711C118.911,458.131 118.911,483.289 130.702,503.711L130.703,503.713C136.302,513.414 146.11,522.302 164.759,540.951C183.409,559.599 192.298,569.407 201.999,575.008C222.419,586.798 247.576,586.798 267.996,575.01C272.448,572.439 276.667,568.75 282.296,563.495ZM328.216,329.865C341.025,316.151 362.558,315.417 376.271,328.226C389.985,341.035 390.719,362.568 377.91,376.281C372.657,381.905 368.97,386.124 366.401,390.572C354.613,410.992 354.614,436.151 366.402,456.571C372.003,466.272 381.811,475.161 400.461,493.808C419.112,512.459 428.002,522.268 437.702,527.869C458.121,539.658 483.28,539.658 503.701,527.868C513.402,522.267 522.291,512.458 540.941,493.808L635.221,399.528C653.87,380.88 663.678,371.992 669.277,362.291L669.278,362.289C681.068,341.869 681.068,316.711 669.277,296.287L669.275,296.284C663.677,286.585 653.869,277.698 635.222,259.051C616.571,240.401 607.682,230.592 597.983,224.992C577.561,213.202 552.404,213.201 531.981,224.993L531.977,224.995C527.526,227.564 523.311,231.253 517.683,236.506C503.966,249.311 482.433,248.57 469.629,234.852C456.824,221.135 457.565,199.602 471.283,186.798C481.642,177.127 489.792,170.83 497.986,166.101C539.445,142.165 590.52,142.165 631.983,166.102C645.085,173.667 658.112,185.775 683.304,210.967C708.497,236.159 720.606,249.188 728.169,262.293C752.105,303.751 752.105,354.83 728.169,396.289C720.606,409.391 708.497,422.419 683.305,447.612L589.025,541.892C563.832,567.084 550.805,579.192 537.7,586.758C496.24,610.696 445.159,610.695 403.698,586.757C390.597,579.191 377.57,567.083 352.379,541.892C327.186,516.703 315.078,503.675 307.512,490.569C283.577,449.11 283.577,398.03 307.513,356.568L307.514,356.566C312.245,348.375 318.543,340.221 328.216,329.865Z"' +
                '              style="fill-rule:nonzero;fill:' + color + '"/>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "search-icon-tooltip":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g id="Warning / Info">\n' +
                '        <path id="Vector"\n' +
                '              d="M12 11V16M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 8V8.1L11.9502 8.1002V8H12.0498Z"\n' +
                '              stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "arrow-select":
            svgToReturn = '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M4.43057 8.51192C4.70014 8.19743 5.17361 8.161 5.48811 8.43057L12 14.0122L18.5119 8.43057C18.8264 8.16101 19.2999 8.19743 19.5695 8.51192C19.839 8.82642 19.8026 9.29989 19.4881 9.56946L12.4881 15.5695C12.2072 15.8102 11.7928 15.8102 11.5119 15.5695L4.51192 9.56946C4.19743 9.29989 4.161 8.82641 4.43057 8.51192Z"\n' +
                '          fill="' + color + '"/>\n' +
                '</svg>';
            break;
        case "arrow-right":
            svgToReturn = '<svg width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <path d="M448.99,182.322C458.753,172.559 474.58,172.559 484.343,182.322L684.343,382.323C694.107,392.087 694.107,407.913 684.343,417.677L484.343,617.677C474.58,627.44 458.753,627.44 448.99,617.677C439.227,607.913 439.227,592.087 448.99,582.323L606.31,425L133.333,425C119.526,425 108.333,413.807 108.333,400C108.333,386.193 119.526,375 133.333,375L606.31,375L448.99,217.678C439.227,207.915 439.227,192.085 448.99,182.322Z"\n' +
                '          style="fill:' + color + '"/>\n' +
                '</svg>';
            break;
        case "review":
            svgToReturn = '' +
                '<svg fill="none" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m11.2691 4.41115c.2315-.51938.3473-.77907.5085-.85904.14-.06948.3044-.06948.4444 0 .1612.07997.277.33966.5085.85904l1.844 4.13693c.0685.15354.1027.23031.1557.2891.0468.05202.1041.09363.168.12211.0723.0322.1559.04102.3231.05866l4.5043.47541c.5655.05968.8482.08952.9741.21811.1093.11169.1601.26809.1373.42273-.0262.178-.2374.3683-.6598.749l-3.3647 3.0322c-.1248.1125-.1873.1688-.2268.2373-.035.0607-.0569.128-.0642.1976-.0083.0787.0091.1609.044.3254l.9398 4.4307c.118.5563.177.8344.0936.9938-.0725.1386-.2055.2352-.3596.2613-.1774.03-.4237-.112-.9163-.3961l-3.9235-2.263c-.1456-.084-.2184-.1259-.2958-.1424-.0685-.0145-.1393-.0145-.2078 0-.0774.0165-.1502.0584-.2958.1424l-3.92348 2.263c-.49258.2841-.73887.4261-.91628.3961-.15411-.0261-.28715-.1227-.35959-.2613-.08339-.1594-.0244-.4375.09359-.9938l.93976-4.4307c.03488-.1645.05232-.2467.04404-.3254-.00733-.0696-.0292-.1369-.0642-.1976-.03955-.0685-.10199-.1248-.22686-.2373l-3.36462-3.0322c-.42241-.3807-.63362-.571-.65988-.749-.0228-.15464.02801-.31104.13735-.42273.12588-.12859.40863-.15843.97413-.21811l4.50429-.47541c.16718-.01764.25076-.02646.32304-.05866.06395-.02848.12121-.07009.16807-.12211.05295-.05879.08717-.13556.15562-.2891z"\n' +
                '       style="fill:' + color + '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>\n' +
                '</svg>';
            break;
        case "help":
            svgToReturn = '' +
                '<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path fill-rule="evenodd" clip-rule="evenodd"\n' +
                '          d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM12 9C11.7015 9 11.4344 9.12956 11.2497 9.33882C10.8843 9.75289 10.2523 9.79229 9.83827 9.42683C9.4242 9.06136 9.3848 8.42942 9.75026 8.01535C10.2985 7.3942 11.1038 7 12 7C13.6569 7 15 8.34315 15 10C15 11.3072 14.1647 12.4171 13 12.829V13C13 13.5523 12.5523 14 12 14C11.4477 14 11 13.5523 11 13V12.5C11 11.6284 11.6873 11.112 12.2482 10.9692C12.681 10.859 13 10.4655 13 10C13 9.44772 12.5523 9 12 9ZM12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17H12.01C12.5623 17 13.01 16.5523 13.01 16C13.01 15.4477 12.5623 15 12.01 15H12Z"\n' +
                '          style="fill:' + color + '"/>\n' +
                '</svg>';
            break;
        case "website":
            svgToReturn = '' +
                '<svg fill="none" height="800" stroke="' + color + '" stroke-width="3" viewBox="0 0 64 64" width="800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m39.93 55.72a24.86 24.86 0 1 1 16.93-23.57 37.24 37.24 0 0 1 -.73 6"/>\n' +
                '    <path d="m37.86 51.1a47 47 0 0 1 -5.86 5.6"/>\n' +
                '    <path d="m32 7a34.14 34.14 0 0 1 11.57 23 34.07 34.07 0 0 1 .09 4.85"/>\n' +
                '    <path d="m32 7a34.09 34.09 0 0 0 -11.69 25.46c0 16.2 7.28 21 11.66 24.24"/>\n' +
                '    <path d="m10.37 19.9h43.38"/>\n' +
                '    <path d="m32 6.99v49.71"/>\n' +
                '    <path d="m11.05 45.48h25.99"/>\n' +
                '    <path d="m7.14 32.46 49.72-.61"/>\n' +
                '    <path d="m53.57 57 4.43-4.44-8-8 4.55-2.91a.38.38 0 0 0 -.12-.7l-15.29-3.58a.39.39 0 0 0 -.46.46l3.32 15.58a.39.39 0 0 0 .71.13l2.86-4.54z"/>\n' +
                '</svg>';
            break;
        case "all-notes":
            svgToReturn = '' +
                '<svg fill="none" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path clip-rule="evenodd"\n' +
                '          d="m16.3939 2.02121.0665.01783c1.0994.29457 1.9706.528 2.6558.77554.701.25321 1.2726.54286 1.7435.98389.6856.64221 1.1655 1.47332 1.3788 2.38824.1465.62832.1116 1.26815-.0196 2.00178-.1283.71724-.3617 1.58848-.6563 2.68791l-.5355 1.9983c-.2945 1.0993-.528 1.9705-.7755 2.6558-.2532.7009-.5429 1.2725-.9839 1.7434-.6218.6638-1.4206 1.1348-2.3012 1.3577-.2572.5897-.6329 1.1238-1.1068 1.5677-.4709.441-1.0425.7306-1.7435.9839-.6852.2475-1.5564.4809-2.6557.7755l-.0665.0178c-1.0994.2946-1.97063.528-2.68787.6563-.73363.1312-1.37347.1661-2.00178.0196-.91492-.2133-1.74603-.6932-2.38824-1.3788-.44103-.4709-.73069-1.0425-.98389-1.7434-.24754-.6853-.48098-1.5565-.77555-2.6559l-.53545-1.9983c-.29458-1.0994-.52802-1.9706-.65627-2.6878-.13119-.7336-.16614-1.3735-.01964-2.0018.21333-.91491.69318-1.74602 1.37886-2.38823.47088-.44103 1.04247-.73068 1.74341-.98389.68525-.24754 1.55646-.48098 2.65583-.77555l.03324-.0089c.26447-.07087.51469-.1378.7516-.20039.39161-1.39913.73623-2.38818 1.40786-3.10527.6422-.68568 1.47329-1.16553 2.38819-1.37886.6284-.1465 1.2682-.11155 2.0018.01964.7172.12824 1.5884.36169 2.6878.65626zm-8.93888 5.48159c-1.09288.29291-1.87597.50484-2.47782.72225-.60942.22015-.96725.42402-1.22765.66791-.46915.43941-.79746 1.00807-.94342 1.63404-.08102.3475-.07866.7593.03539 1.3972.11571.647.33203 1.4568.6375 2.5968l.51764 1.9319c.30546 1.14.52301 1.9494.74633 2.5676.22015.6095.42402.9673.66791 1.2277.43941.4691 1.00807.7974 1.63406.9434.34746.081.75929.0787 1.39714-.0354.64705-.1157 1.45683-.332 2.5968-.6375 1.14-.3055 1.9495-.523 2.5677-.7463.6094-.2202.9673-.424 1.2277-.6679.1376-.1289.263-.2688.3753-.418-.179-.0253-.3633-.0575-.5539-.0954-.6718-.1336-1.4788-.3498-2.4749-.6167l-.0574-.0154c-1.0994-.2946-1.9706-.528-2.65582-.7755-.70094-.2533-1.27253-.5429-1.74342-.9839-.68567-.6422-1.16552-1.4734-1.37885-2.3883-.1465-.6283-.11155-1.2681.01963-2.0018.12826-.7172.3617-1.5884.65628-2.68776zm5.98708-4.66128c-.6379-.11405-1.0497-.11641-1.3971-.03539-.626.14596-1.1947.47427-1.6341.94342-.43611.46563-.70448 1.18497-1.1712 2.89368-.07586.2777-.15605.577-.24305.90165l-.51763 1.93185c-.30547 1.13997-.52179 1.94977-.6375 2.59687-.11405.6378-.11641 1.0496-.03539 1.3971.14596.626.47427 1.1947.94342 1.6341.2604.2439.61823.4477 1.22765.6679.6182.2233 1.4277.4409 2.5677.7463 1.0254.2748 1.7854.478 2.4033.6009.6153.1223 1.0328.1524 1.375.1101.0744-.0091.1459-.0218.2157-.0381.626-.146 1.1946-.4743 1.634-.9434.2439-.2604.4478-.6182.6679-1.2277.2234-.6182.4409-1.4276.7464-2.5676l.5176-1.9319c.3055-1.14001.5218-1.94979.6375-2.59684.1141-.63785.1164-1.04967.0354-1.39713-.146-.626-.4743-1.19466-.9434-1.63406-.2604-.2439-.6183-.44777-1.2277-.66792-.6182-.22332-1.4277-.44087-2.5677-.74633-1.14-.30547-1.9497-.52179-2.5968-.6375zm-2.3897 6.96436c.1072-.4001.5185-.63754.9186-.53033l4.8296 1.29405c.4001.1072.6375.5185.5303.9186s-.5184.6375-.9185.5303l-4.8297-1.2941c-.4001-.1072-.6375-.5184-.5303-.91852zm-.7769 2.89772c.1073-.4001.5185-.6376.9186-.5303l2.8978.7764c.4001.1072.6375.5185.5303.9186s-.5184.6375-.9185.5303l-2.8978-.7765c-.4001-.1072-.6376-.5184-.5304-.9185z"\n' +
                '          style="fill:' + color + '"/>\n' +
                '</svg>';
            break;
        case "signup":
        case "login":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g>\n' +
                '        <path d="m20.1633 4.09295-5.1021-1.92223c-.9183-.30351-1.8367-.20234-2.551.30351-.3061.20234-.5102.40468-.7143.60702h-3.87753c-1.53061 0-2.85715 1.31521-2.85715 2.83276v1.01169c0 .40468.30613.80936.81633.80936.51021 0 .81633-.40468.81633-.80936v-1.01169c0-.70819.61224-1.21404 1.22449-1.21404h3.36733v14.66963h-3.36733c-.71429 0-1.22449-.607-1.22449-1.2141v-1.0116c0-.4047-.30612-.8094-.81633-.8094-.5102 0-.81633.3035-.81633.7082v1.0117c0 1.5175 1.2245 2.8327 2.85715 2.8327h3.87753c.2041.2024.4082.5059.6123.6071.5102.3035 1.0204.5058 1.6326.5058.3061 0 .7143-.1012 1.0204-.2023l5.1021-1.9223c1.1224-.4046 1.8367-1.4163 1.8367-2.6304v-10.62281c0-1.11286-.8163-2.22573-1.8367-2.52924z"/>\n' +
                '        <path d="m6.38776 13.5017c-.30613.3035-.30613.8094 0 1.1129.10204.1012.30612.2023.5102.2023s.40816-.1011.5102-.2023l2.04082-2.0234c.10204-.1012.10204-.2023.20408-.2023 0-.1012.10204-.2024.10204-.3035 0-.1012 0-.2024-.10204-.3035 0-.1012-.10204-.2024-.20408-.2024l-2.04082-2.02338c-.30612-.30351-.81632-.30351-1.12245 0-.30612.30351-.30612.80938 0 1.11288l.71429.7082h-4.18367c-.40817 0-.81633.3035-.81633.8093 0 .5059.30612.8094.81633.8094h4.28571z"/>\n' +
                '    </g>\n' +
                '</svg>'
            break;
        case "logout":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <g>\n' +
                '        <path d="m22 6.62219v10.62281c0 1.1129-.7143 2.2258-1.8367 2.6304l-5.1021 1.9223c-.3061.1011-.6122.2023-1.0204.2023-.5102 0-1.1224-.2023-1.6326-.5058-.2041-.2024-.5102-.4047-.6123-.6071h-3.87753c-1.53061 0-2.85715-1.214-2.85715-2.8327v-1.0117c0-.4047.30613-.8094.81633-.8094.51021 0 .81633.3035.81633.8094v1.0117c0 .7082.61224 1.214 1.22449 1.214h3.36733v-14.56843h-3.36733c-.71429 0-1.22449.50585-1.22449 1.21404v1.01169c0 .40468-.30612.80936-.81633.80936-.5102 0-.81633-.40468-.81633-.80936v-1.01169c0-1.51755 1.2245-2.83276 2.85715-2.83276h3.87753c.2041-.20234.4082-.40468.6123-.60702.8163-.50585 1.7347-.60702 2.653-.30351l5.1021 1.92223c1.0204.30351 1.8367 1.41638 1.8367 2.52924z"/>\n' +
                '        <path d="m4.85714 14.8169c-.20408 0-.40816-.1011-.5102-.2023l-2.04082-2.0234c-.10204-.1012-.10204-.2023-.20408-.2023 0-.1012-.10204-.2024-.10204-.3035 0-.1012 0-.2024.10204-.3035 0-.1012.10204-.2024.20408-.2024l2.04082-2.02338c.30612-.30351.81633-.30351 1.12245 0s.30612.80938 0 1.11288l-.71429.7082h4.18368c.40816 0 .81632.3035.81632.8093 0 .5059-.40816.6071-.81632.6071h-4.28572l.71429.7081c.30612.3035.30612.8094 0 1.1129-.10204.1012-.30613.2023-.51021.2023z"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "account":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>\n' +
                '</svg>';
            break;
        case "password":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path clip-rule="evenodd"\n' +
                '          d="m3.17157 5.17157c-1.17157 1.17158-1.17157 3.05719-1.17157 6.82843 0 3.7712 0 5.6569 1.17157 6.8284 1.17158 1.1716 3.05719 1.1716 6.82843 1.1716h4c3.7712 0 5.6569 0 6.8284-1.1716 1.1716-1.1715 1.1716-3.0572 1.1716-6.8284 0-3.77124 0-5.65685-1.1716-6.82843-1.1715-1.17157-3.0572-1.17157-6.8284-1.17157h-4c-3.77124 0-5.65685 0-6.82843 1.17157zm9.57863 4.82843c0-.41421-.3358-.75-.75-.75s-.75.33579-.75.75v.7012l-.6074-.3507c-.3587-.2071-.8174-.0842-1.02451.2745-.2071.3587-.0842.8174.27452 1.0245l.60689.3504-.60712.3506c-.35872.2071-.48163.6658-.27452 1.0245s.66584.4816 1.02454.2745l.6076-.3508v.7013c0 .4142.3358.75.75.75s.75-.3358.75-.75v-.7007l.6067.3502c.3587.2071.8174.0842 1.0245-.2745s.0842-.8174-.2745-1.0245l-.6072-.3506.607-.3504c.3587-.2071.4816-.6658.2745-1.0245s-.6658-.4816-1.0245-.2745l-.6065.3501zm-6.01754-.75c.41421 0 .75.33579.75.75v.7006l.60644-.3501c.35872-.2071.81741-.0842 1.02452.2745s.0842.8174-.27452 1.0245l-.60693.3504.60717.3506c.35872.2071.48162.6658.27452 1.0245-.20711.3587-.6658.4816-1.02452.2745l-.60668-.3502v.7007c0 .4142-.33579.75-.75.75-.41422 0-.75-.3358-.75-.75v-.7013l-.60766.3508c-.35872.2071-.81741.0842-1.02452-.2745s-.0842-.8174.27452-1.0245l.60717-.3506-.60694-.3504c-.35871-.2071-.48162-.6658-.27451-1.0245.2071-.3587.6658-.4816 1.02451-.2745l.60743.3507v-.7012c0-.41421.33578-.75.75-.75zm11.28544.75c0-.41421-.3358-.75-.75-.75s-.75.33579-.75.75v.7012l-.6075-.3507c-.3587-.2071-.8174-.0842-1.0245.2745s-.0842.8174.2745 1.0245l.607.3504-.6072.3506c-.3587.2071-.4816.6658-.2745 1.0245s.6658.4816 1.0245.2745l.6077-.3508v.7013c0 .4142.3358.75.75.75s.75-.3358.75-.75v-.7007l.6066.3502c.3588.2071.8175.0842 1.0246-.2745s.0842-.8174-.2746-1.0245l-.6071-.3506.6069-.3504c.3587-.2071.4816-.6658.2745-1.0245s-.6658-.4816-1.0245-.2745l-.6064.3501z"\n' +
                '          fill-rule="evenodd"/>\n' +
                '</svg>';
            break;
        case "email":
            svgToReturn = '<svg fill="none" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m16 12c0 2.2091-1.7909 4-4 4-2.20914 0-4-1.7909-4-4 0-2.20914 1.79086-4 4-4 2.2091 0 4 1.79086 4 4zm0 0v1.5c0 1.3807 1.1193 2.5 2.5 2.5 1.3807 0 2.5-1.1193 2.5-2.5v-1.5c0-4.97056-4.0294-9-9-9-4.97056 0-9 4.02944-9 9 0 4.9706 4.02944 9 9 9h4"\n' +
                '          stroke="' + color + '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>\n' +
                '</svg>';
            break;
        case "syncing":
        case "sync":
            svgToReturn = '<svg height="800" viewBox="0 0 48 48" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h48v48h-48z" fill="none"/>\n' +
                '    <path fill="' + color + '"\n' +
                '          d="m44 5.1v8.9a2 2 0 0 1 -2 2h-9a2 2 0 0 1 -2-2.3 2.1 2.1 0 0 1 2.1-1.7h4.3a18 18 0 0 0 -31.3 10.2 2 2 0 0 1 -2 1.8 2 2 0 0 1 -2-2.2 22 22 0 0 1 37.9-12.9v-3.9a2 2 0 0 1 2.3-2 2.1 2.1 0 0 1 1.7 2.1z"/>\n' +
                '    <path fill="' + color + '"\n' +
                '          d="m4 42.9v-8.9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2.3 2.1 2.1 0 0 1 -2.1 1.7h-4.3a18 18 0 0 0 31.3-10.2 2 2 0 0 1 2-1.8 2 2 0 0 1 2 2.2 22 22 0 0 1 -37.9 12.9v3.9a2 2 0 0 1 -2.3 2 2.1 2.1 0 0 1 -1.7-2.1z"/>\n' +
                '</svg>';
            break;
        case "sync-error":
            svgToReturn = '<svg height="800" viewBox="0 0 48 48" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h48v48h-48z" fill="none"/>\n' +
                '    <path fill="' + color + '"\n' +
                '          d="m44 5.1v8.9a2 2 0 0 1 -2 2h-9a2 2 0 0 1 -2-2.3 2.1 2.1 0 0 1 2.1-1.7h4.3a18 18 0 0 0 -31.3 10.2 2 2 0 0 1 -2 1.8 2 2 0 0 1 -2-2.2 22 22 0 0 1 37.9-12.9v-3.9a2 2 0 0 1 2.3-2 2.1 2.1 0 0 1 1.7 2.1z"/>\n' +
                '    <path fill="' + color + '"\n' +
                '          d="m4 42.9v-8.9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2.3 2.1 2.1 0 0 1 -2.1 1.7h-4.3a18 18 0 0 0 31.3-10.2 2 2 0 0 1 2-1.8 2 2 0 0 1 2 2.2 22 22 0 0 1 -37.9 12.9v3.9a2 2 0 0 1 -2.3 2 2.1 2.1 0 0 1 -1.7-2.1z"/>\n' +
                '    <path fill="' + color + '" d="m24 28a2 2 0 0 0 2-2v-10a2 2 0 0 0 -4 0v10a2 2 0 0 0 2 2z"/>\n' +
                '    <circle fill="' + color + '" cx="24" cy="32" r="2"/>\n' +
                '</svg>';
            break;
        case "code":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 512 512" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m391 233.9478h-270a45.1323 45.1323 0 0 0 -45 45v162a45.1323 45.1323 0 0 0 45 45h270a45.1323 45.1323 0 0 0 45-45v-162a45.1323 45.1323 0 0 0 -45-45zm-206.877 135.4316a9.8954 9.8954 0 1 1 -9.8964 17.1387l-16.33-9.4287v18.8593a9.8965 9.8965 0 0 1 -19.793 0v-18.8593l-16.33 9.4287a9.8954 9.8954 0 0 1 -9.8964-17.1387l16.3344-9.4307-16.3344-9.4306a9.8954 9.8954 0 0 1 9.8964-17.1387l16.33 9.4282v-18.8589a9.8965 9.8965 0 0 1 19.793 0v18.8589l16.33-9.4282a9.8954 9.8954 0 0 1 9.8964 17.1387l-16.3344 9.4306zm108 0a9.8954 9.8954 0 1 1 -9.8964 17.1387l-16.33-9.4287v18.8593a9.8965 9.8965 0 0 1 -19.793 0v-18.8593l-16.33 9.4287a9.8954 9.8954 0 0 1 -9.8964-17.1387l16.3344-9.4307-16.3344-9.4306a9.8954 9.8954 0 0 1 9.8964-17.1387l16.33 9.4282v-18.8589a9.8965 9.8965 0 0 1 19.793 0v18.8589l16.33-9.4282a9.8954 9.8954 0 0 1 9.8964 17.1387l-16.3344 9.4306zm108 0a9.8954 9.8954 0 1 1 -9.8964 17.1387l-16.33-9.4287v18.8593a9.8965 9.8965 0 0 1 -19.793 0v-18.8593l-16.33 9.4287a9.8954 9.8954 0 0 1 -9.8964-17.1387l16.3344-9.4307-16.3344-9.4306a9.8954 9.8954 0 0 1 9.8964-17.1387l16.33 9.4282v-18.8589a9.8965 9.8965 0 0 1 19.793 0v18.8589l16.33-9.4282a9.8954 9.8954 0 0 1 9.8964 17.1387l-16.3344 9.4306z"/>\n' +
                '    <path d="m157.8965 143.9487a98.1035 98.1035 0 1 1 196.207 0v70.1983h19.793v-70.1983a117.8965 117.8965 0 0 0 -235.793 0v70.1983h19.793z"/>\n' +
                '</svg>';
            break;
        case "code-block":
            svgToReturn = `<svg fill="none" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg"><path d="m7 8-4 3.6923 4 4.3077m10-8 4 3.6923-4 4.3077m-3-12-4 16" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`;
            break;
        case "superscript":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h24v24h-24z" fill="none"/>\n' +
                '    <path d="m11 7v13h-2v-13h-6v-2h12v2zm8.55-.42a.8.8 0 1 0 -1.32-.36l-1.154.33a2.001 2.001 0 0 1 1.924-2.55 2 2 0 0 1 1.373 3.454l-1.629 1.546h2.256v1h-4v-1z"/>\n' +
                '</svg>';
            break;
        case "subscript":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h24v24h-24z" fill="none"/>\n' +
                '    <path d="m11 6v13h-2v-13h-6v-2h14v2zm8.55 10.58a.8.8 0 1 0 -1.32-.36l-1.154.33a2.001 2.001 0 0 1 1.924-2.55 2 2 0 0 1 1.373 3.454l-1.629 1.546h2.256v1h-4v-1z"/>\n' +
                '</svg>';
            break;
        case "h1":
            svgToReturn = '<svg fill="' + color + '" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 800 800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h800v800h-800z" fill="none"/>\n' +
                '    <g fill-rule="nonzero">\n' +
                '        <path d="m254.497 474.154v-357.91h47.363v146.973h186.036v-146.973h47.363v357.91h-47.363v-168.701h-186.036v168.701z"\n' +
                '              transform="translate(-89.3271 105.684)"/>\n' +
                '        <path d="m186.279 0h-43.945v-280.029c-10.579 10.091-24.455 20.182-41.626 30.273s-32.593 17.66-46.265 22.705v-42.48c24.577-11.556 46.062-25.554 64.453-41.992 18.392-16.439 31.413-32.39 39.063-47.852h28.32z"\n' +
                '              transform="translate(448.5508 579.537)"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "h2":
            svgToReturn = '<svg fill="' + color + '" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 800 800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h800v800h-800z" fill="none"/>\n' +
                '    <g fill-rule="nonzero">\n' +
                '        <path d="m254.497 474.154v-357.91h47.363v146.973h186.036v-146.973h47.363v357.91h-47.363v-168.701h-186.036v168.701z"\n' +
                '              transform="translate(-122.0419 105.684)"/>\n' +
                '        <path d="m251.709-42.236v42.236h-236.572c-.326-10.579 1.383-20.752 5.127-30.518 6.022-16.113 15.665-31.982 28.93-47.607s32.43-33.691 57.495-54.199c38.9-31.901 65.186-57.17 78.858-75.806s20.508-36.255 20.508-52.856c0-17.416-6.226-32.105-18.677-44.068s-28.687-17.944-48.706-17.944c-21.159 0-38.086 6.348-50.781 19.043-12.696 12.695-19.125 30.273-19.287 52.734l-45.166-4.638c3.092-33.692 14.729-59.367 34.912-77.027 20.182-17.659 47.282-26.489 81.298-26.489 34.343 0 61.524 9.521 81.543 28.564 20.02 19.043 30.03 42.644 30.03 70.801 0 14.323-2.93 28.402-8.789 42.237-5.86 13.834-15.585 28.401-29.175 43.701-13.591 15.299-36.174 36.295-67.749 62.988-26.367 22.135-43.294 37.15-50.781 45.044s-13.672 15.828-18.555 23.804z"\n' +
                '              transform="translate(415.836 579.537)"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "h3":
            svgToReturn = '<svg fill="' + color + '" width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg"\n' +
                '     style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g>\n' +
                '        <rect x="0" y="0" width="800" height="800" style="fill:none;"/>\n' +
                '        <g transform="matrix(1,0,0,1,-24.9951,-2.14033)">\n' +
                '            <g transform="matrix(1,0,0,1,-98.8779,104.801)">\n' +
                '                <path d="M254.497,474.154L254.497,116.244L301.86,116.244L301.86,263.217L487.896,263.217L487.896,116.244L535.259,116.244L535.259,474.154L487.896,474.154L487.896,305.453L301.86,305.453L301.86,474.154L254.497,474.154Z"\n' +
                '                      style="fill-rule:nonzero;"/>\n' +
                '            </g>\n' +
                '            <g transform="matrix(1,0,0,1,439,578.654)">\n' +
                '                <text x="0px" y="0px" style="font-family:\'ArialMT\', \'Arial\', sans-serif;font-size:500px;">3</text>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>\n';
            break;
        case "h4":
            svgToReturn = '<svg fill="' + color + '" width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g>\n' +
                '        <rect x="0" y="0" width="800" height="800" style="fill:none;"/>\n' +
                '        <g transform="matrix(1,0,0,1,-24.2627,0.150578)">\n' +
                '            <g transform="matrix(1,0,0,1,-98.8779,104.801)">\n' +
                '                <path d="M254.497,474.154L254.497,116.244L301.86,116.244L301.86,263.217L487.896,263.217L487.896,116.244L535.259,116.244L535.259,474.154L487.896,474.154L487.896,305.453L301.86,305.453L301.86,474.154L254.497,474.154Z" style="fill-rule:nonzero;"/>\n' +
                '            </g>\n' +
                '            <g transform="matrix(1,0,0,1,439,578.654)">\n' +
                '                <text x="0px" y="0px" style="font-family:\'ArialMT\', \'Arial\', sans-serif;font-size:500px;">4</text>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>\n';
            break;
        case "h5":
            svgToReturn = '<svg fill="' + color + '" width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g>\n' +
                '        <rect x="0" y="0" width="800" height="800" style="fill:none;"/>\n' +
                '        <g transform="matrix(1,0,0,1,-26.3379,-2.90126)">\n' +
                '            <g transform="matrix(1,0,0,1,-98.8779,104.801)">\n' +
                '                <path d="M254.497,474.154L254.497,116.244L301.86,116.244L301.86,263.217L487.896,263.217L487.896,116.244L535.259,116.244L535.259,474.154L487.896,474.154L487.896,305.453L301.86,305.453L301.86,474.154L254.497,474.154Z" style="fill-rule:nonzero;"/>\n' +
                '            </g>\n' +
                '            <g transform="matrix(1,0,0,1,439,578.654)">\n' +
                '                <text x="0px" y="0px" style="font-family:\'ArialMT\', \'Arial\', sans-serif;font-size:500px;">5</text>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>\n';
            break;
        case "h6":
            svgToReturn = '<svg fill="' + color + '" width="100%" height="100%" viewBox="0 0 800 800" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">\n' +
                '    <g>\n' +
                '        <rect x="0" y="0" width="800" height="800" style="fill:none;"/>\n' +
                '        <g transform="matrix(1,0,0,1,-24.873,-2.01826)">\n' +
                '            <g transform="matrix(1,0,0,1,-98.8779,104.801)">\n' +
                '                <path d="M254.497,474.154L254.497,116.244L301.86,116.244L301.86,263.217L487.896,263.217L487.896,116.244L535.259,116.244L535.259,474.154L487.896,474.154L487.896,305.453L301.86,305.453L301.86,474.154L254.497,474.154Z" style="fill-rule:nonzero;"/>\n' +
                '            </g>\n' +
                '            <g transform="matrix(1,0,0,1,439,578.654)">\n' +
                '                <text x="0px" y="0px" style="font-family:\'ArialMT\', \'Arial\', sans-serif;font-size:500px;">6</text>\n' +
                '            </g>\n' +
                '        </g>\n' +
                '    </g>\n' +
                '</svg>\n';
            break;
        case "small":
            svgToReturn = '<svg fill="' + color + '" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 800 800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h800v800h-800z" fill="none"/>\n' +
                '    <g fill-rule="nonzero">\n' +
                '        <path d="m433.333 539.067 178.8-178.8 47.134 47.133-259.267 259.267-259.267-259.267 47.134-47.133 178.8 178.8v-405.734h66.666z"\n' +
                '              transform="matrix(.44073 0 0 .4675 375.4332 47)"/>\n' +
                '        <path d="m433.333 539.067 178.8-178.8 47.134 47.133-259.267 259.267-259.267-259.267 47.134-47.133 178.8 178.8v-405.734h66.666z"\n' +
                '              transform="matrix(.44073 0 0 -.4675 375.4332 753)"/>\n' +
                '        <path d="m154.221 427.656 64.244-206.515h23.848l68.466 206.515h-25.218l-19.513-62.546h-69.949l-18.371 62.546zm48.268-84.803h56.713l-17.459-57.194c-5.325-17.374-9.281-31.648-11.868-42.824-2.13 13.242-5.134 26.389-9.014 39.443z"\n' +
                '              transform="matrix(1.71163 0 0 1.38647 -129.9608 -49.77)"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "big":
            svgToReturn = '<svg fill="' + color + '" clip-rule="evenodd" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" viewBox="0 0 800 800"\n' +
                '     xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m0 0h800v800h-800z" fill="none"/>\n' +
                '    <g fill-rule="nonzero">\n' +
                '        <path d="m433.333 539.067 178.8-178.8 47.134 47.133-259.267 259.267-259.267-259.267 47.134-47.133 178.8 178.8v-405.734h66.666z"\n' +
                '              transform="matrix(.44073 0 0 -.4675 402.9332 421)"/>\n' +
                '        <path d="m433.333 539.067 178.8-178.8 47.134 47.133-259.267 259.267-259.267-259.267 47.134-47.133 178.8 178.8v-405.734h66.666z"\n' +
                '              transform="matrix(.44073 0 0 .4675 402.9332 379)"/>\n' +
                '        <path d="m154.221 427.656 64.244-206.515h23.848l68.466 206.515h-25.218l-19.513-62.546h-69.949l-18.371 62.546zm48.268-84.803h56.713l-17.459-57.194c-5.325-17.374-9.281-31.648-11.868-42.824-2.13 13.242-5.134 26.389-9.014 39.443z"\n' +
                '              transform="matrix(2.2356 0 0 1.8109 -238.2678 -187.455)"/>\n' +
                '    </g>\n' +
                '</svg>';
            break;
        case "highlighter":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 512 512" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m405.333333 381.709781-42.666666 42.666667h-277.3333337l42.6666667-42.666667zm-364.165333-82.337781 62.502 62.502-61.0033333 30.502448-42.6666667 10.666667 10.6666667-42.666667zm19.932-108.068 151.037 151.037-5.165443 5.314494-5.874225-.290446-6.152892-.095807c-10.487039.002521-22.135186.816034-34.94444 2.44054l-8.029896 1.127653-7.846153 1.291683-7.506601 1.38912-9.23035 1.902763-78.4378625-78.437984c1.5580445-6.273428 3.1369387-14.043521 4.3841958-23.273235 2.5311812-18.730762 3.4607735-37.698674 2.788777-56.903734l3.3063773-3.721907zm221.227442-191.304 120.679557 120.679557-18.036051 23.249252-32.555232 41.500321-19.0984 23.964523-17.014329 21.002636-11.393076 13.80824-13.367207 15.819335-8.657733 9.920763-7.485444 8.254702-6.313154 6.588642-14.992178 14.827498-27.059195 27.453531-151.059-151.059 2.5629897-2.620992 37.8540603-37.624506 11.667015-11.195831 12.973484-11.881018 11.319445-9.998149 12.155586-10.4366694 12.991725-10.8751887 13.827866-11.3137085 14.664006-11.7522283 23.563773-18.4505669 16.754357-12.8485277 17.590497-13.2870474z"\n' +
                '          fill-rule="evenodd" transform="translate(64 44.956885)"/>\n' +
                '</svg>';
            break;
        case "edit":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 -.5 21 21" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m3 260h21v-1.989258h-21zm10.3341-5.967774h-4.0341v-4.081957l10.33095-9.950269 4.36905 4.115775z"\n' +
                '          fill-rule="evenodd" transform="translate(-3 -240)"/>\n' +
                '</svg>';
            break;
        case "finish-edit":
            svgToReturn = '<svg fill="' + color + '" height="800" viewBox="0 0 32 32" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m28 2h-24c-1.1 0-2 .9-2 2v24c0 1.1.9 2 2 2h24c1.1 0 2-.9 2-2v-24c0-1.1-.9-2-2-2zm-3.586 12.414-9 9c-.39.391-.902.586-1.414.586s-1.024-.195-1.414-.586l-5-5c-.781-.781-.781-2.047 0-2.828.78-.781 2.048-.781 2.828 0l3.586 3.585 7.586-7.585c.78-.781 2.048-.781 2.828 0 .781.781.781 2.047 0 2.828z"\n' +
                '          />\n' +
                '</svg>';
            break;
        case "search":
            svgToReturn = '<svg fill="none" height="800" viewBox="0 0 24 24" width="800" xmlns="http://www.w3.org/2000/svg">\n' +
                '    <path d="m11 6c2.7614 0 5 2.23858 5 5m.6588 5.6549 4.3412 4.3451m-2-10c0 4.4183-3.5817 8-8 8-4.41828 0-8-3.5817-8-8 0-4.41828 3.58172-8 8-8 4.4183 0 8 3.58172 8 8z"\n' +
                '          stroke="' + color + '" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>\n' +
                '</svg>'
            break;
        case "show-content":
            svgToReturn = '<svg xmlns="http://www.w3.org/2000/svg" width="72pt" height="72pt"\n' +
                '     viewBox="0 0 72 72" version="1.1">\n' +
                '    <g fill="' + color + '">\n' +
                '        <path style=" stroke:none;fill-rule:nonzero;fill-opacity:1;"\n' +
                '              d="M 18.75 6 C 15.027344 6 12 9.027344 12 12.75 L 12 59.25 C 12 62.972656 15.027344 66 18.75 66 L 53.25 66 C 56.972656 66 60 62.972656 60 59.25 L 60 30 L 42.75 30 C 39.027344 30 36 26.972656 36 23.25 L 36 6 Z M 40.5 7.316406 L 40.5 23.25 C 40.5 24.492188 41.507812 25.5 42.75 25.5 L 58.683594 25.5 Z M 26.25 37.5 L 45.75 37.5 C 46.992188 37.5 48 38.507812 48 39.75 C 48 40.992188 46.992188 42 45.75 42 L 26.25 42 C 25.007812 42 24 40.992188 24 39.75 C 24 38.507812 25.007812 37.5 26.25 37.5 Z M 26.234375 48 L 39.730469 48 C 40.972656 48 41.980469 49.007812 41.980469 50.25 C 41.980469 51.386719 41.136719 52.332031 40.035156 52.480469 L 39.730469 52.5 L 26.238281 52.5 C 24.996094 52.5 23.988281 51.492188 23.988281 50.25 C 23.988281 49.113281 24.832031 48.167969 25.929688 48.019531 Z M 26.234375 48 "/>\n' +
                '    </g>\n' +
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
    return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
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

function correctDatetime(datetime) {
    let todayDate = new Date(datetime);
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

/**
 * This function is used to convert a datetime string to a displayable format
 * @param datetime The datetime string to convert
 * @param format The format to use (to force): if undefined, the format will be taken from the settings["datetime-format"]
 * @param also_time If true (default), the time will be included in the displayable format
 * @returns {string} The datetime string in the displayable format
 */
function datetimeToDisplay(datetime, format = undefined, also_time = true) {
    //if datetime is not a valid Date, it probably it's "Never", return it as it is
    if (isNaN((new Date(datetime)).getTime())) {
        return datetime;
    }

    let date = new Date(datetime);
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    if (month < 10) month = "0" + month; else month = "" + month;
    let day = date.getDate();
    if (day < 10) day = "0" + day; else day = "" + day;
    let hour = date.getHours();
    if (hour < 10) hour = "0" + hour; else hour = "" + hour;
    let minute = date.getMinutes();
    if (minute < 10) minute = "0" + minute; else minute = "" + minute;
    let second = date.getSeconds();
    if (second < 10) second = "0" + second; else second = "" + second;

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
    const error = {"datetime": getDate(), "context": context, "error": text, url: url};
    browser.storage.local.get("error-logs").then(result => {
        let error_logs = [];
        if (result["error-logs"] !== undefined) {
            error_logs = result["error-logs"];
        }
        error_logs.push(error);
        browser.storage.local.set({"error-logs": error_logs});
    });
}