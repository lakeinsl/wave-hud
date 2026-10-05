const WAVE_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-nearby";
const WAVE_SEND_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-send";
const WAVE_ACTIVITY_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-activity";
const WAVE_MESSAGE_SEND_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-message-send";

const WAVE_MESSAGE_HISTORY_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-message-history";

const WAVE_PROFILE_API =
  "https://aydjbummeaqibzezjtfq.supabase.co/functions/v1/wave-profile";

const HUD_ID = "283047e0-f1ec-cd41-314e-24bf2f069c68";
const OWNER_UUID = "2274de21-ee93-45e5-bce9-fab2c1fc644e";

let people = [];
let page = 0;
const per = 8;

const cards = document.querySelector("#cards");
const drawer = document.querySelector("#drawer");

const totalEl = document.querySelector("#total");
const radarTotal = document.querySelector(".radar strong");

const scanRangeLabel =
  document.querySelector("#scanRangeLabel");

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

        <span class="orb">
  <img
    class="scanProfileImage"
    data-avatar-uuid="${escapeHTML(p.avatar_uuid)}"
    alt=""
  >
  <span class="scanProfileFallback">◉</span>
</span>

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

// Load this nearby avatar's Second Life profile picture.
const profileImg = b.querySelector(".scanProfileImage");
const profileFallback = b.querySelector(".scanProfileFallback");

if (profileImg && profileFallback && p.avatar_uuid) {
  loadScanProfileImage(
    p.avatar_uuid,
    profileImg,
    profileFallback
  );
}
});
}
async function loadScanProfileImage(
  avatarUUID,
  imageEl,
  fallbackEl
) {
  if (!avatarUUID || !imageEl || !fallbackEl) {
    return;
  }

  imageEl.style.display = "none";
  fallbackEl.style.display = "";

  try {
    const response = await fetch(
      WAVE_PROFILE_API,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          avatar_uuid: avatarUUID,
        }),
      }
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data.ok ||
      !data.has_profile_image ||
      !data.profile_image_url
    ) {
      return;
    }

    imageEl.onload = () => {
      fallbackEl.style.display = "none";
      imageEl.style.display = "block";
    };

    imageEl.onerror = () => {
      imageEl.style.display = "none";
      fallbackEl.style.display = "";
    };

    imageEl.src = data.profile_image_url;

  } catch (error) {
    console.error(
      "WAVE scan profile image failed:",
      error
    );

    imageEl.style.display = "none";
    fallbackEl.style.display = "";
  }
}
function openP(p) {
  dnEl.textContent = p.display_name;
  duEl.textContent = p.username || "";
  ddEl.textContent =
    Number(p.distance_m).toFixed(1) + " M";

  drawer.dataset.avatarUuid = p.avatar_uuid;

  resultEl.textContent = "";

  drawer.classList.add("show");

  // Load this avatar's SL profile picture
  // into the large Signal Profile orb.
  loadLargeScanProfileImage(p.avatar_uuid);
}

async function loadLargeScanProfileImage(avatarUuid) {
  const img =
    document.getElementById("scanProfileImage");

  const fallback =
    document.getElementById("scanProfileFallback");

  if (!img || !fallback || !avatarUuid) {
    return;
  }

  // Reset previous image first.
  img.onload = null;
  img.onerror = null;
  img.removeAttribute("src");
  img.style.display = "none";
  fallback.style.display = "";

  try {
    const response = await fetch(
      WAVE_PROFILE_API,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          avatar_uuid: avatarUuid,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "SCAN PROFILE IMAGE //",
      data
    );

    if (
      !response.ok ||
      !data.ok ||
      !data.has_profile_image ||
      !data.profile_image_url
    ) {
      return;
    }

    img.onload = () => {
      img.style.display = "block";
      fallback.style.display = "none";
    };

    img.onerror = () => {
      img.style.display = "none";
      fallback.style.display = "";
    };

    img.src = data.profile_image_url;
  } catch (error) {
    console.error(
      "SCAN PROFILE IMAGE ERROR:",
      error
    );

    img.style.display = "none";
    fallback.style.display = "";
  }
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
if (scanRangeLabel) {
  scanRangeLabel.textContent =
    String(data.scan_range ?? 96);
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

document.querySelector("#send").onclick = async () => {
  const receiverUUID = drawer.dataset.avatarUuid;

  if (!receiverUUID) {
    resultEl.textContent = "ERROR // NO SIGNAL SELECTED";
    return;
  }

  const sendButton = document.querySelector("#send");

  sendButton.disabled = true;
  resultEl.textContent = "SENDING WAVE...";

  try {
    const response = await fetch(WAVE_SEND_API, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        sender_uuid: OWNER_UUID,
        sender_hud_id: HUD_ID,
        receiver_uuid: receiverUUID,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || `HTTP ${response.status}`,
      );
    }

    resultEl.textContent = "WAVE SENT // SIGNAL OPEN";
  } catch (error) {
    console.error("WAVE send failed:", error);

    resultEl.textContent = "NETWORK ERROR // WAVE NOT SENT";
  } finally {
    sendButton.disabled = false;
  }
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

      if (b.dataset.p === "waves") {
        loadWaveActivity();
      }
    };
  });

