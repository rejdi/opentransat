var toolbar = {
	update_interval_sec: 900, //every 15 min
	notify_sound: new Audio('tada.webm'),
	music: new Audio('music.webm'),
	button_refresh: null,
	button_toggle_side: null,
	button_toggle_music: null,
	button_toggle_notify: null,

	state: {
		refresh_sec: 1,
		notify_sound: true,
		background_music: false,
		eventbus: null,
		side_open: true,
		data: null
	},

	init_toolbar: function(eventbus) {
		this.state.eventbus =  eventbus;
		this.music.loop = 1;

		var toolbar = this;

		this.button_refresh = $('#button-refresh');
		this.button_refresh.click(function() {
			if (toolbar.state.refresh_sec <= 0) return; //loading now
			toolbar.state.eventbus.trigger(opentransat.events.reload_data);
		});

		this.button_toggle_music = $('#button-toggle-music');
		this.button_toggle_music.click(function() {
			toolbar.state.background_music = !toolbar.state.background_music;
			if (toolbar.state.background_music) {
				toolbar.music.play();
			} else {
				toolbar.music.pause();
			}
			toolbar.button_toggle_music.toggleClass('active', toolbar.state.background_music);
		});

		this.button_toggle_notify = $('#button-toggle-notify');
		this.button_toggle_notify.click(function() {
			toolbar.state.notify_sound = !toolbar.state.notify_sound;
			toolbar.button_toggle_notify.toggleClass('active', toolbar.state.notify_sound);
		});

		this.button_toggle_side = $('#button-toggle-side');
		this.button_toggle_side.click(function() {
			if (toolbar.state.side_open) {
				toolbar.state.eventbus.trigger(opentransat.events.hide_side_pane);
			} else {
				toolbar.state.eventbus.trigger(opentransat.events.show_side_pane);
			}
		});

		this.state.eventbus.on(opentransat.events.hide_side_pane, function(event) {
			toolbar.set_side_button(false);
		});

		this.state.eventbus.on(opentransat.events.show_side_pane, function(event) {
			toolbar.set_side_button(true);
		});

		this.state.eventbus.on(opentransat.events.reload_data, function(event) {
			toolbar.state.refresh_sec = 0;
			toolbar.button_refresh.toggleClass('active', true).toggleClass('error', false);
			toolbar.handleTimer();
		});

		this.state.eventbus.on(opentransat.events.new_data, function(event, data) {
			toolbar.button_refresh.toggleClass('active', false).toggleClass('error', false);
			toolbar.state.refresh_sec = toolbar.update_interval_sec;
			if (toolbar.state.data === data) return;	//no update
			//initial sound will be skipped
			if (toolbar.state.notify_sound && toolbar.state.data != null) {
				toolbar.notify_sound.play();
			}

			toolbar.state.data = data;
		});

		this.state.eventbus.on(opentransat.events.new_data_error, function(event) {
			toolbar.button_refresh.toggleClass('active', false).toggleClass('error', true);
			toolbar.state.refresh_sec = Math.min(toolbar.update_interval_sec, 60);
		});

		setInterval(this.handleTimer.bind(this), 1000);

		//initially hide side bar for small screen devices
		if (window.innerWidth < 600) {
			this.set_side_button(false);
		}
	},

	set_side_button: function(state) {
		toolbar.state.side_open = state;
		toolbar.button_toggle_side.toggleClass('active', state);
	},

	handleTimer: function() {
		this.state.refresh_sec--;
		if (this.state.refresh_sec == 0) {
			this.state.eventbus.trigger(opentransat.events.reload_data);
		} else if (this.state.refresh_sec > 0) {
			this.button_refresh.html('&#x21bb; ' + opentransat.secToTime(this.state.refresh_sec));
		} else {
			this.button_refresh.html('&#x21bb; Loading');
		}
	}
}