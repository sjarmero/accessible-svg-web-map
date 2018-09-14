importScripts('/subworkers/subworkers.js', '/js/map/messages/WorkerMessage.js');

/*
    Dispatches messages to proper worker
*/

// Starts workers
let dataWorker = new Worker('SVGMapData.js');
dataWorker.addEventListener('message', function(e) {
    self.postMessage(e.data);
});

let voiceWorker = new Worker('SVGVoiceControls.js');
voiceWorker.addEventListener('message', function(e) {
    self.postMessage(e.data);
});

self.onmessage = function(e) {
    if (typeof e.data.json != 'undefined') {
        let message = new Message(e.data);

        if (message.getName().startsWith('data-')) {
            dataWorker.postMessage(new Message(message.getName(), message.getContents()));
        }

        if (message.getName().startsWith('voice-')) {
            voiceWorker.postMessage(new Message(message.getName(), message.getContents()));
        }
    }
};