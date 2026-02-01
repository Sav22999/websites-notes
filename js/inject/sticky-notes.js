load();

function load() {
    if (document.getElementById("sticky-notes-notefox-addon") && !document.getElementById("restore--sticky-notes-notefox-addon")) {
        //already exists || update elements
        //console.log("**** Already exists");
        alreadyExists();
    } else if (document.getElementById("sticky-notes-notefox-addon") && document.getElementById("restore--sticky-notes-notefox-addon")) {
        //it's exists as minimized
        //console.log("**** Exists as minimized");
        openMinimized();
    } else {
        //console.log("**** Create new");
        //no sticky-noes no minimized are present, so it's necessary understand what function to call
        browser.runtime.sendMessage({from: "sticky", ask: "sticky-minimized"}, (responseRuntime) => {
            //console.log(responseRuntime);
            if (responseRuntime === undefined || responseRuntime.sticky && !responseRuntime.minimized || !responseRuntime.sticky && !responseRuntime.minimized || !responseRuntime.sticky && responseRuntime.minimized) {
                //create new
                browser.runtime.sendMessage({from: "sticky", ask: "coords-sizes-opacity"}, (response) => {
                    let x = "20px";
                    let y = "20px";
                    let w = "300px";
                    let h = "300x";
                    let opacity = 0.8;

                    if (response !== undefined) {
                        if (response.coords !== undefined && response.coords.x !== undefined) {
                            x = checkCorrectNumber(response.coords.x, "20px");
                        }
                        if (response.coords !== undefined && response.coords.y !== undefined) {
                            y = checkCorrectNumber(response.coords.y, "20px");
                        }
                        if (response.sizes !== undefined && response.sizes.w !== undefined) {
                            w = checkCorrectNumber(response.sizes.w, "300px");
                        }
                        if (response.sizes !== undefined && response.sizes.h !== undefined) {
                            h = checkCorrectNumber(response.sizes.h, "300px");
                        }
                        if (response.opacity !== undefined && response.opacity.value !== undefined) {
                            opacity = response.opacity.value;
                        }
                    }
                    createNewDescription(x, y, w, h, opacity);
                });
            } else {
                //only when both "sticky" and "minimized" are selected!
                openMinimized(responseRuntime.settings_json, responseRuntime.icons, responseRuntime.theme_colours);
            }
        });
    }
}

function createNewDescription(x, y, w, h, opacity) {
    browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
        if (response !== undefined) {
            let notes = {description: "", url: "", page_domain_global: "", tag_colour: "", website: {}, type: "page"};
            //console.log("Response: ", response);
            let description = "";
            if (response.notes !== undefined && response.notes.description !== undefined) {
                notes.description = response.notes.description;
            }
            if (response.notes !== undefined && response.notes.url !== undefined) {
                notes.url = response.notes.url;
            }
            if (response.notes !== undefined && response.notes.tag_colour !== undefined) {
                notes.tag_colour = response.notes.tag_colour;
            }
            if (response.notes !== undefined && response.notes.website !== undefined) {
                notes.website = response.notes.website;
            }
            if (response.notes !== undefined && response.notes.type !== undefined) {
                notes.type = response.notes.type;
            }
            if (response.notes !== undefined && response.notes.page_domain_global !== undefined) {
                notes.page_domain_global = response.notes.page_domain_global;
            }
            createNew(notes, x, y, w, h, opacity, response.websites, response.settings, response.icons, response.theme_colours, response.supported_font_family);
        } else {
            console.error(`Response undefined!`);
        }
    });
}


/**
 * The sticky already exists, I need only to update it
 */
function updateStickyNotes() {
    if (document.getElementById("text--sticky-notes-notefox-addon")) {
        //double check already exists

        if (document.getElementById("restore--sticky-notes-notefox-addon")) document.getElementById("restore--sticky-notes-notefox-addon").remove();

        let stickyNotes = document.getElementById("sticky-notes-notefox-addon");
        let text = document.getElementById("text--sticky-notes-notefox-addon");
        let tag = document.getElementById("tag--sticky-notes-notefox-addon");
        let opacityRange = document.getElementById("slider--sticky-notes-notefox-addon");
        let close = document.getElementById("close--sticky-notes-notefox-addon");
        let resize = document.getElementById("resize--sticky-notes-notefox-addon");
        let move = document.getElementById("move--sticky-notes-notefox-addon");
        let minimize = document.getElementById("minimize--sticky-notes-notefox-addon");

        browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
            if (response !== undefined) {
                let new_text = "";
                if (response.notes !== undefined && response.notes.description !== undefined) new_text = response.notes.description;
                text.innerHTML = new_text

                let new_tag = "";
                if (response.notes !== undefined && response.notes.tag_colour !== undefined) new_tag = response.notes.tag_colour;
                if (new_tag === "none") new_tag = "transparent";
                tag.style.backgroundColor = new_tag;

                let displayWidth = window.innerWidth;
                let displayHeight = window.innerHeight;
                let x = checkCorrectNumber(response.notes.sticky_params.coords.x, "20px");
                let y = checkCorrectNumber(response.notes.sticky_params.coords.y, "20px");
                let h = checkCorrectNumber(response.notes.sticky_params.sizes.h, "300px");
                let w = checkCorrectNumber(response.notes.sticky_params.sizes.w, "300px");
                let yAsInt = parseInt(y.replace("px", ""));
                let hAsInt = parseInt(h.replace("px", ""));
                let xAsInt = parseInt(x.replace("px", ""));
                let wAsInt = parseInt(w.replace("px", ""));

                if (response.notes !== undefined && response.notes.sticky_params.coords !== undefined) {
                    let safeTop = (((yAsInt + hAsInt) > displayHeight ? displayHeight - hAsInt : yAsInt)) + "px";
                    let safeLeft = (((xAsInt + wAsInt) > displayWidth ? displayWidth - wAsInt : xAsInt)) + "px";

                    stickyNotes.style.left = safeLeft;
                    stickyNotes.style.top = safeTop;
                }
                if (response.notes !== undefined && response.notes.sticky_params.sizes !== undefined) {
                    stickyNotes.style.width = w;
                    stickyNotes.style.height = h;
                }
                if (response.notes !== undefined && response.notes.sticky_params.opacity !== undefined) {
                    //stickyNotes.style.opacity = response.notes.sticky_params.opacity.value;
                    //slider.value = (response.notes.sticky_params.opacity.value * 100);
                    setSlider(opacityRange, stickyNotes, response.notes.sticky_params.opacity.value * 100, false);
                }

                let pageOrDomain = document.getElementById("page-or-domain--sticky-notes-notefox-addon");
                /*if (response.notes !== undefined && response.notes.url !== undefined && response.notes.url === "**global") {
                    //the current url one is a "Global"
                    pageOrDomain.innerText = "Global";
                } else if (response.notes !== undefined && response.notes.url !== undefined && isAPage(response.notes.url)) {
                    //the current url one is a "Page"
                    pageOrDomain.innerText = "Page";
                } else {
                    //the current url one is a "Domain"
                    pageOrDomain.innerText = "Domain";
                }*/
                let pageDomainGlobalToUse = response.notes.page_domain_global;
                if (pageDomainGlobalToUse === undefined) pageDomainGlobalToUse = "";
                pageOrDomain.innerText = pageDomainGlobalToUse;

                //console.log(pageDomainGlobalToUse);

                checkDisableWordWrap(text, response.settings);
                checkLanguageSpellcheck(text, response.settings);
                checkFontFamily(text, response.settings, response.supported_font_family);
                checkThemeSticky(text, response.settings, response.icons, response.theme_colours, response.notes.sticky_params.opacity.value);
                checkImmersiveMode(text, response.settings);

                //(re)set events
                close.onclick = function () {
                    onClickClose(false);
                }
                text.oninput = function () {
                    onInputText(text, response.settings);
                }
                text.onchange = function () {
                    onInputText(text, response.settings);
                }
                text.onkeydown = function (e) {
                    onKeyDownText(text, response.settings, e);
                }
                text.onpaste = function (e) {
                    onPasteText(text, e);
                }
                opacityRange.oninput = function () {
                    var value = (this.value - this.min) / (this.max - this.min) * 100;
                    setSlider(opacityRange, stickyNotes, value, true);
                }
                let isDragging = false;
                move.addEventListener('mousedown', (e) => {
                    isDragging = onMouseDownMove(e, stickyNotes, isDragging)
                });
                let isResizing = false;
                resize.addEventListener('mousedown', (e) => {
                    isResizing = onMouseDownResize(e, stickyNotes, isResizing);
                });
                minimize.onclick = function () {
                    stickyNotes.remove();
                    openMinimized(response.settings, response.icons, response.theme_colours);
                }
            }
            listenerLinks(text, response.settings);
        });
    }
}

/**
 * The sticky does NOT exist, so I need to create it totally
 */
function createNew(notes, x = "10px", y = "10px", w = "200px", h = "300px", opacity = 0.8, websites_json, settings_json, icons_json, theme_colours_json, supported_languages) {
    if (!document.getElementById("sticky-notes-notefox-addon")) {
        let css = document.createElement("style");
        css.innerText = getCSS(notes, x, y, w, h, opacity, websites_json, settings_json, icons_json, theme_colours_json, supported_languages);
        document.body.appendChild(css);

        if (document.getElementById("restore--sticky-notes-notefox-addon")) document.getElementById("restore--sticky-notes-notefox-addon").remove();

        let commandsContainer = document.createElement("div");
        commandsContainer.id = "commands-container--sticky-notes-notefox-addon";

        let move = document.createElement("div");
        move.id = "move--sticky-notes-notefox-addon";

        let resize = document.createElement("div");
        resize.id = "resize--sticky-notes-notefox-addon";

        let textContainer = document.createElement("div");
        textContainer.id = "text-container--sticky-notes-notefox-addon";
        listenerLinks(textContainer, settings_json);

        let text = document.createElement("pre");
        text.id = "text--sticky-notes-notefox-addon";
        text.innerHTML = notes.description;
        text.contentEditable = true;

        checkDisableWordWrap(text, settings_json);
        checkLanguageSpellcheck(text, settings_json);

        text.oninput = function () {
            onInputText(text, settings_json);
        }
        text.onchange = function () {
            onInputText(text, settings_json);
        }
        text.onkeydown = function (e) {
            onKeyDownText(text, settings_json, e);
        }
        text.onpaste = function (e) {
            onPasteText(text, e);
        }

        textContainer.appendChild(text);

        let stickyNote = document.createElement("div");
        stickyNote.id = "sticky-notes-notefox-addon";

        let close = document.createElement("input");
        close.type = "button";
        close.id = "close--sticky-notes-notefox-addon";
        close.onclick = function () {
            onClickClose(false);
        }
        //close.value = "⋏";
        commandsContainer.appendChild(close);

        let minimize = document.createElement("input");
        minimize.type = "button";
        minimize.id = "minimize--sticky-notes-notefox-addon";
        minimize.onclick = function () {
            stickyNote.remove();
            openMinimized(settings_json, icons_json, theme_colours_json);
        }
        //minimize.value = "≺";
        commandsContainer.appendChild(minimize);

        //notes.tag_colour
        let tag = document.createElement("div");
        tag.id = "tag--sticky-notes-notefox-addon";
        tag.style.backgroundColor = notes.tag_colour;
        stickyNote.appendChild(tag);

        let opacityRangeContainer = document.createElement("div");
        opacityRangeContainer.id = "slider-container--sticky-notes-notefox-addon";

        let opacityRange = document.createElement("input");
        opacityRange.id = "slider--sticky-notes-notefox-addon";
        opacityRange.type = "range";
        opacityRange.min = 1;
        opacityRange.max = 100;
        opacityRange.value = (opacity * 100);
        opacityRange.step = 1;

        opacityRangeContainer.appendChild(opacityRange);
        commandsContainer.appendChild(opacityRangeContainer);

        let pageOrDomain = document.createElement("div");
        pageOrDomain.id = "page-or-domain--sticky-notes-notefox-addon";

        /*if (notes.url === "**global") {
            //the current url one is a "Global"
            pageOrDomain.innerText = "Global";
        } else if (isAPage(notes.url)) {
            //the current url one is a "Page"
            pageOrDomain.innerText = "Page";
        } else {
            //the current url one is a "Domain"
            pageOrDomain.innerText = "Domain";
        }*/
        let pageDomainGlobalToUse = notes.page_domain_global;
        if (pageDomainGlobalToUse === undefined) pageDomainGlobalToUse = "";
        pageOrDomain.innerText = pageDomainGlobalToUse;
        commandsContainer.appendChild(pageOrDomain);

        let isDragging = false;

        move.addEventListener('mousedown', (e) => {
            isDragging = onMouseDownMove(e, stickyNote, isDragging)
        });
        let isResizing = false;
        resize.addEventListener('mousedown', (e) => {
            isResizing = onMouseDownResize(e, stickyNote, isResizing);
        });
        opacityRange.oninput = function () {
            var value = (this.value - this.min) / (this.max - this.min) * 100;
            setSlider(opacityRange, stickyNote, value, true);
        };
        commandsContainer.appendChild(move);

        commandsContainer.appendChild(resize);
        commandsContainer.appendChild(textContainer);
        stickyNote.appendChild(commandsContainer)

        document.body.appendChild(stickyNote);

        browser.runtime.sendMessage({from: "sticky", data: {sticky: true, minimized: false}});
    } else {
        alreadyExists();
    }
}

