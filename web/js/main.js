var app = {
	eventBus: null,
	loading: null,

	state: {
		data: null,
	},

	initMain: function() {
		//nacitanie nastaveni?

		this.loading = $('.loading');

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
				that.eventBus.trigger(opentransat.events.new_data, data);
				that.loading.toggleClass('hidden', true);

				//on first data && large screen show side bar
				if (that.state.data === null && window.innerWidth > 599) {
					that.eventBus.trigger(opentransat.events.show_side_pane);
				}

				that.state.data = data;
			} else {
				that.eventBus.trigger(opentransat.events.new_data, that.state.data);
			}
		})
		.fail(function(jqxhr, textStatus, error) {
			that.eventBus.trigger(opentransat.events.new_data_error, error);
		});
	}
};
