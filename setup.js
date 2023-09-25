import * as CONST from './scripts/constants.js';
import { prepareSettings } from './scripts/settings.js';
import { TurnTimer } from './scripts/turn_timer.js';
import { PopoutTimer } from './scripts/popout_timer.js';

Hooks.once('init', async () =>
    loadTemplates([
        // main templates
        CONST.TIMER_TEMPLATE_PATH,
        CONST.CONTROL_TEMPLATE_PATH,
    ])
);
Hooks.once('init', prepareSettings);
Hooks.once('init', TurnTimer.init);
Hooks.once('init', PopoutTimer.init);
