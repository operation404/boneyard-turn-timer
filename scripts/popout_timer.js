import * as CONST from './constants.js';
import { TurnTimer } from './turn_timer.js';

export class PopoutTimer extends Application {
    static instance = null;
    static automatic;
    static position = {
        x: null,
        y: null,
    };

    // ------------------------------------------------------------------------
    // Class methods

    static init() {
        PopoutTimer.prepareInitData();
        PopoutTimer.prepareHooks();
    }

    static prepareInitData() {
        let userPositionSettings = game.settings.get(CONST.MODULE, CONST.SETTINGS.POPOUT_POSITION) ?? {};
        PopoutTimer.position.x = userPositionSettings.x ?? 0;
        PopoutTimer.position.y = userPositionSettings.y ?? 0;
    }

    static prepareHooks() {
        Hooks.on('getSceneControlButtons', (controls) => PopoutTimer.addControlButtons(controls));
        Hooks.on('combatStart', (combat, updateData) => {
            if (PopoutTimer.automatic) PopoutTimer.managePopout(true);
        });
    }

    static addControlButtons(controls) {
        const drawing_controls = controls.find((control_set) => control_set.name === 'token');
        drawing_controls.tools.push({
            name: 'timer-bar-popout',
            icon: 'fas fa-hourglass',
            title: 'CONTROLS.TIMER_BAR_POPOUT',
            onClick: () => {
                PopoutTimer.managePopout(!PopoutTimer.instance);
            },
            button: true,
        });
    }

    static managePopout(create = false) {
        if (create) {
            if (PopoutTimer.instance === null) {
                PopoutTimer.instance = new PopoutTimer().render(true);
            }
        } else {
            PopoutTimer.instance?.remove();
        }
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard-turn-timer/templates/popout-timer.hbs`,
            id: CONST.MODULE,
            popOut: false,
        });
    }

    // ------------------------------------------------------------------------
    // Instance methods

    constructor(options = {}) {
        super(options);
        this.hookID = Hooks.on('byCreateTurnTimer', this.getNewTurnBar.bind(this));
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
        this._element[0].style.left = `${PopoutTimer.position.x}px`;
        this._element[0].style.top = `${PopoutTimer.position.y}px`;
        if (TurnTimer.instance) this.getNewTurnBar(TurnTimer.instance);
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    getNewTurnBar(turnTimer) {
        const bar = turnTimer.newTimerBar();
        if (bar) {
            this._element[0].querySelector('#by-timer-bar-container').insertAdjacentElement('afterbegin', bar);
        } else {
            console.error('Error: failed to get new timer bar from TurnTimer instance.', turnTimer);
        }
    }

    remove() {
        Hooks.off('byCreateTurnTimer', this.hookID);
        this._element[0].remove();
        // TODO
        // Not sure if this is the best method of handling this, may
        // want to save new xy as they're updated during a drag event
        // on the off chance the user closes the window without the
        // popout being removed, as I'm not sure if it will save
        // the settings without being closed properly.
        game.settings.set(CONST.MODULE, CONST.SETTINGS.POPOUT_POSITION, TurnTimer.position);
        PopoutTimer.instance = null;
    }
}
