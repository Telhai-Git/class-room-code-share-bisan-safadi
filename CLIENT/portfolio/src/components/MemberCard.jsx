// src/components/MemberCard.jsx
import React, { useRef } from "react";
import { Card, Badge, Button } from "react-bootstrap";

export default function MemberCard({
  name,
  title,
  location,
  summary,
  skills = [],
  tools = [],
  email,
  linkedin,
  github,
  phone,
  pdfHref,
  accent = "text-purple",
}) {
  const printRef = useRef(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const w = window.open("", "_blank", "width=900,height=1200");
    w.document.write(`
      <html>
        <head>
          <title>${name} — CV</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
          <style>body{padding:24px} h1,h2,h3,h4,h5,h6{color:#6f42c1}</style>
        </head>
        <body>${content}</body>
      </html>
    `);
    w.document.close(); w.focus(); w.print(); w.close();
  };

  return (
    <Card className="shadow-sm border-0 rounded-4 h-100 cv-card">
      <Card.Body className="p-4" ref={printRef}>
        <Card.Title className={`fw-bold ${accent} mb-1`}>{name}</Card.Title>
        <div className="text-muted small mb-3">
          {title} {location ? " | " + location : ""}
        </div>

        <p className="mb-3">{summary}</p>

        {skills.length > 0 && (
          <>
            <h6 className={`text-uppercase ${accent} mt-2 mb-2`}>Core Skills</h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <Badge key={s} bg="light" text="dark" className="border">{s}</Badge>
              ))}
            </div>
          </>
        )}

        {tools.length > 0 && (
          <>
            <h6 className={`text-uppercase ${accent} mt-2 mb-2`}>Tools & IDEs</h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {tools.map((t) => (
                <Badge key={t} bg="light" text="dark" className="border">{t}</Badge>
              ))}
            </div>
          </>
        )}

        <div className="small mb-3">
          {phone && (<><i className="bi bi-telephone me-2" />{phone}<br /></>)}
          {email && (<><i className="bi bi-envelope me-2" /><a href={`mailto:${email}`}>{email}</a><br /></>)}
          {linkedin && (<><i className="bi bi-linkedin me-2" /><a href={linkedin} target="_blank" rel="noreferrer">{linkedin.replace(/^https?:\/\//, "")}</a><br /></>)}
          {github && (<><i className="bi bi-github me-2" /><a href={github} target="_blank" rel="noreferrer">{github.replace(/^https?:\/\//, "")}</a></>)}
        </div>

        <div className="d-flex gap-2">
          {pdfHref && (
            <Button variant="outline-secondary" className="rounded-pill px-3" href={pdfHref} download>
              <i className="bi bi-download me-2" /> Download PDF
            </Button>
          )}
          <Button variant="primary" className="rounded-pill px-3 btn-purple" onClick={handlePrint}>
            <i className="bi bi-printer me-2" /> Print
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
