"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SVGMap = /** @class */ (function () {
    function SVGMap() {
        this.ZOOM_LEVEL_BASE = 0.000246153846;
        this.ZOOM_LEVEL_STEP = 0.4514682741;
        this.MAX_GROUP_LEVEL = 4;
        this._svg = SVG('map');
        this._svg.attr('version', '1.1');
        this._svg.attr('role', 'graphics-document document');
        this._zoomlevel = 3;
        this._container = "#map svg ";
        this.guides_drawn = false;
        this.marker_groups = Array.apply(null, Array(20)).map(function (element) { return []; });
        this.auto_marker_groups = Array.apply(null, Array(20)).map(function (element) { return []; });
        this.auto_grouped_buildings = [];
    }
    Object.defineProperty(SVGMap, "instance", {
        get: function () {
            if (!this._instance) {
                this._instance = new SVGMap();
            }
            return this._instance;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "svg", {
        get: function () {
            return this._svg;
        },
        set: function (v) {
            this._svg = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "zoomlevel", {
        get: function () {
            return this._zoomlevel;
        },
        set: function (v) {
            this._zoomlevel = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "container", {
        get: function () {
            return this._container;
        },
        set: function (v) {
            this._container = v;
        },
        enumerable: true,
        configurable: true
    });
    SVGMap.prototype.fetchData = function () {
        var _this = this;
        if (typeof this._data == 'undefined') {
            var radius = Cookies.get('locationRadio') || 100;
            return $.getJSON("/map/data/" + radius, function (data) {
                return data;
            });
        }
        else {
            new Promise(function (resolve, reject) {
                resolve(_this._data);
            });
        }
    };
    Object.defineProperty(SVGMap.prototype, "data", {
        get: function () {
            return this._data;
        },
        set: function (v) {
            this._data = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "guidesDrawn", {
        get: function () {
            return this.guides_drawn;
        },
        set: function (v) {
            this.guides_drawn = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "fullw", {
        get: function () {
            return this.svg.viewbox().width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "fullh", {
        get: function () {
            return this.svg.viewbox().height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SVGMap.prototype, "onDrawn", {
        set: function (v) {
            this.onmapdrawn = v;
        },
        enumerable: true,
        configurable: true
    });
    SVGMap.prototype.drawGuides = function () {
        if (this.zoomlevel >= this.MAX_GROUP_LEVEL)
            return;
        $(this.container + ".jails").remove();
        var map_line_guides = this.svg.group().addClass('jails').back();
        var steps = this.zoomlevel;
        var percentage = (100 / steps) + '%';
        var _a = this.svg.viewbox(), x = _a.x, y = _a.y;
        var w = this.fullw / steps;
        var h = this.fullh / steps;
        for (var i = 0; i < steps; i++) {
            for (var j = 0; j < steps; j++) {
                map_line_guides.rect(percentage, percentage).move(x + (i * w), y + (j * h)).fill('transparent').stroke({ width: 0 });
            }
        }
    };
    SVGMap.prototype.calculateAutoGroups = function () {
        if (this.zoomlevel >= this.MAX_GROUP_LEVEL)
            return;
        this.drawGuides();
        for (var _i = 0, _a = this.svg.select('.jails rect').members; _i < _a.length; _i++) {
            var jail = _a[_i];
            var already_grouped = false;
            for (var i = 0; i < this.data.groups[this.zoomlevel].length; i++) {
                var gmarker = this.data.groups[this.zoomlevel][i];
                if (jail.inside(gmarker.lat, gmarker.long)) {
                    already_grouped = true;
                    break;
                }
            }
            if (already_grouped) {
                continue;
            }
            var affects = 0;
            var max_priority_feature = void 0;
            for (var i = 0; i < this.data.buildings.length; i++) {
                var feature = this.data.buildings[i];
                var centerx = feature.centerx, centery = feature.centery;
                if (jail.inside(centerx, centery) && feature.groups.indexOf(this.zoomlevel) == -1) {
                    affects++;
                    if (this.marker_groups[this.zoomlevel].indexOf(parseInt(feature.properties.id.value)) == -1) {
                        this.marker_groups[this.zoomlevel].push(parseInt(feature.properties.id.value));
                    }
                    if (max_priority_feature == undefined || parseInt(feature.properties.priority.value) < parseInt(max_priority_feature.properties.priority.value)) {
                        max_priority_feature = feature;
                    }
                }
            }
            if (affects == 0) {
                continue;
            }
            this.data.groups[this.zoomlevel].push({
                id: parseInt(max_priority_feature.centerx).toString() + parseInt(max_priority_feature.centery).toString(),
                affects: affects,
                lat: max_priority_feature.centerx,
                long: max_priority_feature.centery,
                name: "Marcadores cerca de " + max_priority_feature.properties.name.value,
                radius: jail.width() / 2,
                auto: true
            });
        }
    };
    SVGMap.prototype.draw = function () {
        var _this = this;
        this.fetchData().then(function (data) {
            _this.data = data;
            _this.svg.attr('id', 'this.svg_MAIN');
            _this.svg.attr('preserveAspectRatio', 'xMidYMid slice');
            _this.svg.attr('class', 'map-dragable');
            _this.svg.attr('tabindex', 0);
            var main = _this.svg.group().attr('id', 'SVG_MAIN_CONTENT').front();
            var _loop_1 = function (feature) {
                var g = main.group();
                var a = g.link('#feature-' + feature.properties.id.value).attr('class', 'non-link building-wrapper feature-object').attr('id', 'link-feature-' + feature.properties.id.value);
                a.attr('data-building', feature.properties.id.value);
                a.attr('role', 'graphics-symbol img');
                a.attr('data-name', feature.properties.name.value);
                a.attr('data-coords', feature.centerx + ":" + feature.centery);
                a.attr('data-description', feature.properties.description.value);
                a.attr('data-nearest', feature.nearestnames.reduce(function (prev, curr) {
                    return prev + "," + curr;
                }));
                a.attr('data-nearest-radius', feature.nearestnamesradius);
                var rect = a.path().attr('d', feature.path);
                rect.attr('id', 'feature-shape-' + feature.properties.id.value);
                rect.attr('class', 'building');
                var marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');
                var img = marker.image('/images/building_marker.svg', 14, 14);
                img.attr('class', 'marker');
                img.attr('x', feature.centerx - 15);
                img.attr('y', feature.centery - 7);
                var text = marker.text(function (add) {
                    var wordsRaw = feature.properties.name.value.split(' ');
                    var words = [wordsRaw[0]];
                    for (var i = 1; i < wordsRaw.length; i++) {
                        var word = wordsRaw[i];
                        if ((words[words.length - 1].length + word.length) <= 10 || word.match(/^(,|.|;|:|")$/i) != null) {
                            words[words.length - 1] += " " + word;
                        }
                        else {
                            words.push(word);
                        }
                    }
                    for (var i = 0; i < words.length; i++) {
                        if (i == 0) {
                            add.tspan(words[i]);
                        }
                        else {
                            add.tspan(words[i]).move(feature.centerx, feature.centery).dy(i * 5);
                        }
                    }
                });
                text.attr('text-anchor', 'start');
                text.attr('id', 'label-' + (feature.properties.id ? feature.properties.id.value : ""));
                text.attr('x', feature.centerx);
                text.attr('y', feature.centery);
                text.font({ weight: 'bold' });
                a.attr('aria-labelledby', 'label-' + feature.properties.id.value);
                // We save this marker in its group for further hiding
                for (var _i = 0, _a = feature.groups; _i < _a.length; _i++) {
                    var group = _a[_i];
                    _this.marker_groups[group].push(feature.properties.id.value);
                }
            };
            for (var _i = 0, _a = _this.data.buildings; _i < _a.length; _i++) {
                var feature = _a[_i];
                _loop_1(feature);
            }
            _this.onmapdrawn();
        });
    };
    SVGMap.prototype.drawLocation = function (x, y) {
        console.log('Location update', x, y);
        var currlocationg = $(this.container + "#locationg");
        if (currlocationg.length == 0) {
            var locationg = this.svg.select('#SVG_MAIN_CONTENT').members[0].group().front();
            locationg.attr('id', 'locationg');
            var circle = locationg.circle().radius(10);
            circle.cx(x).cy(y);
            circle.fill('deeppink');
        }
        else {
            currlocationg.find('circle').attr('cx', x);
            currlocationg.find('circle').attr('cy', y);
        }
    };
    SVGMap.prototype.drawOrientation = function (x, y, alpha) {
        var currorientationg = $(this.container + "#orientationg");
        if (currorientationg.length == 0) {
            var orientationg = this.svg.select('#SVG_MAIN_CONTENT').members[0].group().front();
            orientationg.attr('id', 'orientationg');
            var arrow = orientationg.image('/images/arrow.svg');
            arrow.move(x - 8, y - 24);
            arrow.attr('width', 16);
            arrow.attr('height', 16);
        }
        else {
            currorientationg.find('image').attr('x', x - 8);
            currorientationg.find('image').attr('y', y - 24);
        }
        var phase = (alpha < 0) ? alpha + 360 : alpha;
        $(SVGMap.instance.container + '#orientationg image').css({
            'transform-origin': x + "px " + y + "px",
            'transform': "rotateZ(" + (270 - phase) + "deg)"
        });
        currorientationg.attr('data-orientation', 270 - phase);
        currorientationg.attr('data-x', x);
        currorientationg.attr('data-y', y);
    };
    SVGMap.prototype.groupMarkers = function (level) {
        var i = 0;
        this.calculateAutoGroups();
        var late_removal = [];
        for (var _i = 0, _a = this.marker_groups; _i < _a.length; _i++) {
            var group = _a[_i];
            for (var _b = 0, group_1 = group; _b < group_1.length; _b++) {
                var marker = group_1[_b];
                if (i == level) {
                    // Evitamos mostrar los elementos después de haberlos ocultado
                    // si aparecen en grupos de otros niveles
                    late_removal.push(marker);
                }
                else {
                    $("#link-feature-" + marker).removeAttr("tabindex");
                    $("#link-feature-" + marker).removeClass("non-clickable");
                    this.svg.select('#marker-' + marker).show();
                }
            }
            for (var _c = 0, _d = this.data.groups[i]; _c < _d.length; _c++) {
                var gmarker = _d[_c];
                if (i == level) {
                    var fit = (gmarker.affects.toString().length == 1) ? 1 : gmarker.affects.toString().length / 2;
                    var a = this.svg.select('#SVG_MAIN_CONTENT').members[0].link('#gmarker-' + gmarker.id).attr('class', 'non-link gmarker').attr('id', 'gmarker-' + gmarker.id);
                    ;
                    a.attr('data-name', gmarker.name);
                    var gm = a.group();
                    var circle = gm.circle().radius(10);
                    circle.cx(gmarker.lat).cy(gmarker.long);
                    var text = gm.plain(gmarker.affects).attr('text-anchor', 'middle');
                    text.font({ size: 16 / fit });
                    text.move(gmarker.lat, gmarker.long - (8 / fit));
                    // Accessibility
                    a.title(gmarker.name).attr('id', 'gmarker-' + gmarker.id + '-title');
                    a.attr('aria-labelledby', 'gmarker-' + gmarker.id + '-title');
                    a.attr('data-coords', circle.cx() + ":" + circle.cy());
                    text.attr('aria-hidden', 'true');
                    text.attr('role', 'presentation');
                }
                else {
                    for (var _e = 0, _f = this.svg.select('#gmarker-' + gmarker.id).members; _e < _f.length; _e++) {
                        var member = _f[_e];
                        member.remove();
                    }
                }
            }
            i++;
        }
        for (var _g = 0, late_removal_1 = late_removal; _g < late_removal_1.length; _g++) {
            var marker = late_removal_1[_g];
            this.svg.select('#marker-' + marker).hide();
            $("#link-feature-" + marker).attr("tabindex", "-1");
            $("#link-feature-" + marker).addClass("non-clickable");
        }
        var self = this;
        $(this.container + "a.gmarker").on('focus', function () {
            $(this).on('keyup', function (e) {
                if (e.which == 13) {
                    e.preventDefault();
                    self.zoomlevel += 2;
                    var _a = $(this).attr('data-coords').split(':'), x = _a[0], y = _a[1];
                    self.zoomAndMove(x, y, self.zoomlevel);
                }
            });
        });
        $(this.container + "a.gmarker").on('click', function (e) {
            e.preventDefault();
            self.zoomlevel += 2;
            var _a = $(this).attr('data-coords').split(':'), x = _a[0], y = _a[1];
            self.zoomAndMove(x, y, self.zoomlevel);
        });
        this.updateSidebar();
    };
    SVGMap.prototype.isInview = function (e) {
        var minx = SVGMap.instance.svg.viewbox().x;
        var miny = SVGMap.instance.svg.viewbox().y;
        var maxx = minx + SVGMap.instance.svg.viewbox().width;
        var maxy = miny + SVGMap.instance.svg.viewbox().height;
        var coords = $(e).attr('data-coords');
        var centerx = parseFloat(coords.split(':')[0]);
        var centery = parseFloat(coords.split(':')[1]);
        var inviewx = (centerx >= minx && centerx <= maxx);
        var inviewy = (centery >= miny && centery <= maxy);
        /*console.log($(this).attr('data-name'), 'x', minx, maxx, centerx);
        console.log($(this).attr('data-name'), 'y', miny, maxy, centery);
        console.log($(this).attr('data-name'), 'inviewx', inviewx, 'inviewy', inviewy);*/
        var inview = (inviewx && inviewy);
        //console.log($(this).attr('data-name'), inview);
        return inview;
    };
    SVGMap.prototype.updateSidebar = function () {
        var _this = this;
        $("#currentViewPanel ul").empty();
        if (this.zoomlevel < this.MAX_GROUP_LEVEL) {
            $(this.container + ".gmarker").each(function (i, e) {
                var inview = _this.isInview(e);
                $(e).attr('data-inview', String(inview));
                if (inview) {
                    var name_1 = $(e).attr('data-name');
                    var lat = $(e).attr('data-coords').split(':')[0];
                    var long = $(e).attr('data-coords').split(':')[1];
                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    $(a).html("Grupo: " + name_1);
                    $(a).attr('href', '#');
                    $(a).attr('data-type', 'group');
                    $(a).attr('data-listened', String(false));
                    $(a).attr('data-x', lat);
                    $(a).attr('data-y', long);
                    $(li).append(a);
                    $("#currentViewPanel ul").append(li);
                }
            });
        }
        else {
            $(this.container + "a.feature-object").each(function (i, e) {
                var inview = _this.isInview(e);
                $(_this).attr('data-inview', String(inview));
                if (inview) {
                    var coords = $(e).attr('data-coords');
                    var centerx = parseFloat(coords.split(':')[0]);
                    var centery = parseFloat(coords.split(':')[1]);
                    var li = document.createElement("li");
                    var a = document.createElement("a");
                    $(a).html("Edificio: " + $(e).attr('data-name'));
                    $(a).attr('href', '#');
                    $(a).attr('data-id', $(e).attr('data-id'));
                    $(a).attr('data-x', centerx);
                    $(a).attr('data-y', centery);
                    $(li).append(a);
                    $("#currentViewPanel ul").append(li);
                }
            });
        }
    };
    SVGMap.prototype.getZoomValues = function (level, raisedbyuser) {
        var vbx = $("#map").width();
        vbx /= this.ZOOM_LEVEL_BASE + ((level - 1) * this.ZOOM_LEVEL_STEP);
        return { vbx: vbx, wdiff: (raisedbyuser) ? (this.svg.viewbox().width - vbx) / 2 : 0 };
    };
    SVGMap.prototype.resizeToLevel = function (level, raisedbyuser) {
        var _this = this;
        if (raisedbyuser === void 0) { raisedbyuser = true; }
        if (level < 2 || level > 21)
            return;
        $(this.container + ".jails").remove();
        this.zoomlevel = level;
        var _a = this.getZoomValues(level, raisedbyuser), vbx = _a.vbx, wdiff = _a.wdiff;
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + wdiff, this.svg.viewbox().y + wdiff, vbx, vbx);
        window.location.href = "#zoom=" + level;
        setTimeout(function () {
            _this.groupMarkers(level);
            _this.updateSidebar();
        }, 400);
    };
    /*
        Increases viewbox in value of x and y.
    */
    SVGMap.prototype.move = function (x, y, raisedbyuser) {
        var _this = this;
        if (raisedbyuser === void 0) { raisedbyuser = true; }
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + x, this.svg.viewbox().y + y, this.svg.viewbox().width, this.svg.viewbox().height);
        setTimeout(function () {
            _this.updateSidebar();
        }, 400);
    };
    /*
        Centers viewbox on the (x, y) given coordinates
    */
    SVGMap.prototype.moveTo = function (x, y, raisedbyuser) {
        var _this = this;
        if (raisedbyuser === void 0) { raisedbyuser = true; }
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x - (this.fullw / 2), y - (this.fullh / 2), this.svg.viewbox().width, this.svg.viewbox().height);
        setTimeout(function () {
            _this.updateSidebar();
        }, 400);
    };
    SVGMap.prototype.zoomAndMove = function (x, y, level, raisedbyuser) {
        var _this = this;
        if (raisedbyuser === void 0) { raisedbyuser = true; }
        $(this.container + ".jails").remove();
        this.zoomlevel = level;
        var _a = this.getZoomValues(level, true), vbx = _a.vbx, wdiff = _a.wdiff;
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x - (this.fullw / 2) + wdiff, y - (this.fullh / 2) + wdiff, vbx, vbx);
        window.location.href = "#zoom=" + level;
        setTimeout(function () {
            _this.groupMarkers(level);
            _this.updateSidebar();
        }, 400);
    };
    return SVGMap;
}());
exports.SVGMap = SVGMap;
