var app = {
	eventBus: null,

	state: {
		data: null,
	},

	initMain: function() {
		//nacitanie nastaveni?

		$.ajaxSetup({
			type: "GET",
			headers: {"If-Modified-Since": "Sat, 1 Jan 2005 00:00:00 GMT"},
			cache: false, //adds timestamp
			timeout: 30000
		});

		this.eventBus = $('body');
		this.eventBus.on(opentransat.events.reload_data, this.update_data.bind(this));

		side_bar.init_sidebar(this.eventBus);
		toolbar.init_toolbar(this.eventBus);
		map.init_map(this.eventBus);
	},

	update_data: function() {
		var that = this;
		$.getJSON('data.json').done(function(data) {
			if (!opentransat.deepEqual(data, that.state.data)) {
				that.state.data = data;
			}
			that.eventBus.trigger(opentransat.events.new_data, that.state.data);
		})
		.fail(function(jqxhr, textStatus, error) {
			that.eventBus.trigger(opentransat.events.new_data_error, error);
		});
	}
};