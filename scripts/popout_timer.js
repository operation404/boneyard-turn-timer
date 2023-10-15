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
        const userPositionSettings = game.settings.get(CONST.MODULE, CONST.SETTINGS.POPOUT_POSITION);
        PopoutTimer.position.x = userPositionSettings?.x ?? 0;
        PopoutTimer.position.y = userPositionSettings?.y ?? 0;
        PopoutTimer.automatic = game.settings.get(CONST.MODULE, CONST.SETTINGS.AUTO_POPOUT);
    }

    static prepareHooks() {
        Hooks.on('getSceneControlButtons', (controls) => PopoutTimer.addControlButtons(controls));
        Hooks.on('combatStart', (combat, updateData) => {
            if (PopoutTimer.automatic) PopoutTimer.managePopout(true);
        });
        Hooks.on('deleteCombat', (combat, updateData) => {
            if (PopoutTimer.automatic) PopoutTimer.managePopout(false);
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
        this.makeDraggable();

        const control_button_handlers = {
            nextTurn: (e) => {
                if (game.combat.turns[game.combat.turn].players.includes(game.user)) game.combat.nextTurn();
            },
            closePopout: (e) => {
                this.remove();
            },
        };

        html[0].querySelectorAll('a.by-timer-control-button').forEach((button) => {
            button.addEventListener('click', control_button_handlers[button.dataset.action]);
        });
    }

    // TODO make sure popout opens on combat start/creation ?
    // also make popout close when the combat is deleted?

    getNewTurnBar(turnTimer) {
        const bar = turnTimer.newTimerBar({ '': { borderTop: 'none' } });
        if (bar) {
            this._element[0].querySelector('#by-timer-bar-container').insertAdjacentElement('afterbegin', bar);
        } else {
            console.error('Error: failed to get new timer bar from TurnTimer instance.', turnTimer);
        }
    }

    makeDraggable() {
        let popout = this._element[0];
        let lastX, lastY;

        function mouseDownHandler(e) {
            e.preventDefault();
            lastX = e.clientX;
            lastY = e.clientY;
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        }

        function mouseMoveHandler(e) {
            e.preventDefault();
            PopoutTimer.position.x -= lastX - e.clientX;
            PopoutTimer.position.y -= lastY - e.clientY;
            lastX = e.clientX;
            lastY = e.clientY;
            popout.style.left = `${PopoutTimer.position.x}px`;
            popout.style.top = `${PopoutTimer.position.y}px`;
            game.settings.set(CONST.MODULE, CONST.SETTINGS.POPOUT_POSITION, PopoutTimer.position);
        }

        function mouseUpHandler(e) {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }

        popout.addEventListener('mousedown', mouseDownHandler);
    }

    remove() {
        Hooks.off('byCreateTurnTimer', this.hookID);
        this._element[0].remove();
        PopoutTimer.instance = null;
    }
}
