/**
 * Notefox - find again the element a screenshot is linked to.
 *
 * Injected by js/attachments-background.js with window.__notefoxAnchor =
 * {action: "check"|"show", items: [{id, anchor}], strings}. The value of the
 * last expression is the answer: an array with true/false for every item.
 */
(function () {
    const options = window.__notefoxAnchor;
    delete window.__notefoxAnchor;
    if (!options || !Array.isArray(options.items)) return [];

    const normalise = (value) => (value || "").replace(/\s+/g, " ").trim();

    function textMatches(el, text) {
        if (!text) return true;
        const current = normalise(el.innerText || el.textContent);
        const probe = text.substring(0, 30);
        return current.substring(0, 80) === text || current.includes(probe);
    }

    /**
     * The selector first; if the page changed, an element of the same type with the same text
     */
    function find(anchor) {
        if (!anchor || typeof anchor.selector !== "string") return null;
        let el = null;
        try {
            el = document.querySelector(anchor.selector);
        } catch (e) {
            el = null;
        }
        if (el && (!anchor.tag || el.tagName.toLowerCase() === anchor.tag) && textMatches(el, anchor.text)) return el;

        if (anchor.tag && anchor.text && anchor.text.length >= 8) {
            const candidates = Array.from(document.getElementsByTagName(anchor.tag)).filter((item) => normalise(item.innerText || item.textContent).substring(0, 80) === anchor.text);
            if (candidates.length === 1) return candidates[0];
        }
        return null;
    }

    const found = options.items.map((item) => find(item.anchor));
    if (options.action !== "show") return found.map((el) => el !== null);

    const strings = options.strings || {};
    const Z = "2147483647";
    const item = options.items[0];
    const el = found[0];

    function toast(message) {
        const note = document.createElement("div");
        note.textContent = message;
        note.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:${Z};padding:10px 16px;border-radius:12px;background:#b00020;color:#ffffff;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,0.25);max-width:calc(100vw - 24px);`;
        document.documentElement.appendChild(note);
        setTimeout(() => note.remove(), 5000);
    }

    if (el === null) {
        toast(strings.missing || "The element linked to this screenshot is no longer on the page");
        return [false];
    }

    el.scrollIntoView({block: "center", inline: "nearest", behavior: "smooth"});
    const highlight = document.createElement("div");
    highlight.setAttribute("data-notefox-anchor", "");
    //orange with a white inner line and a dark shadow: visible on any colour, orange included
    highlight.style.cssText = `position:absolute;z-index:${Z};pointer-events:none;border:3px solid #ff6200;border-radius:6px;box-shadow:inset 0 0 0 2px #ffffff,0 0 0 2px #ffffff,0 0 14px 4px rgba(0,0,0,0.45);transition:opacity 0.6s;`;
    document.documentElement.appendChild(highlight);

    function place() {
        if (!el.isConnected) {
            highlight.remove();
            return;
        }
        const r = el.getBoundingClientRect();
        const area = item.anchor && item.anchor.area;
        const box = area ? {x: r.left + area.x, y: r.top + area.y, w: area.w, h: area.h} : {x: r.left, y: r.top, w: r.width, h: r.height};
        highlight.style.left = (box.x + window.scrollX - 4) + "px";
        highlight.style.top = (box.y + window.scrollY - 4) + "px";
        highlight.style.width = (box.w + 8) + "px";
        highlight.style.height = (box.h + 8) + "px";
    }

    place();
    const timer = setInterval(place, 100);
    setTimeout(() => highlight.style.opacity = "0", 3500);
    setTimeout(() => {
        clearInterval(timer);
        highlight.remove();
    }, 4200);
    return [true];
})();
