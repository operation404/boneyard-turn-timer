import { MODULE, TEMPLATE_PATH, SETTING_DEFAULT_TURN_DURATION, SETTING_CUSTOM_TURN_DURATIONS } from './scripts/constants.js';
import { prepare_settings } from './scripts/settings.js';
import { Turn_Timer } from './scripts/turn_timer.js';

Hooks.once('init', async () =>
	loadTemplates([
		// main templates
		TEMPLATE_PATH,
	])
);
Hooks.once('init', prepare_settings);
Hooks.once('init', Turn_Timer.init);
