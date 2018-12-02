$(document).ready(function() {
    $('.overflow-toggle').on('focus', function(e) {
        $(this).on('keyup', function(e) {
            if (e.which == 13) {
                $(this).trigger('click');
            }
        });
    });
    
    $('.overflow-toggle').on('click', function(e) {
        e.preventDefault();

        toggleOverflow(this, $(this).attr('data-toggle') === 'true', $(window).width() >= 992);
    });

    if ($(window).width() >= 992) {
        $(window).on('resize', function(e) {
            toggleOverflow($('.overflow-toggle').get(0), $(window).width() < 992);
        });
    }

    toggleOverflow($('.overflow-toggle').get(0), $(window).width() < 992);
});

function toggleOverflow(e, isDisplayed, reloadWidth = true) {
    if (isDisplayed) {
        $(e).attr('data-toggle', 'false');
        $(e).find('i').removeClass('fa-caret-left');
        $(e).find('i').addClass('fa-caret-right');

        $('.overflow-controls').animate({
            'left': `-${$('.overflow-controls-container').width()}px`
        });

        $('.overflow-toggle').attr('title', 'Mostrar panel');
        $('.overflow-toggle').attr('aria-label', 'Mostrar panel');

        if ($('#featureInfoPanelBody').length > 0) {            
            if ($(window).width() < 992) {
                $('#featureInfoPanelBody .card').fadeIn();
            }

            if (reloadWidth) {
                let width = ($('#featureInfoPanelBody').width()) + ($('.overflow-controls').find('#controlPanel').width());
                $('#featureInfoPanelBody').animate({
                    'width': `${width}px`
                });
            }
        }
    } else {
        $(e).attr('data-toggle', 'true');
        $(e).find('i').removeClass('fa-caret-right');
        $(e).find('i').addClass('fa-caret-left');

        $('.overflow-controls').animate({
            'left': '0px'
        });

        $('.overflow-toggle').attr('title', 'Ocultar panel');
        $('.overflow-toggle').attr('aria-label', 'Ocultar panel');

        if ($('#featureInfoPanelBody').length > 0) {
            if ($(window).width() < 992) {
                $('#featureInfoPanelBody .card').fadeOut();
            } else {
                $('#featureInfoPanelBody').animate({
                    'width': '100%'
                });
            }
        }
    }
}