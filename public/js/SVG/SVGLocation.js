"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGLocation = /** @class */ (function () {
    function SVGLocation() {
        this.orientationAccum = 0;
    }
    SVGLocation.prototype.isGeolocationAvailable = function () {
        return ('geolocation' in navigator);
    };
    SVGLocation.prototype.watch = function (callback) {
        if (this.isGeolocationAvailable()) {
            navigator.geolocation.watchPosition(function (position) {
                callback(position.coords.latitude, position.coords.longitude);
            }, function (error) {
                console.log('[LOCATION WATCH] error', error);
            }, {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            });
        }
    };
    SVGLocation.prototype.getCurrentPosition = function (callback) {
        navigator.geolocation.getCurrentPosition(function (position) {
            callback(position.coords.latitude, position.coords.longitude);
        }, function (error) {
            console.log('[LOCATION GET] error', error);
        }, {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        });
    };
    SVGLocation.prototype.watchOrientation = function (callback) {
        var _this = this;
        window.addEventListener("deviceorientation", function (e) {
            if (_this.orientationAccum == 50) {
                _this.orientationAccum = 0;
                callback(e.alpha, e.beta, e.gamma);
            }
            else {
                _this.orientationAccum++;
            }
        });
    };
    return SVGLocation;
}());
exports.SVGLocation = SVGLocation;
