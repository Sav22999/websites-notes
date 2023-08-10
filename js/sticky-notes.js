load();

function load() {
    if (document.getElementById("sticky-notes-notefox-addon")) {
        //already exists
        alreadyExists();
    } else {
        //create new
        browser.runtime.sendMessage({from: "sticky", ask: "coords"}, (response) => {
            if (response !== undefined && response.coords !== undefined && response.coords.x != -1 && response.coords.y != -1) {
                createNew(response.coords.x, response.coords.y);
            } else {
                createNew();
            }
        });
    }
}

function createNew(x = "10px", y = "10px") {
    let move = document.createElement("div");
    move.id = "move--sticky-notes-notefox-addon";

    let resize = document.createElement("div");
    resize.id = "resize--sticky-notes-notefox-addon";

    let text = document.createElement("div");
    text.id = "text--sticky-notes-notefox-addon";
    text.innerText = "Questa è la mia nota!";

    let stickyNote = document.createElement("div");
    stickyNote.id = "sticky-notes-notefox-addon";

    let button = document.createElement("button");
    button.value = "Close sticky";
    button.onclick = function () {
        browser.runtime.sendMessage({from: "sticky", data: {close: true}});
        document.getElementById("sticky-notes-notefox-addon").remove();
    }
    stickyNote.appendChild(button);

    let styleCSS = "<style>" +
        "#sticky-notes-notefox-addon {" +
        "position: fixed;" +
        "top: " + y + ";" +
        "left: " + x + ";" +
        "width: 200px;" +
        "height: 300px;" +
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
        "left: 80px;" +
        "right:80px;" +
        "width: auto;" +
        "height: 10px;" +
        "background-color: orange;" +
        "opacity: 0.5;" +
        "cursor: grab;" +
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
        }

        function onMouseUp() {
            isResizing = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });


    stickyNote.appendChild(move);
    stickyNote.appendChild(resize);
    stickyNote.appendChild(text);

    document.body.appendChild(stickyNote);
    browser.runtime.sendMessage({from: "sticky", data: {close: false}});
}

function alreadyExists() {

}