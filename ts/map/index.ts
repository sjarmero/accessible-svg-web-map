import { SVGControls } from "../SVG/SVGControls.js";
import { search, showBuildingInfo, focusBuilding } from "./search.js";
import { SVGVoiceControls } from "../SVG/SVGVoiceControls.js";
import { SVGMap } from "../SVG/SVGMap.js";
import { observeOrientation } from "../location/LocationComponent.js";
import { Location } from '../location/Location.js';

declare var proj4;
$(document).ready(function() {
    console.log('Index');
    loadSettings();

    $("form[action='']").on('submit', (e) => {
        e.preventDefault();
    });

    // Localización 
    let locationService = new Location();
    $('.focus-location button').on('click', function(e) {
        e.preventDefault();

        locationService.getCurrentPosition(function(lat, long) {
            let [x, y] = (<any>proj4('EPSG:4326', 'EPSG:25830', [long, lat]));
            SVGMap.instance.moveTo(x, -y);
        });
    });

    $('.focus-orientation button').on('click', function(e) {
        e.preventDefault();
        $('#orientationContainer').trigger('focus');
    });

    // Navigation buttons
    $("#pad .btn").click(function(e) {
        e.preventDefault();
        SVGControls.instance.navigationHandler($(this).attr("data-map-nav"));
    });

    // Búsqueda
    $("#searchform").on('submit', function(e) {
        e.preventDefault();
        let query = $("#queryTxt").val();
        search(query);
    });

    // Voz
    if (SVGVoiceControls.compatible()) {
        $("#voicePanel").css("display", "block");

        SVGControls.instance.onSearchVoiceQuery = (query) => {
            console.log(query);
            search(query, true);
        };

        SVGControls.instance.onUnknownVoiceCommand = () => {
            SVGControls.instance.voiceControl.say('No te he entendido.');
        };

        SVGControls.instance.onRouteCommand = (data) => {
            if (data == null) {
                window.location.href = "/route?voice";
                return;
            }
        };

        $("#dictateBtn").on('click', function(e) {
            e.preventDefault();

            if ($(this).attr('data-dictating') == 'true') {
                SVGControls.instance.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");

                SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.');
            } else {
                SVGControls.instance.startVoice();
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");

                SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.');
            }
        });
    }

    /*
        Cuando se añade un nuevo elemento SVG, se notifica
        al observer, que recorre los elementos añadidos
        agregando el listener si no estaba ya escuchando.
    */
   let observer = new MutationObserver((list) => {
        for (const elements of list) {
            for (const element of (<any>elements).addedNodes) {
                if($(element).find("a.building-wrapper").attr("data-listened") != "true") {
                    $(element).find("a.building-wrapper").on('click', function(e) {
                        if ($(this).hasClass('non-clickable')) return;

                        $(element).find("a.building-wrapper").removeClass("active");
                        $(this).addClass("active");

                        showBuildingInfo($(this).attr('data-building'));
                    });

                    $(element).find('a.building-wrapper').on('focus', function(e) {
                        let id = $(this).attr('data-building');
                        let [cx, cy] = $(this).attr('data-coords').split(':');
                        focusBuilding(id, cx, cy, false);
                    })

                    $(element).find("a.building-wrapper").attr("data-listened", "true");
                }
            }
        }
    });

    observer.observe($(SVGMap.instance.container).get(0), { attributes: false, childList: true, subtree: true });

    /*
        Cuando se añade un nuevo elemento SVG a la lista de elementos
        alternativa, se notifica al observer para que añada los eventos
        si no han sido añadidos ya.
    */

    let listObserver = new MutationObserver((list) => {
        for (const elements of list) {
            for (const liElement of (<any>elements).addedNodes) {
                let element = $(liElement).find('a');
                if($(element).attr("data-listened") != 'true') {
                    if ($(element).attr('data-type') == 'group') {
                        $(element).on('click', (e) => {
                            e.preventDefault();
                            SVGMap.instance.zoomlevel += 2;
                            SVGMap.instance.zoomAndMove($(element).attr('data-x'), $(element).attr('data-y'), SVGMap.instance.zoomlevel);
                        });
                    } else {
                        $(element).on('click', (e) => {
                            e.preventDefault();
                            focusBuilding($(element).attr('data-id'), $(element).attr('data-x'), $(element).attr('data-y'), false);
                        });
                    }

                    $(element).attr("data-listened", "true");
                }
            }
        }
    });

    listObserver.observe($("#currentViewPanel ul").get(0), { attributes: false, childList: true, subtree: true });

    observeOrientation($(SVGMap.instance.container).get(0), (lookingAtFeature) => {
        $('#orientationContainer').html('');


        if (lookingAtFeature != null && lookingAtFeature != undefined) {
            let order = `<span class='sr-only'>Información sobre tu orientación.</span>
                Estás mirando hacia ${$(`#${lookingAtFeature}`).attr('data-name')}.
            `;

            $('#orientationContainer').html(order);
        }
    });
});