let waveView = "incoming";
let waveIncoming = [];
let waveSent = [];

async function loadWaveActivity() {
  const activityEl = document.querySelector("#waveActivity");
  const incomingCountEl = document.querySelector("#incomingCount");
  const sentCountEl = document.querySelector("#sentCount");

  if (!activityEl) return;

  activityEl.innerHTML = `
    <div class="noSignals">
      LOADING SIGNAL ACTIVITY...
    </div>
  `;

  try {
    const response = await fetch(WAVE_ACTIVITY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatar_uuid: OWNER_UUID,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || `HTTP ${response.status}`,
      );
    }

    waveIncoming = Array.isArray(data.incoming)
      ? data.incoming
      : [];

    waveSent = Array.isArray(data.sent)
      ? data.sent
      : [];

    incomingCountEl.textContent = waveIncoming.length;
    sentCountEl.textContent = waveSent.length;

    drawWaveActivity();
  } catch (error) {
    console.error("WAVE activity request failed:", error);

    activityEl.innerHTML = `
      <div class="noSignals">
        NETWORK ERROR // ACTIVITY UNAVAILABLE
      </div>
    `;
  }
}

function drawWaveActivity() {
  const activityEl = document.querySelector("#waveActivity");

  if (!activityEl) return;

  const list =
    waveView === "incoming"
      ? waveIncoming
      : waveSent;

  activityEl.innerHTML = "";

  if (list.length === 0) {
    activityEl.innerHTML = `
      <div class="noSignals">
        ${
          waveView === "incoming"
            ? "NO INCOMING WAVES"
            : "NO SENT WAVES"
        }
      </div>
    `;
    return;
  }

  list.forEach((wave, index) => {
  const row = document.createElement("div");
  row.className = "waveRow";

const displayName =
  wave.other_display_name ||
  "ANONYMOUS WAVE";

  const username =
    wave.other_username ||
    "";

  const status =
    String(wave.status || "sent").toUpperCase();

    const waveType =
  String(wave.wave_type || "wave")
    .replaceAll("_", " ")
    .toUpperCase();
    
  row.innerHTML = `
    <div class="waveNumber">
      ${String(index + 1).padStart(2, "0")}
    </div>

    <div class="waveOrb">◉</div>

   <div class="waveInfo">
  <b>${escapeHTML(displayName)}</b>

  ${
    username
      ? `<small>@${escapeHTML(username)}</small>`
      : ""
  }

  <span class="waveType">
    ${escapeHTML(waveType)}
  </span>
</div>

    <div class="waveDirection">
      <small>
        ${
          waveView === "incoming"
            ? "RECEIVED"
            : "SENT"
        }
      </small>
      <b>${escapeHTML(status)}</b>
    </div>

    <div class="waveArrow">›</div>
  `;
row.onclick = () => {
  openWaveConversation(wave);
};
   activityEl.appendChild(row);
});
}
async function loadWaveProfileImage(avatarUUID) {
  const imageEl =
    document.getElementById("waveProfileImage");

  const fallbackEl =
    document.getElementById("waveProfileFallback");

  if (!imageEl || !fallbackEl) {
    return;
  }

  // Always reset first so the previous person's
  // picture never flashes on another profile.
  imageEl.style.display = "none";
  imageEl.removeAttribute("src");
  fallbackEl.style.display = "";

  if (!avatarUUID) {
    return;
  }

  try {
    const response = await fetch(
      WAVE_PROFILE_API,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          avatar_uuid: avatarUUID,
        }),
      },
    );

    const data = await response.json();

    if (
      !response.ok ||
      !data.ok ||
      !data.has_profile_image ||
      !data.profile_image_url
    ) {
      return;
    }

    imageEl.onload = () => {
      fallbackEl.style.display = "none";
      imageEl.style.display = "block";
    };

    imageEl.onerror = () => {
      imageEl.style.display = "none";
      fallbackEl.style.display = "";
    };

    imageEl.src = data.profile_image_url;
  } catch (error) {
    console.error(
      "WAVE profile image request failed:",
      error,
    );

    imageEl.style.display = "none";
    fallbackEl.style.display = "";
  }
}
// =========================================
// WAVE WEB CONVERSATION
// =========================================

