import { SVGMap } from '../SVG/SVGMap';
import { navigationMode } from './navigation';
import { Location } from '../location/Location';
import { SVGVoiceControls } from '../SVG/SVGVoiceControls';
import { SVGControls } from '../SVG/SVGControls';
import { observeOrientation } from '../location/LocationComponent';
import { loadSettings } from "../settings/load";
import { Settings } from '../settings/defaults';

declare var Cookies;

let enableAnimations = Cookies.get('enableAnimations') || Settings.enableAnimations;

const searchIcon = 'fas fa-search';
const loadingIcon = 'fas fa-spinner' + ((enableAnimations == "false") ? '' : ' rotating-spinner');
const okIcon = 'fas fa-check green';
const errIcon = 'fas fa-times red';

declare var proj4;

let lastSentence;
$(document).ready(function() {
    loadSettings();

    let paramString = window.location.href.split("?");
    if (paramString.length > 1) {
        for (const pair of paramString[1].split("&")) {
            const [key, value] = pair.split("=");
            if (key === "to") {
                $.getJSON(`/map/data/b/${value}`, function (data) {
                    $("#routeTarget").val(data.name.value);
                    $('.routeBtn[data-search="targetForm"]').trigger('click');
                });
            }
        }
    }
        
    /*
        Events
    */
    let verified = [false, false];
    let source, target;
    let form;

    // Navigation buttons
    $("#pad .btn").click(function(e) {
        e.preventDefault();
        SVGControls.instance.navigationHandler($(this).attr("data-map-nav"));
    });

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

        let oldContent = $("#locationStatus").html();
        $("#locationStatus").html("Esperando ubicación...");
        locationService.getCurrentPosition((lat, long) => {
            let [x, y] = (<any>proj4('EPSG:4326', 'EPSG:25830', [long, lat]));
            SVGMap.instance.moveTo(x, -y);

            $("#locationStatus").html(oldContent);
        });
    });

    $('.focus-orientation button').on('click', function(e) {
        e.preventDefault();

        $('#orientationStatus').trigger('focus');
    });


    /*
        Voice
    */

    if (SVGVoiceControls.compatible()) {
        $('#voicePanel').removeClass("d-none");
        
        $("#dictateBtn").on('click', function(e) {
            e.preventDefault();

            if ($(this).attr('data-dictating') == 'true') {
                SVGControls.instance.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");

                SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.');
            } else {
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");

                SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.', null, () => {
                    voiceListener();
                });
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
            let order = `<span class='sr-only'>Información sobre tu orientación.</span>
                Estás mirando hacia ${$(`#${lookingAtFeature}`).attr('data-name')}.
            `;

            $("#orientationStatus").html(order);
        }
    });
});

function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}

function startNavigation(source, target) {
    $.getJSON(`/map/data/pi/${source},${target},${$("#impairmentSelect").val()}`, function(path) {
        console.log('path', path);
        navigationMode(path);

        if ($("#impairmentSelect").val() != 0 && path.disability == 0) {
            $("#nonAccessibleWarning").css("display", "block");
            $("#nonAccessibleWarning").removeAttr("aria-hidden");
            $("#nonAccessibleWarning").html($("#nonAccessibleWarning").html());
        } else {
            $("#nonAccessibleWarning").attr("aria-hidden", "true");
            $("#nonAccessibleWarning").css("display", "none");
        }
    });
}

function voiceListener() {
    SVGVoiceControls.setOn(true);
    SVGControls.instance.voiceControl.start(({confidence, transcript}) => {
        /*
            En Android, la transcripción llega dos veces.
            Para evitar dar respuesta las dos veces, vamos
            a ignorar toda transcripción que sea igual a la
            anterior en un intervalo de X segundos.
        */
        
        if (transcript == lastSentence) return;
        lastSentence = transcript;
        setTimeout(() => {
            lastSentence = null;
        }, 1000);

        console.log('Voice received:');
        console.log(confidence, transcript);

        let parsed = SVGControls.instance.voiceControl.parseAction(transcript);
        if (parsed) {
            console.log('[ROUTE] Parsed as', parsed);
            let {name} = parsed;

            switch (name) {
                case 'unknown':
                    SVGControls.instance.voiceControl.say('No te he entendido');
                    return;

                case 'route':
                    let { origin, target } = parsed;
                    routeByVoice(origin, target);
                    return;

                case 'repeatStep':
                    var step = $('.route-steps .route-step:focus');
                    if (step.length == 1) {
                        console.log('Repitiendo paso', step);

                        if (!SVGVoiceControls.isChromevoxActive()) {
                            SVGControls.instance.voiceControl.say(step.text(), null, () => {
                                voiceListener();
                            });
                        } else {
                            SVGControls.instance.voiceControl.wait(step.text().split(" ").length * SVGVoiceControls.time_per_word)
                        }

                        step.blur();
                        step.trigger('focus');
                    }

                    return;

                case 'readStep':
                    let { stepNo } = parsed;
                    stepNo = (parseInt(stepNo) == NaN) ? SVGControls.instance.toDigit(stepNo) : parseInt(stepNo);
                   
                    var step = $(`.route-steps .route-step[data-step='${stepNo}']`);
                    if (step.length == 1) {
                        console.log('Leyendo paso', stepNo);

                        if (!SVGVoiceControls.isChromevoxActive()) {
                            SVGControls.instance.voiceControl.say(step.text(), null, () => {
                                voiceListener();
                            });
                        } else {
                            SVGControls.instance.voiceControl.wait(step.text().split(" ").length * SVGVoiceControls.time_per_word);    
                        }

                        step.trigger('focus');
                    }

                    return;
                case 'nextStep':
                    var currentStep = $('.route-steps .route-step:focus');
                    if (currentStep.length == 1) {
                        let sno : number = parseInt(currentStep.attr('data-step'));
                        if ($(`.route-step[data-step=${sno + 1}]`).length == 1) {
                            if (!SVGVoiceControls.isChromevoxActive()) {
                                SVGControls.instance.voiceControl.say($(`.route-step[data-step=${sno + 1}]`).text(), null, () => {
                                    voiceListener();
                                });
                            } else {
                                SVGControls.instance.voiceControl.wait($(`.route-step[data-step=${sno + 1}]`).text().split(" ").length * SVGVoiceControls.time_per_word);
                            }

                            $(`.route-step[data-step=${sno + 1}]`).trigger('focus');
                        }
                    }

                    return;

                case 'previousStep':
                    var currentStep = $('.route-steps .route-step:focus');
                    if (currentStep.length == 1) {
                        let sno : number = parseInt(currentStep.attr('data-step'));
                        if ($(`.route-step[data-step=${sno - 1}]`).length == 1) {
                            if (!SVGVoiceControls.isChromevoxActive()) {
                                SVGControls.instance.voiceControl.say($(`.route-step[data-step=${sno - 1}]`).text(), null, () => {
                                    voiceListener();
                                });
                            } else {
                                SVGControls.instance.voiceControl.wait($(`.route-step[data-step=${sno - 1}]`).html().split(" ").length * SVGVoiceControls.time_per_word);
                            }

                            $(`.route-step[data-step=${sno - 1}]`).trigger('focus');
                        }
                    }

                    return;

                case 'orientation':
                    $('.route-orientation').trigger('focus');
                    return;

                case 'zoom':
                    SVGControls.instance.navigationHandler((parsed.direction === 'acercar') ? 'zoom-in' : 'zoom-out');
                    return;

                case 'shutdown':
                    SVGVoiceControls.setOn(false);
                    SVGControls.instance.voiceControl.stop();

                    $(this).attr('data-dictating', 'false');
                    $(this).removeClass("active");
                    $("#dictateStatus").html("Haz click para comenzar a escuchar");
    
                    SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.', null, () => {});
    
                    return;

                default:
                    SVGControls.instance.navigationHandler(parsed.direction);
                    return;
            }
        }
    });
}

function routeByVoice(origin, target) {
    SVGVoiceControls.setOn(false);
    SVGControls.instance.voiceControl.stop();

    selectByVoice(origin, 'origen', (selOrigin) => {
        if (selOrigin == null) {
            SVGControls.instance.voiceControl.say(`No se puede obtener la ruta.`, null, () => {
                voiceListener();
            });
        } else {
            selectByVoice(target, 'destino', (selTarget) => {
                if (selOrigin != null && selTarget != null) {
                    SVGControls.instance.voiceControl.say(`Calculando ruta`, null, () => {
                        console.log('Ruta de ', selOrigin, 'a', selTarget);
                        $("#impairmentSelect").val(1);
                        SVGControls.instance.voiceControl.wait(5000);
                        startNavigation(selOrigin.id, selTarget.id);

                        if ($("#nonAccessibleWarning").css("display") == "block") {
                            SVGControls.instance.voiceControl.say("La ruta calculada tiene problemas de accesibilidad, pero es la única que se ha podido encontrar.");
                        }

                        setTimeout(() => {
                            voiceListener();
                        }, 8000);
                    });
                } else {
                    console.log('[ERROR]', selOrigin, selTarget);
                    SVGControls.instance.voiceControl.say(`No se puede obtener la ruta.`, null, () => {
                        voiceListener();
                    });
                }
            });
        }
    });
}

function selectByVoice(place, mode, callback) {
    $.getJSON(`/map/data/s/name/${place}`, function(data) {
        let {results} = data;
        console.log('Results', results);
       
        if (results.length == 0) {
            SVGControls.instance.voiceControl.say(`No se han encontrado lugares con el nombre ${place}.`, () => {
                callback(null);
            });
        } else if (results.length == 1) {
            SVGControls.instance.voiceControl.say(`Seleccionado ${results[0].name} como ${mode}`, () => {
                callback(results[0]);
            });
        } else {
            SVGControls.instance.voiceControl.say(`Se han encontrado varios lugares relacionados con ${place}. Selecciona uno de ellos:`, null, () => {
        
                for (let i = 0; i < results.length; i++) {
                    SVGControls.instance.voiceControl.say(`Resultado número ${i + 1}. ${results[i].name}`);
                }

                SVGControls.instance.voiceControl.say(`Di 'número' seguido del número de lugar a seleccionar. Di 'cancelar' para salir.`, null, () => {
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
                });
            });
        }
    });
}

function selectOption(callback) {
    SVGVoiceControls.setOn(true);
    SVGControls.instance.voiceControl.start(({confidence, transcript}) => {
        console.log('Voice received:');
        console.log(confidence, transcript);

        if (transcript.match(/cancelar/i) != null) { callback(-1); return; }
        let t = transcript.match(/número (\d+)/i);
        if (t != null) {
            SVGControls.instance.voiceControl.stop();
            callback(parseInt(t[1]) - 1);
        } else {
            SVGControls.instance.voiceControl.stop();
            t = transcript.match(/número (\w+)/i);
            callback(SVGControls.instance.toDigit(t[1]) - 1);
        }
    });
}
