import { Message } from './messages/Message.js';
import { SVGMap } from './SVGMap.js';

import '/subworkers/subworkers.js';
/*
    Joins communications between background
    and foreground
*/


export class SVGBridge {
    constructor() {
        SVGBridge.startWorker();
        
        SVGBridge.worker.addEventListener('message', function(e) {            
            if (typeof e.data.json != 'undefined') {
                let message = new Message(e.data);
                if (message instanceof Message) {
                    switch (message.getName()) {
                        case 'data-response':
                            SVGMap.instance.data = JSON.parse(message.getContents().data);
                            SVGMap.instance.draw();
                            break;

                        case 'voice-transcript':
                            let {confidence, transcript} = message.getContents();
                            console.log('Confidence:', confidence);
                            console.log('Transcript:', transcript);
                    }
                } else {
                    console.log('[BRIDGE] Unknown message type received:');
                    console.log(e.data);
                }
            }
        });

        SVGBridge.worker.addEventListener('error', function(e) {
            console.log("[BRIDGE] Error on Main Worker");
            console.log(e);
            throw e;
        });
    }

    static get worker() {
        return this._worker;
    }

    static startWorker() {
        this._worker = (typeof this._worker == 'undefined') ? new Worker('/js/map/MainWorker.js', {type: 'module'}) : this._worker;
    }

    tell(message) {
        console.log("Telling " + JSON.stringify(message));
        SVGBridge.worker.postMessage(message);
    }
}