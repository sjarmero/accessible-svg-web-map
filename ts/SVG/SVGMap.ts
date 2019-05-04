import { toggleCard, focusBuilding, showBuildingInfo } from "../map/search.js";
import { Settings } from "../settings/defaults.js";
import { ITabOrder, WETabOrder } from "./WETabOrder.js";

declare var L, Cookies, proj4;

export class SVGMap {
    public readonly MAX_GROUP_LEVEL : number = 17;

    private static _instance : SVGMap;

    private orders : ITabOrder[];

    private _map : any;
    private _svg : any;
    private _container : string;
    private guides_drawn : boolean;
    private geojson_layer : any;
    private drawn_markers : any;
    private locationCircle : any;
    private accuracyCircle : any;
    private orientationImage : any;
    private lastLocation : {ox: number, oy: number, accuracy: number};
    private lastOrientation : number;
    private _data : any;
    private onmapdrawn : any;

    constructor() {
        this._container = "#map";

        this._map = L.map($(this._container).get(0), {
            renderer: L.svg(),
            interactive: true,
            maxZoom: 18,
            zoomControl: false
        }).setView([38.3842921, -0.5115638], 16);

        if(Cookies.get('mapType') == 'full') {
            new L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map graphics by <a href="//openstreetmap.org">OpenStreetMap</a>'
            }).addTo(this._map);
        }

        L.control.zoom({
            position: 'topright'
        }).addTo(this._map);

        this._map.on('zoomend moveend', () => {
            if (this.lastLocation) this.drawLocation(this.lastLocation.ox, this.lastLocation.oy, this.lastLocation.accuracy);
            if (this.lastOrientation) this.drawOrientation(this.lastOrientation);
            this.groupMarkers();

            if (this.zoomlevel >= this.MAX_GROUP_LEVEL) {
                $(".map-marker").attr("tabindex", "-1");
            }

            if (this.orders.length > 0) {
                this.orders[0].getOrder().then((order) => {
                    let or = 1;
                    for (const b of order) {
                        if ($(this.container).find('svg').find(`#feature-link-${b}`).length > 0) {
                            $(this.container).find('svg').find(`#feature-link-${b}`).attr('tabindex', or);
                            or++;
                        }
                    };
                });
            }
        });

        this.guides_drawn = false;

        this.orders = [
            new WETabOrder("WETab")
        ];
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

    addOrder(o : ITabOrder) {
        this.orders.push(o);
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
                building: true,
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
                                <div class='map-marker' tabindex='-1' role="presentation" aria-hidden="true">
                                    <div class='map-marker-img'>
                                        <img src='/images/building_marker.svg' role="presentation" aria-hidden="true" />
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

                        let enableAnimations = Cookies.get('enableAnimations') || Settings.enableAnimations;
                        if (enableAnimations != "false") { 
                            a.addClass('animated');
                        }

                        a.attr('data-building', feature.properties.id);
                        a.attr('role', 'graphics-symbol img');
                        a.attr('data-name', feature.properties.name);
                        a.attr('data-coords', `${feature.properties.centerx}:${feature.properties.centery}`);
                        a.attr('data-description', feature.properties.description);
                        a.attr('data-nearest', feature.properties.nearestnames.reduce((prev, curr) => {
                            return `${prev},${curr}`
                        }));
                        a.attr('id', `feature-link-${feature.properties.id}`);
                        a.attr('data-nearest-radius', feature.properties.nearestnamesradius);

                        let desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
                        $(desc).html(feature.properties.description);
                        $(desc).attr('id', `feature-link-${feature.properties.id}-desc`)
                        a.prepend(desc);
                        
                        let title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                        $(title).html(feature.properties.name);
                        $(title).attr('id', `feature-link-${feature.properties.id}-title`)
                        a.prepend(title);
                        
                        $(a).attr('aria-describedby', `feature-link-${feature.properties.id}-desc`);
                        $(a).attr('aria-labelledby', `feature-link-${feature.properties.id}-title`);

                        if ($(a).attr("data-listened") != "true") {
                            $(a).on('click', function(e) {
                                if (parseInt($(a).attr("tabindex")) == -1) return;
                                if ($(this).hasClass('non-clickable')) return;
        
                                $(a).removeClass("active");
                                $(this).addClass("active");
        
                                showBuildingInfo($(this).attr('data-building'));
                            });
        
                            $(a).on('focus', function(e) {
                                console.log('tabindex', $(this).attr('tabindex'));
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
            
            this.geojson_layer.getAttribution = function() {
                return 'Map data by <a href="https://www.sigua.ua.es/">SigUA</a>';
            }

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

            /*let defs = this._svg.defs().node;
            defs.innerHTML = `
                <filter x="0" y="0" width="1" height="1" id="bgFilter">
                    <feFlood />
                    <feComposite in="SourceGraphic"/>
                </filter>`;*/;

            $(this._container ).find('svg a').attr('tabindex', '-1');

            this.onmapdrawn();
        });
    }

    drawLocation(ox : number, oy : number, accuracy : number) {
        if (ox && oy && accuracy) this.lastLocation = {ox: ox, oy: oy, accuracy: accuracy};

        if (this.locationCircle) {
            SVGMap.instance.map.removeLayer(this.locationCircle);
            SVGMap.instance.map.removeLayer(this.accuracyCircle);
            this.locationCircle = null;
            this.accuracyCircle = null;
        }

        let size = Cookies.get('locationCircleSize') || Settings.locationCircleSize;
        let meters : number = this.pixelsToMeters(size);

        this.locationCircle = L.circle([ox, oy], {
            fill: true,
            fillColor: Cookies.get('locationCircleColor') || Settings.locationCircleColor,
            stroke: true,
            color: '#FFF',
            weight: 2,
            interactive: false,
            radius: meters,
            className: "circle",
            fillOpacity: 1,
            strokeOpacity: 1,
            group: 'location',
            front: true
        });

        this.accuracyCircle = L.circle([ox, oy], {
            fill: true,
            fillColor: Cookies.get('locationCircleColor') || Settings.locationCircleColor,
            stroke: false,
            interactive: false,
            radius: accuracy,
            className: "accuracy-circle",
            fillOpacity: 0.3,
            group: 'location'
        });

        this.accuracyCircle.addTo(SVGMap.instance.map);
        this.locationCircle.addTo(SVGMap.instance.map);
    }

    drawOrientation(alpha : number) {
        if (!alpha || !this.lastLocation) return;

        this.lastOrientation = alpha;

        let {ox, oy} = this.lastLocation;
        let size : number = parseFloat((Cookies.get('locationCircleSize') || 10));

        let originPoint = SVGMap.instance.map.latLngToContainerPoint([ox, oy]);
        let originAdjust = originPoint.add({x : -(size), y: -(size * 4)});
        let targetPoint = originPoint.add({x: (size), y: (size / 4)});

        let originLatLng = SVGMap.instance.map.containerPointToLatLng(originAdjust);
        let targetLatLng = SVGMap.instance.map.containerPointToLatLng(targetPoint);

        if (this.orientationImage) {
            SVGMap.instance.map.removeLayer(this.orientationImage);
            this.orientationImage = null;
        }

        let phase = (alpha < 0) ? alpha + 360 : alpha;

        this.orientationImage = L.rotableImageOverlay('/images/arrow.svg', [
            originLatLng,
            targetLatLng
        ], {
            rotate: phase
        });
        
        this.orientationImage.addTo(SVGMap.instance.map);

        $(this.orientationImage._image).attr('id', 'orientationArrow');
        $(this.orientationImage._image).attr('data-orientation', phase);
        $(this.orientationImage._image).attr('data-x', originPoint.x);
        $(this.orientationImage._image).attr('data-y', originPoint.y);

        $(this.orientationImage._image).css({
            'z-index': 999,
            'transform-origin': `${size}px ${size * 4}px`
        });
    }
    
    groupMarkers() {
        if (this._map.getZoom() >= this.MAX_GROUP_LEVEL) {
            $(this._container).find('svg a').attr('tabindex', '0');   

            $(this._container).find('svg a').each(function() {
                if ($(this).find('path').attr('d') == 'M0 0') {
                    $(this).attr('tabindex', '-1');
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
        this.map.setView([cx, cy], level, (Cookies.get('enableAnimations') ? Cookies.get('enableAnimations') == 'false' : !Settings.enableAnimations));
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
        this.map.setView([cx, cy], this.map.getZoom(), (Cookies.get('enableAnimations') ? Cookies.get('enableAnimations') == 'false' : !Settings.enableAnimations));
    }

    zoomAndMove(x, y, level, raisedbyuser = true) {
        if (level < 2 || level > 21) return;

        let [cy, cx] = (<any>proj4('EPSG:25830', 'EPSG:4326', [parseFloat(x), -parseFloat(y)]));
        this.map.setView([cx, cy], level, (Cookies.get('enableAnimations') ? Cookies.get('enableAnimations') == 'false' : !Settings.enableAnimations));
    }

    pixelsToMeters(pixels : any) : number {
        pixels = parseInt(pixels);
        let centerLatLng = this.map.getCenter();
        let centerPoint = this.map.latLngToContainerPoint(centerLatLng);
        let targetPoint = [centerPoint.x, centerPoint.y + pixels];
        let targetLatLng = this.map.containerPointToLatLng(targetPoint);

        return centerLatLng.distanceTo(targetLatLng);
    }
}