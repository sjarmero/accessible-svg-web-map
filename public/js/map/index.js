import { SVGMap } from './SVG/SVGMap.js';
import {setupObservers} from './observers.js';
import {setupEvents} from './events.js';
import {textual} from './textual.js';

$(document).ready(function() {
    // DEBUG
    window.gsvg = SVGMap.instance.svg;

    // events.js
    setupEvents();

    // observers.js
    setupObservers();

    // textual.js
    textual();

    $('.accessibility-links').trigger('focus');
});