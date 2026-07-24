(function () {
  "use strict";

  // Show / hide password toggle.
  const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.4M6.6 6.6A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><path d="m2 2 20 20"/></svg>';
  document.querySelectorAll(".pw-toggle").forEach((btn) => {
    const inp = btn.parentElement.querySelector("input");
    btn.addEventListener("click", () => {
      const show = inp.type === "password";
      inp.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE_OFF : EYE;
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      inp.focus();
    });
  });

  const msg = document.getElementById("msg");
  function showMsg(text, ok) {
    msg.textContent = text || "";
    msg.classList.toggle("ok", Boolean(ok));
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
  }

  // Show the Google button only if the server has Google configured.
  (async function checkGoogle() {
    const btn = document.getElementById("google-btn");
    if (!btn) return;
    try {
      const res = await fetch("/api/auth/config");
      const cfg = await res.json();
      if (cfg && cfg.google) btn.classList.remove("hidden");
    } catch (_) { /* leave hidden */ }
  })();

  // If already logged in, skip straight to the app.
  (async function redirectIfLoggedIn() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) window.location.href = "index.html";
    } catch (_) {}
  })();

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMsg("");
      const btn = document.getElementById("submit-btn");
      btn.disabled = true; btn.textContent = "Logging in…";
      const { ok, data } = await postJSON("/api/auth/login", {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      });
      if (ok) {
        window.location.href = "index.html";
      } else {
        showMsg((data && data.error) || "Login failed");
        btn.disabled = false; btn.textContent = "Log In";
      }
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMsg("");
      const btn = document.getElementById("submit-btn");
      btn.disabled = true; btn.textContent = "Creating…";
      const { ok, data } = await postJSON("/api/auth/register", {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      });
      if (ok) {
        window.location.href = "index.html";
      } else {
        showMsg((data && data.error) || "Could not sign up");
        btn.disabled = false; btn.textContent = "Sign Up";
      }
    });
  }
})();
