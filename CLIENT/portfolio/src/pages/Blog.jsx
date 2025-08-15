// src/pages/Blog.jsx
import { useEffect, useState } from "react";
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Table, TableHead, TableRow, TableCell, TableBody, Switch, FormControlLabel
} from "@mui/material";
import { api } from "../api"; // same note as above re: import

export default function Blog() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        title: "", slug: "", html: "", cover_image_url: "", video_embed_url: "", is_published: false
    });

    async function load() {
        // quick admin-ish list: reuse the public blog list if you have one, else create a simple admin list
        // Your server doesn't have GET /api/admin/blog, so we'll use /api/blog (create if needed).
        // For now, fetch directly from DB via a small admin endpoint OR skip list & rely on local state.
        // Easiest: create a tiny admin list route (optional). If not—comment this out and manage created items locally.
        try {
            const rows = await api("/api/admin/contact?show=all"); // placeholder to avoid unused code
            void rows; // remove this when you add a GET list for blog posts
        } catch { }
    }
    useEffect(() => { load(); }, []);

    function startCreate() {
        setForm({ title: "", slug: "", html: "", cover_image_url: "", video_embed_url: "", is_published: false });
        setEditingId(null);
        setOpen(true);
    }
    function startEdit(row) {
        setEditingId(row.id);
        setForm({
            title: row.title || "", slug: row.slug || "", html: row.html || "",
            cover_image_url: row.cover_image_url || "", video_embed_url: row.video_embed_url || "",
            is_published: !!row.is_published
        });
        setOpen(true);
    }

    async function save() {
        if (!form.title.trim() || !form.slug.trim() || !form.html.trim()) {
            return alert("title, slug, and html are required");
        }
        if (editingId) {
            await api(`/api/admin/blog/${editingId}`, { method: "PUT", body: form });
        } else {
            await api("/api/admin/blog", { method: "POST", body: form });
        }
        setOpen(false);
        await load();
    }

    async function publishToggle(row, publish) {
        await api(`/api/admin/blog/${row.id}/publish`, { method: "PATCH", body: { publish } });
        await load();
    }

    return (
        <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <h2>Blog</h2>
                <Box sx={{ ml: "auto" }}>
                    <Button variant="contained" onClick={startCreate}>+ New Post</Button>
                </Box>
            </Box>

            {/* Table is a placeholder until you add a GET list endpoint for blogs */}
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Slug</TableCell>
                        <TableCell>Published</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>{row.title}</TableCell>
                            <TableCell>{row.slug}</TableCell>
                            <TableCell>{row.is_published ? "Yes" : "No"}</TableCell>
                            <TableCell align="right">
                                <Button size="small" onClick={() => startEdit(row)}>Edit</Button>
                                <FormControlLabel
                                    sx={{ ml: 1 }}
                                    control={<Switch checked={!!row.is_published} onChange={e => publishToggle(row, e.target.checked)} />}
                                    label="Publish"
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingId ? "Edit Post" : "New Post"}</DialogTitle>
                <DialogContent dividers sx={{ display: "grid", gap: 2, pt: 2 }}>
                    <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <TextField label="Slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                    <TextField label="HTML" multiline minRows={6} value={form.html} onChange={e => setForm({ ...form, html: e.target.value })} />
                    <TextField label="Cover Image URL" value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} />
                    <TextField label="Video Embed URL" value={form.video_embed_url} onChange={e => setForm({ ...form, video_embed_url: e.target.value })} />
                    <FormControlLabel
                        control={<Switch checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />}
                        label="Published"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
