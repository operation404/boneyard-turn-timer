import * as CONST from './constants.js';
import { PopoutTimer } from './popout_timer.js';
import { TurnTimer } from './turn_timer.js';

const hex_test = /^#[0-9A-F]{6}$/i;

export function prepareSettings() {
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
            value = (value = Math.floor(value)) < TurnTimer.minTurnDuration ? TurnTimer.minTurnDuration : value;
            game.settings.set(CONST.MODULE, CONST.SETTINGS.DEFAULT_TURN_DURATION, value);
            TurnTimer.defaultDuration = value;
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
            TurnTimer.forceEndTurn = value;
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
            TurnTimer.parseCustomDurations(value);
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
            TurnTimer.warningThreshold = value;
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
            TurnTimer.toggleButtonElement = value;
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
            TurnTimer.generateBaseElement();
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
                game.settings.set(CONST.MODULE, CONST.SETTINGS.WARNING_COLOR, default_warning_glow_color);
            }
            TurnTimer.generateBaseElement();
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.WARNING_SOUND, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.WARNING_SOUND}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.WARNING_SOUND}`,
        scope: 'world',
        config: true,
        type: String,
        default: 'modules/boneyard-turn-timer/assets/warning_sound.ogg',
        requiresReload: false,
        onChange: (value) => {
            TurnTimer.setSound('warning', value);
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
            TurnTimer.setSound('turn_start', value);
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
            TurnTimer.setSound('next_up', value);
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.AUTO_POPOUT, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.AUTO_POPOUT}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.AUTO_POPOUT}`,
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        requiresReload: false,
        onChange: (value) => {
            PopoutTimer.automatic = value;
        },
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.POPOUT_POSITION, {
        scope: 'client',
        config: false,
        type: Object,
        requiresReload: false,
    });

    game.settings.register(CONST.MODULE, CONST.SETTINGS.POPOUT_WIDTH, {
        name: `SETTINGS.NAME.${CONST.SETTINGS.POPOUT_WIDTH}`,
        hint: `SETTINGS.HINT.${CONST.SETTINGS.POPOUT_WIDTH}`,
        scope: 'client',
        config: true,
        type: Number,
        default: 100,
        requiresReload: false,
        onChange: (value) => {
            game.settings.set(CONST.MODULE, CONST.SETTINGS.POPOUT_WIDTH, Math.clamped(value, 60, 500));
        },
    });
}
