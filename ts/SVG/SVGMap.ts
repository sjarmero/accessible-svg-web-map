declare var SVG, Cookies;

export class SVGMap {
    readonly ZOOM_LEVEL_BASE = 0.000246153846;
    readonly ZOOM_LEVEL_STEP = 0.4514682741;
    readonly MAX_GROUP_LEVEL = 4;

    private static _instance : SVGMap;

    private _svg : any;
    private _zoomlevel : number;
    private _container : string;
    private guides_drawn : boolean;
    private marker_groups : number[][];
    private auto_marker_groups : any[][];
    private auto_grouped_buildings : any[];
    private _data : any;
    private onmapdrawn : any;
    private locationdrawn : boolean;

    constructor() {
        this._svg = SVG('map');
        this._svg.attr('version', '1.1');
        this._svg.attr('role', 'graphics-document document');
        this._zoomlevel = 3;
        this._container = "#map svg ";
        this.guides_drawn = false;
        this.marker_groups = Array.apply(null, Array(20)).map(element => []);
        this.auto_marker_groups = Array.apply(null, Array(20)).map(element => []);
        this.auto_grouped_buildings = [];
        this.locationdrawn = false;
    }

    static get instance() {
        if (!this._instance) {
            this._instance = new SVGMap();
        }

        return this._instance;
    }

    get svg() : any {
        return this._svg;
    }

    set svg(v) {
        this._svg = v;
    }

    get zoomlevel() : number {
        return this._zoomlevel;
    }

    set zoomlevel(v) {
        this._zoomlevel = v;
    }

    get container() : string {
        return this._container;
    }

    set container(v) {
        this._container = v;
    }

    fetchData() {
        if (typeof this._data == 'undefined') {
            let radius = Cookies.get('locationRadio') || 100;
            return $.getJSON(`/map/data/${radius}`, (data) => {
                return data;
            });
        } else {
            new Promise((resolve, reject) => {
                resolve(this._data);
            });
        }
    }

    get data() : any {
        return this._data;
    }

    set data(v) {
        this._data = v;
    }

    get guidesDrawn() : boolean {
        return this.guides_drawn;
    }

    set guidesDrawn(v) {
        this.guides_drawn = v;
    }

    get fullw() : number{
        return this.svg.viewbox().width;
    }

    get fullh() : number {
        return this.svg.viewbox().height;
    }

    set onDrawn(v) {
        this.onmapdrawn = v;
    }