function setSlider(opacityRange, stickyNote, value, update = true) {
    if (value < 20) value = 20;
    opacityRange.value = value;
    opacityRange.style.background = 'linear-gradient(to right, #ff6200 0%, #ff6200 ' + value + '%, #eeeeee ' + value + '%, #eeeeee 100%)';
    if (update) {
        browser.runtime.sendMessage({
            from: "sticky",
            data: {opacity: {value: (value / 100)}}
        });
    }
    stickyNote.style.opacity = (value / 100);
    //console.log(value / 100);
}

function alreadyExists() {
    updateStickyNotes();
}

function checkDisableWordWrap(text, settings_json) {
    let disable_word_wrap = false;
    if (settings_json !== undefined && settings_json["disable-word-wrap"] !== undefined && (settings_json["disable-word-wrap"] === "yes" || settings_json["disable-word-wrap"] === true)) {
        disable_word_wrap = true;
    } else {
        disable_word_wrap = false;
    }
    if (disable_word_wrap) {
        text.style.whiteSpace = "none";
    } else {
        text.style.whiteSpace = "pre-wrap";
    }
}

function checkLanguageSpellcheck(text, settings_json) {
    let spellcheck = true;
    if (settings_json !== undefined && (settings_json["spellcheck-detection"] === "no" || settings_json["spellcheck-detection"] === false)) spellcheck = false;
    else spellcheck = true;
    text.spellcheck = spellcheck;
}

function checkImmersiveMode(text, settings_json) {
    let immersive_mode = true;
    if (settings_json !== undefined && (settings_json["immersive-sticky-notes"] === "no" || settings_json["immersive-sticky-notes"] === false)) immersive_mode = false;
    else immersive_mode = true;

    let visibility_immersive = immersive_mode ? "hidden" : "visible";
    const commands_container = document.getElementById('commands-container--sticky-notes-notefox-addon');
    commands_container.style.visibility = visibility_immersive;
}

function checkFontFamily(text, settings_json, supported_font_family) {
    if (settings_json["font-family"] === undefined || !supported_font_family.includes(settings_json["font-family"])) settings_json["font-family"] = "Merienda";
    let font_family = settings_json["font-family"];
    text.style.fontFamily = font_family + ", sans-serif";
}

