// src/pages/CV.jsx
import React, { useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Badge } from "react-bootstrap";
import MemberCard from "../components/MemberCard";
import { API_BASE, apiForm } from "../api";
import "./CV.css";

export default function CV() {
  // --- Members (same content you shared earlier) ---
  const members = useMemo(
    () => [
      {
        slug: "bisan",
        name: "Bisan Safadi",
        title: "Computer Science Student, Tel-Hai College (3rd year)",
        location: "North District, Israel",
        summary:
          "CS student passionate about technology since high school. Strong in coding, algorithms, and software development. I enjoy teamwork and continuous learning. Volunteer mentor at QueenB, teaching 14-year-olds core CS ideas and inspiring confidence.",
        skills: [
          "Python",
          "Java",
          "C++",
          "C",
          "C#",
          "HTML",
          "CSS",
          "JavaScript",
          "React",
          "Data Structures",
          "Algorithms",
          "Software Engineering",
          "Full Stack",
          "Image Processing",
        ],
        tools: ["CLion", "IntelliJ", "CEDAR", "PyCharm"],
        email: "bisan26.06@gmail.com",
        linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b",
      },
      {
        slug: "awsam",
        name: "Awsam Ibraheem",
        title: "B.Sc. Software Engineering, Tel-Hai College (3rd year) — GPA 84.5",
        location: "",
        summary:
          "Third-year software engineering student focused on web and app development. Completed core CS courses with strong grades (e.g., Data Structures 100, Systems Programming 95). Built projects in .NET (C# desktop), Android (Java), and full-stack web (HTML/CSS/JS/Node/Express). Active in the Rothschild Ambassadors Program; volunteer with Elevation; experience as an Information Systems Assistant at the Upper Galilee Regional Council.",
        skills: [
          "Python",
          "Java",
          "C++",
          "C",
          "C#",
          "SQL",
          "HTML",
          "CSS",
          "JavaScript",
          "React",
          "JSON",
          "Node.js",
          "Express",
          "SQLite",
          "MongoDB",
          "Firebase",
          "MySQL",
          "Git",
          "GitHub",
        ],
        tools: ["Visual Studio", "Android Studio", "VS Code", "Git"],
        email: "awsam1021@gmail.com",
        linkedin: "http://www.linkedin.com/in/awsam-ibraheem",
      },
    ],
    []
  );

  // --- Upload UI state ---
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadMember, setUploadMember] = useState("awsam");
  const [uploadFile, setUploadFile] = useState(null);

  // --- Single upload handler (tries admin, falls back to public) ---
  async function handleUpload(e) {
    e.preventDefault();
    setMsg("");

    if (!uploadFile) {
      setMsg("Please choose a PDF file first.");
      return;
    }

    const fd = new FormData();
    fd.append("member", uploadMember); // "awsam" | "bisan"
    fd.append("file", uploadFile); // field name MUST be "file" (multer expects this)

    setBusy(true);
    try {
      const hasToken =
        !!(localStorage.getItem("adminToken") || localStorage.getItem("token"));

      if (hasToken) {
        // Try ADMIN upload with Authorization header (apiForm adds it)
        await apiForm("/api/admin/cv", fd);
        setMsg(`Uploaded (admin) for ${uploadMember}.`);
      } else {
        // No token → use the public route
        await apiForm("/api/cv", fd, { auth: false });
        setMsg(`Uploaded (public) for ${uploadMember}.`);
      }

      setUploadFile(null);
    } catch (err) {
      // If admin attempt failed with 401, try public automatically
      const txt = String(err?.message || "");
      if (txt.includes("401") || /unauthorized/i.test(txt)) {
        try {
          await apiForm("/api/cv", fd, { auth: false });
          setMsg(`Uploaded (public fallback) for ${uploadMember}.`);
          setUploadFile(null);
        } catch (e2) {
          setMsg(e2.message || "Upload failed");
        }
      } else {
        setMsg(txt || "Upload failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-5">
      <h1 className="mb-4 text-purple display-4 title-accent title-animate text-center">
        Our CVs
      </h1>

      {/* Upload box */}
      <div className="mb-4 p-3 border rounded">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Upload a CV (PDF)</h5>
          <Badge bg={localStorage.getItem("adminToken") || localStorage.getItem("token") ? "success" : "secondary"}>
            Mode: {localStorage.getItem("adminToken") || localStorage.getItem("token") ? "Admin (/api/admin/cv)" : "Public (/api/cv)"}
          </Badge>
        </div>

        <Form onSubmit={handleUpload} className="row g-2 align-items-end">
          <Form.Group className="col-md-3">
            <Form.Label>Member</Form.Label>
            <Form.Select
              value={uploadMember}
              onChange={(e) => setUploadMember(e.target.value)}
            >
              <option value="awsam">Awsam</option>
              <option value="bisan">Bisan</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="col-md-6">
            <Form.Label>PDF file</Form.Label>
            <Form.Control
              type="file"
              accept="application/pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </Form.Group>

          <div className="col-md-3">
            <Button type="submit" className="w-100" disabled={busy}>
              {busy ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </Form>

        {msg && <Alert variant="secondary" className="mt-3 mb-0">{msg}</Alert>}
      </div>

      {/* CV Cards */}
      <Row className="g-4">
        {members.map((m) => (
          <Col key={m.slug} md={6}>
            <MemberCard
              {...m}
              // Always point to DB-backed latest CV
              pdfViewHref={`${API_BASE}/api/cv/latest?member=${m.slug}`}
              pdfHref={`${API_BASE}/api/cv/latest?member=${m.slug}&download=1`}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
