import { main_grammar } from './grammar/main.js';

export class SVGVoiceControls {
    constructor() {
        this.list = new webkitSpeechGrammarList();
        this.list.addFromString(main_grammar);

        this.voice = new webkitSpeechRecognition();
        this.voice.lang = 'es-ES';
        this.voice.interimResults = false;
        this.voice.maxAlternatives = 1;
        this.voice.continuous = true;
        this.voice.grammars = this.list;
    }

    static compatible() {
        return ((typeof SpeechRecognition != 'undefined') || (typeof webkitSpeechRecognition != 'undefined'));
    }

    start(callback) {
        this.voice.onresult = (event) => {
            var last = event.results.length - 1;
            console.log(event.results[last]);
            var transcript = event.results[last][0].transcript;
            callback({confidence: event.results[0][0].confidence, transcript: transcript });
        }

        this.voice.start();

        console.log("Voice started...");
    }

    stop() {
        this.voice.stop();
    }

    parseAction(sentence) {
        // Primero probamos pan
        const pan = /(mover) (mapa )?(a |hacia |para )?(la derecha|la izquierda|arriba|abajo)/i;
        var parsed = sentence.match(pan);
        console.log(parsed);
        
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

            return mode;
        }

        // Probamos zoom
        const zoom = /(alejar|acercar)( mapa)?/i;
        var parsed = sentence.match(zoom);

        if (parsed != null) {
            let [, action] = parsed;
            return (action == 'acercar') ? 'zoom-in' : 'zoom-out'; 
        }
    }
}