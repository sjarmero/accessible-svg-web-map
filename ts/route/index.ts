import { SVGMap } from '../SVG/SVGMap.js';
import { navigationMode } from './navigation.js';
import { Location } from '../location/Location.js';
import { SVGVoiceControls } from '../SVG/SVGVoiceControls.js';
import { SVGControls } from '../SVG/SVGControls.js';
import { observeOrientation } from '../location/LocationComponent.js';

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
            startNavigation(source, target);
        }
    });

    $('.focus-location button').on('click', function(e) {
        e.preventDefault();

        let locationService = new Location();
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
        Voice
    */

    if (SVGVoiceControls.compatible()) {
        $('#voicePanel').css({
            display: 'block'
        });
        
        $("#dictateBtn").on('click', function(e) {
            e.preventDefault();

            if ($(this).attr('data-dictating') == 'true') {
                SVGVoiceControls.setOn(false);
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");

                SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.');
            } else {
                SVGVoiceControls.setOn(true);
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");

                SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.');
                voiceListener();
            }
        });
    } else {
        $('#dictateBtn').css(<any>{
            display: 'none'
        })
    }

    /* 
        Observers
    */
    observeOrientation($(SVGMap.instance.container).get(0), (lookingAtFeature) => {
        $('.route-steps .route-orientation').remove();

        if (lookingAtFeature != null && lookingAtFeature != undefined) {
            let stepDiv = document.createElement('div');
            let stepSpan = document.createElement('span'); 

            let order = `<span class='sr-only'>Información sobre tu orientación.</span>
                Estás mirando hacia ${$(`#${lookingAtFeature}`).attr('data-name')}.
            `;

            $(stepSpan).html(order);
            $(stepDiv).append(stepSpan);
            $(stepDiv).addClass('route-step route-orientation');
            $(stepDiv).attr('role', 'listitem');
            $(stepDiv).attr('tabindex', '0');
            $(stepDiv).attr('data-step', -1);

            $(".route-steps").prepend(stepDiv);
        }
    });
});

function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}

function startNavigation(source, target) {
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

function voiceListener() {
    SVGControls.instance.voiceControl.start(({confidence, transcript}) => {
        console.log('Voice received:');
        console.log(confidence, transcript);

        let parsed = SVGControls.instance.voiceControl.parseAction(transcript);
        if (parsed) {
            console.log('[ROUTE] Parsed as', parsed);
            let {name} = parsed;

            switch (name) {
                case 'unknown':
                    return;

                case 'route':
                    let { origin, target } = parsed;
                    routeByVoice(origin, target);
                    return;

                case 'repeatStep':
                    let step = $('.route-steps .route-step:focus');
                    if (step.length == 1) {
                        console.log('Repitiendo paso', step);
                        step.blur();
                        step.trigger('focus');
                    }

                    return;

                case 'readStep':
                    let { stepNo } = parsed;
                    stepNo = (parseInt(stepNo) == NaN) ? SVGControls.instance.toDigit(stepNo) : parseInt(stepNo);
                    $(`.route-steps .route-step[data-step=${stepNo}]`).trigger('focus');
                    return;

                case 'zoom':
                    SVGControls.instance.navigationHandler((parsed.direction === 'acercar') ? 'zoom-in' : 'zoom-out');
                    return;

                default:
                    SVGControls.instance.navigationHandler(parsed.direction);
                    return;
            }
        }
    });
}

function routeByVoice(origin, target) {
    selectByVoice(origin, 'origen', (selOrigin) => {
        selectByVoice(target, 'destino', (selTarget) => {
            if (selOrigin != null && selTarget != null) {
                SVGControls.instance.voiceControl.say(`Calculando ruta`);
                console.log('Ruta de ', selOrigin, 'a', selTarget);

                $("#impairmentSelect").val(1);
                startNavigation(selOrigin.id, selTarget.id);
            } else {
                console.log('[ERROR]', selOrigin, selTarget);
                SVGControls.instance.voiceControl.say(`No se ha podido obtener la ruta.`);
            }
        });
    });
}

function selectByVoice(place, mode, callback) {
    $.getJSON(`/map/data/s/name/${place}`, function(data) {
        let {results} = data;
        console.log('Results', results);
       
        if (results.length == 0) {
            SVGControls.instance.voiceControl.say(`No se han encontrado lugares con el nombre ${place}.`);
            callback(null);
        } else if (results.length == 1) {
            SVGControls.instance.voiceControl.say(`Seleccionado ${results[0].name} como ${mode}`);
            callback(results[0]);
        } else {
            SVGControls.instance.voiceControl.say(`Se han encontrado varios lugares relacionados con ${place}. Selecciona uno de ellos:`);
        
            for (let i = 0; i < results.length; i++) {
                SVGControls.instance.voiceControl.say(`Resultado número ${i + 1}. ${results[i].name}`);
            }

            SVGControls.instance.voiceControl.say(`Di 'número' seguido del número de lugar a seleccionar. Di 'cancelar' para salir.`);

            selectOption((selectedIndex) => {
                if (selectedIndex != -1 && selectedIndex < results.length) {
                    let result = results[selectedIndex];
                    console.log('Seleccionado', result);
                    SVGControls.instance.voiceControl.say(`Has seleccionado ${result.name} como ${mode}.`);
                    callback(result);
                } else {
                    callback(null);
                }
            });
        }
    });
}

function selectOption(callback) {
    return SVGControls.instance.voiceControl.start(({confidence, transcript}) => {
        console.log('Voice received:');
        console.log(confidence, transcript);

        if (transcript.match(/cancelar/i) != null) { callback(-1); return; }
        let t = transcript.match(/número (\d+)/i);
        if (t != null) {
            callback(parseInt(t[1]) - 1);
        } else {
            t = transcript.match(/número (\w+)/i);
            callback(SVGControls.instance.toDigit(t[1]) - 1);
        }
    });
}