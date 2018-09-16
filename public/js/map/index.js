import { SVGControls } from './SVGControls.js';
import { SVGMap } from './SVGMap.js';
import { SVGVoiceControls } from './SVGVoiceControls.js';

var controls;
$(document).ready(function() {

    // DEBUG
    window.gsvg = SVGMap.instance.svg;

    $("form[action='']").on('submit', (e) => {
        e.preventDefault();
    });

    var altk = false;

    controls = new SVGControls();
    controls.pageLoad();

    // Navigation buttons
    $("#controls #pad .btn").click(function(e) {
        e.preventDefault();
        controls.navigationHandler($(this).attr("data-map-nav"));
    });

    // Navigation keyboard shortcuts
    $("body").not("input").not("textarea").keydown(function(e) {            
        altk = altk || (e.which == 18);
        if (!altk) return;

        var mode = '';
        switch (e.which) {
            case 189:
            case 171: // +
                mode = 'zoom-in';
                break;

            case 187:
            case 173: // -
                mode = 'zoom-out';
                break;

            case 38: // Up arrow
                mode = 'up';
                break;

            case 40: // Down arrow
                mode = 'down';
                break;

            case 37:
                mode = 'left';
                break;

            case 39:
                mode = 'right';
                break;
        }

        controls.navigationHandler(mode);
    });

    // Alt key release
    $("body").not("input").not("textarea").keyup(function(e) {
        if (e.which == 18) {
            altk = false;
        }
    });

    // Búsqueda
    $("#searchform").on('submit', function(e) {
        e.preventDefault();
        let query = $("#queryTxt").val();
        search(query);
    });

    // Voz
    if (SVGVoiceControls.compatible()) {
        controls.onSearchVoiceQuery = (query) => {
            console.log(query);
            search(query, true);
        };

        controls.onUnknownVoiceCommand = () => {
            speech.say('No te he entendido.');
        };

        $("#dictateBtn").on('click', function() {
            if ($(this).attr('data-dictating') == 'true') {
                controls.stopVoice();
                $(this).attr('data-dictating', 'false');
                $(this).removeClass("active");
                $("#dictateStatus").css("display", "none");

                controls.voiceControl.say('El mapa ha dejado de escuchar.');
            } else {
                controls.startVoice();
                $(this).attr('data-dictating', 'true');
                $(this).addClass("active");
                $("#dictateStatus").css("display", "inline");

                controls.voiceControl.say('El mapa está ahora escuchando.');
            }

            $(this).blur();
        });
    } else {
        $("#dictateBtn").css("display", "none");
    }

    /*
        Cuando se añade un nuevo elemento SVG, se notifica
        al observer, que recorre los elementos añadidos
        agregando el listener si no estaba ya escuchando.
    */
    let observer = new MutationObserver((list) => {
        for (const elements of list) {
            for (const element of elements.addedNodes) {
                if($(element).find("a.building-wrapper").attr("data-listened") != true) {
                    $(element).find("a.building-wrapper").click(function(e) {
                        if ($(this).hasClass('non-clickable')) return;

                        $.get('/map/data/b/' + $(this).attr('data-building'), properties => {
                            $("#data-table").css("display", "block");
                            $("#results-table").css("display", "none");
                
                            $("#data-table").empty();

                            for (var property in properties) {
                                if (properties[property]['userinterest']) {
                                    var row = document.createElement("tr");
                                    
                                    var headerCol = document.createElement("th");
                                    var valueCol = document.createElement("td");
                                    $(headerCol).html(properties[property]['display']);
                                    $(valueCol).html(properties[property]['value']);

                                    $(row).append(headerCol);
                                    $(row).append(valueCol);

                                    $("#data-table").prepend(row);
                                    $("#data-status").html("Edificio seleccionado");
                                }
                            }
                        });
                    });

                    $(element).find("a.building-wrapper").attr("data-listened", true);
                }
            }
        }
    });

    observer.observe($(SVGMap.instance.container).get(0), { attributes: false, childList: true, subtree: false });
});

function search(query, viaspeech = false) {
    $.getJSON('/map/data/s/name/' + query, (data) => {
        let results = data.results;
        console.log(results);

        
        $("#data-table").css("display", "none");
        $("#results-table").css("display", "block");
        
        $("#results-table").empty();
        
        let i = 1;
        let str = "Estos son los resultados para la búsqueda " + query;
        for (const result of results) {
            var row = document.createElement("tr");
            
            var headerCol = document.createElement("th");
            var valueCol = document.createElement("td");
            var visitBtn = document.createElement("button");
            $(visitBtn).addClass("btn btn-success result-view").html("Ir").attr("aria-label", "Ver en el mapa");
            $(visitBtn).attr("data-centerx", result.centerx).attr("data-centery", result.centery);
            $(visitBtn).attr('data-result-id', i);
            
            $(valueCol).append(visitBtn);
            
            $(headerCol).html(result.name);
            
            $(row).append(headerCol);
            $(row).append(valueCol);
            $(row).attr("aria-atomic", "true");
            
            $("#results-table").append(row);
            
            if (viaspeech) {
                str += "\n Resultado número " + i + ": " + result.name;
            }
            
            i++;
        }
        
        if (viaspeech) {
            str += "\n Selecciona un resultado para verlo en el mapa.";
            controls.onSearchResultSelected = (selection) => {
                let centerx = $(".result-view[data-result-id='"+ selection +"']").attr('data-centerx');
                let centery = $(".result-view[data-result-id='"+ selection +"']").attr('data-centery');
    
                if (centerx != undefined && centery != undefined) {
                    SVGMap.instance.zoomAndMove(centerx, centery, 7);
                } else {
                    speech.say("No se ha podido seleccionar ese resultado.");
                }
            };

            controls.voiceControl.say(str);
        }

        $("#data-status").html("Búsqueda de '"+ query +"'");

        $("button.result-view").on('click', function(e) {
            e.preventDefault();
            let centerx = $(this).attr('data-centerx');
            let centery = $(this).attr('data-centery');

            SVGMap.instance.zoomAndMove(centerx, centery, 7);
        });
    });
}