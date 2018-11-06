$(document).ready(function () {
    $('#settingsForm').find('input:not([type="submit"]):not([type="reset"]), select').each(function () {
        var name = $(this).attr('name');
        var value = Cookies.get($(this).attr('name'));
        console.log(name, value);
        if (value) {
            $(this).val(value);
        }
    });
    $('.colorpicker-group').colorpicker({
        format: 'hex'
    }).on('colorpickerCreate colorpickerChange', function (e) {
        updatePreview();
    });
    $('#settingsForm').on('submit', function (e) {
        e.preventDefault();
        $(this).find('input:not([type="submit"]):not([type="reset"]), select').each(function () {
            var name = $(this).attr('name');
            var value = $(this).val();
            console.log(name, value);
            Cookies.set(name, String(value), { expires: 365 });
        });
        $("#successRow").css({ display: 'block' });
        $("#successRow").html($("#successRow").html());
    });
    $('#settingsForm').on('reset', function (e) {
        $('.colorpicker-group').each(function () {
            $(this).colorpicker('setValue', $(this).find('input').attr('value'));
        });
    });
});
function updatePreview() {
    var buildingColor = $("input[name='buildingColor']").val();
    var strokeColor = $("input[name='strokeColor']").val();
    var backgroundColor = $("input[name='backgroundColor']").val();
    var textColor = $("input[name='textColor']").val();
    $('#previewSvg #building').css({
        'fill': buildingColor,
        'stroke': strokeColor
    });
    $('#previewSvg').css({
        'background-color': backgroundColor
    });
    $('#previewSvg #text').css({
        fill: textColor
    });
}
