// src/pages/Contact.jsx
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useApp } from "../context/AppContext"; // ← for admin token
import "./Contact.css";

export default function Contact() {
  // admin token (if logged in)
  const { token } = useApp();
  const isAdmin = !!token;

  // ---- Form state ----
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "", // honeypot
    rating: 0,   // 1..5
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ---- Reviews state ----
  const [reviews, setReviews] = useState([]);
  const [minRating, setMinRating] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  // deleting state (for per-card spinner)
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

  // ---- Helpers ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());

  

  // ---- Reviews fetch ----
  const fetchReviews = async () => {
    setLoadingReviews(true);
    setReviewsError("");
    try {
      const res = await fetch(`${API_BASE}/api/reviews?minRating=${minRating}&limit=50`);
      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json") ? await res.json() : await res.text();
      if (!res.ok) throw new Error(typeof data === "string" ? data : (data?.message || "Failed"));
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setReviewsError(String(err.message || err));
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRating]);

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
      setErrorMsg("Please select a star rating (1–5).");
      return;
    }

    if (form.website) {
      setSuccessMsg("Thanks! Your message was sent successfully.");
      setForm({ name: "", email: "", message: "", website: "", rating: 0 });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          rating: form.rating,
        }),
      });

      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : await res.text();

      if (res.ok) {
        setSuccessMsg(
          typeof payload === "object" && payload?.message
            ? payload.message
            : "Thanks! Your message was sent successfully."
        );
        setForm({ name: "", email: "", message: "", website: "", rating: 0 });
        fetchReviews();
      } else {
        setErrorMsg(
          (typeof payload === "object" && (payload?.message || payload?.detail)) ||
          (typeof payload === "string" ? payload : "") ||
          "Something went wrong. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Admin delete ----
  const handleDeleteReview = async (id) => {
    if (!isAdmin || !token) return;
    const ok = window.confirm("Delete this message permanently?");
    if (!ok) return;
    try {
      setDeletingId(id);
      const res = await fetch(`${API_BASE}/api/admin/contact/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        const payload = ct.includes("application/json") ? await res.json() : await res.text();
        throw new Error(
          (typeof payload === "object" && (payload?.message || payload?.detail)) ||
          (typeof payload === "string" ? payload : "Failed to delete")
        );
      }
      fetchReviews();
    } catch (e) {
      alert(`Delete failed: ${e.message || e}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container className="py-5">
      <Row>
        <Col>
          <h1 className="contact-title mb-2 text-purple display-5 title-accent title-animate">
            Contact Me
          </h1>
          <p className="subtitle-font text-center text-secondary mb-4 fst-italic">
            “Let’s build something meaningful together.”
          </p>
        </Col>
      </Row>

      <Row className="g-4 justify-content-center">
        {/* Info Card (Get in touch) */}
        <Col md={5} lg={4}>
          <Card className="shadow-sm contact-card h-100">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Get in touch</Card.Title>
              <ul className="list-unstyled mb-4 contact-list">
                <li className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-envelope-fill fs-5 text-purple" />
                  <a
                    href="mailto:Awsam1021@gmail.com"
                    className="text-decoration-none text-dark"
                  >
                    Awsam1021@gmail.com
                  </a>
                </li>
                <li className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-envelope-fill fs-5 text-purple" />
                  <a
                    href="mailto:Bisan26.06@gmail.com"
                    className="text-decoration-none text-dark"
                  >
                    Bisan26.06@gmail.com
                  </a>
                </li>
                <li className="d-flex align-items-start gap-2 mb-2">
                  <i className="bi bi-geo-alt fs-5 text-purple" />
                  <span>Majdal Shams / North District, Israel</span>
                </li>
                <li className="d-flex align-items-start gap-2 mb-2">
                  <i className="bi bi-clock fs-5 text-purple" />
                  <span>Usually replies within 24 hours</span>
                </li>
              </ul>
              {/* Removed GitHub/LinkedIn/Mail icon row here */}
            </Card.Body>
          </Card>
        </Col>

        {/* Contact Form */}
        <Col md={7} lg={6}>
          <Card className="shadow-sm contact-card mb-4">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Send a message</Card.Title>

              {successMsg && <Alert variant="success" className="mb-3">{successMsg}</Alert>}
              {errorMsg && <Alert variant="danger" className="mb-3">{errorMsg}</Alert>}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Control
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className="d-none"
                />

                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="message"
                    placeholder="Write your message..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Rating</Form.Label>
                  <div>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi ${star <= (form.rating || 0) ? "bi-star-fill" : "bi-star"} fs-4 me-1 review-star`}
                        onClick={() => setForm((f) => ({ ...f, rating: star }))}
                        role="button"
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        title={`${star} / 5`}
                      />
                    ))}
                  </div>
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" className="btn-purple" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Sending...
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* ===== Reviews Panel (design-only) ===== */}
<Row className="mt-5">
  <Col>
    <div className="d-flex align-items-center justify-content-between mb-3">
      <h2 className="mb-0 title-accent text-purple">Recent Reviews</h2>

      <div className="d-flex align-items-center gap-2">
        <span className="text-secondary small">Filter</span>
        <Form.Select
          value={minRating}
          onChange={(e) => setMinRating(parseInt(e.target.value, 10))}
          className="reviews-filter"
          aria-label="Filter reviews by minimum rating"
        >
          <option value={1}>All (1–5)</option>
          <option value={2}>2–5</option>
          <option value={3}>3–5</option>
          <option value={4}>4–5</option>
          <option value={5}>Only 5★</option>
        </Form.Select>
      </div>
    </div>

    {reviewsError && <Alert variant="danger" className="mb-3">{reviewsError}</Alert>}

    {loadingReviews ? (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" role="status" />
      </div>
    ) : reviews.length === 0 ? (
      <Alert variant="secondary" className="shadow-sm">No reviews yet.</Alert>
    ) : (
      <Row className="g-3 reviews-grid">
        {reviews.map((r) => {
          const initials = (r.name || "Anonymous")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(s => s[0]?.toUpperCase())
            .join("") || "A";

          return (
            <Col key={r.id} xs={12} sm={6} lg={4}>
              <Card className="shadow-sm review-card h-100 border-0">
                <Card.Body className="p-3 p-md-4">
                  {/* Header */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar-initials">{initials}</div>
                      <div className="fw-semibold">{(r.name || "Anonymous").split(/\s+/)[0]}</div>
                    </div>

                    <span className="star-badge" title={`${r.rating} / 5`}>
                      <i className="bi bi-star-fill me-1" />
                      {r.rating}
                    </span>
                  </div>

                  {/* Quote + message */}
                  <div className="review-quote mb-2">
                    <span className="quote-mark" aria-hidden>“</span>
                    <p className="mb-0">{r.message}</p>
                  </div>

                  {/* Meta row */}
                  <div className="d-flex justify-content-between align-items-center gap-2 mt-3">
                    <div className="text-muted small">
                      {new Date(r.created_at).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>

                    {/* Admin-only delete */}
                    {isAdmin && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="review-delete"
                        onClick={() => handleDeleteReview(r.id)}
                        disabled={deletingId === r.id}
                        title="Delete review"
                      >
                        {deletingId === r.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" />
                            Deleting
                          </>
                        ) : (
                          <>
                            <i className="bi bi-trash3 me-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    )}
  </Col>
</Row>

    </Container>
  );
}
