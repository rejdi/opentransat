var side_bar = {
	button_markers: null,
	button_comments: null,
	panel: null,
	comment_panel: null,
	marker_panel: null,

	state: {
		screen: "markers",	//markers, comments
		eventbus: null,
		data: null,
		selected_marker_index: null,
		selected_comment_index: null
	},

	switch_screen: function(screen) {
		this.state.screen = screen;
		this.comment_panel.toggleClass('hidden', screen === 'markers');
		this.marker_panel.toggleClass('hidden', screen === 'comments');
		this.button_markers.toggleClass('selected', screen === 'markers');
		this.button_comments.toggleClass('selected', screen === 'comments');
	},

    is_element_visible: function(element, relativeTo) {
        var pos = element.position();

        return (
            pos.top >= relativeTo.scrollTop() &&
            pos.left >= relativeTo.scrollLeft() &&
            pos.top + element.outerHeight(true) <= relativeTo.scrollTop() + relativeTo.innerHeight() &&
            pos.left + element.outerWidth(true) <= relativeTo.scrollLeft() + relativeTo.innerWidth()
        );
    },

	init_sidebar: function(eventbus) {
		this.state.eventbus =  eventbus;
		this.button_markers = $('#tab-markers');
		this.button_comments = $('#tab-comments');
		this.panel = $('#rightPanel');
		this.comment_panel = $('#rightPanel .comments');
		this.marker_panel = $('#rightPanel .markers');

		var side_bar = this;

		this.button_comments.click(function() {
			side_bar.switch_screen('comments');
		});

		this.button_markers.click(function() {
			side_bar.switch_screen('markers');
		});

		this.comment_panel.on('click', '.comment', function(event) {
            if (window.innerWidth < 600) {
                side_bar.state.eventbus.trigger(opentransat.events.hide_side_pane);
            }
            side_bar.state.eventbus.trigger(opentransat.events.on_comment_selected, $(this).index());
		});

		this.marker_panel.on('click', '.marker', function(event, index) {
			//ak sme na mobile a klikame druhy krat na bod, skryjeme panel
            if (window.innerWidth < 600 && $(this).hasClass('selected')) {
                side_bar.state.eventbus.trigger(opentransat.events.hide_side_pane);
            }
            side_bar.state.eventbus.trigger(opentransat.events.on_marker_selected, $(this).attr('target'));
		});

		this.state.eventbus.on(opentransat.events.on_marker_selected, function (event, index) {
            side_bar.switch_screen('markers');
			side_bar.select_marker.bind(side_bar);
			side_bar.select_marker(index);
			side_bar.select_comment.bind(side_bar);
			side_bar.select_comment(null);
		});

		this.state.eventbus.on(opentransat.events.on_comment_selected, function (event, index) {
		    side_bar.switch_screen('comments');
			side_bar.select_comment.bind(side_bar);
			side_bar.select_comment(index);
			side_bar.select_marker.bind(side_bar);
			side_bar.select_marker(null);
		});

		this.state.eventbus.on(opentransat.events.hide_side_pane, this.hide_side_pane.bind(this));

		this.state.eventbus.on(opentransat.events.show_side_pane, this.open_side_pane.bind(this));

		this.state.eventbus.on(opentransat.events.new_data, this.set_new_data.bind(this));
	},

	open_side_pane: function() {
		this.panel.toggleClass('collapsed', false);
	},

	hide_side_pane: function() {
		this.panel.toggleClass('collapsed', true);
	},

	select_marker: function(index) {
		if (index === this.state.selected_marker_index) {
			return;
		}
		this.state.selected_marker_index = index;

		var that = this;
		//use less memory by setting less content
		this.marker_panel.children('.selected')
			.each(function(index, element) {
				var e = $(element),
					i = e.attr('target'),
					p = that.state.data[i],
					html = '<div class="header">' +
							opentransat.prepareLegendHeader(p) +
						'</div>';
				e.html(html);
			})
			.toggleClass('selected', false);

		if (index !== null) {
			var p = this.state.data[index];
			var html = '<div class="header">' +
				opentransat.prepareLegendHeader(p) +
				'</div>' +
				'<div class="content">' +
				opentransat.prepareLegend(p) +
				'</div>';

			var element = this.marker_panel.children('[target="' + index + '"]').toggleClass('selected', true).html(html);
			if (!this.is_element_visible(element, this.marker_panel)) {
	            this.marker_panel.stop(true).animate({
	                scrollTop: element.position().top
	            }, 500);
	        }
		}
	},

	select_comment: function(index) {
		if (index === this.state.selected_comment_index) {
			return;
		}
		this.state.selected_comment_index = index;

		this.comment_panel.children('.selected').toggleClass('selected', false);
		if (index !== null) {
	        var element = this.comment_panel.children(':eq(' + index + ')').toggleClass('selected', true);

	        if (!this.is_element_visible(element, this.comment_panel)) {
	            this.comment_panel.stop(true).animate({
	                scrollTop: element.position().top
	            }, 500);
	        }
		}
	},

	set_new_data: function(event, data) {
		if (data === this.state.data) return;	//nove data neprisli
		this.state.data = data;
		this.marker_panel.empty();
		this.comment_panel.empty();
		for (var i in data) {
			if (i == 'comments') {
				continue;
			}
			this.marker_panel.prepend(
				'<div class="marker" target="'+i+'">' +
					'<div class="header">' +
						opentransat.prepareLegendHeader(data[i]) +
					'</div>' +
				'</div>');
		}

		var that = this;
		if (data['comments']) {
			data['comments'].forEach(function (comment) {
				that.comment_panel.append('<div class="comment">' + opentransat.prepareComment(comment) + '</div>');
			});
		}
	}
};