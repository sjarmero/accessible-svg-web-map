import { angulo, perspectiva, toDeg, modulo } from './math.js';
import { SVGMap } from '../SVG/SVGMap.js';
var guide = [];
export function navigationMode(data) {
    $("#SVG_MAIN_CONTENT #route").empty();
    var a = { x: data[0].vcenterx, y: data[0].vcentery };
    var p = { x: data[1].vcenterx, y: data[1].vcentery };
    // Centrar mapa en primer punto
    // SVGMap.instance.zoomAndMove(a.x, a.y, 15);
    // Rotar el mapa para mirar al primer destino
    var rotacionMapa = perspectiva(p, a);
    var originalRotacion = rotacionMapa;
    var ajuste = toDeg(angulo(p, a));
    var originalAjuste = ajuste;
    if (rotacionMapa == 90) {
        ajuste = 90 - ajuste;
    }
    if (rotacionMapa == 270) {
        ajuste = 90 - ajuste;
    }
    $("#map svg #SVG_MAIN_CONTENT").css({
        'transform-origin': a.x + "px " + a.y + "px",
        'transform': "rotateX(-45deg) rotateZ(" + (rotacionMapa + ajuste) + "deg)"
    });
    $("#map svg #SVG_MAIN_CONTENT .map-marker").each(function (e) {
        $(this).css({
            'transform-origin': $(this).find('text').attr('x') + "px " + $(this).find('text').attr('y') + "px",
            'transform': "rotateX(0deg) rotateZ(-" + (rotacionMapa + ajuste) + "deg)"
        });
    });
    /* Calculamos la guia:
        - Adoptamos los POI en la ruta
        - Determinamos los giros en cada paso
        - Juntamos pasos con mismo giro
    */
    var lastRotacion = -1;
    guide = [];
    for (var i_1 = 0; i_1 < data.length; i_1++) {
        if ((i_1 + 1) == data.length) {
            guide.push(data[i_1]);
            guide[guide.length - 1].direction = -1;
            guide[guide.length - 1].distance = modulo({ x: a.x - guide[guide.length - 1].vcenterx, y: a.y - guide[guide.length - 1].vcentery });
            break;
        }
        a = { x: data[i_1].vcenterx, y: data[i_1].vcentery };
        p = { x: data[i_1 + 1].vcenterx, y: data[i_1 + 1].vcentery };
        rotacionMapa = perspectiva(p, a);
        ajuste = toDeg(angulo(p, a));
        if (rotacionMapa == 90) {
            ajuste = 90 - ajuste;
        }
        if (rotacionMapa == 270) {
            ajuste = 90 - ajuste;
        }
        var giro = rotacionMapa - lastRotacion;
        var direction = 0;
        if (giro == 0) {
            direction = 0; // Recto
        }
        else if (giro == 90) {
            direction = 1; // Izquierda
        }
        else if (giro == -90) {
            direction = 2; // Derecha;
        }
        var added = 0;
        if (data[i_1].iid != null && data[i_1].iid.length > 0) {
            for (var j = 0; j < data[i_1].iid.length; j++) {
                var poi = { x: data[i_1].icenterx[j], y: data[i_1].icentery[j] };
                var poip = perspectiva(poi, a);
                var giro_1 = poip - lastRotacion;
                ajuste = toDeg(angulo(poi, a));
                if (poip == 90) {
                    ajuste = 90 - ajuste;
                }
                if (poip == 270) {
                    ajuste = 90 - ajuste;
                }
                if (ajuste > 20) {
                    continue;
                }
                if (giro_1 == 90) {
                    // Izquierda
                    guide.push(data[i_1]);
                    guide[guide.length - 1].direction = direction;
                    guide[guide.length - 1].distance = modulo({ x: p.x - a.x, y: p.y - a.y });
                    guide[guide.length - 1].poi = true;
                    guide[guide.length - 1].poidirection = 1;
                    guide[guide.length - 1].poiname = data[i_1].iname[j];
                    added++;
                    break;
                }
                else if (giro_1 == -90) {
                    // Derecha;
                    guide.push(data[i_1]);
                    guide[guide.length - 1].direction = direction;
                    guide[guide.length - 1].distance = modulo({ x: p.x - a.x, y: p.y - a.y });
                    guide[guide.length - 1].poi = true;
                    guide[guide.length - 1].poidirection = 2;
                    guide[guide.length - 1].poiname = data[i_1].iname[j];
                    added++;
                    break;
                }
            }
        }
        if (rotacionMapa == lastRotacion) {
            var ls = guide.length - 1;
            guide[ls].distance = guide[ls].distance + modulo({ x: p.x - a.x, y: p.y - a.y });
        }
        else if (added == 0) {
            guide.push(data[i_1]);
            guide[guide.length - 1].direction = direction;
            guide[guide.length - 1].distance = modulo({ x: p.x - a.x, y: p.y - a.y });
            guide[guide.length - 1].poi = false;
        }
        lastRotacion = rotacionMapa;
    }
    // Dibujar ruta
    var svg = SVGMap.instance.svg;
    var gm = svg.select('#SVG_MAIN_CONTENT').members[0].group().attr('id', 'route');
    var polyline = [];
    var count = 1;
    for (var _i = 0, guide_1 = guide; _i < guide_1.length; _i++) {
        var step = guide_1[_i];
        var vcenterx = step.vcenterx, vcentery = step.vcentery;
        var circle = gm.circle().radius(5);
        circle.cx(vcenterx);
        circle.cy(vcentery);
        circle.fill('#1A237E');
        circle.attr('id', 'step-circle-' + count);
        polyline.push([vcenterx], [vcentery]);
        count++;
    }
    gm.polyline(polyline).fill('transparent').stroke({ width: 3, color: '#1A237E' }).back();
    $(".route-steps").empty();
    var i = 1;
    for (var _a = 0, guide_2 = guide; _a < guide_2.length; _a++) {
        var step = guide_2[_a];
        var stepDiv = document.createElement('div');
        var stepSpan = document.createElement('span');
        var order = "<span class='sr-only'>Paso n\u00FAmero " + i + ".</span>";
        if (step.poi == true) {
            order += "Tienes " + step.poiname + " a la " + (step.poidirection == 1 ? 'izquierda' : 'derecha') + ". ";
        }
        switch (step.direction) {
            case 0:
                order += "Camina <span class=\"steps-expression\" data-steps='" + Math.ceil(step.distance) + "'>" + Math.ceil(step.distance) + " pasos</span> hacia delante";
                break;
            case 1:
                order += "Gira a la izquierda y camina <span class=\"steps-expression\" data-steps='" + Math.ceil(step.distance) + "'>" + Math.ceil(step.distance) + " pasos</span>";
                break;
            case 2:
                order += "Gira a la derecha y camina <span class=\"steps-expression\" data-steps='" + Math.ceil(step.distance) + "'>" + Math.ceil(step.distance) + " pasos</span>";
                break;
            case -1:
                order += "Has llegado a tu destino";
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
    $("#metricUnitSelect").on('change', function (e) {
        $(".steps-expression").each(function () {
            var steps = parseInt($(this).attr('data-steps'));
            if ($("#metricUnitSelect").val() == 0) {
                $(this).html(steps + " pasos");
            }
            else {
                var meters = steps / 2;
                $(this).html(meters + " metros");
            }
        });
    });
    $(".route-steps .route-step").on('focus', function (e) {
        var data = guide[parseInt($(this).attr('data-step')) - 1];
        $("#map svg #SVG_MAIN_CONTENT, .map-marker").css({
            'transform-origin': data.vcenterx + "px " + data.vcentery + "px"
        });
        $("#map svg #SVG_MAIN_CONTENT .map-marker").each(function (e) {
            $(this).css({
                'transform-origin': $(this).find('text').attr('x') + "px " + $(this).find('text').attr('y') + "px"
            });
        });
        SVGMap.instance.zoomAndMove(data.vcenterx, data.vcentery, 15, false);
    });
    $('.route-steps:not(.route-orientation) .route-step:first-child').trigger('focus');
    $('.route-steps:not(.route-orientation) .route-step:first-child').trigger('focus');
}
