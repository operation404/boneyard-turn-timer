import * as CONST from './scripts/constants.js';
import { prepare_settings } from './scripts/settings.js';
import { Turn_Timer } from './scripts/turn_timer.js';

Hooks.once('init', async () =>
    loadTemplates([
        // main templates
        CONST.TIMER_TEMPLATE_PATH,
        CONST.CONTROL_TEMPLATE_PATH,
    ])
);
Hooks.once('init', prepare_settings);
Hooks.once('init', Turn_Timer.init);
