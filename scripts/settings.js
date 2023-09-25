import * as CONST from './constants.js';
import { Turn_Timer } from './turn_timer.js';

const hex_test = /^#[0-9A-F]{6}$/i;

export function prepare_settings() {
    game.settings.register(CONST.MODULE, CONST.SETTINGS.ACTIVE, {
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
        requiresReload: false,
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.DEFAULT_TURN_DURATION, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.DEFAULT_TURN_DURATION}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.DEFAULT_TURN_DURATION}`,
        scope: 'world',
        config: true,
        type: Number,
        default: 60,
        requiresReload: false,
        onChange: (value) => {
            value = (value = Math.floor(value)) < Turn_Timer.min_turn_duration ? Turn_Timer.min_turn_duration : value;
            game.settings.set(CONST.MODULE, CONST.SETTINGS.DEFAULT_TURN_DURATION, value);
            Turn_Timer.default_duration = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.FORCE_TURN_CHANGE, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.FORCE_TURN_CHANGE}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.FORCE_TURN_CHANGE}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.force_end_turn = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.CUSTOM_TURN_DURATIONS, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.CUSTOM_TURN_DURATIONS}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.CUSTOM_TURN_DURATIONS}`,
        scope: 'world',
        config: true,
        type: String,
        default: '',
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.parse_custom_durations(value);
        },
    });

    // What percentage of time left on the timer to give a warning
    // 0 warns as timer is finished, -0.05 doesn't warn at all
    game.settings.register(CONST.MODULE, CONST.SETTINGS.WARNING_THRESHOLD, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.WARNING_THRESHOLD}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.WARNING_THRESHOLD}`,
        scope: 'world',
        config: true,
        type: Number,
        default: 0.25,
        range: {
            min: -0.05,
            max: 1.0,
            step: 0.05,
        },
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.warning_threshold = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.NEXT_UP_ALERT, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.NEXT_UP_ALERT}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.NEXT_UP_ALERT}`,
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.toggle_button_element = value;
        },
    });

    const default_bar_color = '#D0D000';
    game.settings.register(CONST.MODULE, CONST.SETTINGS.BAR_COLOR, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.BAR_COLOR}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.BAR_COLOR}`,
        scope: 'world',
        config: true,
        type: String,
        default: default_bar_color,
        requiresReload: false,
        onChange: (value) => {
            if (!hex_test.test(value)) {
                game.settings.set(CONST.MODULE, CONST.SETTINGS.BAR_COLOR, default_bar_color);
            }
            Turn_Timer.generate_base_element();
        },
    });

    const default_warning_glow_color = '#FF0000';
    game.settings.register(CONST.MODULE, CONST.SETTINGS.WARNING_COLOR, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.WARNING_COLOR}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.WARNING_COLOR}`,
        scope: 'world',
        config: true,
        type: String,
        default: default_warning_glow_color,
        requiresReload: false,
        onChange: (value) => {
            if (!hex_test.test(value)) {
                game.settings.set(CONST.MODULE, CONST.SETTING_WARNING_COLOR, default_warning_glow_color);
            }
            Turn_Timer.generate_base_element();
        },
    });

    game.settings.register(CONST.MODULE, CONST.CONST.SETTINGS.WARNING_SOUND, {
        name: `SETTINGS.NAME.${CONST.CONST.SETTINGS.WARNING_SOUND}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.WARNING_SOUND}`,
        scope: 'world',
        config: true,
        type: String,
        default: 'modules/boneyard-turn-timer/assets/warning_sound.ogg',
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.set_sound('warning', value);
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.TURN_START_SOUND, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.TURN_START_SOUND}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.TURN_START_SOUND}`,
        scope: 'world',
        config: true,
        type: String,
        default: 'modules/boneyard-turn-timer/assets/turn_start_sound.ogg',
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.set_sound('turn_start', value);
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.NEXT_UP_SOUND, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.NEXT_UP_SOUND}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.NEXT_UP_SOUND}`,
        scope: 'world',
        config: true,
        type: String,
        default: 'modules/boneyard-turn-timer/assets/next_up_sound.ogg',
        requiresReload: false,
        onChange: (value) => {
            Turn_Timer.set_sound('next_up', value);
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.AUTO_POPOUT, {
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false,
    });
}
