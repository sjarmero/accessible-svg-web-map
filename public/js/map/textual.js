import {SVGMap} from './SVG/SVGMap.js';

export function textual() {
    $('#modeSelect').val(0);

    $('#modeSelect').on('change', function(e) {
        let value = $('#modeSelect').val();
        
        if (value == 1) {
            // Textual
            $("#mapPanel").removeClass("col-lg-8");
            $("#mapPanel").addClass("col-lg-12");
        } else {
            // Visual
            $("#mapPanel").removeClass("col-lg-12");
            $("#mapPanel").addClass("col-lg-8");   
        }
        
        $(`.page-mode[data-mode!='${value}']`).css('display', 'none');
        $(`.page-mode[data-mode='${value}']`).css('display', 'block');

        loadTextualData();
    });

    $('#filterTextualForm').on('submit', function(e) {
        e.preventDefault();

        let query = $('#textualQueryTxt').val();
        console.log('query', `'${query}'`);

        if (query == '' || query === undefined) {
            $('#textualTable tbody tr').css('visibility', 'visible');
        } else {
            $('#textualTable tbody tr').each(function() {
                let r = new RegExp(`${query}`, 'i');
                if (!$(this).find('td:first-child').html().match(r)) {
                    $(this).css('visibility', 'collapse');
                } else {
                    $(this).css('visibility', 'visible');
                }
            });
        }
    });
}

function loadTextualData() {
    let trs = [];

    $(SVGMap.instance.container + '#SVG_MAIN_CONTENT .feature-object').each(function () {
        let tr = document.createElement('tr');

        var td = document.createElement('td');
        $(td).html(`${$(this).attr('data-name')}`);
        $(td).appendTo(tr);

        var td = document.createElement('td');
        $(td).html(`${$(this).attr('data-description')}`);
        $(td).appendTo(tr);

        var td = document.createElement('td');
        $(td).html('Cerca de ');

        let nearest = $(this).attr('data-nearest').split(',');

        if (nearest.length == 1) {
            $(td).html($(td).html() + nearest[0] + '.');
        } else {
            for (let i = 0; i < nearest.length; i++) {
                if (i + 1 == nearest.length) {
                    $(td).html($(td).html() + `y ${nearest[i]}.`);
                } else {
                    $(td).html($(td).html() + `${nearest[i]}${(i+1 == nearest.length - 1) ? '' : ','} `);
                }
            }
        }

        $(td).appendTo(tr);

        $(tr).attr('tabindex', 0);
        trs.push(tr);
    });

    trs = trs.sort((a, b) => {
        let na = $(a).find('td:first-child').html();
        let nb = $(b).find('td:first-child').html();
        if (na < nb) return -1;
        if (na > nb) return 1;
        return 0;
    });

    for (const tr of trs) {
        $(tr).appendTo('#textualTable tbody');
    }
}