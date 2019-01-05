import { toggleCard, focusBuilding, showBuildingInfo } from "../map/search.js";
import { Settings } from "../settings/defaults.js";

declare var L, Cookies, proj4;

export class SVGMap {
    public readonly MAX_GROUP_LEVEL : number = 17;

    private static _instance : SVGMap;

    private _map : any;
    private _svg : any;
    private _container : string;
    private guides_drawn : boolean;
    private geojson_layer : any;
    private drawn_markers : any;
    private locationCircle : any;
    private orientationImage : any;
    private lastLocation : {ox: number, oy: number};
    private lastOrientation : number;
    private marker_groups : number[][];
    private auto_marker_groups : any[][];
    private auto_grouped_buildings : any[];
    private _data : any;
    private onmapdrawn : any;
    private locationdrawn : boolean;

    constructor() {
        this._container = "#map";

        this._map = L.map($(this._container).get(0), {
            renderer: L.svg(),
            interactive: true,
            maxZoom: 18,
            zoomControl: false
        }).setView([38.3842921, -0.5115638], 16);

        L.control.zoom({
            position: 'topright'
        }).addTo(this._map);

        this._map.on('zoomend moveend', () => {
            this.drawLocation(this.lastLocation.ox, this.lastLocation.oy);
            this.drawOrientation(this.lastOrientation);
            this.groupMarkers();
        });

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

    get map() : any {
        return this._map;
    }

    set map(v) {
        this._map = v;
    }

    get svg() : any {
        if (this._svg == undefined) {
            if ($(this.container).find('svg').length > 0) {
                return SVG($(this.container).find('svg').get(0));
            } else {
                return null;
            }
        } else {
            return this._svg;
        }
    }

    set svg(v) {
        this._svg = v;
    }

    get zoomlevel() : number {
        return this.map.getZoom();
    }

    set zoomlevel(v) {
        this.resizeToLevel(v);
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
            return $.getJSON(`/map/data/geojson/${radius}`, (data) => {
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

    set onDrawn(v) {
        this.onmapdrawn = v;
    }

    get fullw() : number{
        return this.svg.viewbox().width;
    }

    get fullh() : number {
        return this.svg.viewbox().height;
    }

    draw() {
        this.fetchData().then((data) => {
            this.data = data;
            this.drawn_markers = L.markerClusterGroup({
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: false,
                disableClusteringAtZoom: this.MAX_GROUP_LEVEL,
                maxClusterRadius: 180
            });
        
            this.geojson_layer = L.geoJson(data, {
                className: 'edificio feature-block building',
                fillOpacity: '1',
                strokeOpacity: '1',
                onEachFeature: (feature, layer) => {
                    let wordsRaw = feature.properties.name.split(' ');
                    let words = [wordsRaw[0]];
                    for (let i = 1; i < wordsRaw.length; i++) {
                        let word = wordsRaw[i];
                        if ((words[words.length-1].length + word.length) <= 10 || word.match(/^(,|.|;|:|")$/i) != null) {
                            words[words.length-1] += ` ${word}`;
                        } else {
                            words.push(word);
                        }
                    }

                    let textString = '';
                    for (const word of words) {
                        textString += `${word} <br />`;
                    }

                    let [cy, cx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [feature.properties.centerx - 14, - (feature.properties.centery - 7)]));
                    this.drawn_markers.addLayer(L.marker([cx, cy], {
                        icon: L.divIcon({
                            className: 'map-marker',
                            html: `
                                <div class='map-marker' tabindex='-1'>
                                    <div class='map-marker-img'>
                                        <img src='/images/building_marker.svg' />
                                    </div>
                                    <div class='map-marker-text'>${textString}</div>
                                </div>
                            `
                        })
                    }));

                    setTimeout(() => {
                        let a = $(layer._a);
                        a.addClass('feature-object');
                        a.addClass('building-wrapper');
                        a.attr('data-building', feature.properties.id);
                        a.attr('role', 'graphics-symbol img');
                        a.attr('data-name', feature.properties.name);
                        a.attr('data-coords', `${feature.properties.centerx}:${feature.properties.centery}`);
                        a.attr('data-description', feature.properties.description);
                        a.attr('data-nearest', feature.properties.nearestnames.reduce((prev, curr) => {
                            return `${prev},${curr}`
                        }));

                        a.attr('data-nearest-radius', feature.properties.nearestnamesradius);
                        a.attr('aria-label', feature.properties.name);

                        if ($(a).attr("data-listened") != "true") {
                            $(a).on('click touchstart', function(e) {
                                if (parseInt($(a).attr("tabindex")) == -1) return;
                                if ($(this).hasClass('non-clickable')) return;
        
                                $(a).removeClass("active");
                                $(this).addClass("active");
        
                                showBuildingInfo($(this).attr('data-building'));
                            });
        
                            $(a).on('focus', function(e) {
                                let id = $(this).attr('data-building');
                                let [cx, cy] = $(this).attr('data-coords').split(':');
                                focusBuilding(id, cx, cy, false);
                                toggleCard($("#featureInfoPanel .card"), 'hide');
                            });
        
                            $(a).attr("data-listened", "true");
                        }
                    }, 500);
                }
            });
            
            this.geojson_layer.addTo(this._map);

            this.drawn_markers.on('animationend', () => {
                this.groupMarkers();
            });

            this.drawn_markers.on('clusterkeypress', (e) => {
                if (e.originalEvent.charCode == 13) {
                    e.layer.zoomToBounds({ padding: [20, 20] });
                }
            });

            this.map.addLayer(this.drawn_markers);

            this._svg = SVG($(this._map._container).find('svg').get(0));
            this._svg.attr('role', 'graphics-document document');

            let defs = this._svg.defs().node;
            defs.innerHTML = `
                <filter x="0" y="0" width="1" height="1" id="bgFilter">
                    <feFlood />
                    <feComposite in="SourceGraphic"/>
                </filter>`;

            $(this._container ).find('svg a').attr('tabindex', '-1');

            this.onmapdrawn();
        });
    }

    drawLocation(ox : number, oy : number) {
        if (ox && oy) this.lastLocation = {ox: ox, oy: oy};

        let {x, y} = this.map.latLngToLayerPoint([ox, oy]);

        if (this.svg) {
            if (this.locationCircle) {
                this.locationCircle.move(x, y);
            } else {
                let lg = this.svg.select('#rootGroup').members[0].group();
                lg.attr('id', 'locationGroup');

                this.locationCircle = lg.circle(Cookies.get('locationCircleSize') || Settings.locationCircleSize);
                console.log(this.locationCircle);
                this.locationCircle.fill(Cookies.get('locationCircleColor') || Settings.locationCircleColor);
                this.locationCircle.move(x, y);
            }
        }
    }

    drawOrientation(alpha : number) {
        if (!alpha) return;

        if (this.svg && this.lastLocation) {
            if (alpha) this.lastOrientation = alpha;

            let {ox, oy} = this.lastLocation;
            let {x, y} = this.map.latLngToLayerPoint([ox, oy]);
            let og;
            let size : number = parseFloat((Cookies.get('locationCircleSize') || 10));
            if (this.orientationImage) {
                og = this.svg.select('#orientationGroup');
                this.orientationImage.move(x, y - (size * 1));
            } else {
                og = this.svg.select('#rootGroup').members[0].group();
                og.attr('id', 'orientationGroup');

                this.orientationImage = og.image('/images/arrow.svg');

                this.orientationImage.move(x, y - size);
                this.orientationImage.attr('width', size);
                this.orientationImage.attr('height', size);
            }

            let phase = (alpha < 0) ? alpha + 360 : alpha;
            $(SVGMap.instance.container).find('svg').find('#orientationGroup image').css({
                'transform-origin': `${x + (size / 2)}px ${y + (size / 2)}px`,
                'transform': `rotateZ(${phase}deg)`
            });

            og.attr('data-orientation', phase);
            og.attr('data-x', x + (size / 2));
            og.attr('data-y', y + (size / 2));
        }
    }
    
    groupMarkers() {
        if (this._map.getZoom() >= this.MAX_GROUP_LEVEL) {
            $(this._container ).find('svg a').attr('tabindex', '0');   

            $(this.container).find('svg #rootGroup a').each((i, e) => {
                if ($(e).find('path').attr('d') == 'M0 0') {
                    $(e).attr('tabindex', '-1');
                }
            });

            $(this._container + " .map-marker").removeClass("d-none");

            this.updateSidebar();
        } else {
            setTimeout(() => {
                $(this._container + " .map-marker").addClass("d-none");
            }, 500);

            $(this._container ).find('svg a').attr('tabindex', '-1');

            setTimeout(() => {
                this.drawn_markers._featureGroup.eachLayer((c) => {
                    if (c instanceof L.MarkerCluster) {
                        $(c._icon).addClass('gmarker');
                        const {lat, lng} = c._latlng;
                        let [cx, cy] = (<any>proj4('EPSG:4326', 'EPSG:25830', [lng, lat]));
                        $(c._icon).attr('data-coords', `${cx}:${-cy}`);
                        $.getJSON(`/map/data/nn4p/${cx},${cy},100`, (near) => {
                            if (near.length > 0) {
                                const nearest = near[0];
                                $(c._icon).attr('aria-label', `Marcadores cerca de ${nearest.iname}`);
                                $(c._icon).attr('data-name', `Marcadores cerca de ${nearest.iname}`);
                            }
                        });

                        $(c._icon).on('click', () => {
                            $(this.container).find('svg').trigger('focus');
                        });

                        $(c._icon).on('focus', function() {
                            $(this).on('keypress', function(e : any) {
                                if (e.originalEvent.charCode == 13) {
                                    $(this).trigger('click');
                                }
                            })
                        });
                    }
                });

                setTimeout(() => {
                    this.updateSidebar();
                }, 100);
            }, 500);
        }
    }

    isInview(e) {
        return this.map.getBounds().contains((e.getLatLng ? e.getLatLng() : e.getCenter()));
    }

    updateSidebar() {
        try {
        $("#currentViewPanel ul").empty();
        if (this.zoomlevel < this.MAX_GROUP_LEVEL) {
            this.drawn_markers._featureGroup.eachLayer((c) => {
                let e = c._icon;

                let inview = this.isInview(c);
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
            for (const k of Object.keys(this.geojson_layer._layers)) {
                const c = this.geojson_layer._layers[k];
                let e = c._a;

                let inview = this.isInview(c);
                $(e).attr('data-inview', String(inview));
                
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
            };
        }
        } catch (e) {} 
    }

    resizeToLevel(level, raisedbyuser = true) {
        if (level < 1 || level > 21) return;

        this.map.setZoom(level);
    }

    zoom(level, x, y, raisedbyuser = true) {
        if (level < 2 || level > 21) return;
    
        let [cy, cx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [x, -y]));
        this.map.setView([cx, cy], level);
    }

    /*
        Increases viewbox in value of x and y.
    */
    move(x, y, raisedbyuser = true) {
        this.map.panBy(new L.Point(x, y));
    }

    /*
        Centers viewbox on the (x, y) given coordinates
    */
    moveTo(x, y, raisedbyuser = true) {
        let [cy, cx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [x, -y]));
        this.map.setView([cx, cy], this.map.getZoom());
    }

    zoomAndMove(x, y, level, raisedbyuser = true) {
        if (level < 2 || level > 21) return;

        let [cy, cx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [parseFloat(x), -parseFloat(y)]));
        this.map.setView([cx, cy], level);
    }
}