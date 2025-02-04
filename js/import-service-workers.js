try {
    importScripts("background.js", "api-service.js");
} catch (e) {
    console.error("Error import service workers: ",e);
}