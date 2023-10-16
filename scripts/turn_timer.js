import * as CONST from './constants.js';
import { applyCustomStyling } from './helpers.js';

export class TurnTimer {
    static active;
    static instance = null;
    static toggleButtons = [];
    static defaultDuration;
    static forceEndTurn;
    static customDurations;
    static element;
    static barColor;
    static warningThreshold;
    static warningGlowColor;
    static toggleButtonElement;
    static nextUpAlert;
    static sound = {
        warning: null,
        turnStart: null,
        nextUp: null,
    };

    // ------------------------------------------------------------------------
    // Socket methods

    /*
		payload has to be the only argument if I wish to keep it an object, if
		multiple arguments are passed and some are objects they are automatically
		unfolded and their properties are passed as individual arguments as well.
		But if there's only one argument that is an object, it is properly
		preserved and received as an object on the other side. Keeping it as
		an object is desirable when there are multiple methods that the
		socket is responsible for as they may have differing amounts of args.

		This behavior seems specific to Foundry's import/implementation of
		socket io v4, as the docs suggest any arg can be an object and be
		properly serialized and preserved, no weird unfolding should occur.
	*/

    static _onReceived(payload) {
        const handlers = {
            attach: TurnTimer._injectNextUpdate,
            active: TurnTimer._toggleActive,
        };
        if (handlers[payload.type] === undefined) throw new Error('socket unknown type');
        handlers[payload.type](payload);
    }

    static _injectNextUpdate(payload) {
        TurnTimer.instance?.remove();
        const combat = game.combats.get(payload.combatID);

        if (combat?.isActive) {
            Hooks.once('updateCombat', (combat, change, options, userID) => {
                function getOwners(actor) {
                    const ownership = actor?.ownership ?? {};
                    return ownership.default === 3
                        ? // If default is set to 3 (ownership), get all non-GM users
                          game.users.contents.filter((user) => !user.isGM).map((user) => user.id)
                        : // Otherwise, filter out all users that are GMs or don't have ownership permission
                          Object.keys(ownership).filter(
                              (id) => game.users.get(id)?.isGM === false && ownership[id] === 3
                          );
                }

                const currentOwners = getOwners(game.actors.get(combat.combatant?.actorId));

                // Don't notify players who act next round if they're already acting this round
                const nextUpOwners = getOwners(game.actors.get(combat.nextCombatant?.actorId)).filter(
                    (userID) => !currentOwners.includes(userID)
                );
                TurnTimer.playSound('next_up', nextUpOwners);
                TurnTimer.sendAlert(nextUpOwners);

                // if 0, gm owns token, don't make timer
                if (currentOwners.length > 0) TurnTimer.instance = new TurnTimer(currentOwners, combat);
            });
        }
    }

    static _toggleActive(payload) {
        TurnTimer.active = !TurnTimer.active;
        TurnTimer.toggleTimerHooks();
        TurnTimer.instance?.remove();

        // Remove toggle buttons not in DOM, update the ones that still are
        (TurnTimer.toggleButtons = TurnTimer.toggleButtons.filter((b) => document.body.contains(b))).forEach((b) => {
            b.style['text-shadow'] = TurnTimer.active ? '0 0 8px blue' : null;
            b.dataset.tooltip = `Toggle turn timers ${TurnTimer.active ? 'off' : 'on'}`;
        });
    }

    // ------------------------------------------------------------------------
    // Class methods

    static async init() {
        await TurnTimer.prepareInitData();
        TurnTimer.prepareHooks();
        console.log(`====== Boneyard ======\n - Turn timer initialized`);
    }

    static async prepareInitData() {
        TurnTimer.active = game.settings.get(CONST.MODULE, CONST.SETTINGS.ACTIVE);

        TurnTimer.defaultDuration = game.settings.get(CONST.MODULE, CONST.SETTINGS.DEFAULT_TURN_DURATION);
        TurnTimer.forceEndTurn = game.settings.get(CONST.MODULE, CONST.SETTINGS.FORCE_TURN_CHANGE);
        TurnTimer.warningThreshold = game.settings.get(CONST.MODULE, CONST.SETTINGS.WARNING_THRESHOLD);
        TurnTimer.nextUpAlert = game.settings.get(CONST.MODULE, CONST.SETTINGS.NEXT_UP_ALERT);

        await TurnTimer.generateBaseElement();
        const element_template = document.createElement('template');
        element_template.innerHTML = await renderTemplate(CONST.CONTROL_TEMPLATE_PATH, {});
        TurnTimer.toggleButtonElement = element_template.content.firstChild;
    }

