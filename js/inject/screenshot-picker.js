/**
 * Notefox - choice of the area or of the element to attach to a note.
 *
 * Injected by js/attachments-background.js with window.__notefoxPicker =
 * {token, mode: "area"|"element", link, strings}. The overlay is removed before
 * the screenshot is taken, so it never appears in the image.
 */
(function () {
    const options = window.__notefoxPicker;
    delete window.__notefoxPicker;
    if (!options || window.__notefoxPickerActive) return;
    window.__notefoxPickerActive = true;

    const strings = options.strings || {};
    const ACCENT = "#ff6200";
    const Z = "2147483647";

    const root = document.createElement("div");
    root.setAttribute("data-notefox-picker", "");
    root.style.cssText = `position:fixed;inset:0;z-index:${Z};cursor:crosshair;background:rgba(0,0,0,0.25);`;
    if (options.mode === "element") root.style.pointerEvents = "none";

    const box = document.createElement("div");
    box.style.cssText = `position:fixed;display:none;z-index:${Z};pointer-events:none;border:2px solid ${ACCENT};background:rgba(255,98,0,0.12);box-shadow:0 0 0 9999px rgba(0,0,0,0.25);border-radius:4px;`;

    const bar = document.createElement("div");
    bar.style.cssText = `position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:${Z};display:flex;gap:10px;align-items:center;padding:8px 10px 8px 14px;border-radius:12px;background:#ffffff;color:#222222;box-shadow:0 4px 18px rgba(0,0,0,0.25);font:600 13px/1.3 system-ui,sans-serif;max-width:calc(100vw - 24px);pointer-events:auto;cursor:default;`;
    const text = document.createElement("span");
    text.textContent = options.mode === "element"
        ? (strings.element || "Click an element to attach it to the note · ↑ selects the container · Esc to cancel")
        : (strings.area || "Drag to select the area to attach to the note · Esc to cancel");
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.textContent = strings.cancel || "Cancel";
    cancel.style.cssText = `all:unset;cursor:pointer;padding:5px 12px;border-radius:9px;background:${ACCENT};color:#ffffff;font:600 13px system-ui,sans-serif;`;
    bar.appendChild(text);
    bar.appendChild(cancel);

    document.documentElement.appendChild(root);
    document.documentElement.appendChild(box);
    document.documentElement.appendChild(bar);
    if (options.mode === "element") box.style.boxShadow = "none";

    let start = null;
    let selected = null;

    const inBar = (target) => target instanceof Node && bar.contains(target);
    const isOurs = (el) => el === root || el === box || inBar(el);

    function showBox(rect) {
        box.style.display = "block";
        box.style.left = rect.x + "px";
        box.style.top = rect.y + "px";
        box.style.width = rect.w + "px";
        box.style.height = rect.h + "px";
    }

    function elementAt(x, y) {
        const list = document.elementsFromPoint(x, y);
        for (const el of list) {
            if (!isOurs(el) && el !== document.documentElement && el !== document.body) return el;
        }
        return null;
    }

    function rectOf(el) {
        const r = el.getBoundingClientRect();
        return {x: r.left, y: r.top, w: r.width, h: r.height};
    }

    function cleanup() {
        window.removeEventListener("mousedown", onDown, true);
        window.removeEventListener("mousemove", onMove, true);
        window.removeEventListener("mouseup", onUp, true);
        window.removeEventListener("click", onClick, true);
        window.removeEventListener("keydown", onKey, true);
        root.remove();
        box.remove();
        bar.remove();
        window.__notefoxPickerActive = false;
    }

    /**
     * A CSS selector which finds this element only
     */
    function buildSelector(el) {
        const escape = (value) => (window.CSS && CSS.escape) ? CSS.escape(value) : value.replace(/[^A-Za-z0-9_-]/g, "\\$&");
        const unique = (selector) => {
            try {
                return document.querySelectorAll(selector).length === 1;
            } catch (e) {
                return false;
            }
        };
        if (el.id && unique("#" + escape(el.id))) return "#" + escape(el.id);
        const parts = [];
        let current = el;
        while (current && current.nodeType === 1 && current !== document.documentElement) {
            if (current !== el && current.id && unique("#" + escape(current.id))) {
                parts.unshift("#" + escape(current.id));
                break;
            }
            let part = current.tagName.toLowerCase();
            const parent = current.parentElement;
            if (parent) {
                const same = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
                if (same.length > 1) part += `:nth-of-type(${same.indexOf(current) + 1})`;
            }
            parts.unshift(part);
            const selector = parts.join(" > ");
            if (unique(selector) && parts.length >= 2) return selector;
            current = parent;
        }
        return parts.join(" > ");
    }

    function textOf(el) {
        return (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().substring(0, 80);
    }

    /**
     * What is needed to find the element again on a later visit
     */
    function buildAnchor(el, area) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const anchor = {
            "selector": buildSelector(el),
            "tag": el.tagName.toLowerCase(),
            "text": textOf(el),
            "rect": {x: Math.round(r.left + window.scrollX), y: Math.round(r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height)},
            "viewport": {w: window.innerWidth, h: window.innerHeight}
        };
        if (area) {
            //the area, relative to the element which contains it
            anchor["area"] = {x: Math.round(area.x - r.left), y: Math.round(area.y - r.top), w: Math.round(area.w), h: Math.round(area.h)};
        }
        return anchor;
    }

    /**
     * The smallest element which contains the whole area
     */
    function containerOf(area) {
        let el = elementAt(area.x + area.w / 2, area.y + area.h / 2);
        while (el && el.parentElement) {
            const r = el.getBoundingClientRect();
            if (r.left <= area.x + 1 && r.top <= area.y + 1 && r.right >= area.x + area.w - 1 && r.bottom >= area.y + area.h - 1) break;
            el = el.parentElement;
        }
        return el === document.documentElement ? document.body : el;
    }

    function toast(message, isError) {
        const note = document.createElement("div");
        note.textContent = message;
        note.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:${Z};padding:10px 16px;border-radius:12px;background:${isError ? "#b00020" : ACCENT};color:#ffffff;font:600 13px/1.3 system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,0.25);max-width:calc(100vw - 24px);`;
        document.documentElement.appendChild(note);
        setTimeout(() => note.remove(), 2800);
    }

    function finish(rect, anchor) {
        cleanup();
        //two frames: the overlay must be gone from the screen before the capture
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => {
            browser.runtime.sendMessage({
                from: "attachments", type: "picked", token: options.token,
                rect: {x: Math.max(0, rect.x), y: Math.max(0, rect.y), w: rect.w, h: rect.h},
                viewport: {w: window.innerWidth, h: window.innerHeight},
                anchor: options.link ? anchor : null
            }).then((answer) => {
                if (answer && answer.ok) toast(strings.saved || "Screenshot attached to the note", false);
                else toast(strings.failed || "The screenshot couldn't be attached", true);
            }).catch(() => toast(strings.failed || "The screenshot couldn't be attached", true));
        }, 60)));
    }

    function cancelPicker() {
        cleanup();
        browser.runtime.sendMessage({from: "attachments", type: "picked", token: options.token, cancelled: true}).catch(() => {
        });
    }

    function onDown(e) {
        if (inBar(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        if (options.mode !== "area" || e.button !== 0) return;
        start = {x: e.clientX, y: e.clientY};
        showBox({x: start.x, y: start.y, w: 0, h: 0});
    }

    function onMove(e) {
        if (options.mode === "area") {
            if (!start) return;
            e.preventDefault();
            showBox({x: Math.min(start.x, e.clientX), y: Math.min(start.y, e.clientY), w: Math.abs(e.clientX - start.x), h: Math.abs(e.clientY - start.y)});
        } else {
            const el = elementAt(e.clientX, e.clientY);
            if (el && el !== selected) {
                selected = el;
                showBox(rectOf(el));
            }
        }
    }

    function onUp(e) {
        if (options.mode !== "area" || !start) return;
        e.preventDefault();
        e.stopPropagation();
        const area = {x: Math.min(start.x, e.clientX), y: Math.min(start.y, e.clientY), w: Math.abs(e.clientX - start.x), h: Math.abs(e.clientY - start.y)};
        start = null;
        if (area.w < 8 || area.h < 8) {
            box.style.display = "none";
            return;
        }
        finish(area, buildAnchor(containerOf(area), area));
    }

    function onClick(e) {
        if (inBar(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        if (options.mode !== "element") return;
        const el = selected || elementAt(e.clientX, e.clientY);
        if (!el) return;
        const r = rectOf(el);
        //only the part of the element which is on the screen can be captured
        const visible = {x: Math.max(0, r.x), y: Math.max(0, r.y)};
        visible.w = Math.min(window.innerWidth, r.x + r.w) - visible.x;
        visible.h = Math.min(window.innerHeight, r.y + r.h) - visible.y;
        if (visible.w < 4 || visible.h < 4) return;
        finish(visible, buildAnchor(el, null));
    }

    function onKey(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancelPicker();
        } else if (options.mode === "element" && selected) {
            if (e.key === "ArrowUp" && selected.parentElement && selected.parentElement !== document.documentElement) {
                e.preventDefault();
                selected = selected.parentElement;
                showBox(rectOf(selected));
            } else if (e.key === "ArrowDown" && selected.firstElementChild) {
                e.preventDefault();
                selected = selected.firstElementChild;
                showBox(rectOf(selected));
            } else if (e.key === "Enter") {
                e.preventDefault();
                onClick({target: selected, clientX: 0, clientY: 0, preventDefault() {}, stopPropagation() {}});
            }
        }
    }

    cancel.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        cancelPicker();
    });
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("mousemove", onMove, true);
    window.addEventListener("mouseup", onUp, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
})();
