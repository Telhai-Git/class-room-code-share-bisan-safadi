// SERVER/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const pool = require("./db");
app.use(express.json({ limit: "2mb" }));

console.log("[BOOT] Server starting", new Date().toISOString());
console.log("[BOOT] Reviews route mounted");

app.use(cors());
app.use(express.json());

//images 

const multer = require("multer");

// Multer in-memory storage for BYTEA
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Unsupported image type"), ok);
  }
});

// PDF uploader (CV)
const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === "application/pdf";
    cb(ok ? null : new Error("Only PDF files are allowed"), ok);
  }
});


// -------- Projects --------
// Public list
app.get("/api/projects", async (_req, res) => {
  try {
    const sql = `
      SELECT id, title, summary, details, image_url, github_url, youtube_url, embed_code, tech_stack
      FROM projects
      ORDER BY id DESC
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (e) {
    console.error("GET /api/projects", e);
    res.status(500).send("DB error");
  }
});


// -------- Contact --------
app.post("/api/contact", async (req, res) => {
  try {
    console.log("Incoming /api/contact body:", req.body);

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Accept rating even if it's a string; coerce safely
    const r = Number.isFinite(Number(body.rating)) ? parseInt(body.rating, 10) : NaN;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email, and message are required." });
    }
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be an integer 1–5." });
    }

    const sql = `
      INSERT INTO contact_messages (name, email, message, rating)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, rating
    `;
    const { rows } = await pool.query(sql, [name, email, message, r]);

    return res.status(201).json({
      message: "Message received!",
      id: rows[0].id,
      created_at: rows[0].created_at,
      rating: rows[0].rating
    });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// -------- Public Reviews (read-only) --------
app.get("/api/reviews", async (req, res) => {
  try {
    const minRating = Math.max(1, Math.min(5, parseInt(req.query.minRating || "1", 10)));
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const offset = parseInt(req.query.offset || "0", 10);

    const { rows } = await pool.query(
      `SELECT id, name, message, rating, created_at
       FROM contact_messages
       WHERE rating >= $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [minRating, limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* -------------------- ADMIN: bootstrap users -------------------- */
async function ensureAdmins() {
  const admins = [
    { username: "awsam", password: "1601" },
    { username: "bisan", password: "1601" },
  ];

  for (const a of admins) {
    const { rows } = await pool.query(
      "SELECT id FROM admin_users WHERE username=$1",
      [a.username]
    );
    if (!rows.length) {
      const hash = await bcrypt.hash(a.password, 12);
      await pool.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1,$2)",
        [a.username, hash]
      );
      console.log(`[SEED] Created admin ${a.username}`);
    }
  }
}
ensureAdmins().catch((e) => console.error("[SEED ERROR]", e));

/* -------------------- ADMIN: minimal schema for panel -------------------- */
// Only creates what’s missing. Safe to keep running.
async function ensureAdminPanelSchema() {
  try {
    // Blog posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        html TEXT NOT NULL,
        cover_image_url TEXT,
        video_embed_url TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        published_at TIMESTAMPTZ
      );
    `);

    // Media links (images/videos kept as URLs or embed codes)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id SERIAL PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('image','video')),
        title TEXT,
        url TEXT NOT NULL,
        embed_code TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // CV / resume items (timeline)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resume_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,          -- e.g., "Fullstack Developer"
        org TEXT,                     -- e.g., "Tel-Hai"
        description TEXT,             -- rich text or plain
        start_year INT,
        end_year INT,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    // Contact moderation flags (add columns if they don't exist)
    await pool.query(`ALTER TABLE contact_messages
      ADD COLUMN IF NOT EXISTS reviewed BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
    `);

    // Helpful triggers to auto-update updated_at on blog_posts
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = now(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'blog_posts_set_updated_at'
        ) THEN
          CREATE TRIGGER blog_posts_set_updated_at
          BEFORE UPDATE ON blog_posts
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
    `);

    console.log("[SCHEMA] Admin panel tables/columns ensured.");
  } catch (e) {
    console.error("[SCHEMA ERROR]", e);
  }
}
ensureAdminPanelSchema();

