/*
    Clase que engloba funciones de síntesis
    y reconocimiento de voz.
*/
import { voiceParse } from './SVGVoicePatterns';

declare var webkitSpeechGrammarList, webkitSpeechRecognition, cvox;

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
    private ear : any;
    private container : any;
    public onTranscript : any;

    private voice : any;
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

            this.ear = new webkitSpeechRecognition();
            this.ear.lang = 'es-ES';
            this.ear.interimResults = false;
            this.ear.maxAlternatives = 1;
            this.ear.grammars = this.list;
            this.ear.continuous = true;
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

    static isChromevoxActive() : boolean {
        return document.querySelectorAll(".cvox_indicator_container").length > 0;
    }

    createUtterance(sentence : String) {
        let voice : any = new SpeechSynthesisUtterance();
        voice.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Google español'; })[0];
        voice.voiceURI = 'native';
        voice.volume = 1; // 0 to 1
        voice.rate = 1; // 0.1 to 10
        voice.pitch = 0; //0 to 2
        voice.lang = 'es-ES';
        voice.text = sentence;

        return voice;
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
        if (SVGVoiceControls.isChromevoxActive()) cvox.Api.internalDisable();
        this.container.innerHTML = "";

        let time = (SVGVoiceControls.time_per_word) * (order.sentence.split(" ").length);
        this.resetWorker(time + (2 * SVGVoiceControls.time_per_word));

        setTimeout(() => {
            if (SVGVoiceControls.isChromevoxActive()) {
                this.container.innerHTML = order.sentence
            } else {
                speechSynthesis.speak(this.createUtterance(order.sentence));
            }
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

        this.ear.onresult = (event) => {
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

        this.ear.onend = () => {
            console.log('Voice end and on=' + SVGVoiceControls.isOn());
            if (SVGVoiceControls.isOn()) {
                setTimeout(() => {
                    if (SVGVoiceControls.isOn()) {
                        this.ear.start();
                    }
                }, 1000);
            }
        }

        try {
            this.ear.start();
        } catch (e) {}

        console.log("ear started...");
    }

    stop() {
        this.ear.stop();
    }

    wait(time : number) {
        console.log('Wait', time);
        SVGVoiceControls.setOn(false);
        this.ear.stop();

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
