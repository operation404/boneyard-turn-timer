import * as CONST from './constants.js';

export class Turn_Timer {
    static interval = 25; // milliseconds
    static min_turn_duration = 1; // seconds

    static active;
    static toggle_buttons = [];
    static default_duration;
    static force_end_turn;
    static custom_durations;
    static element;
    static timer;
    static bar_color;
    static warning_threshold;
    static warning_glow_color;
    static toggle_button_element;
    static next_up_alert;
    static sound = {
        warning: null,
        turn_start: null,
        next_up: null,
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

    static _on_received(payload) {
        const handlers = {
            attach: Turn_Timer._inject_next_update,
            active: Turn_Timer._toggle_active,
        };
        if (handlers[payload.type] === undefined) throw new Error('socket unknown type');
        handlers[payload.type](payload);
    }

    static _inject_next_update(payload) {
        Turn_Timer.timer?.remove();
        const combat = game.combats.get(payload.combatID);

        if (combat?.isActive) {
            Hooks.once('updateCombat', (combat, change, options, userID) => {
                function get_owners(actor) {
                    const ownership = actor?.ownership ?? {};
                    return ownership.default === 3
                        ? // If default is set to 3 (ownership), get all non-GM users
                          game.users.contents.filter((user) => !user.isGM).map((user) => user.id)
                        : // Otherwise, filter out all users that are GMs or don't have ownership permission
                          Object.keys(ownership).filter(
                              (id) => game.users.get(id)?.isGM === false && ownership[id] === 3
                          );
                }

                const current_owners = get_owners(game.actors.get(combat.combatant?.actorId));

                // Don't notify players who act next round if they're already acting this round
                const next_up_owners = get_owners(game.actors.get(combat.nextCombatant?.actorId)).filter(
                    (userID) => !current_owners.includes(userID)
                );
                Turn_Timer.play_sound('next_up', next_up_owners);
                Turn_Timer.send_alert(next_up_owners);

                // if 0, gm owns token, don't make timer
                if (current_owners.length > 0) Turn_Timer.timer = new Turn_Timer(current_owners, combat);
            });
        }
    }

    static _toggle_active(payload) {
        Turn_Timer.active = !Turn_Timer.active;
        Turn_Timer.toggle_timer_hooks();
        Turn_Timer.timer?.remove();

        // Remove toggle buttons not in DOM, update the ones that still are
        (Turn_Timer.toggle_buttons = Turn_Timer.toggle_buttons.filter((b) => document.body.contains(b))).forEach(
            (b) => {
                b.style['text-shadow'] = Turn_Timer.active ? '0 0 8px blue' : null;
                b.dataset.tooltip = `Toggle turn timers ${Turn_Timer.active ? 'off' : 'on'}`;
            }
        );
    }

    // ------------------------------------------------------------------------
    // Class methods

    static async init() {
        await Turn_Timer.prepare_init_data();
        Turn_Timer.prepare_hooks();
        console.log(`====== Boneyard ======\n - Turn timer initialized`);
    }

    static async prepare_init_data() {
        Turn_Timer.active = game.settings.get(CONST.MODULE, CONST.SETTING_ACTIVE);

        Turn_Timer.default_duration = game.settings.get(CONST.MODULE, CONST.SETTING_DEFAULT_TURN_DURATION);
        Turn_Timer.force_end_turn = game.settings.get(CONST.MODULE, CONST.SETTING_FORCE_TURN_CHANGE);
        Turn_Timer.warning_threshold = game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_THRESHOLD);
        Turn_Timer.next_up_alert = game.settings.get(CONST.MODULE, CONST.SETTING_NEXT_UP_ALERT);

        await Turn_Timer.generate_base_element();
        const element_template = document.createElement('template');
        element_template.innerHTML = await renderTemplate(CONST.CONTROL_TEMPLATE_PATH, {});
        Turn_Timer.toggle_button_element = element_template.content.firstChild;
    }

