L.Control.ZoomExtra = L.Control.Zoom.extend({
  options: {
    position: "topleft",
    zoomInText: "+",
    zoomInTitle: "Zoom in",
    zoomOutText: "-",
    zoomOutTitle: "Zoom out",
    zoomFitText: "Zoom to fit",
    zoomFitTitle: "",
    zoomLastText: "Zoom last",
    zoomLastTitle: "",
    latlng: null
  },

  onAdd: function (map) {
    var zoomName = "leaflet-control-zoom"
      , container = L.DomUtil.create("div", zoomName + " leaflet-bar")
      , options = this.options

    this._map = map

    this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
     zoomName + '-in', container, this._zoomIn, this)

    this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
     zoomName + '-out', container, this._zoomOut, this)

    this._zoomFitButton = this._createButton('<span class="rotated">' + options.zoomFitText + '</span>', options.zoomFitTitle,
     zoomName + '-fit', container, this._zoomFit, this)

    this._zoomLastButton = this._createButton('<span class="rotated">' + options.zoomLastText + '</span>', options.zoomLastTitle,
     zoomName + '-last', container, this._zoomLast, this)

    this._updateDisabled()
    map.on('zoomend zoomlevelschange', this._updateDisabled, this)

    return container
  },

  _zoomFit: function () {
  	if (this.options.latlng === null) return;
  		this._map.fitBounds(this.options.latlng.getLatLngs());
  },

  _zoomLast: function () {
  	if (this.options.latlng === null) return;
    	this._map.fitBounds(this.options.latlng.getLatLngs().slice(-30));
  },

  _updateDisabled: function () {
    var map = this._map
      , className = "leaflet-disabled"

    L.DomUtil.removeClass(this._zoomInButton, className)
    L.DomUtil.removeClass(this._zoomOutButton, className)

    if (map._zoom === map.getMinZoom()) {
      L.DomUtil.addClass(this._zoomOutButton, className)
    }

    if (map._zoom === map.getMaxZoom()) {
      L.DomUtil.addClass(this._zoomInButton, className)
    }

    if (this.options.latlng === null) {
	    L.DomUtil.addClass(this._zoomFitButton, className)
    	L.DomUtil.addClass(this._zoomLastButton, className)
    };
  }
});
