
var update_interval_sec = 900; //every 15 min
var refresh_sec = 1;
var notifySound = new Audio('tada.webm');
notifySound.disabled = false;
var music = new Audio('music.webm');

var lines;		//single layer for all lines
var markers;	//each act as a layer
var dataLayer;
var map;
var currentMarker;
var legend;
var button_refresh;

var custom_arr_default = [
	{'title':'Compass', 'val':0, 'factor':1, 'sym': '&deg;'},
	{'title':'Battery Voltage', 'val':0, 'factor':0.1, 'sym': ' V'},
	{'title':'Amps', 'val':0, 'factor':0.1, 'sym': ' A'},
	{'title':'Water Temperature', 'val':0, 'factor':1, 'sym': ' &deg;C'},
	{'title':'Inside Humidity', 'val':0, 'factor':10, 'sym': '%'},
	{'title':'Inside Temperature', 'val':0, 'factor':1, 'sym': ' &deg;C'},
	{'title':'Wind Angle', 'val':0, 'factor':1, 'sym': '&deg'},
	{'title':'Wind Speed', 'val':0, 'factor':0.1, 'sym': ' m/s'},
	{'title':'Air Temperature', 'val':0, 'factor':1, 'sym': ' &deg;C'},
//	{'title':'GPS Speed', 'val':0, 'factor':0.1, 'sym': ' m/s'},
//	{'title':'GPS Satellites', 'val':0, 'factor':1, 'sym': ''},
//	{'title':'GPS HDOP', 'val':0, 'factor':0.1, 'sym': ''},
//	{'title':'Rudder', 'val':0, 'factor':10, 'sym': ''},
//	{'title':'Next Waypoint', 'val':0, 'factor':1, 'sym': ''},
//	{'title':'CPU Uptime', 'val':0, 'factor':1, 'sym': ' min'}
];

$.ajaxSetup({
	type: "GET",
	headers: {"If-Modified-Since": "Sat, 1 Jan 2005 00:00:00 GMT"},
	cache: false, //adds timestamp
	timeout: 30000
});

function initMap() {
	button_refresh = $('#button-refresh');

	map = L.map('map', {unloadInvisibleTiles: true, reuseTiles: true, updateWhenIdle: true, zoomControl: false});

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
		clouds = L.tileLayer('http://{s}.tile.openweathermap.org/map/clouds/{z}/{x}/{y}.png',{
    		maxZoom: 19,
    		opacity: 0.5,
    		attribution: weatherAtt
			}),
		rain = L.tileLayer('http://{s}.tile.openweathermap.org/map/rain/{z}/{x}/{y}.png',{
    		maxZoom: 19,
    		opacity: 0.5,
    		attribution: weatherAtt
			});
		

	var baseLayers = {
		'Ocean map': oceanBaseMap,
		'National Geographics': nationalGeo,
		'OSM Mapnik': osmBase,
		'Google Satelite': googleSatelite,
		'Google Terrain': googleTerrain
	};

	var overlays = {
		'Clouds': clouds,
		'Rain': rain
	};


	//add toggle
	L.control.layers(baseLayers, overlays).addTo(map);
	//add default layer
	map.addLayer(osmBase);

	lines = L.polyline([], {color: 'red', clickable: false});
	markers = [];
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
		if (refresh_sec <= 0) return;	//refreshing
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
		button_refresh.html('&#x21bb; Refreshing');
	}
}


function updateData() {
	button_refresh.css('color','grey');
	button_refresh.html('&#x21bb; Refreshing');
	refresh_sec = -1;
	$.getJSON('data.json', {}, function(data) {
		refresh_sec = update_interval_sec;
		button_refresh.css('color','black');
		button_refresh.html('&#x21bb; ' + opentransat.secToTime(update_interval_sec));

		var len = Object.size(data),
			diff = len - markers.length;

		//we have new data - make some noise(!)
		if (diff > 0 && !notifySound.disabled) {
			notifySound.play();
		}

		dataLayer.clearLayers();
		dataLayer.addLayer(lines);

		markers.forEach(function(item) {
			item.clearAllEventListeners();
		});

		markers = [];

		var polyLines = [];
		var latlng;
		var marker;
		for (var i in data) {
			var p = data[i];

			latlng = L.latLng(p['gps_lat'], p['gps_lng']);
			polyLines.push(latlng);

			marker = createMarker(p).addTo(dataLayer);
			markers.push(marker);
		}

		lines.setLatLngs(polyLines);

		if (diff > 0) {
			setCurrentMarker(markers[markers.length-1].my_data);
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
	marker.on('mouseover', handleMouse);
	marker.on('click', handleMouse);
	//chytat eventy
	return marker;
}

function handleMouse(item) {
	setCurrentMarker(item.target.my_data);
}

function setCurrentMarker(point) {
	//TODO: nacitanie a zobrazenie info v legende
	legend.setData(point);
	return currentMarker.setLatLng([point['gps_lat'], point['gps_lng']]);
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
