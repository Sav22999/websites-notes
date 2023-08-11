load();

function load() {
    if (document.getElementById("sticky-notes-notefox-addon")) {
        //already exists || update elements
        alreadyExists();
    } else {
        //create new
        browser.runtime.sendMessage({from: "sticky", ask: "coords-sizes-opacity"}, (response) => {
            let x = "20px";
            let y = "20px";
            let w = "300px";
            let h = "300x";
            let opacity = 0.7;

            if (response !== undefined) {
                if (response.coords !== undefined && response.coords.x !== undefined) {
                    x = response.coords.x;
                }
                if (response.coords !== undefined && response.coords.y !== undefined) {
                    y = response.coords.y;
                }
                if (response.sizes !== undefined && response.sizes.w !== undefined) {
                    w = response.sizes.w;
                }
                if (response.sizes !== undefined && response.sizes.h !== undefined) {
                    h = response.sizes.h;
                }
                if (response.opacity !== undefined && response.opacity.value !== undefined) {
                    opacity = response.opacity.value;
                }
            }
            createNewDescription(x, y, w, h, opacity);
        });
    }
}

function createNewDescription(x, y, w, h, opacity) {
    browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
        if (response !== undefined) {
            let notes = {description: "", url: "", tag_colour: "", website: {}, type: "page"};
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

            //reset opened by "page" or "domain"
            createNew(notes, x, y, w, h, opacity, response.websites);
        }
    });
}

function updateStickyNotes() {
    if (document.getElementById("text--sticky-notes-notefox-addon")) {
        //double check already exists

        let stickyNotes = document.getElementById("sticky-notes-notefox-addon");
        let text = document.getElementById("text--sticky-notes-notefox-addon");
        let tag = document.getElementById("tag--sticky-notes-notefox-addon");
        let slider = document.getElementById("slider--sticky-notes-notefox-addon");

        browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
            if (response !== undefined) {
                let new_text = "";
                if (response.notes !== undefined && response.notes.description !== undefined) new_text = response.notes.description;
                text.innerText = new_text

                let new_tag = "";
                if (response.notes !== undefined && response.notes.tag_colour !== undefined) new_tag = response.notes.tag_colour;
                if (new_tag === "none") new_tag = "transparent";
                tag.style.backgroundColor = new_tag;

                if (response.notes !== undefined && response.notes.sticky_params.coords !== undefined) {
                    stickyNotes.style.left = response.notes.sticky_params.coords.x;
                    stickyNotes.style.top = response.notes.sticky_params.coords.y;
                }
                if (response.notes !== undefined && response.notes.sticky_params.sizes !== undefined) {
                    stickyNotes.style.width = response.notes.sticky_params.sizes.w;
                    stickyNotes.style.height = response.notes.sticky_params.sizes.h;
                }
                if (response.notes !== undefined && response.notes.sticky_params.opacity !== undefined) {
                    //stickyNotes.style.opacity = response.notes.sticky_params.opacity.value;
                    //slider.value = (response.notes.sticky_params.opacity.value * 100);
                    setSlider(slider, stickyNotes, response.notes.sticky_params.opacity.value * 100, false);
                }

                let pageOrDomain = document.getElementById("page-or-domain--sticky-notes-notefox-addon");
                if (response.notes !== undefined && response.notes.url !== undefined && isAPage(response.notes.url)) {
                    //the current url one is a "Page"
                    pageOrDomain.innerText = "Page";
                } else {
                    //the current url one is a "Domain"
                    pageOrDomain.innerText = "Domain";
                }
            }
        });
    }
}

