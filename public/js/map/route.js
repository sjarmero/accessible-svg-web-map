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
            });
        }
    });
});

function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}