var lang = "";

var strings = []; //strings[language_code] = {};

let supportedLanguages = ["en", "it", "es"];
let languageToUse = browser.i18n.getUILanguage().toString();

if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";

if (supportedLanguages.includes(languageToUse.split("-")[0])) languageToUse = languageToUse.split("-")[0];