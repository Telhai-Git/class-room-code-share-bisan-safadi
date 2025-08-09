import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Review states
  const [review, setReview] = useState({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState("");
  const [reviewError, setReviewError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
    if (form.website) {
      setSuccessMsg("Thanks! Your message was sent successfully.");
      setForm({ name: "", email: "", message: "", website: "" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com/api/contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            message: form.message.trim(),
          }),
        }
      );

      if (res.ok) {
        setSuccessMsg("Thanks! Your message was sent successfully.");
        setForm({ name: "", email: "", message: "", website: "" });
      } else {
        let serverMsg = "";
        try {
          const data = await res.json();
          serverMsg = data?.message || "";
        } catch {}
        setErrorMsg(serverMsg || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- state (keep as you have) ---

const handleReviewSubmit = async () => {
  setReviewMsg("");
  setReviewError(false);

  if (review.rating === 0 || review.comment.trim() === "") {
    setReviewError(true);
    setReviewMsg("Please select a star rating and enter a comment.");
    return;
  }

  try {
    setReviewLoading(true);
    const reviewText = `[REVIEW ⭐${review.rating}] ${review.comment.trim()}`;

    const res = await fetch(
      "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com/api/contact",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name?.trim() || "Anonymous",
          email: isValidEmail(form.email) ? form.email.trim() : "",
          message: reviewText,
        }),
      }
    );

    if (res.ok) {
      setReview({ rating: 0, comment: "" });
      setReviewMsg("Thank you for your review!");
    } else {
      const text = await res.text();
      setReviewError(true);
      setReviewMsg(text || "Something went wrong. Please try again.");
    }
  } catch (err) {
    setReviewError(true);
    setReviewMsg("Network error. Please try again.");
  } finally {
    setReviewLoading(false);
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
                  <a href="mailto:Awsam1021@gmail.com" className="text-decoration-none text-dark">
                    Awsam1021@gmail.com
                  </a>
                </li>
                <li className="d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-envelope-fill fs-5 text-purple" />
                  <a href="mailto:Bisan26.06@gmail.com" className="text-decoration-none text-dark">
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
                <a className="social-link" href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-github fs-4" />
                </a>
                <a className="social-link" href="https://www.linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
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
                <Form.Control type="text" name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" className="d-none" />
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control name="name" placeholder="Your full name" value={form.name} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" name="email" placeholder="name@example.com" value={form.email} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control as="textarea" rows={5} name="message" placeholder="Write your message..." value={form.message} onChange={handleChange} required />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" className="btn-purple" disabled={loading}>
                    {loading ? <><span className="spinner-border spinner-border-sm me-2" /> Sending...</> : "Send"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Review Card */}
          <Card className="shadow-sm contact-card">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Leave a Review</Card.Title>
              <div className="mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`bi ${star <= review.rating ? "bi-star-fill" : "bi-star"} fs-4 me-1 review-star`}
                    onClick={() => setReview({ ...review, rating: star })}
                  />
                ))}
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Your Review</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Share your experience..."
                  value={review.comment}
                  onChange={(e) => setReview({ ...review, comment: e.target.value })}
                />
              </Form.Group>
              <div className="d-grid">
                <Button className="btn-purple" onClick={handleReviewSubmit} disabled={reviewLoading}>
                  {reviewLoading ? <><span className="spinner-border spinner-border-sm me-2" /> Submitting...</> : "Submit Review"}
                </Button>
              </div>
              {reviewMsg && (
                <Alert variant={reviewError ? "danger" : "success"} className="mt-3">
                  {reviewMsg}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
