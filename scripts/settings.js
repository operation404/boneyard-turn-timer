import * as CONST from './constants.js';
import { Turn_Timer } from './turn_timer.js';

const hex_test = /^#[0-9A-F]{6}$/i;

export function prepare_settings() {
	game.settings.register(CONST.MODULE, CONST.SETTING_ACTIVE, {
		scope: 'world',
		config: false,
		type: Boolean,
		default: true,
		requiresReload: false,
	});

	game.settings.register(CONST.MODULE, CONST.SETTING_DEFAULT_TURN_DURATION, {
		name: `SETTINGS.NAME.${CONST.SETTING_DEFAULT_TURN_DURATION}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_DEFAULT_TURN_DURATION}`,
		scope: 'world',
		config: true,
		type: Number,
		default: 60,
		requiresReload: false,
		onChange: (value) => {
			value = (value = Math.floor(value)) < Turn_Timer.min_turn_duration ? Turn_Timer.min_turn_duration : value;
			game.settings.set(CONST.MODULE, CONST.SETTING_DEFAULT_TURN_DURATION, value);
			Turn_Timer.default_duration = value;
		},
	});

	game.settings.register(CONST.MODULE, CONST.SETTING_FORCE_TURN_CHANGE, {
		name: `SETTINGS.NAME.${CONST.SETTING_FORCE_TURN_CHANGE}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_FORCE_TURN_CHANGE}`,
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.force_end_turn = value;
		},
	});

	game.settings.register(CONST.MODULE, CONST.SETTING_CUSTOM_TURN_DURATIONS, {
		name: `SETTINGS.NAME.${CONST.SETTING_CUSTOM_TURN_DURATIONS}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_CUSTOM_TURN_DURATIONS}`,
		scope: 'world',
		config: true,
		type: String,
		default: '',
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.parse_custom_durations(value);
		},
	});

	const default_bar_color = '#D0D000';
	game.settings.register(CONST.MODULE, CONST.SETTING_BAR_COLOR, {
		name: `SETTINGS.NAME.${CONST.SETTING_BAR_COLOR}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_BAR_COLOR}`,
		scope: 'world',
		config: true,
		type: String,
		default: default_bar_color,
		requiresReload: false,
		onChange: (value) => {
			if (!hex_test.test(value)) {
				game.settings.set(CONST.MODULE, CONST.SETTING_BAR_COLOR, default_bar_color);
			}
			Turn_Timer.generate_base_element();
		},
	});

	// What percentage of time left on the timer to give a warning
	// -0.05 doesn't warn at all
	// 0 warns as timer is finished
	game.settings.register(CONST.MODULE, CONST.SETTING_WARNING_THRESHOLD, {
		name: `SETTINGS.NAME.${CONST.SETTING_WARNING_THRESHOLD}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_WARNING_THRESHOLD}`,
		scope: 'world',
		config: true,
		type: Number,
		default: 0.5,
		range: {
			min: -0.05,
			max: 1.0,
			step: 0.05,
		},
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.warning_threshold = value;
		},
	});

	const default_warning_glow_color = '#FF0000';
	game.settings.register(CONST.MODULE, CONST.SETTING_WARNING_COLOR, {
		name: `SETTINGS.NAME.${CONST.SETTING_WARNING_COLOR}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_WARNING_COLOR}`,
		scope: 'world',
		config: true,
		type: String,
		default: default_warning_glow_color,
		requiresReload: false,
		onChange: (value) => {
			if (!hex_test.test(value)) {
				game.settings.set(CONST.MODULE, CONST.SETTING_WARNING_COLOR, default_warning_glow_color);
			}
			Turn_Timer.generate_base_element();
		},
	});

	// warning sound

	// start of turn noise

	// you're up next turn alert on or off

	// you're up next turn sound
}
