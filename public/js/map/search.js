import {focusBuilding} from './features.js';

export function search(query, viaspeech = false) {
    $.getJSON('/map/data/s/name/' + query, (data) => {
        let results = data.results;
        console.log(results);
        
        $("#dataPanel").css("display", "none");
        $("#resultsPanel").css("display", "block");
        
        $("#resultsPanel table").empty();
        
        let i = 1;
        let str = "Estos son los resultados para la búsqueda " + query;
        for (const result of results) {
            var row = document.createElement("tr");
            
            var headerCol = document.createElement("th");
            var valueCol = document.createElement("td");
            var visitBtn = document.createElement("button");
            $(visitBtn).addClass("btn btn-success result-view").html("Ir").attr("aria-label", "Ver " + result.name + " en el mapa");
            $(visitBtn).attr("data-centerx", result.centerx).attr("data-centery", result.centery);
            $(visitBtn).attr('data-result-id', i);
            $(visitBtn).attr('data-feature-id', result.id);
            
            $(valueCol).append(visitBtn);
            
            $(headerCol).html(result.name);
            
            $(row).append(headerCol);
            $(row).append(valueCol);
            
            $("#resultsPanel table").append(row);
            
            if (viaspeech) {
                str += "\n Resultado número " + i + ": " + result.name;
            }
            
            i++;
        }
        
        if (viaspeech) {
            str += "\n Selecciona un resultado para verlo en el mapa.";
            controls.onSearchResultSelected = (selection) => {
                let centerx = $(".result-view[data-result-id='"+ selection +"']").attr('data-centerx');
                let centery = $(".result-view[data-result-id='"+ selection +"']").attr('data-centery');
                let id = $(".result-view[data-result-id='"+ selection +"']").attr('data-feature-id');

                focusBuilding(id, centerx, centery, controls.voiceControl);
            };

            controls.voiceControl.say(str);
        }

        $("#data-status").html("Búsqueda de '"+ query +"'");

        $("button.result-view").on('click', function(e) {
            e.preventDefault();
            let centerx = $(this).attr('data-centerx');
            let centery = $(this).attr('data-centery');
            let id = $(this).attr('data-feature-id');

            focusBuilding(id, centerx, centery);
        });
    });
}