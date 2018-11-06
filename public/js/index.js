import { SVGControls } from "../SVG/SVGControls";
import { search } from "./search";
import { SVGVoiceControls } from "../SVG/SVGVoiceControls";
import { SVGMap } from "../SVG/SVGMap";

$(document).ready(function() {
    console.log('Hello!');
    $("form[action='']").on('submit', (e) => {
        e.preventDefault();
    });

    SVGControls.instance.pageLoad();
    SVGMap.instance.moveTo(717444.93870502, -4251399.25399798);

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
                window.location.href = "/route";
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

            $(this).blur();
        });
    }
});