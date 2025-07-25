import mapboxgl from "mapbox-gl";
import getMapPreset from "../utils/date/getMapPreset.js";

function Minimap(options) {
  Object.assign(this.options, options);

  this._ticking = false;
  this._lastMouseMoveEvent = null;
  this._parentMap = null;
  this._trackingRectCoordinates = [[[], [], [], [], []]];
}

Minimap.prototype = Object.assign({}, mapboxgl.NavigationControl.prototype, {
  options: {
    id: "mapboxgl-minimap",
    width: "320px",
    height: "180px",
    style: "mapbox://styles/mapbox/standard?optimize=true",
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
    var miniMap = (this._miniMap = new mapboxgl.Map({
      attributionControl: false,
      container: container,
      style: opts.style,
      zoom: opts.zoom,
      center: opts.center,
      interactive: opts.interactive,
      config: {
        basemap: {
          lightPreset: getMapPreset() || "day",
        },
      },
    }));

    if (opts.maxBounds) miniMap.setMaxBounds(opts.maxBounds);

    miniMap.on("load", this._load.bind(this));

    return this._container;
  },

  _load: function () {
    var opts = this.options;
    var parentMap = this._parentMap;
    var miniMap = this._miniMap;
    var interactions = [
      "dragPan",
      "scrollZoom",
      "boxZoom",
      "dragRotate",
      "keyboard",
      "doubleClickZoom",
      "touchZoomRotate",
    ];

    interactions.forEach(function (i) {
      if (opts[i] !== true) {
        miniMap[i].disable();
      }
    });

    if (typeof opts.zoomAdjust === "function") {
      this.options.zoomAdjust = opts.zoomAdjust.bind(this);
    } else if (opts.zoomAdjust === null) {
      this.options.zoomAdjust = this._zoomAdjust.bind(this);
    }

    var bounds = miniMap.getBounds();

    this._convertBoundsToPoints(bounds);

    miniMap.addSource("trackingRect", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {
          name: "trackingRect",
        },
        geometry: {
          type: "Polygon",
          coordinates: this._trackingRectCoordinates,
        },
      },
    });

    miniMap.addLayer({
      id: "trackingRectOutline",
      type: "line",
      source: "trackingRect",
      layout: {},
      paint: {
        "line-color": opts.lineColor,
        "line-width": opts.lineWidth,
        "line-opacity": opts.lineOpacity,
        "line-emissive-strength": 1,
      },
    });

    // needed for dragging
    miniMap.addLayer({
      id: "trackingRectFill",
      type: "fill",
      source: "trackingRect",
      layout: {},
      paint: {
        "fill-color": opts.fillColor,
        "fill-opacity": opts.fillOpacity,
      },
    });

    this._trackingRect = this._miniMap.getSource("trackingRect");

    this._update();

    parentMap.on("move", this._update.bind(this));

    this._miniMapCanvas = miniMap.getCanvasContainer();
    this._miniMapCanvas.addEventListener("wheel", this._preventDefault);
    this._miniMapCanvas.addEventListener("mousewheel", this._preventDefault);
  },

  _setTrackingRectBounds: function (bounds) {
    var source = this._trackingRect;
    var data = source._data;

    data.properties.bounds = bounds;
    this._convertBoundsToPoints(bounds);
    source.setData(data);
  },

  _convertBoundsToPoints: function (bounds) {
    var ne = bounds._ne;
    var sw = bounds._sw;
    var trc = this._trackingRectCoordinates;

    trc[0][0][0] = ne.lng;
    trc[0][0][1] = ne.lat;
    trc[0][1][0] = sw.lng;
    trc[0][1][1] = ne.lat;
    trc[0][2][0] = sw.lng;
    trc[0][2][1] = sw.lat;
    trc[0][3][0] = ne.lng;
    trc[0][3][1] = sw.lat;
    trc[0][4][0] = ne.lng;
    trc[0][4][1] = ne.lat;
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

    levels.forEach(function (zoom) {
      if (!found && parentZoom >= zoom[0]) {
        if (miniZoom >= zoom[1]) {
          miniMap.setZoom(zoom[2]);
        }

        miniMap.setCenter(parentMap.getCenter());
        found = true;
      }
    });

    if (!found && miniZoom !== this.options.zoom) {
      if (typeof this.options.bounds === "object") {
        miniMap.fitBounds(this.options.bounds, { duration: 50 });
      }

      miniMap.setZoom(this.options.zoom);
    }
  },

  _createContainer: function (parentMap) {
    var opts = this.options;
    var container = document.createElement("div");

    container.className =
      "mapboxgl-ctrl-minimap mapboxgl-ctrl rounded-md minimap";
    container.setAttribute(
      "style",
      "width: " + opts.width + "; height: " + opts.height + ";"
    );
    container.addEventListener("contextmenu", this._preventDefault);

    parentMap.getContainer().appendChild(container);

    if (opts.id !== "") {
      container.id = opts.id;
    }

    return container;
  },

  _preventDefault: function (e) {
    e.preventDefault();
  },
});

mapboxgl.Minimap = Minimap;

export default Minimap;
