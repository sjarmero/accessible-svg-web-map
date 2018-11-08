"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGVoiceGrammars = [
    {
        name: 'antiloop',
        pattern: /(No te he entendido)|(El mapa está ahora escuchando)/i,
        extract: []
    },
    {
        name: 'move',
        pattern: /(mover) (mapa |mapas |plano )?(a |hacia |para )?(la derecha|la izquierda|arriba|abajo)/i,
        extract: [
            { name: 'direction', position: 4 }
        ]
    },
    {
        name: 'zoom',
        pattern: /(alejar|acercar)( mapa)?/i,
        extract: [
            { name: 'direction', position: 1 }
        ]
    },
    {
        name: 'search',
        pattern: /(buscar) ([\w | \d]+)+/i,
        extract: [
            { name: 'query', position: 2 }
        ]
    },
    {
        name: 'select',
        pattern: /(seleccionar |elegir |escoger |ver )(número |resultado )*(\w+)+/i,
        extract: [
            { name: 'item', position: 3 }
        ]
    },
    {
        name: 'access-routes',
        pattern: /i((acceder a)|(acceso a)|(ir a)) (((cálculo de)|(calcular)|(calculo de))+ )*(ruta)/i,
        extract: []
    },
    {
        name: 'route',
        pattern: /((ir )|(calcular ruta ))*desde ((\w|\d| )+) hasta ((\w|\d| )+)/i,
        extract: [
            { name: 'origin', position: 4 },
            { name: 'target', position: 6 }
        ]
    }
];
function voiceParse(sentence) {
    for (var _i = 0, SVGVoiceGrammars_1 = SVGVoiceGrammars; _i < SVGVoiceGrammars_1.length; _i++) {
        var grammar = SVGVoiceGrammars_1[_i];
        var structure = sentence.match(grammar.pattern);
        if (structure != null) {
            var result = { name: grammar.name };
            for (var _a = 0, _b = grammar.extract; _a < _b.length; _a++) {
                var flag = _b[_a];
                result[flag.name] = structure[flag.position];
            }
            return result;
        }
    }
    return {
        name: 'unknown'
    };
}
exports.voiceParse = voiceParse;
