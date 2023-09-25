import * as CONST from './constants.js';

export class PopoutTimer extends Application {
    static init() {}

    constructor(options = {}) {}

    getData() {}

    _injectHTML(html) {
        $('body').append(html);
        this._element = html;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}
