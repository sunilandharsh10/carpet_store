const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const PHONE_NUMBER_ID = "9935353482";
const ACCESS_TOKEN = "harshWhatsApp";
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "products.json");
const IMG = path.join(__dirname, "public", "images");
const ADMIN_FILE = path.join(__dirname, "admin.json");
const SESS_FILE = path.join(__dirname, "sessions.json");

fs.mkdirSync(IMG, { recursive: true });

/* ---------- Helpers ---------- */
const read = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA, "utf8"));
  } catch {
    return [];
  }
};

const write = (data) => {
  fs.writeFileSync(DATA + ".tmp", JSON.stringify(data, null, 2));
  fs.renameSync(DATA + ".tmp", DATA);
};

const words = (text) =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const strip = (text) =>
  String(text || "")
    .replace(/[<>"]/g, "")
    .trim();

const sha = (text) =>
  crypto
    .createHash("sha256")
    .update(String(text))
    .digest();

const hash = (text) =>
  crypto
    .createHash("sha256")
    .update(String(text))
    .digest("hex");

const mtime = (file) => {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
};

const rmImg = (url) => {
  if (/^images\/[\w.-]+$/.test(url || "")) {
    fs.unlink(path.join(IMG, path.basename(url)), () => {});
  }
};

/* ---------- Middleware ---------- */
app.use(express.json({ limit: "100kb" }));

/* ---------- Admin Credentials ---------- */
const mkAdmin = (user, pass) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    user,
    salt,
    hash: crypto
      .scryptSync(String(pass), salt, 64)
      .toString("hex")
  };
};

const checkPw = (pass, admin) => {
  try {
    const stored = Buffer.from(admin.hash, "hex");
    const calculated = crypto.scryptSync(
      String(pass || ""),
      admin.salt,
      64
    );

    return (
      stored.length === calculated.length &&
      crypto.timingSafeEqual(stored, calculated)
    );
  } catch {
    return false;
  }
};

let ADM = null;
let admTime = -1;

function saveAdmin(admin) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(admin, null, 2), {
    mode: 0o600
  });
  ADM = admin;
  admTime = mtime(ADMIN_FILE);
}

function getAdm() {
  const currentTime = mtime(ADMIN_FILE);
  if (ADM && currentTime === admTime) {
    return ADM;
  }

  if (fs.existsSync(ADMIN_FILE)) {
    try {
      const admin = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
      if (admin.user && admin.salt && admin.hash) {
        ADM = admin;
        admTime = currentTime;
        return ADM;
      }
    } catch (err) {
      console.error("Error reading admin.json:", err.message);
    }
  }

  const defaultUser = process.env.ADMIN_USER || "admin";
  const defaultPass = process.env.ADMIN_PASS || "harsh@123";
  const admin = mkAdmin(defaultUser, defaultPass);
  
  saveAdmin(admin);

  console.log("");
  console.log("=================================");
  console.log("Created admin.json");
  console.log(`Username: ${defaultUser}`);
  console.log(`Password: ${defaultPass}`);
  console.log("Please update credentials via Admin panel.");
  console.log("=================================");
  console.log("");

  return ADM;
}

getAdm();

/* ---------- Sessions ---------- */
let sessions = {};
try {
  sessions = JSON.parse(fs.readFileSync(SESS_FILE, "utf8"));
} catch {
  sessions = {};
}

const saveSess = () => {
  const now = Date.now();
  for (const key of Object.keys(sessions)) {
    if (sessions[key] < now) {
      delete sessions[key];
    }
  }
  fs.writeFileSync(SESS_FILE, JSON.stringify(sessions, null, 2), {
    mode: 0o600
  });
};

const getToken = (req) => {
  const cookie = req.headers.cookie || "";
  const item = cookie
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("sid="));
  return item ? item.slice(4) : "";
};

const isAdmin = (req) => {
  const token = getToken(req);
  if (!token) {
    return false;
  }
  return (sessions[hash(token)] || 0) > Date.now();
};

const auth = (req, res, next) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Login required" });
  }
  next();
};

