var lang = "";

var strings = []; //strings[language_code] = {};

let supportedLanguages = ["en"];
let languageToUse = browser.i18n.getUILanguage().toString();

if (!(languageToUse in supportedLanguages)) languageToUse = "en";