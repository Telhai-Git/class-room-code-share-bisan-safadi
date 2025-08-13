import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import "./Login.css";

export default function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const u = username.trim();
    const p = password.trim();
    if (!u || !p) {
      setErrorMsg("Please fill in both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.message || "Login failed.");
        return;
      }
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      window.location.href = "/admin";
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="admin-login-container fade-in">
      <Row className="justify-content-center align-items-center w-100 m-0">
        <Col xs={12} sm={10} md={8} lg={6} xl={5}>
          <Card className="admin-card about-card card-animate rounded-4 p-5">
            <h2 className="title-accent title-animate text-purple text-center mb-2">
              Admin Login
            </h2>

            <p className="text-center text-muted mb-4">
              Welcome back! Please sign in to continue.
            </p>

            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
              </Form.Group>

              <Button type="submit" className="w-100 btn-purple" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
