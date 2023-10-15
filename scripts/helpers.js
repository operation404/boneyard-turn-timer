/**
 * Find the elements in html described by the keys of elementsToStyle, the corresponding
 * value of which is an object describing each style to update with its keys and the value
 * to update them with as the corresponding values.
 * @param {HTMLElement} html
 * @param {Object} elementsToStyle
 */
export function applyCustomStyling(html, elementsToStyle) {
    if (html.querySelector && typeof elementsToStyle === 'object')
        for (const [elementQuery, elementStyles] of Object.entries(elementsToStyle)) {
            const element = html.querySelector(elementQuery);
            if (element && typeof elementStyles === 'object')
                for (const [styleId, styleVal] of Object.entries(elementStyles))
                    if (typeof styleVal === 'string') elementQuery[styleId] &&= styleVal;
        }
}
