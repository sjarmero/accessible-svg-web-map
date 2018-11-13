/*
    Clase que engloba funciones de síntesis
    y reconocimiento de voz.
*/
import { voiceParse } from './SVGVoicePatterns.js';
var SVGVoiceControls = /** @class */ (function () {
    function SVGVoiceControls() {
        this.time_per_word = 500;
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
    }
    SVGVoiceControls.compatible = function () {
        return ((typeof SpeechRecognition != 'undefined') || (typeof webkitSpeechRecognition != 'undefined'));
    };
    SVGVoiceControls.isOn = function () {
        return this.on;
    };
    SVGVoiceControls.setOn = function (v) {
        this.on = v;
    };
    // Speech
    SVGVoiceControls.prototype.say = function (sentence) {
        var _this = this;
        var prevOn = SVGVoiceControls.isOn();
        SVGVoiceControls.setOn(false);
        this.stop();
        this.container.innerHTML = "";
        this.container.innerHTML = sentence;
        setTimeout(function () {
            SVGVoiceControls.setOn(prevOn);
            _this.start(_this.onTranscript);
        }, (this.time_per_word) * (sentence.split(" ").length));
    };
    // Synth
    SVGVoiceControls.prototype.start = function (callback) {
        var _this = this;
        console.log(SVGVoiceControls.isOn());
        if (!SVGVoiceControls.isOn())
            return;
        this.onTranscript = callback;
        this.voice.onresult = function (event) {
            _this.voice.stop();
            var last = event.results.length - 1;
            var transcript = event.results[last][0].transcript;
            var confidence = event.results[last][0].confidence;
            if (confidence >= 0.75) {
                callback({ confidence: confidence, transcript: transcript });
            }
            else {
                console.log("Ignoring because of low confidence:");
                console.log("(" + confidence + ") " + transcript);
            }
        };
        this.voice.onend = function () {
            var _this = this;
            console.log('Voice end and on=' + SVGVoiceControls.isOn());
            if (SVGVoiceControls.isOn()) {
                setTimeout(function () {
                    _this.start(callback);
                }, 1000);
            }
        };
        try {
            this.voice.start();
        }
        catch (e) { }
        console.log("Voice started...");
    };
    SVGVoiceControls.prototype.stop = function () {
        this.voice.stop();
    };
    SVGVoiceControls.prototype.parseAction = function (sentence) {
        var parsed = voiceParse(sentence);
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
        }
        else if (parsed.action === 'zoom') {
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
    };
    SVGVoiceControls.on = false;
    return SVGVoiceControls;
}());
export { SVGVoiceControls };
