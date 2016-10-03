var map = {
	map: null,
    map_element: null,
	legend: null,
	loading: null,

	commentsLayer: null,
	linesLayer:	null,
	lines: null,
	markersLayer: null,
	currentMarker: null,

	markers: [],
	comments: [],

	weatherAtt: 'Map data © <a href="http://openweathermap.org/">OpenWeatherMap</a>',

	sources: {
		oceanBaseMap: L.tileLayer(
			'http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
			{
				id: 'map.ocean',
				maxZoom: 10,
				attribution: 'Tiles &copy; Esri - Sources &mdash; GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
			}),
		nationalGeo: L.tileLayer(
			'http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
			{
				id: 'map.natgeo',
				maxZoom: 10,
				attribution: 'Tiles &copy; Esri - Sources &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
			}),
		osmBase: L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			{
				id: 'map.osm',
				attribution: 'Map data © <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors, CC-BY-SA'
			}),
		googleSatelite: L.tileLayer(
			'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
			{
				maxZoom: 20,
				subdomains:['mt0','mt1','mt2','mt3']
			}),
		googleTerrain: L.tileLayer(
			'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
			{
				maxZoom: 20,
				subdomains:['mt0','mt1','mt2','mt3']
			}),
		precipitation: L.tileLayer(
			'http://{s}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				opacity: 0.5,
				attribution: this.weatherAtt
			}),
		rain: L.tileLayer(
			'http://{s}.tile.openweathermap.org/map/rain/{z}/{x}/{y}.png',
			{
				maxZoom: 19,
				opacity: 0.5,
				attribution: this.weatherAtt
			})
	},

	state: {
		eventbus: null,
		data: null,
		selected_marker_index: null,
		selected_comment_index: null
	},

	init_map: function(eventbus) {
		this.state.eventbus = eventbus;
		this.map_element = $('#map');
		this.loading = $('#map .loading');

		this.lines = L.polyline([], {color: 'red', clickable: false});
		this.map = L.map('map', {unloadInvisibleTiles: true, reuseTiles: true, updateWhenIdle: true, zoomControl: false});
		this.commentsLayer = L.layerGroup([]);
		this.linesLayer = L.layerGroup([this.lines]);
		this.markersLayer = L.layerGroup([]);

		var baseLayers = {
			'Ocean map': this.sources.oceanBaseMap,
			'National Geographics': this.sources.nationalGeo,
			'OSM Mapnik': this.sources.osmBase,
			'Google Satelite': this.sources.googleSatelite,
			'Google Terrain': this.sources.googleTerrain
		};

		var overlays = {
			'Comments': this.commentsLayer,
			'Markers': this.markersLayer,
			'Precipitation': this.sources.precipitation,
			'Rain': this.sources.rain
		};

		//layer toggle control
		L.control.layers(baseLayers, overlays).addTo(this.map);
		//map scale control
		L.control.scale().addTo(this.map);
		//map legend
		/*this.legend = new L.Control.Legend();
		this.map.addControl(this.legend);*/
		//zoom control
		this.map.addControl(new L.Control.ZoomExtra({
			latlng: this.lines
		}));

		//default layer
		this.map.addLayer(this.sources.osmBase);
		this.map.addLayer(this.linesLayer);
		this.map.addLayer(this.markersLayer);
		this.map.addLayer(this.commentsLayer);

		this.map.fitWorld();
		this.currentMarker = L.circleMarker([]);

		var map = this;

		eventbus.on(opentransat.events.hide_side_pane, function(event) {
			map.set_map_expand_state.bind(map);
			map.set_map_expand_state(true);
		});

		eventbus.on(opentransat.events.show_side_pane, function(event) {
			map.set_map_expand_state.bind(map);
			map.set_map_expand_state(false);
		});

		eventbus.on(opentransat.events.new_data, map.update_data.bind(this));

		eventbus.on(opentransat.events.on_comment_selected, map.select_comment.bind(this));

		eventbus.on(opentransat.events.on_marker_selected, map.select_marker.bind(this));
	},

	set_map_expand_state: function(state) {
		this.map_element.toggleClass('expanded', state);
		var map = this.map;
		setTimeout(function() { map.invalidateSize(true); }, 500);
	},

	update_data: function (event, data) {
		if (data === this.state.data) return; //old data, reload ended
		this.loading.toggleClass('hidden', true);
		this.state.data = data;
		var diff = Object.keys(data).length - this.markers.length - (data['comments'] ? 1 : 0),
			len = this.markers.length;

		this.markersLayer.clearLayers();
		this.commentsLayer.clearLayers();
		var lines = [];

		this.markers.forEach(function(item) {
			item.clearAllEventListeners();
		});

		this.comments.forEach(function(item) {
			item.clearAllEventListeners();
		});

		this.markers = [];
		this.comments = [];

		var latlng;
		var marker;
		for (var i in data) {
			if (i == 'comments') {
				continue;
			}
			var p = data[i];

			latlng = L.latLng(p['gps_lat'], p['gps_lng']);
			lines.push(latlng);

			marker = this.createMarker(p, i).addTo(this.markersLayer);
			this.markers.push(marker);
		}

		if (data['comments']) {
			var i = 0;
			var that = this;
			data['comments'].forEach(function(comment) {
				var commentMarker = that.createCommentMarker(comment, i);
				commentMarker.addTo(that.commentsLayer);
				that.comments.push(commentMarker);
				i++;
			});
		}

		this.lines.setLatLngs(lines);
		this.currentMarker.setLatLng(lines[lines.length-1]);

		if (diff > 0 && len === 0) {
			//initial zoom
			this.map.fitBounds(lines);

			this.currentMarker.addTo(this.linesLayer).bringToBack();
			this.lines.bringToBack();
		} else if (diff > 0) {
			var currentBounds = this.map.getBounds();
			currentBounds.extend(lines.slice(-diff));
			this.map.fitBounds(currentBounds);
		}
	},

	createMarker: function (item, index) {
		var custom = item['custom'].split(';');
		var color = 'red';
		if (item.device == 'iridium') {
			color = '#00FF00';
			if (custom[custom.length-1] == 'i') {
				color = '#008000';
			}
		}

		if (item.device == 'spot2') {
			color = '#FF0000';
		}

		if (item.device == 'spot3') {
			color = '#FFFF00';
		}

		var marker = L.circleMarker([item['gps_lat'], item['gps_lng']], {
			color: color,
			radius: 0,
			stroke: true,
			fill: true,
			opacity: 1,
			weight: 10
		});
		marker.my_data = index;
		marker.on('mouseover', this.handleMouseMarker.bind(this));
		marker.on('click', this.handleMouseMarker.bind(this));

		return marker;
	},

	createCommentMarker: function createCommentMarker(item, index) {
		var commentMarker =	L.marker([item[0], item[1]]);
		commentMarker.my_data = index;
		commentMarker.on('mouseover', this.handleMouseComment.bind(this));
		commentMarker.on('click', this.handleMouseComment.bind(this));

		return commentMarker;
	},

	handleMouseMarker: function(event) {
        if (window.innerWidth < 600) {
            side_bar.state.eventbus.trigger(opentransat.events.show_side_pane);
        }
		this.state.eventbus.trigger(opentransat.events.on_marker_selected, event.target.my_data);
	},

	handleMouseComment: function(event) {
        if (window.innerWidth < 600) {
            side_bar.state.eventbus.trigger(opentransat.events.show_side_pane);
        }
		this.state.eventbus.trigger(opentransat.events.on_comment_selected, event.target.my_data);
	},

	select_marker: function (event, index) {
		if (index === this.state.selected_marker_index) {
			return;
		}
		this.state.selected_marker_index = index;
		this.state.selected_comment_index = null;

		var point = this.state.data[index];
		//this.legend.setText(opentransat.prepareLegend(point));
		var lat = parseFloat(point['gps_lat']),
			lng = parseFloat(point['gps_lng']);

		if (!this.map.getBounds().contains([lat, lng])) {
			this.map.panTo([lat, lng], {animate: true});
		}

		return this.currentMarker.setLatLng([lat, lng]);
	},

	select_comment: function (event, index) {
		if (index === this.state.selected_comment_index) {
			return;
		}
		this.state.selected_comment_index = index;
		this.state.selected_marker_index = null;

		var comment = this.state.data['comments'][index];
		//this.legend.setText(opentransat.prepareComment(comment));

		if (!this.map.getBounds().contains([comment[0], comment[1]])) {
			this.map.panTo([comment[0], comment[1]], {animate: true});
		}

		return this.currentMarker.setLatLng([comment[0], comment[1]]);
	}
};