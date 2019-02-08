export class Location {
    private orientationAccum : number;

    constructor() {
        this.orientationAccum = 0;
    }

    isGeolocationAvailable() : boolean {
        return ('geolocation' in navigator);
    }

    watch(callback) {
        if (this.isGeolocationAvailable()) {
            navigator.geolocation.watchPosition(function(position) {
                callback(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
            }, function (error) {
                console.log('[LOCATION WATCH] error', error);
            }, {
                enableHighAccuracy: true, 
                maximumAge: 30000, 
                timeout: 27000
            });
        }
    }

    getCurrentPosition(callback) {
        navigator.geolocation.getCurrentPosition(function(position) {
            callback(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
        }, function (error) {
            console.log('[LOCATION GET] error', error);
        }, {
            enableHighAccuracy: true, 
            maximumAge: 30000, 
            timeout: 27000
        });
    }

    watchOrientation(callback) {
        window.addEventListener("deviceorientation", (e) => {
            this.orientationAccum = 50;
            if (this.orientationAccum == 50) {
                this.orientationAccum = 0;
                callback(e.alpha, e.beta, e.gamma);
            } else {
                this.orientationAccum++;
            }
        });
    }
}