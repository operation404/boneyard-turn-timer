/**
 * Find the elements contained in the passed html and apply new values
 * to their specified style attributes.
 *
 * @param {HTMLElement} html    The parent html element to query on.
 * @param {Object} elements     The entries of `elements` are selectors for html elements and objects whose
 *                              entries are the identifiers for style attributes and the values to update those
 *                              attributes with.
 */
export function applyCustomStyling(html, elements) {
    if (html.querySelector && typeof elements === 'object')
        for (const [selector, styles] of Object.entries(elements)) {
            const element = selector === '' ? html : html.querySelector(selector);
            if (element && typeof styles === 'object')
                for (const [styleId, styleVal] of Object.entries(styles))
                    if (element.style[styleId] !== undefined && typeof styleVal === 'string') element.style[styleId] = styleVal;
        }
}

/*
// querySelector only matches descendants. If the parent matches the selector, use it.
const element = (html.matches(selector) && html) || html.querySelector(selector);
*/
