const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;

var zoomlevel = 5;
var gsvg;
var marker_groups = Array.apply(null, Array(20)).map(element => []);

$(document).ready(function() {
    var mapdata;
    
    const svg = SVG('map');
    gsvg = svg; // FOR DEBUG

    var dragging = false;
    var {initx, inity} = 0;

    $.get('/map/data', function(data) {
        console.log(data);
        mapdata = data;
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

                    groupMarkers(svg, mapdata, zoomlevel);

                    return;

                case 'zoom-out':
                    zoomlevel = (zoomlevel == 1) ? zoomlevel : zoomlevel - 1;
                    resizeToLevel(svg, zoomlevel);

                    groupMarkers(svg, mapdata, zoomlevel);

                    return;
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
    
    // Zoom and move (0, 0) to center
    resizeToLevel(svg, zoomlevel, false);
    moveTo(svg, -svg.viewbox().width/2, -svg.viewbox().width/2, false);

    const main = svg.group().attr('id', 'SVG_MAIN');

    for (const feature of data.buildings) {
        // We save this marker in its group for further hiding
        for (const group of feature.groups) {
            marker_groups[group].push(feature.properties.id.value);
        }

        const g = main.group();

        const a = g.link('#');
        a.attr('data-building', feature.properties.id.value);
        
        const rect = a.path().attr('d', feature.path);
        rect.attr('id', feature.properties.id.value);
        rect.attr('class', 'building');

        const marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');

        const img = marker.image('/building_marker.svg', 14, 14);
        img.attr('class', 'marker');
        img.attr('x', feature.centerx - 15);
        img.attr('y', feature.centery - 7);

        const text = marker.plain(feature.properties.name.value);
        text.attr('x' , feature.centerx);
        text.attr('y', feature.centery);
        text.attr('text-anchor', 'start');
        text.attr('id', 'label-' + feature.properties.id.value);
        text.attr('role', 'presentation');
        text.attr('aria-hidden', 'true');

        a.attr('aria-labelledby', 'label-' + feature.properties.id.value);
    }
}

function resizeToLevel(svg, level, raisedbyuser = true) {
    var vbx = $("#map").width();
    vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);

    var wdiff = (raisedbyuser) ? (svg.viewbox().width - vbx) / 2 : 0;
    var handler = (raisedbyuser) ? svg.animate({ duration: 250 }) : svg;
    handler.viewbox(svg.viewbox().x + wdiff, svg.viewbox().y + wdiff, vbx, vbx);

    window.location.href = "#z" + zoomlevel;
}

function moveTo(svg, x, y, raisedbyuser = true) {
    var handler = (raisedbyuser) ? svg.animate({ duration: 250 }) : svg;
    handler.viewbox(x, y, svg.viewbox().width, svg.viewbox().height);
}

function groupMarkers(svg, data, level) {
    var i = 0;
    for (const group of marker_groups) {
        for (const marker of group) {
            if (i == level) {
                svg.select('#marker-' + marker).hide();
            } else {
                svg.select('#marker-' + marker).show();
            }
        }

        for (const gmarker of data.groups[i]) {
            if (i == level) {
                const gm = svg.group().attr('id', 'gmarker-' + gmarker.id);
                gm.circle().fill('red').radius(10).cx(gmarker.lat).cy(gmarker.long);
            } else {
                for (const member of svg.select('#gmarker-' + gmarker.id).members) {
                    member.remove();
                }
            }
        }

        i++;
    }
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