    static async generate_base_element() {
        Turn_Timer.bar_color = game.settings.get(CONST.MODULE, CONST.SETTING_BAR_COLOR);
        Turn_Timer.warning_glow_color = game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_COLOR);
        const element_template = document.createElement('template');
        element_template.innerHTML = await renderTemplate(CONST.TIMER_TEMPLATE_PATH, {
            bar_color: Turn_Timer.bar_color,
            warning_glow_color: Turn_Timer.warning_glow_color,
        });
        Turn_Timer.element = element_template.content.firstChild;
    }

    static async set_sound(setting, path) {
        const sound = new Sound(path);
        await sound.load();
        Turn_Timer.sound[setting] = sound.failed ? null : sound;
    }

    static prepare_hooks() {
        Hooks.once('ready', () => {
            Turn_Timer.prepare_ready_data();
            if (game.user.isGM) Hooks.on('renderCombatTracker', Turn_Timer.attach_toggle_button);
            if (Turn_Timer.active) Turn_Timer.toggle_timer_hooks();
            game.socket.on(CONST.SOCKET, Turn_Timer._on_received);
        });
    }

    // Some data requires the game to have finished initializing before preparing
    // in order to access various Foundry methods/documents
    static prepare_ready_data() {
        Turn_Timer.parse_custom_durations(game.settings.get(CONST.MODULE, CONST.SETTING_CUSTOM_TURN_DURATIONS));
        Turn_Timer.set_sound('warning', game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_SOUND));
        Turn_Timer.set_sound('turn_start', game.settings.get(CONST.MODULE, CONST.SETTING_TURN_START_SOUND));
        Turn_Timer.set_sound('next_up', game.settings.get(CONST.MODULE, CONST.SETTING_NEXT_UP_SOUND));
    }

    static toggle_timer_hooks() {
        const hook_fn = (Turn_Timer.active ? Hooks.on : Hooks.off).bind(Hooks);
        hook_fn('combatStart', Turn_Timer.attach_timer);
        hook_fn('combatTurn', Turn_Timer.attach_timer);
        hook_fn('combatRound', Turn_Timer.attach_timer);
    }

    // format: "example name 1" 30, "example name 2" 45
    static parse_custom_durations(str) {
        Turn_Timer.custom_durations = {};
        str.split(',').forEach((token) => {
            let [, name, time] = token.split(`"`);
            if (
                (name = name?.trim()) !== undefined &&
                (name = game.users.find((u) => u.name === name)?.id) !== undefined &&
                !isNaN((time = parseInt(time)))
            ) {
                Turn_Timer.custom_durations[name] = Math.max(time, Turn_Timer.min_turn_duration);
            }
        });
    }

    static attach_timer(combat, updateData, updateOptions) {
        const payload = { sender: game.user.id, type: 'attach', combatID: combat.id };
        game.socket.emit(CONST.SOCKET, payload);
        Turn_Timer._inject_next_update(payload);
    }

    static attach_toggle_button(combatTracker, html, data) {
        const new_node = Turn_Timer.toggle_button_element.cloneNode(true);
        const round_counter_label = html[0].querySelector(`h3.encounter-title`);
        round_counter_label.insertAdjacentElement('beforebegin', new_node);
        round_counter_label.style['margin-left'] = 0;
        new_node.addEventListener('click', Turn_Timer.toggle_button_handler);
        if (Turn_Timer.active) {
            new_node.style['text-shadow'] = '0 0 8px blue';
            new_node.dataset.tooltip = 'Toggle turn timers off';
        }
        Turn_Timer.toggle_buttons.push(new_node);
    }

    static toggle_button_handler(e) {
        const payload = { sender: game.user.id, type: 'active' };
        game.socket.emit(CONST.SOCKET, payload);
        Turn_Timer._toggle_active(payload);
        game.settings.set(CONST.MODULE, CONST.SETTING_ACTIVE, Turn_Timer.active);
    }

    static async play_sound(sound, users) {
        if (Turn_Timer.sound[sound] !== null && users.includes(game.user.id)) {
            Object.entries(Turn_Timer.sound).forEach(([, sound]) => sound?.stop());
            if (!Turn_Timer.sound[sound].loaded) await Turn_Timer.sound[sound].load();
            Turn_Timer.sound[sound].play({ volume: game.settings.get('core', 'globalInterfaceVolume') });
        }
    }

    static send_alert(users) {
        if (Turn_Timer.next_up_alert && users.includes(game.user.id)) {
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
        this.calculate_lifespan();
        this.warning_not_triggered = true;
        this.progress = 0;
        this.bars = [];

        this.hookID = Hooks.on('renderCombatTracker', (combatTracker, html, data) => {
            if (this.combat.id === combatTracker.viewed?.id) {
                const new_node = Turn_Timer.element.cloneNode(true);
                this.set_element_style(new_node);
                html[0].querySelector(`nav#combat-controls`).insertAdjacentElement('beforebegin', new_node);
                this.bars.push(new_node);
            }
        });

        Turn_Timer.play_sound('turn_start', this.owners);
        this.intervalID = setInterval(this.update_timer_bars.bind(this), Turn_Timer.interval);
    }

    calculate_lifespan() {
        this.lifespan =
            this.owners.reduce((time, userID) => {
                return Math.max(time, Turn_Timer.custom_durations[userID] ?? Turn_Timer.default_duration);
            }, 0) * 1000;
    }

    set_element_style(timer) {
        timer.querySelector('span.by-timer-text').textContent = `${Math.floor(
            (this.lifespan - this.progress) / 1000
        )}s`;
        timer.querySelector('div.by-timer-bar').style['width'] = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;
        timer.querySelector('div.by-bar-warning').style['animation-name'] = this.warning_not_triggered
            ? 'none'
            : 'by-pulse-glow';
    }

    update_timer_bars() {
        this.progress += Turn_Timer.interval;

        if (
            this.warning_not_triggered &&
            Turn_Timer.warning_threshold >= 0 &&
            (this.lifespan - this.progress) / this.lifespan <= Turn_Timer.warning_threshold
        ) {
            this.warning_not_triggered = false;
            Turn_Timer.play_sound('warning', this.owners);
        }

        // Remove timers not in DOM, update the ones that still are
        (this.bars = this.bars.filter((t) => document.body.contains(t))).forEach((t) => this.set_element_style(t));

        // Timer is finished, stop updating
        if (this.progress >= this.lifespan) {
            if (Turn_Timer.force_end_turn) {
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

    remove() {
        clearInterval(this.intervalID);
        Hooks.off('renderCombatTracker', this.hookID);
        this.bars.forEach((t) => t.remove());
        Turn_Timer.timer = null;
    }
}
