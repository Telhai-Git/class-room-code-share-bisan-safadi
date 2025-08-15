// src/pages/Blog.jsx
import { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Table, TableHead, TableRow, TableCell, TableBody, Switch, FormControlLabel
} from "@mui/material";
import { api } from "../api";
import { useApp } from "../context/AppContext";     // ← add

export default function Blog() {
  const { token } = useApp();                        // ← add
  const isAdmin = !!token;                           // ← add

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "", slug: "", html: "", cover_image_url: "", video_embed_url: "", is_published: false
  });

  async function load() {
    const rows = isAdmin
      ? await api("/api/admin/blog", { method: "GET" })     // all posts for admin
      : await api("/api/blog", { method: "GET", auth: false }); // only published for public
    setItems(rows || []);
  }
  useEffect(() => { load(); }, [isAdmin]); // reload if login state changes

  function startCreate() { /* …same as before… */ }
  function startEdit(row) { /* …same as before… */ }

  async function save() { /* …same as before… */ }
  async function publishToggle(row, publish) { /* …same as before… */ }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <h2>Blog</h2>
        {isAdmin && (                                              // ← admin-only
          <Box sx={{ ml: "auto" }}>
            <Button variant="contained" onClick={startCreate}>+ New Post</Button>
          </Box>
        )}
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Slug</TableCell>
            <TableCell>Published</TableCell>
            {isAdmin && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(row => (
            <TableRow key={row.id}>
              <TableCell>{row.title}</TableCell>
              <TableCell>{row.slug}</TableCell>
              <TableCell>{row.is_published ? "Yes" : "No"}</TableCell>
              {isAdmin && (
                <TableCell align="right">
                  <Button size="small" onClick={() => startEdit(row)}>Edit</Button>
                  <FormControlLabel
                    sx={{ ml: 1 }}
                    control={<Switch checked={!!row.is_published} onChange={e => publishToggle(row, e.target.checked)} />}
                    label="Publish"
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isAdmin && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          {/* dialog fields exactly as you have */}
        </Dialog>
      )}
    </Box>
  );
}
