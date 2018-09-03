const ZOOM_LEVEL_BASE = 0.000246153846;
const ZOOM_LEVEL_STEP = 0.4514682741;

export class SVGControls {
    constructor(map) {
        this.altk = false;
        this.map = map;
    }

    resizeToLevel(level, raisedbyuser = true) {
        var vbx = $("#map").width();
        vbx /= ZOOM_LEVEL_BASE + ((level - 1) * ZOOM_LEVEL_STEP);

        var wdiff = (raisedbyuser) ? (this.map.svg.viewbox().width - vbx) / 2 : 0;
        var handler = (raisedbyuser) ? this.map.svg.animate({ duration: 250 }) : this.map.svg;
        handler.viewbox(this.map.svg.viewbox().x + wdiff, this.map.svg.viewbox().y + wdiff, vbx, vbx);

        window.location.href = "#zoom=" + level;
    }

    moveTo(x, y, raisedbyuser = true) {
        var handler = (raisedbyuser) ? this.map.svg.animate({ duration: 250 }) : this.map.svg;
        handler.viewbox(x, y, this.map.svg.viewbox().width, this.map.svg.viewbox().height);
    }

    async navigationHandler(mode) {
        const STEP = 15 + (20 - this.map.zoomlevel);

        var vbox = this.map.svg.viewbox();
        var vbx = vbox.x;
        var vby = vbox.y;
        var vbzx = vbox.width;
        var vbzy = vbox.height;

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
                this.map.zoomlevel = (this.map.zoomlevel == 20) ? this.map.zoomlevel : this.map.zoomlevel + 1;
                this.resizeToLevel(this.map.zoomlevel);

                return;

            case 'zoom-out':
                this.map.zoomlevel = (this.map.zoomlevel == 1) ? this.map.zoomlevel : this.map.zoomlevel - 1;
                this.resizeToLevel(this.map.zoomlevel);

                return;
        }

        vbx += xdif;
        vby += ydif;

        this.moveTo(vbx, vby);
    }
}