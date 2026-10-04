const WAVE_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-nearby";

const HUD_ID = "283047e0-f1ec-cd41-314e-24bf2f069c68";
const OWNER_UUID = "2274de21-ee93-45e5-bce9-fab2c1fc644e";

let people = [];
let page = 0;
const per = 8;

const cards = document.querySelector("#cards");
const drawer = document.querySelector("#drawer");

const totalEl = document.querySelector("#total");
const radarTotal = document.querySelector(".radar strong");

const pnEl = document.querySelector("#pn");
const ptEl = document.querySelector("#pt");

const dnEl = document.querySelector("#dn");
const duEl = document.querySelector("#du");
const ddEl = document.querySelector("#dd");

const resultEl = document.querySelector("#result");

function draw() {
  const pages = Math.max(1, Math.ceil(people.length / per));

  page = Math.max(0, Math.min(page, pages - 1));

  pnEl.textContent = page + 1;
  ptEl.textContent = pages;

  totalEl.textContent = people.length;
  radarTotal.textContent = people.length;

  cards.innerHTML = "";

  if (people.length === 0) {
    cards.innerHTML = `
      <div class="noSignals">
        NO SIGNALS DETECTED
      </div>
    `;
    return;
  }

  people
    .slice(page * per, page * per + per)
    .forEach((p, i) => {
      const b = document.createElement("button");

      b.className = "card";

      b.innerHTML = `
        <span class="num">
          ${String(page * per + i + 1).padStart(2, "0")}
        </span>

        <span class="orb">◉</span>

        <span>
          <b>${escapeHTML(p.display_name)}</b>
          <small>${escapeHTML(p.username || "")}</small>
        </span>

        <span class="dist">
          ${Number(p.distance_m).toFixed(1)} M
        </span>

        <span class="arr">›</span>
      `;

      b.onclick = () => openP(p);

      cards.appendChild(b);
    });
}

function openP(p) {
  dnEl.textContent = p.display_name;
  duEl.textContent = p.username || "";
  ddEl.textContent =
    Number(p.distance_m).toFixed(1) + " M";

  resultEl.textContent = "";

  drawer.classList.add("show");
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadNearby(showToast = false) {
  if (showToast) {
    const toast = document.querySelector("#toast");
    toast.textContent = "REFRESHING PROXIMITY FIELD";
    toast.style.display = "block";
  }

  try {
    const response = await fetch(WAVE_API, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        hud_id: HUD_ID,
        owner_uuid: OWNER_UUID,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || `HTTP ${response.status}`,
      );
    }

    people = Array.isArray(data.avatars)
      ? data.avatars
      : [];

    page = 0;

    draw();

    if (showToast) {
      const toast = document.querySelector("#toast");

      toast.textContent =
        `PROXIMITY FIELD REFRESHED // ${people.length} SIGNAL${
          people.length === 1 ? "" : "S"
        }`;

      setTimeout(() => {
        toast.style.display = "none";
      }, 1600);
    }
  } catch (error) {
    console.error("WAVE nearby request failed:", error);

    people = [];
    page = 0;
    draw();

    const toast = document.querySelector("#toast");

    toast.textContent = "NETWORK ERROR // SCAN UNAVAILABLE";
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 2500);
  }
}

document.querySelector("#x").onclick = () =>
  drawer.classList.remove("show");

document.querySelector("#pass").onclick = () =>
  drawer.classList.remove("show");

document.querySelector("#send").onclick = () => {
  resultEl.textContent = "WAVE SENT // SIGNAL OPEN";
};

document.querySelector("#prev").onclick = () => {
  page--;
  draw();
};

document.querySelector("#next").onclick = () => {
  page++;
  draw();
};

document.querySelector("#rescan").onclick = () => {
  loadNearby(true);
};

document
  .querySelectorAll("nav button")
  .forEach((b) => {
    b.onclick = () => {
      document
        .querySelectorAll("nav button")
        .forEach((q) => q.classList.remove("on"));

      b.classList.add("on");

      document
        .querySelectorAll(".page")
        .forEach((q) => q.classList.remove("active"));

      document
        .querySelector("#" + b.dataset.p)
        .classList.add("active");

      drawer.classList.remove("show");
    };
  });

// Load the latest real Second Life scan when WAVE opens.
loadNearby();
