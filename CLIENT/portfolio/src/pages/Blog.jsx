// src/pages/Blog.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Switch, FormControlLabel, Alert, CircularProgress, Stack, Chip
} from "@mui/material";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import "./Blog.css";

/* ---------- helpers ---------- */
function toSlug(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}
function getExcerpt(html, maxLen = 180) {
  const txt = stripHtml(html);
  return txt.length <= maxLen ? txt : txt.slice(0, maxLen).trim() + "…";
}

export default function Blog() {
  const { token } = useApp();
  const isAdmin = !!token;

  const [items, setItems] = useState([]);
  const [, setLoading] = useState(true); // we only use setLoading to trigger spinner state
  const [loadingNow, setLoadingNow] = useState(true); // actual loading flag for UI
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    html: "",
    cover_image_url: "",
    video_embed_url: "",
    is_published: false,
  });

  /* ---------- load posts ---------- */
  async function load() {
    try {
      setErr("");
      setLoading(true);
      setLoadingNow(true);
      const rows = isAdmin
        ? await api("/api/admin/blog", { method: "GET", auth: true })
        : await api("/api/blog", { method: "GET", auth: false });
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      setErr("Failed to load blog posts.");
    } finally {
      setLoading(false);
      setLoadingNow(false);
    }
  }
  useEffect(() => { load(); }, [isAdmin]);

  /* ---------- admin actions ---------- */
  function startCreate() {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      html: "",
      cover_image_url: "",
      video_embed_url: "",
      is_published: false,
    });
    setOpen(true);
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      title: row.title || "",
      slug: row.slug || "",
      html: row.html || "",
      cover_image_url: row.cover_image_url || "",
      video_embed_url: row.video_embed_url || "",
      is_published: !!row.is_published,
    });
    setOpen(true);
  }

  async function save() {
    const title = form.title.trim();
    const slug = (form.slug.trim() || toSlug(title));
    const html = form.html.trim();
    if (!title) return alert("Title is required");
    if (!slug) return alert("Slug is required");
    if (!html) return alert("HTML/body is required");

    const body = {
      title,
      slug,
      html,
      cover_image_url: form.cover_image_url.trim() || null,
      video_embed_url: form.video_embed_url.trim() || null,
      is_published: !!form.is_published, // used by POST create
    };

    try {
      setErr("");
      if (editingId) {
        await api(`/api/admin/blog/${editingId}`, { method: "PUT", body, auth: true });
      } else {
        await api("/api/admin/blog", { method: "POST", body, auth: true });
      }
      setOpen(false);
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to save the post (is the slug unique?).");
    }
  }

  async function publishToggle(row, publish) {
    try {
      setErr("");
      await api(`/api/admin/blog/${row.id}/publish`, {
        method: "PATCH",
        body: { publish: !!publish },
        auth: true,
      });
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to change publish state.");
    }
  }

  async function removePost(row) {
    if (!window.confirm(`Delete post "${row.title}"? This cannot be undone.`)) return;
    try {
      setErr("");
      await api(`/api/admin/blog/${row.id}`, { method: "DELETE", auth: true });
      await load();
    } catch (e) {
      console.error(e);
      setErr("Failed to delete the post.");
    }
  }

  const rowsForTable = useMemo(() => [...items], [items]);

  /* ---------- UI ---------- */
  return (
    <Box className="about-section fade-in" sx={{ p: { xs: 2, md: 4 } }}>
      {/* Title + add */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <h2 className="title-accent title-animate text-purple" style={{ margin: 0 }}>Blog</h2>
        {isAdmin && (
          <Box sx={{ ml: "auto" }}>
            <Button
              variant="contained"
              onClick={startCreate}
              sx={{
                backgroundColor: "#6f42c1",
                "&:hover": { backgroundColor: "#5a35a8" },
                borderRadius: 2,
              }}
            >
              + New Post
            </Button>
          </Box>
        )}
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {loadingNow ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* PUBLIC view: cards with thumbnail */}
          {!isAdmin && (
            <>
              {rowsForTable.length === 0 ? (
                <Alert severity="info">No blog posts yet.</Alert>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  {rowsForTable.map((row, i) => (
                    <Box
                      key={row.id}
                      className="about-card blog-card card-animate"
                      style={{ animationDelay: `${i * 0.08}s` }}
                      sx={{ p: 0, borderRadius: 3, boxShadow: "0 8px 24px rgba(0,0,0,.06)" }}
                    >
                      {/* cover thumbnail */}
                      {row.cover_image_url && (
                        <div className="blog-thumb-wrap">
                          <img
                            src={row.cover_image_url}
                            alt={row.title}
                            className="blog-thumb"
                            loading="lazy"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}

                      <Box sx={{ display: "grid", gap: 1, p: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                          <h3 style={{ margin: 0 }}>{row.title}</h3>
                          {row.is_published ? null : <Chip size="small" label="Draft" />}
                        </Box>

                        <div className="blog-meta">
                          {row.published_at
                            ? new Date(row.published_at).toLocaleDateString()
                            : new Date(row.created_at).toLocaleDateString()}
                        </div>

                        <p style={{ margin: 0 }}>{getExcerpt(row.html, 180)}</p>

                        <Box sx={{ mt: 1 }}>
                          <Link className="blog-link" to={`/blog/${row.slug}`}>Read more →</Link>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}

          {/* ADMIN view: table with Edit/Delete/Publish */}
          {isAdmin && (
            rowsForTable.length === 0 ? (
              <Alert severity="info">No blog posts yet.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Published</TableCell>
                    <TableCell>Dates</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rowsForTable.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <span>{row.title}</span>
                          {row.cover_image_url && <Chip size="small" label="Cover" />}
                          {row.video_embed_url && <Chip size="small" label="Video" />}
                        </Stack>
                      </TableCell>
                      <TableCell>{row.slug}</TableCell>
                      <TableCell>{row.is_published ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <small className="blog-meta">
                          created: {new Date(row.created_at).toLocaleString()}<br />
                          {row.published_at ? `published: ${new Date(row.published_at).toLocaleString()}` : ""}
                        </small>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => startEdit(row)}
                          sx={{ mr: 1, textTransform: "none" }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removePost(row)}
                          sx={{ mr: 1, textTransform: "none" }}
                        >
                          Delete
                        </Button>
                        <FormControlLabel
                          sx={{ ml: 1 }}
                          control={
                            <Switch
                              checked={!!row.is_published}
                              onChange={(e) => publishToggle(row, e.target.checked)}
                            />
                          }
                          label="Publish"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}
        </>
      )}

      {/* ---------- Admin dialog ---------- */}
      {isAdmin && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle className="text-purple">
            {editingId ? "Edit Post" : "New Post"}
          </DialogTitle>
          <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  title: e.target.value,
                  slug: f.slug ? f.slug : toSlug(e.target.value),
                }))
              }
              fullWidth
              required
            />
            <TextField
              label="Slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: toSlug(e.target.value) }))}
              fullWidth
              helperText="URL-friendly id, e.g. hello-world"
              required
            />
            <TextField
              label="HTML (content)"
              value={form.html}
              onChange={(e) => setForm((f) => ({ ...f, html: e.target.value }))}
              fullWidth
              multiline
              minRows={8}
              required
            />
            <TextField
              label="Cover Image URL (optional)"
              value={form.cover_image_url}
              onChange={(e) => setForm((f) => ({ ...f, cover_image_url: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Video Embed URL (optional)"
              value={form.video_embed_url}
              onChange={(e) => setForm((f) => ({ ...f, video_embed_url: e.target.value }))}
              fullWidth
            />
            {!editingId && (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!form.is_published}
                    onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  />
                }
                label="Publish immediately"
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => setOpen(false)}
              sx={{
                color: "#6f42c1",
                borderColor: "#6f42c1",
                borderWidth: 1.5,
                "&:hover": {
                  borderColor: "#5a35a8",
                  backgroundColor: "rgba(111,66,193,0.08)",
                },
                textTransform: "uppercase",
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              sx={{
                backgroundColor: "#6f42c1",
                "&:hover": { backgroundColor: "#5a35a8" },
                color: "#fff",
                textTransform: "uppercase",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(111,66,193,0.35)",
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
