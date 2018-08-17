const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;

var zoomlevel = 5;

$(document).ready(function() {
    const svg = SVG('map');
    var dragging = false;
    var {initx, inity} = 0;

    $.get('/map/data', function(data) {
        drawWithAccData(svg, data);
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
        $("#map svg a").on('keypress click', function(e) {
            if (e.type == "click" || e.keyCode == 0 || e.keyCode == 13) {
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
            }
        });

        // Navigation buttons
        $("#controls #pad .btn").click(function(e) {
            e.preventDefault();
            const mode = $(this).attr("data-map-nav");
            const STEP = 15 + (20 - zoomlevel);

            var vbox = svg.viewbox();
            var vbx = vbox.x;
            var vby = vbox.y;
            var vbzx = vbox.width;
            var vbzy = vbox.height;
        
            var xdif = 0, ydif = 0;

            switch (mode) {
                case 'up': 
                    ydif = -STEP;
                    break;

                case 'down':
                    ydif = STEP;
                    break;

                case 'left': 
                    xdif = -STEP;
                    break;

                case 'right':
                    xdif = STEP;
                    break;

                case 'zoom-in':
                    zoomlevel = (zoomlevel == 20) ? zoomlevel : zoomlevel + 1;
                    resizeToLevel(svg, zoomlevel);

                    break;

                case 'zoom-out':
                    zoomlevel = (zoomlevel == 1) ? zoomlevel : zoomlevel - 1;
                    resizeToLevel(svg, zoomlevel);
                    break;
            }

            vbx += xdif;
            vby += ydif;
        
            moveTo(svg, vbx, vby);
        })
    });
});

async function drawWithAccData(svg, data) {
    svg.attr('id', 'SVG_MAIN');
    svg.attr('preserveAspectRatio', 'xMidYMid slice');
    svg.attr('class', 'map-dragable');
    svg.attr('tabindex', 0);

    resizeToLevel(svg, zoomlevel);

    const main = svg.group().attr('id', 'SVG_MAIN');

    for (feature of data.buildings) {
        const g = main.group();

        const a = g.link('#');
        a.attr('data-building', feature.properties.id.value);
        
        const rect = a.path().attr('d', feature.path);
        rect.attr('id', feature.properties.id.value);
        rect.attr('class', 'building');

        const img = a.image('/building_marker.svg', 14, 14);
        img.attr('class', 'marker');
        img.attr('x', feature.centerx - 15);
        img.attr('y', feature.centery - 7);

        const text = a.plain(feature.properties.name.value);
        text.attr('x' , feature.centerx);
        text.attr('y', feature.centery);
        text.attr('text-anchor', 'start');
        text.attr('id', 'label-' + feature.properties.id.value);
        text.attr('role', 'presentation');
        text.attr('aria-hidden', 'true');

        a.attr('aria-labelledby', 'label-' + feature.properties.id.value);
    }
}

function resizeToLevel(svg, level) {
    console.log('Resize to ' + level);

    var vbx = $("#map").width();
    vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);

    console.log(vbx + "(" + svg.viewbox().x + "," + svg.viewbox().y + ")");
    svg.viewbox(svg.viewbox().x, svg.viewbox().y, vbx, vbx);
}

function moveTo(svg, x, y) {
    svg.viewbox(x, y, svg.viewbox().width, svg.viewbox().height);
}

function moveViewBox(svg, initx, inity, e) {
    var vbox = svg.viewbox();
    var vbx = vbox.x;
    var vby = vbox.y;

    var xdif = (e.pageX - initx) / 50;
    var ydif = (e.pageY - inity) / 50;

    vbx += xdif;
    vby += ydif;

    svg.viewbox(vbx, vby, svg.viewbox().width, svg.viewbox().height);
}