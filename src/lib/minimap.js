import L from "leaflet";
import getMapPreset from "../utils/date/getMapPreset.js";

function Minimap(options) {
  Object.assign(this.options, options);

  this._ticking = false;
  this._lastMouseMoveEvent = null;
  this._parentMap = null;
  this._trackingRectCoordinates = [[[], [], [], [], []]];
}

Minimap.prototype = {
  options: {
    id: "leaflet-minimap",
    width: "320px",
    height: "180px",
    center: [0, 0],
    zoom: 6,

    // should be a function; will be bound to Minimap
    zoomAdjust: null,

    // if parent map zoom >= 18 and minimap zoom >= 14, set minimap zoom to 16
    zoomLevels: [[1, 1, 2]],

    lineColor: "#08F",
    lineWidth: 1,
    lineOpacity: 1,

    fillColor: "#F80",
    fillOpacity: 0.25,

    dragPan: false,
    scrollZoom: false,
    boxZoom: false,
    dragRotate: false,
    keyboard: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    interactive: false,
  },

  onAdd: function (parentMap) {
    this._parentMap = parentMap;

    var opts = this.options;
    var container = (this._container = this._createContainer(parentMap));
    
    var miniMap = (this._miniMap = L.map(container, {
      center: opts.center,
      zoom: opts.zoom,
      attributionControl: false,
      zoomControl: false,
      dragging: opts.interactive,
      touchZoom: opts.interactive,
      scrollWheelZoom: opts.interactive,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    }));

    // Add OpenStreetMap tiles to minimap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19
    }).addTo(miniMap);

    miniMap.whenReady(() => {
      this._load();
    });

    return this._container;
  },

  _load: function () {
    var opts = this.options;
    var parentMap = this._parentMap;
    var miniMap = this._miniMap;

    if (typeof opts.zoomAdjust === "function") {
      this.options.zoomAdjust = opts.zoomAdjust.bind(this);
    } else if (opts.zoomAdjust === null) {
      this.options.zoomAdjust = this._zoomAdjust.bind(this);
    }

    var bounds = miniMap.getBounds();
    this._convertBoundsToPoints(bounds);

    // Create tracking rectangle as a polygon
    this._trackingRect = L.polygon(this._trackingRectCoordinates[0], {
      color: opts.lineColor,
      weight: opts.lineWidth,
      opacity: opts.lineOpacity,
      fillColor: opts.fillColor,
      fillOpacity: opts.fillOpacity
    }).addTo(miniMap);

    this._update();

    parentMap.on('move', this._update.bind(this));
    parentMap.on('zoom', this._update.bind(this));

    this._miniMapContainer = miniMap.getContainer();
    this._miniMapContainer.addEventListener("wheel", this._preventDefault);
    this._miniMapContainer.addEventListener("mousewheel", this._preventDefault);
  },

  _setTrackingRectBounds: function (bounds) {
    this._convertBoundsToPoints(bounds);
    if (this._trackingRect) {
      this._trackingRect.setLatLngs(this._trackingRectCoordinates[0]);
    }
  },

  _convertBoundsToPoints: function (bounds) {
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var trc = this._trackingRectCoordinates;

    trc[0] = [
      [ne.lat, ne.lng],
      [ne.lat, sw.lng],
      [sw.lat, sw.lng],
      [sw.lat, ne.lng],
      [ne.lat, ne.lng]
    ];
  },

  _update: function (e) {
    var parentBounds = this._parentMap.getBounds();
    this._setTrackingRectBounds(parentBounds);

    if (typeof this.options.zoomAdjust === "function") {
      this.options.zoomAdjust();
    }
  },

  _zoomAdjust: function () {
    var miniMap = this._miniMap;
    var parentMap = this._parentMap;
    var miniZoom = parseInt(miniMap.getZoom(), 10);
    var parentZoom = parseInt(parentMap.getZoom(), 10);
    var levels = this.options.zoomLevels;
    var found = false;

    levels.forEach((zoom) => {
      if (!found && parentZoom >= zoom[0]) {
        if (miniZoom >= zoom[1]) {
          miniMap.setZoom(zoom[2]);
        }
        miniMap.panTo(parentMap.getCenter());
        found = true;
      }
    });

    if (!found && miniZoom !== this.options.zoom) {
      miniMap.setZoom(this.options.zoom);
    }
  },

  _createContainer: function (parentMap) {
    var opts = this.options;
    var container = document.createElement("div");

    container.className = "leaflet-minimap leaflet-control rounded-md minimap";
    container.setAttribute(
      "style",
      "width: " + opts.width + "; height: " + opts.height + ";"
    );
    container.addEventListener("contextmenu", this._preventDefault);

    if (opts.id !== "") {
      container.id = opts.id;
    }

    return container;
  },

  _preventDefault: function (e) {
    e.preventDefault();
  },
};

L.Minimap = Minimap;

export default Minimap;