    draw() {
        this.fetchData().then((data) => {
            this.data = data;

            this.svg.attr('id', 'this.svg_MAIN');
            this.svg.attr('preserveAspectRatio', 'xMidYMid slice');
            this.svg.attr('class', 'map-dragable');
            this.svg.attr('tabindex', 0);
            
            const main = this.svg.group().attr('id', 'SVG_MAIN_CONTENT').front();

            for (const feature of this.data.buildings) {
                const g = main.group();

                const a = g.link('#feature-' + feature.properties.id.value).attr('class', 'non-link building-wrapper feature-object').attr('id', 'link-feature-' + feature.properties.id.value);
                a.attr('data-building', feature.properties.id.value);
                a.attr('role', 'graphics-symbol img');
                a.attr('data-name', feature.properties.name.value);
                a.attr('data-coords', `${feature.centerx}:${feature.centery}`);
                a.attr('data-description', feature.properties.description.value);
                a.attr('data-nearest', feature.nearestnames.reduce((prev, curr) => {
                    return `${prev},${curr}`
                }));
                a.attr('data-nearest-radius', feature.nearestnamesradius);

                const rect = a.path().attr('d', feature.path);
                rect.attr('id', 'feature-shape-' + feature.properties.id.value);
                rect.attr('class', 'building');

                const marker = a.group().attr('id', 'marker-' + feature.properties.id.value).attr('class', 'map-marker');

                const img = marker.image('/images/building_marker.svg', 14, 14);
                img.attr('class', 'marker');
                img.attr('x', feature.centerx - 15);
                img.attr('y', feature.centery - 7);

                const text = marker.text(function(add) {
                    let wordsRaw = feature.properties.name.value.split(' ');
                    let words = [wordsRaw[0]];
                    for (let i = 1; i < wordsRaw.length; i++) {
                        let word = wordsRaw[i];
                        if ((words[words.length-1].length + word.length) <= 10 || word.match(/^(,|.|;|:|")$/i) != null) {
                            words[words.length-1] += ` ${word}`;
                        } else {
                            words.push(word);
                        }
                    }

                    for (let i = 0; i < words.length; i++) {
                        if (i == 0) {
                            add.tspan(words[i]);
                        } else {
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
                for (const group of feature.groups) {
                    this.marker_groups[group].push(feature.properties.id.value);
                }
            }

            this.onmapdrawn();
        });
    }

    drawLocation(x, y) {
        console.log('Location update', x, y);
        let currlocationg = $(this.container + "#locationg");

        if (currlocationg.length == 0) {
            if (this.svg.select('#SVG_MAIN_CONTENT').members.length == 0) {
                setTimeout(() => { this.drawLocation(x, y); }, 200);
                return;
            }

            let locationg = this.svg.select('#SVG_MAIN_CONTENT').members[0].group().front();
            locationg.attr('id', 'locationg');
            const circle = locationg.circle().radius((Cookies.get('locationCircleSize') || 10));
            circle.cx(x).cy(y);
            circle.fill('deeppink');

            this.locationdrawn = true;
        } else {
            currlocationg.find('circle').attr('cx', x);
            currlocationg.find('circle').attr('cy', y);
        }
    }

    drawOrientation(x, y, alpha) {
        if (!this.locationdrawn || this.svg.select('#SVG_MAIN_CONTENT').members.length == 0) return;

        let currorientationg = $(this.container + "#orientationg");
        let pointSize : number = parseFloat((Cookies.get('locationCircleSize') || 10));

        if (currorientationg.length == 0) {
            let orientationg = this.svg.select('#SVG_MAIN_CONTENT').members[0].group().front();
            orientationg.attr('id', 'orientationg');

            const arrow = orientationg.image('/images/arrow.svg');
            console.log(pointSize);
            arrow.move(x, y - (pointSize * 2));
            arrow.attr('width', pointSize * 2);
            arrow.attr('height', pointSize * 2);
        } else {
            currorientationg.find('image').attr('x', x - pointSize);
            currorientationg.find('image').attr('y', y - (pointSize * 2) - 6);
        }

        let phase = (alpha < 0) ? alpha + 360 : alpha;

        $(SVGMap.instance.container + '#orientationg image').css({
            'transform-origin': `${x}px ${y}px`,
            'transform': `rotateZ(${phase}deg)`
        });

        currorientationg.attr('data-orientation', phase);
        currorientationg.attr('data-x', x);
        currorientationg.attr('data-y', y);
    }

    drawGuides() {
        if (this.zoomlevel >= this.MAX_GROUP_LEVEL) return;

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
        if (this.zoomlevel >= this.MAX_GROUP_LEVEL) return;

        this.drawGuides();

        let late_removal = Array.apply(null, Array(20)).map(element => []);

        for (let level = 0; level < this.data.groups.length; level++) {
            for (let i = 0; i < this.data.groups[level].length; i++) {
                const group = this.data.groups[level][i];
                if (group.auto) {
                    late_removal[level].push(group.id);
                }
            }
        }

        for (let i = 0; i < late_removal.length; i++) {
            const level = late_removal[i];
            for (const id of level) {
                $(`#gmarker-${id}`).remove();

                let index = -1;
                for (let j = 0; index != -1 && i < this.data.groups[i].length; j++) {
                    if (this.data.groups[i][j] && this.data.groups[i][j].id == id) {
                        index = j;
                    }
                }

                this.data.groups[i].splice(index, 1);
            }
        }

        for (const jail of this.svg.select('.jails rect').members) {
            let already_grouped = false;
            for (let i = 0; i < this.data.groups[this.zoomlevel].length; i++) {
                const gmarker = this.data.groups[this.zoomlevel][i];

                if (jail.inside(gmarker.lat, gmarker.long)) {
                    already_grouped = true;
                    break;
                }
            }

            if (already_grouped) { continue; }

            let affects = 0;
            let max_priority_feature;
            for (let i = 0; i < this.data.buildings.length; i++) {
                const feature = this.data.buildings[i];

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
                radius: jail.width() / 2,
                auto: true
            });
        }
    }
    
    groupMarkers(level) {
        let i = 0;

        this.calculateAutoGroups();
        
        let late_removal = [];
        for (const group of this.marker_groups) {
            for (const marker of group) {
                if (i == level) {
                    // Evitamos mostrar los elementos después de haberlos ocultado
                    // si aparecen en grupos de otros niveles
                    late_removal.push(marker);
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
                    a.attr('data-name', gmarker.name);
                    const gm = a.group();
                    const circle = gm.circle().radius(10);
                    circle.cx(gmarker.lat).cy(gmarker.long);
                    const text = gm.plain(gmarker.affects).attr('text-anchor', 'middle');
                    text.font({ size: 16 / fit });
                    text.move(gmarker.lat, gmarker.long - (8 / fit));

                    // Accessibility
                    a.title(gmarker.name).attr('id', 'gmarker-' + gmarker.id + '-title');
                    a.attr('aria-labelledby', 'gmarker-' + gmarker.id + '-title');
                    a.attr('data-coords', circle.cx() + ":" + circle.cy());
                    text.attr('aria-hidden', 'true');
                    text.attr('role', 'presentation');

                    let self = this;
                    $(a.node).on('click touchstart', function(e) {
                        e.preventDefault();
                        let [x, y] = $(this).attr('data-coords').split(':');
                        self.zoomAndMove(x, y, self.zoomlevel + 2);
                    });

                    $(a.node).on('focus', function() {
                        $(this).on('keyup', function(e) {
                            if (e.which == 13) {
                                e.preventDefault();
                                self.zoomlevel += 2;
                                let [x, y] = $(this).attr('data-coords').split(':');
                                self.zoomAndMove(x, y, self.zoomlevel);
                            }
                        });
                    });
                } else {
                    for (const member of this.svg.select('#gmarker-' + gmarker.id).members) {
                        member.remove();
                    }
                }
            }

            i++;
        }

        for (const marker of late_removal) {
            this.svg.select('#marker-' + marker).hide();

            $("#link-feature-" + marker).attr("tabindex", "-1");
            $("#link-feature-" + marker).addClass("non-clickable");
        }
    }

    isInview(e) {
        let minx = SVGMap.instance.svg.viewbox().x;
        let miny = SVGMap.instance.svg.viewbox().y;
        let maxx = minx + SVGMap.instance.svg.viewbox().width;
        let maxy = miny + SVGMap.instance.svg.viewbox().height;

        let coords = $(e).attr('data-coords');
        let centerx = parseFloat(coords.split(':')[0]);
        let centery = parseFloat(coords.split(':')[1]);

        let inviewx = (centerx >= minx && centerx <= maxx);
        let inviewy = (centery >= miny && centery <= maxy);

        /*console.log($(this).attr('data-name'), 'x', minx, maxx, centerx);
        console.log($(this).attr('data-name'), 'y', miny, maxy, centery);
        console.log($(this).attr('data-name'), 'inviewx', inviewx, 'inviewy', inviewy);*/

        let inview = (inviewx && inviewy);
        //console.log($(this).attr('data-name'), inview);
        return inview;
    }

    updateSidebar() {
        $("#currentViewPanel ul").empty();
        if (this.zoomlevel < this.MAX_GROUP_LEVEL) {
            $(this.container + ".gmarker").each((i, e) => {
                let inview = this.isInview(e);
                $(e).attr('data-inview', String(inview));
                
                if (inview) {
                    let name = $(e).attr('data-name');
                    let lat = $(e).attr('data-coords').split(':')[0];
                    let long = $(e).attr('data-coords').split(':')[1];
                    let li = document.createElement("li");
                    let a = document.createElement("a");
                    $(a).html(`Grupo: ${name}`);
                    $(a).attr('href', '#');
                    $(a).attr('data-type', 'group');
                    $(a).attr('data-listened', String(false));
                    $(a).attr('data-x', lat);
                    $(a).attr('data-y', long);
                    $(li).append(a);
                    $("#currentViewPanel ul").append(li);
                }
            });
        } else {
            $(this.container + "a.feature-object").each((i, e) => {
                let inview = this.isInview(e);
                $(this).attr('data-inview', String(inview));
                
                if (inview) {
                    let coords = $(e).attr('data-coords');
                    let centerx = parseFloat(coords.split(':')[0]);
                    let centery = parseFloat(coords.split(':')[1]);
            
                    let li = document.createElement("li");
                    let a = document.createElement("a");
                    $(a).html(`Edificio: ${$(e).attr('data-name')}`);
                    $(a).attr('href', '#');
                    $(a).attr('data-id', String($(e).attr('data-building')));
                    $(a).attr('data-x', centerx);
                    $(a).attr('data-y', centery);
                    $(li).append(a);
                    $("#currentViewPanel ul").append(li);
                }
            });
        }
    }

    getZoomValues(level, raisedbyuser) {
        var vbx = $("#map").width();
        vbx /= this.ZOOM_LEVEL_BASE + ((level - 1) * this.ZOOM_LEVEL_STEP);

        return { vbx: vbx, wdiff: (raisedbyuser) ? (this.svg.viewbox().width - vbx) / 2 : 0};
    }

    resizeToLevel(level, raisedbyuser = true) {
        if (level < 2 || level > 21) return;
        
        $(this.container + ".jails").remove();
        this.zoomlevel = level;

        let {vbx, wdiff} = this.getZoomValues(level, raisedbyuser);
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + wdiff, this.svg.viewbox().y + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;

        setTimeout(() => {
            this.groupMarkers(level);
            this.updateSidebar();
        }, 400);
    }

    zoom(level, x, y, raisedbyuser = true) {
        if (level < 2 || level > 21) return;
        
        $(this.container + ".jails").remove();
        this.zoomlevel = level;

        let {vbx} = this.getZoomValues(level, raisedbyuser);
        let oldx = this.svg.viewbox().x;
        let oldy = this.svg.viewbox().y;

        let cx = (this.svg.viewbox().x + (this.svg.viewbox().width)/2);
        let cy = (this.svg.viewbox().y + (this.svg.viewbox().height/2));

        let dcx = x - cx;
        let dcy = y - cy;

        console.log(x, y, cx, cy, dcx, dcy);

        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + dcx, this.svg.viewbox().y + dcy, vbx, vbx);

        window.location.href = "#zoom=" + level;

        setTimeout(() => {
            this.groupMarkers(level);
            this.updateSidebar();
        }, 400);
    }

    /*
        Increases viewbox in value of x and y.
    */
    move(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(this.svg.viewbox().x + x, this.svg.viewbox().y + y, this.svg.viewbox().width, this.svg.viewbox().height);
        
        setTimeout(() => {
            this.groupMarkers(this.zoomlevel);
        }, 400);
    }

    /*
        Centers viewbox on the (x, y) given coordinates
    */
    moveTo(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x - (this.fullw / 2), y - (this.fullh / 2), this.svg.viewbox().width, this.svg.viewbox().height);
        setTimeout(() => {
            this.groupMarkers(this.zoomlevel);
            this.updateSidebar();
        }, 400);
    }

    zoomAndMove(x, y, level, raisedbyuser = true) {
        $(this.container + ".jails").remove();
        this.zoomlevel = level;

        let {vbx, wdiff} = this.getZoomValues(level, true);
        let handler = (raisedbyuser) ? this.svg.animate({ duration: 250 }) : this.svg;
        handler.viewbox(x - (this.fullw / 2) + wdiff, y - (this.fullh / 2) + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;

        setTimeout(() => {
            this.groupMarkers(level);
            this.updateSidebar();
        }, 400);
    }
}