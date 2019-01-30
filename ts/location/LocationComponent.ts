import { SVGMap } from "../SVG/SVGMap.js";
import { rotar } from "../route/math.js";

function lookingAt(x : number, y : number, orientation : number) : string {
    const distancia = 300;   
    // Rotamos el punto final de la linea
    let [rx, ry] = rotar(x, y - distancia, x, y, orientation);

    let m = (ry - y) / (rx - x);
    let eq = (v) => { return (m*v) - (m*x) + y; }

    // Encontramos el edificio de referencia
    for (let eqx = x; eqx <= (x + distancia); eqx++) {
        let eqy = eq(eqx);
        let foundf = null;

        for (const feature of SVGMap.instance.svg.select('.feature-object').members) {
            if (feature.inside(eqx, eqy)) {
                foundf = feature;
                break;
            }
        }

        if (foundf != null) {
            return $(foundf.node).attr('data-name');
        }
    }

    return null;
}

function vote(element) {
    let orientation = parseFloat($(element).attr('data-orientation'));
    let x = parseFloat($(element).attr('data-x'));
    let y = parseFloat($(element).attr('data-y'));

    let votes = {};

    for (let i = -1; i < 2; i++) {
        let result = lookingAt(x, y, orientation + (i * 10))
        if (result != null) {
            if (votes[result] == undefined) {
                votes[result] = 1;
            } else {
                votes[result] = votes[result] + 1;
            }
        }
    }

    let winner = null, maxVotes = 0;
    for (const participant of Object.keys(votes)) {
        if (votes[participant] > maxVotes) {
            maxVotes = votes[participant];
            winner = participant;
        }
    }

    return winner;
}

export function observeOrientation(map, callback) {
    let accum = 4;

    console.log('Adding listener to', map);
    let observer = new MutationObserver((list) => {
        for (const mutation of list) {
            if (mutation.type === 'attributes') {
                let element = mutation.target;
                if ($(element).attr('id') === 'orientationArrow') {
                    if (accum != 4) { accum++; return; }
                    accum = 0;
                    let foundf = vote(element);

                    callback(foundf);
                }
            }
        }
    });

    observer.observe(map, { attributes: true, childList: false, subtree: true });
}