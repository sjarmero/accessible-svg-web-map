import {SVGMap} from './SVG/SVGMap.js';

export function textual() {
    $('#modeSelect').val(0);

    $('#modeSelect').on('change', function(e) {
        let value = $('#modeSelect').val();
        console.log(value);
        
        $(".page-mode").not(`*[data-mode='${value}']`).css('display', 'none');
        $(`.page-mode[data-mode='${value}']`).css('display', 'block');

        loadTextualData();
    });
}

function loadTextualData() {
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

        $(tr).appendTo('#textualTable tbody');
    });
}