/* -------------------- ADMIN: auth -------------------- */
const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

// middleware
function adminAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, username, role }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const { rows } = await pool.query(
    "SELECT id, username, password_hash, role FROM admin_users WHERE username=$1",
    [username]
  );
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: rows[0].id, username: rows[0].username, role: rows[0].role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
  await pool.query("UPDATE admin_users SET last_login = now() WHERE id=$1", [rows[0].id]);

  return res.json({
    token,
    user: { id: rows[0].id, username: rows[0].username, role: rows[0].role },
  });
});

// example protected route (you’ll add your admin APIs here)
app.get("/api/admin/me", adminAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

/* -------------------- ADMIN: Projects CRUD -------------------- */
// --- Create project ---
app.post("/api/admin/projects", async (req, res) => {
  try {
    const b = req.body ?? {};

    // Accept both modern and legacy keys
    const title = (b.title ?? "").trim();
    const summary = (b.summary ?? "").trim();
    const detailsVal = (b.details ?? b.description ?? "").trim();   // ✅ accept either
    const image_url = (b.image_url ?? "").trim();
    const github_url = (b.github_url ?? b.github_link ?? "").trim(); // ✅ accept either
    const youtube_url = (b.youtube_url ?? b.live_demo_link ?? "").trim(); // ✅ accept either
    const embed_code = b.embed_code ?? "";
    const tech_stack = (b.tech_stack ?? "").trim();

    if (!title) return res.status(400).json({ message: "title is required" });

    // Write to BOTH columns so legacy + new stay in sync
    const sql = `
      INSERT INTO projects
        (title, summary, details, description, image_url, github_url, youtube_url, embed_code, tech_stack)
      VALUES
        ($1,    $2,     $3,      $3,          $4,        $5,         $6,          $7,         $8)
      RETURNING *
    `;
    const params = [title, summary, detailsVal, image_url, github_url, youtube_url, embed_code, tech_stack];

    console.log("[CREATE] req.body.details|description =", b.details, "|", b.description);
    const { rows } = await pool.query(sql, params);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /api/admin/projects error:", err);
    return res.status(500).send("DB error");
  }
});

// --- UPDATE ---
app.put("/api/admin/projects/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "invalid id" });

    const b = req.body ?? {};

    // Accept both modern and legacy keys
    const title = (b.title ?? "").trim();
    const summary = (b.summary ?? "").trim();
    const detailsVal = (b.details ?? b.description ?? "").trim();   // ✅ accept either
    const image_url = (b.image_url ?? "").trim();
    const github_url = (b.github_url ?? b.github_link ?? "").trim(); // ✅ accept either
    const youtube_url = (b.youtube_url ?? b.live_demo_link ?? "").trim(); // ✅ accept either
    const embed_code = b.embed_code ?? "";
    const tech_stack = (b.tech_stack ?? "").trim();

    // Update BOTH columns so legacy + new stay in sync
    const sql = `
      UPDATE projects
      SETd
        title=$1,
        summary=$2,
        details=$3,
        description=$3,
        image_url=$4,
        github_url=$5,
        youtube_url=$6,
        embed_code=$7,
        tech_stack=$8
      WHERE id=$9
      RETURNING *
    `;
    const params = [title, summary, detailsVal, image_url, github_url, youtube_url, embed_code, tech_stack, id];

    console.log("[UPDATE] req.body.details|description =", b.details, "|", b.description);
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ message: "not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("PUT /api/admin/projects/:id error:", err);
    return res.status(500).send("DB error");
  }
});
// Delete project
app.delete("/api/admin/projects/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM projects WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin projects delete]", e);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

/* -------------------- ADMIN: Media (images/videos as links) -------------------- */
app.post("/api/admin/media", adminAuth, async (req, res) => {
  try {
    const { kind, title, url, embed_code } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO media_assets (kind, title, url, embed_code)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [kind, title || null, url, embed_code || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin media create]", e);
    res.status(500).json({ message: "Failed to create media" });
  }
});

