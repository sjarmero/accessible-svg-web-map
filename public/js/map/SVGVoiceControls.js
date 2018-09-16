import { main_grammar } from './grammar/main.js';

/*
    Clase que engloba funciones de síntesis
    y reconocimiento de voz.
*/

const time_per_word = 500;

export class SVGVoiceControls {
    constructor() {
        // Synth
        if (SVGVoiceControls.compatible()) {
            this.list = new webkitSpeechGrammarList();
            this.list.addFromString(main_grammar);

            this.voice = new webkitSpeechRecognition();
            this.voice.lang = 'es-ES';
            this.voice.interimResults = false;
            this.voice.maxAlternatives = 1;
            this.voice.grammars = this.list;
            this.voice.continuous = true;
            this.on = false;
        }

        // Speech
        this.container = document.getElementById('speech');
    }

    static compatible() {
        return ((typeof SpeechRecognition != 'undefined') || (typeof webkitSpeechRecognition != 'undefined'));
    }

    // Speech
    say(sentence) {
        this.stop();
        this.container.innerHTML = "";
        this.container.innerHTML = sentence;

        setTimeout(() => {
            this.start(this.onTranscript);
        }, (time_per_word) * (sentence.split(" ").length));
    }

    // Synth

    start(callback) {
        this.onTranscript = callback;

        this.voice.onresult = (event) => {
            this.voice.stop();

            var last = event.results.length - 1;
            console.log(event.results[last]);
            var transcript = event.results[last][0].transcript;
            callback({confidence: event.results[0][0].confidence, transcript: transcript });
        }

        this.voice.onend = (event) => {
            if (this.on) {
                this.start(callback);
            }
        }

        try {
            this.voice.start();
        } catch (e) {}

        this.on = true;

        console.log("Voice started...");
    }

    stop() {
        this.voice.stop();
        this.on = false;
    }

    parseAction(sentence) {
        // Anti bucle
        if (sentence.match(/(No te he entendido)|(El mapa está ahora escuchando)/i)) return {};

        // Primero probamos pan
        const pan = /(mover) (mapa |mapas |plano )?(a |hacia |para )?(la derecha|la izquierda|arriba|abajo)/i;
        var parsed = sentence.match(pan);
        
        if (parsed != null) {
            let [, action, , , direction] = parsed;
            console.log(action, direction);

            let mode;
            switch (direction) {
                case 'la derecha':
                    mode = 'right';
                    break;

                case 'la izquierda':
                    mode = 'left';
                    break;

                case 'arriba':
                    mode = 'up';
                    break;

                case 'abajo':
                    mode = 'down';
                    break;
            }

            return {action: 'move', mode: mode};
        }

        // Probamos zoom
        const zoom = /(alejar|acercar)( mapa)?/i;
        var parsed = sentence.match(zoom);

        if (parsed != null) {
            let [, action] = parsed;
            return {action: 'zoom', mode: (action == 'acercar') ? 'zoom-in' : 'zoom-out'}; 
        }
        
        // Probamos búsqueda
        const search = /(buscar) ([\w | \d]+)+/i
        var parsed = sentence.match(search);
        if (parsed != null) {
            let [,, query] = parsed;
            return {action: 'search', mode: query};
        }

        // Probamos selección
        const selection = /(seleccionar |elegir |escoger |ver )(número |resultado )*(\w+)+/i;
        var parsed = sentence.match(selection);
        console.log(parsed);
        if (parsed != null) {
            let [,,, number] = parsed;
            return {action: 'select', mode: number};
        }

        //
        const aramis = /(aramis fuster)/i;
        if (sentence.match(aramis)) return {action: 'aramis'};

        // "No te he entendido"
        return {action: 'unknown'}
    }
}