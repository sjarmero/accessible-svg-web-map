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

    $(SVGMap.instance.container).on('click', function(e) {
        if (!$(e.target).hasClass("feature-block")) {
            $(SVGMap.instance.container).find(".active").removeClass("active");
        }
    });

    $(SVGMap.instance.container).on('focus', function() {
        if (SVGMap.instance.zoomlevel >= SVGMap.instance.MAX_GROUP_LEVEL) {
            $(SVGMap.instance.container).find('svg .active').first().trigger('focus');
        } else {
            $(SVGMap.instance.container).find('.marker-cluster').first().trigger('focus');
        }
    });

    // Localización 
    let locationService = new Location();
    let lastLocation = null;
    locationService.watch(function(lat, long) {
        SVGMap.instance.drawLocation(lat, long);
    });

    locationService.watchOrientation(function(alpha, beta, gamma) {
        if (lastLocation != null) {
            SVGMap.instance.drawOrientation(lastLocation.x, lastLocation.y, alpha);
        }
    });
});