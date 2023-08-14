import { prepare_settings } from './scripts/settings.js';
import { Turn_Timer } from './scripts/turn_timer.js';

Hooks.once('init', async function () {
	await (async () =>
		/*return*/ loadTemplates([
			// main templates
			//'modules/boneyard-drawing-tools/templates/quick-draw-config.hbs',
		]))();
});
Hooks.once('init', prepare_settings);
Hooks.once('init', Turn_Timer.init);
