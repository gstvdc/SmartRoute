import { Graph } from './utils/graph.js';
import { RouteMap } from './components/map.js';
import { capitalCoordinates } from './utils/coordinates.js';
import capitaisData from './data/capitais.json';

const graph = new Graph();
let routeMap;

document.addEventListener('DOMContentLoaded', () => {
  graph.seed(capitaisData);
  routeMap = new RouteMap('map');

  const datalist = document.getElementById('capitals-list');
  const capitals = graph.getCapitalsList().sort();
  
  capitals.forEach(capital => {
    const option = document.createElement('option');
    option.value = capital;
    datalist.appendChild(option);
  });

  const cityInputs = [
    document.getElementById('origin'),
    document.getElementById('waypoint'),
    document.getElementById('destination')
  ];

  cityInputs.forEach(input => {
    input.dataset.originalPlaceholder = input.placeholder;

    input.addEventListener('focus', function() {
      if (this.value) {
        this.dataset.previousValue = this.value;
        this.placeholder = this.value;
        this.value = '';
      }
    });

    input.addEventListener('blur', function() {
      if (this.value.trim() === '' && this.dataset.previousValue) {
        this.value = this.dataset.previousValue;
      }
      this.placeholder = this.dataset.originalPlaceholder;
      this.dataset.previousValue = '';
    });
  });

  const leftDrawer = document.getElementById('left-drawer');
  const bottomDrawer = document.getElementById('bottom-drawer');
  const notchLeft = document.getElementById('notch-left');
  const notchBottom = document.getElementById('notch-bottom');

  const toggleDrawer = (drawer) => {
    if (drawer.classList.contains('open')) {
      drawer.classList.replace('open', 'closed');
    } else {
      drawer.classList.replace('closed', 'open');
    }
  };

  notchLeft.addEventListener('click', () => toggleDrawer(leftDrawer));
  notchBottom.addEventListener('click', () => toggleDrawer(bottomDrawer));

  const form = document.getElementById('route-form');
  const resultsPane = document.getElementById('results-pane');
  const resTotalCost = document.getElementById('res-total-cost');
  const resDistance = document.getElementById('res-distance');
  const routeSteps = document.getElementById('route-steps');
  
  const fuelInput = document.getElementById('fuel-price');

  fuelInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value === '') {
      e.target.value = '';
      return;
    }
    value = Number(value).toString();
    value = value.padStart(3, '0');
    const formatted = value.slice(0, -2) + ',' + value.slice(-2);
    e.target.value = formatted;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const waypoint = document.getElementById('waypoint').value.trim();
    
    const rawFuelValue = fuelInput.value.replace(/\D/g, '');
    const fuelPrice = parseFloat(rawFuelValue) / 100;
    const autonomy = parseFloat(document.getElementById('autonomy').value);

    if (window.innerWidth <= 768) {
      leftDrawer.classList.remove('open');
      leftDrawer.classList.add('closed');
    }

    // Validations
    if (!graph.vertices.has(origin)) {
      alert(`Capital de origem "${origin}" não encontrada.`);
      return;
    }
    if (!graph.vertices.has(destination)) {
      alert(`Capital de destino "${destination}" não encontrada.`);
      return;
    }
    if (waypoint && !graph.vertices.has(waypoint)) {
      alert(`Capital de parada "${waypoint}" não encontrada.`);
      return;
    }

    let finalResult = null;

    if (waypoint) {
      const part1 = graph.dijkstra(origin, waypoint, fuelPrice, autonomy);
      if (!part1.success) {
        alert(`Rota inexistente entre ${origin} e ${waypoint}.`);
        resultsPane.classList.add('hidden');
        return;
      }
      
      const part2 = graph.dijkstra(waypoint, destination, fuelPrice, autonomy);
      if (!part2.success) {
        alert(`Rota inexistente entre ${waypoint} e ${destination}.`);
        resultsPane.classList.add('hidden');
        return;
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
      alert(finalResult.error || 'Rota inexistente.');
      resultsPane.classList.add('hidden');
      return;
    }

    // Display Results
    resTotalCost.textContent = `R$ ${finalResult.cost.toFixed(2).replace('.', ',')}`;
    resDistance.textContent = `${finalResult.totalDistance} km`;

    // Render Steps
    routeSteps.innerHTML = '';
    
    if (finalResult.pathDetails.length === 0) {
      const li = document.createElement('li');
      li.className = 'timeline-item';
      li.innerHTML = `
        <div class="timeline-node">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="route-step-node">${origin}</span>
            <span class="route-step-cost">Você já está no destino!</span>
          </div>
        </div>`;
      routeSteps.appendChild(li);
    } else {
      // First node
      const firstLi = document.createElement('li');
      firstLi.className = 'timeline-item';
      firstLi.innerHTML = `
        <div class="timeline-node">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="route-step-node">${origin}</span>
            <span class="route-step-cost">Partida</span>
          </div>
        </div>`;
      routeSteps.appendChild(firstLi);

      let accumulatedCost = 0;

      finalResult.pathDetails.forEach(step => {
        // Edge connected to the previous node
        const previousLi = routeSteps.lastElementChild;
        const edgeDiv = document.createElement('div');
        edgeDiv.className = 'timeline-edge';
        edgeDiv.innerHTML = `
          <span class="edge-distance">${step.distance}km</span>
          <span class="edge-details">Combustível: R$ ${step.fuelCost.toFixed(2).replace('.', ',')} <span class="divider">|</span> Pedágio: R$ ${step.tollCost.toFixed(2).replace('.', ',')}</span>
        `;
        previousLi.appendChild(edgeDiv);

        accumulatedCost += step.stepCost;

        // Next node
        const li = document.createElement('li');
        li.className = 'timeline-item';
        
        // Emphasize the waypoint visually if it's the current node
        const isWaypoint = waypoint && step.to === waypoint;
        const nodeExtraClass = isWaypoint ? 'style="border: 2px solid var(--primary);"' : '';
        
        li.innerHTML = `
          <div class="timeline-node">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <span class="route-step-node" ${nodeExtraClass}>${step.to} ${isWaypoint ? '(Parada)' : ''}</span>
              <span class="route-step-cost">Custo do trecho: R$ ${step.stepCost.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>`;
        routeSteps.appendChild(li);
      });
    }

    const resultsPane = document.getElementById('bottom-drawer');
    resultsPane.classList.remove('hidden');

    if (document.body.classList.contains('fullscreen-mode')) {
      void resultsPane.offsetWidth; // Força o navegador a renderizar o estado inicial
      bottomDrawer.classList.remove('closed');
      bottomDrawer.classList.add('open');
    }
    
    document.getElementById('gps-actions').classList.remove('hidden');
    
    // Set GPS URLs
    const btnGmaps = document.getElementById('btn-gmaps');
    const btnWaze = document.getElementById('btn-waze');
    
    // Google Maps URL
    let gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    if (waypoint) {
      gmapsUrl += `&waypoints=${encodeURIComponent(waypoint)}`;
    }
    btnGmaps.href = gmapsUrl;

    const origCoords = capitalCoordinates[origin];
    const destCoords = capitalCoordinates[destination];
    const wazeUrl = `https://www.waze.com/live-map/directions?from=ll.${origCoords[0]},${origCoords[1]}&to=ll.${destCoords[0]},${destCoords[1]}`;
    btnWaze.href = wazeUrl;
    
    routeMap.drawRoute(finalResult.path, origin, destination, waypoint);
    if (window.innerWidth <= 768) {
      resultsPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
