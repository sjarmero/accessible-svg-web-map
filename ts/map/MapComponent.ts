import { SVGMap } from '../SVG/SVGMap.js';
import { SVGControls } from '../SVG/SVGControls.js';
import { Location } from '../location/Location.js';

declare var proj4;

$(document).ready(function() {
    (<any>window).gsvg = SVGMap.instance.svg;

    SVGControls.instance.pageLoad();
    SVGMap.instance.moveTo(717444.93870502, -4251399.25399798);
    
    /*
        Map Events
    */
    var altk = false;

    // Navigation keyboard shortcuts
    $("body").not("input").not("textarea").not(".btn").keydown(function(e) {   
        altk = altk || (e.which == 18);
        if (!altk) return;

        var mode = '';
        switch (e.which) {
            case 189:
            case 109:
            case 171: // -
                mode = 'zoom-out';
                break;

            case 187:
            case 107:
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

        SVGControls.instance.navigationHandler(mode);
    });

    // Alt key release
    $("body").not("input").not("textarea").not(".btn").keyup(function(e) {
        if (e.which == 18) {
            altk = false;
        }
    });

    // Double click or tap to zoom in
    $(SVGMap.instance.container).not(".feature-object").not(".gmarker").not(".map-marker").on('dblclick', function(e) {
        let {x, y} = screenToSVG({x: e.pageX, y: e.pageY });
        SVGMap.instance.zoomAndMove(x, y, SVGMap.instance.zoomlevel + 1);
    });

    // Double right click to zoom out
    let firstClick = false;
    $(SVGMap.instance.container).not(".feature-object").not(".gmarker").not(".map-marker").on('contextmenu', function(e) {
        e.preventDefault();

        if (firstClick) {
            firstClick = false;
            let {x, y} = screenToSVG({x: e.pageX, y: e.pageY });
            SVGMap.instance.zoomAndMove(x, y, SVGMap.instance.zoomlevel - 1);    
        }

        firstClick = true;
        setTimeout(() => {
            firstClick = false;
        }, 300);
    });

    // Drag and drop map to move
    let moving = false, moved = false;
    let ox, oy;

    let move_event = ('ontouchstart' in window) ? 'touchmove' : 'mousemove';
    let up_event = ('ontouchstart' in window) ? 'touchend' : 'mouseup';
    let down_event = ('ontouchstart' in window) ? 'touchstart' :  'mousedown';

    $(SVGMap.instance.container).on(down_event, function(e) {
        e.preventDefault();    
        moving = ("ontouchstart" in window) ? (e.touches.length == 1) : true;

        let {x, y} = screenToSVG({x: ("ontouchstart" in window) ? e.targetTouches[0].pageX: e.pageX, y: ("ontouchstart" in window) ? e.targetTouches[0].pageY: e.pageY });
        ox = x;
        oy = y;
    });

    $(SVGMap.instance.container).on(up_event, function(e) {
        e.preventDefault();
        moving = false;

        if (moved) {
            SVGMap.instance.updateSidebar();
        }
    });

    $(SVGMap.instance.container).on(move_event, function(e) {
        if (moving) {
            let {x, y} = screenToSVG({x: ("ontouchstart" in window) ? e.targetTouches[0].pageX: e.pageX, y: ("ontouchstart" in window) ? e.targetTouches[0].pageY: e.pageY });

            let xdiff = (x - ox) * -0.36;
            let ydiff = (y - oy) * -0.36;

            SVGMap.instance.move(xdiff, ydiff, false);

            moved = (xdiff != 0 || ydiff != 0);
        }
    });

    let lastCursorPos;
    $(SVGMap.instance.container).on('mousemove', function(e) {
        lastCursorPos = {x: e.pageX, y: e.pageY };
    });

    // Scroll to zoom
    let zooming = false;
    $(SVGMap.instance.container).on('mousewheel DOMMouseScroll', function(e) {
        e.preventDefault();
        if (zooming) return;

        let wheel = (typeof (<any>e.originalEvent).detail == 'number' && (<any>e.originalEvent).detail !== 0) ? (<any>e.originalEvent).detail : (<any>e.originalEvent).wheelDelta;
        console.log('wheel', wheel);

        let {x, y} = screenToSVG(lastCursorPos);
        if (wheel > 0) {
            SVGMap.instance.zoom(SVGMap.instance.zoomlevel + 1, x, y, true);
        } else {
            SVGMap.instance.zoom(SVGMap.instance.zoomlevel - 1, x, y, true);
        }

        zooming = true;
        setTimeout(() =>  {
            zooming = false
        }, 400);

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
            } else if (distance < odistance) {
                SVGMap.instance.resizeToLevel(SVGMap.instance.zoomlevel - 1, true);
                zooming = true;
            }

            setTimeout(() => zooming = false, 400);
        }
    });

    // Localización 
    let locationService = new Location();
    let lastLocation = null;
    locationService.watch(function(lat, long) {
        let [x, y] = proj4('EPSG:4326', 'EPSG:25830', [long, lat]);
        lastLocation = {x: x, y: -y};

        SVGMap.instance.drawLocation(x, -y);
    });

    locationService.watchOrientation(function(alpha, beta, gamma) {
        if (lastLocation != null) {
            SVGMap.instance.drawOrientation(lastLocation.x, lastLocation.y, alpha);
        }
    });
});

interface Point {
    x : number;
    y : number;
}

function screenToSVG(point : Point) : Point {
    const CTM = (<any>$(SVGMap.instance.container).get(0)).getScreenCTM();

    let p = (<any>$(SVGMap.instance.container).get(0)).createSVGPoint();
    p.x = point.x;
    p.y = point.y;

    return p.matrixTransform(CTM.inverse());
}

function SVGtoScreen(point : Point) : Point {
    const CTM = (<any>$(SVGMap.instance.container).get(0)).getScreenCTM();

    let p = (<any>$(SVGMap.instance.container).get(0)).createSVGPoint();
    p.x = point.x;
    p.y = point.y;

    return p.matrixTransform(CTM);
}