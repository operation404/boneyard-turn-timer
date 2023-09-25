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
            if (PopoutTimer.automatic) PopoutTimer.setActive(true);
        });
    }

    static addControlButtons(controls) {
        const drawing_controls = controls.find((control_set) => control_set.name === 'token');
        drawing_controls.tools.push({
            name: 'timer-bar-popout',
            icon: 'fas fa-hourglass',
            title: 'CONTROLS.TIMER_BAR_POPOUT',
            onClick: () => {
                PopoutTimer.setActive(!PopoutTimer.active);
            },
            button: true,
        });
    }

    static setActive(active) {
        if (active !== PopoutTimer.active) {
            PopoutTimer.active = active;
            PopoutTimer.instance?.remove();
            if (PopoutTimer.active) PopoutTimer.instance = new PopoutTimer().render(true);
        }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard-turn-timer/templates/popout-timer.hbs`,
            id: CONST.MODULE,
            popOut: false,
        });
    }

    constructor(options = {}) {
        super(options);

        this.hookIds = ['combatTurn', 'combatRound'].map((hook) => {
            const id = Hooks.on(hook, () => this.updateBar.bind(this));
            return { hook: hook, id: id };
        });
    }

    getData() {
        return {
            appId: this.appId,
        };
    }

    _injectHTML(html) {
        $('body').append(html);
        this._element = html;
    }

    async _render(force = false, options = {}) {
        await super._render(force, options);
        this.updateBar();
        this._element[0].style.left = `${100}px`;
        this._element[0].style.top = `${100}px`;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    updateBar() {
        const bar = TurnTimer.instance?.newTimerBar();
        if (bar) this._element[0].querySelector('#by-timer-bar-container').insertAdjacentElement('afterbegin', bar);
    }

    remove() {
        this.hookIds.forEach((h) => Hooks.off(h.hook, h.id));
        this._element[0].remove();
        PopoutTimer.instance = null;
    }
}
