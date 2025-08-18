// src/pages/BlogPost.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Box, Typography, Breadcrumbs, CircularProgress, Alert } from "@mui/material";
import { api } from "../api";
import "./Blog.css";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const data = await api(`/api/blog/${slug}`, { method: "GET", auth: false });
        setPost(data || null);
      } catch (e) {
        console.error(e);
        setErr("Failed to load the post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  if (err) return <Alert severity="error">{err}</Alert>;
  if (!post) return <Alert severity="info">Post not found.</Alert>;

  return (
    <Box className="about-section fade-in" sx={{ p: { xs: 2, md: 4 }, maxWidth: "900px", mx: "auto" }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/blog" className="blog-link">Blog</Link>
        <span>{post.title}</span>
      </Breadcrumbs>

      <Typography variant="h3" className="text-purple title-accent title-animate" gutterBottom>
        {post.title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString()
          : new Date(post.created_at).toLocaleDateString()}
      </Typography>

      {post.cover_image_url && (
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="blog-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </Box>
      )}

      <div className="blog-content" dangerouslySetInnerHTML={{ __html: post.html }} />

      {post.video_embed_url && (
        <Box sx={{ mt: 3 }}>
          <div className="blog-video-wrap">
            <iframe
              src={post.video_embed_url}
              title="Embedded video"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Box>
      )}
    </Box>
  );
}
