import { SVGControls } from './SVGControls.js';
import { SVGMap } from './SVGMap.js';

$(document).ready(function() {

    // DEBUG
    window.gsvg = SVGMap.instance.svg;

    var altk = false;

    let controls = new SVGControls();
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
        console.log(query);

        $.getJSON('/map/data/s/name/' + query, (data) => {
            let results = data.results;
            console.log(results);

            $("#data-table").css("display", "none");
            $("#results-table").css("display", "block");

            $("#results-table").empty();
            for (const result of results) {
                var row = document.createElement("tr");
                                    
                var headerCol = document.createElement("th");
                var valueCol = document.createElement("td");
                var visitBtn = document.createElement("button");
                $(visitBtn).addClass("btn btn-success result-view").html("Ir").attr("aria-label", "Ver en el mapa");
                $(visitBtn).attr("data-centerx", result.centerx).attr("data-centery", result.centery);

                $(valueCol).append(visitBtn);

                $(headerCol).html(result.name);

                $(row).append(headerCol);
                $(row).append(valueCol);

                $("#results-table").append(row);
            }

            $("#data-status").html("Búsqueda de '"+ query +"'");

            $("button.result-view").on('click', function(e) {
                e.preventDefault();
                let centerx = $(this).attr('data-centerx');
                let centery = $(this).attr('data-centery');

                SVGMap.instance.zoomAndMove(centerx, centery, 7);
            })
        });
    });

    controls.onSearchVoiceQuery = (query) => {
        console.log(query);
    };

    $("#dictateBtn").on('click', function() {
        if ($(this).attr('data-dictating') == 'true') {
            controls.stopVoice();
            $(this).attr('data-dictating', 'false');
            $(this).removeClass("active");
        } else {
            controls.startVoice();
            $(this).attr('data-dictating', 'true');
            $(this).addClass("active");
        }
    });

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