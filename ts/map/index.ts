import { SVGControls } from "../SVG/SVGControls";
import { search, showBuildingInfo, focusBuilding, toggleCard } from "./search";
import { SVGVoiceControls } from "../SVG/SVGVoiceControls";
import { SVGMap } from "../SVG/SVGMap";
import { observeOrientation } from "../location/LocationComponent";
import { Location } from '../location/Location';
import { loadSettings } from "../settings/load";
import { Settings } from "../settings/defaults";

declare var proj4;
declare var Cookies;

$(document).ready(function() {
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

    // Búsqueda alrededor
    $("#radioTxt").val(Cookies.get('locationRadio') || Settings.locationRadio);

    let lastLocation;
    locationService.watch((lat, long) => {
        let [x, y] = (<any>proj4('EPSG:4326', 'EPSG:25830', [long, lat]));
        lastLocation = {x: x, y: y};

        getCloseFeaturesData(x, y, $("#radioTxt").val());

        $("#closeToYouPanel").removeClass("d-none");
    });

    $('.radius-control-up').on('click', function() {
        let current : number = parseInt(<any>$('#radioTxt').val());
        $('#radioTxt').val(current + 20);
        $('#radioTxt').trigger('change');
    });

    $('.radius-control-down').on('click', function() {
        let current : number = parseInt(<any>$('#radioTxt').val());
        if (current - 20 < 20) return;

        $('#radioTxt').val(current - 20);
        $('#radioTxt').trigger('change');
    });

    $('#radioTxt').on('change', function(e) {
        console.log('change');
        getCloseFeaturesData(lastLocation.x, lastLocation.y, $('#radioTxt').val());
    })

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

    $(".close-card").on('click', function(e) {
        let card = $(this).closest('.card');

        card.animate({
            'margin-bottom': '-20px',
            'opacity': '0'
        }, 'fast', () => {
            card.css({
                'display': 'none'
            });

            if ($(SVGMap.instance.container).find('svg .active').length > 0) {
                $(SVGMap.instance.container).find('svg .active').first().trigger('focus');
            }
        });
    });

    $(".close-results").on('click', function(e) {
        $("#resultsPanel").css({
            'display': 'none'
        });
    });

    // Voz
    if (SVGVoiceControls.compatible()) {
        $('#voicePanel').removeClass("d-none");
        $('#voicePanel').addClass("d-block");

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

                SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.', null, () => {});
            } else {
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");

                SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.', null, () => {
                    SVGControls.instance.startVoice();
                });
            }
        });
    }

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

        if (lookingAtFeature != null && lookingAtFeature != undefined && lookingAtFeature != "") {
            let order = `<span class='sr-only'>Información sobre tu orientación.</span>
                Estás mirando hacia ${lookingAtFeature}.
            `;

            $('#orientationContainer').html(order);
        }
    });
});

$(window).on("beforeunload", function() {
    console.log('Disconnecting voice if set...');
    if (SVGVoiceControls.compatible()) {
        SVGVoiceControls.setOn(false);
        SVGControls.instance.voiceControl.stop();
        SVGControls.instance.voiceControl.onTranscript = null;

        console.log('Voice disconnected');
    }
});

function getCloseFeaturesData(x, y, r) {
    $.getJSON(`/map/data/nn4p/${x},${y},${r}`, function(response) {
        let ul = $("#closeToYouPanel").find("ul");
        ul.empty();

        for (let i = 0; i < response.length; i++) {
            const result = response[i];

            let li = document.createElement('li');
            let a = document.createElement('a');

            $(a).attr('href', '#');
            $(a).attr('title', `Ver en el mapa ${result.iname}`);
            $(a).attr('aria-label', `Ver en el mapa ${result.iname}`);
            $(a).attr('data-x', result.icenterx);
            $(a).attr('data-y', result.icentery);
            $(a).attr('data-id', result.iid);
            $(a).html(`<span class='sr-only'>Cerca de ti: </span>${result.iname} (a ${Math.ceil(result.distance)} metros)</a>`);
        
            $(a).on('click', function() {
                focusBuilding($(this).attr('data-id'), $(this).attr('data-x'), $(this).attr('data-y'), false);
            });

            $(a).addClass("col-11");
            $(a).appendTo(li);

            let nav = document.createElement('a');
            $(nav).attr('href', `/route?to=${result.iid}`);
            $(nav).attr('title', `Navegar a ${result.iname}`);
            $(nav).attr('aria-label', `Navegar a ${result.iname}`);
            $(nav).html('<i class="fas fa-route"></i>');

            $(nav).addClass('col-1 pull-right');
            $(nav).appendTo(li);

            $(li).addClass("row ml-2 mr-0");
            $(li).appendTo(ul);
        }
    });
}
