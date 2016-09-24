var opentransat = {
	custom_arr_default: [
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
	],

	secToTime: function(seconds) {
		var interval = Math.floor(seconds / 31536000);

		if (interval > 1) {
	        return interval + " years";
	    }
	    interval = Math.floor(seconds / 2592000);
	    if (interval > 1) {
	        return interval + " months";
	    }
	    interval = Math.floor(seconds / 86400);
	    if (interval > 1) {
	        return interval + " days";
	    }
	    interval = Math.floor(seconds / 3600);
	    if (interval > 1) {
	        return interval + " hours";
	    }
	    interval = Math.floor(seconds / 60);
	    if (interval > 1) {
	        return interval + " minutes";
	    }
	    return Math.floor(seconds) + " seconds";
	},

	timeSince: function(date) {
	    var seconds = Math.floor((new Date() - date) / 1000);

	    return this.secToTime(seconds);
	},

	myround: function(x) {
		return Math.round(x*1000000)/1000000;
    },

    timeToDate: function(time) {
    	return new Date(time.replace(' ', 'T')+'+00:00');
    },

    prepareLegend: function(data) {

    	var content = '<div class="content">';
	  	var custom_arr = $.extend({}, this.custom_arr_default);
	  	var device = data['device'];
	  	var custom_arr_val = data['custom'].split(';');
	  	var gps_lat = parseFloat(data['gps_lat']);
	  	var gps_lng = parseFloat(data['gps_lng']);
	  	var network = 'Iridium';
	  	if (device == 'spot2') {
	  		network = 'Globalstar';
	  	} else if (device == 'spot3') {
	  		network = 'Globarstar (secondary)';
	  	}

		var date_gmt = this.timeToDate(data['transmit_time']);
		var agostr = opentransat.timeSince(date_gmt);

		var travelTimeStr = opentransat.secToTime(data['travel-time']);
		
		if (device == 'iridium' && custom_arr_val[custom_arr_val.length-1] == 'i') {
			content += '<div><b>PROGRAM RESET</b></div>';
		}
		
		content += '<div><b>Time: </b>'+data['transmit_time']+' GMT ('+agostr+' ago)</div><div><b>Coordinates: </b>'+gps_lat.toFixed(4)+', '+gps_lng.toFixed(4)+'</div><div><b>Network: </b>'+network+'</div>';
		if (data['battery']) {
			content += '<div><b>Battery: </b>'+ data['battery'] + '</div>';
		}
		
		content += '<div><b>Estimated boat speed:</b> ' + data['speed'].toFixed(2) + ' km/h (' + Math.round(data['speed']*9/4.63 * 10)/10 + ' knots)</div>';
		content += '<div><b>Estimated distance:</b> ' + (data['distance-total'] / 1000.0).toFixed(2) + ' km (' + (data['distance-air'] / 1000.0).toFixed(2) + ' km air line, ' + travelTimeStr + ')</div>';
		
		if (device == 'iridium') {
			for (var i in custom_arr) {
				if (custom_arr_val[i] != '')
					custom_arr[i]['val'] = custom_arr_val[i];
			}

			for (var i in custom_arr) {
				var title = custom_arr[i]['title'];
				var value = custom_arr[i]['val'];
				if ($.isNumeric(value))
					value *= custom_arr[i]['factor'];
				if (title == 'Wind Angle') {
					value = data['avg_heading'] - value;
					if (value < 0) value += 360;
					if (value > 360) value -= 360;
				}
				value = this.myround(value);
				
				var valstr = value + custom_arr[i]['sym'];

				if (title.indexOf('Temperature') >= 0)
					valstr += ' ('+this.myround(value*1.8 + 32)+' &deg;F)';
				if (title.indexOf('Speed') >= 0)
					valstr += ' ('+Math.round(value*9/4.63 * 10)/10+' knots)';
				if (title == 'Wind Angle') {
					if (value < 22.5) valstr += ' <b>&uarr;</b>';
					else if (value < 67.5) valstr += ' <b>&nearr;</b>';
					else if (value < 112.5) valstr += ' <b>&rarr;</b>';
					else if (value < 157.5) valstr += ' <b>&searr;</b>';
					else if (value < 202.5) valstr += ' <b>&darr;</b>';
					else if (value < 247.5) valstr += ' <b>&swarr;</b>';
					else if (value < 292.5) valstr += ' <b>&larr;</b>';
					else if (value < 337.5) valstr += ' <b>&nwarr;</b>';
					else valstr += ' <b>&uarr;</b>';
				}
					
				content += '<div><b>'+title+': </b>'+valstr+'</div>';
			}
			content += '<div><b>Avg. Heading: </b>'+data['avg_heading']+'&deg;</div>';
		}

	  	content += '</div>';
	  	return content;
    },

    prepareComment: function(comment) {
    	var content = '<div class="content">';
    	content += '<div><strong>' + comment[2] + '</strong></div>';
    	content += '<div>' + comment[3] + '</div>';
    	content += '</div>';
	  	return content;
    }
};