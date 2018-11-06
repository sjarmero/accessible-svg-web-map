import { rotar } from './math';
import { SVGMap } from '../SVG/SVGMap';
import { navigationMode } from './navigation';
import { SVGLocation } from '../SVG/SVGLocation';
import { SVGControls } from '../SVG/SVGControls';

const searchIcon = 'fas fa-search';
const loadingIcon = 'fas fa-spinner rotating-spinner';
const okIcon = 'fas fa-check green';
const errIcon = 'fas fa-times red';

declare var proj4;

$(document).ready(function() {
    loadSettings();
        
    /*
        Events
    */
    let verified = [false, false];
    let source, target;
    let form;

    $("#routeSource, #routeTarget").on('keypress', function(e) {
        if ((<any>e.originalEvent).code == "Tab") return;
        $(this).parent().find('button').removeClass('btn-primary btn-success btn-danger');
        changeIcon($(this).parent(), searchIcon);
    });

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
                if (results.length == 0) {
                    $(form).find('button').removeClass('btn-primary btn-success btn-danger');
                    $(form).find('button').addClass('btn-danger');
                    changeIcon($(form), errIcon);
                } else if (results.length == 1) {
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
        
        if (typeof chosen == 'undefined') {
            changeIcon($(form), errIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-danger');        
        } else {
            let id = $('#searchModal input[name="featureSelection"]:checked').attr('id').split('feature-')[1];
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
            $.getJSON(`/map/data/pi/${source},${target},${$("#impairmentSelect").val()}`, function(path) {
                console.log('path', path);
                navigationMode(path.data);

                if ($("#impairmentSelect").val() != 0 && path.disability == 0) {
                    $("#nonAccessibleWarning").css("display", "block");
                    $("#nonAccessibleWarning").html($("#nonAccessibleWarning").html());
                } else {
                    $("#nonAccessibleWarning").css("display", "none");
                }
            });
        }
    });

    $('.focus-location button').on('click', function(e) {
        e.preventDefault();

        let locationService = new SVGLocation();
        locationService.getCurrentPosition(function(lat, long) {
            let [x, y] = (<any>proj4('EPSG:4326', 'EPSG:25830', [long, lat]));
            SVGMap.instance.moveTo(x, -y);
        });
    });

    $('.focus-orientation button').on('click', function(e) {
        e.preventDefault();

        $('.route-orientation:first-child').trigger('focus');
    });

    /* 
        Observers
    */
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
                        let x2 = parseFloat(orientationl.attr('x2'));
                        let y2 = parseFloat(orientationl.attr('y2'));

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

function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}