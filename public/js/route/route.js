import { setupEvents } from '/js/map/events.js';
import { setupRouteEvents } from './events.js';

$(document).ready(function() {
    setupEvents();
    setupRouteEvents();
});