const waveDrawer =
  document.querySelector("#waveDrawer");

const waveDrawerClose =
  document.querySelector("#waveDrawerClose");

const waveDrawerName =
  document.querySelector("#waveDrawerName");

const waveDrawerUsername =
  document.querySelector("#waveDrawerUsername");

const waveDrawerStatus =
  document.querySelector("#waveDrawerStatus");

const waveReplyText =
  document.querySelector("#waveReplyText");

const waveReplySend =
  document.querySelector("#waveReplySend");

const waveReplyCancel =
  document.querySelector("#waveReplyCancel");

const waveReplyResult =
  document.querySelector("#waveReplyResult");

const waveMessageHistory =
  document.querySelector("#waveMessageHistory");


function openWaveConversation(wave) {
  console.log("OPEN WAVE CONVERSATION:", wave);

  const panel =
    document.getElementById("waveDrawer");

  if (!panel) {
    alert("ERROR // waveDrawer NOT FOUND");
    return;
  }

  const nameEl =
    document.getElementById("waveDrawerName");

  const usernameEl =
    document.getElementById("waveDrawerUsername");

  const statusEl =
    document.getElementById("waveDrawerStatus");

  const textEl =
    document.getElementById("waveReplyText");

  const resultEl =
    document.getElementById("waveReplyResult");

  const otherUUID =
    String(wave.other_avatar_uuid || "");
 
  loadWaveProfileImage(otherUUID);

const displayName =
  wave.other_display_name ||
  "ANONYMOUS WAVE";

  const username =
    wave.other_username || "";

  const status =
    String(wave.status || "sent")
      .toUpperCase();

  panel.dataset.avatarUuid =
    otherUUID;

  panel.dataset.waveId =
    wave.wave_id || "";

  if (nameEl) {
    nameEl.textContent =
      displayName;
  }

  if (usernameEl) {
    usernameEl.textContent =
      username
        ? "@" + username
        : "";
  }

  if (statusEl) {
    statusEl.textContent =
      status;
  }

  if (textEl) {
    textEl.value = "";
  }

  if (resultEl) {
    resultEl.textContent = "";
  }

  panel.classList.add("show");

  loadWaveMessageHistory();
startWaveMessageRefresh();
  console.log(
    "WAVE DRAWER OPEN:",
    panel.className
  );
}
async function loadWaveMessageHistory() {
  const panel =
    document.getElementById("waveDrawer");

  const historyEl =
    document.getElementById("waveMessageHistory");

  if (!panel) {
    console.error(
      "WAVE HISTORY // waveDrawer NOT FOUND"
    );
    return;
  }

  if (!historyEl) {
    console.error(
      "WAVE HISTORY // waveMessageHistory NOT FOUND"
    );
    return;
  }

  const waveId =
    panel.dataset.waveId || "";

  if (!waveId) {
    console.error(
      "WAVE HISTORY // NO WAVE ID"
    );
    return;
  }

  console.log(
    "WAVE HISTORY // LOADING:",
    waveId
  );

  try {
    const response = await fetch(
      WAVE_MESSAGE_HISTORY_API,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          wave_id: waveId,
          avatar_uuid: OWNER_UUID,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error ||
        `HTTP ${response.status}`
      );
    }

    console.log(
      "WAVE HISTORY // LOADED:",
      data
    );

    const messages =
      Array.isArray(data.messages)
        ? data.messages
        : [];
    
const previousMessageCount =
    Number(panel.dataset.messageCount || "-1");

if (
    previousMessageCount === messages.length &&
    historyEl.children.length > 0
) {
    return;
}
    panel.dataset.messageCount =
      String(messages.length);

    historyEl.innerHTML = "";

    if (messages.length === 0) {
      historyEl.innerHTML = `
        <div class="noSignals">
          NO MESSAGES YET // OPEN THE SIGNAL
        </div>
      `;
      return;
    }

    messages.forEach((message) => {
      const row =
        document.createElement("div");

      const senderUUID =
        String(
          message.sender_uuid || ""
        );

      const isMine =
        senderUUID === OWNER_UUID;

      row.className =
        isMine
          ? "waveMessage mine"
          : "waveMessage theirs";

      const senderLabel =
        isMine
          ? "YOU"
          : (
              message.sender_display_name ||
              message.display_name ||
              "SIGNAL"
            );

      const messageText =
        message.message ||
        message.message_text ||
        message.body ||
        "";

      row.innerHTML = `
        <div class="waveMessageSender">
          ${escapeHTML(senderLabel)}
        </div>

        <div class="waveMessageBubble">
          ${escapeHTML(messageText)}
        </div>
      `;

      historyEl.appendChild(row);
    });

    requestAnimationFrame(() => {
    historyEl.scrollTop =
        historyEl.scrollHeight;
});

  } catch (error) {
    console.error(
      "WAVE HISTORY // ERROR:",
      error
    );

    historyEl.innerHTML = `
      <div class="noSignals">
        NETWORK ERROR // HISTORY UNAVAILABLE
      </div>
    `;
  }
}

