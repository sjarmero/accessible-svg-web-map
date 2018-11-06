function loadSettings() {
    var style = document.createElement('style');
    $(style).attr('type', 'text/css');
    /* Ajustes generales */
    var textSize = Cookies.get('textSize') || 16;
    var fontFamily = Cookies.get('fontFamily') || 'Arial';
    /* Ajustes del mapa */
    var mapFontFamily = Cookies.get('mapFontFamily') || 'Arial';
    /* Colores del mapa */
    var buildingColor = Cookies.get('buildingColor') || '#90A4AE';
    var strokeColor = Cookies.get('strokeColor') || '#455A64';
    var textColor = Cookies.get('textColor') || '#0C0C0C';
    var backgroundColor = Cookies.get('backgroundColor') || '#ECEFF1';
    var css = "\n        body {\n            font-family: '" + fontFamily + "', sans-serif !important;\n            font-size: " + textSize + "px !important;\n        }\n\n        #map svg {\n            background-color: " + backgroundColor + " !important;\n        }\n\n        #map svg text {\n            font-family: '" + mapFontFamily + "', sans-serif !important;\n        }\n\n        #map svg .building {\n            fill: " + buildingColor + " !important;\n            stroke: " + strokeColor + " !important;\n        }\n\n        #map svg .map-marker text {\n            fill: " + textColor + " !important;\n        }\n    ";
    $(style).html(css);
    $(document.head).append(style);
}
