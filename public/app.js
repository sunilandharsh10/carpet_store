/* =========================================================
   Carpet Store Frontend
   ========================================================= */

const WHATSAPP = "9935353482";
const CURRENCY = "₹";

const COLORS = {
  Red: "#b3392b",
  Blue: "#2c4a7a",
  Green: "#4f7a52",
  Beige: "#d8c7a6",
  Brown: "#6e4a32",
  Grey: "#8a8f98",
  Ivory: "#efe8d8",
};

const ROOMS = [
  ["Living Room", "Blue", 0, "/typeOfCarpet/livingRoom.jpg"],
  ["Bedroom", "Beige", 1, "/typeOfCarpet/bedroom.jpg"],
  ["Dining Room", "Brown", 2, "/typeOfCarpet/dining.jpg"],
  ["Kids Room", "Green", 3, "/typeOfCarpet/kids.jpg"],
];

const SLIDES = [
  {
    t: "Timeless Carpets. Crafted for Beautiful Living.",
    p: "Discover premium handcrafted carpets designed to bring warmth, character, and timeless elegance to your home. Each piece is thoughtfully crafted with exceptional detail and a luxurious finish",
    c: "Brown",
    k: 2,
    l: "Shop hand tufted",
    f: "Hand Tufted",
    img: "/wallpepar/floorCarpet.webp",
  },
  {
    t: "Crafted for Timeless Elegance",
    p: "Bring refined beauty into your home with premium handcrafted carpets made with exceptional craftsmanship. Every design blends comfort, character, and lasting elegance.",
    c: "Green",
    k: 3,
    l: "Explore irregular",
    f: "Irregular",
    img: "/wallpepar/OIP.jpg",
  },
];

let PRODUCTS = [];
let ADMIN = false;
let M = null;
let E = null;
let loadFailed = false;
let ADMUSER = "";
let cart = [];
let fType = "All";
let fColor = "All";
let roomF = "All";
let slide = 0;

const $ = (id) => document.getElementById(id);
const fmt = (n) => CURRENCY + Number(n || 0).toLocaleString("en-IN");
const byId = (id) => PRODUCTS.find((p) => p.id === id);
const sp = (p, i) => Number(p.sizes[i].price);
const minP = (p) => Math.min(...p.sizes.map((z) => Number(z.price)));
const defDesc = (p) =>
  `${p.name} is a ${p.type.toLowerCase()} carpet in ${p.color.toLowerCase()} for ${p.room.toLowerCase()} floors.`;

