import { SVGMap } from './SVGMap.js';
import { SVGBridge } from "./SVGBridge.js";
import { Message } from './messages/Message.js';

export class SVGControls {
    constructor() {
        var bridge = new SVGBridge();
        this.altk = false;

        this.getBridge = () => bridge;
    }

    pageLoad() {
        let msg = new Message('data-general', '');
        this.getBridge().tell(msg);
    }

    navigationHandler(mode) {
        const STEP = 15 + (20 - SVGMap.instance.zoomlevel);
        var xdif = 0, ydif = 0;

        switch (mode) {
            case 'up': 
                ydif = -STEP;
                break;

            case 'down':
                ydif = STEP;
                break;

            case 'left': 
                xdif = -STEP;
                break;

            case 'right':
                xdif = STEP;
                break;

            case 'zoom-in':
                SVGMap.instance.zoomlevel = (SVGMap.instance.zoomlevel == 20) ? SVGMap.instance.zoomlevel : SVGMap.instance.zoomlevel + 1;
                SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel);

                return;

            case 'zoom-out':
                SVGMap.instance.zoomlevel = (SVGMap.instance.zoomlevel == 1) ? SVGMap.instance.zoomlevel : SVGMap.instance.zoomlevel - 1;
                SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel);

                return;
        }

        SVGMap.instance.move(xdif, ydif);
    }
}