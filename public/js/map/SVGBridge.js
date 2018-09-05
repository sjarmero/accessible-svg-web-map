import { Message } from './messages/Message.js';
import { SVGMap } from './SVGMap.js';

import '/subworkers/subworkers.js';
/*
    Joins communications between background
    and foreground
*/


var worker;
export class SVGBridge {
    constructor() {
        worker = (typeof worker == 'undefined') ? new Worker('/js/map/MainWorker.js', {type: 'module'}) : worker;
    
        worker.addEventListener('message', function(e) {            
            if (typeof e.data.json != 'undefined') {
                let message = new Message(e.data);
                if (message instanceof Message) {
                    if (message.getName() == 'data-response') {
                        SVGMap.instance.data = JSON.parse(message.getContents().data);
                        SVGMap.instance.draw();
                    }
                } else {
                    console.log('[BRIDGE] Unknown message type received:');
                    console.log(e.data);
                }
            }
        });

        worker.addEventListener('error', function(e) {
            console.log("[BRIDGE] Error on Main Worker");
            console.log(e);
            throw e;
        });

        console.log(worker);

        this.getWorker = () => worker;
    }

    tell(message) {
        console.log("Telling " + JSON.stringify(message));
        this.getWorker().postMessage(message);
    }
}