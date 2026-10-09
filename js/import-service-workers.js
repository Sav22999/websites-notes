try {
    // same load order as the Firefox manifest background.scripts (5.0)
    importScripts("api/api-client.js", "api/api-endpoints.js", "sync-service.js", "background.js", "api-service.js");
} catch (e) {
    console.error("Error import service workers: ", e);
}
