
var update_interval_sec = 900; //every 15 min
var refresh_sec = 1;
var notifySound = new Audio('tada.webm');
notifySound.disabled = false;
var music = new Audio('music.webm');

var lines;		//single layer for all lines
var markers;	//each act as a layer
var comments;
var dataLayer;
var commentsLayer;
var map;
var currentMarker;
var legend;
var button_refresh;
var state = {
	particles: false
};

$.ajaxSetup({
	type: "GET",
	headers: {"If-Modified-Since": "Sat, 1 Jan 2005 00:00:00 GMT"},
	cache: false, //adds timestamp
	timeout: 30000
});

function initMain(leafletmap) {
	button_refresh = $('#button-refresh');

	//map = L.map('map', {unloadInvisibleTiles: true, reuseTiles: true, updateWhenIdle: true, zoomControl: false});
	map = leafletmap;

	W.on('redrawFinished',function( displayedParams ) {
          if (state.particles === false) {
            W.animation.stop();
          }
    });

    W.setOverlay('clouds');

	var	weatherAtt = 'Map data © <a href="http://openweathermap.org/">OpenWeatherMap</a>',
		oceanBaseMap = L.tileLayer(
			'http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
			{id: 'map.ocean',
			maxZoom: 10,
			attribution: 'Tiles &copy; Esri - Sources &mdash; GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'}),
		nationalGeo = L.tileLayer(
			'http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
			{id: 'map.natgeo',
			maxZoom: 10,
			attribution: 'Tiles &copy; Esri - Sources &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'}),
		osmBase = L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			{id: 'map.osm',
			attribution: 'Map data © <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors, CC-BY-SA'
			}),
		googleSatelite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    			maxZoom: 20,
    			subdomains:['mt0','mt1','mt2','mt3']
			}),
		googleTerrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    		maxZoom: 20,
    		subdomains:['mt0','mt1','mt2','mt3']
			}),
		precipitation = L.tileLayer('http://{s}.tile.openweathermap.org/map/precipitation/{z}/{x}/{y}.png',{
    		maxZoom: 19,
    		opacity: 0.5,
    		attribution: weatherAtt
			}),
		rain = L.tileLayer('http://{s}.tile.openweathermap.org/map/rain/{z}/{x}/{y}.png',{
    		maxZoom: 19,
    		opacity: 0.5,
    		attribution: weatherAtt
			});

	commentsLayer = L.layerGroup([]).addTo(map);

	var baseLayers = {
		'Ocean map': oceanBaseMap,
		'National Geographics': nationalGeo,
		'OSM Mapnik': osmBase,
		'Google Satelite': googleSatelite,
		'Google Terrain': googleTerrain
	};

	var overlays = {
		'Comments': commentsLayer,
		'Precipitation': precipitation,
		'Rain': rain
	};


	//add toggle
	L.control.layers(baseLayers, overlays).addTo(map);
	//add default layer
	map.addLayer(googleSatelite);

	lines = L.polyline([], {color: 'red', clickable: false});
	markers = [];
	comments = [];
	dataLayer = L.layerGroup([lines]).addTo(map);

	L.control.scale().addTo(map);

	map.fitWorld();
	currentMarker = L.circleMarker([]);
	
	//var buttons = L.control()
	//buttony
	legend = new L.Control.Legend();
	map.addControl(legend);
	map.addControl(new L.Control.ZoomExtra({
		latlng: lines
	}));

	setInterval(handleTimer, 1000);

	button_refresh.click(function() {
		if (refresh_sec <= 0) return;	//loading
		updateData();
	});

	music.loop = 1;
	$('#button-toggle-music').click(function() {
		if (music.paused) {
			music.play();
			$(this).css('color', 'black');
		} else {
			music.pause();
			$(this).css('color', 'grey');
		}
	});

	$('#button-toggle-notify').click(function() {
		notifySound.disabled = !notifySound.disabled;
		if (notifySound.disabled) {
			$(this).css('color', 'grey');
		} else {
			$(this).css('color', 'black');
		}
	});

	loadSettings();
}