const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const clean = (t) => String(t || "").replace(/[<>"]/g, "").trim();

try {
  cart = JSON.parse(localStorage.getItem("cart2") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

const save = () => {
  try {
    localStorage.setItem("cart2", JSON.stringify(cart));
  } catch {}
};

function art(color, kind) {
  const c = COLORS[color] || "#888";
  const d = "#1f2a44";
  const l = "#f5efe2";

  const patterns = [
    `<rect width="200" height="200" fill="${c}"/><path d="M0 100 L100 0 L200 100 L100 200Z" fill="none" stroke="${l}" stroke-width="6"/><path d="M40 100 L100 40 L160 100 L100 160Z" fill="${d}" opacity=".55"/>`,
    `<rect width="200" height="200" fill="${c}"/>${[...Array(8)]
      .map(
        (_, i) =>
          `<rect y="${i * 25}" width="200" height="${
             i % 2 ? 6 : 12 
            }"
             fill="${i % 2 ? l : d}" opacity=".6"/>`
      )
      .join("")}`,
    `<rect width="200" height="200" fill="${c}"/><rect x="14" y="14" width="172" height="172" fill="none" stroke="${l}" stroke-width="5"/><circle cx="100" cy="100" r="44" fill="${d}" opacity=".5"/><circle cx="100" cy="100" r="22" fill="${l}" opacity=".7"/>`,
    `<rect width="200" height="200" fill="${c}"/>${[...Array(6)]
      .map(
        (_, i) =>
          `<circle cx="${(i % 3) * 80 + 20}" cy="${             Math.floor(i / 3) * 100 + 50           }" r="34" fill="none" stroke="${
            i % 2 ? l : d
          }" stroke-width="7" opacity=".6"/>`
      )
      .join("")}`,
  ];

  return `<svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${
    patterns[kind % 4]
  }</svg>`;
}

function pic(p) {
  if (p.img) return `<img src="${p.img}" alt="${clean(p.name)}">`;
  return art(p.color, p.k || 0);
}

if ($("hero")) {
  $("hero").innerHTML =
    SLIDES.map(
  (s, i) => `
    <div class="slide${i ? "" : " on"}">
      <div class="tx">
        <h1>${s.t}</h1>
        <p>${s.p}</p>
        <a class="cta" href="#shop" data-f="${s.f}">${s.l}</a>
      </div>
      <div class="art">
        ${s.img ? `<img src="${s.img}" alt="${s.t}" class="slide-img" />` : art(s.c, s.k)}
      </div>
    </div>
  `
).join("") +
`<div class="dots">${SLIDES.map(
  (_, i) =>
    `<button aria-label="Slide ${
      i + 1
    }" class="${i ? "" : "on"}" data-s="${i}"></button>`
).join("")}</div>`;
}

function go(n) {
  slide = n;
  document
    .querySelectorAll(".slide")
    .forEach((e, i) => e.classList.toggle("on", i === n));
  document
    .querySelectorAll(".dots button")
    .forEach((e, i) => e.classList.toggle("on", i === n));
}

if ($("hero")) {
  $("hero").onclick = (e) => {
    const s = e.target.dataset.s;
    const f = e.target.dataset.f;
    if (s != null) go(Number(s));
    if (f) {
      fType = f;
      render();
      $("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  };
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => go((slide + 1) % SLIDES.length), 6000);
}

if ($("rooms-grid")) {
  $("rooms-grid").innerHTML = ROOMS.map(
    (r) => `
    <button class="room" data-room="${r[0]}">
      <div class="art">
        ${
          r[3]
            ? `<img src="${r[3]}" alt="${r[0]}" class="room-img" />`
            : art(r[1], r[2])
        }
      </div>
      <b>${r[0]}</b>
    </button>
  `
  ).join("");

  $("rooms-grid").onclick = (e) => {
    const b = e.target.closest("[data-room]");
    if (!b) return;
    roomF = b.dataset.room;
    fType = "All";
    render();
    $("shop")?.scrollIntoView({ behavior: "smooth" });
  };
}

if ($("showArt")) $("showArt").innerHTML = art("Red", 0);

function render() {
  const types = ["All", ...new Set(PRODUCTS.map((p) => p.type))];

  if ($("fType")) {
    $("fType").innerHTML =
      types
        .map(
          (t) =>
            `<button class="chip" aria-pressed="${
              t === fType
            }" data-t="${t}">${t}</button>`
        )
        .join("") +
      (roomF !== "All"
        ? `<button class="chip" aria-pressed="true" data-clear="1">${roomF} ✕</button>`
        : "");
  }

  if ($("fColor")) {
    $("fColor").innerHTML =
      `<span class="m">Colour</span><button class="chip" aria-pressed="${
        fColor === "All"
      }" data-c="All">All</button>` +
      Object.keys(COLORS)
        .map(
          (c) =>
            `<button class="sw" title="${c}" aria-label="${c}" aria-pressed="${
              c === fColor
            }" data-c="${c}" style="background:${COLORS[c]}"></button>`
        )
        .join("");
  }

  if ($("adminBar")) {
    $("adminBar").innerHTML = ADMIN
      ? `
      <button class="cta" data-add="1">+ Add carpet</button>
      <button class="chip" data-acct="1">Change login</button>
      <button class="chip" data-out="1">Log out</button>
    `
      : "";
  }

  const list = PRODUCTS.filter(
    (p) =>
      (fType === "All" || p.type === fType) &&
      (fColor === "All" || p.color === fColor) &&
      (roomF === "All" || p.room === roomF)
  );

  const emptyMsg = loadFailed
    ? "Could not load carpets. Start the server with npm start and open http://localhost:3000."
    : "No carpets match these filters. Clear a filter to see more.";

  if (!$("grid")) return;

  $("grid").innerHTML = list.length
    ? list
        .map(
          (p) => `
        <article class="p" data-open="${p.id}" style="cursor:pointer">
          <div class="art">
            ${pic(p)}
            <span class="off">–50%</span>
          </div>
          <div class="in">
            <h3>${clean(p.name)}</h3>
            <span class="m">${clean(p.room)} · ${clean(p.color)}</span>
            <div class="pr">
              <span class="m">From</span>
              <b>${fmt(minP(p))}</b>
            </div>
          </div>
          <button class="cta" data-open="${p.id}">Select size</button>
          ${
            ADMIN
              ? `<button class="cta" data-edit="${p.id}" style="background:var(--acc);color:var(--acc-ink)">Edit</button>`
              : ""
          }
        </article>
      `
        )
        .join("")
    : `<p class="empty">${emptyMsg}</p>`;
}

