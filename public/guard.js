// Shared auth guard for app pages: redirects to login if not signed in,
// fills the user chip, and wires the logout button.
(function () {
  "use strict";

  async function init() {
    let user = null;
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) user = await res.json();
    } catch (_) {}

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Fill any user placeholders (inputs get .value, everything else textContent).
    const first = (user.name || "You").trim().split(/\s+/)[0];
    function fill(sel, val) {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.value = val;
        else el.textContent = val;
      });
    }
    fill("[data-user-name]", user.name || "You");
    fill("[data-user-first]", first);
    fill("[data-user-email]", user.email || "");
    fill("[data-user-initial]", (first[0] || "U").toUpperCase());

    // If the user has a profile picture, show it in every avatar element.
    if (user.avatar) {
      document.querySelectorAll("[data-user-initial]").forEach((el) => {
        el.style.backgroundImage = "url('" + user.avatar + "')";
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.textContent = "";
      });
    }

    // Expose to the page (set before dispatching so late listeners can read it).
    window.__USER__ = user;
    document.dispatchEvent(new CustomEvent("user-ready", { detail: user }));

    // Wire logout.
    document.querySelectorAll("[data-logout]").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        e.preventDefault();
        try { await fetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
        window.location.href = "login.html";
      })
    );
  }

  init();
})();
