import { SVGMap } from './SVG/SVGMap.js';

export function focusBuilding(id, centerx, centery, speech) {
    if (centerx != undefined && centery != undefined) {
        SVGMap.instance.zoomAndMove(centerx, centery, 7);

        showBuildingInfo(id);
    } else if (speech != undefined) {
        speech.say("No se ha podido seleccionar ese resultado.");
    }
}

export function showBuildingInfo(id) {
    $.get('/map/data/b/' + id, properties => {
        $("#dataPanel").css("display", "block");
        $("#resultsPanel").css("display", "none");

        $("#dataPanel table").empty();

        for (var property in properties) {
            if (properties[property]['userinterest']) {
                var row = document.createElement("tr");
                
                var headerCol = document.createElement("th");
                var valueCol = document.createElement("td");
                $(headerCol).html(properties[property]['display']);
                $(valueCol).html(properties[property]['value']);

                $(row).append(headerCol);
                $(row).append(valueCol);

                $("#dataPanel table").prepend(row);
            }
        }
    });
}