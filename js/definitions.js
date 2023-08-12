var lang = "";

var strings = []; //strings[language_code] = {};

let supportedLanguages = ["en", "it", "ar", "zh-cn", "zh-tw", "cs", "da", "nl", "fi", "fr", "de", "el", "ja", "pl", "pt-pt", "pt-br", "ro", "ru", "es", "sv-SE", "uk"];
let languageToUse = browser.i18n.getUILanguage().toString();

if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";

if (supportedLanguages.includes(languageToUse.split("-")[0])) languageToUse = languageToUse.split("-")[0];