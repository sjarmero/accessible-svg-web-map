import { SVGControls } from "../SVG/SVGControls.js";
import { SVGMap } from "../SVG/SVGMap.js";

export function search(query, viaspeech = false) {
    $.getJSON('/map/data/s/name/' + query, (data) => {
        let results = data.results;
        console.log(results);
        
        $("#dataPanel").css("display", "none");
        $("#resultsPanel").css("display", "block");
        
        $("#resultsPanel table").empty();
        
        let i = 1;
        
        if (viaspeech) SVGControls.instance.voiceControl.say(`Estos son los resultados para la búsqueda ${query}`);
        for (const result of results) {
            var row = document.createElement("tr");
            
            var headerCol = document.createElement("th");
            var valueCol = document.createElement("td");
            var visitBtn = document.createElement("button");
            $(visitBtn).addClass("btn btn-success result-view").html("Ir").attr("aria-label", `Ver en el mapa ${result.name}.`);
            $(visitBtn).attr("data-centerx", result.centerx).attr("data-centery", result.centery);
            $(visitBtn).attr('data-result-id', i);
            $(visitBtn).attr('data-feature-id', result.id);
            
            $(valueCol).append(visitBtn);
            
            $(headerCol).html(result.name);
            
            $(row).append(headerCol);
            $(row).append(valueCol);
            
            $("#resultsPanel table").append(row);
            
            if (viaspeech) SVGControls.instance.voiceControl.say(`Resultado número ${i}: ${result.name}`);
            
            i++;
        }
        
        if (viaspeech) {
            SVGControls.instance.onSearchResultSelected = (selection) => {
                let centerx = $(".result-view[data-result-id='"+ selection +"']").attr('data-centerx');
                let centery = $(".result-view[data-result-id='"+ selection +"']").attr('data-centery');
                let id = $(".result-view[data-result-id='"+ selection +"']").attr('data-feature-id');

                focusBuilding(id, centerx, centery, SVGControls.instance.voiceControl);
            };

            SVGControls.instance.voiceControl.say("Di 'seleccionar número' seguido del número del resultado a seleccionar.");
        }

        $("#data-status").html("Búsqueda de '"+ query +"'");

        if (!viaspeech) $("#resultsPanel").trigger('focus');

        $("button.result-view").on('click', function(e) {
            e.preventDefault();
            let centerx = $(this).attr('data-centerx');
            let centery = $(this).attr('data-centery');
            let id = $(this).attr('data-feature-id');

            focusBuilding(id, centerx, centery);
        });
    });
}

export function focusBuilding(id, centerx, centery, speech?) {
    if (centerx != undefined && centery != undefined) {
        SVGMap.instance.zoomAndMove(centerx, centery, 7);

        showBuildingInfo(id);
    } else if (typeof speech != 'undefined') {
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