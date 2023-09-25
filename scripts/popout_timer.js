import * as CONST from './constants.js';

export class PopoutTimer extends Application {
    static instance = null;
    static position = {
        x: 0,
        y: 0,
    };

    static init() {}

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            template: `modules/boneyard-turn-timer/templates/popout-timer.hbs`,
            id: CONST.MODULE,
            popOut: false,
        });
    }

    constructor(timerBar, options = {}) {}

    getData() {}

    _injectHTML(html) {
        $('body').append(html);
        this._element = html;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
