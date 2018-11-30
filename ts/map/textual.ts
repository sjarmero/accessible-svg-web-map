import {SVGMap} from '../SVG/SVGMap.js';

declare var Cookies;

$(document).ready(function() {
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
});

function loadTextualData() {
    let radio = Cookies.get('locationRadio') || 100;
    $('.locationRadioTxt').html(radio);

    $('#radioControl button').on('click', function(e) {
        e.preventDefault();
        console.log($(this).attr('data-radio'))

        let sense = $(this).attr('data-radio');
        if (sense === '+' && radio + 20 <= 1000) {
            radio += 20;
            $('.locationRadioTxt').html(radio);
        } else if (sense === '-' && radio - 20 >= 20) {
            radio -= 20;
            $('.locationRadioTxt').html(radio);
        }
    });

    let trs = [];

    $(SVGMap.instance.container + '#SVG_MAIN_CONTENT .feature-object').each(function () {
        let tr = document.createElement('tr');

        var td = document.createElement('td');
        $(td).html(`${$(this).attr('data-name')}`);
        $(td).appendTo(tr);

        var td = document.createElement('td');
        $(td).html(`${$(this).attr('data-description')}`);
        $(td).appendTo(tr);

        let nearestAttr = $(this).attr('data-nearest');

        var td = document.createElement('td');

        $(td).html($(td).html() + `
            <div class='specific-radio-controls mt-3'>
                <span class='badge badge-secondary' tabindex='0'>A <span class='specific-radio'><span class='sr-only'>Radio de búsqueda </span>${$(this).attr('data-nearest-radius')}</span> metros</span>
                <div class='btn-group' role='group' aria-label='Controles de radio de búsqueda alrededor de ${$(this).attr('data-name')}'>
                    <button type='button' class='btn btn-link' data-radio='+'>Aumentar radio</button>
                    <button type='button' class='btn btn-link' data-radio='-'>Reducir radio</button>
                </div>
            </div>
        `);
        

        let newnames = '<div class="names" tabindex=0>Cerca de ';
        if (typeof nearestAttr !== 'undefined' && nearestAttr !== '') { 
            let nearest = nearestAttr.split(',');

            if (nearest.length == 1) {
                newnames += nearest[0] + '.';
            } else {
                for (let i = 0; i < nearest.length; i++) {
                    if (i + 1 == nearest.length) {
                        newnames += `, y ${nearest[i]}.`;
                    } else {
                        newnames += ` ${nearest[i]}${(i+1 == nearest.length - 1) ? '' : ','}`;
                    }
                }
            }

            newnames += '</div>';
        } else {
            newnames = 'Sin información sobre sitios cercanos.';   
        }

        $(td).html(newnames);

        $(td).appendTo(tr);

        $(tr).attr('tabindex', 0);
        $(tr).attr('data-feature-id', $(this).attr('data-building'));
        $(tr).attr('data-radius', $(this).attr('data-nearest-radius'));

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

    $('.specific-radio-controls button').on('click', function(e) {
        e.preventDefault();
        let p = $(this).parents('tr');

        let sense = $(this).attr('data-radio');
        let radius = parseFloat($(p).attr('data-radius'));

        console.log(sense, radius);
        if (sense == '+') {
            radius += 20;
        } else {
            radius = (radius - 20 >= 1) ? radius - 20 : radius;
        }

        $(p).find('.specific-radio').html(String(radius));
        $(p).attr('data-radius', radius);

        $.getJSON(`/map/data/nn4f/${$(p).attr('data-feature-id')},${radius}`, function(data) {
            let nearest = data[0].iname;
            console.log(data);
            let newnames = 'Cerca de ';

            if (nearest.length == 0) {
                newnames = 'No hay información de lugares cercanos.';
            } else if (nearest.length == 1) {
                newnames += nearest[0];
            } else {
                for (let i = 0; i < nearest.length; i++) {
                    if (i + 1 == nearest.length) {
                        newnames += `, y ${nearest[i]}.`;
                    } else {
                        newnames += ` ${nearest[i]}${(i+1 == nearest.length - 1) ? '' : ','}`;
                    }
                }
            }

            $(p).find('td:last-child .names').html(newnames);
        });
    })
};