/*
    Clase que engloba funciones de síntesis
    y reconocimiento de voz.
*/
import { voiceParse } from './SVGVoicePatterns.js';

declare var webkitSpeechGrammarList, webkitSpeechRecognition;

class Queue<T> {
    private base : T[];
    
    constructor() {
        this.base = [];
    }

    front() {
        if (this.base.length > 0) {
            return this.base.shift();
        } else {
            return null;
        }
    }

    push(e : any) {
        this.base.push(e);
    }

    length() {
        return this.base.length;
    }
}

interface SpeechOrder {
    sentence : String;
    callback : Function;
    voiceInit : Function;
}

export class SVGVoiceControls {
    public static readonly time_per_word : number = 550;

    private static on : boolean = false;

    private list : any;
    private voice : any;
    private container : any;
    public onTranscript : any;

    private tts : Queue<SpeechOrder>;
    private work : any;
    private prevOn : boolean;
    private savedPrev : boolean;

    constructor() {
        console.log('Creating SVGVoiceControls');
        // Synth
        if (SVGVoiceControls.compatible()) {
            this.list = new webkitSpeechGrammarList();
            this.list.addFromString('');

            this.voice = new webkitSpeechRecognition();
            this.voice.lang = 'es-ES';
            this.voice.interimResults = false;
            this.voice.maxAlternatives = 1;
            this.voice.grammars = this.list;
            this.voice.continuous = true;
        }

        // Speech
        this.container = document.getElementById('speech');

        this.tts = new Queue();
        this.resetWorker(250);
    }

    static compatible() {
        return ((typeof SpeechRecognition != 'undefined') || (typeof webkitSpeechRecognition != 'undefined'));
    }

    static isOn() {
        return this.on;
    }

    static setOn(v) {
        this.on = v;
    }

    resetWorker(time) {
        if (this.work) {
            clearInterval(this.work);
        }

        this.work = setInterval(() => {
            if (!this.savedPrev) {
                console.log('Saving state', SVGVoiceControls.isOn());
                this.prevOn = SVGVoiceControls.isOn();
                this.savedPrev = true;
            }

            const order = this.tts.front();
            if (order) {
                this.pronounce(order);
            }
        }, time);
    }

    // Speech

    say(sentence : String, callback : Function = null, voiceInitOverride : Function = null) {
        this.tts.push({
            sentence: sentence,
            callback: callback,
            voiceInit: voiceInitOverride
        });
    }

    pronounce(order : SpeechOrder) {
        console.log('Pronounce', order);
        SVGVoiceControls.setOn(false);
        this.stop();
        this.container.innerHTML = "";

        let time = (SVGVoiceControls.time_per_word) * (order.sentence.split(" ").length);
        this.resetWorker(time + (2 * SVGVoiceControls.time_per_word));

        setTimeout(() => {
            this.container.innerHTML = order.sentence;
        }, 150);

        setTimeout(() => {
            if (this.tts.length() == 0) {
                if (order.voiceInit) {
                    this.onTranscript = null;
                    this.stop();
                    order.voiceInit();
                } else {
                    SVGVoiceControls.setOn(this.prevOn);
                    if (order.callback) order.callback();
                    this.start(this.onTranscript);
                }

                this.savedPrev = false;
            } else {
                if (order.callback){
                    order.callback();
                }
            }
        }, time + 300);
    }

    // Synth

    start(callback) {
        if (!SVGVoiceControls.isOn()) return;

        this.onTranscript = callback;

        this.voice.onresult = (event) => {
            console.log('Voice result!');
            var last = event.results.length - 1;
            var transcript = event.results[last][0].transcript;
            var confidence = event.results[last][0].confidence;

            if (confidence >= 0.75) {
                transcript = transcript.trim();
                console.log("Calling transcript callback with", [transcript]);
                this.onTranscript({confidence: confidence, transcript: transcript });
            } else {
                console.log("Ignoring because of low confidence:");
                console.log(`(${confidence}) ${transcript}`);
            }
        }

        this.voice.onend = () => {
            console.log('Voice end and on=' + SVGVoiceControls.isOn());
            if (SVGVoiceControls.isOn()) {
                setTimeout(() => {
                    this.voice.start();
                }, 1000);
            }
        }

        try {
            this.voice.start();
        } catch (e) {}

        console.log("Voice started...");
    }

    stop() {
        this.voice.stop();
    }

    wait(time : number) {
        console.log('Wait', time);
        SVGVoiceControls.setOn(false);
        this.voice.stop();

        setTimeout(() => {
            console.log('Wait over');
            SVGVoiceControls.setOn(true);
            this.start(this.onTranscript);
        }, time + 300);
    }

    parseAction(sentence) {
        let parsed = voiceParse(sentence);
        if (parsed.name == 'move') {
            switch (parsed.direction) {
                case 'la derecha':
                    parsed.direction = 'right';
                    break;

                case 'la izquierda':
                    parsed.direction = 'left';
                    break;

                case 'arriba': 
                    parsed.direction = 'up';
                    break;

                case 'abajo':
                    parsed.direction = 'down';
                    break;

                default:
                    parsed.direction = null;
                    break;
            }
        } else if (parsed.action === 'zoom') {
            switch (parsed.direction) {
                case 'alejar':
                    parsed.direction = 'zoom-out';
                    break;

                case 'acercar':
                    parsed.direction = 'zoom-in';
                    break;

                default:
                    parsed.direction = null;
                    break;
            }
        }

        return parsed;
    }
}