// src/pages/Projects.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Card, CardContent, CardMedia, Typography, CardActions,
  Button, Grid, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, Divider, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GitHubIcon from "@mui/icons-material/GitHub";
import YouTubeIcon from "@mui/icons-material/YouTube";
import SearchIcon from "@mui/icons-material/Search";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import "./Projects.css";

export default function Projects() {
  const { token } = useApp();
  const isAdmin = !!token;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  // admin create/edit dialog
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // read-only details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProj, setDetailsProj] = useState(null);

  // form state (JS ONLY – no TypeScript annotations)
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState(""); // long text
  const [imageUrl, setImageUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [techInput, setTechInput] = useState("");
  const [techChips, setTechChips] = useState([]);

  async function load() {
    try {
      setLoading(true);
      const data = await api("/api/projects", { auth: false });
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const k = q.toLowerCase();
    return rows.filter(r =>
      (r.title || "").toLowerCase().includes(k) ||
      (r.tech_stack || "").toLowerCase().includes(k) ||
      (r.summary || "").toLowerCase().includes(k) ||
      ((r.details || r.description || "")).toLowerCase().includes(k) // ✅ search either
    );
  }, [rows, q]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setDetails("");
    setImageUrl("");
    setGithubUrl("");
    setYoutubeUrl("");
    setEmbedCode("");
    setTechInput("");
    setTechChips([]);
  }

  function startCreate() {
    resetForm();
    setOpen(true);
  }

  function startEdit(row) {
    setEditingId(row.id);
    setTitle(row.title || "");
    setSummary(row.summary || "");
    setDetails(row.details || row.description || ""); // ✅ read either
    setImageUrl(row.image_url || "");
    setGithubUrl(row.github_url || row.github_link || "");
    setYoutubeUrl(row.youtube_url || row.live_demo_link || "");
    setEmbedCode(row.embed_code || "");
    const chips = (row.tech_stack || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    setTechChips(chips);
    setTechInput("");
    setOpen(true);
  }

  function addTechFromInput() {
    const v = techInput.trim();
    if (!v) return;
    if (!techChips.includes(v)) {
      setTechChips([...techChips, v]);
    }
    setTechInput("");
  }
  function handleTechKey(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTechFromInput();
    }
  }
  function removeChip(idx) {
    const copy = techChips.slice();
    copy.splice(idx, 1);
    setTechChips(copy);
  }

  async function save() {
    if (!title.trim()) return alert("Title is required");
    const body = {
      title: title.trim(),
      summary: summary.trim(),
      details: details.trim(),            // keep modern key
      description: details.trim(),        // ✅ also send legacy key
      image_url: imageUrl.trim(),
      github_url: githubUrl.trim(),
      youtube_url: youtubeUrl.trim(),
      embed_code: embedCode.trim(),
      tech_stack: techChips.join(", "),
    };
    // console.log("[SAVE payload]", body);

    if (editingId) {
      await api(`/api/admin/projects/${editingId}`, { method: "PUT", body });
    } else {
      await api("/api/admin/projects", { method: "POST", body });
    }
    setOpen(false);
    await load();
  }

  async function removeRow(id) {
    if (!window.confirm("Delete this project?")) return;
    await api(`/api/admin/projects/${id}`, { method: "DELETE" });
    await load();
  }

  // read-only details dialog handlers
  function openDetails(proj) {
    setDetailsProj(proj);
    setDetailsOpen(true);
  }
  function closeDetails() {
    setDetailsOpen(false);
    setDetailsProj(null);
  }

  return (
    <Box className="about-section fade-in" sx={{ p: { xs: 2, md: 4 } }}>
      {/* centered title */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Typography
          variant="h3"
          gutterBottom
          className="title-accent title-animate text-purple"
          sx={{ position: "relative", paddingBottom: "8px", textAlign: "center" }}
        >
          My Projects
        </Typography>
      </Box>

      {/* search + add */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search projects..."
          value={q}
          onChange={e => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} className="btn-purple" onClick={startCreate}>
            Add Project
          </Button>
        )}
      </Box>

      {/* cards */}
      <Grid container spacing={3}>
        {filtered.map((proj, i) => (
          <Grid
            key={proj.id}
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            className="card-animate"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <Card className="about-card" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {proj.image_url && (
                <CardMedia
                  component="img"
                  height="180"
                  image={proj.image_url}
                  alt={proj.title}
                  className="card-img-top"
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{proj.title}</Typography>
                {proj.tech_stack && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                    {proj.tech_stack.split(",").map((t, idx) => <Chip key={idx} size="small" label={t.trim()} />)}
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary">
                  {proj.summary || "No summary provided."}
                </Typography>
              </CardContent>

              {/* unified button style */}
              <CardActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: "wrap" }}>
                {proj.github_url && (
                  <Button
                    size="small"
                    href={proj.github_url}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<GitHubIcon />}
                    variant="outlined"
                    sx={{
                      color: "#6f42c1",
                      borderColor: "#6f42c1",
                      borderWidth: 1.5,
                      textTransform: "uppercase",
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "#5a35a8",
                        backgroundColor: "rgba(111,66,193,0.08)",
                      },
                    }}
                  >
                    GitHub
                  </Button>
                )}

                {proj.youtube_url && (
                  <Button
                    size="small"
                    href={proj.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    startIcon={<YouTubeIcon />}
                    variant="outlined"
                    sx={{
                      color: "#6f42c1",
                      borderColor: "#6f42c1",
                      borderWidth: 1.5,
                      textTransform: "uppercase",
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "#5a35a8",
                        backgroundColor: "rgba(111,66,193,0.08)",
                      },
                    }}
                  >
                    YouTube
                  </Button>
                )}

                {/* Details button (read-only dialog) */}
                <Button
                  size="small"
                  onClick={() => openDetails(proj)}
                  variant="outlined"
                  sx={{
                    color: "#6f42c1",
                    borderColor: "#6f42c1",
                    borderWidth: 1.5,
                    textTransform: "uppercase",
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: "#5a35a8",
                      backgroundColor: "rgba(111,66,193,0.08)",
                    },
                  }}
                >
                  Details
                </Button>

                {isAdmin && (
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => startEdit(proj)}
                      startIcon={<EditIcon />}
                      variant="outlined"
                      sx={{
                        color: "#6f42c1",
                        borderColor: "#6f42c1",
                        borderWidth: 1.5,
                        textTransform: "uppercase",
                        borderRadius: 2,
                        "&:hover": {
                          borderColor: "#5a35a8",
                          backgroundColor: "rgba(111,66,193,0.08)",
                        },
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeRow(proj.id)}
                      startIcon={<DeleteOutlineIcon />}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* admin create/edit dialog */}
      {isAdmin && (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle className="text-purple">
            {editingId ? "Edit Project" : "New Project"}
          </DialogTitle>
          <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
            {/* basics */}
            <Typography sx={{ fontWeight: 600 }}>Basics</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <TextField
                  label="Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  fullWidth
                  required
                  helperText="Short, clear project name"
                />
                <TextField
                  label="Summary"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{ mt: 2 }}
                  helperText="2–3 lines about what this project does"
                />

                {/* Details field */}
                <TextField
                  label="Details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={{ mt: 2 }}
                  helperText="Longer description about the project"
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <TextField
                  label="Image URL"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  fullWidth
                  helperText="Paste a direct image link (Unsplash works great)"
                />
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: 180, borderRadius: 12 }}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Preview appears here</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            {/* tech stack chips */}
            <Typography sx={{ fontWeight: 600 }}>Tech stack</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {techChips.map((chip, idx) => (
                <Chip key={idx} label={chip} onDelete={() => removeChip(idx)} />
              ))}
            </Box>
            <TextField
              placeholder="Type a tech and press Enter (e.g., React)"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={handleTechKey}
              fullWidth
            />

            {/* optional links */}
            <Accordion sx={{ mt: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>Optional links</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="GitHub URL"
                      value={githubUrl}
                      onChange={e => setGithubUrl(e.target.value)}
                      fullWidth
                      placeholder="https://github.com/..."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="YouTube URL"
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      fullWidth
                      placeholder="https://youtube.com/..."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Embed Code (optional)"
                      value={embedCode}
                      onChange={e => setEmbedCode(e.target.value)}
                      fullWidth
                      placeholder='<iframe src="..."></iframe>'
                      multiline
                      minRows={2}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
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

      {/* read-only details dialog */}
      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle className="text-purple">
          {detailsProj?.title || "Project Details"}
        </DialogTitle>
        <DialogContent dividers>
          {detailsProj?.image_url && (
            <Box sx={{ mb: 2, textAlign: "center" }}>
              <img
                src={detailsProj.image_url}
                alt={detailsProj.title}
                style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 12 }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </Box>
          )}

          {detailsProj?.tech_stack && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
              {detailsProj.tech_stack.split(",").map((t, idx) => (
                <Chip key={idx} size="small" label={t.trim()} />
              ))}
            </Box>
          )}

          <Typography variant="body1" sx={{ mb: 2 }}>
            {detailsProj?.summary || "No summary provided."}
          </Typography>

          {/* Show long details or description */}
          {(detailsProj?.details || detailsProj?.description) && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
              {detailsProj.details || detailsProj.description}
            </Typography>
          )}

          {/* Show embed code if exists */}
          {detailsProj?.embed_code && (
            <Box sx={{ mt: 1 }} dangerouslySetInnerHTML={{ __html: detailsProj.embed_code }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDetails}
            variant="outlined"
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
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
