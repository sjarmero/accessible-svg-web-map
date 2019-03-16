import { loadSettings } from "./load.js";

declare var Cookies;

$(document).ready(function() {
    (<any>$('.colorpicker-group')).colorpicker({
        format: 'hex'
    }).on('colorpickerCreate colorpickerChange', function(e) {
        updatePreview();
    });

    $(':input').on('change', function() {
        console.log('change!');
        updatePreview();
    })

    $('#settingsForm').on('submit', function(e) {
        e.preventDefault();

        $(this).find('input:not([type="submit"]):not([type="reset"]):not([type="radio"]), select').each(function() {
            let name = $(this).attr('name');
            let value = $(this).val();

            console.log(name, value);
            Cookies.set(name, String(value), { expires: 365 });
        });

        $(this).find('input[type="radio"]').each(function() {
            if ($(this).prop('checked')) {
                let name = $(this).attr('name');
                let value = $(this).val();
    
                console.log(name, value);
                Cookies.set(name, String(value), { expires: 365 });
            }
        })

        $("#successBadge").removeClass("d-none");
        $("#successBadge").html($("#successBadge").html());
    });

    $('#settingsForm').on('reset', function(e) {
        $('.colorpicker-group').each(function() {
            (<any>$(this)).colorpicker('setValue', $(this).find('input').attr('value'));
        });
    });

    loadSettings();
    
    $.getJSON('/fonts/fonts.json', (fonts) => {
        let fontImport = '';
        for (const fontFamily of Object.keys(fonts)) {
            for (const source of fonts[fontFamily].src) {
                fontImport += "@font-face {";
                fontImport += "font-family: 'OpenDyslexic';";

                if (source.style) fontImport += `font-style: ${source.style};`;
                if (source.weight) fontImport += `font-weight: ${source.weight};`;

                fontImport += `src: url('${source.url}') format('${source.format}');`;
                fontImport += "}";
            }

            let option = document.createElement('option');
            if (fontFamily == 'Arial') $(option).attr('selected');
            $(option).attr('value', fontFamily);
            $(option).html(fontFamily);
            $(option).attr('style', `font-family: "${fontFamily}";`);

            $("#fontFamily").append(option);
        }

        let style = document.createElement('style');
        $(style).html(fontImport);
        $(document.head).append(style);

        $('#settingsForm').find('input:not([type="submit"]):not([type="reset"]):not([type="radio"]), select').each(function() {
            let name = $(this).attr('name');
            let value = Cookies.get($(this).attr('name'));
            console.log(name, value);
            if (value) {
                $(this).val(value);
            }
        });

        $('#settingsForm').find('input[type=radio]').each(function() {
            let value = Cookies.get($(this).attr('name'));
            if (value) {
                $(this).prop('checked', value == $(this).val());
            }
        });

        updatePreview();
    });
});

function updatePreview() {
    let buildingColor = $("input[name='buildingColor']").val();
    let strokeColor = $("input[name='strokeColor']").val();
    let backgroundColor = $("input[name='backgroundColor']").val();
    let textColor = $("input[name='textColor']").val();
    let locationCircleColor = $("input[name='locationCircleColor']").val();
    let locationCircleSize = $("input[name='locationCircleSize']").val();
    let routeColor = $("input[name='routeColor']").val();
    let routeHighlightColor = $("input[name='routeHighlightColor']").val();
    let backgroundTextColor = $("input[name='backgroundTextColor']").val();
    let backgroundTextColorOpacity = parseInt(<any>$("input[name='backgroundTextColorOpacity']").val()) / 100;

    $('#previewSvg #building').css(<any>{
        'fill': buildingColor,
        'stroke': strokeColor
    });

    $('#previewSvg').css(<any>{
        'background-color': backgroundColor
    });

    $('#previewSvg #text').css(<any>{
        fill: textColor
    });

    $('#previewSvg #bgFilter feFlood').attr('flood-color', <any>backgroundTextColor);
    $('#previewSvg #bgFilter feFlood').attr('flood-opacity', <any>backgroundTextColorOpacity);

    $('#previewSvg #location, #previewSvg #accuracy').css(<any>{
        fill: locationCircleColor
    });

    $('#previewSvg #location').attr('r', <any>locationCircleSize);

    $('#previewSvg .routeCircle').css({
        'fill': <any>routeColor
    });
    
    $('#previewSvg .routeLine').css({
        'stroke': <any>routeColor
    });

    $('#previewSvg .routeHighlightCircle').css({
        'fill': <any>routeHighlightColor
    });

}