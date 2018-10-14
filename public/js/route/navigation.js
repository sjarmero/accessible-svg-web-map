import { angulo, perspectiva, toDeg, toRad, modulo} from './math.js';
import { SVGMap } from '/js/map/SVG/SVGMap.js';

let guide = [];
export function navigationMode(data) {
    $("#SVG_MAIN_CONTENT #route").empty();

    let a = {x: data[0].vcenterx, y: data[0].vcentery};
    let p = {x: data[1].vcenterx, y: data[1].vcentery};

    // Centrar mapa en primer punto
    SVGMap.instance.zoomAndMove(a.x, a.y, 15);

    // Rotar el mapa para mirar al primer destino
    let rotacionMapa = perspectiva(p, a);
    let ajuste = toDeg(angulo(p, a));
    if (rotacionMapa == 90) { ajuste = 90 - ajuste; }
    if (rotacionMapa == 270) { ajuste = 90 - ajuste; }

    $("#map svg #SVG_MAIN_CONTENT").css({
        'transform-origin': `${a.x}px ${a.y}px`,
        'transform': `rotateX(-45deg) rotateZ(${rotacionMapa + ajuste}deg)`
    });

    $("#map svg #SVG_MAIN_CONTENT .map-marker").each(function(e) {
        $(this).css({
            'transform-origin': `${$(this).find('text').attr('x')}px ${$(this).find('text').attr('y')}px`,
            'transform': `rotateX(0deg) rotateZ(-${rotacionMapa + ajuste}deg)`
        });
    });

    SVGMap.instance.zoomAndMove(a.x, a.y, 15);

    /* Calculamos la guia:
        - Adoptamos los POI en la ruta
        - Determinamos los giros en cada paso
        - Juntamos pasos con mismo giro
    */

    let lastRotacion = -1;
    guide = [];
    for (let i = 0; i < data.length; i++) {
        console.log('i', i, data[i], data[i+1]);

        if ((i + 1) == data.length) {
            guide.push(data[i]);
            guide[guide.length - 1].direction = -1;
            guide[guide.length - 1].distance = modulo({x: a.x - guide[guide.length - 1].vcenterx, y: a.y - guide[guide.length - 1].vcentery})
            
            break;
        }

        a = {x: data[i].vcenterx, y: data[i].vcentery};
        p = {x: data[i+1].vcenterx, y: data[i+1].vcentery};

        rotacionMapa = perspectiva(p, a);
        ajuste = toDeg(angulo(p, a));
        if (rotacionMapa == 90) { ajuste = 90 - ajuste; }
        if (rotacionMapa == 270) { ajuste = 90 - ajuste; }

        let giro = rotacionMapa - lastRotacion;

        let direction = 0;
        if (giro == 0) {
            direction = 0; // Recto
        } else if (giro == 90) {
            direction = 1; // Izquierda
        } else if (giro == -90) {
            direction = 2; // Derecha;
        }

        let added = 0;
        if (data[i].iid != null && data[i].iid.length > 0) {
            for (let j = 0; j < data[i].iid.length; j++) {
                let poi = {x: data[i].icenterx[j], y: data[i].icentery[j]}
                let poip = perspectiva(poi, a);
                let giro = poip - lastRotacion;
                ajuste = toDeg(angulo(poi, a));
                if (poip == 90) { ajuste = 90 - ajuste; }
                if (poip == 270) { ajuste = 90 - ajuste; }

                console.log('poia', ajuste);
                
                if (ajuste > 20) { continue; }

                if (giro == 90) {
                    // Izquierda
                    guide.push(data[i]);
                    guide[guide.length - 1].direction = direction;
                    guide[guide.length - 1].distance = modulo({x: p.x - a.x, y: p.y - a.y});
                    guide[guide.length - 1].poi = true;
                    guide[guide.length - 1].poidirection = 1;
                    guide[guide.length - 1].poiname = data[i].iname[j];

                    added++;

                    break;
                } else if (giro == -90) {
                    // Derecha;
                    guide.push(data[i]);
                    guide[guide.length - 1].direction = direction;
                    guide[guide.length - 1].distance = modulo({x: p.x - a.x, y: p.y - a.y});
                    guide[guide.length - 1].poi = true;
                    guide[guide.length - 1].poidirection = 2;
                    guide[guide.length - 1].poiname = data[i].iname[j];

                    added++;

                    break;
                }
            }
        } 
        
        if (rotacionMapa == lastRotacion) {
            let ls = guide.length - 1;
            guide[ls].distance = guide[ls].distance + modulo({x: p.x - a.x, y: p.y - a.y});
        } else if (added == 0) {
            guide.push(data[i]);
            guide[guide.length - 1].direction = direction;
            guide[guide.length - 1].distance = modulo({x: p.x - a.x, y: p.y - a.y});
            guide[guide.length - 1].poi = false;
        }

        lastRotacion = rotacionMapa;
    }

    // Dibujar ruta
    let svg = SVGMap.instance.svg;
    const gm = svg.select('#SVG_MAIN_CONTENT').members[0].group().attr('id', 'route');
    const polyline = [];
    let count = 1;

    console.log('guide', guide);

    for (const step of guide) {
        let {vcenterx, vcentery} = step;

        const circle = gm.circle().radius(5);
        circle.cx(vcenterx);
        circle.cy(vcentery);
        circle.fill('#1A237E');
        circle.attr('id', 'step-circle-' + count);

        polyline.push([vcenterx], [vcentery]);

        count++;
    }

    gm.polyline(polyline).fill('transparent').stroke({width: 3, color: '#1A237E'}).back();

    $(".route-steps").empty();
    let i = 1;
    for (const step of guide) {
        let stepDiv = document.createElement('div');
        let stepSpan = document.createElement('span'); 

        let order = `<span class='sr-only'>Paso número ${i}.</span>`;

        if (step.poi == true) {
            order += `Tienes ${step.poiname} a la ${(step.poidirection == 1 ? 'izquierda' : 'derecha')}. `;
        }

        switch (step.direction) {
            case 0:
                order += `Camina <span class="steps-expression" data-steps='${Math.ceil(step.distance)}'>${Math.ceil(step.distance)} pasos</span> hacia delante`;
                break;

            case 1:
                order += `Gira a la izquierda y camina <span class="steps-expression" data-steps='${Math.ceil(step.distance)}'>${Math.ceil(step.distance)} pasos</span>`;
                break;

            case 2:
                order += `Gira a la derecha y camina <span class="steps-expression" data-steps='${Math.ceil(step.distance)}'>${Math.ceil(step.distance)} pasos</span>`;
                break;

            case -1:
                order += `Has llegado a tu destino`;
                break;
        }

        $(stepSpan).html(order);

        $(stepDiv).append(stepSpan);
        $(stepDiv).addClass('route-step');
        $(stepDiv).attr('role', 'listitem');
        $(stepDiv).attr('tabindex', '0');
        $(stepDiv).attr('data-step', i);

        $(".route-steps").append(stepDiv);

        i++;
    }

    $("#metricUnitSelect").on('change', function(e) {
        $(".steps-expression").each(function() {
            let steps = $(this).attr('data-steps');

            if ($("#metricUnitSelect").val() == 0) {
                $(this).html(`${steps} pasos`);
            } else {
                let meters = steps / 2;
                $(this).html(`${meters} metros`);
            }
        });
    });

    $(".route-steps .route-step").on('focus', function(e) {
        // TODO: Mover al punto el mapa cuando el paso se seleccione        
    });

    $(".route-steps .route-step:first").trigger('focus');
}