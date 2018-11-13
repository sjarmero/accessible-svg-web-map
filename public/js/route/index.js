import { rotar } from './math.js';
import { SVGMap } from '../SVG/SVGMap.js';
import { navigationMode } from './navigation.js';
import { SVGLocation } from '../SVG/SVGLocation.js';
var searchIcon = 'fas fa-search';
var loadingIcon = 'fas fa-spinner rotating-spinner';
var okIcon = 'fas fa-check green';
var errIcon = 'fas fa-times red';
$(document).ready(function () {
    loadSettings();
    /*
        Events
    */
    var verified = [false, false];
    var source, target;
    var form;
    $("#routeSource, #routeTarget").on('keypress', function (e) {
        if (e.originalEvent.code == "Tab")
            return;
        $(this).parent().find('button').removeClass('btn-primary btn-success btn-danger');
        changeIcon($(this).parent(), searchIcon);
    });
    $(".routeBtn").on('click', function (e) {
        e.preventDefault();
        form = "#" + $(this).attr('data-search');
        changeIcon($(form), loadingIcon);
        $(form).find('button').removeClass('btn-primary btn-success btn-danger');
        $(form).find('button').addClass('btn-primary');
        if ($(form).find('input').val() == "") {
            changeIcon($(form), errIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-danger');
            return;
        }
        $.getJSON('/map/data/s/name/' + $(form).find('input').val(), function (data) {
            if (data.code == 200) {
                var results = data.results;
                if (results.length == 0) {
                    $(form).find('button').removeClass('btn-primary btn-success btn-danger');
                    $(form).find('button').addClass('btn-danger');
                    changeIcon($(form), errIcon);
                }
                else if (results.length == 1) {
                    $(form).find('input').val(results[0].name);
                    changeIcon($(form), okIcon);
                    $(form).find('button').removeClass('btn-primary btn-success btn-danger');
                    $(form).find('button').addClass('btn-success');
                    if (form == '#sourceForm') {
                        verified[0] = true;
                        source = results[0].id;
                    }
                    else {
                        verified[1] = true;
                        target = results[0].id;
                    }
                }
                else {
                    var point = (form == '#sourceForm') ? 'Punto de origen' : 'Punto de destino';
                    $('#searchModal .modal-body').empty();
                    $('#modalTitle').html(point);
                    for (var _i = 0, results_1 = results; _i < results_1.length; _i++) {
                        var result = results_1[_i];
                        console.log(result);
                        var div = document.createElement("div");
                        var input = document.createElement("input");
                        $(input).attr("type", "radio");
                        $(input).attr("data-feature", result.name);
                        $(input).attr("aria-label", "Elegir " + result.name + " como " + point);
                        $(input).attr("name", "featureSelection");
                        $(input).attr("id", "feature-" + result.id);
                        $(input).attr("value", result.name);
                        $(input).attr('tabindex', 0);
                        var label = document.createElement('label');
                        $(label).attr('for', "feature-" + result.id);
                        $(label).html(result.name);
                        $(div).attr('class', 'check-group');
                        $(div).append(input);
                        $(div).append(label);
                        console.log(div);
                        $("#searchModal .modal-body").append(div);
                    }
                    $('#searchModal').modal('show');
                }
            }
        });
    });
    $('#searchModal').on('shown.bs.modal', function (e) {
        $('#searchModal input[name="featureSelection"]:first').trigger('focus');
    });
    $('#searchModal').on('hide.bs.modal', function (e) {
        var chosen = $('#searchModal input[name="featureSelection"]:checked').val();
        if (typeof chosen == 'undefined') {
            changeIcon($(form), errIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-danger');
        }
        else {
            var id = $('#searchModal input[name="featureSelection"]:checked').attr('id').split('feature-')[1];
            $(form).find('input').val(chosen);
            changeIcon($(form), okIcon);
            $(form).find('button').removeClass('btn-primary btn-success btn-danger');
            $(form).find('button').addClass('btn-success');
            if (form == '#sourceForm') {
                verified[0] = true;
                source = id;
            }
            else {
                verified[1] = true;
                target = id;
            }
        }
    });
    $("#calculateBtn").on('click', function (e) {
        e.preventDefault();
        var acc = true;
        for (var _i = 0, verified_1 = verified; _i < verified_1.length; _i++) {
            var v = verified_1[_i];
            acc = acc && v;
        }
        console.log(acc, source, target);
        if (acc) {
            $.getJSON("/map/data/pi/" + source + "," + target + "," + $("#impairmentSelect").val(), function (path) {
                console.log('path', path);
                navigationMode(path.data);
                if ($("#impairmentSelect").val() != 0 && path.disability == 0) {
                    $("#nonAccessibleWarning").css("display", "block");
                    $("#nonAccessibleWarning").html($("#nonAccessibleWarning").html());
                }
                else {
                    $("#nonAccessibleWarning").css("display", "none");
                }
            });
        }
    });
    $('.focus-location button').on('click', function (e) {
        e.preventDefault();
        var locationService = new SVGLocation();
        locationService.getCurrentPosition(function (lat, long) {
            var _a = proj4('EPSG:4326', 'EPSG:25830', [long, lat]), x = _a[0], y = _a[1];
            SVGMap.instance.moveTo(x, -y);
        });
    });
    $('.focus-orientation button').on('click', function (e) {
        e.preventDefault();
        $('.route-orientation:first-child').trigger('focus');
    });
    /*
        Observers
    */
    var accum = 4;
    var observer = new MutationObserver(function (list) {
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var mutation = list_1[_i];
            if (mutation.type === 'attributes') {
                var element = mutation.target;
                if ($(element).attr('id') === 'orientationg') {
                    if (accum != 4) {
                        accum++;
                        return;
                    }
                    accum = 0;
                    var orientation_1 = $(element).attr('data-orientation');
                    var x = parseFloat($(element).attr('data-x'));
                    var y = parseFloat($(element).attr('data-y'));
                    var votes = {};
                    for (var i = -1; i < 3; i++) {
                        var result = lookingAt(x, y, orientation_1 + (i * 10));
                        if (result != null) {
                            if (votes[result] == undefined) {
                                votes[result] = 1;
                            }
                            else {
                                votes[result] = votes[result] + 1;
                            }
                        }
                    }
                    var winner = null, maxVotes = 0;
                    for (var _a = 0, _b = Object.keys(votes); _a < _b.length; _a++) {
                        var participant = _b[_a];
                        if (votes[participant] > maxVotes) {
                            maxVotes = votes[participant];
                            winner = participant;
                        }
                    }
                    var foundf = winner;
                    $('.route-steps .route-orientation').remove();
                    if (foundf != null && foundf != undefined) {
                        var stepDiv = document.createElement('div');
                        var stepSpan = document.createElement('span');
                        var order = "<span class='sr-only'>Informaci\u00F3n sobre tu orientaci\u00F3n.</span>\n                            Est\u00E1s mirando hacia " + $("#" + foundf).attr('data-name') + ".\n                        ";
                        $(stepSpan).html(order);
                        $(stepDiv).append(stepSpan);
                        $(stepDiv).addClass('route-step route-orientation');
                        $(stepDiv).attr('role', 'listitem');
                        $(stepDiv).attr('tabindex', '0');
                        $(stepDiv).attr('data-step', -1);
                        $(".route-steps").prepend(stepDiv);
                    }
                }
            }
        }
    });
    observer.observe($(SVGMap.instance.container).get(0), { attributes: true, childList: false, subtree: true });
});
function changeIcon(container, newClass) {
    container.find('button i').attr("class", newClass);
}
function lookingAt(x, y, orientation) {
    // Rotamos el punto final de la linea
    var _a = rotar(x, y - 150, x, y, orientation), rx = _a[0], ry = _a[1];
    var m = (ry - y) / (rx - x);
    var eq = function (v) { return (m * v) - (m * x) + y; };
    // Encontramos el edificio de referencia
    for (var eqx = x; eqx <= (x + 150); eqx++) {
        var eqy = eq(eqx);
        var foundf = null;
        for (var _i = 0, _b = SVGMap.instance.svg.select('.feature-object').members; _i < _b.length; _i++) {
            var feature = _b[_i];
            if (feature.inside(eqx, eqy)) {
                foundf = feature;
                break;
            }
        }
        if (foundf != null) {
            return foundf;
        }
    }
    return null;
}
