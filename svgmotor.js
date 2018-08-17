const drawFromData = function(data) {
    var svg = "<g id='SVG_MAIN'>";
    for (const building of data.buildings) {
        svg += '<g id="'+ building['properties']['id']['value'] +'" class="feature">';
        svg += '<a xlink:href="#">';
        svg += '<path class="building" d="'+ building['path'] +'" />';  
        svg += '</a></g>';
    }

    return svg;
}

module.exports = {
    fromData: drawFromData
}