L.Control.Legend = L.Control.extend({
  options: {
    position: 'bottomright'
  },

  _mainContainer: null,

  onAdd: function (map) {
  	this._mainContainer = L.DomUtil.create('div', 'map-legend hidden', L.DomUtil.get('map'));

  	$(this._mainContainer).on('click', function() {
			$(this).toggleClass('small');
  	});

    return this._mainContainer;
  },

  onRemove: function(map) {
  	$(this._mainContainer).off();
  },

  setText: function(data) {
  	$(this._container).toggleClass('hidden', data === null);
  	if (data === null) return;

  	this._container.innerHTML = data;
  }
});