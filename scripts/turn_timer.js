import * as CONST from './constants.js';

export class Turn_Timer {
	static interval = 25; // milliseconds
	static min_turn_duration = 1; // seconds TODO keep 1? or raise to like, 10?... Needs to be at least 1 though, or weird shit may happen

	static default_duration;
	static force_end_turn;
	static custom_durations;
	static element;
	static timer;
	static bar_color;
	static warning_threshold;
	static warning_glow_color;

	static async init() {
		await Turn_Timer.prepare_data();
		Turn_Timer.prepare_hooks();
		window.Turn_Timer = Turn_Timer;
		console.log(`====== Boneyard ======\n - Turn timer initialized`);
	}

	static async prepare_data() {
		Turn_Timer.default_duration = game.settings.get(CONST.MODULE, CONST.SETTING_DEFAULT_TURN_DURATION);
		Turn_Timer.force_end_turn = game.settings.get(CONST.MODULE, CONST.SETTING_FORCE_TURN_CHANGE);
		Turn_Timer.warning_threshold = game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_THRESHOLD);
		await Turn_Timer.generate_base_element();
	}

	static async generate_base_element() {
		Turn_Timer.bar_color = game.settings.get(CONST.MODULE, CONST.SETTING_BAR_COLOR);
		Turn_Timer.warning_glow_color = game.settings.get(CONST.MODULE, CONST.SETTING_WARNING_COLOR);
		const element_template = document.createElement('template');
		element_template.innerHTML = await renderTemplate(CONST.TEMPLATE_PATH, {
			bar_color: Turn_Timer.bar_color,
			warning_glow_color: Turn_Timer.warning_glow_color,
		});
		Turn_Timer.element = element_template.content.firstChild;
	}

	static prepare_hooks() {
		Hooks.once('ready', () => {
			Turn_Timer.parse_custom_durations(game.settings.get(CONST.MODULE, CONST.SETTING_CUSTOM_TURN_DURATIONS));
			Hooks.on('combatStart', Turn_Timer.attach_timer);
			Hooks.on('combatTurn', Turn_Timer.attach_timer);
			Hooks.on('combatRound', Turn_Timer.attach_timer);
		});
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
				const actorID = combat.combatant?.actorId;
				const actor = actorID ? game.actors.get(actorID) : undefined;
				const owners = [];
				for (let userID in actor?.ownership ?? {}) {
					if (actor.ownership[userID] === 3 && !game.users.get(userID).isGM) owners.push(userID);
				}

				// if 0, gm owns token, don't make timer
				if (owners.length > 0) {
					Turn_Timer.timer = new Turn_Timer(owners, combat);
				}
			});
		}
	}

	constructor(owners, combat, options = {}) {
		this.combat = combat;
		this.calculate_lifespan(owners);
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

		this.intervalID = setInterval(this.update_timer_bars.bind(this), Turn_Timer.interval);
	}

	calculate_lifespan(owners) {
		let custom_durations_empty = true;
		for (let i in Turn_Timer.custom_durations) {
			custom_durations_empty = false;
			break;
		}

		if (!custom_durations_empty) {
			let time = 0;
			owners.forEach((userID) => {
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
			// TODO play warning sound
		}

		// Update timer bars still in DOM, remove ones that aren't
		const new_width = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;
		const new_time = `${Math.floor((this.lifespan - this.progress) / 1000)}s`;
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
