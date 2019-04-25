import { SVGMap } from './SVGMap.js';
import { SVGVoiceControls } from './SVGVoiceControls.js';
import { Settings } from '../settings/defaults.js';

declare var proj4;
declare var Cookies;

export class SVGControls {
    private static _instance : SVGControls;

    private voice : SVGVoiceControls;
    private searchResultCallback : any;
    private searchResultSelected : any;
    private routeCommand : any;
    private uvc : any;
    private srfvs : any;
    private lastSentence : string;

    constructor() {
        console.log('Creating SVGControls', this.voice);
        this.voice = (this.voice) ? this.voice : new SVGVoiceControls();

        proj4.defs('EPSG:25830', "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");
    }

    static get instance() : SVGControls {
        if (!SVGControls._instance) {
            SVGControls._instance = new SVGControls();
        }

        return SVGControls._instance;
    }

    pageLoad() {
        SVGMap.instance.onDrawn = function() {
            $("#progress").css({
                display: 'none'
            });
            
            let backgroundTextColor = Cookies.get('backgroundTextColor') || '#FFFFFF';
            let backgroundTextColorOpacity = parseInt(<any>Cookies.get('backgroundTextColorOpacity')) / 100 || 0;


            $(SVGMap.instance.container + '#bgFilter feFlood').attr('flood-color', <any>backgroundTextColor);
            $(SVGMap.instance.container + '#bgFilter feFlood').attr('flood-opacity', <any>backgroundTextColorOpacity);
        
            setTimeout(function() {
                SVGMap.instance.groupMarkers();
            }, 1000);
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
                /*
                    En Android, la transcripción llega dos veces.
                    Para evitar dar respuesta las dos veces, vamos
                    a ignorar toda transcripción que sea igual a la
                    anterior en un intervalo de X segundos.
                */
                
                if (transcript == this.lastSentence) {
                    console.log('Discarding', transcript);
                    return;
                };

                this.lastSentence = transcript;
                setTimeout(() => {
                    this.lastSentence = null;
                }, 1000);
                
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
                            const digit = (parseInt(parsed.item) == NaN) ? this.toDigit(parsed.item) : parseInt(parsed.item);
                            this.onSearchResultSelected(digit);
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

                        case 'shutdown':
                            SVGVoiceControls.setOn(false);
                            this.voice.stop();
        
                            $(this).attr('data-dictating', 'false');
                            $(this).removeClass("active");
                            $("#dictateStatus").html("Haz click para comenzar a escuchar");
            
                            SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.',  null, () => {});

                            return;

                        default:
                            this.navigationHandler(parsed.direction);
                            return;
                    }
                }
            });
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



    toDigit(text) {
        text = normalizar(text);
    
        let tmp = cifra(text);
        if (tmp) return tmp;
    
        tmp = irregular(text);
        if (tmp) return tmp;
    
        tmp = multiplo(text);
        if (tmp) return tmp;
    
        tmp = compuesto(text);
        if (tmp) return tmp;
    
        return -1;
    }
}

const cifras = ["uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
const irregulares = ["once", "doce", "trece", "catorce", "quince", "", "", "", "", "veinte"];
const multiplos = ["dieci", "veinti"];
const compuestos = ["treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

function normalizar(text) {
    return text.toLowerCase()
            .replace("á", "a")
            .replace("é", "e")
            .replace("í", "i")
            .replace("ó", "o")
            .replace("ú", "u");
}

function cifra(text) {
    for (let i = 0; i < cifras.length; i++) {
        if (cifras[i] === text) {
            return i + 1;
        }
    }

    return null;
}

function irregular(text) {
    for (let i = 0; i < irregulares.length; i++) {
        if (irregulares[i] === text) {
            return i + 11;
        }
    }

    return null;
}

function multiplo(text) {
    for (let i = 0; i < multiplos.length; i++) {
        let m = multiplos[i];
        let p = text.indexOf(m);
        if (p != -1) {
            console.log('Pasando por cifra()', text.substr(p + m.length, text.length - p), m.length, text.length - 1);
            let tmp = cifra(text.substr(p + m.length, text.length - p));
            console.log('cifra', tmp);
            return ((i + 1) * 10) + tmp;
        }
    }

    return null;
}

function compuesto(text) {
    for (let i = 0; i < compuestos.length; i++) {
        let c = compuestos[i];
        let p = text.indexOf(c);

        if (p != -1) {
            let q = text.indexOf("y");
            console.log(q, p, p + c.length);
            if (q - (p + c.length) != 1) {
                return (i + 1) * 10;
            } else {
                let tmp = cifra(text.substr(q + 2, text.length));
                return ((i + 3) * 10) + tmp;
            }
        }
    }
}