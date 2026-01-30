function assertApiAvailable() {
    if (!window.api) {
        throw new Error("window.api no está disponible. Revisa preload + contextIsolation.");
    }
}

async function safeCall(fn, opts = {}) {
    try {
        assertApiAvailable();
        return await fn();
    } catch (err) {
        // Manejo UX opcional, sin acoplar todo
        if (opts.toast && window.toast) window.toast.error(err.message || "Error");
        throw err;
    }
    }
/**apis de backend */
export const api = {
    directory: {
        list: (query) => safeCall(() => window.api.directory.list(query)),
        create: (data) => safeCall(() => window.api.directory.create(data), { toast: true }),
        update: (id, data) => safeCall(() => window.api.directory.update(id, data), { toast: true }),
    },
    payments: {
        list: (filters) => safeCall(() => window.api.payments.list(filters)),
        create: (payload) => safeCall(() => window.api.payments.create(payload), { toast: true }),
    },
    settings: {
        get: () => safeCall(() => window.api.settings.get()),
        set: (data) => safeCall(() => window.api.settings.set(data), { toast: true }),
    },
};
