import {
	MODULE,
	TEMPLATE_PATH,
	SETTING_DEFAULT_TURN_DURATION,
	SETTING_FORCE_TURN_CHANGE,
	SETTING_CUSTOM_TURN_DURATIONS,
} from './constants.js';

export class Turn_Timer {
	static default_duration;
	static force_end_turn;
	static custom_durations;
	static element;
	static timer;
	static interval = 50; // ms

	static async init() {
		await Turn_Timer.prepare_data();
		Turn_Timer.prepare_hooks();
		window.Turn_Timer = Turn_Timer;
		console.log(`====== Boneyard ======\n - Turn timer initialized`);
	}

	static async prepare_data() {
		const element_template = document.createElement('template');
		element_template.innerHTML = await renderTemplate(TEMPLATE_PATH, {});
		Turn_Timer.element = element_template.content.firstChild;
		Turn_Timer.default_duration = game.settings.get(MODULE, SETTING_DEFAULT_TURN_DURATION);
		Turn_Timer.force_end_turn = game.settings.get(MODULE, SETTING_FORCE_TURN_CHANGE);
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
				if (user !== undefined && !isNaN(time)) custom_durations[user.id] = time;
			}
		});
		Turn_Timer.custom_durations = custom_durations;
	}

	static prepare_hooks() {
		Hooks.once('ready', () => {
			Turn_Timer.parse_custom_durations(game.settings.get(MODULE, SETTING_CUSTOM_TURN_DURATIONS));
			Hooks.on('combatStart', Turn_Timer.attach_timer);
			Hooks.on('combatTurn', Turn_Timer.attach_timer);
			Hooks.on('combatRound', Turn_Timer.attach_timer);
		});
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
		this.set_lifespan(owners);
		this.combat = combat;
		this.timers = [];
		this.bars = [];

		this.hookID = Hooks.on('renderCombatTracker', (combatTracker, html, data) => {
			if (this.combat.id === combatTracker.viewed?.id) {
				const new_node = Turn_Timer.element.cloneNode(true);
				html[0].querySelector(`nav#combat-controls`).insertAdjacentElement('beforebegin', new_node);
				new_node.querySelector('span.by-timer-text').textContent = `${Math.floor(this.lifespan / 1000)}s`;
				this.timers.push(new_node);
			}
		});

		this.progress = 0;
		this.intervalID = setInterval(this.update_timer_bars.bind(this), Turn_Timer.interval);
	}

	set_lifespan(owners) {
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

	update_timer_bars() {
		this.progress += Turn_Timer.interval;
		const new_width = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;

		for (let i = 0; i < this.timers.length; i++) {
			if (document.body.contains(this.timers[i])) {
				this.timers[i].querySelector('div.by-timer-bar').style['width'] = new_width;
				this.timers[i].querySelector('span.by-timer-text').textContent = `${Math.floor(
					(this.lifespan - this.progress) / 1000
				)}s`;
			} else {
				this.timers[i] = null;
			}
		}
		this.timers = this.timers.filter((t) => t !== null);

		if (this.progress >= this.lifespan) {
			this.remove();
			if (Turn_Timer.force_end_turn) this.combat.nextTurn();
		}
	}

	remove() {
		clearInterval(this.intervalID);
		Hooks.off('renderCombatTracker', this.hookID);
		this.timers.forEach((t) => t.remove());
		Turn_Timer.timer = null;
	}
}
