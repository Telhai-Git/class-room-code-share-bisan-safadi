import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Alert, Badge, Card } from "react-bootstrap";
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
          "Python","Java","C++","C","C#","HTML","CSS","JavaScript","React",
          "Data Structures","Algorithms","Software Engineering","Full Stack","Image Processing",
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
          "Python","Java","C++","C","C#","SQL","HTML","CSS","JavaScript","React","JSON",
          "Node.js","Express","SQLite","MongoDB","Firebase","MySQL","Git","GitHub",
        ],
        tools: ["Visual Studio", "Android Studio", "VS Code", "Git"],
        email: "awsam1021@gmail.com",
        linkedin: "http://www.linkedin.com/in/awsam-ibraheem",
      },
    ],
    []
  );

  // --- Admin visibility state ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkAdmin() {
      try {
        const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
        if (!token) {
          if (!cancelled) { setIsAdmin(false); setCheckingAdmin(false); }
          return;
        }
        const r = await fetch(`${API_BASE}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) { setIsAdmin(r.ok); setCheckingAdmin(false); }
      } catch {
        if (!cancelled) { setIsAdmin(false); setCheckingAdmin(false); }
      }
    }
    checkAdmin();
    return () => { cancelled = true; };
  }, []);

  // --- Upload UI state ---
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadMember, setUploadMember] = useState("awsam");
  const [uploadFile, setUploadFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  function handlePick(e) {
    const f = e?.target?.files?.[0];
    if (f) setUploadFile(f);
  }
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setUploadFile(f);
  }
  function clearSelection() {
    setUploadFile(null);
    setMsg("");
  }

  // --- Upload handler (admin-only) ---
  async function handleUpload(e) {
    e.preventDefault();
    setMsg("");

    if (!uploadFile) {
      setMsg("Please choose a PDF file first.");
      return;
    }
    if (uploadFile.type !== "application/pdf") {
      setMsg("Only PDF files are allowed.");
      return;
    }

    const fd = new FormData();
    fd.append("member", uploadMember); // "awsam" | "bisan"
    fd.append("file", uploadFile);     // MUST be "file" (multer expects this)

    setBusy(true);
    try {
      await apiForm("/api/admin/cv", fd); // strict admin endpoint
      setMsg(`Uploaded for ${uploadMember}.`);
      setUploadFile(null);
    } catch (err) {
      const txt = String(err?.message || "");
      if (txt.includes("401") || /unauthorized/i.test(txt)) {
        setMsg("Not authorized. Please log in as admin.");
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

      {/* Admin-only Upload card */}
      {!checkingAdmin && isAdmin && (
        <Card className="cv-upload shadow-sm mb-4 border-0">
          <div className="cv-upload__header">
            <div className="d-flex align-items-center gap-2">
              {/* inline SVG icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z" fill="currentColor" opacity="0.18"/>
                <path d="M14,2V8h6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 12v5m0 0-2-2m2 2 2-2M8 19h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h5 className="m-0">Upload a CV (PDF)</h5>
            </div>
            <Badge bg="success">Admin</Badge>
          </div>

          <Card.Body className="p-3 p-md-4">
            <Form onSubmit={handleUpload}>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Label className="fw-semibold">Member</Form.Label>
                  <Form.Select
                    value={uploadMember}
                    onChange={(e) => setUploadMember(e.target.value)}
                  >
                    <option value="awsam">Awsam</option>
                    <option value="bisan">Bisan</option>
                  </Form.Select>
                </Col>

                <Col md={6}>
                  <div
                    className={`cv-dropzone ${dragActive ? "is-drag" : ""}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") document.getElementById("cv-file-input")?.click();
                    }}
                    aria-label="Drop PDF here or click to browse"
                    onClick={() => document.getElementById("cv-file-input")?.click()}
                  >
                    <div className="d-flex flex-column align-items-center text-center">
                      <div className="cv-dropzone__circle mb-2">
                        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 16V8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4 16.5A4.5 4.5 0 0 1 8.5 12H9a5 5 0 0 1 9.58-1.64A3.5 3.5 0 1 1 18.5 16.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                        </svg>
                      </div>
                      <div className="small text-muted">
                        {uploadFile ? (
                          <>
                            <span className="fw-semibold">{uploadFile.name}</span>
                            {" · "}
                            <span>{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                          </>
                        ) : (
                          <>
                            <span className="fw-semibold">Drag & drop</span> your PDF here{" "}
                            <span className="text-muted">or</span>{" "}
                            <span className="link-underline">browse</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Form.Control
                      id="cv-file-input"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePick}
                      className="d-none"
                    />
                  </div>
                </Col>

                <Col md={3} className="d-flex gap-2">
                  <Button type="submit" className="w-100 btn-purple" disabled={busy || !uploadFile}>
                    {busy ? "Uploading..." : "Upload"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="w-100"
                    onClick={clearSelection}
                    disabled={busy || !uploadFile}
                  >
                    Clear
                  </Button>
                </Col>
              </Row>

              {msg && <Alert variant="secondary" className="mt-3 mb-0">{msg}</Alert>}
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* CV Cards */}
      <Row className="g-4">
        {members.map((m) => (
          <Col key={m.slug} md={6}>
            <MemberCard
              {...m}
              pdfViewHref={`${API_BASE}/api/cv/latest?member=${m.slug}`}
              pdfHref={`${API_BASE}/api/cv/latest?member=${m.slug}&download=1`}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
