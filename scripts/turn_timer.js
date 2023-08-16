import {
	MODULE,
	TEMPLATE_PATH,
	SETTING_DEFAULT_TURN_DURATION,
	SETTING_FORCE_TURN_CHANGE,
	SETTING_CUSTOM_TURN_DURATIONS,
} from './constants.js';

export class Turn_Timer {
	static template;
	static default_duration;
	static force_end_turn;
	static custom_durations;
	static element;
	static timer;
	static interval = 10; // ms
	static timers = [];

	/* 
    MAJOR TODO
    -----------------------------------------------

    the turn timer objects themselves are one and dones, made to represent a single timer bar
	and destroyed when that bar is finished

	HTML CSS animations aren't going to work for this. As they only start when actually revealing the
	html element, whereas I need the bar to start filling even when the combat tab isn't focused. Bar
	progress has to be done another way, either in js or a different html/css approach that won't
	rely on having the element visible to start filling the bar

    also make a preview thingy to let a player know they'll be up in X turns, but make
    sure to check for hidden people to not give them away based on position in turn order


*/

	static async init() {
		await Turn_Timer.prepare_data();
		Turn_Timer.prepare_hooks();
		window.Turn_Timer = Turn_Timer;
		console.log(`====== Boneyard ======\n - Turn timer initialized`);
	}

	static async prepare_data() {
		Turn_Timer.template = await getTemplate(TEMPLATE_PATH);
		const element_template = document.createElement('template');
		element_template.innerHTML = Turn_Timer.template({}).trim();
		Turn_Timer.element = element_template.content.firstChild;

		Turn_Timer.default_duration = game.settings.get(MODULE, SETTING_DEFAULT_TURN_DURATION);
		Turn_Timer.force_end_turn = game.settings.get(MODULE, SETTING_FORCE_TURN_CHANGE);
		Turn_Timer.parse_custom_durations(game.settings.get(MODULE, SETTING_CUSTOM_TURN_DURATIONS));
	}

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
		Hooks.on('combatStart', Turn_Timer.attach_timer);
		Hooks.on('combatTurn', Turn_Timer.attach_timer);
	}

	static attach_timer(combat, updateData, updateOptions) {
		console.log(Turn_Timer.timers);
		Turn_Timer.timers.forEach((timer) => timer.remove());
		console.log(combat, updateData, updateOptions);

		if (combat.started && combat.isActive) {
			const temp = combat.combatant;
			const actorID = combat.combatant?.actorId;
			const actor = actorID ? game.actors.get(actorID) : undefined;
			const owners = [];
			for (let userID in actor?.ownership ?? {}) {
				if (actor.ownership[userID] === 3) owners.push(userID);
			}
			console.log(owners, actor);

			// if owners.length === 0, GM owns token, don't make a turn timer
			if (owners.length > 0) {
				Hooks.once('renderCombatTracker', (combatTracker, html, data) => {
					// TODO check to make sure viewed combat is the same as the one triggering this
					// it always should be, but better safe than sorry
					Turn_Timer.timers.push(new Turn_Timer(html[0].querySelector(`nav#combat-controls`), owners));
				});
			}
		}
	}

	constructor(target, owners, options = {}) {
		this.set_lifespan(owners);

		const element_template = document.createElement('template');
		element_template.innerHTML = Turn_Timer.template({}).trim();
		this.element = element_template.content.firstChild;

		this.element.style['width'] = '0%';
		target.insertAdjacentElement('beforebegin', this.element);
		this.intervalID = setInterval(this.update_timer_bar.bind(this), Turn_Timer.interval);
		this.progress = 0;
	}

	set_lifespan(owners) {
		let custom_durations_empty = true;
		for (let i in Turn_Timer.custom_durations) custom_durations_empty = false;

		if (!custom_durations_empty) {
			let time = 0;
			owners.forEach((userID) => {
				let t = Turn_Timer.custom_durations[userID];
				if (t && t > time) time = t;
			});
			if (time === 0) time = Turn_Timer.default_duration;
			this.lifespan = time * 1000;
		} else {
			this.lifespan = Turn_Timer.default_duration * 1000;
		}
	}

	update_timer_bar() {
		this.progress += Turn_Timer.interval;
		this.element.style['width'] = `${Math.min(this.progress / this.lifespan, 1) * 100}%`;
		if (this.progress >= this.lifespan) this.remove();
	}

	remove() {
		clearInterval(this.intervalID);
		this.element.remove();
		Turn_Timer.timers.splice(Turn_Timer.timers.indexOf(this), 1);	
	}
}
