$(document).ready(function() {
    var mapdata;
    var altk = false;
    
    const svg = SVG('map');
    gsvg = svg; // FOR DEBUG

    var dragging = false;
    var {initx, inity} = 0;

    const parameters = window.location.href.split("#");
    for (const parameter of parameters) {
        const key = parameter.split("=")[0];
        const value = parameter.split("=")[1];

        if (key == "zoom" && value != undefined) {
            SVGMap.setZoomLevel(parseInt(value));
        }
    }

    $.get('/map/data', function(data) {
        console.log(data);
        mapdata = data;
        SVGMap.drawWithAccData(svg, data);
    }).done(function() {
        $(".map-dragable").mousedown(function(e) {
            e.preventDefault();
            dragging = true;
            initx = e.pageX;
            inity = e.pageY;

            $(this).css("cursor", "move");
        }).mousemove(function(e) {
            if (dragging) {
                moveViewBox(svg, initx, inity, e);
            }
        }).mouseup(function(e) {
            dragging = false;
            $(this).css("cursor", "default");
        });

        // Building info
        $("#map svg a.building-wrapper").click(function(e) {
            if ($(this).hasClass('non-clickable')) return;

            console.log("Building " + $(this).attr("data-building"));

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

        // Navigation buttons
        $("#controls #pad .btn").click(function(e) {
            e.preventDefault();
            SVGMap.navigationCallback($(this).attr("data-map-nav"), svg, mapdata);
        });

        // Navigation keyboard shortcuts
        $("body").not("input").not("textarea").keydown(function(e) {
            altk = altk || (e.which == 18);

            console.log(altk);

            if (!altk) return;

            console.log(e.which);

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

            SVGMap.navigationCallback(mode, svg, mapdata);
        });

        // Alt key release
        $("body").not("input").not("textarea").keyup(function(e) {
            if (e.which == 18) {
                altk = false;
            }
        });

        $("a.non-link").click(function(e) {
            e.preventDefault();
        });
    });
});