app.delete("/api/admin/media/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM media_assets WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin media delete]", e);
    res.status(500).json({ message: "Failed to delete media" });
  }
});

/* -------------------- ADMIN: Resume / CV timeline -------------------- */
app.post("/api/admin/resume", adminAuth, async (req, res) => {
  try {
    const { title, org, description, start_year, end_year, order_index } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO resume_items (title, org, description, start_year, end_year, order_index)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [title, org || null, description || null, start_year || null, end_year || null, order_index || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin resume create]", e);
    res.status(500).json({ message: "Failed to create resume item" });
  }
});

app.put("/api/admin/resume/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, org, description, start_year, end_year, order_index } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE resume_items SET
        title=COALESCE($2,title),
        org=COALESCE($3,org),
        description=COALESCE($4,description),
        start_year=COALESCE($5,start_year),
        end_year=COALESCE($6,end_year),
        order_index=COALESCE($7,order_index)
       WHERE id=$1
       RETURNING *`,
      [id, title, org, description, start_year, end_year, order_index]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin resume update]", e);
    res.status(500).json({ message: "Failed to update resume item" });
  }
});

app.delete("/api/admin/resume/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM resume_items WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin resume delete]", e);
    res.status(500).json({ message: "Failed to delete resume item" });
  }
});

/* -------------------- ADMIN: Blog posts (CRUD + publish) -------------------- */
app.post("/api/admin/blog", adminAuth, async (req, res) => {
  try {
    const { title, slug, html, cover_image_url, video_embed_url, is_published } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO blog_posts (title, slug, html, cover_image_url, video_embed_url, is_published, published_at)
       VALUES ($1,$2,$3,$4,$5,$6, CASE WHEN $6 THEN now() ELSE NULL END)
       RETURNING *`,
      [title, slug, html, cover_image_url || null, video_embed_url || null, !!is_published]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin blog create]", e);
    res.status(500).json({ message: "Failed to create post (slug unique?)" });
  }
});

// -------- Public Blog (read-only) --------
app.get("/api/blog", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, html, cover_image_url, video_embed_url,
              is_published, created_at, updated_at, published_at
       FROM blog_posts
       WHERE is_published = true
       ORDER BY COALESCE(published_at, created_at) DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/blog", e);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/blog/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { rows } = await pool.query(
      `SELECT id, title, slug, html, cover_image_url, video_embed_url,
              is_published, created_at, updated_at, published_at
       FROM blog_posts
       WHERE slug = $1 AND is_published = true
       LIMIT 1`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("GET /api/blog/:slug", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, slug, html, cover_image_url, video_embed_url } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE blog_posts SET
        title=COALESCE($2,title),
        slug=COALESCE($3,slug),
        html=COALESCE($4,html),
        cover_image_url=COALESCE($5,cover_image_url),
        video_embed_url=COALESCE($6,video_embed_url)
       WHERE id=$1
       RETURNING *`,
      [id, title, slug, html, cover_image_url, video_embed_url]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin blog update]", e);
    res.status(500).json({ message: "Failed to update post" });
  }
});


// -------- Admin Blog (list all) --------
app.get("/api/admin/blog", adminAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, html, cover_image_url, video_embed_url,
              is_published, created_at, updated_at, published_at
       FROM blog_posts
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/admin/blog", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      `SELECT id, title, slug, html, cover_image_url, video_embed_url,
              is_published, created_at, updated_at, published_at
       FROM blog_posts
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("GET /api/admin/blog/:id", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/admin/blog/:id/publish", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { publish } = req.body || {};
    const pub = !!publish;
    const { rows } = await pool.query(
      `UPDATE blog_posts
       SET is_published=$2,
           published_at=CASE WHEN $2 THEN now() ELSE NULL END
       WHERE id=$1
       RETURNING *`,
      [id, pub]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin blog publish]", e);
    res.status(500).json({ message: "Failed to change publish state" });
  }
});

app.delete("/api/admin/blog/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM blog_posts WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin blog delete]", e);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

