const SVGVoiceGrammars = [
    {
        name: 'antiloop',
        pattern: /^(No te he entendido)|(El mapa está ahora escuchando)/i,
        extract: []
    },

    {
        name: 'move',
        pattern: /^(mover) (mapa |mapas |plano )?(a |hacia |para )?(la derecha|la izquierda|arriba|abajo)/i,
        extract: [
            { name: 'direction', position: 4 }
        ]
    },

    {
        name: 'zoom',
        pattern: /^(alejar|acercar)( mapa)?/i,
        extract: [
            { name: 'direction', position: 1 }
        ]
    },

    {
        name: 'search',
        pattern: /^(buscar) ([\w | \d]+)+/i,
        extract: [
            { name: 'query', position: 2 }
        ]
    },

    {
        name: 'select',
        pattern: /^(seleccionar |elegir |escoger |ver )(número |resultado )*(\w+)+/i,
        extract: [
            { name: 'item', position: 3 }
        ]
    },

    {
        name: 'access-routes',
        pattern: /^((acceder a)|(acceso a)|(ir a)) (((cálculo de)|(calcular)|(calculo de))+ )*(ruta)/i,
        extract: []
    },

    {
        name: 'route',
        pattern: /^((ir )|(calcular ruta ))*desde ((\w|\d| )+) hasta ((\w|\d| )+)/i,
        extract: [
            { name: 'origin', position: 4},
            { name: 'target', position: 6}
        ]
    },

    {
        name: 'repeatStep',
        pattern: /^(repetir|volver) (paso|a decir)/i,
        extract: []
    },

    {
        name: 'readStep',
        pattern: /^(decir paso número)+ (\d+)/i,
        extract: [
            { name: 'stepNo', position: 2 }
        ]
    },

    {
        name: 'nextStep',
        pattern: /^siguiente paso/i,
        extract: []
    },

    {
        name: 'previousStep',
        pattern: /^paso anterior/i,
        extract: []
    },

    {
        name: 'orientation',
        pattern: /^(hacia d(ó|o)nde estoy mirando)/i,
        extract: []
    },

    {
        name: 'shutdown',
        pattern: /^(apagar|dejar de escuchar)/i,
        extract: []
    }
];

export function voiceParse(sentence) : any {
    for (const grammar of SVGVoiceGrammars) {
        let structure = sentence.match(grammar.pattern);
        if (structure != null) {
            let result = { name: grammar.name };
            for (const flag of grammar.extract) {
                result[flag.name] = structure[flag.position];
            }

            return result;
        }
    }

    return {
        name: 'unknown'
    };
}