/* ---------- Rate Limiter Cleanup ---------- */
const tries = {};
setInterval(() => {
  const now = Date.now();
  for (const ip in tries) {
    if (tries[ip].until < now) {
      delete tries[ip];
    }
  }
}, 10 * 60 * 1000);

/* ---------- Login Route ---------- */
app.post("/api/login", (req, res) => {
  const ip = req.ip || "127.0.0.1";
  const attempt =
    tries[ip] ||
    (tries[ip] = { n: 0, until: 0 });

  if (Date.now() < attempt.until) {
    return res.status(429).json({
      error: "Too many wrong attempts. Try again in 5 minutes."
    });
  }

  const { user, pass } = req.body || {};
  const admin = getAdm();

  const usernameOk = crypto.timingSafeEqual(
    sha(String(user || "").trim().toLowerCase()),
    sha(String(admin.user).trim().toLowerCase())
  );
  const passwordOk = checkPw(pass, admin);

  if (!usernameOk || !passwordOk) {
    attempt.n++;
    if (attempt.n >= 5) {
      attempt.until = Date.now() + 5 * 60 * 1000;
      attempt.n = 0;
    }

    return res.status(401).json({
      error: "Wrong username or password."
    });
  }

  attempt.n = 0;
  const id = crypto.randomBytes(32).toString("hex");
  sessions[hash(id)] = Date.now() + 8 * 60 * 60 * 1000;
  saveSess();

  res.setHeader(
    "Set-Cookie",
    `sid=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${
      req.secure ? "; Secure" : ""
    }`
  );
  res.json({ ok: true });
});

/* ---------- Logout ---------- */
app.post("/api/logout", (req, res) => {
  const token = getToken(req);
  if (token) {
    delete sessions[hash(token)];
    saveSess();
  }
  res.setHeader(
    "Set-Cookie",
    "sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
  );
  res.json({ ok: true });
});

/* ---------- Current User Session ---------- */
app.get("/api/me", (req, res) => {
  if (isAdmin(req)) {
    return res.json({
      admin: true,
      user: getAdm().user
    });
  }
  res.json({ admin: false });
});

/* ---------- Account Updates ---------- */
app.post("/api/account", auth, (req, res) => {
  const { current, user, pass } = req.body || {};
  const admin = getAdm();

  if (!checkPw(current, admin)) {
    return res.status(401).json({ error: "Current password is wrong." });
  }

  const username = strip(user);
  if (username.length < 3 || username.length > 40) {
    return res.status(400).json({
      error: "Username must be 3 to 40 characters."
    });
  }

  if (pass && String(pass).length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters."
    });
  }

  if (pass) {
    saveAdmin(mkAdmin(username, pass));
  } else {
    saveAdmin({ ...admin, user: username });
  }

  const currentSession = hash(getToken(req));
  for (const key of Object.keys(sessions)) {
    if (key !== currentSession) {
      delete sessions[key];
    }
  }
  saveSess();

  res.json({ ok: true, user: username });
});

/* ---------- Forgot & Reset Password ---------- */
let reset = null;
let lastAsk = 0;

app.post("/api/forgot", (req, res) => {
  if (Date.now() - lastAsk < 60 * 1000) {
    return res.status(429).json({
      error: "Wait 1 minute before requesting another code."
    });
  }

  lastAsk = Date.now();
  const code = String(crypto.randomInt(100000, 1000000));

  reset = {
    hash: sha(code),
    until: Date.now() + 10 * 60 * 1000,
    attempts: 0
  };

  

  console.log("");
  console.log("=================================");
  console.log("PASSWORD RESET CODE: " + code);
  console.log("Valid for 10 minutes.");
  console.log("=================================");
  console.log("");

  res.json({
    ok: true,
    code: code,
    message: "Reset code generated. Check server console terminal."
  });
});

