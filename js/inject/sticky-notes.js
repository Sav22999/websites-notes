load();

function load() {
    if (document.getElementById("sticky-notes-notefox-addon")) {
        //already exists || update elements
        alreadyExists();
    } else {
        //create new
        browser.runtime.sendMessage({from: "sticky", ask: "coords-sizes"}, (response) => {
            let x = "20px";
            let y = "20px";
            let w = "300px";
            let h = "300x";

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
            }
            createNewDescription(x, y, w, h);
        });
    }
}

function createNewDescription(x, y, w, h) {
    browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
        if (response !== undefined) {
            let notes = {description: "", url: "", tag_colour: ""}
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
            createNew(notes, x, y, w, h, response.websites);
        }
    });
}

function changeDescription() {
    if (document.getElementById("text--sticky-notes-notefox-addon")) {
        //double check already exists

        let text = document.getElementById("text--sticky-notes-notefox-addon");

        browser.runtime.sendMessage({from: "sticky", ask: "notes"}, (response) => {
            if (response !== undefined) {
                if (response.notes !== undefined && response.notes.description !== undefined) {
                    text.innerText = response.notes.description;
                } else {
                    text.innerText = "";
                }
            }
        });
    }
}

function createNew(notes, x = "10px", y = "10px", w = "200px", h = "300px", websites_json) {
    if (!document.getElementById("sticky-notes-notefox-addon")) {
        let move = document.createElement("div");
        move.id = "move--sticky-notes-notefox-addon";

        let resize = document.createElement("div");
        resize.id = "resize--sticky-notes-notefox-addon";

        let text = document.createElement("div");
        text.id = "text--sticky-notes-notefox-addon";
        text.innerText = notes.description;

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

        let styleCSS = "<style>" +
            "#sticky-notes-notefox-addon {" +
            "position: fixed;" +
            "top: " + y + ";" +
            "left: " + x + ";" +
            "width: " + w + ";" +
            "height: " + h + ";" +
            "background-color: yellow;" +
            "opacity: 0.7;" +
            "z-index: 99999;" +
            "padding: 15px;" +
            "border-radius: 10px;" +
            "border-bottom-right-radius: 0px;" +
            "cursor: default;" +
            "}" +
            "#sticky-notes-notefox-addon:active{" +
            "opacity: 1;" +
            "}" +
            "#move--sticky-notes-notefox-addon {" +
            "position: absolute;" +
            "top: 0px;" +
            "left: 30%;" +
            "right: 30%;" +
            "width: auto;" +
            "height: 10px;" +
            "background-color: #ff6200;" +
            "opacity: 0.5;" +
            "cursor: grab;" +
            "border-radius: 0px 0px 5px 5px;" +
            "}" +
            "#move--sticky-notes-notefox-addon:active{" +
            "cursor: grabbing;" +
            "}" +
            "#resize--sticky-notes-notefox-addon {" +
            "position: absolute;" +
            "right: 0px;" +
            "bottom: 0px;" +
            "width: 10px;" +
            "height: 10px;" +
            "background-color: red;" +
            "opacity: 0.5;" +
            "cursor: nwse-resize;" +
            "z-index: 2" +
            "}" +
            "#resize--sticky-notes-notefox-addon:active{" +
            "cursor: nwse-resize;" +
            "}" +
            "#resize--sticky-notes-notefox-addon:before{" +
            "cursor: nwse-resize;" +
            "content: '';" +
            "position: absolute;" +
            "top: 0;" +
            "left: 0;" +
            "border-top: 10px solid white;" +
            "border-right: 10px solid red;" +
            "width: 0;" +
            "}" +
            "#text--sticky-notes-notefox-addon {" +
            "position: absolute;" +
            "left: 0px;" +
            "right: 0px;" +
            "top: 10px;" +
            "bottom: 50px;" +
            "width: auto;" +
            "height: auto;" +
            "padding: 10px;" +
            "background-color: transparent;" +
            "opacity: 0.5;" +
            "cursor: text;" +
            "z-index: 1" +
            "}" +
            "#close--sticky-notes-notefox-addon {" +
            "position: absolute;" +
            "top: 0px !important;" +
            "right: 0px !important;" +
            "width: 30px !important;" +
            "height: 30px !important;" +
            "background-image: url('https://www.saveriomorelli.com/images/notefox/sticky-close.svg') !important;" +
            "background-size: auto 70% !important;" +
            "background-repeat: no-repeat !important;" +
            "background-position: center center !important;" +
            "background-color: #ff6200 !important;" +
            "border: 0px solid transparent;" +
            "color: #ffffff !important;" +
            "margin: 2px !important;" +
            "z-index: 5 !important;" +
            "border-radius: 5px !important;" +
            "padding: 0px !important;" +
            "}" +
            "#close--sticky-notes-notefox-addon:active, #close--sticky-notes-notefox-addon:focus {" +
            "box-shadow: 0px 0px 0px 2px #ff6200, 0px 0px 0px 5px #ffb788;" +
            "border-radius: 5px;" +
            "z-index: 6;" +
            "transition: 0.5s;" +
            "}" +
            "</style>";
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