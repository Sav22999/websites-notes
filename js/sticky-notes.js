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

    let stickyNote = document.createElement("div");
    stickyNote.id = "sticky-notes-notefox-addon";
    stickyNote.innerText = "Questa è la mia nota!";

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
        "z-index: 999;" +
        "padding: 15px;" +
        "border-radius: 10px;" +
        "cursor: text;" +
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
        "cursor: move;" +
        "}" +
        "#move--sticky-notes-notefox-addon:active{" +
        "cursor: move;" +
        "}" +
        "</style>";
    document.head.innerHTML += styleCSS;

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

    stickyNote.appendChild(move);

    document.body.appendChild(stickyNote);
    browser.runtime.sendMessage({from: "sticky", data: {close: false}});
}

function alreadyExists() {

}