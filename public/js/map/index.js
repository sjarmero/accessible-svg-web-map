import { SVGMap } from './SVGMap.js';
import { SVGControls } from './SVGControls.js';

$(document).ready(function() {
    var altk = false;

    let map = new SVGMap();
    map.draw();
    map.groupMarkers(map.zoomlevel);

    console.log(map.svg);

    let controls = new SVGControls(map);

    // Navigation buttons
    $("#controls #pad .btn").click(function(e) {
        e.preventDefault();
        controls.navigationHandler($(this).attr("data-map-nav"));

        map.groupMarkers(map.zoomlevel);
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

    $("a.non-link").click(function(e) {
        e.preventDefault();
    });
});