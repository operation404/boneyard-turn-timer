import { MODULE, TEMPLATE_PATH, SETTING_DEFAULT_TURN_DURATION, SETTING_FORCE_TURN_CHANGE, SETTING_CUSTOM_TURN_DURATIONS } from './constants.js';

export class Turn_Timer {
	static template;
    static default_duration;
    static force_end_turn;
    static custom_durations;



/* 
    MAJOR TODO
    -----------------------------------------------

    redo this, I shouldn't be creating a whole new turn timer object for every combat
    I should only make one turn timer object that should handle rendering a timer for any combat by
    examining the active combat and checking who's currently up and who will be up next

    also make a preview thingy to let a player know they'll be up in X turns, but make
    sure to check for hidden people to not give them away based on position in turn order


*/






	static init() {
		Turn_Timer.prepare_data();
		Turn_Timer.prepare_hooks();
		console.log(`====== Boneyard ======\n - Turn timer initialized`);
	}

	static async prepare_data() {
		Turn_Timer.template = await getTemplate(TEMPLATE_PATH);
        Turn_Timer.default_duration = game.settings.get(MODULE, SETTING_DEFAULT_TURN_DURATION);
        Turn_Timer.force_end_turn = game.settings.get(MODULE, SETTING_FORCE_TURN_CHANGE);
        Turn_Timer.parse_custom_durations(game.settings.get(MODULE, SETTING_CUSTOM_TURN_DURATIONS));
	}

    static parse_custom_durations(str) {
        const custom_durations = {};
        // TODO implement
        Turn_Timer.custom_durations = custom_durations;
    }

	static prepare_hooks() {
		Hooks.on('createCombat', (combat, options, userId) => (combat.turnTimer = new Turn_Timer()));
		Hooks.on('renderCombatTracker', (combatTracker, html, data) =>
			combatTracker.viewed?.turnTimer?.render_and_inject(combatTracker, html, data)
		);
	}

	constructor(options = {}) {}

	render_and_inject(combatTracker, html, data) {
		console.log(combatTracker, html, data);
		const combat = combatTracker.viewed;

		if (combat.isActive && combat.started) {
			const timer = Turn_Timer.template({ timer_length: 8 });
			html[0].querySelector(`nav#combat-controls`).insertAdjacentHTML('beforebegin', timer);
		}
	}
}
