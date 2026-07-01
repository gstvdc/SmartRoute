import { Graph } from './utils/graph.js';
import { RouteMap } from './components/map.js';
import capitaisData from './data/capitais.json' with { type: 'json' };

import { initDrawers } from './ui/drawers.js';
import { initFuelInput } from './ui/fuel-input.js';
import { initAutocomplete } from './components/autocomplete.js';
import { initTimelineScroll } from './components/timeline-scroll.js';
import { initRouteService } from './services/route.service.js';

let graph = new Graph();
let routeMap;

document.addEventListener('DOMContentLoaded', () => {
  graph.seed(capitaisData);
  routeMap = new RouteMap('map');

  const originInput = document.getElementById('origin');
  const waypointInput = document.getElementById('waypoint');
  const destinationInput = document.getElementById('destination');
  const routeCityInputs = [originInput, waypointInput, destinationInput];

  function enforceUniqueCapitalSelection(changedInput) {
    const selectedCity = changedInput.value.trim();
    if (!selectedCity) return;

    routeCityInputs.forEach(input => {
      if (input !== changedInput && input.value.trim() === selectedCity) {
        input.value = '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  const capitalsList = graph.getCapitalsList();
  initAutocomplete(originInput, capitalsList);
  initAutocomplete(waypointInput, capitalsList);
  initAutocomplete(destinationInput, capitalsList);

  const leftDrawer = document.getElementById('left-drawer');
  const bottomDrawer = document.getElementById('bottom-drawer');
  const notchLeft = document.getElementById('notch-left');
  const notchBottom = document.getElementById('notch-bottom');
  const fuelInput = document.getElementById('fuel-price');

  routeCityInputs.forEach(input => {
    input.addEventListener('change', () => enforceUniqueCapitalSelection(input));
  });
  
  initDrawers(leftDrawer, bottomDrawer, notchLeft, notchBottom);
  initFuelInput(fuelInput);

  const form = document.getElementById('route-form');
  const uiElements = {
    leftDrawer,
    bottomDrawer,
    resultsPane: document.getElementById('results-pane'),
    resTotalCost: document.getElementById('res-total-cost'),
    resDistance: document.getElementById('res-distance'),
    routeSteps: document.getElementById('route-steps'),
    fuelInput
  };
  initRouteService(form, graph, routeMap, uiElements);

  window.setRouteCity = function(inputId, city) {
    const input = document.getElementById(inputId);
    input.value = city;
    enforceUniqueCapitalSelection(input);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    window.recalculateRoute?.({ delay: 0 });
  };

  window.clearWaypoint = function() {
    const input = document.getElementById('waypoint');
    input.value = '';
    input.parentNode.querySelector('.clear-input')?.classList.remove('visible');
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
});

document.addEventListener('DOMContentLoaded', () => {
  initTimelineScroll(document.getElementById('route-steps'));
});
