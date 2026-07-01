import { Graph } from './utils/graph.js';
import { RouteMap } from './components/map.js';
import { capitalCoordinates } from './utils/coordinates.js';
import capitaisData from './data/capitais.json';

const graph = new Graph();
let routeMap;

const capitalStates = {
  "Aracajú": "SE",
  "Belém": "PA",
  "Belo Horizonte": "MG",
  "Boa Vista": "RR",
  "Brasília": "DF",
  "Campo Grande": "MS",
  "Cuiabá": "MT",
  "Curitiba": "PR",
  "Florianópolis": "SC",
  "Fortaleza": "CE",
  "Goiânia": "GO",
  "João Pessoa": "PB",
  "Macapá": "AP",
  "Maceió": "AL",
  "Manaus": "AM",
  "Natal": "RN",
  "Palmas": "TO",
  "Porto Alegre": "RS",
  "Porto Velho": "RO",
  "Recife": "PE",
  "Rio Branco": "AC",
  "Rio de Janeiro": "RJ",
  "Salvador": "BA",
  "São Luis": "MA",
  "São Paulo": "SP",
  "Teresina": "PI",
  "Vitória": "ES"
};

window.showToast = (message, type = 'error') => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
};

window.handleCitySelection = (role, city, inputElement) => {
  const originInput = document.getElementById('origin');
  const destInput = document.getElementById('destination');
  const waypointInput = document.getElementById('waypoint');
  
  if (role === 'origin' && city === destInput.value) {
    // Swap Origin and Destination
    destInput.value = originInput.value;
  } else if (role === 'destination' && city === originInput.value) {
    // Swap Origin and Destination
    originInput.value = destInput.value;
  } else if (role === 'waypoint' && (city === originInput.value || city === destInput.value)) {
    window.showToast('A parada não pode ser igual à origem ou destino.', 'warning');
    return false; // Reject selection
  }
  
  if ((role === 'origin' || role === 'destination') && city === waypointInput.value) {
    // If setting origin/dest to the current waypoint, clear the waypoint
    window.clearWaypoint();
  }
  
  inputElement.value = city;
  
  // Show clear button for waypoint
  if (role === 'waypoint') {
    const btn = inputElement.parentElement.querySelector('.clear-input');
    if (btn) btn.style.display = 'flex';
  }
  
  return true;
};

