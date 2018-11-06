"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGControls_1 = require("../SVG/SVGControls");
var search_1 = require("./search");
var SVGVoiceControls_1 = require("../SVG/SVGVoiceControls");
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
});
