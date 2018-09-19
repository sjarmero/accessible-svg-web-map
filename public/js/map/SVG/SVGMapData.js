/*
    Background Worker
    Data management from Node server
*/

importScripts('/js/map/SVG/messages/WorkerMessage.js');

(function() {
    let data;

    function fetchData() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/map/data", false);
        xhr.onload = function(e) {
            if (xhr.readyState == 4 && xhr.status == 200) {
                data = xhr.responseText;
            } else {
                console.log(xhr.statusText);
                data = xhr.statusText;
            }
        }

        xhr.onerror = function(e) {
            console.log(xhr.statusText);
        }

        xhr.send(null);
    }

    self.addEventListener('message', function(e) {
        if (typeof e.data.json != 'undefined') {
            let message = new Message(e.data);

            switch (message.getName()) {
                case 'data-general':
                    fetchData();
                    self.postMessage(new Message('data-response', { result: 200, data: data }));
                    return;
            }

        } else {
            console.log("Unknown message type received: ");
            console.log(e.data);
        }
    });
})();