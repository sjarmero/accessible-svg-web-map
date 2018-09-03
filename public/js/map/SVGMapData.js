export class SVGMapData {
    // Container: CSS Selector of <svg>
    constructor(container, svg, data) {
        this.map = map;
        this.container = container;
        this.svg = svg;

        if (typeof data != 'undefined') {
            this._data = data;
        }

        this.marker_groups = Array.apply(null, Array(20)).map(element => []);
    }

    get data() {
        return this._data;
    }

    set data(v) {
        this._data = v;
    }

    getData() {
        this._data = JSON.parse($.ajax({
            type: "GET",
            url: '/map/data',
            async: false
        }).responseText);

        return;
    }

    drawMarkers(svg) {
        this.getData();

        svg.attr('id', 'SVG_MAIN');
        svg.attr('preserveAspectRatio', 'xMidYMid slice');
        svg.attr('class', 'map-dragable');
        svg.attr('tabindex', 0);
        
        const main = svg.group().attr('id', 'SVG_MAIN_CONTENT');

        for (const feature of this.data.buildings) {
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
    }

    groupMarkers(level) {
        this.getData();

        var i = 0;
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
                    text.move(gmarker.long, gmarker.lat - (8 / fit));

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
    }
}