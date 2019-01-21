import { angulo, perspectiva, toDeg, modulo} from './math.js';
import { SVGMap } from '../SVG/SVGMap.js';
import { Settings } from "../settings/defaults.js";

declare var Cookies, proj4;

const STEP_FACTOR = Cookies.get('stepLength') || Settings.stepLenght;

let guide = [];
export function navigationMode(path) {
    const data = path.data;

    $(SVGMap.instance.container).find('#route').empty();

    let a = {x: data[0].vcenterx, y: data[0].vcentery};
    let p = {x: data[1].vcenterx, y: data[1].vcentery};

    // Centrar mapa en primer punto
    // SVGMap.instance.zoomAndMove(a.x, a.y, 15);

    // Rotar el mapa para mirar al primer destino
    let rotacionMapa = perspectiva(p, a);
    let originalRotacion = rotacionMapa;
    let ajuste = toDeg(angulo(p, a));
    if (rotacionMapa == 90) { ajuste = 90 - ajuste; }
    if (rotacionMapa == 270) { ajuste = 90 - ajuste; }

    /*$("#map svg #rootGroup").css({
        'transform-origin': `${a.x}px ${a.y}px`,
        'transform': `rotateX(-45deg) rotateZ(${rotacionMapa + ajuste}deg)`
    });

    $("#map svg #rootGroup .map-marker").each(function(e) {
        $(this).css({
            'transform-origin': `${$(this).find('text').attr('x')}px ${$(this).find('text').attr('y')}px`,
            'transform': `rotateX(0deg) rotateZ(-${rotacionMapa + ajuste}deg)`
        });
    });*/


    /* Calculamos la guia:
        - Nombramos la entrada donde situarse
        - Adoptamos los POI en la ruta
        - Determinamos los giros en cada paso
        - Juntamos pasos con mismo giro
    */

    let lastRotacion = path.entrance[0].looksat;
    guide = [];

    for (let i = 0; i < data.length; i++) {

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
        
        if (rotacionMapa == lastRotacion && guide.length > 0) {
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
    const latlngs = [];
    const circles = [];

    for (const step of guide) {
        let ovx = step.vcenterx;
        let ovy = step.vcentery;
        let [vcentery, vcenterx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [parseFloat(ovx), -parseFloat(ovy)]));
        
        const circle = L.circle([vcenterx, vcentery], {
            fill: true,
            fillColor: Cookies.get('routeColor') || '#1A237E',
            stroke: false,
            interactive: false,
            radius: 3,
            className: "circle",
            fillOpacity: 1,
            strokeOpacity: 1,
            group: 'route'
        });

        circles.push(circle);
        latlngs.push([vcenterx, vcentery]);
    }

    let polyline = L.polyline(latlngs, { group: 'route', className: "", interactive: false, fill: false, color: (Cookies.get('routeColor') || '#1A237E'), weight: 3});
    polyline.addTo(SVGMap.instance.map);

    let count = 1;
    for (const circle of circles) {
        circle.addTo(SVGMap.instance.map);
        $(circle._a).attr('id', 'step-circle-' + count);
        count++;
    }

    //gm.polyline(polyline).fill('transparent').stroke({width: 3, color: (Cookies.get('routeColor') || '#1A237E')}).back();

    $(".route-steps").empty();

    let i = 1;
    for (const step of guide) {
        let stepDiv = document.createElement('div');
        let stepSpan = document.createElement('span'); 

        let order = `<span class='sr-only'>Paso número ${i}.</span>`;

        if (step.poi == true) {
            order += `Tienes ${step.poiname} a la ${(step.poidirection == 1 ? 'izquierda' : 'derecha')}. `;
        }

        if (i == 1) {
            order += `Dirígete hacia ${path.entrance[0].name} en ${path.entrance[0].edname}. Una vez allí, `;
        }

        switch (step.direction) {
            case 0:
                order += `Camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span> hacia delante`;
                break;

            case 1:
                order += `Gira a la izquierda y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
                break;

            case 2:
                order += `Gira a la derecha y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
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
        $(stepDiv).attr('data-map-rotation', originalRotacion);

        $(".route-steps").append(stepDiv);

        i++;
    }

    $(".steps-expression").each(function() {
        let meters = parseInt($(this).attr('data-meters'));

        if ($("#metricUnitSelect").val() == 0) {
            $(this).html(`${meters / STEP_FACTOR} pasos`);
        } else {
            $(this).html(`${meters} metros`);
        }
    });

    $("#metricUnitSelect").on('change', function(e) {
        $(".steps-expression").each(function() {
            let meters = parseInt($(this).attr('data-meters'));

            if ($("#metricUnitSelect").val() == 0) {
                $(this).html(`${Math.ceil(meters / STEP_FACTOR)} pasos`);
            } else if ($("#metricUnitSelect").val() == 1) {
                $(this).html(`${meters} metros`);
            } else if ($("#metricUnitSelect").val() == 2) {
                const speed = Cookies.get('speed') || Settings.walkingSpeed;
                const time : number = meters / speed;
                const minutes = Math.floor(time / 60);
                const seconds = Math.ceil(time % 60);

                $(this).html(`${((minutes > 0) ? `${minutes} ${minutes > 1 ? 'minutos' : 'minuto'} y ` : '')}${seconds} segundos`);
            }
        });
    });

    $(".route-steps .route-step").on('focus', function(e) {
        let step = parseInt($(this).attr('data-step'));
        let data = guide[step - 1];

        /*$("#map svg #rootGroup, .map-marker").css({
            'transform-origin': `${data.vcenterx}px ${data.vcentery}px`
        });

        $("#map svg #rootGroup .map-marker").each(function(e) {
            $(this).css({
                'transform-origin': `${$(this).find('text').attr('x')}px ${$(this).find('text').attr('y')}px`        
            });
        });*/

        $('#map svg .circle').attr('fill', (Cookies.get('routeColor') || Settings.routeColor));

        $(`#map svg #step-circle-${step} path`).attr('fill', (Cookies.get('routeHighlightColor') || Settings.routeHighlightColor));
        
        SVGMap.instance.zoomAndMove(data.vcenterx, data.vcentery, 21, false);
    });

    $('.route-steps:not(.route-orientation) .route-step:first-child').trigger('focus');
    $('.route-steps:not(.route-orientation) .route-step:first-child').trigger('focus');
}