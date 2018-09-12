/*
    Manages map: draw, zoom, pan, markers...
*/

let _instance = null;
const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;

export class SVGMap {
    constructor() {
        if (!_instance) {
            _instance = this;
        }

        this._svg = SVG('map');
        this._zoomlevel = 3;
        this._container = "#map svg ";
        this.guides_drawn = false;
        this.marker_groups = Array.apply(null, Array(20)).map(element => []);
        this.auto_marker_groups = Array.apply(null, Array(20)).map(element => []);
        this.auto_grouped_buildings = [];

        return _instance;
    }

    static get instance() {
        if (!_instance) {
            _instance = new SVGMap();
        }

        return _instance;
    }

    get svg() {
        return this._svg;
    }

    set svg(v) {
        this._svg = v;
    }

    get zoomlevel() {
        return this._zoomlevel;
    }

    set zoomlevel(v) {
        this._zoomlevel = v;
    }

    get container() {
        return this._container;
    }

    set container(v) {
        this._container = v;
    }

    get data() {
        return this._data;
    }

    set data(v) {
        this._data = v;
    }

    get guidesDrawn() {
        return this.guides_drawn;
    }

    set guidesDrawn(v) {
        this.guides_drawn = v;
    }

    drawGuides() {
        $(this.container + ".jails").remove();

        const canvasw = $(this.container).width();
        const canvash = $(this.container).height();

        let map_line_guides = this.svg.group().addClass('jails');

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                map_line_guides.rect(canvasw / 3, canvash / 3).move((-canvasw/2) + (i * (canvasw/3)), (-canvash/2) + (j * (canvash/3))).fill('transparent').stroke({width: 0});
            }
        }
    }

    calculateAutoGroups() {
        for (const jail of this.svg.select('.jails rect').members) {
            let already_grouped = false;
            for (const gmarker of this.data.groups[this.zoomlevel]) {
                if (jail.inside(gmarker.lat, gmarker.long)) {
                    already_grouped = true;
                    break;
                }
            }

            if (already_grouped) { continue; }

            let affects = 0;

            for (const feature of this.svg.select('.building').members) {
                let {cx, cy} = feature.bbox();
                if (jail.inside(cx, cy)) {
                    affects++;
                    
                    if (this.marker_groups[this.zoomlevel].indexOf(parseInt(feature.attr('id'))) != -1) {
                        this.marker_groups[this.zoomlevel].push(parseInt(feature.attr('id')));
                    }
                }
            }

            let {cx, cy} = jail.bbox();
            this.data.groups[this.zoomlevel].push({
                id: cx.toString() + cy.toString(),
                affects: affects,
                lat: cx,
                long: cy,
                name: "Grupo " + cx.toString() + cy.toString(),
                radius: jail.width() / 2
            })
        }
    }

    draw() {
        this.drawGuides();

        this.svg.attr('id', 'this.svg_MAIN');
        this.svg.attr('preserveAspectRatio', 'xMidYMid slice');
        this.svg.attr('class', 'map-dragable');
        this.svg.attr('tabindex', 0);
        
        const main = this.svg.group().attr('id', 'SVG_MAIN_CONTENT');

        for (const feature of this._data.buildings) {
            const g = main.group();

            const a = g.link('#feature-' + feature.properties.id.value).attr('class', 'non-link building-wrapper').attr('id', 'link-feature-' + feature.properties.id.value);
            a.attr('data-building', feature.properties.id.value);
            
            const rect = a.path().attr('d', feature.path);
            rect.attr('id', feature.properties.id.value);
            rect.attr('class', 'building');

            const marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');

            const img = marker.image('/images/building_marker.svg', 14, 14);
            img.attr('class', 'marker');
            img.attr('x', feature.centerx - 15);
            img.attr('y', feature.centery - 7);

            const text = marker.plain(feature.properties.name.value);
            text.attr('x' , feature.centerx);
            text.attr('y', feature.centery);
            text.attr('text-anchor', 'start');
            text.attr('id', 'label-' + feature.properties.id.value);

            a.attr('aria-labelledby', 'label-' + feature.properties.id.value);

            // We save this marker in its group for further hiding
            for (const group of feature.groups) {
                this.marker_groups[group].push(feature.properties.id.value);
            }
        }

        // Zoom and move (0, 0) to center
        this.resizeToLevel(this.zoomlevel, false);
        this.moveTo(-this._svg.viewbox().width/2, -this._svg.viewbox().width/2, false);
    }

    groupMarkers(level) {        
        console.log("Gropung markers for level " + level);
        var i = 0;

        this.calculateAutoGroups();
        
        for (const group of this.marker_groups) {
            for (const marker of group) {
                if (i == level) {
                    this.svg.select('#marker-' + marker).hide();

                    $("#link-feature-" + marker).attr("tabindex", "-1");
                    $("#link-feature-" + marker).addClass("non-clickable");
                } else {
                    $("#link-feature-" + marker).removeAttr("tabindex");
                    $("#link-feature-" + marker).removeClass("non-clickable");

                    this.svg.select('#marker-' + marker).show();
                }
            }

            for (const gmarker of this.data.groups[i]) {
                if (i == level) {
                    const fit = (gmarker.affects.toString().length == 1) ? 1 : gmarker.affects.toString().length / 2;
                    
                    const a = this.svg.select('#SVG_MAIN_CONTENT').members[0].link('#gmarker-' + gmarker.id).attr('class', 'non-link gmarker').attr('id', 'gmarker-' + gmarker.id);;
                    const gm = a.group().attr('class', 'gmarker');
                    const circle = gm.circle().radius(10);
                    circle.cx(gmarker.lat).cy(gmarker.long);
                    const text = gm.plain(gmarker.affects).attr('text-anchor', 'middle');
                    text.font({ size: 16 / fit });
                    text.move(gmarker.lat, gmarker.long - (8 / fit));

                    // Accessibility
                    a.title(gmarker.name).attr('id', 'gmarker-' + gmarker.id + '-title');
                    a.attr('aria-labelledby', 'gmarker-' + gmarker.id + '-title');
                    text.attr('aria-hidden', 'true');
                    text.attr('role', 'presentation');
                } else {
                    for (const member of this.svg.select('#gmarker-' + gmarker.id).members) {
                        member.remove();
                    }
                }
            }

            i++;
        }

        var self = this;
        $(this.container + "a.gmarker").on('keydown click', function(e) {
            if (e.type == "click" || e.which == 13) {
                e.preventDefault();
        
                self.zoomlevel += 2;
                self.resizeToLevel(self.zoomlevel);
            }
        });
    }

    resizeToLevel(level, raisedbyuser = true) {
        var vbx = $("#map").width();
        vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);

        var wdiff = (raisedbyuser) ? (this.svg.viewbox().width - vbx) / 2 : 0;
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + wdiff, this.svg.viewbox().y + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;

        if (raisedbyuser) {
            this.groupMarkers(level);
        } else {
            // Sin esto, firefox se agobia
            var self = this;
            setTimeout(function() {
                self.groupMarkers(level);
            }, 1);
        }
    }

    moveTo(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x, y, this.svg.viewbox().width, this.svg.viewbox().height);
    }
}