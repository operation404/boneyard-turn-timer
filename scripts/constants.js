export const MODULE = 'boneyard-turn-timer';
export const SOCKET = 'module.boneyard-turn-timer';

export const TIMER_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/timer-bar.hbs';
export const CONTROL_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/toggle-control.hbs';

export const SETTING_ACTIVE = 'active';

export const SETTING_FORCE_TURN_CHANGE = 'force_turn_change';
export const SETTING_DEFAULT_TURN_DURATION = 'default_turn_duration';
export const SETTING_CUSTOM_TURN_DURATIONS = 'custom_turn_durations';
export const SETTING_BAR_COLOR = 'bar_color';

export const SETTING_WARNING_THRESHOLD = 'warning_threshold';
export const SETTING_WARNING_COLOR = 'warning_color';
export const SETTING_WARNING_SOUND = 'warning_sound';

export const SETTING_TURN_START_SOUND = 'turn_start_sound';

export const SETTING_NEXT_UP_ALERT = 'next_up_alert';
export const SETTING_NEXT_UP_SOUND = 'next_up_sound';

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
];
export const SETTINGS = Object.freeze(Object.fromEntries(settings.map((v) => [v, v])));
