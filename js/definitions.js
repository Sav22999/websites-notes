var lang = "";

var strings = []; //strings[language_code] = {};

let supportedLanguages = ["en", "it", "ar", "zh-CN", "zh-TW", "cs", "da", "nl", "fi", "fr", "de", "el", "ja", "no", "pl", "pt", "pt-BR", "ro", "ru", "es", "sv-SE", "uk"];
let languageToUse = browser.i18n.getUILanguage().toString();

if (!supportedLanguages.includes(languageToUse)) languageToUse = "en";

if (supportedLanguages.includes(languageToUse.split("-")[0])) languageToUse = languageToUse.split("-")[0];