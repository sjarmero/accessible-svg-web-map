"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGControls_1 = require("../SVG/SVGControls");
var search_1 = require("./search");
var SVGVoiceControls_1 = require("../SVG/SVGVoiceControls");
var SVGMap_1 = require("../SVG/SVGMap");
$(document).ready(function () {
    loadSettings();
    $("form[action='']").on('submit', function (e) {
        e.preventDefault();
    });
    // Navigation buttons
    $("#pad .btn").click(function (e) {
        e.preventDefault();
        SVGControls_1.SVGControls.instance.navigationHandler($(this).attr("data-map-nav"));
    });
    // Búsqueda
    $("#searchform").on('submit', function (e) {
        e.preventDefault();
        var query = $("#queryTxt").val();
        search_1.search(query);
    });
    // Voz
    if (SVGVoiceControls_1.SVGVoiceControls.compatible()) {
        $("#voicePanel").css("display", "block");
        SVGControls_1.SVGControls.instance.onSearchVoiceQuery = function (query) {
            console.log(query);
            search_1.search(query, true);
        };
        SVGControls_1.SVGControls.instance.onUnknownVoiceCommand = function () {
            SVGControls_1.SVGControls.instance.voiceControl.say('No te he entendido.');
        };
        SVGControls_1.SVGControls.instance.onRouteCommand = function (data) {
            if (data == null) {
                window.location.href = "/route";
                return;
            }
        };
        $("#dictateBtn").on('click', function (e) {
            e.preventDefault();
            if ($(this).attr('data-dictating') == 'true') {
                SVGControls_1.SVGControls.instance.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");
                SVGControls_1.SVGControls.instance.voiceControl.say('El mapa ha dejado de escuchar.');
            }
            else {
                SVGControls_1.SVGControls.instance.startVoice();
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");
                SVGControls_1.SVGControls.instance.voiceControl.say('El mapa está ahora escuchando.');
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
                        search_1.showBuildingInfo($(this).attr('data-building'));
                    });
                    $(element).find('a.building-wrapper').on('focus', function (e) {
                        var id = $(this).attr('data-building');
                        var _a = $(this).attr('data-coords').split(':'), cx = _a[0], cy = _a[1];
                        search_1.focusBuilding(id, cx, cy, false);
                    });
                    $(element).find("a.building-wrapper").attr("data-listened", "true");
                }
            }
        }
    });
    observer.observe($(SVGMap_1.SVGMap.instance.container).get(0), { attributes: false, childList: true, subtree: true });
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
                            SVGMap_1.SVGMap.instance.zoomlevel += 2;
                            SVGMap_1.SVGMap.instance.zoomAndMove($(element).attr('data-x'), $(element).attr('data-y'), SVGMap_1.SVGMap.instance.zoomlevel);
                        });
                    }
                    else {
                        $(element).on('click', function (e) {
                            e.preventDefault();
                            search_1.focusBuilding($(element).attr('data-id'), $(element).attr('data-x'), $(element).attr('data-y'), false);
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
    listObserver.observe($("#currentViewPanel ul").get(0), { attributes: false, childList: true, subtree: false });
});