function checkThemeSticky(text, settings_json, icons_json, theme_colours_json, opacity = 0.8) {
    let primary_color = "#fffd7d";
    let secondary_color = "#ff6200";
    let on_primary_color = "#111111";
    let on_secondary_color = "#ffffff";
    if (theme_colours_json !== undefined) {
        if (theme_colours_json["primary"] !== undefined) primary_color = theme_colours_json["primary"];
        if (theme_colours_json["secondary"] !== undefined) secondary_color = theme_colours_json["secondary"];
        if (theme_colours_json["on-primary"] !== undefined) on_primary_color = theme_colours_json["on-primary"];
        if (theme_colours_json["on-secondary"] !== undefined) on_secondary_color = theme_colours_json["on-secondary"];
    }

    if (icons_json["close"] === undefined) icons_json["close"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMTIgMTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik05LjI1OSw4My4zMzNjMCwtOC43MjkgMCwtMTMuMDk0IDIuNzEyLC0xNS44MDdjMi43MTIsLTIuNzEyIDcuMDc3LC0yLjcxMiAxNS44MDcsLTIuNzEyYzguNzMsMCAxMy4wOTUsMCAxNS44MDcsMi43MTJjMi43MTIsMi43MTIgMi43MTIsNy4wNzcgMi43MTIsMTUuODA3YzAsOC43MyAwLDEzLjA5NSAtMi43MTIsMTUuODA3Yy0yLjcxMiwyLjcxMiAtNy4wNzcsMi43MTIgLTE1LjgwNywyLjcxMmMtOC43MywwIC0xMy4wOTQsMCAtMTUuODA3LC0yLjcxMmMtMi43MTIsLTIuNzEyIC0yLjcxMiwtNy4wNzcgLTIuNzEyLC0xNS44MDdaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PHBhdGggZD0iTTE2LjAzOSwxNi4wMzljLTYuNzgsNi43OCAtNi43OCwxNy42OTIgLTYuNzgsMzkuNTE3YzAsMS44MzEgMCwzLjU4NiAwLjAwNCw1LjI2N2MyLjM1MiwtMS41NDIgNC45NDQsLTIuMjE3IDcuNDI5LC0yLjU1MmMyLjk4OSwtMC40MDIgNi42NjQsLTAuNDAxIDEwLjY3MSwtMC40MDFsMC44MjksMGM0LjAwNywtMCA3LjY4MiwtMC4wMDEgMTAuNjcxLDAuNDAxYzMuMjkxLDAuNDQzIDYuNzcsMS40ODQgOS42MzIsNC4zNDVjMi44NjEsMi44NjIgMy45MDIsNi4zNDEgNC4zNDUsOS42MzJjMC40MDEsMi45ODkgMC40MDEsNi42NjQgMC40LDEwLjY3MWwwLDAuODI5YzAuMDAxLDQuMDA4IDAuMDAxLDcuNjgyIC0wLjQsMTAuNjdjLTAuMzM1LDIuNDg2IC0xLjAxLDUuMDc3IC0yLjU1Miw3LjQzYzEuNjgyLDAuMDA0IDMuNDM2LDAuMDA0IDUuMjY3LDAuMDA0YzIxLjgyNCwtMCAzMi43MzYsLTAgMzkuNTE3LC02Ljc4YzYuNzgsLTYuNzggNi43OCwtMTcuNjkyIDYuNzgsLTM5LjUxN2MtMCwtMjEuODI1IC0wLC0zMi43MzYgLTYuNzgsLTM5LjUxN2MtNi43OCwtNi43NzkgLTE3LjY5MiwtNi43NzkgLTM5LjUxNywtNi43NzljLTIxLjgyNSwtMCAtMzIuNzM2LC0wIC0zOS41MTYsNi43NzlsLTAsMC4wMDFabTQ1LjMwMywxMi44OTZjLTEuOTE4LC0wIC0zLjQ3MywxLjU1NCAtMy40NzMsMy40NzJjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MywzLjQ3Mmw4Ljk3OCwwbC0xNy4yMjEsMTcuMjIxYy0xLjM1NiwxLjM1NiAtMS4zNTYsMy41NTQgMCw0LjkxYzEuMzU2LDEuMzU2IDMuNTU0LDEuMzU2IDQuOTEsMGwxNy4yMjEsLTE3LjIybDAsOC45NzhjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MiwzLjQ3MmMxLjkxOCwwIDMuNDczLC0xLjU1NCAzLjQ3MywtMy40NzJsLTAsLTE3LjM2MWMtMCwtMS45MTggLTEuNTU1LC0zLjQ3MiAtMy40NzMsLTMuNDcybC0xNy4zNjEsLTBsMC4wMDEsLTBaIiBzdHlsZT0iZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PC9zdmc+`;
    let svg_image_close = icons_json["close"];

    if (icons_json["minimize"] === undefined) icons_json["minimize"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTUzNy41LDQwMEM1MzcuNSwzODYuMTkzIDUyNi4zMDcsMzc1IDUxMi41LDM3NUwxNDYuNzQ4LDM3NUwyMTIuMTAzLDMxOC45ODFDMjIyLjU4NiwzMDkuOTk2IDIyMy44LDI5NC4yMTMgMjE0LjgxNSwyODMuNzNDMjA1LjgyOSwyNzMuMjQ3IDE5MC4wNDcsMjcyLjAzMyAxNzkuNTY0LDI4MS4wMTlMNjIuODk3LDM4MS4wMkM1Ny4zNTYsMzg1Ljc2NyA1NC4xNjcsMzkyLjcwMyA1NC4xNjcsNDAwQzU0LjE2Nyw0MDcuMjk3IDU3LjM1Niw0MTQuMjMzIDYyLjg5Nyw0MTguOThMMTc5LjU2NCw1MTguOThDMTkwLjA0Nyw1MjcuOTY3IDIwNS44MjksNTI2Ljc1MyAyMTQuODE1LDUxNi4yN0MyMjMuOCw1MDUuNzg3IDIyMi41ODYsNDkwLjAwMyAyMTIuMTAzLDQ4MS4wMkwxNDYuNzQ4LDQyNUw1MTIuNSw0MjVDNTI2LjMwNyw0MjUgNTM3LjUsNDEzLjgwNyA1MzcuNSw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMjY2LjY2N0MzMTIuNSwyOTAuMDczIDMxMi41LDMwMS43NzYgMzE4LjExNywzMTAuMTgzQzMyMC41NDksMzEzLjgyNCAzMjMuNjc1LDMxNi45NDkgMzI3LjMxNSwzMTkuMzgyQzMzNS43MjMsMzI0Ljk5OSAzNDcuNDI3LDMyNC45OTkgMzcwLjgzMywzMjQuOTk5TDUxMi41LDMyNC45OTlDNTUzLjkyLDMyNC45OTkgNTg3LjUsMzU4LjU3NyA1ODcuNSw0MDBDNTg3LjUsNDQxLjQyIDU1My45Miw0NzUgNTEyLjUsNDc1TDM3MC44MzMsNDc1QzM0Ny40MjcsNDc1IDMzNS43Miw0NzUgMzI3LjMxMyw0ODAuNjE3QzMyMy42NzQsNDgzLjA1IDMyMC41NSw0ODYuMTczIDMxOC4xMTgsNDg5LjgxM0MzMTIuNSw0OTguMjIgMzEyLjUsNTA5LjkyMyAzMTIuNSw1MzMuMzMzQzMxMi41LDYyNy42MTMgMzEyLjUsNjc0Ljc1MyAzNDEuNzksNzA0LjA0M0MzNzEuMDgsNzMzLjMzMyA0MTguMjEzLDczMy4zMzMgNTEyLjQ5Myw3MzMuMzMzTDU0NS44MjcsNzMzLjMzM0M2NDAuMTA3LDczMy4zMzMgNjg3LjI0Nyw3MzMuMzMzIDcxNi41MzcsNzA0LjA0M0M3NDUuODI3LDY3NC43NTMgNzQ1LjgyNyw2MjcuNjEzIDc0NS44MjcsNTMzLjMzM0w3NDUuODI3LDI2Ni42NjdDNzQ1LjgyNywxNzIuMzg2IDc0NS44MjcsMTI1LjI0NSA3MTYuNTM3LDk1Ljk1NkM2ODcuMjQ3LDY2LjY2NyA2NDAuMTA3LDY2LjY2NyA1NDUuODI3LDY2LjY2N0w1MTIuNDkzLDY2LjY2N0M0MTguMjEzLDY2LjY2NyAzNzEuMDgsNjYuNjY3IDM0MS43OSw5NS45NTZDMzEyLjUsMTI1LjI0NSAzMTIuNSwxNzIuMzg2IDMxMi41LDI2Ni42NjdaIiBzdHlsZT0iZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgIDwvZz4KPC9zdmc+Cg==`;
    let svg_image_minimize = icons_json["minimize"];

    if (icons_json["restore"] === undefined || icons_json["restore"] === "") icons_json["restore"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTU0LjE2Nyw0MDBDNTQuMTY3LDQxMy44MDcgNjUuMzYsNDI1IDc5LjE2Nyw0MjVMNDQ0LjkyLDQyNUwzNzkuNTYzLDQ4MS4wMkMzNjkuMDgsNDkwLjAwMyAzNjcuODY3LDUwNS43ODcgMzc2Ljg1Myw1MTYuMjdDMzg1LjgzNyw1MjYuNzUzIDQwMS42Miw1MjcuOTY3IDQxMi4xMDMsNTE4Ljk4TDUyOC43Nyw0MTguOThDNTM0LjMxLDQxNC4yMzMgNTM3LjUsNDA3LjI5NyA1MzcuNSw0MDBDNTM3LjUsMzkyLjcwMyA1MzQuMzEsMzg1Ljc2NyA1MjguNzcsMzgxLjAyTDQxMi4xMDMsMjgxLjAxOUM0MDEuNjIsMjcyLjAzMyAzODUuODM3LDI3My4yNDcgMzc2Ljg1MywyODMuNzNDMzY3Ljg2NywyOTQuMjEzIDM2OS4wOCwzMDkuOTk2IDM3OS41NjMsMzE4Ljk4MUw0NDQuOTIsMzc1TDc5LjE2NywzNzVDNjUuMzYsMzc1IDU0LjE2NywzODYuMTkzIDU0LjE2Nyw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMzI1LjAwMUwzMjUuMTA5LDMyNS4wMDFDMzE2LjQ5MSwzMDAuNTQ4IDMyMC44MDMsMjcyLjI5MiAzMzguODksMjUxLjE5MkMzNjUuODQ3LDIxOS43NDMgNDEzLjE5MywyMTYuMSA0NDQuNjQzLDI0My4wNTdMNTYxLjMxLDM0My4wNTdDNTc3LjkzMywzNTcuMzA3IDU4Ny41LDM3OC4xMDcgNTg3LjUsNDAwQzU4Ny41LDQyMS44OTcgNTc3LjkzMyw0NDIuNjk3IDU2MS4zMSw0NTYuOTQ3TDQ0NC42NDMsNTU2Ljk0N0M0MTMuMTkzLDU4My45MDMgMzY1Ljg0Nyw1ODAuMjYgMzM4Ljg5LDU0OC44MUMzMjAuODAzLDUyNy43MSAzMTYuNDkxLDQ5OS40NTMgMzI1LjEwOSw0NzVMMzEyLjUsNDc1TDMxMi41LDUzMy4zMzNDMzEyLjUsNjI3LjYxMyAzMTIuNSw2NzQuNzUzIDM0MS43OSw3MDQuMDQzQzM3MS4wOCw3MzMuMzMzIDQxOC4yMiw3MzMuMzMzIDUxMi41LDczMy4zMzNMNTQ1LjgzMyw3MzMuMzMzQzY0MC4xMTMsNzMzLjMzMyA2ODcuMjUzLDczMy4zMzMgNzE2LjU0Myw3MDQuMDQzQzc0NS44MzMsNjc0Ljc1MyA3NDUuODMzLDYyNy42MTMgNzQ1LjgzMyw1MzMuMzMzTDc0NS44MzMsMjY2LjY2N0M3NDUuODMzLDE3Mi4zODYgNzQ1LjgzMywxMjUuMjQ1IDcxNi41NDMsOTUuOTU2QzY4Ny4yNTMsNjYuNjY3IDY0MC4xMTMsNjYuNjY3IDU0NS44MzMsNjYuNjY3TDUxMi41LDY2LjY2N0M0MTguMjIsNjYuNjY3IDM3MS4wOCw2Ni42NjcgMzQxLjc5LDk1Ljk1NkMzMTIuNSwxMjUuMjQ1IDMxMi41LDE3Mi4zODYgMzEyLjUsMjY2LjY2N0wzMTIuNSwzMjUuMDAxWiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo=`;
    let svg_image_restore = icons_json["restore"];

    document.getElementById("sticky-notes-notefox-addon").style.backgroundColor = primary_color + "";
    document.getElementById("sticky-notes-notefox-addon").style.color = on_primary_color + "";
    document.getElementById("close--sticky-notes-notefox-addon").style.backgroundImage = `url("data:image/svg+xml;base64,${svg_image_close}")`;
    document.getElementById("close--sticky-notes-notefox-addon").style.backgroundColor = secondary_color + "";
    document.getElementById("close--sticky-notes-notefox-addon").style.color = on_secondary_color + "";
    document.getElementById("minimize--sticky-notes-notefox-addon").style.backgroundImage = `url("data:image/svg+xml;base64,${svg_image_minimize}")`;
    document.getElementById("minimize--sticky-notes-notefox-addon").style.backgroundColor = secondary_color + "";
    document.getElementById("minimize--sticky-notes-notefox-addon").style.color = on_secondary_color + "";
    document.getElementById("slider-container--sticky-notes-notefox-addon").style.borderColor = secondary_color + "";
    document.getElementById("slider--sticky-notes-notefox-addon").style.background = `linear-gradient(to right, ${secondary_color} 0%, ${secondary_color} ${opacity * 100}%, #eeeeee ${opacity * 100}%, #eeeeee 100%)`;
    document.getElementById("move--sticky-notes-notefox-addon").style.backgroundColor = secondary_color + "";
    document.getElementById("move--sticky-notes-notefox-addon").style.color = on_secondary_color + "";
    document.getElementById("page-or-domain--sticky-notes-notefox-addon").style.backgroundColor = secondary_color + "";
    document.getElementById("page-or-domain--sticky-notes-notefox-addon").style.color = on_secondary_color + "";
    document.getElementById("text-container--sticky-notes-notefox-addon").style.color = on_secondary_color + "";
    document.getElementById("text--sticky-notes-notefox-addon").style.color = on_primary_color + "";
    document.getElementById("resize--sticky-notes-notefox-addon").style.borderRightColor = secondary_color;
}

function isAPage(url) {
    return (url.replace("http://", "").replace("https://", "").split("/").length > 1);
}

function getLogoSvg() {
    return `
    <svg width="100%" height="100%" opacity="0.2" viewBox="0 0 124 35" version="1.1" xmlns="http://www.w3.org/2000/svg"
         xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/"
         style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
        <g transform="matrix(1,0,0,1,-49.2854,-3.33067e-15)">
            <g id="Notefox-5.0---logo---enabled" serif:id="Notefox 5.0 - logo - enabled"
               transform="matrix(0.980713,0,0,1.00072,47.6348,-1.032)">
                <rect x="1.683" y="1.031" width="125.685" height="34.475" style="fill:none;"/>
                <g transform="matrix(0.849722,0,0,0.832731,1.01026,3.73808)">
                    <g transform="matrix(1,0,0,1,0.122402,-1.33227e-15)">
                        <g transform="matrix(0.00367347,-9.96139e-35,9.96139e-35,-0.00367347,-0.377797,7.74807)">
                            <g>
                                <g transform="matrix(1,1.09476e-47,-1.09476e-47,1,-736.712,51.3984)">
                                    <path d="M9902,1717.33C9862.5,1951.56 9792.24,2109.66 9492.23,2169.47C9050.83,2257.48 3901.8,2277.56 2927.36,2162.12C2561.16,2118.74 2352.33,2037.45 2321.45,1769.86C2137.7,177.424 2120.97,-4700.85 2317.54,-6623.36C2384.5,-7278.28 2707.79,-7485.84 3102.39,-7529.4C4186.31,-7649.05 8108.14,-7655.12 9215.9,-7490.99C9572.98,-7438.08 9722.26,-7264.1 9788.66,-6841.08C10023.4,-5345.51 10159.3,191.648 9902,1717.33Z"
                                          style="fill:rgb(0,168,28);fill-rule:nonzero;"/>
                                </g>
                                <g transform="matrix(1,5.47382e-48,-1.64215e-47,1,-736.712,51.3984)">
                                    <path d="M10224.1,1771.65C10484.6,227.261 10349,-5377.82 10111.4,-6891.73C10066,-7180.53 9980.19,-7379.51 9856.96,-7520.13C9720.23,-7676.14 9534.25,-7774.05 9263.78,-7814.12C8140.84,-7980.51 4165.31,-7975.38 3066.55,-7854.09C2792.99,-7823.9 2547.6,-7729.06 2355.54,-7536.06C2175.9,-7355.53 2035.99,-7081.29 1992.57,-6656.59C1794.34,-4717.89 1811.64,201.462 1996.94,1807.3C2044.9,2222.95 2320.12,2419.14 2888.93,2486.52C3878.56,2603.75 9107.83,2579.21 9556.1,2489.83C9749.06,2451.36 9879.49,2380.16 9974.71,2293.4C10115.2,2165.37 10186.6,1993.95 10224.1,1771.65ZM9902,1717.33C9862.5,1951.56 9792.24,2109.66 9492.23,2169.47C9050.83,2257.48 3901.8,2277.56 2927.36,2162.12C2561.16,2118.74 2352.33,2037.45 2321.45,1769.86C2137.7,177.424 2120.97,-4700.85 2317.54,-6623.36C2384.5,-7278.28 2707.79,-7485.84 3102.39,-7529.4C4186.31,-7649.05 8108.14,-7655.12 9215.9,-7490.99C9572.98,-7438.08 9722.26,-7264.1 9788.66,-6841.08C10023.4,-5345.51 10159.3,191.648 9902,1717.33Z"
                                          style="fill:white;fill-opacity:0.7;"/>
                                </g>
                            </g>
                            <g>
                                <g transform="matrix(-0.975524,-2.34562e-34,2.34562e-34,-0.984174,10684,-4202.33)">
                                    <path d="M5460.4,-848.9C5460.4,-848.9 2731.14,-2829.86 311.464,-3908.33C110.077,-3998.09 86.573,-4171.24 176.962,-4377.36C307.743,-4675.6 670.875,-5266.86 918.113,-5483.08C1037.62,-5587.59 1214.17,-5664.81 1374.57,-5528.48C2978.61,-4165.18 6430.3,-2337.1 6430.3,-2337.1C6430.3,-2337.1 7262.79,-1115.02 7118.75,-903.027C6991.2,-715.281 5460.4,-848.9 5460.4,-848.9Z"
                                          style="fill:rgb(0,54,28);fill-rule:nonzero;"/>
                                </g>
                                <g transform="matrix(-0.975524,-2.34562e-34,2.34562e-34,-0.984174,10684,-4202.33)">
                                    <path d="M5431.03,-518.26C5431.03,-518.26 6461.69,-431.303 6942.64,-496.44C7072.24,-513.993 7174.1,-545.512 7238.82,-579.715L7331.35,-643.479L7396.5,-717.621L7450.27,-830.662L7470.36,-972.736C7470.24,-1043.1 7454.78,-1133.82 7420.66,-1236.98C7272.01,-1686.42 6707.82,-2522.84 6707.82,-2522.84C6677.3,-2567.64 6636.21,-2604.38 6588.11,-2629.85C6588.11,-2629.85 3177.08,-4433.72 1592.54,-5780.45C1278.81,-6047.1 930.324,-5936.4 696.571,-5731.98C422.504,-5492.3 14.828,-4840.27 -130.143,-4509.68C-229.555,-4282.98 -229.024,-4076.61 -152.786,-3913.39L-93.19,-3813.54L-15.259,-3727.52C35.253,-3681.46 97.53,-3639.75 174.133,-3605.61C2565.59,-2539.71 5262.56,-581.101 5262.56,-581.101C5311.88,-545.307 5370.14,-523.575 5431.03,-518.26ZM5460.4,-848.9C5460.4,-848.9 2731.14,-2829.86 311.464,-3908.33C110.077,-3998.09 86.573,-4171.24 176.962,-4377.36C307.743,-4675.6 670.875,-5266.86 918.113,-5483.08C1037.62,-5587.59 1214.17,-5664.81 1374.57,-5528.48C2978.61,-4165.18 6430.3,-2337.1 6430.3,-2337.1C6430.3,-2337.1 7262.79,-1115.02 7118.75,-903.027C6991.2,-715.281 5460.4,-848.9 5460.4,-848.9Z"
                                          style="fill:white;fill-opacity:0.7;"/>
                                </g>
                            </g>
                        </g>
                        <g transform="matrix(1.2,0,0,1.2,0.186572,-4.16549)">
                            <path d="M7.283,6.554C7.286,6.551 7.288,6.546 7.291,6.541C7.327,6.481 7.467,6.244 7.543,6.173C7.545,6.171 7.547,6.168 7.55,6.166L7.696,6.03L7.849,5.966L7.982,5.952L8.098,5.969L8.291,6.07L8.419,6.232L8.46,6.351L8.472,6.463C8.472,7.098 8.55,7.725 8.557,8.36C8.822,8.085 9.101,7.836 9.403,7.684L9.591,7.63L9.774,7.642L9.963,7.726C10.018,7.763 10.077,7.832 10.122,7.877C10.148,7.903 10.172,7.932 10.199,7.96C10.207,7.951 10.214,7.944 10.222,7.938L10.333,7.86L10.482,7.802C10.641,7.762 10.801,7.769 10.963,7.806C11.033,7.821 11.103,7.842 11.173,7.863C11.219,7.877 11.263,7.912 11.312,7.896C11.722,7.763 11.974,7.48 12.308,7.225C12.386,7.166 12.614,6.977 12.797,6.934L13.008,6.919L13.18,6.96L13.359,7.062L13.483,7.178C13.517,7.216 13.538,7.264 13.578,7.303C13.711,7.429 13.859,7.565 14.009,7.689C14.049,7.645 14.083,7.608 14.095,7.598C14.479,7.266 14.944,6.998 15.439,6.881C15.564,6.852 15.716,6.797 15.837,6.81L15.975,6.841L16.113,6.909L16.256,7.038L16.372,7.232C16.422,7.351 16.436,7.509 16.463,7.614C16.485,7.704 16.54,7.875 16.623,8.027C16.645,8.067 16.688,8.126 16.713,8.157C16.806,8.148 16.885,8.085 16.966,8.022C17.09,7.926 17.209,7.809 17.329,7.697C17.618,7.427 17.923,7.195 18.259,7.12L18.443,7.104L18.619,7.133L18.791,7.21L18.969,7.35C19.043,7.424 19.115,7.518 19.184,7.616C19.21,7.652 19.249,7.702 19.28,7.741C19.372,7.71 19.531,7.66 19.628,7.649C19.963,7.612 20.308,7.66 20.645,7.66C20.921,7.66 21.145,7.884 21.145,8.16C21.145,8.436 20.921,8.66 20.645,8.66C20.345,8.66 20.037,8.609 19.738,8.643C19.658,8.652 19.583,8.699 19.505,8.722C19.423,8.747 19.339,8.763 19.254,8.766L19.037,8.747L18.883,8.695L18.757,8.623C18.672,8.564 18.589,8.484 18.513,8.39C18.464,8.329 18.39,8.231 18.336,8.157C18.276,8.194 18.219,8.243 18.161,8.293C17.992,8.437 17.829,8.607 17.658,8.748C17.322,9.027 16.955,9.201 16.536,9.148L16.377,9.112L16.239,9.05C16.135,8.992 16.035,8.909 15.946,8.804C15.724,8.544 15.567,8.125 15.504,7.902C15.234,7.995 14.983,8.155 14.766,8.339C14.711,8.401 14.446,8.693 14.309,8.76L14.161,8.812L14.018,8.824L13.875,8.799L13.734,8.731C13.457,8.547 13.151,8.276 12.896,8.034C12.477,8.356 12.137,8.68 11.62,8.848C11.403,8.918 11.192,8.902 10.986,8.849C10.929,8.834 10.873,8.817 10.817,8.801C10.814,8.8 10.81,8.799 10.806,8.798C10.787,8.821 10.768,8.843 10.752,8.859L10.539,8.998L10.33,9.046L10.127,9.03C9.921,8.984 9.747,8.877 9.594,8.75C9.468,8.854 9.347,8.979 9.227,9.106C8.969,9.378 8.716,9.662 8.449,9.87L8.29,9.956L8.13,9.986L7.982,9.968L7.852,9.915L7.717,9.803L7.628,9.664L7.576,9.495C7.56,9.412 7.557,9.319 7.557,9.291L7.557,8.443C7.557,8.307 7.554,8.172 7.548,8.037C7.535,8.057 7.522,8.076 7.511,8.09C7.46,8.311 7.261,8.476 7.025,8.476C6.749,8.476 6.525,8.252 6.525,7.976L6.54,7.835L6.597,7.671C6.629,7.604 6.688,7.543 6.722,7.477C6.887,7.161 7.098,6.856 7.283,6.554Z"
                                  style="fill:white;"/>
                        </g>
                        <g transform="matrix(1.2,0,0,1.2,0.186572,-4.16549)">
                            <path d="M6.299,14.717C6.298,14.694 6.298,14.671 6.299,14.653C6.311,14.43 6.322,14.206 6.343,13.983C6.388,13.502 6.508,12.996 6.781,12.587C6.841,12.496 6.973,12.329 7.105,12.228L7.28,12.125L7.462,12.076C7.988,12.015 8.303,12.221 8.537,12.531C8.638,12.663 8.72,12.821 8.798,12.984C8.835,13.062 8.87,13.143 8.91,13.218C8.953,13.204 8.995,13.19 9.026,13.178C9.158,13.127 9.265,13.091 9.297,13.085L9.426,13.074L9.557,13.089L9.696,13.136L9.848,13.232C9.904,13.278 10.004,13.393 10.045,13.441C10.309,13.506 10.792,13.46 10.996,13.405C11.114,13.374 11.286,13.336 11.391,13.254C11.412,13.195 11.448,13.097 11.471,13.059L11.621,12.891L11.765,12.815L11.95,12.786L12.089,12.808L12.238,12.878C12.428,13.005 12.748,13.132 13.041,13.182C13.165,13.203 13.283,13.227 13.364,13.186C13.61,13.063 13.911,13.163 14.034,13.41C14.158,13.657 14.058,13.957 13.811,14.081C13.576,14.198 13.237,14.229 12.875,14.168C12.621,14.125 12.355,14.041 12.12,13.94C11.897,14.148 11.526,14.298 11.256,14.371C10.914,14.463 10.075,14.508 9.681,14.377C9.567,14.338 9.429,14.222 9.332,14.128C9.17,14.185 8.948,14.257 8.824,14.267L8.576,14.245L8.43,14.182L8.326,14.1C8.128,13.903 7.998,13.622 7.866,13.355C7.812,13.244 7.78,13.109 7.666,13.075C7.645,13.101 7.622,13.128 7.613,13.142C7.432,13.414 7.369,13.756 7.339,14.076C7.319,14.281 7.309,14.487 7.298,14.692C7.298,14.696 7.298,14.701 7.298,14.707C7.3,14.75 7.305,14.876 7.294,14.936L7.23,15.121L7.145,15.241L7.033,15.337C6.804,15.49 6.493,15.428 6.34,15.198C6.241,15.05 6.232,14.869 6.299,14.717Z"
                                  style="fill:white;"/>
                        </g>
                    </g>
                    <g transform="matrix(1.2,0,0,1.2,4.48891,8.70392)">
                        <path d="M35.59,-0.142C35.587,-0.146 35.584,-0.149 35.581,-0.153C35.191,-0.637 34.803,-0.998 34.417,-1.236C34.031,-1.474 33.726,-1.673 33.502,-1.833C33.885,-2.089 34.245,-2.269 34.582,-2.373C34.919,-2.477 35.229,-2.529 35.512,-2.529C36.063,-2.529 36.574,-2.426 37.045,-2.22C37.517,-2.014 37.936,-1.637 38.302,-1.089C38.579,-0.677 39.028,0.098 39.65,1.236C40.272,2.374 41.03,3.847 41.926,5.655C42.454,6.727 42.986,7.815 43.522,8.919C44.058,10.023 44.604,11.067 45.159,12.051C45.433,12.537 45.71,12.992 45.991,13.417C46.019,12.716 46.076,11.973 46.163,11.187C46.291,10.027 46.443,8.803 46.619,7.515C46.795,6.227 46.947,4.903 47.075,3.543C47.203,2.183 47.267,0.815 47.267,-0.561C47.267,-0.881 47.259,-1.209 47.243,-1.545C47.227,-1.881 47.203,-2.201 47.171,-2.505C47.679,-2.505 48.098,-2.465 48.429,-2.385C48.761,-2.305 49.023,-2.197 49.215,-2.061C49.407,-1.925 49.544,-1.769 49.627,-1.593C49.71,-1.417 49.752,-1.233 49.752,-1.041C49.752,-0.833 49.709,-0.405 49.624,0.243C49.539,0.891 49.431,1.683 49.299,2.619C49.167,3.555 49.027,4.567 48.876,5.655C48.726,6.743 48.586,7.835 48.455,8.931C48.324,10.027 48.216,11.063 48.13,12.039C48.044,13.015 48.001,13.855 48.001,14.559C48.001,14.879 48.009,15.195 48.025,15.507C48.03,15.621 48.038,15.732 48.049,15.841C48.254,16.004 48.462,16.145 48.673,16.263C48.196,16.615 47.771,16.863 47.4,17.007C47.028,17.151 46.651,17.223 46.269,17.223C45.978,17.223 45.714,17.167 45.478,17.054C45.242,16.942 45.027,16.781 44.833,16.573C44.639,16.365 44.447,16.11 44.257,15.807C44.053,15.503 43.769,14.987 43.405,14.259C43.04,13.531 42.614,12.667 42.126,11.667C41.638,10.667 41.114,9.607 40.554,8.487C39.994,7.367 39.426,6.259 38.85,5.163C38.405,4.317 37.965,3.521 37.531,2.775C37.48,3.519 37.397,4.288 37.284,5.079C37.076,6.535 36.864,8.075 36.648,9.699C36.432,11.323 36.324,13.039 36.324,14.847C36.324,15.183 36.336,15.519 36.36,15.855C36.384,16.191 36.404,16.519 36.42,16.839C35.913,16.839 35.49,16.799 35.153,16.719C34.816,16.639 34.551,16.527 34.356,16.383C34.162,16.239 34.023,16.079 33.94,15.903C33.857,15.727 33.815,15.535 33.815,15.327C33.815,15.119 33.857,14.703 33.942,14.079C34.026,13.455 34.138,12.683 34.276,11.763C34.415,10.843 34.557,9.855 34.703,8.799C34.849,7.743 34.991,6.675 35.129,5.595C35.268,4.515 35.379,3.491 35.464,2.523C35.548,1.555 35.59,0.727 35.59,0.039C35.59,-0.022 35.59,-0.083 35.59,-0.142Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M56.733,17.079C56.142,17.079 55.553,16.955 54.965,16.707C54.377,16.459 53.843,16.079 53.364,15.567C52.885,15.055 52.499,14.403 52.206,13.611C51.913,12.819 51.766,11.879 51.766,10.791C51.766,9.463 51.971,8.24 52.38,7.122C52.789,6.003 53.37,5.047 54.122,4.252C54.874,3.458 55.758,2.885 56.772,2.535C56.948,2.535 57.083,2.583 57.177,2.679C57.271,2.775 57.32,2.887 57.325,3.015C56.8,3.356 56.28,3.836 55.767,4.455C55.253,5.073 54.862,5.905 54.593,6.95L54.754,6.998C55.213,5.956 55.751,5.141 56.367,4.553C56.983,3.965 57.619,3.549 58.275,3.307C58.931,3.065 59.537,2.943 60.094,2.943C60.798,2.943 61.417,3.151 61.953,3.567C62.488,3.983 62.908,4.579 63.214,5.355C63.52,6.131 63.673,7.063 63.673,8.151C63.673,9.175 63.542,10.211 63.281,11.259C63.02,12.307 62.613,13.271 62.06,14.151C61.506,15.031 60.789,15.739 59.908,16.275C59.027,16.811 57.968,17.079 56.733,17.079ZM57.06,15.519C57.703,15.519 58.274,15.31 58.772,14.894C59.27,14.477 59.692,13.925 60.037,13.239C60.383,12.553 60.647,11.797 60.829,10.973C61.011,10.148 61.102,9.335 61.102,8.535C61.102,7.111 60.907,6.088 60.516,5.464C60.125,4.84 59.624,4.528 59.013,4.528C58.418,4.528 57.854,4.733 57.322,5.141C56.789,5.55 56.314,6.086 55.896,6.748C55.477,7.41 55.149,8.138 54.911,8.93C54.673,9.723 54.553,10.495 54.553,11.247C54.553,11.999 54.638,12.701 54.807,13.353C54.975,14.005 55.243,14.529 55.61,14.925C55.977,15.321 56.461,15.519 57.06,15.519Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M67.757,5.48C67.466,5.522 67.172,5.579 66.874,5.651C66.321,5.784 65.717,5.994 65.062,6.28C65.046,6.174 65.034,6.056 65.026,5.925C65.018,5.793 65.014,5.67 65.014,5.555C65.014,4.97 65.15,4.531 65.421,4.239C65.692,3.946 66.058,3.754 66.518,3.662C66.968,3.572 67.465,3.526 68.01,3.524C68.109,2.519 68.158,1.438 68.158,0.279C68.158,0.023 68.154,-0.237 68.146,-0.501C68.138,-0.765 68.134,-1.025 68.134,-1.281C68.966,-1.169 69.594,-0.849 70.019,-0.321C70.444,0.207 70.657,0.943 70.657,1.887C70.657,2.418 70.625,2.987 70.562,3.595C71.09,3.589 71.608,3.543 72.115,3.457C72.664,3.364 73.122,3.168 73.489,2.871C73.505,2.96 73.517,3.063 73.525,3.178C73.533,3.293 73.537,3.409 73.537,3.524C73.537,4.26 73.397,4.753 73.118,5.004C72.839,5.255 72.461,5.38 71.985,5.38C71.385,5.38 70.827,5.377 70.312,5.37C70.166,6.269 70.001,7.208 69.817,8.187C69.593,9.379 69.397,10.571 69.229,11.763C69.061,12.955 68.977,14.103 68.977,15.207C68.977,15.879 69.005,16.467 69.061,16.971C69.117,17.475 69.201,17.847 69.313,18.087C68.632,17.863 68.089,17.563 67.684,17.187C67.279,16.811 66.993,16.343 66.825,15.783C66.658,15.223 66.574,14.559 66.574,13.791C66.574,12.799 66.654,11.811 66.814,10.827C66.974,9.843 67.158,8.819 67.366,7.755C67.507,7.034 67.638,6.275 67.757,5.48Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M76.3,10.551C76.282,10.803 76.273,11.052 76.273,11.295C76.273,12.669 76.481,13.709 76.895,14.414C77.309,15.118 77.918,15.471 78.721,15.471C80.235,15.471 81.504,14.687 82.527,13.119C83.114,13.229 83.407,13.469 83.407,13.839C82.729,14.935 81.94,15.749 81.042,16.281C80.143,16.813 79.107,17.079 77.932,17.079C77.05,17.079 76.27,16.834 75.592,16.343C74.913,15.852 74.385,15.163 74.006,14.278C73.628,13.392 73.438,12.374 73.438,11.223C73.438,10.039 73.614,8.939 73.965,7.923C74.317,6.907 74.81,6.023 75.446,5.271C76.082,4.519 76.829,3.931 77.686,3.507C78.543,3.083 79.472,2.871 80.472,2.871C81.661,2.871 82.57,3.171 83.2,3.77C83.83,4.37 84.145,5.23 84.145,6.351C84.145,7.209 83.914,7.977 83.452,8.654C82.991,9.332 82.356,9.861 81.548,10.243C80.74,10.625 79.809,10.815 78.754,10.815C78.266,10.815 77.802,10.787 77.361,10.731C76.996,10.685 76.642,10.625 76.3,10.551ZM76.401,9.627L76.971,9.627C77.87,9.627 78.651,9.472 79.315,9.163C79.978,8.853 80.495,8.414 80.865,7.845C81.234,7.277 81.419,6.619 81.419,5.871C81.419,5.345 81.292,4.934 81.037,4.637C80.783,4.341 80.431,4.192 79.98,4.192C79.391,4.192 78.868,4.418 78.409,4.869C77.951,5.32 77.563,5.907 77.244,6.63C76.925,7.353 76.683,8.126 76.519,8.949C76.474,9.178 76.434,9.404 76.401,9.627Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M87.48,5.509C87.25,5.547 87.017,5.595 86.782,5.651C86.229,5.784 85.625,5.994 84.971,6.28C84.955,6.174 84.943,6.056 84.935,5.925C84.927,5.793 84.923,5.67 84.923,5.555C84.923,4.97 85.058,4.531 85.329,4.239C85.601,3.946 85.966,3.754 86.426,3.662C86.875,3.572 87.371,3.526 87.914,3.524C88.092,2.818 88.292,2.124 88.515,1.443C88.905,0.251 89.371,-0.821 89.913,-1.773C90.455,-2.725 91.094,-3.481 91.83,-4.041C92.567,-4.601 93.405,-4.881 94.345,-4.881C95.317,-4.881 96.108,-4.617 96.718,-4.089C97.328,-3.561 97.633,-2.897 97.633,-2.097C97.633,-1.663 97.534,-1.245 97.338,-0.845C97.141,-0.444 96.854,-0.114 96.478,0.144C96.101,0.403 95.648,0.533 95.118,0.533C94.998,0.533 94.863,0.521 94.711,0.497C94.56,0.473 94.413,0.429 94.27,0.365C94.392,0.263 94.527,0.099 94.675,-0.129C94.823,-0.357 94.953,-0.618 95.064,-0.913C95.176,-1.208 95.231,-1.498 95.231,-1.785C95.231,-2.268 95.122,-2.65 94.903,-2.932C94.685,-3.214 94.402,-3.355 94.056,-3.355C93.474,-3.355 92.953,-3.082 92.493,-2.535C92.033,-1.988 91.63,-1.253 91.285,-0.33C90.94,0.593 90.642,1.63 90.392,2.784C90.333,3.052 90.277,3.323 90.223,3.596C90.262,3.596 90.301,3.596 90.34,3.596C90.913,3.596 91.475,3.55 92.024,3.457C92.573,3.364 93.031,3.168 93.397,2.871C93.413,2.96 93.425,3.063 93.433,3.178C93.441,3.293 93.445,3.409 93.445,3.524C93.445,4.26 93.305,4.753 93.026,5.004C92.747,5.255 92.37,5.38 91.893,5.38C91.22,5.38 90.6,5.376 90.034,5.368C89.993,5.367 89.951,5.367 89.911,5.366C89.86,5.693 89.812,6.022 89.767,6.354C89.601,7.581 89.469,8.771 89.37,9.924C89.271,11.077 89.201,12.114 89.161,13.034C89.121,13.955 89.101,14.679 89.101,15.207C89.101,15.671 89.105,16.059 89.113,16.371C89.121,16.683 89.137,16.975 89.161,17.247C89.185,17.519 89.221,17.823 89.269,18.159C89.317,18.495 89.389,18.919 89.485,19.431C88.966,19.239 88.522,18.995 88.153,18.699C87.783,18.403 87.483,18.051 87.251,17.643C87.019,17.235 86.849,16.767 86.74,16.239C86.631,15.711 86.577,15.127 86.577,14.487C86.577,13.895 86.606,13.107 86.664,12.123C86.722,11.139 86.821,10.047 86.963,8.847C87.09,7.764 87.263,6.651 87.48,5.509Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M98.121,17.079C97.531,17.079 96.941,16.955 96.353,16.707C95.765,16.459 95.232,16.079 94.752,15.567C94.273,15.055 93.887,14.403 93.594,13.611C93.301,12.819 93.155,11.879 93.155,10.791C93.155,9.463 93.359,8.24 93.768,7.122C94.177,6.003 94.758,5.047 95.51,4.252C96.262,3.458 97.146,2.885 98.161,2.535C98.337,2.535 98.472,2.583 98.565,2.679C98.659,2.775 98.708,2.887 98.713,3.015C98.188,3.356 97.669,3.836 97.155,4.455C96.641,5.073 96.25,5.905 95.982,6.95L96.142,6.998C96.602,5.956 97.139,5.141 97.755,4.553C98.371,3.965 99.007,3.549 99.663,3.307C100.319,3.065 100.926,2.943 101.482,2.943C102.186,2.943 102.806,3.151 103.341,3.567C103.876,3.983 104.297,4.579 104.602,5.355C104.908,6.131 105.061,7.063 105.061,8.151C105.061,9.175 104.931,10.211 104.67,11.259C104.409,12.307 104.002,13.271 103.448,14.151C102.894,15.031 102.177,15.739 101.296,16.275C100.415,16.811 99.357,17.079 98.121,17.079ZM98.449,15.519C99.092,15.519 99.662,15.31 100.16,14.894C100.658,14.477 101.08,13.925 101.426,13.239C101.771,12.553 102.035,11.797 102.217,10.973C102.4,10.148 102.491,9.335 102.491,8.535C102.491,7.111 102.295,6.088 101.904,5.464C101.513,4.84 101.012,4.528 100.401,4.528C99.807,4.528 99.243,4.733 98.71,5.141C98.178,5.55 97.702,6.086 97.284,6.748C96.866,7.41 96.537,8.138 96.299,8.93C96.061,9.723 95.942,10.495 95.942,11.247C95.942,11.999 96.026,12.701 96.195,13.353C96.364,14.005 96.632,14.529 96.999,14.925C97.366,15.321 97.849,15.519 98.449,15.519Z"
                              style="fill:rgb(0,168,28);"/>
                        <path d="M111.078,11.591C110.457,12.31 109.871,13.123 109.321,14.031C108.681,15.087 108.153,16.319 107.737,17.727C107.245,17.231 106.878,16.767 106.635,16.335C106.392,15.903 106.271,15.487 106.271,15.087C106.271,14.623 106.499,14.083 106.955,13.467C107.411,12.851 108.007,12.183 108.743,11.463C109.276,10.942 109.837,10.405 110.425,9.854C110.284,9.469 110.145,9.083 110.008,8.694C109.632,7.63 109.237,6.627 108.823,5.685C108.41,4.744 107.947,3.942 107.435,3.279C107.698,3.103 108.007,2.955 108.362,2.835C108.717,2.715 109.014,2.655 109.251,2.655C109.683,2.655 110.056,2.807 110.37,3.111C110.685,3.415 110.963,3.847 111.206,4.407C111.448,4.967 111.694,5.639 111.942,6.423C112.094,6.906 112.258,7.42 112.432,7.963C112.802,7.603 113.164,7.242 113.519,6.879C114.287,6.095 114.943,5.327 115.487,4.575C116.031,3.823 116.359,3.111 116.471,2.439C116.835,2.839 117.106,3.207 117.285,3.543C117.463,3.879 117.553,4.207 117.553,4.527C117.553,5.055 117.373,5.551 117.013,6.015C116.653,6.479 116.173,6.963 115.573,7.467C114.973,7.971 114.309,8.527 113.581,9.135C113.383,9.301 113.185,9.473 112.987,9.652C113.3,10.541 113.63,11.355 113.976,12.096C114.403,13.009 114.831,13.807 115.259,14.49C115.687,15.172 116.098,15.743 116.492,16.201C116.885,16.659 117.234,16.999 117.538,17.223C117.33,17.287 117.118,17.341 116.901,17.383C116.684,17.425 116.468,17.447 116.253,17.447C115.443,17.447 114.733,17.193 114.124,16.687C113.514,16.181 112.971,15.505 112.494,14.66C112.017,13.815 111.578,12.876 111.175,11.841C111.143,11.758 111.11,11.675 111.078,11.591Z"
                              style="fill:rgb(0,168,28);"/>
                    </g>
                </g>
            </g>
        </g>
    </svg>
    `;
}

function getCSS(notes, x = "10px", y = "10px", w = "200px", h = "300px", opacity = 0.8, websites_json, settings_json, icons_json, theme_colours_json, supported_font_family) {
    if (icons_json === undefined) icons_json = {};

    if (icons_json["close"] === undefined) icons_json["close"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMTIgMTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik05LjI1OSw4My4zMzNjMCwtOC43MjkgMCwtMTMuMDk0IDIuNzEyLC0xNS44MDdjMi43MTIsLTIuNzEyIDcuMDc3LC0yLjcxMiAxNS44MDcsLTIuNzEyYzguNzMsMCAxMy4wOTUsMCAxNS44MDcsMi43MTJjMi43MTIsMi43MTIgMi43MTIsNy4wNzcgMi43MTIsMTUuODA3YzAsOC43MyAwLDEzLjA5NSAtMi43MTIsMTUuODA3Yy0yLjcxMiwyLjcxMiAtNy4wNzcsMi43MTIgLTE1LjgwNywyLjcxMmMtOC43MywwIC0xMy4wOTQsMCAtMTUuODA3LC0yLjcxMmMtMi43MTIsLTIuNzEyIC0yLjcxMiwtNy4wNzcgLTIuNzEyLC0xNS44MDdaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PHBhdGggZD0iTTE2LjAzOSwxNi4wMzljLTYuNzgsNi43OCAtNi43OCwxNy42OTIgLTYuNzgsMzkuNTE3YzAsMS44MzEgMCwzLjU4NiAwLjAwNCw1LjI2N2MyLjM1MiwtMS41NDIgNC45NDQsLTIuMjE3IDcuNDI5LC0yLjU1MmMyLjk4OSwtMC40MDIgNi42NjQsLTAuNDAxIDEwLjY3MSwtMC40MDFsMC44MjksMGM0LjAwNywtMCA3LjY4MiwtMC4wMDEgMTAuNjcxLDAuNDAxYzMuMjkxLDAuNDQzIDYuNzcsMS40ODQgOS42MzIsNC4zNDVjMi44NjEsMi44NjIgMy45MDIsNi4zNDEgNC4zNDUsOS42MzJjMC40MDEsMi45ODkgMC40MDEsNi42NjQgMC40LDEwLjY3MWwwLDAuODI5YzAuMDAxLDQuMDA4IDAuMDAxLDcuNjgyIC0wLjQsMTAuNjdjLTAuMzM1LDIuNDg2IC0xLjAxLDUuMDc3IC0yLjU1Miw3LjQzYzEuNjgyLDAuMDA0IDMuNDM2LDAuMDA0IDUuMjY3LDAuMDA0YzIxLjgyNCwtMCAzMi43MzYsLTAgMzkuNTE3LC02Ljc4YzYuNzgsLTYuNzggNi43OCwtMTcuNjkyIDYuNzgsLTM5LjUxN2MtMCwtMjEuODI1IC0wLC0zMi43MzYgLTYuNzgsLTM5LjUxN2MtNi43OCwtNi43NzkgLTE3LjY5MiwtNi43NzkgLTM5LjUxNywtNi43NzljLTIxLjgyNSwtMCAtMzIuNzM2LC0wIC0zOS41MTYsNi43NzlsLTAsMC4wMDFabTQ1LjMwMywxMi44OTZjLTEuOTE4LC0wIC0zLjQ3MywxLjU1NCAtMy40NzMsMy40NzJjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MywzLjQ3Mmw4Ljk3OCwwbC0xNy4yMjEsMTcuMjIxYy0xLjM1NiwxLjM1NiAtMS4zNTYsMy41NTQgMCw0LjkxYzEuMzU2LDEuMzU2IDMuNTU0LDEuMzU2IDQuOTEsMGwxNy4yMjEsLTE3LjIybDAsOC45NzhjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MiwzLjQ3MmMxLjkxOCwwIDMuNDczLC0xLjU1NCAzLjQ3MywtMy40NzJsLTAsLTE3LjM2MWMtMCwtMS45MTggLTEuNTU1LC0zLjQ3MiAtMy40NzMsLTMuNDcybC0xNy4zNjEsLTBsMC4wMDEsLTBaIiBzdHlsZT0iZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PC9zdmc+`;
    let svg_image_close = icons_json["close"];

    if (icons_json["minimize"] === undefined) icons_json["minimize"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTUzNy41LDQwMEM1MzcuNSwzODYuMTkzIDUyNi4zMDcsMzc1IDUxMi41LDM3NUwxNDYuNzQ4LDM3NUwyMTIuMTAzLDMxOC45ODFDMjIyLjU4NiwzMDkuOTk2IDIyMy44LDI5NC4yMTMgMjE0LjgxNSwyODMuNzNDMjA1LjgyOSwyNzMuMjQ3IDE5MC4wNDcsMjcyLjAzMyAxNzkuNTY0LDI4MS4wMTlMNjIuODk3LDM4MS4wMkM1Ny4zNTYsMzg1Ljc2NyA1NC4xNjcsMzkyLjcwMyA1NC4xNjcsNDAwQzU0LjE2Nyw0MDcuMjk3IDU3LjM1Niw0MTQuMjMzIDYyLjg5Nyw0MTguOThMMTc5LjU2NCw1MTguOThDMTkwLjA0Nyw1MjcuOTY3IDIwNS44MjksNTI2Ljc1MyAyMTQuODE1LDUxNi4yN0MyMjMuOCw1MDUuNzg3IDIyMi41ODYsNDkwLjAwMyAyMTIuMTAzLDQ4MS4wMkwxNDYuNzQ4LDQyNUw1MTIuNSw0MjVDNTI2LjMwNyw0MjUgNTM3LjUsNDEzLjgwNyA1MzcuNSw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMjY2LjY2N0MzMTIuNSwyOTAuMDczIDMxMi41LDMwMS43NzYgMzE4LjExNywzMTAuMTgzQzMyMC41NDksMzEzLjgyNCAzMjMuNjc1LDMxNi45NDkgMzI3LjMxNSwzMTkuMzgyQzMzNS43MjMsMzI0Ljk5OSAzNDcuNDI3LDMyNC45OTkgMzcwLjgzMywzMjQuOTk5TDUxMi41LDMyNC45OTlDNTUzLjkyLDMyNC45OTkgNTg3LjUsMzU4LjU3NyA1ODcuNSw0MDBDNTg3LjUsNDQxLjQyIDU1My45Miw0NzUgNTEyLjUsNDc1TDM3MC44MzMsNDc1QzM0Ny40MjcsNDc1IDMzNS43Miw0NzUgMzI3LjMxMyw0ODAuNjE3QzMyMy42NzQsNDgzLjA1IDMyMC41NSw0ODYuMTczIDMxOC4xMTgsNDg5LjgxM0MzMTIuNSw0OTguMjIgMzEyLjUsNTA5LjkyMyAzMTIuNSw1MzMuMzMzQzMxMi41LDYyNy42MTMgMzEyLjUsNjc0Ljc1MyAzNDEuNzksNzA0LjA0M0MzNzEuMDgsNzMzLjMzMyA0MTguMjEzLDczMy4zMzMgNTEyLjQ5Myw3MzMuMzMzTDU0NS44MjcsNzMzLjMzM0M2NDAuMTA3LDczMy4zMzMgNjg3LjI0Nyw3MzMuMzMzIDcxNi41MzcsNzA0LjA0M0M3NDUuODI3LDY3NC43NTMgNzQ1LjgyNyw2MjcuNjEzIDc0NS44MjcsNTMzLjMzM0w3NDUuODI3LDI2Ni42NjdDNzQ1LjgyNywxNzIuMzg2IDc0NS44MjcsMTI1LjI0NSA3MTYuNTM3LDk1Ljk1NkM2ODcuMjQ3LDY2LjY2NyA2NDAuMTA3LDY2LjY2NyA1NDUuODI3LDY2LjY2N0w1MTIuNDkzLDY2LjY2N0M0MTguMjEzLDY2LjY2NyAzNzEuMDgsNjYuNjY3IDM0MS43OSw5NS45NTZDMzEyLjUsMTI1LjI0NSAzMTIuNSwxNzIuMzg2IDMxMi41LDI2Ni42NjdaIiBzdHlsZT0iZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgIDwvZz4KPC9zdmc+Cg==`;
    let svg_image_minimize = icons_json["minimize"];

    let svg_background_image = window.btoa(getLogoSvg());

    if (settings_json["font-family"] === undefined || !supported_font_family.includes(settings_json["font-family"])) settings_json["font-family"] = "Merienda";
    let font_family = settings_json["font-family"];

    if (settings_json["immersive-sticky-notes"] === undefined) settings_json["immersive-sticky-notes"] = true;
    let immersive_sticky_notes = settings_json["immersive-sticky-notes"];

    let visibility_immersive = "hidden";
    if (!immersive_sticky_notes) visibility_immersive = "visible";

    let primary_color = "#fffd7d";
    let secondary_color = "#ff6200";
    let secondary_color_semi_transparent = secondary_color + "88";
    let on_primary_color = "#111111";
    let on_secondary_color = "#ffffff";
    if (theme_colours_json !== undefined) {
        if (theme_colours_json["primary"] !== undefined) primary_color = theme_colours_json["primary"];
        if (theme_colours_json["secondary"] !== undefined) secondary_color = theme_colours_json["secondary"];
        if (theme_colours_json["on-primary"] !== undefined) on_primary_color = theme_colours_json["on-primary"];
        if (theme_colours_json["on-secondary"] !== undefined) on_secondary_color = theme_colours_json["on-secondary"];
    }
    let tertiary_transparent_color = secondary_color + "44";
    let displayWidth = window.innerWidth;
    let displayHeight = window.innerHeight;
    let yAsInt = parseInt(y.replace("px", ""));
    let hAsInt = parseInt(h.replace("px", ""));
    let xAsInt = parseInt(x.replace("px", ""));
    let wAsInt = parseInt(w.replace("px", ""));

    let safeTop = (((yAsInt + hAsInt) > displayHeight ? displayHeight - hAsInt : yAsInt)) + "px";
    let safeLeft = (((xAsInt + wAsInt) > displayWidth ? displayWidth - wAsInt : xAsInt)) + "px";

    return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Merienda:wght@300..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Roboto:ital,wght@0,100..900;1,100..900&family=Shantell+Sans:ital,wght@0,300..800;1,300..800&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&family=Victor+Mono:ital,wght@0,100..700;1,100..700&display=swap');
            
            #sticky-notes-notefox-addon {
                position: fixed;
                top: ${safeTop};
                left:  ${safeLeft};
                width: ${w};
                height:  ${h};
                background-color: ${primary_color};
                opacity: ${opacity};
                z-index: 99999999999;
                padding: 15px !important;
                margin: 0px !important;
                box-sizing: border-box !important;
                border-radius: 15px;
                cursor: default;
                box-shadow: 0px 0px 5px rgba(255,98,0,0.27);
                font-family: inherit;
                color: ${on_primary_color};
                font-size: 17px;
                background-image: url('data:image/svg+xml;base64,${svg_background_image}');
                background-position: left 50% bottom 10px;
                background-repeat: no-repeat;
                background-size: 50% auto;
            }
            #sticky-notes-notefox-addon * {
                min-width: 0px;
                min-height: 0px;
                line-height: normal;
            }
            #move--sticky-notes-notefox-addon, #page-or-domain--sticky-notes-notefox-addon {
                position: absolute;
                top: 0px;
                left: 40%;
                right: 40%;
                width: auto;
                height: 20px;
                background-color: ${secondary_color};
                opacity: 1;
                cursor: grab;
                border-radius: 0px 0px 10px 10px;
                z-index: 4;
                font-weight: bold !important;
                font-family: 'Open Sans', sans-serif;
                padding: 2px 5px !important;
                font-size: 10px !important;
                border: 0px solid transparent;
                color: ${on_secondary_color};
                margin: 0px !important;
                text-align: center;
                box-sizing: border-box !important;
            }
            #move--sticky-notes-notefox-addon {
                opacity: 0;
                z-index: 5;
            }
            #move--sticky-notes-notefox-addon:hover, #move--sticky-notes-notefox-addon:active {
                /*opacity: 1;*/
            }
            #move--sticky-notes-notefox-addon:active {
                cursor: grabbing;
                z-index: 6;
            }
            #resize--sticky-notes-notefox-addon {
                position: absolute;
                right: 0px;
                bottom: 0px;
                width: 20px;
                height: 20px;
                background-color: transparent;
                opacity: 1;
                cursor: nwse-resize;
                z-index: 2;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
                border-right-color: ${secondary_color};
                border-width: 0px !important;
            }
            #resize--sticky-notes-notefox-addon:active, #resize--sticky-notes-notefox-addon:focus{
                cursor: nwse-resize;
            }
            #resize--sticky-notes-notefox-addon::before{
                cursor: nwse-resize;
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                border-top: 20px solid transparent;
                border-right-width: 20px;
                border-right-style: solid;
                border-right-color: inherit;
                width: 0;
                height: 0;
                border-bottom-right-radius: 15px;
                opacity: 0.6;
            }
            #resize--sticky-notes-notefox-addon:hover::before{
                opacity: 0.8;
            }#resize--sticky-notes-notefox-addon:active::before{
                opacity: 1;
            }
            #text--sticky-notes-notefox-addon {
                scrollbar-color: ${secondary_color} transparent;
                scrollbar-width: thin;
            }
            #text--sticky-notes-notefox-addon, #text-container--sticky-notes-notefox-addon {
                position: relative;
                top: 0px;
                bottom: 0px;
                width: 100%;
                height: 100%;
                padding: 10px !important;
                margin: 0px !important;
                box-sizing: border-box !important;
                background-color: transparent;
                color: ${on_primary_color};
                opacity: 1;
                cursor: text;
                z-index: 1;
                border: 0px solid transparent !important;
                border-radius: 15px;
                overflow: auto;
                resize: none;
                transition: 0.2s;
                font-family: inherit;
                font-size: 14px !important;
            }
            #text--sticky-notes-notefox-addon * {
                white-space: inherit;
                padding: 0px;
                margin: 0px;
                background-color: transparent;
                color: inherit;
                border: 0px solid transparent;
                font-size: inherit;
                text-decoration-thickness: 2px;
            }
            #text--sticky-notes-notefox-addon b, #text--sticky-notes-notefox-addon strong {
                font-family: inherit;
                font-weight: 800;
            }
            
            #text--sticky-notes-notefox-addon i, #text--sticky-notes-notefox-addon em, #text--sticky-notes-notefox-addon cite, #text--sticky-notes-notefox-addon q, #text--sticky-notes-notefox-addon blockquote {
                font-style: italic;
            }
            
            #text--sticky-notes-notefox-addon code, #text--sticky-notes-notefox-addon pre {
                font-family: 'Source Code Pro', monospace;
            }
            
            #text--sticky-notes-notefox-addon mark {
                background-color: ${tertiary_transparent_color};
                color: ${on_primary_color};
                padding: 2px 5px !important;
                border-radius: 15px;
            }
            
            #text--sticky-notes-notefox-addon h1 {
                font-family: inherit;
                font-weight: 800;
                font-size: 2em !important;
            }
            
            #text--sticky-notes-notefox-addon h2 {
                font-family: inherit;
                font-weight: 800;
                font-size: 1.7em !important;
            }
            
            #text--sticky-notes-notefox-addon h3 {
                font-family: inherit;
                font-weight: 800;
                font-size: 1.4em !important;
            }
            
            #text--sticky-notes-notefox-addon h4 {
                font-family: inherit;
                font-weight: 800;
                font-size: 1.1em !important;
            }
            
            #text--sticky-notes-notefox-addon h5 {
                font-family: inherit;
                font-weight: 800;
                font-size: 0.85em !important;
            }
            
            #text--sticky-notes-notefox-addon h6 {
                font-family: inherit;
                font-weight: 800;
                font-size: 0.7em !important;
            }
            
            #text--sticky-notes-notefox-addon big {
                font-size: 1.5em !important;
            }
            
            #text--sticky-notes-notefox-addon small, #text--sticky-notes-notefox-addon sup, #text--sticky-notes-notefox-addon sub {
                font-size: 0.7em !important;
            }
            
            #text--sticky-notes-notefox-addon img {
                border-radius: 15px;
                width: auto;
                max-width: 100%;
                height: auto;
            }
            
            #text--sticky-notes-notefox-addon a {
                text-decoration: underline;
                text-decoration-style: dotted;
                color: inherit;
                text-decoration-thickness: 2px;
            }
            
            #text-container--sticky-notes-notefox-addon {
                position: absolute;
                left: 0px;
                right: 0px;
                top: 20px;
                bottom: 20px;
                width: auto;
                height: auto;
                padding: 0px !important;
                overflow: visible;
            }
            #text--sticky-notes-notefox-addon:focus {
                outline: none;
                box-shadow: 0px 0px 0px 3px ${secondary_color} inset;
            }
            
            #text--sticky-notes-notefox-addon, #text--sticky-notes-notefox-addon * {
                font-family: '${font_family}', sans-serif;
            }
            
            #close--sticky-notes-notefox-addon, #minimize--sticky-notes-notefox-addon {
                position: absolute;
                top: 0px ;
                right: 0px;
                width: 30px;
                height: 30px;
                background-image: url('data:image/svg+xml;base64,${svg_image_close}');
                background-size: auto 60%;
                background-repeat: no-repeat;
                background-position: center center;
                background-color: ${secondary_color};
                border: 0px solid transparent;
                color: ${on_secondary_color};
                z-index: 5;
                border-radius: 15px;
                cursor: pointer;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
                font-size: 8px;
            }
            #close--sticky-notes-notefox-addon:active, #close--sticky-notes-notefox-addon:focus, #minimize--sticky-notes-notefox-addon:active, #minimize--sticky-notes-notefox-addon:focus {
                box-shadow: 0px 0px 0px 5px ${on_secondary_color};
                z-index: 6;
                transition: 0.5s;
            }
            #minimize--sticky-notes-notefox-addon {
                left: 0px;
                right: auto;
                background-image: url('data:image/svg+xml;base64,${svg_image_minimize}');
            }
            
            #slider-container--sticky-notes-notefox-addon {
                position: absolute;
                z-index: 2;
                width: auto !important;
                left: 8px !important;
                right: 22px !important;
                bottom: 7px !important;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
                background-color: transparent;
            }
            
            #slider--sticky-notes-notefox-addon {
                width: 100%;
                height: 5px;
                background: linear-gradient(to right, ${secondary_color} 0%, ${secondary_color} ${opacity * 100}%, #eeeeee ${opacity * 100}%, #eeeeee 100%);
                border: 0px solid ${secondary_color};
                outline: none;
                opacity: 0.7;
                transition: opacity .2s;
                cursor: pointer;
                border-radius: 15px;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
            }
            
            #slider--sticky-notes-notefox-addon:active {
                background: inherit;
                cursor: grabbing;
            }
            
            #slider--sticky-notes-notefox-addon:hover {
                opacity: 1;
            }
            
            #slider--sticky-notes-notefox-addon::-moz-range-thumb {
                width: 15px;
                height: 15px;
                background-color: ${secondary_color};
                cursor: grab;
                border: 0px solid #eeeeee;
                border-radius: 100%;
                margin: 0px;
            }
            #slider--sticky-notes-notefox-addon::-moz-range-thumb:active {
                cursor: grabbing;
                box-shadow: 0px 0px 0px 4px ${secondary_color};
                transition: 0.5s;
            }
            #tag--sticky-notes-notefox-addon {
                position: absolute;
                top: 3px;
                left: 30%;
                right: 30%;
                width: auto;
                height: 8px;
                opacity: 1;
                cursor: default;
                border-radius: 15px;
                z-index: 1;
            }
            
            #commands-container--sticky-notes-notefox-addon {
                visibility: ${visibility_immersive};
                width: auto !important;
                height: auto !important;
                box-sizing: border-box;
                position: absolute;
                top: 0px;
                bottom: 0px;
                left: 0px;
                right: 0px;
            }
            
            #commands-container--sticky-notes-notefox-addon:hover, #commands-container--sticky-notes-notefox-addon:hover *, #commands-container--sticky-notes-notefox-addon:active, #commands-container--sticky-notes-notefox-addon:active * {
                visibility: visible !important;
            }
            
            #text--sticky-notes-notefox-addon {
                visibility: visible !important;
            }
            
            @media screen and (max-width: ${wAsInt > 800 ? w : "800px"}) {
                /*Mobile*/
                #sticky-notes-notefox-addon {
                    top: 0px !important;
                    left: 0px !important;
                    right: 0px !important;
                    bottom: 0px !important;
                    width: 100vw !important;
                    height: 100vh !important;
                }
                
                #text--sticky-notes-notefox-addon, #text-container--sticky-notes-notefox-addon {
                    font-size: 1.2em !important;
                }
                
                #commands-container--sticky-notes-notefox-addon {
                    visibility: visible !important;
                }
                
                #move--sticky-notes-notefox-addon, #page-or-domain--sticky-notes-notefox-addon {
                    height: auto !important;
                    font-size: 1em !important;
                    padding: 10px !important;
                }
                
                #close--sticky-notes-notefox-addon, #minimize--sticky-notes-notefox-addon {
                    width: 50px !important;
                    height: 50px !important;
                    margin: 2px !important;
                }
                
                #text-container--sticky-notes-notefox-addon {
                    top: 50px !important;
                    bottom: 50px !important;
                }
                
                #slider-container--sticky-notes-notefox-addon {
                    left: 15px !important;
                    right: 15px !important;
                    bottom: 10px !important;
                }
                
                #resize--sticky-notes-notefox-addon {
                    display: none !important;
                }
                
                #slider--sticky-notes-notefox-addon {
                    height: 10px !important;
                }
                
                #slider--sticky-notes-notefox-addon::-moz-range-thumb {
                    width: 25px;
                    height: 25px;
                }
            }
            `;
}

/**
 *
 * @param type 0: close totally, 1: minimised
 */
function onClickClose(minimized = false) {
    browser.runtime.sendMessage({from: "sticky", data: {sticky: false, minimized: false}});
    document.getElementById("sticky-notes-notefox-addon").remove();
}

function onInputText(text, settings_json) {
    browser.runtime.sendMessage({from: "sticky", data: {new_text: text.innerHTML}});
    listenerLinks(text, settings_json);
}

function onKeyDownText(text, settings_json, e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        bold();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        italic();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        underline();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        strikethrough();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        insertLink(text, settings_json);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        hightlighter()
    }
}

function onPasteText(text, e) {
    if (((e.originalEvent || e).clipboardData).getData("text/html") !== "") {
        //WITH FORMATTING (HTML)
        e.preventDefault(); // Prevent the default paste action
        let clipboardData = (e.originalEvent || e).clipboardData;
        let pastedText = clipboardData.getData("text/html");
        let sanitizedHTML = sanitizeHTML(pastedText)
        document.execCommand("insertHTML", false, sanitizedHTML);
    } else {
        //WITHOUT FORMATTING (TEXT)
        e.preventDefault(); // Prevent the default paste action
        let clipboardData = (e.originalEvent || e).clipboardData;
        let pastedText = clipboardData.getData("text/plain");
        document.execCommand("insertText", false, pastedText);
    }
}

/**
 * Make "movable" the sticky-notes
 */
function onMouseDownMove(e, stickyNote, isDragging) {
    isDragging = true;
    const offsetX = e.clientX - stickyNote.getBoundingClientRect().left;
    const offsetY = e.clientY - stickyNote.getBoundingClientRect().top;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onMouseMove(e) {
        if (!isDragging) return;

        stickyNote.style.left = e.clientX - offsetX + 'px';
        stickyNote.style.top = e.clientY - offsetY + 'px';

        if (stickyNote.style.left.replace("px", "") < 0) stickyNote.style.left = "0px";
        if (stickyNote.style.top.replace("px", "") < 0) stickyNote.style.top = "0px";

        if (stickyNote.style.left.replace("px", "") > (screenWidth - stickyNote.offsetWidth)) stickyNote.style.left = (screenWidth - stickyNote.offsetWidth) + "px";
        if (stickyNote.style.top.replace("px", "") > (screenHeight - stickyNote.offsetHeight)) stickyNote.style.top = (screenHeight - stickyNote.offsetHeight) + "px";
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (stickyNote.style.left.replace("px", "") < 0) stickyNote.style.left = "0px";
        if (stickyNote.style.top.replace("px", "") < 0) stickyNote.style.top = "0px";

        if (stickyNote.style.left.replace("px", "") > (screenWidth - stickyNote.offsetWidth)) stickyNote.style.left = (screenWidth - stickyNote.offsetWidth) + "px";
        if (stickyNote.style.top.replace("px", "") > (screenHeight - stickyNote.offsetHeight)) stickyNote.style.top = (screenHeight - stickyNote.offsetHeight) + "px";

        browser.runtime.sendMessage({
            from: "sticky",
            data: {coords: {x: stickyNote.style.left, y: stickyNote.style.top}}
        });
    }

    return isDragging;
}

/**
 * Make "resizable" the sticky-notes
 */
function onMouseDownResize(e, stickyNote, isResizing) {
    isResizing = true;
    const initialWidth = stickyNote.offsetWidth;
    const initialHeight = stickyNote.offsetHeight;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const startX = e.clientX;
    const startY = e.clientY;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onMouseMove(e) {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        stickyNote.style.width = initialWidth + deltaX + 'px';
        stickyNote.style.height = initialHeight + deltaY + 'px';

        if (stickyNote.style.width.replace("px", "") < 200) stickyNote.style.width = "200px";
        if (stickyNote.style.height.replace("px", "") < 200) stickyNote.style.height = "200px";

        if (stickyNote.style.width.replace("px", "") > (screenWidth / 2)) stickyNote.style.width = (screenWidth / 2) + "px";
        if (stickyNote.style.height.replace("px", "") > (screenHeight / 2)) stickyNote.style.height = (screenHeight / 2) + "px";
    }

    function onMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        if (stickyNote.style.width.replace("px", "") < 200) stickyNote.style.width = "200px";
        if (stickyNote.style.height.replace("px", "") < 200) stickyNote.style.height = "200px";

        if (stickyNote.style.width.replace("px", "") > (screenWidth / 2)) stickyNote.style.width = (screenWidth / 2) + "px";
        if (stickyNote.style.height.replace("px", "") > (screenHeight / 2)) stickyNote.style.height = (screenHeight / 2) + "px";

        browser.runtime.sendMessage({
            from: "sticky",
            data: {sizes: {w: stickyNote.style.width, h: stickyNote.style.height}}
        });
    }

    return isResizing;
}

/**
 * Check correctness of the number and return a string: number+"px" (o otherwise)
 * @param number number to check
 * @param otherwise if the "number" is wrong; this is the "default" value
 * @returns {*} return a string: number+"px"
 */
function checkCorrectNumber(number, otherwise) {
    let temp = number;
    if (parseInt(temp.toString().replace("px", "")) + "px" !== number) {
        temp = otherwise;
    }
    return temp;
}

function getInteger(number) {
    return parseInt(number.toString().replace("px", ""));
}

function bold() {
    //console.log("Bold B")
    document.execCommand("bold", false);
}

function italic() {
    //console.log("Italic I")
    document.execCommand("italic", false);
}

function underline() {
    //console.log("Underline U")
    document.execCommand("underline", false);
}

function strikethrough() {
    //console.log("Strikethrough S")
    document.execCommand("strikethrough", false);
}


function hasAncestorAnchor(element) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === 'a') {
            return true; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return false; // Reached the top of the DOM tree without finding an anchor element
}

function getTheAncestorAnchor(element) {
    while (element) {
        if (element.tagName && element.tagName.toLowerCase() === 'a') {
            return [element, element.parentNode]; // Found an anchor element
        }
        element = element.parentNode; // Move up to the parent node
    }
    return [false, false]; // Reached the top of the DOM tree without finding an anchor element
}

function insertLink(text, settings_json) {
    //if (isValidURL(value)) {
    let selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    } else if (document.selection && document.selection.type !== 'Control') {
        // For older versions of Internet Explorer
        selectedText = document.selection.createRange().text;
    }

    // Check if the selected text is already wrapped in a link (or one of its ancestors is a link)
    let isLink = hasAncestorAnchor(window.getSelection().anchorNode);

    // If it's already a link, remove the link; otherwise, add the link
    if (isLink) {
        // Remove the link
        let elements = getTheAncestorAnchor(window.getSelection().anchorNode);
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

        onInputText(text, settings_json);
    } else {
        /*let url = prompt("Enter the URL:");

        if (url) {
            document.execCommand('createLink', false, url);
        }*/
        //Creating link with the same selectedText
        document.execCommand('createLink', false, selectedText);
    }
    //}
}

function hightlighter() {
    insertHTMLFromTagName("mark");
    addAction();
}

function insertCode() {
    insertHTMLFromTagName("code");
    addAction();
}

function isValidURL(url) {
    var urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return urlPattern.test(url);
}

function sanitizeHTML(input) {
    //console.log(input)

    let div_sanitize = document.createElement("div");
    div_sanitize.innerHTML = input;

    //console.log(input);

    let sanitizedHTML = sanitize(div_sanitize, -1, -1);

    //console.log(sanitizedHTML.innerHTML)

    return sanitizedHTML.innerHTML;
}

function listenerLinks(element, settings_json) {
    let notes = element;
    if (notes.innerHTML !== "" && notes.innerHTML !== "<br>") {
        let links = notes.querySelectorAll('a');
        if (settings_json["open-links-only-with-ctrl"] === undefined) settings_json["open-links-only-with-ctrl"] = true;
        links.forEach(link => {
            function onMouseOverDown(event, settings_json, link) {
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    link.style.textDecorationStyle = "solid";
                    link.style.cursor = "pointer";
                }
            }

            function onMouseLeaveUp(link) {
                link.style.textDecorationStyle = "dotted";
                link.style.cursor = "inherit";
            }

            link.onmousedown = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseover = function (event) {
                onMouseOverDown(event, settings_json, link);
            }
            link.onmouseup = function (event) {
                onMouseLeaveUp(link);
            }
            link.onmouseleave = function (event) {
                onMouseLeaveUp(link);
            }
            link.onclick = function (event) {
                if ((settings_json["open-links-only-with-ctrl"] === "yes" || settings_json["open-links-only-with-ctrl"] === true) && (event.ctrlKey || event.metaKey)) {
                    window.open(link.href, '_blank');
                } else {
                    // Prevent the default link behavior
                }
                event.preventDefault();
            }
        });
    }
}

function sanitize(element, allowedTags, allowedAttributes) {
    if (allowedTags === -1) allowedTags = ["b", "i", "u", "a", "strike", "code", "span", "div", "img", "br", "h1", "h2", "h3", "h4", "h5", "h6", "p", "small", "big", "em", "strong", "s", "sub", "sup", "blockquote", "q", "mark"];
    if (allowedAttributes === -1) allowedAttributes = ["src", "alt", "title", "cite", "href"];

    let sanitizedHTML = element;

    //console.log(input)
    for (var i = sanitizedHTML.childNodes.length - 1; i >= 0; i--) {
        var node = sanitize(sanitizedHTML.childNodes[i], allowedTags, allowedAttributes);

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
    return sanitizedHTML;
}

function openMinimized(settings_json = {}, icons_json = {}, theme_colours_json = {}) {
    let restore;
    if (!document.getElementById("restore--sticky-notes-notefox-addon")) {
        restore = document.createElement("input");
        restore.type = "button";
        restore.id = "restore--sticky-notes-notefox-addon";
        //restore.value = "≻";
        let css = document.createElement("style");
        css.innerText = getCSSMinimized(settings_json, icons_json, theme_colours_json);
        document.body.appendChild(css);
        document.body.appendChild(restore);
    } else {
        restore = document.getElementById("restore--sticky-notes-notefox-addon");
    }

    if (icons_json["restore"] === undefined || icons_json["restore"] === "") icons_json["restore"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTU0LjE2Nyw0MDBDNTQuMTY3LDQxMy44MDcgNjUuMzYsNDI1IDc5LjE2Nyw0MjVMNDQ0LjkyLDQyNUwzNzkuNTYzLDQ4MS4wMkMzNjkuMDgsNDkwLjAwMyAzNjcuODY3LDUwNS43ODcgMzc2Ljg1Myw1MTYuMjdDMzg1LjgzNyw1MjYuNzUzIDQwMS42Miw1MjcuOTY3IDQxMi4xMDMsNTE4Ljk4TDUyOC43Nyw0MTguOThDNTM0LjMxLDQxNC4yMzMgNTM3LjUsNDA3LjI5NyA1MzcuNSw0MDBDNTM3LjUsMzkyLjcwMyA1MzQuMzEsMzg1Ljc2NyA1MjguNzcsMzgxLjAyTDQxMi4xMDMsMjgxLjAxOUM0MDEuNjIsMjcyLjAzMyAzODUuODM3LDI3My4yNDcgMzc2Ljg1MywyODMuNzNDMzY3Ljg2NywyOTQuMjEzIDM2OS4wOCwzMDkuOTk2IDM3OS41NjMsMzE4Ljk4MUw0NDQuOTIsMzc1TDc5LjE2NywzNzVDNjUuMzYsMzc1IDU0LjE2NywzODYuMTkzIDU0LjE2Nyw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMzI1LjAwMUwzMjUuMTA5LDMyNS4wMDFDMzE2LjQ5MSwzMDAuNTQ4IDMyMC44MDMsMjcyLjI5MiAzMzguODksMjUxLjE5MkMzNjUuODQ3LDIxOS43NDMgNDEzLjE5MywyMTYuMSA0NDQuNjQzLDI0My4wNTdMNTYxLjMxLDM0My4wNTdDNTc3LjkzMywzNTcuMzA3IDU4Ny41LDM3OC4xMDcgNTg3LjUsNDAwQzU4Ny41LDQyMS44OTcgNTc3LjkzMyw0NDIuNjk3IDU2MS4zMSw0NTYuOTQ3TDQ0NC42NDMsNTU2Ljk0N0M0MTMuMTkzLDU4My45MDMgMzY1Ljg0Nyw1ODAuMjYgMzM4Ljg5LDU0OC44MUMzMjAuODAzLDUyNy43MSAzMTYuNDkxLDQ5OS40NTMgMzI1LjEwOSw0NzVMMzEyLjUsNDc1TDMxMi41LDUzMy4zMzNDMzEyLjUsNjI3LjYxMyAzMTIuNSw2NzQuNzUzIDM0MS43OSw3MDQuMDQzQzM3MS4wOCw3MzMuMzMzIDQxOC4yMiw3MzMuMzMzIDUxMi41LDczMy4zMzNMNTQ1LjgzMyw3MzMuMzMzQzY0MC4xMTMsNzMzLjMzMyA2ODcuMjUzLDczMy4zMzMgNzE2LjU0Myw3MDQuMDQzQzc0NS44MzMsNjc0Ljc1MyA3NDUuODMzLDYyNy42MTMgNzQ1LjgzMyw1MzMuMzMzTDc0NS44MzMsMjY2LjY2N0M3NDUuODMzLDE3Mi4zODYgNzQ1LjgzMywxMjUuMjQ1IDcxNi41NDMsOTUuOTU2QzY4Ny4yNTMsNjYuNjY3IDY0MC4xMTMsNjYuNjY3IDU0NS44MzMsNjYuNjY3TDUxMi41LDY2LjY2N0M0MTguMjIsNjYuNjY3IDM3MS4wOCw2Ni42NjcgMzQxLjc5LDk1Ljk1NkMzMTIuNSwxMjUuMjQ1IDMxMi41LDE3Mi4zODYgMzEyLjUsMjY2LjY2N0wzMTIuNSwzMjUuMDAxWiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo=`;
    let svg_image_restore = icons_json["restore"];

    let primary_color = "#fffd7d";
    let secondary_color = "#ff6200";
    let on_primary_color = "#111111";
    let on_secondary_color = "#ffffff";
    if (theme_colours_json !== undefined) {
        if (theme_colours_json["primary"] !== undefined) primary_color = theme_colours_json["primary"];
        if (theme_colours_json["secondary"] !== undefined) secondary_color = theme_colours_json["secondary"];
        if (theme_colours_json["on-primary"] !== undefined) on_primary_color = theme_colours_json["on-primary"];
        if (theme_colours_json["on-secondary"] !== undefined) on_secondary_color = theme_colours_json["on-secondary"];
    }


    restore.style.backgroundImage = `url("data:image/svg+xml;base64,${svg_image_restore}")`;
    restore.style.backgroundColor = secondary_color;
    restore.style.color = on_secondary_color;

    browser.runtime.sendMessage({from: "sticky", data: {sticky: true, minimized: true}});
    restore.onclick = function () {
        browser.runtime.sendMessage({from: "sticky", data: {sticky: true, minimized: false}}).then(result => {
            restore.remove();
            load();
        });
    }
}

