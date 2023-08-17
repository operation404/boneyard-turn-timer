import * as CONST from './constants.js';

export class Turn_Timer {
	static interval = 25; // milliseconds
	static min_turn_duration = 1; // seconds TODO keep 1? or raise to like, 10?... Needs to be at least 1 though, or weird shit may happen
	static toggle_buttons = [];

	static active;
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
		warning: {
			value: null,
			volume: 0,
		},
		turn_start: {
			value: null,
			volume: 0,
		},
		next_up: {
			value: null,
			volume: 0,
		},
	};

	static async init() {
		await Turn_Timer.prepare_init_data();
		Turn_Timer.prepare_hooks();
		window.Turn_Timer = Turn_Timer;
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

		Turn_Timer.sound.warning.volume = game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_SOUND_VOLUME);
		Turn_Timer.sound.turn_start.volume = game.settings.get(CONST.MODULE, CONST.SETTING_TURN_START_SOUND_VOLUME);
		Turn_Timer.sound.next_up.volume = game.settings.get(CONST.MODULE, CONST.SETTING_NEXT_UP_SOUND_VOLUME);
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
		sound.volume = Turn_Timer.sound[setting].volume;
		Turn_Timer.sound[setting].value = sound.failed ? null : sound;
	}

	static prepare_hooks() {
		Hooks.once('ready', () => {
			Turn_Timer.prepare_ready_data();
			Hooks.on('renderCombatTracker', Turn_Timer.attach_toggle_button);
			if (Turn_Timer.active) Turn_Timer.toggle_timer_hooks();
		});
	}

	static prepare_ready_data() {
		Turn_Timer.parse_custom_durations(game.settings.get(CONST.MODULE, CONST.SETTING_CUSTOM_TURN_DURATIONS));
		Turn_Timer.set_sound('warning', game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_SOUND));
		Turn_Timer.set_sound('turn_start', game.settings.get(CONST.MODULE, CONST.SETTING_TURN_START_SOUND));
		Turn_Timer.set_sound('next_up', game.settings.get(CONST.MODULE, CONST.SETTING_NEXT_UP_SOUND));
	}

	static toggle_timer_hooks() {
		if (Turn_Timer.active) {
			Hooks.on('combatStart', Turn_Timer.attach_timer);
			Hooks.on('combatTurn', Turn_Timer.attach_timer);
			Hooks.on('combatRound', Turn_Timer.attach_timer);
		} else {
			Hooks.off('combatStart', Turn_Timer.attach_timer);
			Hooks.off('combatTurn', Turn_Timer.attach_timer);
			Hooks.off('combatRound', Turn_Timer.attach_timer);
		}
	}

	// requires accessing users, so game must be ready before running
	// format: "Tony solo" 8, "the jimster" 12
	static parse_custom_durations(str) {
		const custom_durations = {};
		str.split(',').forEach((token) => {
			let [, name, time] = token.split(`"`);
			if (name !== undefined && time !== undefined) {
				name = name.trim();
				const user = game.users.find((user) => user.name === name);
				time = parseInt(time.trim());
				if (user !== undefined && !isNaN(time))
					custom_durations[user.id] =
						time < Turn_Timer.min_turn_duration ? Turn_Timer.min_turn_duration : time;
			}
		});
		Turn_Timer.custom_durations = custom_durations;
	}

	static attach_timer(combat, updateData, updateOptions) {
		Turn_Timer.timer?.remove();

		if (combat.isActive) {
			Hooks.once('updateCombat', (combat, change, options, userID) => {
				function get_owners(actor) {
					let owners;
					const ownership = actor?.ownership ?? {};
					if (ownership.default !== undefined && ownership.default === 3) {
						// all players own the actor
						owners = game.users.contents.filter((user) => !user.isGM).map((user) => user.id);
					} else {
						// only some players own the actor
						owners = [];
						for (let userID in ownership) {
							if (ownership[userID] === 3 && !game.users.get(userID).isGM) owners.push(userID);
						}
					}
					return owners;
				}

				const current_owners = get_owners(game.actors.get(combat.combatant?.actorId));
				const next_up_owners = get_owners(game.actors.get(combat.nextCombatant?.actorId));
				current_owners.forEach(userID => {
					const idx = next_up_owners.indexOf(userID);
					if (idx !== -1) next_up_owners.splice(idx, 1);
				});
				Turn_Timer.play_sound("next_up", next_up_owners);

				// if 0, gm owns token, don't make timer
				if (current_owners.length > 0) {
					Turn_Timer.timer = new Turn_Timer(current_owners, combat);
				}
			});
		}
	}

	static attach_toggle_button(combatTracker, html, data) {
		const new_node = Turn_Timer.toggle_button_element.cloneNode(true);
		html[0].querySelector(`a[data-control="rollNPC"]`).insertAdjacentElement('afterend', new_node);
		html[0].querySelector(`h3.encounter-title`).style['margin-left'] = 0;
		new_node.addEventListener('click', Turn_Timer.toggle_button_handler);
		if (Turn_Timer.active) {
			new_node.style['text-shadow'] = '0 0 8px blue';
			new_node.dataset.tooltip = 'Toggle turn timers off';
		}
		Turn_Timer.toggle_buttons.push(new_node);
	}

	static toggle_button_handler(e) {
		Turn_Timer.active = !Turn_Timer.active;
		Turn_Timer.toggle_timer_hooks();
		Turn_Timer.timer?.remove();

		// update toggle buttons still in DOM, remove rest
		for (let i = 0; i < Turn_Timer.toggle_buttons.length; i++) {
			if (document.body.contains(Turn_Timer.toggle_buttons[i])) {
				if (Turn_Timer.active) {
					Turn_Timer.toggle_buttons[i].style['text-shadow'] = '0 0 8px blue';
					Turn_Timer.toggle_buttons[i].dataset.tooltip = 'Toggle turn timers off';
				} else {
					Turn_Timer.toggle_buttons[i].style['text-shadow'] = null;
					Turn_Timer.toggle_buttons[i].dataset.tooltip = 'Toggle turn timers on';
				}
			} else {
				Turn_Timer.toggle_buttons[i] = null;
			}
		}
		Turn_Timer.toggle_buttons = Turn_Timer.toggle_buttons.filter((t) => t !== null);

		game.settings.set(CONST.MODULE, CONST.SETTING_ACTIVE, Turn_Timer.active);
	}

	static play_sound(sound, users) {
		console.log(sound, users);
		if (Turn_Timer.sound[sound].value === null || users.length === 0) return;
	}

	constructor(owners, combat) {
		this.combat = combat;
		this.owners = owners;
		this.calculate_lifespan();
		this.warning_not_triggered = true;
		this.progress = 0;
		this.timers = [];

		this.hookID = Hooks.on('renderCombatTracker', (combatTracker, html, data) => {
			if (this.combat.id === combatTracker.viewed?.id) {
				const new_node = Turn_Timer.element.cloneNode(true);
				html[0].querySelector(`nav#combat-controls`).insertAdjacentElement('beforebegin', new_node);
				this.set_element_style(new_node);
				this.timers.push(new_node);
			}
		});

		Turn_Timer.play_sound('turn_start', this.owners);
		this.intervalID = setInterval(this.update_timer_bars.bind(this), Turn_Timer.interval);
	}

	calculate_lifespan() {
		let custom_durations_empty = true;
		for (let i in Turn_Timer.custom_durations) {
			custom_durations_empty = false;
			break;
		}

		if (!custom_durations_empty) {
			let time = 0;
			this.owners.forEach((userID) => {
				let t = Turn_Timer.custom_durations[userID];
				if (t) {
					if (t > time) time = t;
				} else {
					if (Turn_Timer.default_duration > time) time = Turn_Timer.default_duration;
				}
			});
			if (time === 0) time = Turn_Timer.default_duration;
			this.lifespan = time * 1000;
		} else {
			this.lifespan = Turn_Timer.default_duration * 1000;
		}
	}

	set_element_style(timer) {
		const text_time = `${Math.floor((this.lifespan - this.progress) / 1000)}s`;
		const style_width = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;
		const style_warning_glow = this.warning_not_triggered ? 'none' : 'by-pulse-glow';
		timer.querySelector('span.by-timer-text').textContent = text_time;
		timer.querySelector('div.by-timer-bar').style['width'] = style_width;
		timer.querySelector('div.by-bar-warning').style['animation-name'] = style_warning_glow;
	}

	update_timer_bars() {
		this.progress += Turn_Timer.interval;

		if (
			Turn_Timer.warning_threshold >= 0 &&
			this.warning_not_triggered &&
			(this.lifespan - this.progress) / this.lifespan <= Turn_Timer.warning_threshold
		) {
			this.warning_not_triggered = false;
			Turn_Timer.play_sound('warning', this.owners);
		}

		// Update timer bars still in DOM, remove rest
		for (let i = 0; i < this.timers.length; i++) {
			if (document.body.contains(this.timers[i])) {
				this.set_element_style(this.timers[i]);
			} else {
				this.timers[i] = null;
			}
		}
		this.timers = this.timers.filter((t) => t !== null);

		// Timer is finished, stop updating
		if (this.progress >= this.lifespan) {
			if (Turn_Timer.force_end_turn) {
				this.remove();
				this.combat.nextTurn();
			} else {
				clearInterval(this.intervalID);
			}
		}
	}

	remove() {
		clearInterval(this.intervalID);
		Hooks.off('renderCombatTracker', this.hookID);
		this.timers.forEach((t) => t.remove());
		Turn_Timer.timer = null;
	}
}