/* -------------------- ADMIN: Contact moderation -------------------- */
app.get("/api/admin/contact", adminAuth, async (req, res) => {
  try {
    const show = (req.query.show || "all").toLowerCase(); // all | unread | archived
    let where = "1=1";
    if (show === "unread") where = "reviewed = false AND archived = false";
    if (show === "archived") where = "archived = true";
    const { rows } = await pool.query(
      `SELECT id, name, email, message, rating, created_at, reviewed, archived
       FROM contact_messages
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error("[admin contact list]", e);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

app.patch("/api/admin/contact/:id/review", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reviewed = true } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE contact_messages SET reviewed=$2 WHERE id=$1 RETURNING *`,
      [id, !!reviewed]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin contact review]", e);
    res.status(500).json({ message: "Failed to update review state" });
  }
});

app.patch("/api/admin/contact/:id/archive", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { archived = true } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE contact_messages SET archived=$2 WHERE id=$1 RETURNING *`,
      [id, !!archived]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error("[admin contact archive]", e);
    res.status(500).json({ message: "Failed to update archive state" });
  }
});

app.delete("/api/admin/contact/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query("DELETE FROM contact_messages WHERE id=$1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin contact delete]", e);
    res.status(500).json({ message: "Failed to delete message" });
  }
});



// -------- Images (BYTEA) --------

// Upload one image as BYTEA
app.post("/api/images-blob", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const title = (req.body?.title || req.file.originalname || "untitled").trim();
    const data = req.file.buffer;
    const mime = req.file.mimetype;
    const bytes = req.file.size;

    const { rows } = await pool.query(
      `INSERT INTO images_blob (title, data, mime, bytes)
       VALUES ($1,$2,$3,$4)
       RETURNING id, title, mime, bytes, created_at`,
      [title, data, mime, bytes]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /api/images-blob", e);
    res.status(500).json({ message: "Upload failed" });
  }
});

// List (metadata only)
app.get("/api/images-blob", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, mime, bytes, created_at
       FROM images_blob
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error("GET /api/images-blob", e);
    res.status(500).json({ message: "Server error" });
  }
});

// Serve bytes by id (usable directly as <img src=...>)
app.get("/api/images-blob/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT data, mime FROM images_blob WHERE id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.sendStatus(404);
    res.setHeader("Content-Type", rows[0].mime);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(rows[0].data);
  } catch (e) {
    console.error("GET /api/images-blob/:id", e);
    res.status(500).json({ message: "Server error" });
  }
});


/* -------------------- ABOUT: schema & seed -------------------- */
async function ensureAboutSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS about_experiences (
        id SERIAL PRIMARY KEY,
        member_key TEXT NOT NULL,
        org TEXT NOT NULL,
        title TEXT NOT NULL,
        start_year INT,
        end_year INT,
        description TEXT,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_about_experiences_member_order
        ON about_experiences(member_key, order_index);

      CREATE TABLE IF NOT EXISTS about_skills (
        id SERIAL PRIMARY KEY,
        member_key TEXT NOT NULL,
        name TEXT NOT NULL,
        level INT NOT NULL CHECK (level BETWEEN 0 AND 100),
        spotlight BOOLEAN NOT NULL DEFAULT false,
        order_index INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_about_skills_member_name
        ON about_skills(member_key, name);
    `);

    // Seed defaults if empty:
    const { rows: c1 } = await pool.query(`SELECT count(*)::int AS n FROM about_experiences`);
    const { rows: c2 } = await pool.query(`SELECT count(*)::int AS n FROM about_skills`);

    if (c1[0].n === 0 || c2[0].n === 0) {
      await pool.query(`
        -- same seed as in the SQL block; safe to keep here too
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM about_experiences WHERE member_key='bisan') THEN
            INSERT INTO about_experiences (member_key, org, title, start_year, end_year, description, order_index) VALUES
            ('bisan','Student Projects','Fullstack Developer',2024,NULL,'Building modern UIs and fullstack features with React, Node and PostgreSQL.',10),
            ('bisan','Team Collaboration','Frontend Lead',2024,NULL,'Focused on clean UI, accessibility and component design.',20);
          END IF;

          IF NOT EXISTS (SELECT 1 FROM about_experiences WHERE member_key='awsam') THEN
            INSERT INTO about_experiences (member_key, org, title, start_year, end_year, description, order_index) VALUES
            ('awsam','Student Projects','Backend Developer',2024,NULL,'Designing APIs, data models and integrations for fullstack apps.',10),
            ('awsam','Problem Solving','Systems & Logic',2024,NULL,'Ownership on server logic, validations and performance.',20);
          END IF;

          IF NOT EXISTS (SELECT 1 FROM about_skills WHERE member_key='bisan') THEN
            INSERT INTO about_skills (member_key, name, level, spotlight, order_index) VALUES
            ('bisan','React',88,true,10),
            ('bisan','Bootstrap',90,true,20),
            ('bisan','Node.js/Express',80,true,30),
            ('bisan','PostgreSQL',78,true,40),
            ('bisan','REST APIs',82,true,50),
            ('bisan','JavaScript (ES6+)',85,false,60),
            ('bisan','HTML/CSS',90,false,70),
            ('bisan','Git/GitHub',86,false,80);
          END IF;

          IF NOT EXISTS (SELECT 1 FROM about_skills WHERE member_key='awsam') THEN
            INSERT INTO about_skills (member_key, name, level, spotlight, order_index) VALUES
            ('awsam','Node.js/Express',90,true,10),
            ('awsam','PostgreSQL',84,true,20),
            ('awsam','API Design',88,true,30),
            ('awsam','React',75,true,40),
            ('awsam','Docker',70,true,50),
            ('awsam','Git/GitHub',85,false,60);
          END IF;
        END $$;
      `);
      console.log("[SCHEMA] About tables seeded.");
    } else {
      console.log("[SCHEMA] About tables exist (no seed).");
    }
  } catch (e) {
    console.error("[SCHEMA ABOUT ERROR]", e);
  }
}
ensureAboutSchema();



