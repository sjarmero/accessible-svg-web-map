import { SVGControls } from './SVG/SVGControls.js';
import { SVGMap } from './SVG/SVGMap.js';
import { search } from './search.js';

export function setupEvents() {
    $("form[action='']").on('submit', (e) => {
        e.preventDefault();
    });

    var altk = false;

    window.controls = new SVGControls();
    controls.pageLoad();

    // Navigation buttons
    $("#pad .btn").click(function(e) {
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
            case 171: // -
                mode = 'zoom-out';
                break;

            case 187:
            case 173: // +
                mode = 'zoom-in';
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

    // Drag and drop map to move
    let moving = false;
    let ox, oy;

    let move_event = ('ontouchstart' in window) ? 'touchmove' : 'mousemove';
    let up_event = ('ontouchstart' in window) ? 'touchend' : 'mouseup';
    let down_event = ('ontouchstart' in window) ? 'touchstart' :  'mousedown';
    const CTM = $(SVGMap.instance.container).get(0).getScreenCTM();

    $(SVGMap.instance.container).on(down_event, function(e) {
        moving = ("ontouchstart" in window) ? (e.touches.length == 1) : true;

        ox = ("ontouchstart" in window) ? e.targetTouches[0].pageX: e.pageX;
        oy = ("ontouchstart" in window) ? e.targetTouches[0].pageY: e.pageY;
    });

    $(SVGMap.instance.container).on(up_event, function(e) {
        moving = false;
    });

    $(SVGMap.instance.container).on(move_event, function(e) {
        if (moving) {
            let x = ("ontouchstart" in window) ? e.targetTouches[0].pageX: e.pageX;
            let y = ("ontouchstart" in window) ? e.targetTouches[0].pageY: e.pageY;

            let xdiff = (x - ox) / -35;
            let ydiff = (y - oy) / -35;
            
            SVGMap.instance.move(xdiff, ydiff, false);
        }
    });

    // Scroll to zoom
    let zooming = false;
    $(SVGMap.instance.container).on('mousewheel', function(e) {
        if (zooming) return;

        console.log(e.deltaX, e.deltaY, e.deltaFactor);
        if (e.deltaY < 0 && e.deltaY != -0) {
            SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel - 1, true);
        } else {
            SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel + 1, true);
        }

        zooming = true;
        setTimeout(() => zooming = false, 400);

    });

    // Pinch/spread to zoom
    let odistance;
    let scale = false;
    $(SVGMap.instance.container).on('touchstart', function(e) {
        if (e.touches.length == 2) {
            scale = true;
            odistance = Math.abs(e.touches[0].pageX - e.touches[1].pageX);
        }
    });

    $(SVGMap.instance.container).not('a').on('touchmove', function(e) {
        e.preventDefault();
        if (scale && !zooming && e.touches.length == 2) {
            let distance = Math.abs(e.touches[0].pageX - e.touches[1].pageX);

            if (distance > odistance) {
                SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel + 1, true);
                zooming = true;
            } else {
                SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel - 1, true);
                zooming = true;
            }

            setTimeout(() => zooming = false, 400);
        }
    });

    // Búsqueda
    $("#searchform").on('submit', function(e) {
        e.preventDefault();
        let query = $("#queryTxt").val();
        search(query);
    });
}