if ($("fType")) {
  $("fType").onclick = (e) => {
    if (e.target.dataset.t) {
      fType = e.target.dataset.t;
      render();
    }
    if (e.target.dataset.clear) {
      roomF = "All";
      render();
    }
  };
}

if ($("fColor")) {
  $("fColor").onclick = (e) => {
    if (e.target.dataset.c) {
      fColor = e.target.dataset.c;
      render();
    }
  };
}

if ($("grid")) {
  $("grid").onclick = (e) => {
    const editId = e.target.dataset.edit;
    if (editId) {
      openEd(editId);
      return;
    }
    const b = e.target.closest("[data-open]");
    if (b) openP(b.dataset.open);
  };
}

function add(id, s = 0, q = 1) {
  const line = cart.find((x) => x.id === id && x.s === s);
  if (line) line.q += q;
  else cart.push({ id, s, q });
  update();
}

function update() {
  cart = cart.filter((x) => {
    const p = byId(x.id);
    return p && Array.isArray(p.sizes) && p.sizes[x.s];
  });

  save();

  if ($("cartN")) $("cartN").textContent = cart.reduce((a, x) => a + x.q, 0);

  if ($("items")) {
    $("items").innerHTML = cart.length
      ? cart
          .map((x, i) => {
            const p = byId(x.id);
            return `
            <div class="it">
              <div class="art">${pic(p)}</div>
              <div>
                <b>${clean(p.name)}</b>
                <div class="m">${clean(p.sizes[x.s].label)}</div>
                <div class="q">
                  <button data-m="${i}" aria-label="Decrease">–</button>
                  ${x.q}
                  <button data-p="${i}" aria-label="Increase">+</button>
                </div>
              </div>
              <span>${fmt(sp(p, x.s) * x.q)}</span>
            </div>
          `;
          })
          .join("")
      : `<p class="m">Your cart is empty. Open a carpet, choose a size and add it.</p>`;
  }

  const sub = cart.reduce((a, x) => a + sp(byId(x.id), x.s) * x.q, 0);
  const code = $("code")?.value.trim().toUpperCase() === "NEW10" ? 0.1 : 0;
  const prepaid = $("pay")?.value === "prepaid" ? 0.1 : 0;
  const disc = Math.round(sub * (code + prepaid));

  if ($("sub")) $("sub").textContent = fmt(sub);
  if ($("disc")) $("disc").textContent = "–" + fmt(disc);
  if ($("tot")) $("tot").textContent = fmt(sub - disc);
}

if ($("items")) {
  $("items").onclick = (e) => {
    const m = e.target.dataset.m;
    const p = e.target.dataset.p;

    if (m != null) {
      cart[m].q--;
      if (cart[m].q < 1) cart.splice(Number(m), 1);
      update();
    }
    if (p != null) {
      cart[p].q++;
      update();
    }
  };
}

