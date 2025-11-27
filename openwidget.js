// OpenWidget chat bubble
window.__ow = window.__ow || {};
window.__ow.organizationId = "b3302ecd-2723-4154-95ee-1468ed9f1e4a";
window.__ow.integration_name = "manual_settings";
window.__ow.product_name = "openwidget";

(function (n, t, c) {
  function i(args) {
    return e._h ? e._h.apply(null, args) : e._q.push(args);
  }

  const e = {
    _q: [],
    _h: null,
    _v: "2.0",
    on: function () {
      i(["on", c.call(arguments)]);
    },
    once: function () {
      i(["once", c.call(arguments)]);
    },
    off: function () {
      i(["off", c.call(arguments)]);
    },
    get: function () {
      if (!e._h) {
        throw new Error("You can't use getters before OpenWidget loads.");
      }
      return i(["get", c.call(arguments)]);
    },
    call: function () {
      i(["call", c.call(arguments)]);
    },
    init: function () {
      const s = t.createElement("script");
      s.async = true;
      s.type = "text/javascript";
      s.src = "https://cdn.openwidget.com/openwidget.js";
      t.head.appendChild(s);
    },
  };

  if (!n.__ow.asyncInit) {
    e.init();
  }

  n.OpenWidget = n.OpenWidget || e;
})(window, document, [].slice);
