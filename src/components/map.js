import { capitalCoordinates } from '../utils/coordinates.js';

export class RouteMap {
  constructor(containerId) {
    this.map = L.map(containerId, {
      zoomControl: false,
      attributionControl: false
    }).setView([-14.235, -51.925], 4);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    this.markers = {};
    this.currentRouteLine = null;
    this.addCityMarkers();
    this.addFullscreenControl();
    this.initLoadingOverlay(containerId);
  }

  initLoadingOverlay(containerId) {
    const mapEl = document.getElementById(containerId);
    this.loadingEl = document.createElement('div');
    this.loadingEl.id = 'map-loading';
    this.loadingEl.className = 'map-loading-overlay hidden';
    this.loadingEl.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin fa-3x" style="color: var(--primary);"></i>
      <p style="margin-top: 10px; font-weight: 600; color: var(--text-main);">Calculando Rota...</p>
    `;
    mapEl.appendChild(this.loadingEl);
  }

  showLoading() {
    if (this.loadingEl) {
      this.loadingEl.classList.remove('hidden');
    }
  }

  hideLoading() {
    if (this.loadingEl) {
      this.loadingEl.classList.add('hidden');
    }
  }

  addFullscreenControl() {
    const fullscreenControl = L.control({ position: 'topright' });
    fullscreenControl.onAdd = () => {
      const btn = L.DomUtil.create('button', 'leaflet-bar leaflet-control leaflet-control-custom');
      btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
      btn.title = 'Modo Dashboard (Tela Cheia)';
      btn.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
      btn.style.color = '#fff';
      btn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      btn.style.width = '34px';
      btn.style.height = '34px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '1.2rem';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      
      btn.onclick = (e) => {
        e.preventDefault();
        
        const mapEl = document.getElementById('map');
        // FIRST: get the current dimensions
        const firstRect = mapEl.getBoundingClientRect();
        
        const isFullscreen = document.body.classList.contains('fullscreen-mode');
        
        // Temporarily hide the drawers and results so they don't jump during animation
        const leftDrawer = document.getElementById('left-drawer');
        const bottomDrawer = document.getElementById('bottom-drawer');
        leftDrawer.style.transition = 'none';
        bottomDrawer.style.transition = 'none';
        
        // TOGGLE: Apply the target class
        document.body.classList.toggle('fullscreen-mode');
        
        // Toggle icon and drawers
        if (!isFullscreen) { // Entering fullscreen
          btn.innerHTML = '<i class="fa-solid fa-compress"></i>';
          btn.title = 'Modo Clássico (Painéis)';
          
          // Auto-close left drawer
          leftDrawer.classList.remove('open');
          leftDrawer.classList.add('closed');
        } else { // Exiting fullscreen
          btn.innerHTML = '<i class="fa-solid fa-expand"></i>';
          btn.title = 'Modo Dashboard (Tela Cheia)';
          
          // Auto-open left drawer
          leftDrawer.classList.remove('closed');
          leftDrawer.classList.add('open');
        }

        // LAST: get the new dimensions (it jumps instantly because of CSS)
        const lastRect = mapEl.getBoundingClientRect();
        
        // INVERT: calculate how much we need to transform it back to the original size
        const deltaX = firstRect.left - lastRect.left;
        const deltaY = firstRect.top - lastRect.top;
        const deltaW = firstRect.width / lastRect.width;
        const deltaH = firstRect.height / lastRect.height;
        
        // Set transform origin and apply the inversion
        mapEl.style.transformOrigin = 'top left';
        mapEl.style.transition = 'none';
        mapEl.style.willChange = 'transform, border-radius';
        mapEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`;
        
        // If expanding, invert border radius so it starts rounded
        if (!isFullscreen) mapEl.style.borderRadius = '20px';
        else mapEl.style.borderRadius = '0px';

        // FORCE REFLOW so the browser registers the inverted state before animating
        void mapEl.offsetWidth;

        // PLAY: Animate to the new state
        requestAnimationFrame(() => {
          mapEl.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
          mapEl.style.transform = 'translate(0, 0) scale(1, 1)';
          mapEl.style.borderRadius = isFullscreen ? '20px' : '0px';
          
          setTimeout(() => {
            // Clean up
            mapEl.style.transition = '';
            mapEl.style.transform = '';
            mapEl.style.transformOrigin = '';
            mapEl.style.willChange = '';
            mapEl.style.borderRadius = '';
            leftDrawer.style.transition = '';
            bottomDrawer.style.transition = '';
            this.map.invalidateSize(); // Fix map tiles after animation
          }, 600);
        });
      };
      return btn;
    };
    fullscreenControl.addTo(this.map);
  }

  getIcon(color) {
    return L.divIcon({
      className: 'city-marker',
      html: `<div style="width:12px;height:12px;background:${color};border-radius:50%;box-shadow:0 0 8px ${color};border:2px solid #0f172a;"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  }

  addCityMarkers() {
    const defaultIcon = this.getIcon('#fbbf24');

    for (const [city, coords] of Object.entries(capitalCoordinates)) {
      const marker = L.marker(coords, { icon: defaultIcon }).addTo(this.map);
      
      const popupContent = `
        <div class="city-popup">
          <h4>${city}</h4>
          <div class="city-popup-actions">
            <button class="popup-btn" onclick="window.setRouteCity('origin', '${city}')"><i class="fa-solid fa-location-dot"></i> Origem</button>
            <button class="popup-btn" onclick="window.setRouteCity('waypoint', '${city}')"><i class="fa-solid fa-map-pin"></i> Parada</button>
            <button class="popup-btn" onclick="window.setRouteCity('destination', '${city}')"><i class="fa-solid fa-flag-checkered"></i> Destino</button>
          </div>
        </div>
      `;
      
      marker.bindTooltip(city, { direction: 'right', offset: [5, 0], className: 'city-tooltip' });
      marker.bindPopup(popupContent, { className: 'custom-popup', minWidth: 150 });
      this.markers[city] = marker;
    }
  }

  async drawRoute(pathNodes, origin, destination, waypoint) {
    if (this.currentRouteLine) {
      this.map.removeLayer(this.currentRouteLine);
    }

    for (const marker of Object.values(this.markers)) {
      marker.setIcon(this.getIcon('rgba(0, 210, 255, 0.3)'));
    }

    if (!pathNodes || pathNodes.length < 2) return;

    pathNodes.forEach(city => {
      if (this.markers[city]) {
        this.markers[city].setIcon(this.getIcon('#ffffff'));
      }
    });

    if (origin) this.markers[origin].setIcon(this.getIcon('#84cc16'));
    if (destination) this.markers[destination].setIcon(this.getIcon('#ef4444'));
    if (waypoint) this.markers[waypoint].setIcon(this.getIcon('#eab308'));

    let fullPathLatLngs = [];

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const startCoords = capitalCoordinates[pathNodes[i]];
      const endCoords = capitalCoordinates[pathNodes[i+1]];

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;

      try {
        const response = await fetch(osrmUrl);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates;
          fullPathLatLngs.push(...coords.map(c => [c[1], c[0]]));
        } else {
          fullPathLatLngs.push(startCoords, endCoords);
        }
      } catch (e) {
        fullPathLatLngs.push(startCoords, endCoords);
      }
    }
    
    this.currentRouteLine = L.polyline(fullPathLatLngs, {
      color: '#84cc16',
      weight: 4,
      opacity: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'route-glow-line'
    }).addTo(this.map);

    this.map.fitBounds(this.currentRouteLine.getBounds(), { padding: [50, 50], maxZoom: 6 });
  }
}