function openCart() {
  $("drawer")?.classList.add("open");
  $("shade")?.classList.add("open");
  $("drawer")?.setAttribute("aria-hidden", "false");
  update();
}

function closeCart() {
  $("modal")?.classList.remove("open");
  $("drawer")?.classList.remove("open");
  $("shade")?.classList.remove("open");
  $("drawer")?.setAttribute("aria-hidden", "true");
}

$("cartBtn")?.addEventListener("click", openCart);
$("closeCart")?.addEventListener("click", closeCart);
$("shade")?.addEventListener("click", closeCart);
$("mclose")?.addEventListener("click", closeCart);
$("code")?.addEventListener("input", update);
$("pay")?.addEventListener("change", update);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

function openP(id) {
  const p = byId(id);
  if (!p) return;

  M = { id, s: 0, q: 1 };
  drawM();

  $("modal")?.classList.add("open");
  $("shade")?.classList.add("open");
}

function drawM() {
  const p = byId(M.id);
  if (!p) return;

  const each = sp(p, M.s);

  $("mbody").innerHTML = `
    <div class="art mimg">${pic(p)}</div>
    <div class="mtx">
      <h3>${clean(p.name)}</h3>
      <span class="m">${clean(p.room)} · ${clean(p.color)}</span>
      <div class="big">
        <b>${fmt(each)}</b>
        <s class="m">${fmt(each * 2)}</s>
        <span class="m">50% off</span>
      </div>
      <p>${clean(p.desc || defDesc(p))}</p>
      <div role="group" aria-label="Choose size">
        <div class="m">Size</div>
        <div class="filters" style="margin:6px 0 0">
          ${p.sizes
            .map(
              (z, i) =>
                `<button class="chip" aria-pressed="${i === M.s}" data-sz="${i}">${clean(
                  z.label
                )}</button>`
            )
            .join("")}
        </div>
      </div>
      <div class="q">
        <button data-qm="1" aria-label="Decrease">–</button>
        ${M.q}
        <button data-qp="1" aria-label="Increase">+</button>
      </div>
      <button class="cta" data-addm="1">Add to cart · ${fmt(each * M.q)}</button>
    </div>
  `;
}

$("mbody")?.addEventListener("click", (e) => {
  const d = e.target.dataset;
  if (d.sz != null) {
    M.s = Number(d.sz);
    drawM();
    return;
  }
  if (d.qm && M.q > 1) {
    M.q--;
    drawM();
    return;
  }
  if (d.qp) {
    M.q++;
    drawM();
    return;
  }
  if (d.addm) {
    add(M.id, M.s, M.q);
    openCart();
    return;
  }
  if (d.login) {
    doLogin();
    return;
  }
  if (d.forgot) {
    openForgot();
    return;
  }
  if (d.getcode) {
    getCode();
    return;
  }
  if (d.doreset) {
    doReset();
    return;
  }
  if (d.save) {
    saveEd();
    return;
  }
  if (d.saveacct) {
    saveAcct();
    return;
  }
  if (d.del && ADMIN) {
    if (confirm("Delete this carpet?")) delEd();
  }
});

const JSONH = { "Content-Type": "application/json" };

async function api(url, opt = {}) {
  const response = await fetch(url, { credentials: "same-origin", ...opt });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function err(message) {
  const e = $("emsg");
  if (e) e.textContent = message;
}

async function load() {
  try {
    PRODUCTS = await api("/api/products");
    loadFailed = false;
  } catch (e) {
    PRODUCTS = [];
    loadFailed = true;
  }

  try {
    const me = await api("/api/me");
    ADMIN = Boolean(me.admin);
    ADMUSER = me.user || "";
  } catch (e) {
    ADMIN = false;
    ADMUSER = "";
  }

  render();
  update();
}

function openLogin() {
  if (ADMIN) return;

  $("mbody").innerHTML = `
    <div class="mtx" style="grid-column:1/-1;max-width:360px;margin:0 auto">
      <h3>Staff login</h3>
      <label>Username <input id="l-u" autocomplete="username"></label>
      <label>Password <input id="l-p" type="password" autocomplete="current-password"></label>
      <button class="cta" data-login="1">Log in</button>
      <button class="chip" data-forgot="1" type="button">Forgot password?</button>
      <span class="m" id="emsg" role="status"></span>
    </div>
  `;

  $("modal")?.classList.add("open");
  $("shade")?.classList.add("open");
  setTimeout(() => $("l-u")?.focus(), 50);
}

async function doLogin() {
  try {
    const user = $("l-u")?.value || "";
    const pass = $("l-p")?.value || "";
    await api("/api/login", {
      method: "POST",
      headers: JSONH,
      body: JSON.stringify({ user, pass }),
    });
    ADMIN = true;
    closeCart();
    await load();
  } catch (e) {
    err(e.message);
  }
}

$("mbody")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "l-p") doLogin();
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    openLogin();
  }
});