/* -------------------- ABOUT: public read APIs -------------------- */
app.get("/api/about/experiences", async (req, res) => {
  try {
    const member = String(req.query.member || "").toLowerCase();
    if (!member) return res.status(400).json({ message: "member is required (e.g., bisan, awsam)" });
    const { rows } = await pool.query(
      `SELECT id, org, title, start_year, end_year, description, order_index
       FROM about_experiences
       WHERE member_key = $1
       ORDER BY order_index, id`,
      [member]
    );
    res.json(rows);
  } catch (e) {
    console.error("[about experiences]", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/about/skills", async (req, res) => {
  try {
    const member = String(req.query.member || "").toLowerCase();
    if (!member) return res.status(400).json({ message: "member is required (e.g., bisan, awsam)" });
    const { rows } = await pool.query(
      `SELECT id, name, level, spotlight, order_index
       FROM about_skills
       WHERE member_key = $1
       ORDER BY order_index, name`,
      [member]
    );
    res.json(rows);
  } catch (e) {
    console.error("[about skills]", e);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/cv  (member: awsam|bisan; file: pdf)
app.post("/api/cv", uploadPdf.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const member = String(req.body?.member || "").toLowerCase().trim();
    if (!["awsam", "bisan"].includes(member)) return res.status(400).json({ message: "member must be 'awsam' or 'bisan'" });

    const { buffer: data, mimetype: mime } = req.file;

    // ✅ UPSERT replaces existing row for that member
    const { rows } = await pool.query(
      `INSERT INTO cv_documents (member, data, mime, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (member)
       DO UPDATE SET
         data = EXCLUDED.data,
         mime = EXCLUDED.mime,
         updated_at = now()
       RETURNING id, member, updated_at`,
      [member, data, mime]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
});


app.get("/api/cv", async (req, res) => {
  const member = (req.query.member || "").toString().toLowerCase();
  const q = (member === "awsam" || member === "bisan")
    ? { sql: `SELECT id,member,created_at FROM cv_documents WHERE member=$1 ORDER BY created_at DESC`, args: [member] }
    : { sql: `SELECT id,member,created_at FROM cv_documents ORDER BY created_at DESC`, args: [] };
  const { rows } = await pool.query(q.sql, q.args);
  res.json(rows);
});

app.get("/api/cv/latest", async (req, res) => {
  const member = String(req.query.member || "").toLowerCase().trim();
  if (!["awsam", "bisan"].includes(member)) {
    return res.status(400).json({ message: "member is required ('awsam' or 'bisan')" });
  }
  const { rows } = await pool.query(
    `SELECT member, data, mime FROM cv_documents WHERE member = $1 LIMIT 1`,
    [member]
  );
  if (!rows.length) return res.sendStatus(404);

  const r = rows[0];
  const download = String(req.query.download || "") === "1";
  const filename = `${member}-cv.pdf`;

  res.setHeader("Content-Type", r.mime || "application/pdf");
  res.setHeader(
    "Content-Disposition",
    download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
  );
  res.send(r.data);
});


app.get("/api/cv/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { rows } = await pool.query(`SELECT member,data,mime FROM cv_documents WHERE id=$1`, [id]);
  if (!rows.length) return res.sendStatus(404);
  const r = rows[0], download = String(req.query.download || "") === "1";
  const filename = `${r.member || "cv"}.pdf`;
  res.setHeader("Content-Type", r.mime || "application/pdf");
  res.setHeader("Content-Disposition", download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`);
  res.send(r.data);
});

// ================== ADMIN: CV PDFs (protected) ==================
app.post("/api/admin/cv", adminAuth, uploadPdf.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const member = String(req.body?.member || "").toLowerCase().trim();
    if (!["awsam", "bisan"].includes(member)) {
      return res.status(400).json({ message: "member must be 'awsam' or 'bisan'" });
    }
    const { buffer: data, mimetype: mime } = req.file;

    // ✅ UPSERT (replace existing)
    const { rows } = await pool.query(
      `INSERT INTO cv_documents (member, data, mime, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (member)
       DO UPDATE SET
         data = EXCLUDED.data,
         mime = EXCLUDED.mime,
         updated_at = now()
       RETURNING id, member, updated_at`,
      [member, data, mime]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("[admin cv upload]", e);
    res.status(500).json({ message: "Upload failed" });
  }
});



app.get("/api/admin/cv", adminAuth, async (req, res) => {
  try {
    const member = (req.query.member || "").toString().toLowerCase();
    let rows;
    if (member === "awsam" || member === "bisan") {
      ({ rows } = await pool.query(
        `SELECT id, member, created_at
         FROM cv_documents
         WHERE member = $1
         ORDER BY created_at DESC`,
        [member]
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT id, member, created_at
         FROM cv_documents
         ORDER BY created_at DESC`
      ));
    }
    res.json(rows);
  } catch (e) {
    console.error("[admin cv list]", e);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/admin/cv/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query(`DELETE FROM cv_documents WHERE id=$1`, [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error("[admin cv delete]", e);
    res.status(500).json({ message: "Failed to delete CV" });
  }
});



/* -------------------- Health & debug (unchanged) -------------------- */
app.get("/", (_req, res) => res.send("API up"));

// ---- DEBUG: list all mounted routes on boot ----
function logRoutes() {
  try {
    console.log("[BOOT] Listing routes:");
    app._router.stack
      .filter((l) => l.route && l.route.path)
      .forEach((l) => {
        const methods = Object.keys(l.route.methods).join(",").toUpperCase();
        console.log(`  ${methods.padEnd(10)} ${l.route.path}`);
      });
  } catch (e) {
    console.log("[BOOT] Could not list routes:", e);
  }
}

// quick debug endpoint to view routes from the browser
app.get("/__routes", (_req, res) => {
  const routes = [];
  (app._router.stack || []).forEach((l) => {
    if (l.route && l.route.path) {
      routes.push({
        path: l.route.path,
        methods: Object.keys(l.route.methods),
      });
    }
  });
  res.json({ ok: true, routes });
});

// -------- Start server (always last) --------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  logRoutes(); // <-- must print all routes including /api/reviews
});
