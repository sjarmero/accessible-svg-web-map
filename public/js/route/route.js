import { SVGMap } from '/js/map/SVG/SVGMap.js';
import { setupEvents } from '/js/map/events.js';

const searchIcon = 'fas fa-search';
const loadingIcon = 'fas fa-spinner rotating-spinner';
const okIcon = 'fas fa-check green';
const errIcon = 'fas fa-times red';

$(document).ready(function() {
    setupEvents();
    
    let verified = [false, false];
    let source, target;

    console.log(angulo({x: 10, y: 0}, {x: 0, y: 10}));
    console.log(rotar({x: 1, y: 1}, 90, true));
    console.log(rotar({x: 1, y: 1}, 90, false));

    let form;
    $(".routeBtn").on('click', function(e) {
        e.preventDefault();

        form = "#" + $(this).attr('data-search');
        changeIcon($(form), loadingIcon);
        $(form).find('button').removeClass('btn-primary btn-success btn-danger');
        $(form).find('button').addClass('btn-primary');

        if ($(form).find('input').val() == "") {
            changeIcon($(form), errIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-danger');
            return;
        }

        $.getJSON('/map/data/s/name/' + $(form).find('input').val(), function(data) {
            if (data.code == 200) {
                let {results} = data;
                if (results.length == 1) {
                    $(form).find('input').val(results[0].name);
                    changeIcon($(form), okIcon);
                    $(form).find('button').removeClass('btn-primary btn-success btn-danger');
                    $(form).find('button').addClass('btn-success');

                    if (form == '#sourceForm') {
                        verified[0] = true;
                        source = results[0].id;
                    } else {
                        verified[1] = true 
                        target = results[0].id;
                    }
                } else {
                    let point = (form == '#sourceForm') ? 'Punto de origen' : 'Punto de destino';
                    $('#searchModal .modal-body').empty();
                    $('#modalTitle').html(point);

                    for (const result of results)  {
                        console.log(result);
                        let div = document.createElement("div");
                        let input = document.createElement("input");
                        $(input).attr("type", "radio");
                        $(input).attr("data-feature", result.name);
                        $(input).attr("aria-label", `Elegir ${result.name} como ${point}`);
                        $(input).attr("name", "featureSelection");
                        $(input).attr("id", `feature-${result.id}`);
                        $(input).attr("value", result.name);
                        $(input).attr('tabindex', 0);

                        let label = document.createElement('label');
                        $(label).attr('for', `feature-${result.id}`);
                        $(label).html(result.name);
                        
                        $(div).attr('class', 'check-group');
                        $(div).append(input);
                        $(div).append(label);

                        console.log(div);
                        $("#searchModal .modal-body").append(div);
                    }
                    
                    $('#searchModal').modal('show');
                }
            }
        });
    });

    $('#searchModal').on('shown.bs.modal', function(e) {
        $('#searchModal input[name="featureSelection"]:first').trigger('focus');
    });

    $('#searchModal').on('hide.bs.modal', function(e) {
        let chosen = $('#searchModal input[name="featureSelection"]:checked').val();
        let id = $('#searchModal input[name="featureSelection"]:checked').attr('id').split('feature-')[1];

        console.log(chosen);

        if (typeof chosen == 'undefined') {
            changeIcon($(form), errIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-danger');        
        } else {
            $(form).find('input').val(chosen);
            changeIcon($(form), okIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-success');
            
            
            if (form == '#sourceForm') {
                verified[0] = true;
                source = id;
            } else {
                verified[1] = true 
                target = id;
            }
        }
    });

    $("#calculateBtn").on('click', function(e) {
        e.preventDefault();

        let acc = true;
        for (const v of verified) {
            acc = acc && v;
        }

        console.log(acc, source, target);

        if (acc) {
            $.getJSON(`/map/data/p/${source},${target}`, function(data) {
                console.log(data);

                navigationMode(data);
            });
        }
    });
});

function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}

let guide = [];
function navigationMode(data) {
    $("#SVG_MAIN_CONTENT #route").empty();

    // Dibujar ruta
    let svg = SVGMap.instance.svg;
    const gm = svg.select('#SVG_MAIN_CONTENT').members[0].group().attr('id', 'route');
    const polyline = [];
    for (const step of data) {
        let {vcenterx, vcentery} = step;

        console.log(gm.circle());
        const circle = gm.circle().radius(5);
        circle.cx(vcenterx);
        circle.cy(vcentery);
        circle.fill('#1A237E')

        polyline.push([vcenterx], [vcentery]);
    }

    gm.polyline(polyline).fill('transparent').stroke({width: 3, color: '#1A237E'});

    let a = {x: data[0].vcenterx, y: data[0].vcentery};
    let p = {x: data[1].vcenterx, y: data[1].vcentery};

    // Centrar mapa en primer punto
    SVGMap.instance.zoomAndMove(a.x, a.y, 15);

    // Rotar el mapa para mirar al primer destino
    let rotacionMapa = perspectiva(p, a);
    let ajuste = toDeg(angulo(p, a));
    if (rotacionMapa == 90) { ajuste = 90 - ajuste; }

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

    let lastRotacion = rotacionMapa;
    
    guide = [];
    for (let i = 0; i < (data.length - 1); i++) {
        a = {x: data[i].vcenterx, y: data[i].vcentery};
        p = {x: data[i+1].vcenterx, y: data[i+1].vcentery};

        rotacionMapa = perspectiva(p, a);
        ajuste = toDeg(angulo(p, a));
        if (rotacionMapa == 90) { ajuste = 90 - ajuste; }

        console.log(rotacionMapa);

        let giro = rotacionMapa - lastRotacion;
        console.log(giro);

        let direction = 0;
        if (giro <= 20 && giro >= -20) {
            direction = 0; // Recto
        } else if (giro <= 120 && giro >= 60) {
            direction = 1; // Izquierda
        } else if (giro <= -60 && giro >= -120) {
            direction = 2; // Derecha
        }

        guide.push({
            direction: direction,
            distance: modulo({x: p.x - a.x, y: p.y - a.y})
        });
    }

    $(".route-steps").empty();
    let i = 1;
    for (const step of guide) {
        let stepDiv = document.createElement('div');
        let stepSpan = document.createElement('span'); 

        let order = `<span class='sr-only'>Paso número ${i}.</span>`;
        switch (step.direction) {
            case 0:
                order += `Camina ${Math.ceil(step.distance)} pasos hacia delante`;
                break;

            case 1:
                order += `Gira a la izquierda y camina ${Math.ceil(step.distance)} pasos`;
                break;

            case 2:
                order += `Gira a la derecha y camina ${Math.ceil(step.distance)} pasos`;
                break;
        }


        $(stepSpan).html(order);

        $(stepDiv).append(stepSpan);
        $(stepDiv).addClass('route-step');
        $(stepDiv).attr('role', 'listitem');
        $(stepDiv).attr('tabindex', '0');

        $(".route-steps").append(stepDiv);

        i++;
    }

    $(".route-steps .route-step:first").trigger('focus');
}

// Devuelve el ángulo entre dos puntos en radianes
function angulo(p1, p2) {
    /*
    let x = v1.x - v2.x;
    let y = v1.y - v2.y;
    let t = Math.atan2(y, x);
    let a = (t * (180 / Math.PI)) % 360;

    return (a < 0) ? a + 360 : a;*/

    let h = {x: p1.x, y: p2.y};

    let a = {x: (h.x - p1.x), y: (h.y - p1.y)};
    let b = {x: (h.x - p2.x), y: (h.y - p2.y)};
    let c = {x: (p2.x - p1.x), y: (p2.y - p1.y)};
    let alpha = Math.atan2(modulo(b), modulo(a));

    /*gsvg.line(p1.x, p1.y, h.x, h.y).stroke({ width: 1, color: 'pink'});
    gsvg.line(p2.x, p2.y, h.x, h.y).stroke({ width: 1, color: 'yellow'});
    gsvg.line(p1.x, p1.y, p2.x, p2.y).stroke({ width: 1, color: 'red'});*/

    return alpha;
}

// Grados a rotar el mapa para que desde A se mire a P
// Habrá que añadirle el ángulo calculado entre P y A
function perspectiva(p, a) {
    let ydiff = p.y - a.y;
    let xdiff = p.x - a.x;

    console.log(xdiff, ydiff);

    if (Math.abs(xdiff) <= 50) {
        if (ydiff > 0) {
            return 180;
        } else {
            return 0;
        }
    } else {
        if (xdiff > 0) {
            return 270;
        } else {
            return 90;
        }
    }

    return 90;
}

function toDeg(rad) {
    return rad * 180 / Math.PI;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

function rotar(v, angulo_, clockwise) {
    let angulo = angulo_ / (Math.PI / 180);
    let xprima, yprima;

    if (!clockwise) { 
        xprima = (v.x * Math.cos(angulo)) - (v.y * Math.sin(angulo));
        yprima = (v.x * Math.sin(angulo)) + (v.y * Math.cos(angulo));
    } else {
        xprima = (v.x * Math.cos(angulo)) + (v.y * Math.sin(angulo));
        yprima = - (v.x * Math.sin(angulo)) + (v.y * Math.cos(angulo));
    }

    let r = {x: xprima, y: yprima};
    console.log('xprima:', r.x, 'yprima:', r.y);

    return r;
}

function modulo(v) {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}