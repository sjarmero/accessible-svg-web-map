import { angulo, posicion, toDeg, modulo, angulo2, perspectiva2} from './math';
import { SVGMap } from '../SVG/SVGMap';
import { Settings } from "../settings/defaults";

declare var Cookies, proj4;

const STEP_FACTOR : number = parseFloat(Cookies.get('stepLength')) || Settings.stepLenght;

/*
    La proyección del mapa hace que "la realidad" esté inclinada
    una serie de grados.
*/
const PROJECTION_INCLINATION : number = 17;

enum OrientacionUsuario {
    RECTO = 0,
    IZQUIERDA = 90,
    DERECHA = 270,
    ATRAS = 180
}

function parseOrientacion(grados : number, ultima : OrientacionUsuario) {
    grados -= (ultima != OrientacionUsuario.ATRAS) ? ultima : 0;
    grados = (grados < 0) ? 360 + grados : grados;
    if (grados <= 25 || grados >= 320) {
        return OrientacionUsuario.RECTO;
    } else if (grados <= 115 && grados >= 65) {
        return (ultima != OrientacionUsuario.ATRAS) ? OrientacionUsuario.IZQUIERDA : OrientacionUsuario.DERECHA;
    } else if (grados >= 205 && grados <= 295) {
        return (ultima != OrientacionUsuario.ATRAS) ? OrientacionUsuario.DERECHA : OrientacionUsuario.IZQUIERDA;
    } else {        
        return OrientacionUsuario.ATRAS;
    }
}

function acumularOrientacion(nueva : OrientacionUsuario, previa : OrientacionUsuario) {

    switch (previa) {
        case OrientacionUsuario.RECTO:
            return nueva;
            
        case OrientacionUsuario.IZQUIERDA:
            if (nueva == OrientacionUsuario.DERECHA) return OrientacionUsuario.RECTO;
            if (nueva == OrientacionUsuario.IZQUIERDA) return OrientacionUsuario.ATRAS;
            if (nueva == OrientacionUsuario.RECTO) return OrientacionUsuario.IZQUIERDA;
            if (nueva == OrientacionUsuario.ATRAS) return OrientacionUsuario.ATRAS;
            break;

        case OrientacionUsuario.DERECHA:
            if (nueva == OrientacionUsuario.IZQUIERDA) return OrientacionUsuario.RECTO;
            if (nueva == OrientacionUsuario.DERECHA) return OrientacionUsuario.ATRAS;
            if (nueva == OrientacionUsuario.RECTO) return OrientacionUsuario.DERECHA;
            if (nueva == OrientacionUsuario.ATRAS) return OrientacionUsuario.ATRAS;
            break;

        case OrientacionUsuario.ATRAS:
            if (nueva == OrientacionUsuario.IZQUIERDA) return OrientacionUsuario.DERECHA;
            if (nueva == OrientacionUsuario.DERECHA) return OrientacionUsuario.IZQUIERDA;
            if (nueva == OrientacionUsuario.RECTO) return OrientacionUsuario.ATRAS;
            if (nueva == OrientacionUsuario.ATRAS) return OrientacionUsuario.ATRAS;
            break;
    }
}

let guide = [];
export function navigationMode(path) {
    const {data} = path;

    $(SVGMap.instance.container).find('#route').empty();

    /* Calculamos la guia:
        - Nombramos la entrada donde situarse
        - Adoptamos los POI en la ruta
        - Determinamos los giros en cada paso
        - Juntamos pasos con mismo giro
    */

    // Por como están guardadas en la base de datos
    let lastRotacion = parseInt(path.entrance[0].looksat);

    /*
        !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        EN LA BASE DE DATOS LOS ÁNGULOS ESTÁN MAL. HASTA CAMBIARLO
        CONVERTIMOS 90º EN 270º E INVERSA 
    */

    lastRotacion = (lastRotacion == 90) ? 270 : (lastRotacion == 270) ? 90 : lastRotacion;

    let orientacionU = parseOrientacion(lastRotacion, 0);
    var orientacionAcum = orientacionU;
    let lastOrientacion = orientacionU;

    guide = [];

    for (let i = 0; i < data.length; i++) {

        if ((i + 1) == data.length) {
            guide.push(data[i]);
            guide[guide.length - 1].direction = -1;
            guide[guide.length - 1].distance = modulo({x: a.x - guide[guide.length - 1].vcenterx, y: a.y - guide[guide.length - 1].vcentery})
            
            break;
        }

        var a = {x: data[i].vcenterx, y: data[i].vcentery};
        var p = {x: data[i+1].vcenterx, y: data[i+1].vcentery};

        let P = perspectiva2(p, a);
        orientacionU = parseOrientacion(P, orientacionAcum);

        lastOrientacion = orientacionAcum;
        orientacionAcum = acumularOrientacion(orientacionU, orientacionAcum);

        let PA = P - orientacionAcum;
        let direction = -1;

        switch (orientacionU) {
            case OrientacionUsuario.ATRAS:
            case OrientacionUsuario.RECTO:
                if (PA >= 25 && PA <= 65) {
                    direction = 3;
                } else if (PA <= -25 && PA >= -65) {
                    direction = 4;
                } else {
                    direction = 0;
                }

                break;

            case OrientacionUsuario.IZQUIERDA:
                direction = 1;
                break;

            case OrientacionUsuario.DERECHA:
                direction = 2;
                break;
        }

        let added = 0;
        if (i > 0 && data[i].iid != null && data[i].iid.length > 0) {
            for (let j = 0; j < data[i].iid.length; j++) {
                let poi = {x: data[i].icenterx[j], y: data[i].icentery[j]}
                
                let pos = perspectiva2(poi, a);
                let o = parseOrientacion(pos, lastOrientacion);

                if (o == OrientacionUsuario.IZQUIERDA || o == OrientacionUsuario.DERECHA) {
                    guide.push(data[i]);
                    guide[guide.length - 1].direction = direction;
                    guide[guide.length - 1].distance = modulo({x: p.x - a.x, y: p.y - a.y});
                    guide[guide.length - 1].poi = true;
                    guide[guide.length - 1].poiname = data[i].iname[j];

                    guide[guide.length - 1].poidirection = (o == OrientacionUsuario.IZQUIERDA);
                    
                    added++;

                    break;
                }
            }
        }
        
        if (orientacionU == lastOrientacion && guide.length > 0) {
            let ls = guide.length - 1;
            guide[ls].distance = guide[ls].distance + modulo({x: p.x - a.x, y: p.y - a.y});
        } else if (added == 0) {
            guide.push(data[i]);
            guide[guide.length - 1].direction = direction;
            guide[guide.length - 1].distance = modulo({x: p.x - a.x, y: p.y - a.y});
            guide[guide.length - 1].poi = false;
        }
    }

    // Dibujar ruta
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
