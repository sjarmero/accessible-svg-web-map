import { SVGMap } from './SVGMap.js';
import { SVGBridge } from "./SVGBridge.js";
import { Message } from './messages/Message.js';

const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;

export class SVGControls {
    constructor() {
        var bridge = new SVGBridge();
        this.altk = false;

        this.getBride = () => bridge;
    }

    pageLoad() {
        let msg = new Message('data-general', '');
        this.getBride().tell(msg);
    }

    navigationHandler(mode) {
        const STEP = 15 + (20 - SVGMap.instance.zoomlevel);

        var vbox = SVGMap.instance.svg.viewbox();
        var vbx = vbox.x;
        var vby = vbox.y;
        var vbzx = vbox.width;
        var vbzy = vbox.height;

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

        vbx += xdif;
        vby += ydif;

        SVGMap.instance.moveTo(vbx, vby);
    }
}