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
            let notes = {description: "", url: "", tag_colour: "", website: {}};
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
            createNew(notes, x, y, w, h, opacity, response.websites);
        }
    });
}

function changeDescription() {
    if (document.getElementById("text--sticky-notes-notefox-addon")) {
        //double check already exists

        let text = document.getElementById("text--sticky-notes-notefox-addon");
        let tag = document.getElementById("tag--sticky-notes-notefox-addon");

        browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
            if (response !== undefined) {
                let new_text = "";
                if (response.notes !== undefined && response.notes.description !== undefined) new_text = response.notes.description;
                text.innerText = new_text

                let new_tag = "";
                if (response.notes !== undefined && response.notes.tag_colour !== undefined) new_tag = response.notes.tag_colour;
                tag.style.backgroundColor = new_tag;
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

        let svg_image = `base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMTIgMTEyIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zOnNlcmlmPSJodHRwOi8vd3d3LnNlcmlmLmNvbS8iIHN0eWxlPSJmaWxsLXJ1bGU6ZXZlbm9kZDtjbGlwLXJ1bGU6ZXZlbm9kZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6MjsiPjxwYXRoIGQ9Ik05LjI1OSw4My4zMzNjMCwtOC43MjkgMCwtMTMuMDk0IDIuNzEyLC0xNS44MDdjMi43MTIsLTIuNzEyIDcuMDc3LC0yLjcxMiAxNS44MDcsLTIuNzEyYzguNzMsMCAxMy4wOTUsMCAxNS44MDcsMi43MTJjMi43MTIsMi43MTIgMi43MTIsNy4wNzcgMi43MTIsMTUuODA3YzAsOC43MyAwLDEzLjA5NSAtMi43MTIsMTUuODA3Yy0yLjcxMiwyLjcxMiAtNy4wNzcsMi43MTIgLTE1LjgwNywyLjcxMmMtOC43MywwIC0xMy4wOTQsMCAtMTUuODA3LC0yLjcxMmMtMi43MTIsLTIuNzEyIC0yLjcxMiwtNy4wNzcgLTIuNzEyLC0xNS44MDdaIiBzdHlsZT0iZmlsbDojZmZmO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PHBhdGggZD0iTTE2LjAzOSwxNi4wMzljLTYuNzgsNi43OCAtNi43OCwxNy42OTIgLTYuNzgsMzkuNTE3YzAsMS44MzEgMCwzLjU4NiAwLjAwNCw1LjI2N2MyLjM1MiwtMS41NDIgNC45NDQsLTIuMjE3IDcuNDI5LC0yLjU1MmMyLjk4OSwtMC40MDIgNi42NjQsLTAuNDAxIDEwLjY3MSwtMC40MDFsMC44MjksMGM0LjAwNywtMCA3LjY4MiwtMC4wMDEgMTAuNjcxLDAuNDAxYzMuMjkxLDAuNDQzIDYuNzcsMS40ODQgOS42MzIsNC4zNDVjMi44NjEsMi44NjIgMy45MDIsNi4zNDEgNC4zNDUsOS42MzJjMC40MDEsMi45ODkgMC40MDEsNi42NjQgMC40LDEwLjY3MWwwLDAuODI5YzAuMDAxLDQuMDA4IDAuMDAxLDcuNjgyIC0wLjQsMTAuNjdjLTAuMzM1LDIuNDg2IC0xLjAxLDUuMDc3IC0yLjU1Miw3LjQzYzEuNjgyLDAuMDA0IDMuNDM2LDAuMDA0IDUuMjY3LDAuMDA0YzIxLjgyNCwtMCAzMi43MzYsLTAgMzkuNTE3LC02Ljc4YzYuNzgsLTYuNzggNi43OCwtMTcuNjkyIDYuNzgsLTM5LjUxN2MtMCwtMjEuODI1IC0wLC0zMi43MzYgLTYuNzgsLTM5LjUxN2MtNi43OCwtNi43NzkgLTE3LjY5MiwtNi43NzkgLTM5LjUxNywtNi43NzljLTIxLjgyNSwtMCAtMzIuNzM2LC0wIC0zOS41MTYsNi43NzlsLTAsMC4wMDFabTQ1LjMwMywxMi44OTZjLTEuOTE4LC0wIC0zLjQ3MywxLjU1NCAtMy40NzMsMy40NzJjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MywzLjQ3Mmw4Ljk3OCwwbC0xNy4yMjEsMTcuMjIxYy0xLjM1NiwxLjM1NiAtMS4zNTYsMy41NTQgMCw0LjkxYzEuMzU2LDEuMzU2IDMuNTU0LDEuMzU2IDQuOTEsMGwxNy4yMjEsLTE3LjIybDAsOC45NzhjMCwxLjkxOCAxLjU1NSwzLjQ3MiAzLjQ3MiwzLjQ3MmMxLjkxOCwwIDMuNDczLC0xLjU1NCAzLjQ3MywtMy40NzJsLTAsLTE3LjM2MWMtMCwtMS45MTggLTEuNTU1LC0zLjQ3MiAtMy40NzMsLTMuNDcybC0xNy4zNjEsLTBsMC4wMDEsLTBaIiBzdHlsZT0iZmlsbDojZmZmO3N0cm9rZTojZmZmO3N0cm9rZS13aWR0aDowLjE0cHg7Ii8+PC9zdmc+`;

        let styleCSS =
            `<style>
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans&display=swap');
            #sticky-notes-notefox-addon {
                position: fixed;
                top: ${y};
                left:  ${x} ;
                width: ${w} ;
                height:  ${h} ;
                background-color: #fffd7d;
                opacity: ${opacity};
                z-index: 99999;
                padding: 15px;
                border-radius: 10px;
                border-bottom-right-radius: 0px;
                cursor: default;
                box-shadow: 0px 0px 5px rgba(255,98,0,0.27);
                font-family: 'Open Sans', sans-serif;
                color: #111111;
                font-size: 17px;
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
                padding: 10px;
                background-color: transparent;
                opacity: 1;
                cursor: text;
                z-index: 1;
                border-radius: 10px;
                overflow-y: auto;
                transition: 0.2s;
            }
            #text--sticky-notes-notefox-addon:focus {
                outline: 2px solid #ff6200;
            }
            #close--sticky-notes-notefox-addon {
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
                margin: 0px;
                z-index: 5;
                border-radius: 10px;
                padding: 0px;
                cursor: pointer;
            }
            #close--sticky-notes-notefox-addon:active, #close--sticky-notes-notefox-addon:focus {
                box-shadow: 0px 0px 0px 2px #ff6200, 0px 0px 0px 5px #ffb788;
                z-index: 6;
                transition: 0.5s;
            }
            
            #slider-container--sticky-notes-notefox-addon {
                position: absolute;
                z-index: 2;
                width: auto;
                left: 10px;
                right: 10px;
                bottom: 10px;
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
                padding: 0px;
                margin: 0px;
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
            if (value < 20) value = 20;
            opacityRange.value = value;
            this.style.background = 'linear-gradient(to right, #ff6200 0%, #ff6200 ' + value + '%, #eeeeee ' + value + '%, #eeeeee 100%)';
            browser.runtime.sendMessage({
                from: "sticky",
                data: {opacity: {value: (value / 100)}}
            });
            stickyNote.style.opacity = (value / 100);
            //console.log(value / 100);
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

function alreadyExists() {
    changeDescription();
}