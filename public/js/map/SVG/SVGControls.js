import { SVGMap } from './SVGMap.js';
import { SVGVoiceControls } from './SVGVoiceControls.js';
import { SVGLocation } from './SVGLocation.js';

export class SVGControls {
    constructor() {
        this.altk = false;
        this.voice = new SVGVoiceControls();

        proj4.defs('EPSG:25830', "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");
    }

    pageLoad() {
        SVGMap.instance.onDrawn = function() {
            setTimeout(function() {
                SVGMap.instance.groupMarkers(SVGMap.instance.zoomlevel);
            }, 100);

            
            let svgl = new SVGLocation();
            svgl.watch(function(lat, long) {
                let [x, y] = proj4('EPSG:4326', 'EPSG:25830', [long, lat]);

                SVGMap.instance.drawLocation(x, -y);
            });
        };

        SVGMap.instance.draw();
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

    set onRouteCommand(callback) {
        this.routeCommand = callback;
    }

    get onRouteCommand() {
        return this.routeCommand;
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
            SVGVoiceControls.setOn(true);
            this.voice.start(({confidence, transcript}) => {
                console.log('Voice received:');
                console.log(confidence, transcript);

                let parsed = this.voice.parseAction(transcript);
                if (parsed) {
                    console.log('Parsed as', parsed);
                    let {name} = parsed;

                    switch (name) {
                        case 'unknown':
                            this.onUnknownVoiceCommand();
                            return;

                        case 'search':
                            this.onSearchVoiceQuery(parsed.query);
                            return;

                        case 'select':
                            this.onSearchResultSelected(this.toDigit(parsed.item));
                            return;

                        case 'route':
                            this.onRouteCommand({ origin: parsed.origin, target: parsed.target });
                            return;

                        case 'access-routes':
                            this.onRouteCommand(null);
                            return;

                        case 'zoom':
                            this.navigationHandler((parsed.direction === 'acercar') ? 'zoom-in' : 'zoom-out');
                            return;

                        default:
                            this.navigationHandler(parsed.direction);
                            return;
                    }
                }
            }, true);
        }
    }

    stopVoice() {
        if (SVGVoiceControls.compatible() && typeof this.voice != 'undefined') {
            SVGVoiceControls.setOn(false);
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