    static async generateBaseElement() {
        TurnTimer.barColor = game.settings.get(CONST.MODULE, CONST.SETTINGS.BAR_COLOR);
        TurnTimer.warningGlowColor = game.settings.get(CONST.MODULE, CONST.SETTINGS.WARNING_COLOR);
        const element_template = document.createElement('template');
        element_template.innerHTML = await renderTemplate(CONST.TIMER_TEMPLATE_PATH, {
            bar_color: TurnTimer.barColor,
            warning_glow_color: TurnTimer.warningGlowColor,
        });
        TurnTimer.element = element_template.content.firstChild;
    }

    static async setSound(setting, path) {
        const sound = new Sound(path);
        await sound.load();
        TurnTimer.sound[setting] = sound.failed ? null : sound;
    }

    static prepareHooks() {
        Hooks.once('ready', () => {
            TurnTimer.prepareReadyData();
            if (game.user.isGM) Hooks.on('renderCombatTracker', TurnTimer.attachToggleButton);
            if (TurnTimer.active) TurnTimer.toggleTimerHooks();
            game.socket.on(CONST.SOCKET, TurnTimer._onReceived);
        });
    }

    // Some data requires the game to have finished initializing before preparing
    // in order to access various Foundry methods/documents
    static prepareReadyData() {
        TurnTimer.parseCustomDurations(game.settings.get(CONST.MODULE, CONST.SETTINGS.CUSTOM_TURN_DURATIONS));
        TurnTimer.setSound('warning', game.settings.get(CONST.MODULE, CONST.SETTINGS.WARNING_SOUND));
        TurnTimer.setSound('turn_start', game.settings.get(CONST.MODULE, CONST.SETTINGS.TURN_START_SOUND));
        TurnTimer.setSound('next_up', game.settings.get(CONST.MODULE, CONST.SETTINGS.NEXT_UP_SOUND));
    }

    static toggleTimerHooks() {
        const hook_fn = (TurnTimer.active ? Hooks.on : Hooks.off).bind(Hooks);
        hook_fn('combatStart', TurnTimer.attachTimer);
        hook_fn('combatTurn', TurnTimer.attachTimer);
        hook_fn('combatRound', TurnTimer.attachTimer);
    }

    // format: "example name 1" 30, "example name 2" 45
    static parseCustomDurations(str) {
        TurnTimer.customDurations = {};
        str.split(',').forEach((token) => {
            let [, name, time] = token.split(`"`);
            if (
                (name = name?.trim()) !== undefined &&
                (name = game.users.find((u) => u.name === name)?.id) !== undefined &&
                !isNaN((time = parseInt(time)))
            ) {
                TurnTimer.customDurations[name] = Math.max(time, CONST.MINIMUM_TURN_DURATION);
            }
        });
    }

    static attachTimer(combat, updateData, updateOptions) {
        const payload = { sender: game.user.id, type: 'attach', combatID: combat.id };
        game.socket.emit(CONST.SOCKET, payload);
        TurnTimer._injectNextUpdate(payload);
    }

    static attachToggleButton(combatTracker, html, data) {
        const new_node = TurnTimer.toggleButtonElement.cloneNode(true);
        const round_counter_label = html[0].querySelector(`h3.encounter-title`);
        round_counter_label.insertAdjacentElement('beforebegin', new_node);
        round_counter_label.style['margin-left'] = 0;
        new_node.addEventListener('click', TurnTimer.toggleButtonHandler);
        if (TurnTimer.active) {
            new_node.style['text-shadow'] = '0 0 8px blue';
            new_node.dataset.tooltip = 'Toggle turn timers off';
        }
        TurnTimer.toggleButtons.push(new_node);
    }

