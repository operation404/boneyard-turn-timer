import * as CONST from './constants.js';
import { Turn_Timer } from './turn_timer.js';

export function prepare_settings() {
	game.settings.register(CONST.MODULE, CONST.SETTING_DEFAULT_TURN_DURATION, {
		name: `SETTINGS.NAME.${CONST.SETTING_DEFAULT_TURN_DURATION}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_DEFAULT_TURN_DURATION}`,
		scope: 'world',
		config: true,
		type: Number,
		default: 60,
		requiresReload: false,
		onChange: (value) => {
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

	game.settings.register(CONST.MODULE, CONST.SETTING_BAR_COLOR, {
		name: `SETTINGS.NAME.${CONST.SETTING_BAR_COLOR}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_BAR_COLOR}`,
		scope: 'world',
		config: true,
		type: String,
		default: '#D0D000',
		requiresReload: false,
		onChange: (value) => {},
	});

	game.settings.register(CONST.MODULE, CONST.SETTING_WARNING_COLOR, {
		name: `SETTINGS.NAME.${CONST.SETTING_WARNING_COLOR}`,
		hint: `SETTINGS.HINT.${CONST.SETTING_WARNING_COLOR}`,
		scope: 'world',
		config: true,
		type: String,
		default: '#FF0000',
		requiresReload: false,
		onChange: (value) => {},
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
		onChange: (value) => {},
	});

	// warning sound

	// start of turn noise

	// you're up next turn alert on or off

	// you're up next turn sound
}