function getCSSMinimized(settings_json, icons_json, theme_colours_json) {
    if (icons_json["restore"] === undefined || icons_json["restore"] === "") icons_json["restore"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTU0LjE2Nyw0MDBDNTQuMTY3LDQxMy44MDcgNjUuMzYsNDI1IDc5LjE2Nyw0MjVMNDQ0LjkyLDQyNUwzNzkuNTYzLDQ4MS4wMkMzNjkuMDgsNDkwLjAwMyAzNjcuODY3LDUwNS43ODcgMzc2Ljg1Myw1MTYuMjdDMzg1LjgzNyw1MjYuNzUzIDQwMS42Miw1MjcuOTY3IDQxMi4xMDMsNTE4Ljk4TDUyOC43Nyw0MTguOThDNTM0LjMxLDQxNC4yMzMgNTM3LjUsNDA3LjI5NyA1MzcuNSw0MDBDNTM3LjUsMzkyLjcwMyA1MzQuMzEsMzg1Ljc2NyA1MjguNzcsMzgxLjAyTDQxMi4xMDMsMjgxLjAxOUM0MDEuNjIsMjcyLjAzMyAzODUuODM3LDI3My4yNDcgMzc2Ljg1MywyODMuNzNDMzY3Ljg2NywyOTQuMjEzIDM2OS4wOCwzMDkuOTk2IDM3OS41NjMsMzE4Ljk4MUw0NDQuOTIsMzc1TDc5LjE2NywzNzVDNjUuMzYsMzc1IDU0LjE2NywzODYuMTkzIDU0LjE2Nyw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMzI1LjAwMUwzMjUuMTA5LDMyNS4wMDFDMzE2LjQ5MSwzMDAuNTQ4IDMyMC44MDMsMjcyLjI5MiAzMzguODksMjUxLjE5MkMzNjUuODQ3LDIxOS43NDMgNDEzLjE5MywyMTYuMSA0NDQuNjQzLDI0My4wNTdMNTYxLjMxLDM0My4wNTdDNTc3LjkzMywzNTcuMzA3IDU4Ny41LDM3OC4xMDcgNTg3LjUsNDAwQzU4Ny41LDQyMS44OTcgNTc3LjkzMyw0NDIuNjk3IDU2MS4zMSw0NTYuOTQ3TDQ0NC42NDMsNTU2Ljk0N0M0MTMuMTkzLDU4My45MDMgMzY1Ljg0Nyw1ODAuMjYgMzM4Ljg5LDU0OC44MUMzMjAuODAzLDUyNy43MSAzMTYuNDkxLDQ5OS40NTMgMzI1LjEwOSw0NzVMMzEyLjUsNDc1TDMxMi41LDUzMy4zMzNDMzEyLjUsNjI3LjYxMyAzMTIuNSw2NzQuNzUzIDM0MS43OSw3MDQuMDQzQzM3MS4wOCw3MzMuMzMzIDQxOC4yMiw3MzMuMzMzIDUxMi41LDczMy4zMzNMNTQ1LjgzMyw3MzMuMzMzQzY0MC4xMTMsNzMzLjMzMyA2ODcuMjUzLDczMy4zMzMgNzE2LjU0Myw3MDQuMDQzQzc0NS44MzMsNjc0Ljc1MyA3NDUuODMzLDYyNy42MTMgNzQ1LjgzMyw1MzMuMzMzTDc0NS44MzMsMjY2LjY2N0M3NDUuODMzLDE3Mi4zODYgNzQ1LjgzMywxMjUuMjQ1IDcxNi41NDMsOTUuOTU2QzY4Ny4yNTMsNjYuNjY3IDY0MC4xMTMsNjYuNjY3IDU0NS44MzMsNjYuNjY3TDUxMi41LDY2LjY2N0M0MTguMjIsNjYuNjY3IDM3MS4wOCw2Ni42NjcgMzQxLjc5LDk1Ljk1NkMzMTIuNSwxMjUuMjQ1IDMxMi41LDE3Mi4zODYgMzEyLjUsMjY2LjY2N0wzMTIuNSwzMjUuMDAxWiIgc3R5bGU9ImZpbGw6d2hpdGU7ZmlsbC1ydWxlOm5vbnplcm87Ii8+CiAgICA8L2c+Cjwvc3ZnPgo=`;
    let svg_image_restore = icons_json["restore"];

    let primary_color = "#fffd7d";
    let secondary_color = "#ff6200";
    let on_primary_color = "#111111";
    let on_secondary_color = "#ffffff";
    if (theme_colours_json !== undefined) {
        if (theme_colours_json["primary"] !== undefined) primary_color = theme_colours_json["primary"];
        if (theme_colours_json["secondary"] !== undefined) secondary_color = theme_colours_json["secondary"];
        if (theme_colours_json["on-primary"] !== undefined) on_primary_color = theme_colours_json["on-primary"];
        if (theme_colours_json["on-secondary"] !== undefined) on_secondary_color = theme_colours_json["on-secondary"];
    }

    return `
            #restore--sticky-notes-notefox-addon {
                position: fixed;
                height: 80px;
                width: 20px;
                z-index: 99999999999;
                top: 15%;
                left: 0px;
                right: auto;
                background-image: url('data:image/svg+xml;base64,${svg_image_restore}');
                background-size: 70% auto;
                border-radius: 0px 15px 15px 0px;
                opacity: 0.2;
                background-repeat: no-repeat;
                background-position: center center;
                background-color: ${secondary_color};
                border: 0px solid transparent;
                color: ${on_secondary_color};
                cursor: pointer;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
                box-shadow: 0px 0px 5px #fff;
                transition: 0.5s;
                font-size: 8px;
                
                min-width: 0px;
                min-height: 0px;
                line-height: normal;
            }
            #restore--sticky-notes-notefox-addon:active, #restore--sticky-notes-notefox-addon:focus {
                box-shadow: 0px 0px 0px 2px #ff6200, 0px 0px 0px 5px #ffb788;
            }
            #restore--sticky-notes-notefox-addon:hover {
                opacity: 1;
                /*height: 80px;*/
                width: 30px;
                box-shadow: 0px 0px 5px #fff;
            }
            @media screen and (max-width: 800px) {
                /*Mobile*/
                #restore--sticky-notes-notefox-addon {
                    top: 10%;
                    height: 150px;
                    width: 40px !important;
                    opacity: 0.7 !important;
                }
                
                #restore--sticky-notes-notefox-addon:hover {
                    opacity: 1;
                    width: 50px;
                }
            }
            `;
}