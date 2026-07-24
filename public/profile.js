(function () {
  "use strict";

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const msg = document.getElementById("msg");

  const changePic = document.getElementById("change-pic");
  const picInput = document.getElementById("pic-input");

  function apply(user) {
    if (!user) return;
    nameInput.value = user.name || "";
    if (emailInput) emailInput.value = user.email || "";
  }
  // Handle both orderings: event may fire before or after this listener attaches.
  document.addEventListener("user-ready", (e) => apply(e.detail));
  if (window.__USER__) apply(window.__USER__);

  // Paint an avatar image onto every avatar element (nav + profile).
  function showAvatar(dataUrl) {
    document.querySelectorAll("[data-user-initial]").forEach((el) => {
      el.style.backgroundImage = "url('" + dataUrl + "')";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.textContent = "";
    });
  }

  // Resize/crop a chosen image to a small square data URL (keeps payload tiny).
  function fileToAvatar(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d");
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        cb(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => cb(null);
      img.src = reader.result;
    };
    reader.onerror = () => cb(null);
    reader.readAsDataURL(file);
  }

  if (changePic && picInput) {
    changePic.addEventListener("click", () => picInput.click());
    picInput.addEventListener("change", () => {
      const file = picInput.files && picInput.files[0];
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) {
        msg.style.color = "#b1544e";
        msg.textContent = "That image is too large (max 8 MB).";
        return;
      }
      msg.style.color = "";
      msg.textContent = "Uploading picture…";
      fileToAvatar(file, async (dataUrl) => {
        if (!dataUrl) { msg.style.color = "#b1544e"; msg.textContent = "Could not read that image."; return; }
        try {
          const res = await fetch("/api/auth/me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ avatar: dataUrl }),
          });
          if (!res.ok) throw new Error();
          showAvatar(dataUrl);
          if (window.__USER__) window.__USER__.avatar = dataUrl;
          msg.textContent = "Picture updated!";
        } catch (_) {
          msg.style.color = "#b1544e";
          msg.textContent = "Could not save the picture.";
        }
      });
    });
  }

  document.getElementById("profile-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.style.color = "";
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.value }),
      });
      if (!res.ok) throw new Error();
      const user = await res.json();
      msg.textContent = "Saved!";
      // refresh the nav chip
      document.querySelectorAll("[data-user-first]").forEach((el) => (el.textContent = (user.name || "You").split(/\s+/)[0]));
      document.querySelectorAll("[data-user-initial]").forEach((el) => (el.textContent = ((user.name || "U")[0] || "U").toUpperCase()));
    } catch (_) {
      msg.style.color = "#b1544e";
      msg.textContent = "Could not save. Try again.";
    }
  });
})();
