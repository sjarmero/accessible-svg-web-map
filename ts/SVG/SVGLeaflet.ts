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

        this._featuresGroup = create('g');
        this._featuresGroup.setAttribute('id', 'fetaures');
        this._rootGroup.appendChild(this._featuresGroup);
    },

    _initPath: function (layer) {
        let a = layer._a = create('a');
        let path = create('path');

        let stamp = L.Util.stamp(layer);

        a.setAttribute('href', '#');
        path.setAttribute('class', layer.options.className);

        a.appendChild(path);
        this._updateStyle(layer);
        this._layers[stamp] = layer;
    },

    _addPath: function(layer) {
        if (!this._rootGroup) { this._initContainer(); }

        if (layer._a.querySelector('path').getAttribute('d') != "M0 0") {
            this._featuresGroup.appendChild(layer._a);
            layer.addInteractiveTarget(layer._a);
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
/*
L.Icon.include({
    options: {
        iconSize: [14, 14],
        text: '',
        iconUrl: '/images/marker.svg',
        className: 'map-marker'
    },

    createIcon: function() {
        console.log(this);
        let g = document.createElement('div');
        let options = this.options;
        const [cx, cy] = this.options.latlng;
        const [ix, iy] = [cx - 15, cy - 7];

        let img = create('img');
        img.setAttribute('x', cx);
        img.setAttribute('y', cy);

        let text = create('text');
        text.setAttribute('x', cx);
        text.setAttribute('y', cy);
        text.setAttribute('text-anchor', 'start');
        text.setAttribute('filter', 'url(#bgFilter)');

        let wordsRaw = options.text.split(' ');
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
                let tspan = create('tspan');
                tspan.innerHTML = words[i];
                tspan.setAttribute('x', cx);
                tspan.setAttribute('y', cy);
                text.appendChild(tspan);
            } else {
                let tspan = create('tspan');
                tspan.innerHTML = words[i];
                tspan.setAttribute('x', cx);
                tspan.setAttribute('y', cy + (i * 5));
                text.appendChild(tspan);
            }
        }

        g.appendChild(text);
        g.appendChild(img);

        return g;
    },

    createShadow: function() {
        return null;
    }
});*/