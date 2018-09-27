import { SVGVoiceControls } from './SVG/SVGVoiceControls.js';

$(document).ready(function() {
// Voz
    if (SVGVoiceControls.compatible()) {
        $("#voicePanel").css("display", "block");

        controls.onSearchVoiceQuery = (query) => {
            console.log(query);
            search(query, true);
        };

        controls.onUnknownVoiceCommand = () => {
            controls.voiceControl.say('No te he entendido.');
        };

        controls.onRouteCommand = (data) => {
            $("#routeSource").val(data.origin);
            $("#sourceForm .btn").trigger('click');

            $("#routeTarget").val(data.target);
            $("#targetForm .btn").trigger('click');

            setTimeout(() => {
                $("#calculateBtn").trigger('click');
            }, 1000);
        };

        $("#dictateBtn").on('click', function(e) {
            e.preventDefault();

            if ($(this).attr('data-dictating') == 'true') {
                controls.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").html("Haz click para comenzar a escuchar");

                controls.voiceControl.say('El mapa ha dejado de escuchar.');
            } else {
                controls.startVoice();
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").html("Escuchando...");

                controls.voiceControl.say('El mapa está ahora escuchando.');
            }

            $(this).blur();
        });
    }
});