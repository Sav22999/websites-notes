var lang = "";

var strings = []; //strings[language_code] = {};

let supportedLanguages = ["en", "it"];
let languageToUse = browser.i18n.getUILanguage().toString();

if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";