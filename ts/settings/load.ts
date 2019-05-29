import { Settings } from './defaults.js';

declare var Cookies;

export function loadSettings() {    
    /* Animaciones */
    let enableAnimations = Cookies.get('enableAnimations') || Settings.enableAnimations;
    if (enableAnimations == "false") {
        console.log('Disabling animations');
        $(".animated").removeClass("animated");
        $(".progress-bar-animated").removeClass("progress-bar-animated");
    }

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
    let backgroundTextColor = Cookies.get('backgroundTextColor') || Settings.backgroundTextColor;
    let backgroundTextColorOpacity = Cookies.get('backgroundTextColorOpacity') || Settings.backgroundTextColorOpacity;
    let backgroundColor = Cookies.get('backgroundColor') || Settings.backgroundColor;

    if (Cookies.get('mapType') == 'full') {
        backgroundColor = 'transparent';
    }

    /* Círculo de localización */
    let locationCircleColor = Cookies.get('locationCircleColor') || Settings.locationCircleColor;

    let fontImport = '';
    $.getJSON('/fonts/fonts.json', (fonts) => {
        for (let fontFamily of Object.keys(fonts)) {
            for (const source of fonts[fontFamily].src) {
                fontImport += "@font-face {";
                fontImport += `font-family: '${fonts[fontFamily].name}';`;

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

            .map-marker .map-marker-text {
                font-family: "${mapFontFamily}";
                color: ${textColor} !important;
                background-color: ${hex2rgba(backgroundTextColor, backgroundTextColorOpacity / 100)} !important;
            }

            #map svg #locationGroup circle {
                fill: ${locationCircleColor} !important;
            }
        `;

        $(style).html(css);
        $(document.head).append(style);
    });
}

// https://stackoverflow.com/a/21648508
function hex2rgba(hex, opacity) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length == 3){
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',' + opacity + ')';
    } else {
        throw new Error('Bad Hex');
    }
}