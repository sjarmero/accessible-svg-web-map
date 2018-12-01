$(document).ready(function() {
    $('#settingsForm').find('input:not([type="submit"]):not([type="reset"]), select').each(function() {
        let name = $(this).attr('name');
        let value = Cookies.get($(this).attr('name'));
        console.log(name, value);
        if (value) {
            $(this).val(value);
        }
    });

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

        $(this).find('input:not([type="submit"]):not([type="reset"]), select').each(function() {
            let name = $(this).attr('name');
            let value = $(this).val();

            console.log(name, value);
            Cookies.set(name, String(value), { expires: 365 });
        });

        $("#successRow").css({ display: 'block' });
        $("#successRow").html($("#successRow").html());
    });

    $('#settingsForm').on('reset', function(e) {
        $('.colorpicker-group').each(function() {
            (<any>$(this)).colorpicker('setValue', $(this).find('input').attr('value'));
        });
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

    $('#previewSvg #location').css(<any>{
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
    })
}