/*
    Manages map: draw, zoom, pan, markers...
*/

let _instance = null;
const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;
const MAX_GROUP_LEVEL = 5;

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

    get fullw() {
        return this.svg.viewbox().width;
    }

    get fullh() {
        return this.svg.viewbox().height;
    }

    drawGuides() {
        if (this.zoomlevel >= MAX_GROUP_LEVEL) return;

        $(this.container + ".jails").remove();

        let map_line_guides = this.svg.group().addClass('jails').back();

        const steps = this.zoomlevel;
        const percentage = (100 / steps) + '%';
        const {x, y} = this.svg.viewbox();

        const w = this.fullw / steps;
        const h = this.fullh / steps;

        for (let i = 0; i < steps; i++) {
            for (let j = 0; j < steps; j++) {
                map_line_guides.rect(percentage, percentage).move(x + (i * w), y + (j * h)).fill('transparent').stroke({ width: 0 });
            }
        }
    }

    calculateAutoGroups() {
        if (this.zoomlevel >= MAX_GROUP_LEVEL) return;

        this.drawGuides();

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
            let max_priority_feature;

            for (const feature of this.data.buildings) {
                let {centerx, centery} = feature;

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

            if (affects == 0) { continue; }

            this.data.groups[this.zoomlevel].push({
                id: parseInt(max_priority_feature.centerx).toString() + parseInt(max_priority_feature.centery).toString(),
                affects: affects,
                lat: max_priority_feature.centerx,
                long: max_priority_feature.centery,
                name: "Marcadores cerca de " + max_priority_feature.properties.name.value,
                radius: jail.width() / 2
            });
        }
    }

    draw() {
        this.svg.attr('id', 'this.svg_MAIN');
        this.svg.attr('preserveAspectRatio', 'xMidYMid slice');
        this.svg.attr('class', 'map-dragable');
        this.svg.attr('tabindex', 0);
        
        const main = this.svg.group().attr('id', 'SVG_MAIN_CONTENT').front();

        for (const feature of this.data.buildings) {
            const g = main.group();

            const a = g.link('#feature-' + feature.properties.id.value).attr('class', 'non-link building-wrapper').attr('id', 'link-feature-' + feature.properties.id.value);
            a.attr('data-building', feature.properties.id.value);
            
            const rect = a.path().attr('d', feature.path);
            rect.attr('id', 'feature-shape-' + feature.properties.id.value);
            rect.attr('class', 'building');

            const marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');

            const img = marker.image('/images/building_marker.svg', 14, 14);
            img.attr('class', 'marker');
            img.attr('x', feature.centerx - 15);
            img.attr('y', feature.centery - 7);

            const text = marker.plain((feature.properties.name ? feature.properties.name.value : ""));
            text.attr('x' , feature.centerx);
            text.attr('y', feature.centery);
            text.attr('text-anchor', 'start');
            text.attr('id', 'label-' + (feature.properties.id ? feature.properties.id.value : ""));

            a.attr('aria-labelledby', 'label-' + feature.properties.id.value);

            // We save this marker in its group for further hiding
            for (const group of feature.groups) {
                this.marker_groups[group].push(feature.properties.id.value);
            }
        }

        // Zoom and move (0, 0) to center
        this.resizeToLevel(this.zoomlevel, false);
        this.moveTo(this.data.buildings[0].centerx, this.data.buildings[0].centery, false);
    }

    groupMarkers(level) {
        console.log("Gropung markers for level " + level);
        var i = 0;

        this.calculateAutoGroups();

        console.log(this.marker_groups);
        console.log(this.data.groups);
        
        let late_removal = [];
        for (const group of this.marker_groups) {
            for (const marker of group) {
                if (i == level) {
                    // Evitamos mostrar los elementos después de haberlos ocultado
                    // si aparecen en grupos de otros niveles
                    late_removal.push(marker);
                } else {
                    console.log('SHOW #marker-' + marker);
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
                    a.attr('data-coords', circle.cx() + "#" + circle.cy());
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

        for (const marker of late_removal) {
            console.log('REMOVE #marker-' + marker);
            this.svg.select('#marker-' + marker).hide();

            $("#link-feature-" + marker).attr("tabindex", "-1");
            $("#link-feature-" + marker).addClass("non-clickable");
        }

        var self = this;
        $(this.container + "a.gmarker").on('keydown click', function(e) {
            if (e.type == "click" || e.which == 13) {
                e.preventDefault();
        
                self.zoomlevel += 2;
                let [x, y] = $(this).attr('data-coords').split('#');

                self.zoomAndMove(x, y, self.zoomlevel);
            }
        });

        $("#currentViewPanel ul").empty();
        if (this.zoomlevel >= MAX_GROUP_LEVEL) {
            for (const feature of this.data.buildings) {
                console.log(feature);
                let li = document.createElement("li");
                let a = document.createElement("a");
                $(a).html(`Edificio: ${feature.properties.name.value}`);
                $(a).attr('href', '#');
                $(a).attr('data-id', feature.properties.id.value);
                $(a).attr('data-x', feature.centerx);
                $(a).attr('data-y', feature.centery);
                $(li).append(a);
                $("#currentViewPanel ul").append(li);
            }
        } else {
            for (const group of this.data.groups[this.zoomlevel]) {
                console.log(group);
                let li = document.createElement("li");
                let a = document.createElement("a");
                $(a).html(`Grupo: ${group.name}`);
                $(a).attr('href', '#');
                $(a).attr('data-type', 'group');
                $(a).attr('data-listened', false);
                $(a).attr('data-x', group.lat);
                $(a).attr('data-y', group.long);
                $(li).append(a);
                $("#currentViewPanel ul").append(li);
            }
        }
    }

    getZoomValues(level, raisedbyuser) {
        var vbx = $("#map").width();
        vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);
        return { vbx: vbx, wdiff: (raisedbyuser) ? (this.svg.viewbox().width - vbx) / 2 : 0};
    }

    resizeToLevel(level, raisedbyuser = true) {
        if (level < 1 || level > 21) return;
        
        $(this.container + ".jails").remove();
        this.zoomlevel = level;

        let {vbx, wdiff} = this.getZoomValues(level, raisedbyuser);
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + wdiff, this.svg.viewbox().y + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;

        setTimeout(() => {
            this.groupMarkers(level);
        }, 300);
    }

    /*
        Increases viewbox in value of x and y.
    */
    move(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + x, this.svg.viewbox().y + y, this.svg.viewbox().width, this.svg.viewbox().height);

        setTimeout(() => {
            this.drawGuides();
        }, 300);
    }

    /*
        Centers viewbox on the (x, y) given coordinates
    */
    moveTo(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x - (this.fullw / 2), y - (this.fullh / 2), this.svg.viewbox().width, this.svg.viewbox().height);

        setTimeout(() => {
            this.drawGuides();
        }, 300);
    }

    zoomAndMove(x, y, level) {
        $(this.container + ".jails").remove();
        this.zoomlevel = level;

        let {vbx, wdiff} = this.getZoomValues(level, true);
        this.svg.animate({ duration: 300 }).viewbox(x - (this.fullw / 2) + wdiff, y - (this.fullh / 2) + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;

        setTimeout(() => {
            this.groupMarkers(level);
        }, 300);
    }
}