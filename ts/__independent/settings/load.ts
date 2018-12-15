import { Settings } from './defaults.js';

declare var Cookies;

export function loadSettings() {    
    let style = document.createElement('style');
    $(style).attr('type', 'text/css');

    /* Ajustes generales */
    let textSize = Cookies.get('textSize') || Settings.textSize;
    let fontFamily = Cookies.get('fontFamily') || Settings.fontFamily;

    /* Ajustes del mapa */
    let mapFontFamily = Cookies.get('mapFontFamily') || Settings.mapFontFamily;

    /* Colores del mapa */
    let buildingColor = Cookies.get('buildingColor') || Settings.buildingColor;
    let strokeColor = Cookies.get('strokeColor') || Settings.strokeColor;
    let textColor = Cookies.get('textColor') || Settings.textColor;
    let backgroundColor = Cookies.get('backgroundColor') || Settings.backgroundColor;

    /* Círculo de localización */
    let locationCircleColor = Cookies.get('locationCircleColor') || Settings.locationCircleColor;

    let fontImport = '';
    $.getJSON('/fonts/fonts.json', (fonts) => {
        console.log(fonts, fontFamily, fonts[fontFamily])
        if (fonts[fontFamily]) {
            for (const source of fonts[fontFamily].src) {
                fontImport += "@font-face {";
                fontImport += "font-family: 'OpenDyslexic';";

                if (source.style) fontImport += `font-style: ${source.style};`;
                if (source.weight) fontImport += `font-weight: ${source.weight};`;

                fontImport += `src: url('${source.url}') format('${source.format}');`;
                fontImport += "}";
            }
        }

        let css = `

            ${fontImport}

            body {
                font-family: "${fontFamily}"!important;
                font-size: ${textSize}px !important;
            }

            #map svg {
                background-color: ${backgroundColor} !important;
            }

            #map svg text {
                font-family: "${mapFontFamily}"!important;
            }

            #map svg .building {
                fill: ${buildingColor} !important;
                stroke: ${strokeColor} !important;
            }

            #map svg .map-marker text {
                fill: ${textColor} !important;
            }

            #map svg #locationg circle {
                fill: ${locationCircleColor} !important;
            }
        `;

        $(style).html(css);
        $(document.head).append(style);
    });
}