import { capitalStates } from '../utils/states.js';
import { capitalCoordinates } from '../utils/coordinates.js';
import { getGmapsSearchQuery } from '../utils/states.js';
import { showToast } from '../ui/toast.js';

export function initRouteService(form, graph, routeMap, uiElements) {
  const { leftDrawer, bottomDrawer, resultsPane, resTotalCost, resDistance, routeSteps, fuelInput } = uiElements;
  const originInput = document.getElementById('origin');
  const destinationInput = document.getElementById('destination');
  const waypointInput = document.getElementById('waypoint');
  const autonomyInput = document.getElementById('autonomy');
  let hasCalculatedRoute = false;
  let autoCalculateTimeout;

  function clearCurrentRouteView() {
    resTotalCost.textContent = 'R$ 0,00';
    resDistance.textContent = '0 km';
    routeSteps.innerHTML = '';
    document.getElementById('gps-actions')?.classList.add('hidden');
    bottomDrawer.classList.add('hidden');
    routeMap.clearRoute();
  }

  async function calculateRoute({
    showValidation = true,
    closeDrawerOnMobile = true,
    enterFullscreen = true,
    closeLeftDrawer = true,
    openResultsDrawer = true
  } = {}) {
    const origin = originInput.value.trim();
    const destination = destinationInput.value.trim();
    const waypoint = waypointInput.value.trim();
    
    const rawFuelValue = fuelInput.value.replace(/\D/g, '');
    const fuelPrice = parseFloat(rawFuelValue) / 100;
    const autonomyRaw = autonomyInput.value;
    const autonomy = parseFloat(autonomyRaw);

    if (!origin) {
      if (showValidation) showToast('Por favor, informe a Capital de Origem.', 'warning');
      clearCurrentRouteView();
      return false;
    }
    if (!destination) {
      if (showValidation) showToast('Por favor, informe a Capital de Destino.', 'warning');
      clearCurrentRouteView();
      return false;
    }
    if (!rawFuelValue || isNaN(fuelPrice) || fuelPrice <= 0) {
      if (showValidation) showToast('Por favor, informe um Preço de Combustível válido.', 'warning');
      clearCurrentRouteView();
      return false;
    }
    if (!autonomyRaw || isNaN(autonomy) || autonomy <= 0) {
      if (showValidation) showToast('Por favor, informe uma Autonomia válida.', 'warning');
      clearCurrentRouteView();
      return false;
    }

    const selectedStops = [
      { label: 'origem', value: origin },
      { label: 'parada', value: waypoint },
      { label: 'destino', value: destination }
    ].filter(stop => stop.value);

    const duplicateStop = selectedStops.find((stop, index) => {
      return selectedStops.findIndex(other => other.value === stop.value) !== index;
    });

    if (duplicateStop) {
      if (showValidation) {
        showToast(`A capital "${duplicateStop.value}" não pode ser usada em mais de um campo.`, 'warning');
      }
      clearCurrentRouteView();
      return false;
    }

    if (closeDrawerOnMobile && window.innerWidth <= 768) {
      leftDrawer.classList.remove('open');
      leftDrawer.classList.add('closed');
    }

    if (!graph.vertices.has(origin)) {
      if (showValidation) showToast(`Capital de origem "${origin}" não encontrada.`, 'warning');
      clearCurrentRouteView();
      return false;
    }
    if (!graph.vertices.has(destination)) {
      if (showValidation) showToast(`Capital de destino "${destination}" não encontrada.`, 'warning');
      clearCurrentRouteView();
      return false;
    }
    if (waypoint && !graph.vertices.has(waypoint)) {
      if (showValidation) showToast(`Capital de parada "${waypoint}" não encontrada.`, 'warning');
      clearCurrentRouteView();
      return false;
    }

    let finalResult = null;

    if (waypoint) {
      const part1 = graph.dijkstra(origin, waypoint, fuelPrice, autonomy);
      if (!part1.success) {
        if (showValidation) showToast(`Rota inexistente entre ${origin} e ${waypoint}.`);
        clearCurrentRouteView();
        return false;
      }
      
      const part2 = graph.dijkstra(waypoint, destination, fuelPrice, autonomy);
      if (!part2.success) {
        if (showValidation) showToast(`Rota inexistente entre ${waypoint} e ${destination}.`);
        clearCurrentRouteView();
        return false;
      }

      const mergedPath = [...part1.path, ...part2.path.slice(1)];
      const mergedPathDetails = [...part1.pathDetails, ...part2.pathDetails];
      
      finalResult = {
        success: true,
        cost: part1.cost + part2.cost,
        totalDistance: part1.totalDistance + part2.totalDistance,
        path: mergedPath,
        pathDetails: mergedPathDetails
      };
    } else {
      finalResult = graph.dijkstra(origin, destination, fuelPrice, autonomy);
    }

    if (!finalResult.success) {
      if (showValidation) showToast(finalResult.error || 'Rota inexistente.');
      clearCurrentRouteView();
      return false;
    }

    if (enterFullscreen) {
      document.body.classList.add('fullscreen-mode');
    }

    if (closeLeftDrawer) {
      leftDrawer.classList.replace('open', 'closed');
    }
    
    setTimeout(() => {
      if (routeMap && routeMap.map) {
        routeMap.map.invalidateSize(true);
      }
    }, 450);

    resTotalCost.textContent = `R$ ${finalResult.cost.toFixed(2).replace('.', ',')}`;
    resDistance.textContent = `${finalResult.totalDistance} km`;

    routeSteps.innerHTML = '';
    
    if (finalResult.pathDetails.length === 0) {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.innerHTML = `
        <div class="timeline-node">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="city-dropdown" tabindex="0">
              <span class="route-step-node">${origin}</span>
              <div class="city-dropdown-menu">
                <div onclick="window.setRouteCity('waypoint', '${origin}')"><i class="fa-solid fa-map-pin"></i> Definir Parada</div>
                <div onclick="window.setRouteCity('destination', '${origin}')"><i class="fa-solid fa-flag-checkered"></i> Definir Destino</div>
              </div>
            </div>
            <span class="route-step-cost">Você já está no destino!</span>
          </div>
        </div>`;
      routeSteps.appendChild(li);
    } else {
      const firstLi = document.createElement('li');
      firstLi.className = 'timeline-item';
      firstLi.innerHTML = `
        <div class="timeline-node">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="city-dropdown" tabindex="0">
              <span class="route-step-node">${origin}</span>
              <div class="city-dropdown-menu">
                <div onclick="window.setRouteCity('waypoint', '${origin}')"><i class="fa-solid fa-map-pin"></i> Definir Parada</div>
                <div onclick="window.setRouteCity('destination', '${origin}')"><i class="fa-solid fa-flag-checkered"></i> Definir Destino</div>
              </div>
            </div>
            <span class="route-step-cost">Partida</span>
          </div>
        </div>`;
      routeSteps.appendChild(firstLi);

      let accumulatedCost = 0;

      finalResult.pathDetails.forEach(step => {
        const previousLi = routeSteps.lastElementChild;
        const edgeDiv = document.createElement('div');
        edgeDiv.className = 'timeline-edge';
        edgeDiv.innerHTML = `
          <span class="edge-distance">${step.distance}km</span>
          <span class="edge-details">Combustível: R$ ${step.fuelCost.toFixed(2).replace('.', ',')} <span class="divider">|</span> Pedágio: R$ ${step.tollCost.toFixed(2).replace('.', ',')}</span>
        `;
        previousLi.appendChild(edgeDiv);

        accumulatedCost += step.stepCost;

        const li = document.createElement('li');
        li.className = 'timeline-item';
        
        const isWaypoint = waypoint && step.to === waypoint;
        const nodeExtraClass = isWaypoint ? 'style="border: 2px solid var(--primary);"' : '';
        
        li.innerHTML = `
          <div class="timeline-node">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="city-dropdown" tabindex="0">
                <span class="route-step-node" ${nodeExtraClass}>${step.to} ${isWaypoint ? '(Parada)' : ''}</span>
                <div class="city-dropdown-menu">
                  <div onclick="window.setRouteCity('origin', '${step.to}')"><i class="fa-solid fa-location-dot"></i> Definir Origem</div>
                  <div onclick="window.setRouteCity('waypoint', '${step.to}')"><i class="fa-solid fa-map-pin"></i> Definir Parada</div>
                  <div onclick="window.setRouteCity('destination', '${step.to}')"><i class="fa-solid fa-flag-checkered"></i> Definir Destino</div>
                </div>
              </div>
              <span class="route-step-cost">Custo do trecho: R$ ${step.stepCost.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>`;
        routeSteps.appendChild(li);
      });
    }

    document.getElementById('gps-actions').classList.remove('hidden');
    
    const btnGmaps = document.getElementById('btn-gmaps');
    const btnWaze = document.getElementById('btn-waze');
    
    const originQuery = getGmapsSearchQuery(origin);
    const destinationQuery = getGmapsSearchQuery(destination);
    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originQuery)}&destination=${encodeURIComponent(destinationQuery)}`;
    if (waypoint) {
      const waypointQuery = getGmapsSearchQuery(waypoint);
      gmapsUrl += `&waypoints=${encodeURIComponent(waypointQuery)}`;
    }
    btnGmaps.href = gmapsUrl;

    const origCoords = capitalCoordinates[origin];
    const destCoords = capitalCoordinates[destination];
    const wazeUrl = `https://www.waze.com/live-map/directions?from=ll.${origCoords[0]},${origCoords[1]}&to=ll.${destCoords[0]},${destCoords[1]}`;
    btnWaze.href = wazeUrl;
    
    routeMap.showLoading();
    await routeMap.drawRoute(finalResult.path, origin, destination, waypoint);
    routeMap.hideLoading();

    bottomDrawer.classList.remove('hidden');

    if (openResultsDrawer) {
      if (!bottomDrawer.classList.contains('closed')) {
        bottomDrawer.classList.add('closed');
      }
      
      void bottomDrawer.offsetWidth;
      
      bottomDrawer.classList.replace('closed', 'open');
    }

    hasCalculatedRoute = true;
    return true;
  }

  function scheduleAutoCalculate({
    delay = 250,
    enterFullscreen = false,
    closeLeftDrawer = false,
    openResultsDrawer = false
  } = {}) {
    if (!hasCalculatedRoute) return;

    clearTimeout(autoCalculateTimeout);
    autoCalculateTimeout = setTimeout(() => {
      void calculateRoute({
        showValidation: false,
        closeDrawerOnMobile: false,
        enterFullscreen,
        closeLeftDrawer,
        openResultsDrawer
      });
    }, delay);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await calculateRoute();
  });

  window.recalculateRoute = scheduleAutoCalculate;
}