// =========================================
// LIVE WAVE MESSAGE REFRESH
// =========================================

let waveMessageRefreshTimer = null;

function startWaveMessageRefresh() {
  stopWaveMessageRefresh();

  waveMessageRefreshTimer = setInterval(() => {
    console.log(
      "LIVE WAVE POLL",
      waveDrawer?.classList.contains("show"),
      waveDrawer?.dataset.waveId
    );

    if (
      waveDrawer &&
      waveDrawer.classList.contains("show") &&
      waveDrawer.dataset.waveId
    ) {
      loadWaveMessageHistory();
    }
  }, 2000);
}

function stopWaveMessageRefresh() {
  if (waveMessageRefreshTimer) {
    clearInterval(waveMessageRefreshTimer);
    waveMessageRefreshTimer = null;
  }
}

function closeWaveConversation() {
  stopWaveMessageRefresh();
  
  if (!waveDrawer) return;

  waveDrawer.classList.remove("show");

  waveReplyText.value = "";

  waveReplyResult.textContent = "";
}


if (waveDrawerClose) {
  waveDrawerClose.onclick =
    closeWaveConversation;
}


if (waveReplyCancel) {
  waveReplyCancel.onclick =
    closeWaveConversation;
}


if (waveReplySend) {
  waveReplySend.onclick = async () => {
    const receiverUUID =
      waveDrawer.dataset.avatarUuid;

   const waveId =
  waveDrawer.dataset.waveId;

console.log("DEBUG SEND waveId:", waveId);

    const message =
      waveReplyText.value.trim();

   if (!waveId) {
  waveReplyResult.textContent =
    "ERROR // NO SIGNAL SELECTED";

  return;
}

    if (!message) {
      waveReplyResult.textContent =
        "ENTER A MESSAGE";

      waveReplyText.focus();

      return;
    }

    waveReplySend.disabled = true;

    waveReplyResult.textContent =
      "TRANSMITTING MESSAGE...";

    try {
      const response =
        await fetch(
          WAVE_MESSAGE_SEND_API,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

           body: JSON.stringify({
  sender_uuid:
    OWNER_UUID,

  wave_id:
    waveId,

  message:
    message,
}),
          },
        );

      const data =
        await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
          `HTTP ${response.status}`,
        );
      }

      waveReplyText.value = "";

      waveReplyResult.textContent =
        "MESSAGE SENT // SIGNAL DELIVERING";

      await loadWaveMessageHistory();

    } catch (error) {
      console.error(
        "WAVE message send failed:",
        error,
      );

      waveReplyResult.textContent =
        "NETWORK ERROR // MESSAGE NOT SENT";

    } finally {
      waveReplySend.disabled = false;
    }
  };
}
const incomingTab =
  document.querySelector("#incomingTab");

const sentTab =
  document.querySelector("#sentTab");

const refreshWaves =
  document.querySelector("#refreshWaves");

if (incomingTab) {
  incomingTab.onclick = () => {
    waveView = "incoming";

    incomingTab.classList.add("active");
    sentTab.classList.remove("active");

    drawWaveActivity();
  };
}

if (sentTab) {
  sentTab.onclick = () => {
    waveView = "sent";

    sentTab.classList.add("active");
    incomingTab.classList.remove("active");

    drawWaveActivity();
  };
}

if (refreshWaves) {
  refreshWaves.onclick = () => {
    loadWaveActivity();
  };
}

// Load the latest real Second Life scan when WAVE opens.
loadNearby();
