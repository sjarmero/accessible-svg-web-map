import { SVGControls } from './SVG/SVGControls.js';
import { SVGMap } from './SVG/SVGMap.js';

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

    $(SVGMap.instance.container).on(down_event, function(e) {
        e.preventDefault();
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
            let xdiff = (("ontouchstart" in window) ? (-1) : 1) * (x - ox) / 50;
            let ydiff = (("ontouchstart" in window) ? (-1) : 1) * (y - oy) / 50;

            SVGMap.instance.move(xdiff, ydiff, false);
        }
    });

    // Scroll to zoom
    let zooming = false;
    $(SVGMap.instance.container).on('mousewheel', function(e) {
        e.preventDefault();
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
        e.preventDefault();
        if (e.touches.length == 2) {
            scale = true;
            odistance = Math.abs(e.touches[0].pageX - e.touches[1].pageX);
        }
    });

    $(SVGMap.instance.container).on('touchmove', function(e) {
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
                        showBuildingInfo($(this).attr('data-building'));
                    });

                    $(element).find("a.building-wrapper").attr("data-listened", true);
                }
            }
        }
    });

    observer.observe($(SVGMap.instance.container).get(0), { attributes: false, childList: true, subtree: false });
});