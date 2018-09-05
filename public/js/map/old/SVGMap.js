import {SVGMapData} from './SVGMapData.js';
import { SVGControls } from './SVGControls.js';

export class SVGMap {
    constructor() {
        this._svg = SVG('map');
        this._zoomlevel = 3;
        this._container = "#map svg ";
    }

    get svg() {
        return this._svg;
    }

    set svg(v) {
        this._svg = v;
    }

    static get data() {
        return this._datahandler;
    }

    static set data(v) {
        this._datahandler = v;
    }

    static hasData() {
        return (typeof this._datahandler != 'undefined');
    }

    static get controls() {
        return this._controls;
    }

    static set controls(v) {
        this._controls = v;
    }

    static hasControls() {
        return (typeof this._controls != 'undefined');
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

    draw() {
        if (!SVGMap.hasData()) {
            SVGMap.data = new SVGMapData(this.container, this.svg);
        }

        if (!SVGMap.hasControls()) {
            SVGMap.controls = new SVGControls(this);
        }

        
        // Zoom and move (0, 0) to center
        SVGMap.controls.resizeToLevel(this.zoomlevel, false);
        SVGMap.controls.moveTo(-this._svg.viewbox().width/2, -this._svg.viewbox().width/2, false);
        
        SVGMap.data.drawMarkers(this._svg);
        SVGMap.data.groupMarkers();
    }

    groupMarkers(level) {
        SVGMap.data.groupMarkers(level);

        var self = this;
        $(this.container + "a.gmarker").click(function(e) {
            e.preventDefault();
    
            self.zoomlevel += 2;
            SVGMap.controls.resizeToLevel(self.zoomlevel);
            self.groupMarkers(self.zoomlevel);
        });
    }
}