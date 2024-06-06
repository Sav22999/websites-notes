load();

function load() {
    if (document.getElementById("sticky-notes-notefox-addon") && !document.getElementById("restore--sticky-notes-notefox-addon")) {
        //already exists || update elements
        alreadyExists();
    } else if (document.getElementById("sticky-notes-notefox-addon") && document.getElementById("restore--sticky-notes-notefox-addon")) {
        //it's exists as minimized
        openMinimized();
    } else {
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
            //console.log("get3 || " + JSON.stringify(response.websites));
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
            createNew(notes, x, y, w, h, opacity, response.websites, response.settings, response.icons, response.theme_colours);
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

                if (response.notes !== undefined && response.notes.sticky_params.coords !== undefined) {
                    stickyNotes.style.left = checkCorrectNumber(response.notes.sticky_params.coords.x, "20px");
                    stickyNotes.style.top = checkCorrectNumber(response.notes.sticky_params.coords.y, "20px");
                }
                if (response.notes !== undefined && response.notes.sticky_params.sizes !== undefined) {
                    stickyNotes.style.width = checkCorrectNumber(response.notes.sticky_params.sizes.w, "300px");
                    stickyNotes.style.height = checkCorrectNumber(response.notes.sticky_params.sizes.h, "300px");
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
                checkFontFamily(text, response.settings);
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
function createNew(notes, x = "10px", y = "10px", w = "200px", h = "300px", opacity = 0.8, websites_json, settings_json, icons_json, theme_colours_json) {
    if (!document.getElementById("sticky-notes-notefox-addon")) {
        let css = document.createElement("style");
        css.innerText = getCSS(notes, x, y, w, h, opacity, websites_json, settings_json, icons_json, theme_colours_json);
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

function checkFontFamily(text, settings_json) {
    if (settings_json["font-family"] === undefined || (settings_json["font-family"] !== "Shantell Sans" && settings_json["font-family"] !== "Open Sans")) settings_json["font-family"] = "Shantell Sans";
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

function getCSS(notes, x = "10px", y = "10px", w = "200px", h = "300px", opacity = 0.8, websites_json, settings_json, icons_json, theme_colours_json) {
    if (icons_json === undefined) icons_json = {};

    if (icons_json["close"] === undefined) icons_json["close"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMTIgMTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik05LjI1OSw4My4zMzNjMCwtOC43MjkgMCwtMTMuMDk0IDIuNzEyLC0xNS44MDdjMi43MTIsLTIuNzEyIDcuMDc3LC0yLjcxMiAxNS44MDcsLTIuNzEyYzguNzMsMCAxMy4wOTUsMCAxNS44MDcsMi43MTJjMi43MTIsMi43MTIgMi43MTIsNy4wNzcgMi43MTIsMTUuODA3YzAsOC43MyAwLDEzLjA5NSAtMi43MTIsMTUuODA3Yy0yLjcxMiwyLjcxMiAtNy4wNzcsMi43MTIgLTE1LjgwNywyLjcxMmMtOC43MywwIC0xMy4wOTQsMCAtMTUuODA3LC0yLjcxMmMtMi43MTIsLTIuNzEyIC0yLjcxMiwtNy4wNzcgLTIuNzEyLC0xNS44MDdaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PHBhdGggZD0iTTE2LjAzOSwxNi4wMzljLTYuNzgsNi43OCAtNi43OCwxNy42OTIgLTYuNzgsMzkuNTE3YzAsMS44MzEgMCwzLjU4NiAwLjAwNCw1LjI2N2MyLjM1MiwtMS41NDIgNC45NDQsLTIuMjE3IDcuNDI5LC0yLjU1MmMyLjk4OSwtMC40MDIgNi42NjQsLTAuNDAxIDEwLjY3MSwtMC40MDFsMC44MjksMGM0LjAwNywtMCA3LjY4MiwtMC4wMDEgMTAuNjcxLDAuNDAxYzMuMjkxLDAuNDQzIDYuNzcsMS40ODQgOS42MzIsNC4zNDVjMi44NjEsMi44NjIgMy45MDIsNi4zNDEgNC4zNDUsOS42MzJjMC40MDEsMi45ODkgMC40MDEsNi42NjQgMC40LDEwLjY3MWwwLDAuODI5YzAuMDAxLDQuMDA4IDAuMDAxLDcuNjgyIC0wLjQsMTAuNjdjLTAuMzM1LDIuNDg2IC0xLjAxLDUuMDc3IC0yLjU1Miw3LjQzYzEuNjgyLDAuMDA0IDMuNDM2LDAuMDA0IDUuMjY3LDAuMDA0YzIxLjgyNCwtMCAzMi43MzYsLTAgMzkuNTE3LC02Ljc4YzYuNzgsLTYuNzggNi43OCwtMTcuNjkyIDYuNzgsLTM5LjUxN2MtMCwtMjEuODI1IC0wLC0zMi43MzYgLTYuNzgsLTM5LjUxN2MtNi43OCwtNi43NzkgLTE3LjY5MiwtNi43NzkgLTM5LjUxNywtNi43NzljLTIxLjgyNSwtMCAtMzIuNzM2LC0wIC0zOS41MTYsNi43NzlsLTAsMC4wMDFabTQ1LjMwMywxMi44OTZjLTEuOTE4LC0wIC0zLjQ3MywxLjU1NCAtMy40NzMsMy40NzJjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MywzLjQ3Mmw4Ljk3OCwwbC0xNy4yMjEsMTcuMjIxYy0xLjM1NiwxLjM1NiAtMS4zNTYsMy41NTQgMCw0LjkxYzEuMzU2LDEuMzU2IDMuNTU0LDEuMzU2IDQuOTEsMGwxNy4yMjEsLTE3LjIybDAsOC45NzhjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MiwzLjQ3MmMxLjkxOCwwIDMuNDczLC0xLjU1NCAzLjQ3MywtMy40NzJsLTAsLTE3LjM2MWMtMCwtMS45MTggLTEuNTU1LC0zLjQ3MiAtMy40NzMsLTMuNDcybC0xNy4zNjEsLTBsMC4wMDEsLTBaIiBzdHlsZT0iZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PC9zdmc+`;
    let svg_image_close = icons_json["close"];

    if (icons_json["minimize"] === undefined) icons_json["minimize"] = `PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+Cjxzdmcgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgdmlld0JveD0iMCAwIDMzNCAzMzQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgeG1sbnM6c2VyaWY9Imh0dHA6Ly93d3cuc2VyaWYuY29tLyIgc3R5bGU9ImZpbGwtcnVsZTpldmVub2RkO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDoyOyI+CiAgICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgwLjQxNjY2NywwLDAsMC40MTY2NjcsMCwwKSI+CiAgICAgICAgPHBhdGggZD0iTTUzNy41LDQwMEM1MzcuNSwzODYuMTkzIDUyNi4zMDcsMzc1IDUxMi41LDM3NUwxNDYuNzQ4LDM3NUwyMTIuMTAzLDMxOC45ODFDMjIyLjU4NiwzMDkuOTk2IDIyMy44LDI5NC4yMTMgMjE0LjgxNSwyODMuNzNDMjA1LjgyOSwyNzMuMjQ3IDE5MC4wNDcsMjcyLjAzMyAxNzkuNTY0LDI4MS4wMTlMNjIuODk3LDM4MS4wMkM1Ny4zNTYsMzg1Ljc2NyA1NC4xNjcsMzkyLjcwMyA1NC4xNjcsNDAwQzU0LjE2Nyw0MDcuMjk3IDU3LjM1Niw0MTQuMjMzIDYyLjg5Nyw0MTguOThMMTc5LjU2NCw1MTguOThDMTkwLjA0Nyw1MjcuOTY3IDIwNS44MjksNTI2Ljc1MyAyMTQuODE1LDUxNi4yN0MyMjMuOCw1MDUuNzg3IDIyMi41ODYsNDkwLjAwMyAyMTIuMTAzLDQ4MS4wMkwxNDYuNzQ4LDQyNUw1MTIuNSw0MjVDNTI2LjMwNyw0MjUgNTM3LjUsNDEzLjgwNyA1MzcuNSw0MDBaIiBzdHlsZT0iZmlsbDp3aGl0ZTsiLz4KICAgICAgICA8cGF0aCBkPSJNMzEyLjUsMjY2LjY2N0MzMTIuNSwyOTAuMDczIDMxMi41LDMwMS43NzYgMzE4LjExNywzMTAuMTgzQzMyMC41NDksMzEzLjgyNCAzMjMuNjc1LDMxNi45NDkgMzI3LjMxNSwzMTkuMzgyQzMzNS43MjMsMzI0Ljk5OSAzNDcuNDI3LDMyNC45OTkgMzcwLjgzMywzMjQuOTk5TDUxMi41LDMyNC45OTlDNTUzLjkyLDMyNC45OTkgNTg3LjUsMzU4LjU3NyA1ODcuNSw0MDBDNTg3LjUsNDQxLjQyIDU1My45Miw0NzUgNTEyLjUsNDc1TDM3MC44MzMsNDc1QzM0Ny40MjcsNDc1IDMzNS43Miw0NzUgMzI3LjMxMyw0ODAuNjE3QzMyMy42NzQsNDgzLjA1IDMyMC41NSw0ODYuMTczIDMxOC4xMTgsNDg5LjgxM0MzMTIuNSw0OTguMjIgMzEyLjUsNTA5LjkyMyAzMTIuNSw1MzMuMzMzQzMxMi41LDYyNy42MTMgMzEyLjUsNjc0Ljc1MyAzNDEuNzksNzA0LjA0M0MzNzEuMDgsNzMzLjMzMyA0MTguMjEzLDczMy4zMzMgNTEyLjQ5Myw3MzMuMzMzTDU0NS44MjcsNzMzLjMzM0M2NDAuMTA3LDczMy4zMzMgNjg3LjI0Nyw3MzMuMzMzIDcxNi41MzcsNzA0LjA0M0M3NDUuODI3LDY3NC43NTMgNzQ1LjgyNyw2MjcuNjEzIDc0NS44MjcsNTMzLjMzM0w3NDUuODI3LDI2Ni42NjdDNzQ1LjgyNywxNzIuMzg2IDc0NS44MjcsMTI1LjI0NSA3MTYuNTM3LDk1Ljk1NkM2ODcuMjQ3LDY2LjY2NyA2NDAuMTA3LDY2LjY2NyA1NDUuODI3LDY2LjY2N0w1MTIuNDkzLDY2LjY2N0M0MTguMjEzLDY2LjY2NyAzNzEuMDgsNjYuNjY3IDM0MS43OSw5NS45NTZDMzEyLjUsMTI1LjI0NSAzMTIuNSwxNzIuMzg2IDMxMi41LDI2Ni42NjdaIiBzdHlsZT0iZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVybzsiLz4KICAgIDwvZz4KPC9zdmc+Cg==`;
    let svg_image_minimize = icons_json["minimize"];

    let svg_background_image = window.btoa(`<svg clip-rule="evenodd" fill-rule="evenodd" fill-opacity="0.2" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="1.5" viewBox="0 0 130 36" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(.00306122378 0 0 -.00306122378 -2.77494114441 9.81010373075)"><path d="m9707.7 2169.4s-6090.16 92.74-7185.53-7.72c-98.34-9.02-165.62-36.85-200.72-157.27-36.7-125.93-71.65-1344.851-71.65-2121.81 0-1642.9.1-5472.2.1-6283.3 0-521.82 47.55-938.91 67.64-1059.29 12.9-77.33 103.76-69.41 103.76-69.41h2165.5c1843.6 0 4448.77-87.86 4978.51 38.41 162.21 38.67 195.61 119.92 218.56 269.92 81.41 532.15 116.13 4382.27 116.13 6213.27v2997.4c1.78 120.38-65.83 173.61-192.3 179.8z" fill="#00a81c"/><path d="m2421.3-7856.07c-84.23.76-375.86 42.01-425.97 342.3-21.11 126.5-72.1 564.73-72.1 1113.07 0 811.1-.1 4640.4-.1 6283.3 0 810.558 46.42 2081.83 84.71 2213.21 44.42 152.43 119.81 239.24 204.62 297.81 76.36 52.73 167.79 83.08 279.88 93.36 1100.67 100.95 7220.33 9.05 7220.33 9.05 3.67-.06 7.33-.17 10.99-.35 154.2-7.55 267.13-59.11 346.34-130.14 94.1-84.32 158.2-203.38 156.7-376.75v-2996.59c0-1845.57-37.9-5726.28-119.9-6262.67-26.9-175.54-80.5-294.72-171.86-384.74-66.31-65.3-156.17-120.71-293.88-153.54-537.82-128.2-3182.58-47.32-5054.26-47.32l-2155.16.22c-3.37-.1-6.82-.17-10.34-.22v326.67h2165.5c1843.6 0 4448.77-87.86 4978.51 38.41 162.21 38.67 195.61 119.92 218.56 269.92 81.41 532.15 116.13 4382.27 116.13 6213.27v2997.4c1.78 120.38-65.83 173.61-192.3 179.8 0 0-6090.16 92.74-7185.53-7.72-98.34-9.02-165.62-36.85-200.72-157.27-36.7-125.93-71.65-1344.851-71.65-2121.81 0-1642.9.1-5472.2.1-6283.3 0-339.58 20.14-634.81 39.74-832.78-206.25-129.23 131.66-622.59 131.66-622.59z" fill="#fff"/></g><g transform="matrix(-.00298629726 0 0 .00301277685 32.18641396324 22.83171824339)"><path d="m2963.46-2483.19c-1459-903-2833.06-1555.51-2845.66-1568.01-12.5-8.4-20.9-150.5-16.7-313.5 4.2-518.4 259.2-915.5 735.8-1153.8l250.8-125.4s1441.72 1105.65 2740.07 1903.06l2602.53 1403.74s786.98 1402.593 654.6 1522.032c-111.3 100.42-1323.54-3.057-1624.5-33.832-7.4-.756-830.59-602.96-2496.94-1634.29z" fill="#00361c"/><path d="m-88.819-3791.8c20.985 15.41 53.315 36.5 98.672 59.27 242.629 121.8 1475.407 725.77 2776.257 1530.88 1490.26 922.35 2301.9 1499.26 2454.68 1605.973 106.02 74.055 180.66 76.475 185.25 76.944 250.06 25.571 1105.97 97.767 1497.48 72.902 205.08-13.024 338.35-80.072 386.79-123.779 57.84-52.186 109.54-130.019 121.86-245.257 7.05-65.914-3.39-172.909-45.15-304.183-139.81-439.45-664.07-1379.38-664.07-1379.38-30.85-54.98-76.84-100.15-132.59-130.22 0 0-2594.1-1399.19-2596.39-1400.59-1282.22-788.65-2701.36-1877.18-2701.36-1877.18-102.09-78.29-240.48-91.45-355.725-33.83l-250.8 125.4c-596.439 298.22-913.645 796.33-919.813 1444.64-4.916 200.63 16.381 376.94 30.67 418.85 34.534 101.3 95.718 149.87 132.949 174.89zm3052.279 1308.61c-1459-903-2833.06-1555.51-2845.66-1568.01-12.5-8.4-20.9-150.5-16.7-313.5 4.2-518.4 259.2-915.5 735.8-1153.8l250.8-125.4s1441.72 1105.65 2740.07 1903.06l2602.53 1403.74s786.98 1402.593 654.6 1522.032c-111.3 100.42-1323.54-3.057-1624.5-33.832-7.4-.756-830.59-602.96-2496.94-1634.29z" fill="#fff"/></g><g fill="none"><path d="m7.025 7.976c0-.101.094-.179.141-.269.161-.31.37-.609.552-.905.018-.03.099-.207.155-.254.033-.029.099-.129.099-.085 0 .663.085 1.316.085 1.98v.848c0 .034.008.244.085.184.497-.387.934-1.068 1.485-1.343.051-.026.101.058.141.099.131.13.273.268.467.311.222.049.227-.22.368-.255.276-.069.56.183.863.085.467-.151.764-.459 1.145-.75.062-.047.257-.248.382-.198.126.051.154.158.241.241.235.224.52.479.778.65.104.07.356-.292.41-.339.324-.28.714-.51 1.131-.608.093-.022.204-.095.283-.043.114.076.111.289.141.411.058.231.284.874.621.916.699.088 1.131-.902 1.77-1.044.316-.07.47.583.778.651.186.041.354-.093.537-.113.317-.035.644.014.962.014" stroke="#fff" transform="matrix(.9999996 0 0 .9999996 .00000060448 -.00000027817)"/><path d="m6.756 14.921c.077-.052.038-.153.042-.241.012-.217.022-.434.043-.651.037-.4.129-.824.356-1.164.057-.086.204-.279.323-.292.756-.088.758.772 1.159 1.174.1.099.641-.158.708-.17.193-.035.251.258.452.325.322.108 1.007.061 1.287-.014.215-.058.526-.166.679-.339.066-.075.073-.31.156-.255.394.263 1.232.536 1.626.339" stroke="#fff" transform="matrix(.9999996 0 0 .9999996 .00000060448 -.00000027817)"/><path d="m32.99998740448 5.99999732183h19.999992v15.9999936h-19.999992z" stroke-width=".9999996"/></g><g fill="#00a81c" fill-rule="nonzero" transform="matrix(1.31431614094 0 0 .60803309012 -7.37236477991 6.44736380955)"><path d="m35.29 34.551c-.377 0-.656-.212-.835-.636-.179-.423-.268-.985-.268-1.685 0-.542.027-1.082.082-1.618.055-.537.12-1.204.196-2.002.075-.797.14-1.84.195-3.129.055-1.29.082-2.95.082-4.982 0-1.131-.015-2.309-.045-3.533-.031-1.223-.064-2.394-.101-3.513-.036-1.118-.07-2.092-.1-2.92-.031-.829-.046-1.402-.046-1.717 0-.79.103-1.461.31-2.014.207-.552.512-.828.913-.828.509 0 .984.3 1.425.899.44.6.851 1.419 1.232 2.456s.74 2.209 1.078 3.517c.337 1.307.658 2.665.964 4.073.305 1.408.603 2.795.894 4.16.291 1.366.577 2.627.859 3.782.281 1.155.567 2.125.858 2.909s.59 1.302.897 1.555l-1.253 1.279c.161-.321.31-.699.449-1.133s.251-1.013.336-1.737.128-1.675.128-2.854c0-1.568-.021-3.073-.064-4.515s-.076-2.84-.1-4.192c-.025-1.353-.02-2.672.012-3.959.033-1.287.121-2.575.265-3.864.105-.868.241-1.488.409-1.859s.393-.557.676-.557c.37 0 .651.215.843.643.193.429.318.942.377 1.54.058.597.059 1.17.003 1.717-.122 1.263-.197 2.465-.226 3.607s-.035 2.277-.018 3.403.039 2.307.067 3.541.042 2.588.042 4.061c0 1.953-.054 3.691-.163 5.214-.108 1.524-.328 2.721-.66 3.592-.333.871-.831 1.307-1.496 1.307-.477 0-.905-.267-1.284-.801-.378-.535-.726-1.272-1.042-2.211-.317-.939-.615-2.015-.895-3.229-.28-1.213-.557-2.506-.831-3.88-.274-1.373-.562-2.768-.864-4.184-.301-1.415-.628-2.784-.98-4.105s-.748-2.529-1.189-3.623l.42-.206c.078 1.2.134 2.265.17 3.194.035.929.061 1.791.078 2.585.017.795.026 1.595.026 2.4 0 2.474-.051 4.718-.153 6.734-.103 2.016-.26 3.795-.472 5.336-.07.611-.205 1.094-.405 1.449s-.465.533-.796.533z"/><path d="m52.568 34.472c-1.013 0-1.912-.449-2.699-1.346-.786-.897-1.404-2.138-1.852-3.722s-.672-3.395-.672-5.431c0-1.384.131-2.688.393-3.912.262-1.223.6-2.305 1.015-3.244.415-.94.861-1.676 1.337-2.207.476-.532.925-.798 1.346-.798.185 0 .355.062.509.186.155.124.28.316.375.576.094.261.142.615.142 1.062 0 .8-.077 1.508-.23 2.124-.154.616-.465 1.118-.935 1.507-.309.337-.579.745-.809 1.224s-.41 1.02-.541 1.622c-.13.603-.195 1.241-.195 1.915 0 1.711.247 3.085.741 4.125.495 1.039 1.161 1.559 1.998 1.559.704 0 1.275-.529 1.713-1.587s.657-2.463.657-4.215c0-1.558-.187-2.794-.562-3.707s-.874-1.37-1.497-1.37c-.319 0-.58.158-.782.474s-.425.737-.668 1.263c-.18.389-.329.717-.448.983-.118.266-.236.466-.356.6-.119.134-.269.201-.449.201-.202 0-.375-.159-.52-.477-.145-.319-.218-.912-.218-1.781 0-.699.093-1.411.278-2.135.185-.723.431-1.384.738-1.981.306-.598.65-1.081 1.03-1.449.379-.369.766-.553 1.161-.553.979 0 1.817.402 2.514 1.204.698.803 1.232 1.938 1.604 3.407.371 1.468.556 3.21.556 5.226 0 2.015-.205 3.828-.617 5.439-.411 1.61-.967 2.883-1.669 3.817-.701.934-1.497 1.401-2.388 1.401z"/><path d="m62.556 34.511c-1.027 0-1.852-.494-2.476-1.484-.623-.989-1.072-2.379-1.346-4.168-.273-1.789-.41-3.865-.41-6.228 0-1.353.031-2.564.093-3.632s.127-2.09.195-3.067c.068-.976.115-2.001.139-3.074.029-1.148.033-2.079.011-2.795s-.026-1.395-.011-2.037c.01-.558.095-1.053.257-1.484.162-.432.425-.647.788-.647.501 0 .87.476 1.106 1.429.236.952.33 2.508.281 4.665-.029.858-.069 1.676-.12 2.455-.052.779-.104 1.567-.157 2.365-.054.797-.1 1.649-.139 2.557s-.059 1.928-.059 3.059c0 1.737.079 3.118.238 4.145.158 1.026.393 1.758.706 2.194.313.437.702.656 1.167.656.29 0 .52-.062.691-.186.17-.123.32-.244.449-.363.129-.118.276-.177.442-.177.25 0 .442.163.573.489.132.326.197.816.197 1.468 0 1.053-.209 1.959-.628 2.72-.419.76-1.081 1.14-1.987 1.14zm-2.052-14.367c-.443.405-.786.401-1.028-.012s-.364-1.009-.364-1.788c0-.695.066-1.318.198-1.871.131-.553.46-1.037.986-1.452.477-.385 1.01-.693 1.597-.924.588-.232 1.144-.348 1.668-.348.589 0 1.007.249 1.254.746.247.498.371 1.136.371 1.915 0 .589-.084 1.042-.25 1.358-.167.315-.395.5-.685.552-.536.079-1.01.192-1.423.34-.412.147-.8.339-1.163.576s-.75.539-1.161.908z"/><path d="m69.408 34.393c-1.018 0-1.85-.375-2.496-1.125-.647-.75-1.123-1.776-1.428-3.079-.306-1.302-.459-2.796-.459-4.48 0-1.394.121-2.796.362-4.203.241-1.408.587-2.698 1.037-3.869.451-1.171.992-2.111 1.625-2.822.633-.71 1.342-1.066 2.126-1.066.652 0 1.224.243 1.714.727.491.484.875 1.205 1.153 2.163.277.957.416 2.152.416 3.584 0 1.458-.208 2.671-.623 3.639s-.972 1.695-1.671 2.179c-.698.484-1.474.726-2.326.726-.682 0-1.189-.245-1.521-.734-.332-.49-.499-1.05-.499-1.682 0-.352.039-.616.117-.793.078-.176.21-.264.395-.264.134 0 .295.04.484.122.188.082.451.122.787.122.472 0 .905-.133 1.3-.398.394-.266.714-.636.959-1.11.244-.473.367-1.01.367-1.61 0-.684-.08-1.197-.24-1.539-.159-.342-.426-.513-.801-.513-.412 0-.789.223-1.133.671-.343.447-.641 1.048-.894 1.804-.254.755-.449 1.613-.587 2.573-.137.961-.206 1.954-.206 2.98 0 .721.059 1.354.177 1.899.119.545.315.966.59 1.263s.645.446 1.11.446c.689 0 1.267-.15 1.732-.45.464-.3.853-.646 1.164-1.038.312-.392.581-.738.806-1.038s.442-.45.652-.45c.214 0 .369.143.465.43s.144.722.144 1.307c0 .631-.12 1.281-.361 1.95-.241.668-.577 1.276-1.008 1.823s-.938.993-1.521 1.338-1.219.517-1.908.517z"/><path d="m77.19 34.37c-.433 0-.776-.339-1.03-1.015-.253-.676-.379-1.691-.379-3.043 0-1.205-.014-2.271-.042-3.197-.028-.927-.061-1.78-.099-2.562s-.077-1.55-.119-2.305c-.041-.756-.076-1.553-.104-2.392-.028-.84-.042-1.783-.042-2.83 0-2.021.129-3.83.385-5.428.257-1.597.61-2.963 1.06-4.097.449-1.134.958-2.001 1.526-2.601.569-.6 1.161-.9 1.777-.9.329 0 .63.192.906.576.275.385.412 1.021.412 1.911 0 .526-.063.967-.19 1.322-.126.355-.317.617-.573.785-.635.39-1.149.857-1.541 1.402-.392.544-.688 1.203-.888 1.977-.199.774-.334 1.692-.405 2.756-.071 1.063-.106 2.323-.106 3.78 0 .853.023 1.714.068 2.582.045.869.099 1.793.162 2.775.063.981.118 2.064.163 3.248s.067 2.505.067 3.963c0 1.305-.081 2.18-.244 2.625-.164.445-.418.668-.764.668zm-.201-14.494c-.282 0-.517-.164-.704-.49-.188-.327-.282-.748-.282-1.263 0-.737.092-1.405.276-2.005s.452-1.024.805-1.271c.463-.3.9-.52 1.312-.659.411-.14.81-.21 1.197-.21.292 0 .541.112.747.336.206.223.362.539.468.947s.159.896.159 1.465c0 .463-.063.863-.188 1.199-.126.337-.325.521-.598.553-.54.063-.987.171-1.34.324-.353.152-.641.309-.864.469-.222.161-.409.302-.56.423s-.294.182-.428.182z"/><path d="m86.021 34.472c-1.013 0-1.912-.449-2.699-1.346-.786-.897-1.403-2.138-1.851-3.722s-.673-3.395-.673-5.431c0-1.384.131-2.688.393-3.912.262-1.223.6-2.305 1.015-3.244.416-.94.861-1.676 1.337-2.207.476-.532.925-.798 1.346-.798.185 0 .355.062.509.186.155.124.28.316.375.576.095.261.142.615.142 1.062 0 .8-.077 1.508-.23 2.124s-.465 1.118-.935 1.507c-.309.337-.579.745-.809 1.224s-.41 1.02-.54 1.622c-.131.603-.196 1.241-.196 1.915 0 1.711.247 3.085.742 4.125.494 1.039 1.16 1.559 1.998 1.559.703 0 1.274-.529 1.712-1.587.439-1.058.658-2.463.658-4.215 0-1.558-.188-2.794-.563-3.707s-.874-1.37-1.497-1.37c-.319 0-.58.158-.782.474s-.425.737-.668 1.263c-.18.389-.329.717-.447.983-.119.266-.237.466-.357.6-.119.134-.268.201-.449.201-.202 0-.375-.159-.52-.477-.145-.319-.217-.912-.217-1.781 0-.699.092-1.411.277-2.135.185-.723.431-1.384.738-1.981.307-.598.65-1.081 1.03-1.449.38-.369.767-.553 1.161-.553.979 0 1.817.402 2.515 1.204.697.803 1.231 1.938 1.603 3.407.371 1.468.557 3.21.557 5.226 0 2.015-.206 3.828-.617 5.439-.412 1.61-.968 2.883-1.669 3.817-.702.934-1.498 1.401-2.389 1.401z"/><path d="m92.306 34.606c-.229 0-.42-.131-.575-.394s-.246-.671-.276-1.224c-.029-.552.027-1.255.169-2.108.146-.947.387-2.055.724-3.323.338-1.268.757-2.605 1.259-4.011.501-1.405 1.068-2.792 1.701-4.16s1.313-2.618 2.038-3.75c.307-.505.578-.896.815-1.172.236-.277.449-.47.639-.58.19-.111.363-.166.518-.166.288 0 .529.211.725.632s.294 1.031.294 1.831c0 .552-.064 1.022-.193 1.409s-.311.733-.544 1.038c-.826 1.063-1.597 2.337-2.312 3.821-.716 1.484-1.376 3.096-1.98 4.835-.604 1.74-1.16 3.514-1.669 5.325-.209.726-.423 1.241-.641 1.544-.218.302-.448.453-.692.453zm7.009-.055c-.263 0-.509-.145-.736-.434-.228-.29-.47-.845-.725-1.666-.343-1.089-.741-2.247-1.194-3.473-.453-1.227-.93-2.438-1.432-3.636-.502-1.197-.999-2.323-1.494-3.378-.494-1.056-.958-1.962-1.391-2.72-.3-.526-.536-1.016-.709-1.468-.173-.453-.259-1.016-.259-1.69 0-.663.081-1.221.243-1.674.162-.452.399-.679.71-.679.244 0 .471.123.683.368s.497.688.855 1.33c.251.452.568 1.089.951 1.91.384.821.795 1.742 1.235 2.763.439 1.021.875 2.067 1.309 3.138.433 1.071.836 2.086 1.207 3.044.371.957.67 1.786.896 2.486.368 1.121.604 1.975.709 2.562s.157 1.064.157 1.433c0 .568-.091 1.008-.272 1.318-.182.311-.429.466-.743.466z"/></g></svg>`);

    if (settings_json["font-family"] === undefined || (settings_json["font-family"] !== "Shantell Sans" && settings_json["font-family"] !== "Open Sans")) settings_json["font-family"] = "Shantell Sans";
    let font_family = settings_json["font-family"];

    if (settings_json["immersive-sticky-notes"] === undefined) settings_json["immersive-sticky-notes"] = true;
    let immersive_sticky_notes = settings_json["immersive-sticky-notes"];

    let visibility_immersive = "hidden";
    if(!immersive_sticky_notes) visibility_immersive = "visible";

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
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&family=Source+Code+Pro:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap&family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap');
            
            #sticky-notes-notefox-addon {
                position: fixed;
                top: ${y};
                left:  ${x};
                width: ${w};
                height:  ${h};
                background-color: ${primary_color};
                opacity: ${opacity};
                z-index: 99999999999;
                padding: 15px !important;
                margin: 0px !important;
                box-sizing: border-box !important;
                border-radius: 10px;
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
                width: 10px;
                height: 10px;
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
            #resize--sticky-notes-notefox-addon:before{
                cursor: nwse-resize;
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                border-top: 10px solid transparent;
                border-right-width: 10px;
                border-right-style: solid;
                border-right-color: inherit;
                width: 0;
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
                border-radius: 10px;
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
                font-weight: bolder;
            }
            
            #text--sticky-notes-notefox-addon i, #text--sticky-notes-notefox-addon em, #text--sticky-notes-notefox-addon cite, #text--sticky-notes-notefox-addon q, #text--sticky-notes-notefox-addon blockquote {
                font-style: italic;
            }
            
            #text--sticky-notes-notefox-addon code, #text--sticky-notes-notefox-addon pre {
                font-family: 'Source Code Pro', monospace;
            }
            
            #text--sticky-notes-notefox-addon h1 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 2em !important;
            }
            
            #text--sticky-notes-notefox-addon h2 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 1.7em !important;
            }
            
            #text--sticky-notes-notefox-addon h3 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 1.4em !important;
            }
            
            #text--sticky-notes-notefox-addon h4 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 1.1em !important;
            }
            
            #text--sticky-notes-notefox-addon h5 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 0.85em !important;
            }
            
            #text--sticky-notes-notefox-addon h6 {
                font-family: inherit;
                font-weight: bolder;
                font-size: 0.7em !important;
            }
            
            #text--sticky-notes-notefox-addon big {
                font-size: 1.5em !important;
            }
            
            #text--sticky-notes-notefox-addon small, #text--sticky-notes-notefox-addon sup, #text--sticky-notes-notefox-addon sub {
                font-size: 0.7em !important;
            }
            
            #text--sticky-notes-notefox-addon img {
                border-radius: 5px;
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
                background-size: auto 70%;
                background-repeat: no-repeat;
                background-position: center center;
                background-color: ${secondary_color};
                border: 0px solid transparent;
                color: ${on_secondary_color};
                z-index: 5;
                border-radius: 10px;
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
                right: 8px !important;
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
                border-radius: 10px;
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
                z-index: 2;
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
    }
}

function onPasteText(text, e) {
    if (((e.originalEvent || e).clipboardData).getData("text/html") !== "") {
        e.preventDefault(); // Prevent the default paste action
        let clipboardData = (e.originalEvent || e).clipboardData;
        let pastedText = clipboardData.getData("text/html");
        let sanitizedHTML = sanitizeHTML(pastedText)
        document.execCommand("insertHTML", false, sanitizedHTML);
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
    if (allowedTags === -1) allowedTags = ["b", "i", "u", "a", "strike", "code", "span", "div", "img", "br", "h1", "h2", "h3", "h4", "h5", "h6", "p", "small", "big", "em", "strong", "s", "sub", "sup", "blockquote", "q"];
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
                border-radius: 0px 10px 10px 0px;
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
                height: 80px;
                width: 30px;
                box-shadow: 0px 0px 5px #fff;
            }`;
}