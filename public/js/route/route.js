import { setupEvents } from '/js/map/events.js';
import { setupRouteEvents } from './events.js';
import { SVGMap } from '/js/map/SVG/SVGMap.js';
import { rotar } from './math.js';

$(document).ready(function() {
    setupEvents();
    setupRouteEvents();

    let accum = 150;
    let observer = new MutationObserver((list) => {
        for (const mutation of list) {
            if (mutation.type === 'attributes') {
                let element = mutation.target;
                if ($(element).attr('id') === 'orientationg') {
                    let orientation = $(element).attr('data-orientation');
                    let x = parseFloat($(element).attr('data-x'));
                    let y = parseFloat($(element).attr('data-y'));

                    let orientationl = $('#orientationLine');
                    if (orientationl.length == 0) {
                        let line = SVGMap.instance.svg.line(x, y, x, y).stroke({ width: 0 }).fill('black');
                        line.attr('id', 'orientationLine');
                        line.front();
                    } else {
                        // Rotamos el punto final de la linea
                        let [rx, ry] = rotar(x, y - 300, x, y, orientation);

                        orientationl.attr('x1', x);
                        orientationl.attr('x2', rx);
                        orientationl.attr('y1', y);
                        orientationl.attr('y2', ry);
                    }

                    // Encontramos el edificio de referencia
                    if (accum === 150) {
                        console.log('Orientando...');
                        accum = 0;
                        let x2 = orientationl.attr('x2');
                        let y2 = orientationl.attr('y2');

                        let m = (y2 - y) / (x2 - x);
                        let eq = (v) => { return (m*v) - (m*x) + y; }

                        for (let eqx = x; eqx <= (x + 150); eqx++) {
                            let eqy = eq(eqx);
                            let foundf = null;

                            for (const feature of SVGMap.instance.svg.select('.feature-object').members) {
                                if (feature.inside(eqx, eqy)) {
                                    foundf = feature;
                                    break;
                                }
                            }

                            if (foundf != null) {
                                console.log('Orientado a', foundf);

                                $('.route-steps .route-orientation').remove();

                                let stepDiv = document.createElement('div');
                                let stepSpan = document.createElement('span'); 

                                let order = `<span class='sr-only'>Información sobre tu orientación.</span>
                                    Estás mirando hacia ${$(foundf.node).attr('data-name')}.
                                `;

                                $(stepSpan).html(order);
                                $(stepDiv).append(stepSpan);
                                $(stepDiv).addClass('route-step route-orientation');
                                $(stepDiv).attr('role', 'listitem');
                                $(stepDiv).attr('tabindex', '0');
                                $(stepDiv).attr('data-step', -1);

                                $(".route-steps").prepend(stepDiv);
                            }
                        }
                    }

                    accum++;
                }
            }
        }
    });

    observer.observe($(SVGMap.instance.container).get(0), { attributes: true, childList: false, subtree: true });
});