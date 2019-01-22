import { angulo, perspectiva, toDeg, modulo, angulo2} from './math.js';
import { SVGMap } from '../SVG/SVGMap.js';
import { Settings } from "../settings/defaults.js";

declare var Cookies, proj4;

const STEP_FACTOR : number = parseFloat(Cookies.get('stepLength')) || Settings.stepLenght;

/*
    La proyección del mapa hace que "la realidad" esté inclinada
    una serie de grados.
*/
const PROJECTION_INCLINATION : number = 17;

let guide = [];
export function navigationMode(path) {
    const data = path.data;

    $(SVGMap.instance.container).find('#route').empty();

    let a = {x: data[0].vcenterx, y: data[0].vcentery};
    let p = {x: data[1].vcenterx, y: data[1].vcentery};

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

        let rotacionMapa = perspectiva(p, a);
        let giro = rotacionMapa - lastRotacion;

        let anguloRP = toDeg(angulo(p, a)); // Angulo respecto a perpendicular
        if (rotacionMapa == 90) anguloRP = 90 - anguloRP;
        if (rotacionMapa == 270)  anguloRP = 90 - anguloRP;

        let ajuste = anguloRP;
        if (rotacionMapa != 270) {
            ajuste += (a.x < p.x) ? PROJECTION_INCLINATION : -PROJECTION_INCLINATION;
        } else {
            ajuste += (a.x < p.x) ? -PROJECTION_INCLINATION : PROJECTION_INCLINATION;

        }

        let direction = -1;
        if (giro == 0 || giro == 180) {
            console.log('Recto con ajuste', ajuste);

            if (ajuste >= 20) {
                direction = 4;
            } else if (ajuste <= -20) {
                direction = 3;
            } else {
                direction = 0;
            }
            
        } else if (giro == 90) {
            console.log('Izquierda con ajuste', ajuste);

            direction = 1;
        } else if (giro == -90 || giro == 270) {
            direction = 2;

            console.log('Derecha con ajuste', ajuste);
        }

        let added = 0;
        if (data[i].iid != null && data[i].iid.length > 0) {
            for (let j = 0; j < data[i].iid.length; j++) {
                let poi = {x: data[i].icenterx[j], y: data[i].icentery[j]}
                let poip = perspectiva(poi, a);
                let giro = poip - lastRotacion;
                let ajuste = toDeg(angulo(poi, a));
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

            case 3:
                order += `Gira ligeramente a la izquierda y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
                break;

            case 4:
                order += `Gira ligeramente a la derecha y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
                break;

            case 5:
                order += `Gira bastante a la izquierda y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
                break;

            case 6:
                order += `Gira bastante a la derecha y camina <span class="steps-expression" data-meters='${Math.ceil(step.distance)}'></span>`;
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

    const unitChanger = (e) => {
        let meters : number = parseInt($(e).attr('data-meters'));

        if ($("#metricUnitSelect").val() == 0) {
            $(e).html(`${Math.ceil(meters / STEP_FACTOR)} pasos`);
        } else if ($("#metricUnitSelect").val() == 1) {
            $(e).html(`${meters} metros`);
        } else if ($("#metricUnitSelect").val() == 2) {
            const speed = Cookies.get('speed') || Settings.walkingSpeed;
            const time : number = meters / speed;
            const minutes = Math.floor(time / 60);
            const seconds = Math.ceil(time % 60);

            $(e).html(`${((minutes > 0) ? `${minutes} ${minutes > 1 ? 'minutos' : 'minuto'} y ` : '')}${seconds} segundos`);
        }
    }

    $(".steps-expression").each(function() {
        unitChanger(this);
    });

    $("#metricUnitSelect").on('change', function(e) {
        $(".steps-expression").each(function() {
            unitChanger(this);
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