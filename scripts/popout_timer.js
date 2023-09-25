import * as CONST from './constants.js';
import { TurnTimer } from './turn_timer.js';

export class PopoutTimer extends Application {
    static active;
    static instance;
    static automatic;
    static position = {
        x: null,
        y: null,
    };

    static init() {
        PopoutTimer.prepareInitData();
        PopoutTimer.prepareHooks();
    }

    static prepareInitData() {}

    static prepareHooks() {
        Hooks.on('getSceneControlButtons', (controls) => PopoutTimer.addControlButtons(controls));
        Hooks.on('combatStart', (combat, updateData) => {
            if (PopoutTimer.automatic) {
                TurnTimer.instance.createPairedPopout();
            }
        });
    }

    static addControlButtons(controls) {
        const drawing_controls = controls.find((control_set) => control_set.name === 'token');
        drawing_controls.tools.push({
            name: 'timer-bar-popout',
            icon: 'fas fa-hourglass',
            title: 'CONTROLS.TIMER_BAR_POPOUT',
            onClick: () => {
                PopoutTimer.toggleActive();
            },
            button: true,
        });
    }

    static toggleActive() {
        //new PopoutTimer().render(true);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard-turn-timer/templates/popout-timer.hbs`,
            id: CONST.MODULE,
            popOut: false,
        });
    }

    constructor(timerBar, options = {}) {}

    getData() {}

    _injectHTML(html) {
        $('body').append(html);
        this._element = html;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
