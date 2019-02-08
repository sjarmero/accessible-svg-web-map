declare var L;

function create(name : string) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}

L.SVG.include({
    _initContainer: function() {
        this._container = create('svg');
        this._container.setAttribute('tabindex', 0);
        this._container.setAttribute('id', 'MAIN_SVG');

        this._rootGroup = create('g');
        this._rootGroup.setAttribute('id', 'rootGroup');
        this._container.appendChild(this._rootGroup);

        this._userGroupsList = [];
        this._userGroups = [];
    },

    _initPath: function (layer) {
        let a = layer._a = (layer.options.interactive) ? create('a') : create('g');
        let path = create('path');

        let stamp = L.Util.stamp(layer);

        if (layer.options.interactive) a.setAttribute('href', '#');
        path.setAttribute('class', layer.options.className);

        a.appendChild(path);

        this._updateStyle(layer);
        this._layers[stamp] = layer;
    },

    _addPath: function(layer) {        
        if (!this._rootGroup) { this._initContainer(); }

        let group = (layer.options.group) ? layer.options.group : "features";
        if (layer._a.querySelector('path').getAttribute('d') != "M0 0") {
            if (group != null && group != "") {
                let cg = this._rootGroup.querySelector(`g[id='${group}']`);
                
                if (cg) {
                    cg.appendChild(layer._a);
                } else {
                    let g = create('g');
                    g.setAttribute('id', group);

                    g.appendChild(layer._a);

                    let ref = (layer.options.front) ? null : this._rootGroup.firstElementChild;
                    this._rootGroup.insertBefore(g, ref);
                }
            } else {
                this._rootGroup.appendChild(layer._a);
            }

            if (layer.options.interactive) {
                layer.addInteractiveTarget(layer._a);    
            } else {
                layer._a.setAttribute('style', 'pointer-events: none;');
            }
        }
    },

    _setPath: function (layer, path) {
        layer._a.querySelector('path').setAttribute('d', path);
    },

    _updateStyle: function(layer) {
        let path = layer._a.querySelector('path');
        let options = layer.options;
        if (!path) return;

        if (options.stroke) {
            path.setAttribute('stroke', options.color);
            path.setAttribute('stroke-opacity', options.opacity);
            path.setAttribute('stroke-width', options.weight);
            path.setAttribute('stroke-linecap', options.lineCap);
            path.setAttribute('stroke-linejoin', options.lineJoin);

            if (options.dashArray) {
                path.setAttribute('stroke-dasharray', options.dashArray);
            } else {
                path.removeAttribute('stroke-dasharray');
            }

            if (options.dashOffset) {
                path.setAttribute('stroke-dashoffset', options.dashOffset);
            } else {
                path.removeAttribute('stroke-dashoffset');
            }
        } else {
            path.setAttribute('stroke', 'none');
        }

        if (options.fill) {
            path.setAttribute('fill', options.fillColor || options.color);
            path.setAttribute('fill-opacity', options.fillOpacity);
            path.setAttribute('fill-rule', options.fillRule || 'evenodd');
        } else {
            path.setAttribute('fill', 'none');
        }
    },

    _removePath: function (layer) {
        L.DomUtil.remove(layer._a.querySelector('path'));
        L.DomUtil.remove(layer._a);

        layer.removeInteractiveTarget(layer._a);
        delete this._layers[L.Util.stamp(layer)];
    }
});

// https://github.com/Leaflet/Leaflet/issues/4029

L.rotableImageOverlay = function(url, bounds, options) {
    return new L.RotableImageOverlay(url, bounds, options);
};

// A quick extension to allow image layer rotation.
L.RotableImageOverlay = L.ImageOverlay.extend({
    _animateZoom: function(e){
        L.ImageOverlay.prototype._animateZoom.call(this, e);
        let img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + (this.options.rotate || 0) + 'deg)';
    },
    _reset: function(){
        L.ImageOverlay.prototype._reset.call(this);
        let img = this._image;
        img.style[L.DomUtil.TRANSFORM] += ' rotate(' + (this.options.rotate || 0) + 'deg)';
    }
});