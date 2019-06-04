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
    var ctrlk = false;

    // Navigation keyboard shortcuts
    $("body").not("input").not("textarea").not(".btn").keydown(function(e) {   
        var mode = '';

        altk = altk || (e.altKey);
        ctrlk = ctrlk || (e.ctrlKey);
        
        if (altk) {
            switch (e.which) {
                case 189:
                case 173: // -
                    mode = 'zoom-out';
                    break;

                case 187:
                case 171: // +
                    mode = 'zoom-in';
                    break;
            }
        }

        if (ctrlk) {
            switch (e.which) {
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
        }

        SVGControls.instance.navigationHandler(mode);
    });

    // Key release
    $("body").not("input").not("textarea").not(".btn").keyup(function(e) {
        if (e.altKey) {
            altk = false;
        }

        if (e.ctrlKey) {
            ctrlk = false;
        }
    });

    $(SVGMap.instance.container).on('click', function(e) {
        if (!$(e.target).hasClass("feature-block")) {
            $(SVGMap.instance.container).find(".active").removeClass("active");
        }
    });

    $(SVGMap.instance.container).on('focus', function() {
        if (SVGMap.instance.zoomlevel >= SVGMap.instance.MAX_GROUP_LEVEL) {
            if ($(SVGMap.instance.container).find('svg .active').length > 0) {
                console.log('Redirecting focus...');
                $(SVGMap.instance.container).find('svg .active').first().trigger('focus');
            }
        } else {
            $(SVGMap.instance.container).find('.marker-cluster').first().trigger('focus');
        }
    });

    // Localización 
    let locationService = new Location();
    let lastLocation = null;
    locationService.watch(function(lat, long, accuracy) {
        lastLocation = [lat, long];
        SVGMap.instance.drawLocation(lat, long, accuracy);
    });

    locationService.watchOrientation(function(alpha, beta, gamma) {
        SVGMap.instance.drawOrientation(alpha);
    });
});