function loadSettings() {
	//sem nacitat nastavenia - stav notifikacii, hudby...
	music.play();
}


function handleTimer() {
	refresh_sec--;
	if (refresh_sec == 0) {
		updateData();
	} else if (refresh_sec > 0) {
		button_refresh.html('&#x21bb; ' + opentransat.secToTime(refresh_sec));
	} else {
		button_refresh.html('&#x21bb; Loading');
	}
}


function updateData() {
	button_refresh.css('color','grey');
	button_refresh.html('&#x21bb; Loading');
	refresh_sec = -1;
	$.getJSON('data.json').done(function(data) {
		refresh_sec = update_interval_sec;
		button_refresh.css('color','black');
		button_refresh.html('&#x21bb; ' + opentransat.secToTime(refresh_sec));

		var len = Object.size(data) - (data['comments'] ? 1 : 0),
			diff = len - markers.length;

		//we have new data - make some noise(!)
		if (diff > 0 && !notifySound.disabled) {
			notifySound.play();
		}

		dataLayer.clearLayers();
		dataLayer.addLayer(lines);
		commentsLayer.clearLayers();

		markers.forEach(function(item) {
			item.clearAllEventListeners();
		});

		comments.forEach(function(item) {
			item.clearAllEventListeners();
		});

		markers = [];
		comments = [];

		var polyLines = [];
		var latlng;
		var marker;
		for (var i in data) {
			if (i == 'comments') {
				continue;
			}
			var p = data[i];

			latlng = L.latLng(p['gps_lat'], p['gps_lng']);
			polyLines.push(latlng);

			marker = createMarker(p).addTo(dataLayer);
			markers.push(marker);
		}

		if (data['comments']) {
			data['comments'].forEach(function(comment) {
				var commentMarker = createCommentMarker(comment);
				commentMarker.addTo(commentsLayer);
				comments.push(commentMarker);
			});
		}

		lines.setLatLngs(polyLines);

		if (diff > 0) {
			setCurrentMarker(markers[markers.length-1].my_data, 'mark');
		}
		currentMarker.addTo(dataLayer).bringToBack();
		lines.bringToBack();

		if (diff == len) {
			//initial zoom
			map.fitBounds(polyLines);
		} else if (diff > 0) {
			var currentBounds = map.getBounds();
			currentBounds.extend(polyLines.slice(-diff));
			map.fitBounds(currentBounds);
		}
	})
	.fail(function(jqxhr, textStatus, error) {
		refresh_sec = update_interval_sec < 60 ? update_interval_sec : 60;
		button_refresh.css('color','red');
		button_refresh.html('&#x21bb; ' + opentransat.secToTime(refresh_sec));
	});
}

function createMarker(item) {
	if (item['custom'] === undefined) {
		console.log(item);
	}
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
	marker.my_data = item;
	marker.type = 'mark';
	marker.on('mouseover', handleMouse);
	marker.on('click', handleMouse);
	//chytat eventy
	return marker;
}

function createCommentMarker(item) {
	var commentMarker =	L.marker([item[0], item[1]]);
	commentMarker.my_data = item;
	commentMarker.type = 'comment';
	commentMarker.on('mouseover', handleMouse);
	commentMarker.on('click', handleMouse);
	
	return commentMarker;
}

function handleMouse(item) {
	setCurrentMarker(item.target.my_data, item.target.type);
}

function setCurrentMarker(point, type) {
	var lat, lng;
	if (type == 'comment') {
		legend.setText(opentransat.prepareComment(point));
		lat = point[0];
		lng = point[1];
	}

	if (type == 'mark') {
		legend.setText(opentransat.prepareLegend(point));
		lat = point['gps_lat'];
		lng = point['gps_lng'];
		//var date = opentransat.timeToDate(point['transmit_time']);
		//var milis = date.getTime();
		//W.setTimestamp(milis); 
	}

	return currentMarker.setLatLng([lat, lng]);
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
