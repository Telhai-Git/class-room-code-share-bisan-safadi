import { useEffect, useState } from "react";
import {
    Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import { api } from "../api"; // if you used default export, use `import { api }`? -> we exported named `api`? We exported function `api`. Adjust:
import * as API from "../api"; // <-- use this import instead

export default function Projects() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [editing, setEdit] = useState(null);
    const [form, setForm] = useState({
        title: "", summary: "", image_url: "",
        github_url: "", youtube_url: "", embed_code: "", tech_stack: ""
    });

    async function load() {
        // public list (no auth)
        const rows = await API.api("/api/projects", { auth: false });
        // optional client-side search:
        const f = q ? rows.filter(r =>
            r.title?.toLowerCase().includes(q.toLowerCase()) ||
            (r.tech_stack || "").toLowerCase().includes(q.toLowerCase())
        ) : rows;
        setItems(f);
    }
    useEffect(() => { load(); }, []); // load once

    function startCreate() { setForm({ title: "", summary: "", image_url: "", github_url: "", youtube_url: "", embed_code: "", tech_stack: "" }); setEdit(null); setOpen(true); }
    async function startEdit(row) {
        setEdit(row.id);
        setForm({
            title: row.title || "", summary: row.summary || "", image_url: row.image_url || "",
            github_url: row.github_url || "", youtube_url: row.youtube_url || "",
            embed_code: row.embed_code || "", tech_stack: row.tech_stack || ""
        });
        setOpen(true);
    }

    async function save() {
        if (!form.title.trim()) return alert("Title is required");
        if (editing) {
            await API.api(`/api/admin/projects/${editing}`, { method: "PUT", body: form });
        } else {
            await API.api("/api/admin/projects", { method: "POST", body: form });
        }
        setOpen(false);
        await load();
    }

    async function deleteRow(id) {
        if (!window.confirm("Delete this project?")) return;
        await API.api(`/api/admin/projects/${id}`, { method: "DELETE" });
        await load();
    }

    return (
        <Box sx={{ display: "grid", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <h2>Projects</h2>
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <TextField size="small" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} />
                    <Button variant="outlined" onClick={load}>Search</Button>
                    <Button variant="contained" onClick={startCreate}>+ New Project</Button>
                </Box>
            </Box>

            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Tech</TableCell>
                        <TableCell>GitHub</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(row => (
                        <TableRow key={row.id}>
                            <TableCell>{row.title}</TableCell>
                            <TableCell>{row.tech_stack}</TableCell>
                            <TableCell>{row.github_url ? <a href={row.github_url} target="_blank" rel="noreferrer">link</a> : "-"}</TableCell>
                            <TableCell align="right">
                                <Button size="small" onClick={() => startEdit(row)}>Edit</Button>
                                <Button size="small" color="error" onClick={() => deleteRow(row.id)}>Delete</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
                <DialogContent dividers sx={{ display: "grid", gap: 2, pt: 2 }}>
                    <TextField label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <TextField label="Summary (2–3 lines)" multiline minRows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
                    <TextField label="Image URL" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
                    <TextField label="GitHub URL" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} />
                    <TextField label="YouTube URL" value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} />
                    <TextField label="Embed Code (optional)" value={form.embed_code} onChange={e => setForm({ ...form, embed_code: e.target.value })} />
                    <TextField label="Tech stack (comma separated or text)" value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={save}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
