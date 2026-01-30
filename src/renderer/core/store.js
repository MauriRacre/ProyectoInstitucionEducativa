const listeners = new Set();

let state = {
    activeRoute: "directory",
    settings: {
        lang: "es",
    },
    session: {
        user: null,
    },
};

export function getState() {
     return structuredClone(state);
}

export function setState(patch) {
    state = deepMerge(state, patch);
    for (const fn of listeners) fn(getState());
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function deepMerge(a, b) {
    if (typeof b !== "object" || b === null) return b;
    if (Array.isArray(b)) return b.slice();

    const out = { ...(a || {}) };
    for (const [k, v] of Object.entries(b)) {
        out[k] = deepMerge(out[k], v);
    }
    return out;
}