app.post("/api/reset", (req, res) => {
  const { code, user, pass } = req.body || {};

  if (!reset) {
    return res.status(400).json({ error: "No reset code requested." });
  }

  if (Date.now() > reset.until) {
    reset = null;
    return res.status(400).json({ error: "Reset code expired." });
  }

  reset.attempts++;
  if (reset.attempts > 5) {
    reset = null;
    return res.status(429).json({ error: "Too many wrong attempts." });
  }

  const supplied = sha(String(code || "").trim());
  if (
    supplied.length !== reset.hash.length ||
    !crypto.timingSafeEqual(supplied, reset.hash)
  ) {
    return res.status(401).json({ error: "Wrong reset code." });
  }

  const username = strip(user);
  const password = String(pass || "");

  if (username.length < 3 || username.length > 40) {
    return res.status(400).json({
      error: "Username must be 3 to 40 characters."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "New password must be at least 8 characters."
    });
  }

  saveAdmin(mkAdmin(username, password));
  sessions = {};
  saveSess();
  reset = null;

  res.json({ ok: true, message: "Login reset successfully." });
});

/* ---------- Product Sanitization ---------- */
function cleanProduct(body) {
  const sizes = (Array.isArray(body.sizes) ? body.sizes : [])
    .map((z) => ({
      label: strip(z.label).slice(0, 40),
      price: Math.round(Number(z.price))
    }))
    .filter((z) => z.label && z.price > 0);

  const name = strip(body.name);
  const desc = strip(body.desc);

  if (!name || !sizes.length || words(desc) > 150) {
    return null;
  }

  return {
    name: name.slice(0, 120),
    type: strip(body.type).slice(0, 40) || "Carpet",
    room: strip(body.room).slice(0, 40),
    color: strip(body.color).slice(0, 20),
    desc,
    img: /^images\/[\w.-]+$/.test(body.img || "") ? body.img : "",
    sizes
  };
}

/* ---------- Products API ---------- */
app.get("/api/products", (req, res) => {
  res.json(read());
});

const EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

const upload = multer({
  storage: multer.diskStorage({
    destination: IMG,
    filename: (req, file, cb) => {
      cb(
        null,
        Date.now() +
          "-" +
          crypto.randomBytes(3).toString("hex") +
          EXT[file.mimetype]
      );
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, !!EXT[file.mimetype]);
  }
});

app.post("/api/upload", auth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Upload a JPG, PNG or WebP image under 5 MB."
    });
  }
  res.json({ url: "images/" + req.file.filename });
});

app.post("/api/products", auth, (req, res) => {
  const product = cleanProduct(req.body || {});
  if (!product) {
    return res.status(400).json({
      error: "Invalid product parameters or description exceeds 150 words."
    });
  }

  const list = read();
  const productWithId = {
    id: "p" + Date.now(),
    k: list.length,
    ...product
  };

  list.unshift(productWithId);
  write(list);

  res.json(productWithId);
});

app.put("/api/products/:id", auth, (req, res) => {
  const product = cleanProduct(req.body || {});
  if (!product) {
    return res.status(400).json({
      error: "Invalid product parameters or description exceeds 150 words."
    });
  }

  const list = read();
  const index = list.findIndex((x) => x.id === req.params.id);

  if (index < 0) {
    return res.status(404).json({ error: "Carpet not found." });
  }

  if (list[index].img && list[index].img !== product.img) {
    rmImg(list[index].img);
  }

  list[index] = {
    id: list[index].id,
    k: list[index].k,
    ...product
  };

  write(list);
  res.json(list[index]);
});

app.delete("/api/products/:id", auth, (req, res) => {
  const list = read();
  const product = list.find((x) => x.id === req.params.id);

  if (!product) {
    return res.status(404).json({ error: "Carpet not found." });
  }

  rmImg(product.img);
  write(list.filter((x) => x.id !== req.params.id));

  res.json({ ok: true });
});

//==================Whats App messages====================//

app.post("/api/send-whatsapp", async (req, res) => {
  const { recipientPhone, messageText } = req.body;

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipientPhone, // e.g. "919876543210"
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Failed to send");

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Static Middleware & Startup ---------- */
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: "Upload failed or request invalid." });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});