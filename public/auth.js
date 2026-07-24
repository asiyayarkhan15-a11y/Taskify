(function () {
  "use strict";

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
