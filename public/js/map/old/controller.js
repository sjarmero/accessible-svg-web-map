(function() {
    const ZOOM_LEVEL_BASE = 0.000246153846;
    const ZOOM_LEVEL_STEP = 0.4514682741;

    var zoomlevel = 3;
    var gsvg;
    var marker_groups = Array.apply(null, Array(20)).map(element => []);

    async function drawWithAccData(svg, data) {
        svg.attr('id', 'SVG_MAIN');
        svg.attr('preserveAspectRatio', 'xMidYMid slice');
        svg.attr('class', 'map-dragable');
        svg.attr('tabindex', 0);
        
        // Zoom and move (0, 0) to center
        resizeToLevel(svg, zoomlevel, false);
        moveTo(svg, -svg.viewbox().width/2, -svg.viewbox().width/2, false);

        const main = svg.group().attr('id', 'SVG_MAIN_CONTENT');

        for (const feature of data.buildings) {
            const g = main.group();

            const a = g.link('#feature-' + feature.properties.id.value).attr('class', 'non-link building-wrapper').attr('id', 'link-feature-' + feature.properties.id.value);
            a.attr('data-building', feature.properties.id.value);
            
            const rect = a.path().attr('d', feature.path);
            rect.attr('id', feature.properties.id.value);
            rect.attr('class', 'building');

            const marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');

            const img = marker.image('/images/building_marker.svg', 14, 14);
            img.attr('class', 'marker');
            img.attr('x', feature.centerx - 15);
            img.attr('y', feature.centery - 7);

            const text = marker.plain(feature.properties.name.value);
            text.attr('x' , feature.centerx);
            text.attr('y', feature.centery);
            text.attr('text-anchor', 'start');
            text.attr('id', 'label-' + feature.properties.id.value);

            a.attr('aria-labelledby', 'label-' + feature.properties.id.value);

            // We save this marker in its group for further hiding
            for (const group of feature.groups) {
                marker_groups[group].push(feature.properties.id.value);
            }
        }

        groupMarkers(svg, data, zoomlevel);
    }

    function resizeToLevel(svg, level, raisedbyuser = true) {
        var vbx = $("#map").width();
        vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);

        var wdiff = (raisedbyuser) ? (svg.viewbox().width - vbx) / 2 : 0;
        var handler = (raisedbyuser) ? svg.animate({ duration: 250 }) : svg;
        handler.viewbox(svg.viewbox().x + wdiff, svg.viewbox().y + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + zoomlevel;
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

                    $("#link-feature-" + marker).attr("tabindex", "-1");
                    $("#link-feature-" + marker).addClass("non-clickable");
                } else {
                    $("#link-feature-" + marker).removeAttr("tabindex");
                    $("#link-feature-" + marker).removeClass("non-clickable");

                    svg.select('#marker-' + marker).show();
                }
            }

            for (const gmarker of data.groups[i]) {
                if (i == level) {
                    const fit = (gmarker.affects.toString().length == 1) ? 1 : gmarker.affects.toString().length / 2;
                    const a = svg.select('#SVG_MAIN_CONTENT').members[0].link('#gmarker-' + gmarker.id).attr('class', 'non-link gmarker').attr('id', 'gmarker-' + gmarker.id);;
                    const gm = a.group().attr('class', 'gmarker');
                    const circle = gm.circle().radius(10);
                    circle.cx(gmarker.lat).cy(gmarker.long);
                    const text = gm.plain(gmarker.affects).attr('text-anchor', 'middle');
                    text.font({ size: 16 / fit });
                    text.move(gmarker.long, gmarker.lat - (8 / fit));

                    // Accessibility
                    a.title(gmarker.name).attr('id', 'gmarker-' + gmarker.id + '-title');
                    a.attr('aria-labelledby', 'gmarker-' + gmarker.id + '-title');
                    text.attr('aria-hidden', 'true');
                    text.attr('role', 'presentation');
                } else {
                    for (const member of svg.select('#gmarker-' + gmarker.id).members) {
                        member.remove();
                    }
                }
            }

            i++;
        }

        $("#map svg a.gmarker").click(function(e) {
            e.preventDefault();

            zoomlevel += 2;
            resizeToLevel(svg, zoomlevel);
            groupMarkers(svg, data, zoomlevel);
        });
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

    function navigationCallback(mode, svg, mapdata) {
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
    }

    window.SVGMap = {
        drawWithAccData: drawWithAccData,
        resizeToLevel: resizeToLevel,
        moveTo: moveTo,
        groupMarkers: groupMarkers,
        moveViewBox: moveViewBox,
        navigationCallback: navigationCallback,
        setZoomLevel: (level) => zoomlevel = level,
        getZoomLevel: () => zoomlevel
    };
})();