window.setRouteCity = (role, city) => {
  const input = document.getElementById(role);
  if (input) {
    const success = window.handleCitySelection(role, city, input);
    if (!success) {
      if (routeMap && routeMap.map) routeMap.map.closePopup();
      return;
    }
    
    if (routeMap && routeMap.map) {
      routeMap.map.closePopup();
    }
    const leftDrawer = document.getElementById('left-drawer');
    if (leftDrawer && leftDrawer.classList.contains('closed')) {
      leftDrawer.classList.replace('closed', 'open');
    }
    // Remove focus from dropdowns
    document.activeElement.blur();

    // Auto-calculate route
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    
    if (origin && destination) {
      const form = document.getElementById('route-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }
};

window.clearWaypoint = () => {
  const wp = document.getElementById('waypoint');
  if (wp) {
    wp.value = '';
    wp.dataset.previousValue = ''; // Ensure previous value is also cleared
    wp.placeholder = wp.dataset.originalPlaceholder || 'Ex: Goiânia';
    
    // Hide the button
    const btn = wp.parentElement.querySelector('.clear-input');
    if (btn) {
      btn.style.display = 'none';
    }
    
    // Auto-calculate route if origin and destination exist
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    if (origin && destination) {
      const form = document.getElementById('route-form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  graph.seed(capitaisData);
  routeMap = new RouteMap('map');

  const capitals = graph.getCapitalsList().sort();
  
  // Custom Autocomplete Logic
  const initAutocomplete = (input) => {
    const wrapper = input.parentElement;
    let listElement = document.createElement('ul');
    listElement.className = 'custom-autocomplete-list';
    wrapper.appendChild(listElement);
    
    let currentFocus = -1;
    
    const closeAllLists = () => {
      document.querySelectorAll('.custom-autocomplete-list').forEach(list => {
        list.classList.remove('show');
      });
    };

    const renderList = (filterText) => {
      listElement.innerHTML = '';
      currentFocus = -1;
      
      const normalizedFilter = filterText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      
      const matches = capitals.filter(capital => {
        const normalizedCapital = capital.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return normalizedCapital.includes(normalizedFilter);
      });
      
      if (matches.length === 0) {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.style.pointerEvents = 'none';
        li.textContent = 'Nenhuma capital encontrada';
        listElement.appendChild(li);
      } else {
        matches.forEach(capital => {
          const li = document.createElement('li');
          li.className = 'autocomplete-item';
          li.textContent = capital;
          
          li.addEventListener('mousedown', (e) => {
            e.preventDefault(); // prevent blur momentarily
            
            const success = window.handleCitySelection(input.id, capital, input);
            closeAllLists();
            input.blur(); // Remove focus to cleanly finish selection
            
            if (!success) return;
            
            // If waypoint, auto calculate and show clear button
            if (input.id === 'waypoint') {
              const origin = document.getElementById('origin').value.trim();
              const dest = document.getElementById('destination').value.trim();
              if (origin && dest) {
                const form = document.getElementById('route-form');
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }
          });
          listElement.appendChild(li);
        });
      }
      
      listElement.classList.add('show');
    };

    input.addEventListener('input', function() {
      renderList(this.value);
    });

    input.addEventListener('focus', function() {
      closeAllLists();
      this.select();
      renderList(''); // Sempre mostra a lista completa ao clicar
    });

    input.addEventListener('keydown', function(e) {
      const items = listElement.querySelectorAll('.autocomplete-item');
      if (!items.length) return;
      
      if (e.key === 'ArrowDown') {
        currentFocus++;
        addActive(items);
      } else if (e.key === 'ArrowUp') {
        currentFocus--;
        addActive(items);
      } else if (e.key === 'Enter') {
        if (listElement.classList.contains('show') && currentFocus > -1) {
          e.preventDefault();
          items[currentFocus].dispatchEvent(new Event('mousedown'));
        }
      }
    });

    const addActive = (items) => {
      items.forEach(item => item.classList.remove('active'));
      if (currentFocus >= items.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = items.length - 1;
      items[currentFocus].classList.add('active');
      items[currentFocus].scrollIntoView({ block: 'nearest' });
    };
    
    // Manage clear button specifically for waypoint
    if (input.id === 'waypoint') {
      const btn = wrapper.querySelector('.clear-input');
      if (btn) {
        btn.style.display = input.value.trim() ? 'flex' : 'none';
        input.addEventListener('input', function() {
          btn.style.display = this.value.trim() ? 'flex' : 'none';
        });
      }
    }
  };

  document.querySelectorAll('.autocomplete-input').forEach(initAutocomplete);
  
  // Close lists when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('autocomplete-input')) {
      document.querySelectorAll('.custom-autocomplete-list').forEach(list => list.classList.remove('show'));
    }
  });

  const leftDrawer = document.getElementById('left-drawer');
  const bottomDrawer = document.getElementById('bottom-drawer');
  const notchLeft = document.getElementById('notch-left');
  const notchBottom = document.getElementById('notch-bottom');

  const toggleDrawer = (drawerToToggle) => {
    const isOpening = drawerToToggle.classList.contains('closed');
    
    if (isOpening) {
      drawerToToggle.classList.replace('closed', 'open');
      
      // Mutual exclusion in fullscreen mode
      if (document.body.classList.contains('fullscreen-mode')) {
        const otherDrawer = drawerToToggle === leftDrawer ? bottomDrawer : leftDrawer;
        if (otherDrawer && otherDrawer.classList.contains('open')) {
          otherDrawer.classList.replace('open', 'closed');
        }
      }
    } else {
      drawerToToggle.classList.replace('open', 'closed');
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const waypoint = document.getElementById('waypoint').value.trim();
    
    const fuelInput = document.getElementById('fuel-price');
    const rawFuelValue = fuelInput.value.replace(/\D/g, '');
    const fuelPrice = parseFloat(rawFuelValue) / 100;
    const autonomyRaw = document.getElementById('autonomy').value;
    const autonomy = parseFloat(autonomyRaw);

    // Empty field validations (replacing native HTML5 required validation)
    if (!origin) {
      window.showToast('Por favor, informe a Capital de Origem.', 'warning');
      return;
    }
    if (!destination) {
      window.showToast('Por favor, informe a Capital de Destino.', 'warning');
      return;
    }
    if (!rawFuelValue || isNaN(fuelPrice) || fuelPrice <= 0) {
      window.showToast('Por favor, informe um Preço de Combustível válido.', 'warning');
      return;
    }
    if (!autonomyRaw || isNaN(autonomy) || autonomy <= 0) {
      window.showToast('Por favor, informe uma Autonomia válida.', 'warning');
      return;
    }

    if (window.innerWidth <= 768) {
      leftDrawer.classList.remove('open');
      leftDrawer.classList.add('closed');
    }

    // Validations
    if (!graph.vertices.has(origin)) {
      window.showToast(`Capital de origem "${origin}" não encontrada.`, 'warning');
      return;
    }
    if (!graph.vertices.has(destination)) {
      window.showToast(`Capital de destino "${destination}" não encontrada.`, 'warning');
      return;
    }
    if (waypoint && !graph.vertices.has(waypoint)) {
      window.showToast(`Capital de parada "${waypoint}" não encontrada.`, 'warning');
      return;
    }

    let finalResult = null;

    if (waypoint) {
      const part1 = graph.dijkstra(origin, waypoint, fuelPrice, autonomy);
      if (!part1.success) {
        window.showToast(`Rota inexistente entre ${origin} e ${waypoint}.`);
        resultsPane.classList.add('hidden');
        return;
      }
      
      const part2 = graph.dijkstra(waypoint, destination, fuelPrice, autonomy);
      if (!part2.success) {
        window.showToast(`Rota inexistente entre ${waypoint} e ${destination}.`);
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
      window.showToast(finalResult.error || 'Rota inexistente.');
      // Keep results hidden if error
      bottomDrawer.classList.add('hidden');
      return;
    }

    // ENTER FULLSCREEN UX
    document.body.classList.add('fullscreen-mode');
    
    // Close left drawer immediately
    leftDrawer.classList.replace('open', 'closed');
    
    // Fix map rendering after layout changes
    setTimeout(() => {
      if (routeMap && routeMap.map) {
        routeMap.map.invalidateSize(true);
      }
    }, 450); // wait for drawer transitions

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
      // First node
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
    
    // Set GPS URLs
    const btnGmaps = document.getElementById('btn-gmaps');
    const btnWaze = document.getElementById('btn-waze');
    
    // Google Maps URL
    const getGmapsSearchQuery = (name) => {
      const state = capitalStates[name];
      return state ? `${name} - ${state}, Brasil` : `${name}, Brasil`;
    };
    
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

    // Now make the drawer and notch appear, and animate it opening
    bottomDrawer.classList.remove('hidden');
    if (!bottomDrawer.classList.contains('closed')) {
      bottomDrawer.classList.add('closed');
    }
    
    // Force a browser reflow so the animation works properly from the bottom
    void bottomDrawer.offsetWidth;
    
    bottomDrawer.classList.replace('closed', 'open');
  });
});

// Horizontal scroll behavior for the timeline
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('route-steps');
  if (!slider) return;

  let isDown = false;
  let startX;
  let scrollLeft;
  let velX = 0;
  let momentumID;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.style.cursor = 'grabbing';
    slider.style.userSelect = 'none'; // Prevent text selection
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    cancelAnimationFrame(momentumID);
    velX = 0;
  });
  
  const endDrag = () => {
    if(!isDown) return;
    isDown = false;
    slider.style.cursor = 'default';
    slider.style.userSelect = ''; // Restore text selection
    beginMomentum();
  };

  slider.addEventListener('mouseleave', endDrag);
  slider.addEventListener('mouseup', endDrag);
  
  let prevScrollLeft;

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast multiplier
    
    prevScrollLeft = slider.scrollLeft;
    slider.scrollLeft = scrollLeft - walk;
    velX = slider.scrollLeft - prevScrollLeft;
  });

  function beginMomentum() {
    function loop() {
      if (Math.abs(velX) > 0.5) {
        slider.scrollLeft += velX;
        velX *= 0.95; // friction (closer to 1 = more glide)
        momentumID = requestAnimationFrame(loop);
      }
    }
    momentumID = requestAnimationFrame(loop);
  }

  // Map vertical wheel to horizontal scroll, faster
  slider.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      slider.scrollLeft += e.deltaY * 3; // speed up wheel scroll 3x
    }
  });
});
