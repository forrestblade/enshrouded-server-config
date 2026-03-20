// Dispatches val:interaction CustomEvents for telemetry.
// Always fires. If nobody listens, events vanish — zero cost.
// @valencets/telemetry registers a document listener when installed.
export function emitInteraction(element, action, detail) {
    element.dispatchEvent(new CustomEvent('val:interaction', {
        bubbles: true,
        composed: true,
        detail: {
            ...detail,
            component: element.tagName,
            action,
            timestamp: Date.now()
        }
    }));
}
//# sourceMappingURL=interaction-emitter.js.map