var defaultConfig = {
	trackers: {
		'iridium': {
			color: green,
			show: true
		},
		'spot2': {
			color: red,
			show: true
		},
		'spot3': {
			color: yellow,
			show: true
		},
		'_others': {
			show: false
		}
	},
	comments: {
		//true, false, layer
		show: layer,
		formatter: opentransat.prepareComment
	},
	legend: {
		show: true,
		onStart: true,
		formatter: opentransat.prepareLegend
	},
	dataTransformFunction: function(data) {
		return data;
	},
	updates: {
		uri: "data.json",
		//null or <=0 to disable updates, n - seconds
		interval: 900
	},
	notifications: {
		//null to complete disable
		allowToggle: true,
		sound: 'tada.webm',
		onStart: true
	},
	music: {
		//null to complete disable
		source: 'music.webm',
		allowToggle: true,
		onStart: true
	}
}