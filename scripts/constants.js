export const MODULE = 'boneyard-turn-timer';
export const SOCKET = 'module.boneyard-turn-timer';
export const TIMER_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/timer-bar.hbs';
export const CONTROL_TEMPLATE_PATH = 'modules/boneyard-turn-timer/templates/toggle-control.hbs';

export const SETTINGS = Object.freeze(
    Object.fromEntries(
        [
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
            'POPOUT_WIDTH',
        ].map((v) => [v, v])
    )
);

export const INTERVAL_STEP = 25; // milliseconds
export const MINIMUM_TURN_DURATION = 1; // seconds
export const DEFAULT_BAR_COLOR = '#D0D000';
export const DEFAULT_WARNING_GLOW_COLOR = '#FF0000';
export const MINIMUM_BAR_WIDTH = 60;
export const MAXIMUM_BAR_WIDTH = 500;
