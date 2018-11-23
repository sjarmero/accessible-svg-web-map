/*
    Clase que engloba funciones de síntesis
    y reconocimiento de voz.
*/
import { voiceParse } from './SVGVoicePatterns.js';

declare var webkitSpeechGrammarList, webkitSpeechRecognition;

class Queue {
    private base : any[];
    
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

export class SVGVoiceControls {
    readonly time_per_word : number = 500;

    private static on : boolean = false;

    private list : any;
    private voice : any;
    private container : any;
    public onTranscript : any;

    private tts : Queue;
    private work : any;

    constructor() {
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
        console.log('this.tts', this.tts);
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
            console.log('Reset to', time);
            clearInterval(this.work);
        }

        this.work = setInterval(() => {
            const sentence = this.tts.front();
            if (sentence) {
                this.pronounce(sentence);
            }
        }, time);
    }

    // Speech

    say(sentence) {
        this.tts.push(sentence);
    }

    pronounce(sentence) {
        let prevOn = SVGVoiceControls.isOn();
        SVGVoiceControls.setOn(false);
        this.stop();
        this.container.innerHTML = "";

        let time = (this.time_per_word) * (sentence.split(" ").length);
        this.resetWorker(time + (2 * this.time_per_word));
        setTimeout(() => {
            SVGVoiceControls.setOn(prevOn);
            this.start(this.onTranscript);
        }, time);

        this.container.innerHTML = sentence;
    }

    // Synth

    start(callback) {
        console.log(SVGVoiceControls.isOn());
        if (!SVGVoiceControls.isOn()) return;

        this.onTranscript = callback;

        this.voice.onresult = (event) => {
            this.voice.stop();

            var last = event.results.length - 1;
            var transcript = event.results[last][0].transcript;
            var confidence = event.results[last][0].confidence;

            if (confidence >= 0.75) {
                callback({confidence: confidence, transcript: transcript });
            } else {
                console.log("Ignoring because of low confidence:");
                console.log(`(${confidence}) ${transcript}`);
            }
        }

        this.voice.onend = function() {
            console.log('Voice end and on=' + SVGVoiceControls.isOn());
            if (SVGVoiceControls.isOn()) {
                setTimeout(() => {
                    this.start(callback);
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

    parseAction(sentence) {
        let parsed = voiceParse(sentence);
        console.log(parsed);
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