function createNew(notes, x = "10px", y = "10px", w = "200px", h = "300px", opacity = 0.7, websites_json) {
    if (!document.getElementById("sticky-notes-notefox-addon")) {
        let move = document.createElement("div");
        move.id = "move--sticky-notes-notefox-addon";

        let resize = document.createElement("div");
        resize.id = "resize--sticky-notes-notefox-addon";

        let text = document.createElement("div");
        text.id = "text--sticky-notes-notefox-addon";
        text.innerText = notes.description;
        text.contentEditable = true;
        text.oninput = function () {
            browser.runtime.sendMessage({from: "sticky", data: {new_text: text.innerText}});
        }

        let stickyNote = document.createElement("div");
        stickyNote.id = "sticky-notes-notefox-addon";

        let close = document.createElement("input");
        close.type = "button";
        close.id = "close--sticky-notes-notefox-addon";
        close.onclick = function () {
            browser.runtime.sendMessage({from: "sticky", data: {close: true}});
            document.getElementById("sticky-notes-notefox-addon").remove();
        }
        stickyNote.appendChild(close);

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
        stickyNote.appendChild(opacityRangeContainer);

        let pageOrDomain = document.createElement("div");
        pageOrDomain.id = "page-or-domain--sticky-notes-notefox-addon";

        if (isAPage(notes.url)) {
            //the current url one is a "Page"
            pageOrDomain.innerText = "Page";
        } else {
            //the current url one is a "Domain"
            pageOrDomain.innerText = "Domain";
        }
        stickyNote.appendChild(pageOrDomain);

        let svg_image = `base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMTIgMTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik05LjI1OSw4My4zMzNjMCwtOC43MjkgMCwtMTMuMDk0IDIuNzEyLC0xNS44MDdjMi43MTIsLTIuNzEyIDcuMDc3LC0yLjcxMiAxNS44MDcsLTIuNzEyYzguNzMsMCAxMy4wOTUsMCAxNS44MDcsMi43MTJjMi43MTIsMi43MTIgMi43MTIsNy4wNzcgMi43MTIsMTUuODA3YzAsOC43MyAwLDEzLjA5NSAtMi43MTIsMTUuODA3Yy0yLjcxMiwyLjcxMiAtNy4wNzcsMi43MTIgLTE1LjgwNywyLjcxMmMtOC43MywwIC0xMy4wOTQsMCAtMTUuODA3LC0yLjcxMmMtMi43MTIsLTIuNzEyIC0yLjcxMiwtNy4wNzcgLTIuNzEyLC0xNS44MDdaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PHBhdGggZD0iTTE2LjAzOSwxNi4wMzljLTYuNzgsNi43OCAtNi43OCwxNy42OTIgLTYuNzgsMzkuNTE3YzAsMS44MzEgMCwzLjU4NiAwLjAwNCw1LjI2N2MyLjM1MiwtMS41NDIgNC45NDQsLTIuMjE3IDcuNDI5LC0yLjU1MmMyLjk4OSwtMC40MDIgNi42NjQsLTAuNDAxIDEwLjY3MSwtMC40MDFsMC44MjksMGM0LjAwNywtMCA3LjY4MiwtMC4wMDEgMTAuNjcxLDAuNDAxYzMuMjkxLDAuNDQzIDYuNzcsMS40ODQgOS42MzIsNC4zNDVjMi44NjEsMi44NjIgMy45MDIsNi4zNDEgNC4zNDUsOS42MzJjMC40MDEsMi45ODkgMC40MDEsNi42NjQgMC40LDEwLjY3MWwwLDAuODI5YzAuMDAxLDQuMDA4IDAuMDAxLDcuNjgyIC0wLjQsMTAuNjdjLTAuMzM1LDIuNDg2IC0xLjAxLDUuMDc3IC0yLjU1Miw3LjQzYzEuNjgyLDAuMDA0IDMuNDM2LDAuMDA0IDUuMjY3LDAuMDA0YzIxLjgyNCwtMCAzMi43MzYsLTAgMzkuNTE3LC02Ljc4YzYuNzgsLTYuNzggNi43OCwtMTcuNjkyIDYuNzgsLTM5LjUxN2MtMCwtMjEuODI1IC0wLC0zMi43MzYgLTYuNzgsLTM5LjUxN2MtNi43OCwtNi43NzkgLTE3LjY5MiwtNi43NzkgLTM5LjUxNywtNi43NzljLTIxLjgyNSwtMCAtMzIuNzM2LC0wIC0zOS41MTYsNi43NzlsLTAsMC4wMDFabTQ1LjMwMywxMi44OTZjLTEuOTE4LC0wIC0zLjQ3MywxLjU1NCAtMy40NzMsMy40NzJjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MywzLjQ3Mmw4Ljk3OCwwbC0xNy4yMjEsMTcuMjIxYy0xLjM1NiwxLjM1NiAtMS4zNTYsMy41NTQgMCw0LjkxYzEuMzU2LDEuMzU2IDMuNTU0LDEuMzU2IDQuOTEsMGwxNy4yMjEsLTE3LjIybDAsOC45NzhjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MiwzLjQ3MmMxLjkxOCwwIDMuNDczLC0xLjU1NCAzLjQ3MywtMy40NzJsLTAsLTE3LjM2MWMtMCwtMS45MTggLTEuNTU1LC0zLjQ3MiAtMy40NzMsLTMuNDcybC0xNy4zNjEsLTBsMC4wMDEsLTBaIiBzdHlsZT0iZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PC9zdmc+`;
        let svg_background_image = `base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAzOSAxMCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxuczpzZXJpZj0iaHR0cDovL3d3dy5zZXJpZi5jb20vIiBzdHlsZT0iZmlsbC1ydWxlOmV2ZW5vZGQ7Y2xpcC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjEuNTsiPjxwYXRoIGQ9Ik03LjQ0NywwLjM0OWMtMCwwIC01LjgyNiwtMC4wODkgLTYuODc0LDAuMDA3Yy0wLjA5NCwwLjAwOSAtMC4xNTgsMC4wMzYgLTAuMTkyLDAuMTUxYy0wLjAzNSwwLjEyIC0wLjA2OCwxLjI4NiAtMC4wNjgsMi4wM2MtMCwxLjU3MSAtMCw1LjIzNSAtMCw2LjAxMWMtMCwwLjQ5OSAwLjA0NSwwLjg5OCAwLjA2NCwxLjAxM2MwLjAxMywwLjA3NCAwLjEsMC4wNjYgMC4xLDAuMDY2bDIuMDcxLDBjMS43NjQsMCA0LjI1NiwwLjA4NCA0Ljc2MywtMC4wMzZjMC4xNTUsLTAuMDM3IDAuMTg3LC0wLjExNSAwLjIwOSwtMC4yNTljMC4wNzgsLTAuNTA5IDAuMTExLC00LjE5MiAwLjExMSwtNS45NDNsLTAsLTIuODY4bC0wLjA5MiwtMC4wODRsLTAuMDkyLC0wLjA4OFoiIHN0eWxlPSJmaWxsOiMwMGE4MWM7ZmlsbC1vcGFjaXR5OjAuMTtmaWxsLXJ1bGU6bm9uemVybzsiLz48cGF0aCBkPSJNMC4zNTEsOS4zNDRjLTAuMTk2LDAuMTIzIDAuMTIxLDAuNTg5IDAuMTI2LDAuNTk2Yy0wLjA4MSwtMC4wMDEgLTAuMzYsLTAuMDQgLTAuNDA4LC0wLjMyOGMtMC4wMiwtMC4xMjEgLTAuMDY5LC0wLjU0IC0wLjA2OSwtMS4wNjRjMCwtMC43NzYgLTAsLTQuNDQgLTAsLTYuMDExYy0wLC0wLjc3NiAwLjA0NCwtMS45OTIgMC4wODEsLTIuMTE4YzAuMDQzLC0wLjE0NSAwLjExNSwtMC4yMjggMC4xOTYsLTAuMjg0YzAuMDczLC0wLjA1MSAwLjE2LC0wLjA4IDAuMjY4LC0wLjA5YzEuMDUyLC0wLjA5NiA2LjkwNywtMC4wMDggNi45MDcsLTAuMDA4YzAuMDgyLDAuMDAxIDAuMTU2LDAuMDM0IDAuMjExLDAuMDg3bDAuMDg5LDAuMDg1bDAuMDg4LDAuMDc5YzAuMTAxLDAuMDkzIDAuMTAxLDAuMTkxIDAuMDU5LDAuMjc3bDAuMDQ0LC0wLjA0NGwwLDIuODY4YzAsMS43NjUgLTAuMDM2LDUuNDc3IC0wLjExNCw1Ljk5MWMtMC4wMjYsMC4xNjggLTAuMDc3LDAuMjgyIC0wLjE2NSwwLjM2OGMtMC4wNjMsMC4wNjIgLTAuMTQ5LDAuMTE1IC0wLjI4MSwwLjE0N2MtMC41MTQsMC4xMjIgLTMuMDQ0LDAuMDQ1IC00LjgzNSwwLjA0NWwtMi4wNzEsLTBsMC4wMDIsLTBsLTAuMDAyLC0wbC0wLC0wLjMxM2wyLjA3MSwwYzEuNzY0LDAgNC4yNTYsMC4wODQgNC43NjMsLTAuMDM2YzAuMTU1LC0wLjAzNyAwLjE4NywtMC4xMTUgMC4yMDksLTAuMjU5YzAuMDc4LC0wLjUwOSAwLjExMSwtNC4xOTIgMC4xMTEsLTUuOTQzbC0wLC0yLjg2OGwtMC4wOTIsLTAuMDg0bC0wLjA5MiwtMC4wODhjLTAsMCAtNS44MjYsLTAuMDg5IC02Ljg3NCwwLjAwN2MtMC4wOTQsMC4wMDkgLTAuMTU4LDAuMDM2IC0wLjE5MiwwLjE1MWMtMC4wMzUsMC4xMiAtMC4wNjgsMS4yODYgLTAuMDY4LDIuMDNjLTAsMS41NzEgLTAsNS4yMzUgLTAsNi4wMTFjLTAsMC4zMjQgMC4wMTksMC42MDcgMC4wMzgsMC43OTZaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtb3BhY2l0eTowLjE7Ii8+PHBhdGggZD0iTTYuMzIsNC4xNTZjMS4zNjIsLTAuODUgMi42NDQsLTEuNDY1IDIuNjU2LC0xLjQ3N2MwLjAxMSwtMC4wMDcgMC4wMTksLTAuMTQxIDAuMDE1LC0wLjI5NWMtMC4wMDQsLTAuNDg4IC0wLjI0MiwtMC44NjIgLTAuNjg2LC0xLjA4NmwtMC4yMzQsLTAuMTE4Yy0wLC0wIC0xLjM0NiwxLjA0MSAtMi41NTcsMS43OTJsLTIuNDI5LDEuMzIxYy0wLDAgLTAuNzM1LDEuMzIxIC0wLjYxMSwxLjQzM2MwLjEwNCwwLjA5NSAxLjIzNSwtMC4wMDMgMS41MTYsLTAuMDMyYzAuMDA3LC0wIDAuNzc1LC0wLjU2NyAyLjMzLC0xLjUzOFoiIHN0eWxlPSJmaWxsOiMwMDM2MWM7ZmlsbC1vcGFjaXR5OjAuMTtmaWxsLXJ1bGU6bm9uemVybzsiLz48cGF0aCBkPSJNOS4xNywyLjkyM2wtMC4wMTksMC4wMTVjMC4wMzUsLTAuMDIzIDAuMDkyLC0wLjA2OSAwLjEyNCwtMC4xNjVjMC4wMTQsLTAuMDM5IDAuMDMzLC0wLjIwNSAwLjAyOSwtMC4zOTRjLTAuMDA2LC0wLjYxIC0wLjMwMiwtMS4wNzkgLTAuODU5LC0xLjM2bC0wLjIzNCwtMC4xMThjLTAuMTA3LC0wLjA1NCAtMC4yMzYsLTAuMDQyIC0wLjMzMiwwLjAzMmMwLC0wIC0xLjMyNCwxLjAyNSAtMi41MjEsMS43NjdjLTAuMDAyLDAuMDAxIC0yLjQyMywxLjMxOSAtMi40MjMsMS4zMTljLTAuMDUyLDAuMDI4IC0wLjA5NCwwLjA3MSAtMC4xMjMsMC4xMjJjLTAsMCAtMC40OSwwLjg4NSAtMC42MiwxLjI5OWMtMC4wMzksMC4xMjQgLTAuMDQ5LDAuMjI0IC0wLjA0MiwwLjI4NmMwLjAxMSwwLjEwOSAwLjA2LDAuMTgyIDAuMTE0LDAuMjMxYzAuMDQ1LDAuMDQyIDAuMTY5LDAuMTA1IDAuMzYxLDAuMTE3YzAuMzY1LDAuMDIzIDEuMTY0LC0wLjA0NSAxLjM5NywtMC4wNjljMC4wMDQsLTAgMC4wNzQsLTAuMDAyIDAuMTczLC0wLjA3MmMwLjE0MiwtMC4xMDEgMC45LC0wLjY0NCAyLjI5MSwtMS41MTJsLTAsLTBjMS4yMTQsLTAuNzU4IDIuMzY0LC0xLjMyNyAyLjU5LC0xLjQ0MWMwLjA0NCwtMC4wMjIgMC4wNzQsLTAuMDQzIDAuMDk0LC0wLjA1N1ptLTIuODUsMS4yMzNjMS4zNjIsLTAuODUgMi42NDQsLTEuNDY1IDIuNjU2LC0xLjQ3N2MwLjAxMSwtMC4wMDcgMC4wMTksLTAuMTQxIDAuMDE1LC0wLjI5NWMtMC4wMDQsLTAuNDg4IC0wLjI0MiwtMC44NjIgLTAuNjg2LC0xLjA4NmwtMC4yMzQsLTAuMTE4Yy0wLC0wIC0xLjM0NiwxLjA0MSAtMi41NTcsMS43OTJsLTIuNDI5LDEuMzIxYy0wLDAgLTAuNzM1LDEuMzIxIC0wLjYxMSwxLjQzM2MwLjEwNCwwLjA5NSAxLjIzNSwtMC4wMDMgMS41MTYsLTAuMDMyYzAuMDA3LC0wIDAuNzc1LC0wLjU2NyAyLjMzLC0xLjUzOFoiIHN0eWxlPSJmaWxsOiNmZmY7ZmlsbC1vcGFjaXR5OjAuMTsiLz48cGF0aCBkPSJNMS4yMjMsMS44NTFjLTAsLTAuMDMxIDAuMDI5LC0wLjA1NiAwLjA0NCwtMC4wODRjMC4wNSwtMC4wOTcgMC4xMTUsLTAuMTkgMC4xNzIsLTAuMjgzYzAuMDA2LC0wLjAwOSAwLjAzMSwtMC4wNjQgMC4wNDksLTAuMDc5YzAuMDEsLTAuMDA5IDAuMDMxLC0wLjA0IDAuMDMxLC0wLjAyN2MtMCwwLjIwOCAwLjAyNiwwLjQxMiAwLjAyNiwwLjYxOWwwLDAuMjY1YzAsMC4wMTEgMC4wMDMsMC4wNzYgMC4wMjcsMC4wNThjMC4xNTUsLTAuMTIxIDAuMjkyLC0wLjMzNCAwLjQ2NCwtMC40MmMwLjAxNiwtMC4wMDggMC4wMzEsMC4wMTggMC4wNDQsMC4wMzFjMC4wNDEsMC4wNDEgMC4wODUsMC4wODQgMC4xNDYsMC4wOTdjMC4wNjksMC4wMTUgMC4wNzEsLTAuMDY5IDAuMTE1LC0wLjA4YzAuMDg2LC0wLjAyMSAwLjE3NSwwLjA1OCAwLjI3LDAuMDI3YzAuMTQ2LC0wLjA0NyAwLjIzOCwtMC4xNDMgMC4zNTcsLTAuMjM0YzAuMDIsLTAuMDE1IDAuMDgxLC0wLjA3OCAwLjEyLC0wLjA2MmMwLjAzOSwwLjAxNiAwLjA0OCwwLjA0OSAwLjA3NSwwLjA3NWMwLjA3NCwwLjA3IDAuMTYzLDAuMTUgMC4yNDMsMC4yMDNjMC4wMzMsMC4wMjIgMC4xMTEsLTAuMDkxIDAuMTI4LC0wLjEwNmMwLjEwMiwtMC4wODcgMC4yMjMsLTAuMTU5IDAuMzU0LC0wLjE5YzAuMDI5LC0wLjAwNyAwLjA2NCwtMC4wMjkgMC4wODgsLTAuMDEzYzAuMDM2LDAuMDI0IDAuMDM1LDAuMDkgMC4wNDQsMC4xMjhjMC4wMTgsMC4wNzIgMC4wODksMC4yNzMgMC4xOTQsMC4yODdjMC4yMTksMC4wMjcgMC4zNTQsLTAuMjgyIDAuNTUzLC0wLjMyN2MwLjA5OSwtMC4wMjIgMC4xNDcsMC4xODIgMC4yNDQsMC4yMDRjMC4wNTgsMC4wMTMgMC4xMSwtMC4wMjkgMC4xNjcsLTAuMDM2YzAuMDk5LC0wLjAxMSAwLjIwMiwwLjAwNSAwLjMwMSwwLjAwNSIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2ZmZjtzdHJva2Utb3BhY2l0eTowLjI7c3Ryb2tlLXdpZHRoOjAuMzFweDsiLz48cGF0aCBkPSJNMS4xMzksNC4wMjJjMC4wMjQsLTAuMDE3IDAuMDEyLC0wLjA0OCAwLjAxMywtMC4wNzZjMC4wMDQsLTAuMDY4IDAuMDA3LC0wLjEzNSAwLjAxMywtMC4yMDNjMC4wMTIsLTAuMTI1IDAuMDQxLC0wLjI1OCAwLjExMiwtMC4zNjRjMC4wMTcsLTAuMDI3IDAuMDYzLC0wLjA4NyAwLjEsLTAuMDkxYzAuMjM3LC0wLjAyOCAwLjIzNywwLjI0MSAwLjM2MywwLjM2N2MwLjAzMSwwLjAzMSAwLjIsLTAuMDUgMC4yMjEsLTAuMDUzYzAuMDYsLTAuMDExIDAuMDc4LDAuMDggMC4xNDEsMC4xMDFjMC4xMDEsMC4wMzQgMC4zMTUsMC4wMTkgMC40MDIsLTAuMDA0YzAuMDY4LC0wLjAxOCAwLjE2NSwtMC4wNTIgMC4yMTMsLTAuMTA2YzAuMDIsLTAuMDI0IDAuMDIyLC0wLjA5NyAwLjA0OCwtMC4wOGMwLjEyMywwLjA4MiAwLjM4NSwwLjE2OCAwLjUwOCwwLjEwNiIgc3R5bGU9ImZpbGw6bm9uZTtzdHJva2U6I2ZmZjtzdHJva2Utb3BhY2l0eTowLjI7c3Ryb2tlLXdpZHRoOjAuMzFweDsiLz48ZyB0cmFuc2Zvcm09Im1hdHJpeCg4LjA1NDIsMCwwLDguMDU0MiwzOC4yNTM2LDcuODY2NTgpIj48L2c+PHRleHQgeD0iMTAuNDk3cHgiIHk9IjcuODY3cHgiIHN0eWxlPSJmb250LWZhbWlseTonQXJpYWxNVCcsICdBcmlhbCcsIHNhbnMtc2VyaWY7Zm9udC1zaXplOjguMDU0cHg7ZmlsbDojMDBhODFjO2ZpbGwtb3BhY2l0eTowLjE7Ij5Ob3RlZm94PC90ZXh0Pjwvc3ZnPg==`;

        let styleCSS =
            `<style>
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans&display=swap');
            #sticky-notes-notefox-addon {
                position: fixed;
                top: ${y};
                left:  ${x};
                width: ${w};
                height:  ${h};
                background-color: #fffd7d;
                opacity: ${opacity};
                z-index: 99999;
                padding: 15px !important;
                margin: 0px !important;
                box-sizing: border-box !important;
                border-radius: 10px;
                border-bottom-right-radius: 0px;
                cursor: default;
                box-shadow: 0px 0px 5px rgba(255,98,0,0.27);
                font-family: 'Open Sans', sans-serif;
                color: #111111;
                font-size: 17px;
                background-image: url('data:image/svg+xml;${svg_background_image}');
                background-position: left 50% bottom 10px;
                background-repeat: no-repeat;
                background-size: 50% auto;
            }
            #sticky-notes-notefox-addon:active{
                opacity: 1;
            }
            #move--sticky-notes-notefox-addon {
                position: absolute;
                top: 0px;
                left: 40%;
                right: 40%;
                width: auto;
                height: 15px;
                background-color: #ff6200;
                opacity: 0.7;
                cursor: grab;
                border-radius: 0px 0px 10px 10px;
                z-index: 5;
                transition: 0.5s;
            }
            #move--sticky-notes-notefox-addon:hover{
                opacity: 1;
            }
            #move--sticky-notes-notefox-addon:active{
                cursor: grabbing;
                z-index: 6;
                opacity: 1;
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
            }
            #resize--sticky-notes-notefox-addon:active{
                cursor: nwse-resize;
            }
            #resize--sticky-notes-notefox-addon:before{
                cursor: nwse-resize;
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                border-top: 10px solid transparent;
                border-right: 10px solid #ff6200;
                width: 0;
            }
            #text--sticky-notes-notefox-addon {
                position: absolute;
                left: 0px;
                right: 0px;
                top: 10px;
                bottom: 35px;
                width: auto;
                height: auto;
                padding: 10px !important;
                margin: 0px !important;
                box-sizing: border-box !important;
                background-color: transparent;
                opacity: 1;
                cursor: text;
                z-index: 1;
                border-radius: 10px;
                overflow-y: auto;
                transition: 0.2s;
                font-family: 'Open Sans', sans-serif;
            }
            #text--sticky-notes-notefox-addon:focus {
                outline: 2px solid #ff6200;
            }
            #close--sticky-notes-notefox-addon, #page-or-domain--sticky-notes-notefox-addon {
                position: absolute;
                top: 0px ;
                right: 0px;
                width: 30px;
                height: 30px;
                background-image: url('data:image/svg+xml;${svg_image}');
                background-size: auto 70%;
                background-repeat: no-repeat;
                background-position: center center;
                background-color: #ff6200;
                border: 0px solid transparent;
                color: #ffffff;
                z-index: 5;
                border-radius: 10px;
                cursor: pointer;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
            }
            #close--sticky-notes-notefox-addon:active, #close--sticky-notes-notefox-addon:focus {
                box-shadow: 0px 0px 0px 2px #ff6200, 0px 0px 0px 5px #ffb788;
                z-index: 6;
                transition: 0.5s;
            }
            #page-or-domain--sticky-notes-notefox-addon {
                right: auto;
                left: 0px;
                height: 15px;
                width: auto;
                background: none;
                background-color: #ff6200;
                font-weight: bold !important;
                font-family: 'Open Sans', sans-serif;
                padding: 1px 5px !important;
                font-size: 8px !important;
                text-align: center;
                cursor: default;
                border-radius: 10px;
            }
            
            #slider-container--sticky-notes-notefox-addon {
                position: absolute;
                z-index: 2;
                width: auto !important;
                left: 10px !important;
                right: 10px !important;
                bottom: 10px !important;
                margin: 0px !important;
                padding: 0px 10px !important;
                box-sizing: border-box !important;
            }
            
            #slider--sticky-notes-notefox-addon {
                width: 100%;
                height: 5px;
                background: linear-gradient(to right, #ff6200 0%, #ff6200 ${opacity * 100}%, #eeeeee ${opacity * 100}%, #eeeeee 100%);
                border: 1px solid #ffb788;
                outline: none;
                opacity: 0.7;
                transition: opacity .2s;
                cursor: pointer;
                border-radius: 10px;
                margin: 0px !important;
                padding: 0px !important;
                box-sizing: border-box !important;
            }
            
            #slider--sticky-notes-notefox-addon:hover {
                opacity: 1;
            }
            
            #slider--sticky-notes-notefox-addon::-moz-range-thumb {
                width: 15px;
                height: 15px;
                background: #ff6200;
                cursor: grab;
                border: 1px solid #eeeeee;
                border-radius: 100%;
                margin: 0px;
            }
            #slider--sticky-notes-notefox-addon::-moz-range-thumb:active {
                cursor: grabbing;
                box-shadow: 0px 0px 0px 1px #ffb788, 0px 0px 0px 4px #ff6200;
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
        </style>`
        document.head.innerHTML += styleCSS;

        /**
         * Make "movable" the sticky-notes
         */
        let isDragging = false;
        move.addEventListener('mousedown', (e) => {
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
        });

        /**
         * Make "resizable" the sticky-notes
         */
        let isResizing = false;
        resize.addEventListener('mousedown', (e) => {
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
        });

        opacityRange.oninput = function () {
            var value = (this.value - this.min) / (this.max - this.min) * 100;
            setSlider(opacityRange, stickyNote, value, true);
        };

        stickyNote.appendChild(move);
        stickyNote.appendChild(resize);
        stickyNote.appendChild(text);

        document.body.appendChild(stickyNote);
        browser.runtime.sendMessage({from: "sticky", data: {close: false}});
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

function isAPage(url) {
    return (url.replace("http://", "").replace("https://", "").split("/").length > 1);
}