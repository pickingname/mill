import L from "leaflet";
import getMapPreset from "../utils/date/getMapPreset.js";

function Minimap(options) {
  this.options = Object.assign({
    id: "leaflet-minimap",
    width: "320px",
    height: "180px",
    center: [0, 0],
    zoom: 6,
    lineColor: "#08F",
    lineWidth: 1,
    lineOpacity: 1,
    fillColor: "#F80",
    fillOpacity: 0.25,
    interactive: false,
  }, options);

  this._parentMap = null;
  this._miniMap = null;
  this._trackingRect = null;
}

Minimap.prototype = {
  onAdd: function (parentMap) {
    this._parentMap = parentMap;

    var opts = this.options;
    var container = (this._container = this._createContainer());
    
    var miniMap = (this._miniMap = L.map(container, {
      center: opts.center,
      zoom: opts.zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: opts.interactive,
      touchZoom: opts.interactive,
      doubleClickZoom: opts.interactive,
      scrollWheelZoom: opts.interactive,
      boxZoom: opts.interactive,
      keyboard: opts.interactive,
    }));

    // Add OpenStreetMap tiles to minimap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
      maxZoom: 19,
    }).addTo(miniMap);

    miniMap.whenReady(this._load.bind(this));

    return this._container;
  },

  _load: function () {
    var parentMap = this._parentMap;
    var miniMap = this._miniMap;

    // Create tracking rectangle
    var bounds = parentMap.getBounds();
    this._trackingRect = L.rectangle(bounds, {
      color: this.options.lineColor,
      weight: this.options.lineWidth,
      opacity: this.options.lineOpacity,
      fillColor: this.options.fillColor,
      fillOpacity: this.options.fillOpacity,
    }).addTo(miniMap);

    this._update();

    // Listen to parent map events
    parentMap.on('move', this._update.bind(this));
    parentMap.on('zoom', this._update.bind(this));
  },

  _update: function () {
    if (!this._trackingRect) return;
    
    var parentBounds = this._parentMap.getBounds();
    this._trackingRect.setBounds(parentBounds);
    
    // Adjust minimap view if needed
    this._adjustView();
  },

  _adjustView: function () {
    var miniMap = this._miniMap;
    var parentMap = this._parentMap;
    var parentZoom = parentMap.getZoom();
    
    // Simple zoom adjustment logic
    if (parentZoom > 10 && miniMap.getZoom() > 6) {
      miniMap.setZoom(6);
    }
    
    miniMap.setView(parentMap.getCenter(), miniMap.getZoom());
  },

  _createContainer: function () {
    var opts = this.options;
    var container = document.createElement("div");

    container.className = "leaflet-ctrl-minimap leaflet-ctrl rounded-md minimap";
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

export default Minimap;
