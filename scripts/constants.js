export const MODULE = 'boneyard-turn-timer';
export const SOCKET = 'module.boneyard-turn-timer';

export const TIMER_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/timer-bar.hbs';
export const CONTROL_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/toggle-control.hbs';

const settings = [
    'ACTIVE',
    'FORCE_TURN_CHANGE',
    'DEFAULT_TURN_DURATION',
    'CUSTOM_TURN_DURATIONS',
    'BAR_COLOR',
    'WARNING_THRESHOLD',
    'WARNING_COLOR',
    'WARNING_SOUND',
    'TURN_START_SOUND',
    'NEXT_UP_ALERT',
    'NEXT_UP_SOUND',
    'AUTO_POPOUT',
    'POPOUT_POSITION',
];
export const SETTINGS = Object.freeze(Object.fromEntries(settings.map((v) => [v, v])));
