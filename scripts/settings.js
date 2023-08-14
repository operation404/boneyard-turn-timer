import { MODULE, SETTING_DEFAULT_TURN_DURATION, SETTING_CUSTOM_TURN_DURATIONS } from './constants.js';
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
		onChange: (value) => {},
	});

	game.settings.register(MODULE, SETTING_CUSTOM_TURN_DURATIONS, {
		name: 'SETTINGS.NAME.custom_turn_durations',
		hint: 'SETTINGS.HINT.custom_turn_durations',
		scope: 'world',
		config: true,
		type: String,
		default: '',
		requiresReload: false,
		onChange: (value) => {},
	});
}
