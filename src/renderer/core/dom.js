export function qs(sel, root = document) {
    return root.querySelector(sel);
}

export function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
    }

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (m) => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[m]));
}

/**
 * Crea elementos DOM de forma cómoda.
 * el("div", { class: "p-4" }, ["texto", childEl])
 */
export function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);

    for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (v === false || v == null) {
        // skip
        } else {
        node.setAttribute(k, String(v));
        }
    }

    for (const child of (Array.isArray(children) ? children : [children])) {
        if (child == null) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }

    return node;
}

/**
 * Delegación de eventos:
 * on(root, "click", "[data-action]", (e, target) => {})
 */
export function on(root, event, selectorOrHandler, maybeHandler) {
    if (typeof selectorOrHandler === "function") {
        root.addEventListener(event, selectorOrHandler);
        return;
    }

    const selector = selectorOrHandler;
    const handler = maybeHandler;

    root.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (!target || !root.contains(target)) return;
        handler(e, target);
    });
}
