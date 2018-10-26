function loadSettings() {
    let style = document.createElement('style');
    $(style).attr('type', 'text/css');

    /* Ajustes generales */
    let textSize = Cookies.get('textSize') || 16;
    let fontFamily = Cookies.get('fontFamily') || 'Arial';

    /* Ajustes del mapa */
    let mapFontFamily = Cookies.get('mapFontFamily') || 'Arial';

    /* Colores del mapa */
    let buildingColor = Cookies.get('buildingColor') || '#90A4AE';
    let strokeColor = Cookies.get('strokeColor') || '#455A64';
    let textColor = Cookies.get('textColor') || '#212121';
    let backgroundColor = Cookies.get('backgroundColor') || '#351A1A';

    let css = `
        body {
            font-family: '${fontFamily}', sans-serif !important;
            font-size: ${textSize}px !important;
        }

        #map svg {
            background-color: ${backgroundColor} !important;
        }

        #map svg text {
            font-family: '${mapFontFamily}', sans-serif !important;
        }

        #map svg .building {
            fill: ${buildingColor} !important;
            stroke: ${strokeColor} !important;
        }

        #map svg .map-marker text {
            fill: ${textColor} !important;
        }
    `;

    $(style).html(css);
    $(document.head).append(style);
}