window.addEventListener("hashchange", () => {
  if (location.hash === "#admin") openLogin();
});

function openEd(id) {
  if (!ADMIN) return;

  const p = id
    ? byId(id)
    : {
        name: "",
        type: "Hand Tufted",
        room: "Living Room",
        color: "Blue",
        img: "",
        desc: "",
        sizes: [{ label: "5 x 7 ft", price: "" }],
      };

  if (!p) return;

  E = { id, img: p.img || "", blob: null };

  $("mbody").innerHTML = `
    <div class="mtx" style="grid-column:1/-1">
      <h3>${id ? "Edit carpet" : "Add carpet"}</h3>
      <label>Image (JPG, PNG or WebP)<input type="file" accept="image/jpeg,image/png,image/webp" id="up"></label>
      <div class="art mimg" id="prev" style="max-width:180px">${pic(p)}</div>
      <label>Name <input id="f-name" value="${clean(p.name)}"></label>
      <label>Type of carpet
        <input id="f-type" list="types" value="${clean(p.type)}">
        <datalist id="types">${[...new Set(PRODUCTS.map((x) => x.type))]
          .map((t) => `<option>${clean(t)}</option>`)
          .join("")}</datalist>
      </label>
      <label>Room
        <select id="f-room">
          ${ROOMS.map(
            (r) => `<option ${r[0] === p.room ? "selected" : ""}>${r[0]}</option>`
          ).join("")}
        </select>
      </label>
      <label>Colour
        <select id="f-color">
          ${Object.keys(COLORS)
            .map(
              (c) =>
                `<option ${c === p.color ? "selected" : ""}>${c}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Sizes and amounts, one per line
        <textarea id="f-sizes" rows="4">${p.sizes
          .map((z) => `${clean(z.label)} =${z.price}`)
          .join("\n")}</textarea>
      </label>
      <label>Description (optional, up to 150 words)
        <textarea id="f-desc" rows="4">${clean(p.desc)}</textarea>
        <span class="m" id="wc"></span>
      </label>
      <div class="filters">
        <button class="cta" data-save="1">Save carpet</button>
        ${id ? `<button class="chip" data-del="1">Delete</button>` : ""}
      </div>
      <span class="m" id="emsg" role="status"></span>
    </div>
  `;

  wc();
  $("modal")?.classList.add("open");
  $("shade")?.classList.add("open");
}

function wc() {
  const desc = $("f-desc");
  if (!desc || !$("wc")) return;
  const n = words(desc.value);
  $("wc").textContent = n + " / 150 words" + (n > 150 ? " (too long)" : "");
}

async function saveEd() {
  if (!ADMIN) return;

  const name = clean($("f-name")?.value);
  const desc = clean($("f-desc")?.value);
  const sizes = [];

  if (!name) {
    err("Enter a name.");
    return;
  }

  for (const ln of ($("f-sizes")?.value || "").split("\n")) {
    if (!ln.trim()) continue;
    const m = ln.split("=");
    const label = clean(m[0] || "");
    const price = parseInt(String(m[1] || "").replace(/[^0-9]/g, ""), 10);

    if (m.length !== 2 || !label || !price) {
      err(`Fix this size line: "${clean(ln)}". Use: size = amount`);
      return;
    }
    sizes.push({ label, price });
  }

  if (!sizes.length) {
    err("Add at least one size and amount.");
    return;
  }
  if (words(desc) > 150) {
    err("Description is over 150 words. Shorten it.");
    return;
  }

  try {
    err("Saving...");
    let img = E.img;

    if (E.blob) {
      const fd = new FormData();
      fd.append("image", E.blob, "photo.jpg");
      const result = await api("/api/upload", { method: "POST", body: fd });
      img = result.url;
    }

    const body = {
      name,
      type: clean($("f-type")?.value),
      room: $("f-room")?.value || "",
      color: $("f-color")?.value || "",
      desc,
      sizes,
      img,
    };

    await api(
      E.id ? `/api/products/${encodeURIComponent(E.id)}` : "/api/products",
      {
        method: E.id ? "PUT" : "POST",
        headers: JSONH,
        body: JSON.stringify(body),
      }
    );

    closeCart();
    await load();
  } catch (x) {
    err(x.message);
  }
}

async function delEd() {
  if (!ADMIN || !E?.id) return;
  try {
    await api(`/api/products/${encodeURIComponent(E.id)}`, {
      method: "DELETE",
    });
    closeCart();
    await load();
  } catch (x) {
    err(x.message);
  }
}

$("mbody")?.addEventListener("input", (e) => {
  if (e.target.id === "f-desc") wc();
});

$("mbody")?.addEventListener("change", (e) => {
  if (e.target.id !== "up" || !e.target.files?.[0]) return;

  const file = e.target.files[0];
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    err("Please choose a JPG, PNG or WebP image.");
    e.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    err("Image must be under 5 MB.");
    e.target.value = "";
    return;
  }

  const im = new Image();
  im.onload = () => {
    const c = document.createElement("canvas");
    const k = Math.min(1, 1000 / Math.max(im.width, im.height));
    c.width = Math.round(im.width * k);
    c.height = Math.round(im.height * k);

    const ctx = c.getContext("2d");
    ctx.drawImage(im, 0, 0, c.width, c.height);

    c.toBlob(
      (blob) => {
        if (!blob) {
          err("Could not process the image.");
          return;
        }
        E.blob = blob;
        const url = URL.createObjectURL(blob);
        $("prev").innerHTML = `<img src="${url}" alt="Preview">`;
      },
      "image/jpeg",
      0.85
    );
  };

  im.onerror = () => {
    err("Could not read the image.");
  };
  im.src = URL.createObjectURL(file);
});

$("adminBar")?.addEventListener("click", async (e) => {
  const d = e.target.dataset;
  if (d.out) {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    ADMIN = false;
    ADMUSER = "";
    render();
    return;
  }
  if (d.acct && ADMIN) {
    openAcct();
    return;
  }
  if (d.add && ADMIN) {
    openEd(null);
  }
});

function openForgot() {
  $("mbody").innerHTML = `
    <div class="mtx" style="grid-column:1/-1;max-width:380px;margin:0 auto">
      <h3>Reset password</h3>
      <p class="m">Step 1: click Get code. A 6-digit code will be printed in the server terminal.</p>
      <button class="chip" data-getcode="1" type="button">Get code</button>
      <p class="m">Step 2: enter code and choose new login.</p>
      <label>Code <input id="r-code" inputmode="numeric" autocomplete="one-time-code"></label>
      <label>New username <input id="r-user" autocomplete="username"></label>
      <label>New password (8+ chars) <input id="r-new" type="password" autocomplete="new-password"></label>
      <label>Repeat new password <input id="r-new2" type="password" autocomplete="new-password"></label>
      <button class="cta" data-doreset="1">Reset login</button>
      <span class="m" id="emsg" role="status"></span>
    </div>
  `;

  $("modal")?.classList.add("open");
  $("shade")?.classList.add("open");
}

async function getCode() {
  try {
    const data = await api("/api/forgot", { method: "POST" });
    // const msg = `ResetCode Code ${data.code}`;

    // // 2. Encoded URL for WhatsApp
    // const whatsappUrl = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    // // Nayi tab/WhatsApp app me kholne ke liye:
    // window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    sendWhatsAppDirect(data.code)
    err("Reset code printed in the server terminal.");
  } catch (e) {
    err(e.message);
  }
}

async function sendWhatsAppDirect(code) {
  try {
    const res = await api("/api/send-whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientPhone: "9935353482",
        messageText: "Your carpet order is confirmed! ${code}",
      }),
    });
    alert("Message sent successfully!");
  } catch (e) {
    alert("Error: " + e.message);
  }
}

async function doReset() {
  const pass1 = $("r-new")?.value || "";
  const pass2 = $("r-new2")?.value || "";

  if (pass1 !== pass2) {
    err("The new passwords do not match.");
    return;
  }
  if (pass1.length < 8) {
    err("New password must be at least 8 characters.");
    return;
  }

  try {
    await api("/api/reset", {
      method: "POST",
      headers: JSONH,
      body: JSON.stringify({
        code: $("r-code")?.value || "",
        user: $("r-user")?.value || "",
        pass: pass1,
      }),
    });

    err("Login reset successfully. Opening login...");
    setTimeout(() => {
      ADMIN = false;
      openLogin();
    }, 1000);
  } catch (e) {
    err(e.message);
  }
}

function openAcct() {
  if (!ADMIN) return;

  $("mbody").innerHTML = `
    <div class="mtx" style="grid-column:1/-1;max-width:380px;margin:0 auto">
      <h3>Change login</h3>
      <label>Current password <input id="a-cur" type="password" autocomplete="current-password"></label>
      <label>Username <input id="a-user" value="${clean(
        ADMUSER
      )}" autocomplete="username"></label>
      <label>New password (leave empty to keep current) <input id="a-new" type="password" autocomplete="new-password"></label>
      <label>Repeat new password <input id="a-new2" type="password" autocomplete="new-password"></label>
      <button class="cta" data-saveacct="1">Save login</button>
      <span class="m" id="emsg" role="status"></span>
    </div>
  `;

  $("modal")?.classList.add("open");
  $("shade")?.classList.add("open");
}

async function saveAcct() {
  if (!ADMIN) return;

  const newPass = $("a-new")?.value || "";
  const repeat = $("a-new2")?.value || "";

  if (newPass !== repeat) {
    err("The new passwords do not match.");
    return;
  }
  if (newPass && newPass.length < 8) {
    err("New password must be at least 8 characters.");
    return;
  }

  try {
    const result = await api("/api/account", {
      method: "POST",
      headers: JSONH,
      body: JSON.stringify({
        current: $("a-cur")?.value || "",
        user: $("a-user")?.value || "",
        pass: newPass,
      }),
    });

    ADMUSER = result.user;
    err("Saved. Use the new login next time.");
    $("a-cur").value = "";
    $("a-new").value = "";
    $("a-new2").value = "";
  } catch (e) {
    err(e.message);
  }
}

$("checkout")?.addEventListener("click", () => {
  if (!cart.length) {
    if ($("cmsg"))
      $("cmsg").textContent = "Add at least one carpet before ordering.";
    return;
  }

  const lines = cart
    .map((x) => {
      const p = byId(x.id);
      return `${x.q} x ${p.name}, ${p.sizes[x.s].label} (${fmt(
        sp(p, x.s)
      )} each)`;
    })
    .join("\n");

  const msg = `New order\n${lines}\nPayment: ${
    $("pay")?.value || "cod"
  }\nCode: ${$("code")?.value || "none"}\nTotal: ${
    $("tot")?.textContent || "₹0"
  }`;
  window.open(
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    "_blank",
    "noopener"
  );
});

$("nl")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if ($("nlMsg")) $("nlMsg").textContent = "Thanks for subscribing!";
});

render();
update();
load();

if (location.hash === "#admin") setTimeout(openLogin, 400);