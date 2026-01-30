const routes = new Map();
let outletEl = null;
let beforeLeave = null;

export function registerRoute(name, renderFn) {
    routes.set(name, renderFn);
}

export function setOutlet(el) {
    outletEl = el;
}

export function setBeforeLeaveGuard(fn) {
    beforeLeave = fn; // async () => boolean
}

export async function navigate(route, state = {}) {
  // Guard (ej: confirm salir con cambios)
    if (beforeLeave) {
        const ok = await beforeLeave({ to: route });
        if (!ok) return;
    }

    const url = `#/${route}`;
    if (location.hash !== url) location.hash = url;

    // por si navegas al mismo hash
    await renderCurrent(state);
}

export async function startRouter(outlet) {
    setOutlet(outlet);
    window.addEventListener("hashchange", () => renderCurrent());
    await renderCurrent();
}

async function renderCurrent(state = {}) {
    if (!outletEl) throw new Error("Router outlet no configurado. Llama startRouter(outlet).");

    const route = (location.hash.replace("#/", "") || "directory").trim();
    const renderFn = routes.get(route);

    outletEl.innerHTML = "";
    if (!renderFn) {
        outletEl.innerHTML = `<div class="p-6">404 - Ruta no encontrada</div>`;
        return;
    }

    const node = await renderFn(state);
    if (node) outletEl.appendChild(node);
}
