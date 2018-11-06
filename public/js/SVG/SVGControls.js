"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGMap_1 = require("./SVGMap");
var SVGVoiceControls_1 = require("./SVGVoiceControls");
var SVGLocation_1 = require("./SVGLocation");
var SVGControls = /** @class */ (function () {
    function SVGControls() {
        this.voice = new SVGVoiceControls_1.SVGVoiceControls();
        proj4.defs('EPSG:25830', "+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs");
    }
    Object.defineProperty(SVGControls, "instance", {
        get: function () {
            if (!SVGControls._instance) {
                SVGControls._instance = new SVGControls();
            }
            return SVGControls._instance;
        },
        enumerable: true,
        configurable: true
    });
    SVGControls.prototype.pageLoad = function () {
        SVGMap_1.SVGMap.instance.onDrawn = function () {
            setTimeout(function () {
                SVGMap_1.SVGMap.instance.groupMarkers(SVGMap_1.SVGMap.instance.zoomlevel);
            }, 100);
            var lastLocation = null;
            var svgl = new SVGLocation_1.SVGLocation();
            svgl.watch(function (lat, long) {
                var _a = proj4('EPSG:4326', 'EPSG:25830', [long, lat]), x = _a[0], y = _a[1];
                lastLocation = { x: x, y: -y };
                SVGMap_1.SVGMap.instance.drawLocation(x, -y);
            });
            svgl.watchOrientation(function (alpha, beta, gamma) {
                if (lastLocation != null) {
                    SVGMap_1.SVGMap.instance.drawOrientation(lastLocation.x, lastLocation.y, alpha);
                }
            });
            SVGMap_1.SVGMap.instance.updateSidebar();
        };
        SVGMap_1.SVGMap.instance.draw();
    };
    Object.defineProperty(SVGControls.prototype, "voiceControl", {
        get: function () {
            return this.voice;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGControls.prototype, "onSearchVoiceQuery", {
        get: function () {
            return this.searchResultCallback;
        },
        set: function (callback) {
            this.searchResultCallback = callback;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGControls.prototype, "onSearchResultSelected", {
        get: function () {
            return this.searchResultSelected;
        },
        set: function (callback) {
            this.searchResultSelected = callback;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGControls.prototype, "onRouteCommand", {
        get: function () {
            return this.routeCommand;
        },
        set: function (callback) {
            this.routeCommand = callback;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGControls.prototype, "onUnknownVoiceCommand", {
        get: function () {
            return this.uvc;
        },
        set: function (callback) {
            this.uvc = callback;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGControls.prototype, "searchResultsForVoiceSelection", {
        get: function () {
            return this.srfvs;
        },
        set: function (results) {
            this.srfvs = results;
        },
        enumerable: true,
        configurable: true
    });
    SVGControls.prototype.startVoice = function () {
        var _this = this;
        if (SVGVoiceControls_1.SVGVoiceControls.compatible()) {
            SVGVoiceControls_1.SVGVoiceControls.setOn(true);
            this.voice.start(function (_a) {
                var confidence = _a.confidence, transcript = _a.transcript;
                console.log('Voice received:');
                console.log(confidence, transcript);
                var parsed = _this.voice.parseAction(transcript);
                if (parsed) {
                    console.log('Parsed as', parsed);
                    var name_1 = parsed.name;
                    switch (name_1) {
                        case 'unknown':
                            _this.onUnknownVoiceCommand();
                            return;
                        case 'search':
                            _this.onSearchVoiceQuery(parsed.query);
                            return;
                        case 'select':
                            _this.onSearchResultSelected(_this.toDigit(parsed.item));
                            return;
                        case 'route':
                            _this.onRouteCommand({ origin: parsed.origin, target: parsed.target });
                            return;
                        case 'access-routes':
                            _this.onRouteCommand(null);
                            return;
                        case 'zoom':
                            _this.navigationHandler((parsed.direction === 'acercar') ? 'zoom-in' : 'zoom-out');
                            return;
                        default:
                            _this.navigationHandler(parsed.direction);
                            return;
                    }
                }
            });
        }
    };
    SVGControls.prototype.stopVoice = function () {
        if (SVGVoiceControls_1.SVGVoiceControls.compatible() && typeof this.voice != 'undefined') {
            SVGVoiceControls_1.SVGVoiceControls.setOn(false);
            this.voice.stop();
        }
    };
    SVGControls.prototype.navigationHandler = function (mode) {
        var STEP = 15 + (20 - SVGMap_1.SVGMap.instance.zoomlevel);
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
                SVGMap_1.SVGMap.instance.zoomlevel = (SVGMap_1.SVGMap.instance.zoomlevel == 20) ? SVGMap_1.SVGMap.instance.zoomlevel : SVGMap_1.SVGMap.instance.zoomlevel + 1;
                SVGMap_1.SVGMap.instance.resizeToLevel(SVGMap_1.SVGMap.instance.zoomlevel);
                return;
            case 'zoom-out':
                SVGMap_1.SVGMap.instance.zoomlevel = (SVGMap_1.SVGMap.instance.zoomlevel == 1) ? SVGMap_1.SVGMap.instance.zoomlevel : SVGMap_1.SVGMap.instance.zoomlevel - 1;
                SVGMap_1.SVGMap.instance.resizeToLevel(SVGMap_1.SVGMap.instance.zoomlevel);
                return;
        }
        SVGMap_1.SVGMap.instance.move(xdif, ydif);
    };
    SVGControls.prototype.toDigit = function (number) {
        var n = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
        console.log(n.length, number);
        for (var i = 0; i < n.length; i++) {
            if (n[i] == number) {
                return (i + 1);
            }
        }
        return -1;
    };
    return SVGControls;
}());
exports.SVGControls = SVGControls;
