import { SVGControls } from "../SVG/SVGControls.js";
import { search, showBuildingInfo, focusBuilding } from "./search.js";
import { SVGVoiceControls } from "../SVG/SVGVoiceControls.js";
import { SVGMap } from "../SVG/SVGMap.js";
$(document).ready(function () {
    console.log('Index');
    loadSettings();
    $("form[action='']").on('submit', function (e) {
        e.preventDefault();
    });
    // Navigation buttons
    $("#pad .btn").click(function (e) {
        e.preventDefault();
        SVGControls.instance.navigationHandler($(this).attr("data-map-nav"));
    });
    // Búsqueda
    $("#searchform").on('submit', function (e) {
        e.preventDefault();
        var query = $("#queryTxt").val();
        search(query);
    });
    // Voz
    if (SVGVoiceControls.compatible()) {
        $("#voicePanel").css("display", "block");
        SVGControls.instance.onSearchVoiceQuery = function (query) {
            console.log(query);
            search(query, true);
        };
        SVGControls.instance.onUnknownVoiceCommand = function () {
            SVGControls.instance.voiceControl.say('No te he entendido.');
        };
        SVGControls.instance.onRouteCommand = function (data) {
            if (data == null) {
                window.location.href = "/route";
                return;
            }
        };
        $("#dictateBtn").on('click', function (e) {
            e.preventDefault();
            if ($(this).attr('data-dictating') == 'true') {
                SVGControls.instance.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");
                SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.');
            }
            else {
                SVGControls.instance.startVoice();
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");
                SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.');
            }
            $(this).blur();
        });
    }
    /*
        Cuando se añade un nuevo elemento SVG, se notifica
        al observer, que recorre los elementos añadidos
        agregando el listener si no estaba ya escuchando.
    */
    var observer = new MutationObserver(function (list) {
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var elements = list_1[_i];
            for (var _a = 0, _b = elements.addedNodes; _a < _b.length; _a++) {
                var element = _b[_a];
                if ($(element).find("a.building-wrapper").attr("data-listened") != "true") {
                    $(element).find("a.building-wrapper").on('click', function (e) {
                        if ($(this).hasClass('non-clickable'))
                            return;
                        showBuildingInfo($(this).attr('data-building'));
                    });
                    $(element).find('a.building-wrapper').on('focus', function (e) {
                        var id = $(this).attr('data-building');
                        var _a = $(this).attr('data-coords').split(':'), cx = _a[0], cy = _a[1];
                        focusBuilding(id, cx, cy, false);
                    });
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
    var listObserver = new MutationObserver(function (list) {
        for (var _i = 0, list_2 = list; _i < list_2.length; _i++) {
            var elements = list_2[_i];
            var _loop_1 = function (liElement) {
                var element = $(liElement).find('a');
                if ($(element).attr("data-listened") != 'true') {
                    if ($(element).attr('data-type') == 'group') {
                        $(element).on('click', function (e) {
                            e.preventDefault();
                            SVGMap.instance.zoomlevel += 2;
                            SVGMap.instance.zoomAndMove($(element).attr('data-x'), $(element).attr('data-y'), SVGMap.instance.zoomlevel);
                        });
                    }
                    else {
                        $(element).on('click', function (e) {
                            e.preventDefault();
                            focusBuilding($(element).attr('data-id'), $(element).attr('data-x'), $(element).attr('data-y'), false);
                        });
                    }
                    $(element).attr("data-listened", "true");
                }
            };
            for (var _a = 0, _b = elements.addedNodes; _a < _b.length; _a++) {
                var liElement = _b[_a];
                _loop_1(liElement);
            }
        }
    });
    console.log('Running observer...');
    listObserver.observe($("#currentViewPanel ul").get(0), { attributes: false, childList: true, subtree: true });
});
