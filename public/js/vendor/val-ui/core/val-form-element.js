// ValFormElement — form-associated base class for val-input, val-select, etc.
// Extends ValElement with form participation via ElementInternals.
// Always uses Shadow DOM. static formAssociated = true.
import { ValElement } from './val-element.js';
export class ValFormElement extends ValElement {
    static formAssociated = true;
    constructor() {
        super({ shadow: true });
    }
    // --- Form API (via ElementInternals) ---
    get form() {
        return this.internals.form;
    }
    get name() {
        return this.getAttribute('name') ?? '';
    }
    get validity() {
        return this.internals.validity;
    }
    get validationMessage() {
        return this.internals.validationMessage;
    }
    setFormValue(value) {
        this.internals.setFormValue(value);
    }
    setValidity(flags, message, anchor) {
        if (anchor !== undefined) {
            this.internals.setValidity(flags, message, anchor);
        }
        else {
            this.internals.setValidity(flags, message);
        }
    }
    clearValidity() {
        this.internals.setValidity({});
    }
    checkValidity() {
        return this.internals.checkValidity();
    }
    reportValidity() {
        return this.internals.reportValidity();
    }
    // --- Form Lifecycle Callbacks ---
    formResetCallback() {
        // Subclasses override to reset to default value
    }
    formDisabledCallback(_disabled) {
        // Subclasses override to handle disabled state
    }
}
//# sourceMappingURL=val-form-element.js.map