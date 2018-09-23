import { SVGMap } from '/js/map/SVG/SVGMap.js';

const searchIcon = 'fas fa-search';
const loadingIcon = 'fas fa-spinner rotating-spinner';
const okIcon = 'fas fa-check green';
const errIcon = 'fas fa-times red';

$(document).ready(function() {
    let verified = [false, false];
    let source, target;

    $(".routeBtn").on('click', function(e) {
        e.preventDefault();

        let form = "#" + $(this).attr('data-search');
        changeIcon($(form), loadingIcon);
        $(form).find('button').removeClass('btn-primary btn-success btn-danger');
        $(form).find('button').addClass('btn-primary');

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
                    changeIcon($(form), errIcon);
                    $(form).find('button').removeClass('btn-primary btn-success btn-danger');
                    $(form).find('button').addClass('btn-danger');
                }
            }
        });
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

function navigationMode(data) {
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

    // Centrar mapa en primer punto
    SVGMap.instance.zoomAndMove(data[0].vcenterx, data[0].vcentery, 15);

    // Calcular grados a inclinar para que mire al siguiente paso
    let first_step = data[0];
    let v0 = { x: svg.viewbox().width, y: svg.viewbox().y };
    let v1 = { x: data[0].vcenterx, y: data[0].vcentery };
    let v2 = { x: data[1].vcenterx, y: data[1].vcentery };
    let dir = { x: v2.x - v1.x, y: v2.y - v1.y };

    let a_raw = angulo(v0, v1);
    console.log('Angulo', a_raw);

    let a = a_raw + ((dir.x < 0) ? 90 : -90);

    // Inclinar
    $("svg #SVG_MAIN_CONTENT").css({
        'transform-origin': `${data[0].vcenterx}px ${data[0].vcentery}px`,
        'transform': `rotateX(-45deg) rotateZ(${a}deg)`
    });

    // No inclinar marcadores
    $("svg #SVG_MAIN_CONTENT .map-marker").each(function() {
        let x = $(this).find('text').attr('x');
        let y = $(this).find('text').attr('y')

        $(this).css({
            'transform-origin': `${x}px ${y}px`,
            'transform': `rotateX(0deg) rotateZ(-${a}deg)`
        });
    });
}

function angulo(v1, v2) {
    let x1 = v1.x, y1 = v1.y;
    let x2 = v2.x, y2 = v2.y;
    let escalar = (x1 * x2) + (y1 * y2);
    let modA = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2));
    let modB = Math.sqrt(Math.pow(x2, 2) + Math.pow(y2, 2));
    let t = escalar / (modA * modB);

    return (57.296 * Math.acos(t));
}