    static toggleButtonHandler(e) {
        const payload = { sender: game.user.id, type: 'active' };
        game.socket.emit(CONST.SOCKET, payload);
        TurnTimer._toggleActive(payload);
        game.settings.set(CONST.MODULE, CONST.SETTING_ACTIVE, TurnTimer.active);
    }

    static async playSound(sound, users) {
        if (TurnTimer.sound[sound] !== null && users.includes(game.user.id)) {
            Object.entries(TurnTimer.sound).forEach(([, sound]) => sound?.stop());
            if (!TurnTimer.sound[sound].loaded) await TurnTimer.sound[sound].load();
            TurnTimer.sound[sound].play({ volume: game.settings.get('core', 'globalInterfaceVolume') });
        }
    }

    static sendAlert(users) {
        if (TurnTimer.nextUpAlert && users.includes(game.user.id)) {
            ChatMessage.create({
                user: game.user.id,
                content: 'Your turn is up next!',
                whisper: [game.user.id],
            });
        }
    }

    // ------------------------------------------------------------------------
    // Instance methods

    constructor(owners, combat) {
        this.combat = combat;
        this.owners = owners;
        this.calculateLifespan();
        this.warning_not_triggered = true;
        this.progress = 0;
        this.bars = [];

        this.hookID = Hooks.on('renderCombatTracker', (combatTracker, html, data) => {
            if (this.combat.id === combatTracker.viewed?.id) {
                html[0].querySelector(`nav#combat-controls`).insertAdjacentElement('beforebegin', this.newTimerBar());
            }
        });
        Hooks.once('deleteCombat', (combat, updateData) => this.remove());

        Hooks.callAll('byCreateTurnTimer', this);

        TurnTimer.playSound('turn_start', this.owners);
        this.intervalID = setInterval(this.updateTimerBars.bind(this), CONST.INTERVAL_STEP);
    }

    calculateLifespan() {
        this.lifespan =
            this.owners.reduce((time, userID) => {
                return Math.max(time, TurnTimer.customDurations[userID] ?? TurnTimer.defaultDuration);
            }, 0) * 1000;
    }

    newTimerBar(customStyling) {
        const newNode = TurnTimer.element.cloneNode(true);
        this.setElementStyle(newNode);
        if (customStyling) applyCustomStyling(newNode, customStyling);
        this.bars.push(newNode);
        return newNode;
    }

    setElementStyle(timer) {
        timer.querySelector('span.by-timer-text').textContent = `${Math.floor(
            (this.lifespan - this.progress) / 1000
        )}s`;
        timer.querySelector('div.by-timer-bar').style['width'] = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;
        timer.querySelector('div.by-bar-warning').style['animation-name'] = this.warning_not_triggered
            ? 'none'
            : 'by-pulse-glow';
    }

    updateTimerBars() {
        if (!game.paused) {
            this.progress += CONST.INTERVAL_STEP;

            if (
                this.warning_not_triggered &&
                TurnTimer.warningThreshold >= 0 &&
                (this.lifespan - this.progress) / this.lifespan <= TurnTimer.warningThreshold
            ) {
                this.warning_not_triggered = false;
                TurnTimer.playSound('warning', this.owners);
            }

            // Remove timers not in DOM, update the ones that still are
            (this.bars = this.bars.filter((t) => document.body.contains(t))).forEach((t) => this.setElementStyle(t));

            // Timer is finished, stop updating
            if (this.progress >= this.lifespan) {
                if (TurnTimer.forceEndTurn) {
                    this.remove();
                    if (
                        // only let the client belonging to the online GM with highest id end the turn
                        game.user.id ===
                        game.users.reduce((a, b) => {
                            return b.active && b.isGM && b.id > a ? b.id : a;
                        }, '')
                    ) {
                        this.combat.nextTurn();
                    }
                } else {
                    clearInterval(this.intervalID);
                }
            }
        }
    }

    remove() {
        clearInterval(this.intervalID);
        Hooks.off('renderCombatTracker', this.hookID);
        this.bars.forEach((t) => t.remove());
        TurnTimer.instance = null;
    }
}
