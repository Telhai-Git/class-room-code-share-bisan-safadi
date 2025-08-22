import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Row, Col, Card, Button, Badge, ProgressBar, OverlayTrigger, Tooltip
} from "react-bootstrap";
import { API_BASE } from "../api";
import "./About.css";

const teamMembers = [
  {
    key: "bisan",
    name: "Bisan Safadi",
    role: "Fullstack Developer",
    education: "Computer Science student 🎓",
    fallbackImage: "/images/bisan.jpg",
    linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b/",
    github: "https://github.com/BisanSafadi",
  },
  {
    key: "awsam",
    name: "Awsam Ibraheem",
    role: "Fullstack Developer",
    education: "Computer Science student 🎓",
    fallbackImage: "/images/awsam.jpg",
    linkedin: "http://www.linkedin.com/in/awsam-ibraheem",
    github: "https://github.com/awsamIbr",
  }
];

function SkillChips({ items }) {
  return (
    <div className="d-flex flex-wrap gap-2 justify-content-center mt-2">
      {items.map((s) => (
        <Badge key={s.name} bg="light" text="dark" className="skill-chip">
          <i className="bi bi-star me-1"></i>{s.name}
        </Badge>
      ))}
    </div>
  );
}

function SkillLevels({ items }) {
  return (
    <div className="mt-3 text-start">
      {items.map((s) => (
        <div key={s.name} className="mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-semibold small">{s.name}</span>
            <span className="text-muted small">{s.level}%</span>
          </div>
          <ProgressBar now={s.level} className="skill-bar" />
        </div>
      ))}
    </div>
  );
}

function ExperienceList({ items }) {
  if (!items.length) return <div className="text-muted">No experience yet.</div>;
  return (
    <div className="mt-3 text-start">
      {items.map((e) => (
        <div key={`${e.org}-${e.title}-${e.order_index}`} className="mb-3">
          <div className="fw-semibold">
            {e.title} — <span className="text-purple">{e.org}</span>
          </div>
          <div className="text-muted small">
            {e.start_year || "—"}{e.end_year ? `–${e.end_year}` : "–Present"}
          </div>
          {e.description && <div className="small mt-1">{e.description}</div>}
        </div>
      ))}
    </div>
  );
}

export default function About() {
  const [images, setImages] = useState([]);
  const [exp, setExp] = useState({});      // { bisan: Experience[], awsam: Experience[] }
  const [skills, setSkills] = useState({}); // { bisan: Skill[], awsam: Skill[] }
  const [openExp, setOpenExp] = useState({});
  const [openSkills, setOpenSkills] = useState({});

  useEffect(() => {
    // Photos
    fetch(`${API_BASE}/api/images-blob`)
      .then(r => r.json())
      .then(setImages)
      .catch(console.error);

    // Experience + skills for both members
    Promise.all([
      fetch(`${API_BASE}/api/about/experiences?member=bisan`).then(r => r.json()),
      fetch(`${API_BASE}/api/about/experiences?member=awsam`).then(r => r.json()),
      fetch(`${API_BASE}/api/about/skills?member=bisan`).then(r => r.json()),
      fetch(`${API_BASE}/api/about/skills?member=awsam`).then(r => r.json()),
    ])
      .then(([expB, expA, skB, skA]) => {
        setExp({ bisan: expB, awsam: expA });
        setSkills({ bisan: skB, awsam: skA });
      })
      .catch(console.error);
  }, []);

  // DB photos by title (lowercase)
  const dbByTitle = useMemo(() => {
    const m = new Map();
    for (const img of images) if (img?.title) m.set(img.title.toLowerCase(), img);
    return m;
  }, [images]);

  const photoSrc = (member) => {
    const titleKey = member.name.split(" ")[0].toLowerCase(); // "bisan" | "awsam"
    const hit = dbByTitle.get(titleKey);
    return hit ? `${API_BASE}/api/images-blob/${hit.id}` : member.fallbackImage;
  };

  const toggle = (setter, key) => setter(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <Container className="about-section text-center fade-in">
      <h2 className="mb-4 text-purple display-5 title-accent title-animate">Who Are We?</h2>
      <p className="lead text-muted">
        We are a team of passionate students and developers building elegant and modern web apps.
      </p>
      <i className="bi bi-quote text-purple fs-3 d-block mb-2"></i>
      <p className="fst-italic text-secondary">“Code together, grow together.”</p>

      <Row className="mt-5 justify-content-center">
        {teamMembers.map((member, index) => {
          const memberKey = member.key;
          const memberSkills = skills[memberKey] || [];
          const spotlight = memberSkills.filter(s => s.spotlight);
          const levelItems = memberSkills;

          return (
            <Col key={memberKey} md={5} lg={4} className="mb-4">
              <Card className="shadow-sm h-100 card-animate about-card">
                <div className="avatar-wrapper mx-auto mt-4">
                  <Card.Img
                    variant="top"
                    src={photoSrc(member)}
                    className="rounded-circle mx-auto card-img-top"
                    style={{ width: 120, height: 120, objectFit: "cover" }}
                  />
                </div>

                <Card.Body>
                  <Card.Title className="text-purple fw-bold">{member.name}</Card.Title>
                  <Card.Subtitle className="mb-1 text-muted">{member.role}</Card.Subtitle>
                  <Card.Text className="mb-3">{member.education}</Card.Text>

                  {/* Socials */}
                  <div className="mb-3">
                    {member.linkedin && (
                      <OverlayTrigger placement="top" overlay={<Tooltip>LinkedIn</Tooltip>}>
                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="icon-link me-3">
                          <i className="bi bi-linkedin fs-4"></i>
                        </a>
                      </OverlayTrigger>
                    )}
                    {member.github && (
                      <OverlayTrigger placement="top" overlay={<Tooltip>GitHub</Tooltip>}>
                        <a href={member.github} target="_blank" rel="noreferrer" className="icon-link">
                          <i className="bi bi-github fs-4"></i>
                        </a>
                      </OverlayTrigger>
                    )}
                  </div>

                  {/* Spotlight skills from DB */}
                  <SkillChips items={spotlight} />

                  {/* Toggles */}
                  <div className="mt-3">
                    <Button
                      variant={openExp[index] ? "purple" : "outline-purple"}
                      size="sm"
                      onClick={() => toggle(setOpenExp, index)}
                      className="me-2"
                    >
                      {openExp[index] ? "Hide Experience" : "Experience"}
                    </Button>

                    <Button
                      variant={openSkills[index] ? "purple" : "outline-purple"}
                      size="sm"
                      onClick={() => toggle(setOpenSkills, index)}
                    >
                      {openSkills[index] ? "Hide Skills" : "Skills"}
                    </Button>
                  </div>

                  {/* Experience from DB */}
                  <div className={`levels-panel ${openExp[index] ? "open" : ""}`}>
                    {openExp[index] && <ExperienceList items={(exp[memberKey] || [])} />}
                  </div>

                  {/* Skill levels from DB */}
                  <div className={`levels-panel ${openSkills[index] ? "open" : ""}`}>
                    {openSkills[index] && <SkillLevels items={levelItems} />}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
}
