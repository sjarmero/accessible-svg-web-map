import { SVGMap } from './SVGMap.js';
import { SVGBridge } from "./SVGBridge.js";
import { Message } from './messages/Message.js';
import { SVGVoiceControls } from './SVGVoiceControls.js';

export class SVGControls {
    constructor() {
        var bridge = new SVGBridge();
        this.altk = false;
        this.voice = new SVGVoiceControls();

        this.getBridge = () => bridge;
    }

    pageLoad() {
        this.getBridge().tell(new Message('data-general', ''));
    }

    get voiceControl() {
        return this.voice;
    }

    set onSearchVoiceQuery(callback) {
        this.searchResultCallback = callback;
    }

    get onSearchVoiceQuery() {
        return this.searchResultCallback;
    }

    set onSearchResultSelected(callback) {
        this.searchResultSelected = callback;
    }

    get onSearchResultSelected() {
        return this.searchResultSelected;
    }

    set onUnknownVoiceCommand(callback) {
        this.uvc = callback;
    }

    get onUnknownVoiceCommand() {
        return this.uvc;
    }

    set searchResultsForVoiceSelection(results) {
        this.srfvs = results;
    }

    get searchResultsForVoiceSelection() {
        return this.srfvs;
    }

    startVoice() {
        if (SVGVoiceControls.compatible()) {
            this.voice.start(({confidence, transcript}) => {
                console.log('Voice received:');
                console.log(confidence, transcript);

                let parsed = this.voice.parseAction(transcript);
                if (parsed) {
                    let {action, mode} = parsed;
                    console.log(mode);

                    switch (action) {
                        case 'unknown':
                            this.onUnknownVoiceCommand();
                            return;

                        case 'search':
                            this.onSearchVoiceQuery(mode);
                            return;

                        case 'select':
                            this.onSearchResultSelected(this.toDigit(mode));
                            return;

                        case 'aramis':
                            let speech = new Speech();
                            speech.say("La máxima autoridad mundial en ocultismo");
                            return;

                        default:
                            this.navigationHandler(mode);
                            return;
                    }
                }
            });
        }
    }

    stopVoice() {
        if (SVGVoiceControls.compatible() && typeof this.voice != 'undefined') {
            this.voice.stop();
        }
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


    toDigit(number) {
        let n = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
        console.log(n.length, number);
        for (let i = 0; i < n.length; i++) {
            if (n[i] == number) {
                return (i + 1);
            }
        }

        return -1;
    }
}