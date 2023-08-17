import {
	MODULE,
	SETTING_DEFAULT_TURN_DURATION,
	SETTING_FORCE_TURN_CHANGE,
	SETTING_CUSTOM_TURN_DURATIONS,
} from './constants.js';
import { Turn_Timer } from './turn_timer.js';

export function prepare_settings() {
	game.settings.register(MODULE, SETTING_DEFAULT_TURN_DURATION, {
		name: 'SETTINGS.NAME.default_turn_duration',
		hint: 'SETTINGS.HINT.default_turn_duration',
		scope: 'world',
		config: true,
		type: Number,
		default: 60,
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.default_duration = value;
		},
	});

	game.settings.register(MODULE, SETTING_FORCE_TURN_CHANGE, {
		name: 'SETTINGS.NAME.force_turn_change',
		hint: 'SETTINGS.HINT.force_turn_change',
		scope: 'world',
		config: true,
		type: Boolean,
		default: true,
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.force_end_turn = value;
		},
	});

	game.settings.register(MODULE, SETTING_CUSTOM_TURN_DURATIONS, {
		name: 'SETTINGS.NAME.custom_turn_durations',
		hint: 'SETTINGS.HINT.custom_turn_durations',
		scope: 'world',
		config: true,
		type: String,
		default: '',
		requiresReload: false,
		onChange: (value) => {
			Turn_Timer.parse_custom_durations(value);
		},
	});

	// warn player their turn is coming up
	// this should give a warning at the time the player before them is acting
	// and when the token before them is acting, but don't play 2 noises if
	// the token before them is owned by a player

	// bar color

	// background color

	// warning 1 time

	// warning 1 sound

	// warning 1 volume?

	// ... the same but for a second warning, if they want it
}
