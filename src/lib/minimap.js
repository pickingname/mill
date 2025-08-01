import L from "leaflet";
import getMapPreset from "../utils/date/getMapPreset.js";

/**
 * Create a minimap for Leaflet
 * @param {Object} options - Configuration options for the minimap
 * @returns {Object} Minimap instance
 */
export function createMinimap(options = {}) {
  const defaultOptions = {
    position: 'bottomright',
    width: 150,
    height: 120,
    zoomLevelOffset: -4,
    zoomLevelFixed: false,
    centerFixed: false,
    zoomAnimation: false,
    autoToggleDisplay: false,
    minimized: false,
    lineColor: "#FF0000",
    lineWidth: 2,
    lineOpacity: 1,
    fillOpacity: 0
  };

  const opts = { ...defaultOptions, ...options };
  let parentMap = null;
  let miniMap = null;
  let viewRect = null;
  let container = null;

  const minimap = {
    addTo: function(map) {
      if (!container) {
        console.warn('[minimap] Container not created yet');
        return this;
      }
      
      parentMap = map;
      this._createMinimap();
      this._updateMinimap();
      
      // Listen to parent map events
      parentMap.on('moveend', this._updateMinimap, this);
      parentMap.on('zoomend', this._updateMinimap, this);
      
      return this;
    },

    getContainer: function() {
      if (!container) {
        this._createContainer();
      }
      return container;
    },

    _createContainer: function() {
      // Create container
      container = document.createElement('div');
      container.className = 'leaflet-minimap';
      container.style.width = opts.width + 'px';
      container.style.height = opts.height + 'px';
      container.style.border = '1px solid #ccc';
      container.style.borderRadius = '4px';
      container.style.overflow = 'hidden';
      container.style.position = 'relative';
    },

    _createMinimap: function() {
      if (!container) {
        this._createContainer();
      }

      try {
        // Create minimap
        miniMap = L.map(container, {
          attributionControl: false,
          zoomControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomAnimation: opts.zoomAnimation
        });

        // Add tile layer based on theme
        const mapPreset = getMapPreset() || "day";
        let tileLayerUrl;
        let tileLayerOptions = {
          attribution: '',
          maxZoom: 18
        };
        
        if (mapPreset === "night" || mapPreset === "dusk") {
          tileLayerUrl = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png";
          tileLayerOptions.subdomains = ['a', 'b', 'c', 'd'];
        } else {
          tileLayerUrl = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png";
          tileLayerOptions.subdomains = ['a', 'b', 'c', 'd'];
        }

        const tileLayer = L.tileLayer(tileLayerUrl, tileLayerOptions);
        
        tileLayer.addTo(miniMap);

        // Handle tile loading errors for minimap
        tileLayer.on('tileerror', function(e) {
          console.warn('[minimap] Tile loading error:', e);
        });

        // Create view rectangle
        viewRect = L.rectangle([[0, 0], [0, 0]], {
          color: opts.lineColor,
          weight: opts.lineWidth,
          opacity: opts.lineOpacity,
          fillOpacity: opts.fillOpacity,
          interactive: false
        }).addTo(miniMap);

        // Set initial view
        miniMap.setView([opts.center[0], opts.center[1]], opts.zoom);
      } catch (error) {
        console.error('[minimap] Error creating minimap:', error);
      }
    },

    _updateMinimap: function() {
      if (!miniMap || !parentMap || !viewRect) return;

      try {
        const parentBounds = parentMap.getBounds();
        const parentZoom = parentMap.getZoom();
        const parentCenter = parentMap.getCenter();

        // Update minimap center and zoom
        let minimapZoom;
        if (opts.zoomLevelFixed) {
          minimapZoom = opts.zoomLevelFixed;
        } else {
          minimapZoom = Math.max(0, parentZoom + opts.zoomLevelOffset);
        }

        if (!opts.centerFixed) {
          miniMap.setView(parentCenter, minimapZoom, { animate: false });
        }

        // Update view rectangle
        const sw = parentBounds.getSouthWest();
        const ne = parentBounds.getNorthEast();
        viewRect.setBounds([[sw.lat, sw.lng], [ne.lat, ne.lng]]);
      } catch (error) {
        console.warn('[minimap] Error updating minimap:', error);
      }
    },

    remove: function() {
      if (parentMap) {
        parentMap.off('moveend', this._updateMinimap, this);
        parentMap.off('zoomend', this._updateMinimap, this);
      }
      if (miniMap) {
        miniMap.remove();
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  return minimap;
}
