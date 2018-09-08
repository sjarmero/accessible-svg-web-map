import { SVGControls } from './SVGControls.js';
import { SVGMap } from './SVGMap.js';

$(document).ready(function() {
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