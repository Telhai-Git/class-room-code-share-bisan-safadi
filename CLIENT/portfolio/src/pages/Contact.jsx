// src/pages/Contact.jsx
import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
    website: "",  // honeypot
    rating: 0,    // 1..5
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // If you later add Vite env var, this will use it automatically
  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // basic validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    // rating required 1..5 (server expects it)
    if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
      setErrorMsg("Please select a star rating (1–5).");
      return;
    }

    // honeypot: if filled, pretend success and bail
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
          rating: form.rating, // <-- send rating
        }),
      });

      // Try JSON, fallback to text
      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : await res.text();

      if (res.ok) {
        setSuccessMsg(
          typeof payload === "object" && payload?.message
            ? payload.message
            : "Thanks! Your message was sent successfully."
        );
        setForm({ name: "", email: "", message: "", website: "", rating: 0 });
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
        {/* Info Card */}
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
                  <span>Tel Hai / North District, Israel</span>
                </li>
                <li className="d-flex align-items-start gap-2 mb-2">
                  <i className="bi bi-clock fs-5 text-purple" />
                  <span>Usually replies within 24 hours</span>
                </li>
              </ul>
              <div className="d-flex gap-3">
                <a
                  className="social-link"
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-github fs-4" />
                </a>
                <a
                  className="social-link"
                  href="https://www.linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin fs-4" />
                </a>
                <a className="social-link" href="mailto:Awsam1021@gmail.com">
                  <i className="bi bi-envelope-open fs-4" />
                </a>
              </div>
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
                {/* Honeypot field */}
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

                {/* Rating */}
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
    </Container>
  );
}
