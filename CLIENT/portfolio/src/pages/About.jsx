// src/pages/About.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Badge, ProgressBar, OverlayTrigger, Tooltip } from "react-bootstrap";
import "./About.css";

const teamMembers = [
  {
    name: "Bisan Safadi",
    role: "Fullstack Developer",
    education: "Computer Science student 🎓",
    image: "/images/bisan.jpg",
    linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b/",
    github: "https://github.com/BisanSafadi",
    bio:
      "Bisan is a dedicated and creative developer who enjoys building user-friendly interfaces and learning new technologies. She's passionate about teamwork and turning ideas into real applications.",
    skills: {
      spotlight: ["React", "Bootstrap", "Node.js", "PostgreSQL", "REST APIs"],
      levels: [
        { name: "React", value: 88 },
        { name: "JavaScript (ES6+)", value: 85 },
        { name: "HTML/CSS (Bootstrap)", value: 90 },
        { name: "Node.js/Express", value: 80 },
        { name: "PostgreSQL", value: 78 },
        { name: "Git/GitHub", value: 86 }
      ]
    }
  },
  {
    name: "Awsam Ibraheem",
    role: "Fullstack Developer",
    education: "Computer Science student 🎓",
    image: "/images/awsam.jpg",
    linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b/", // TODO: replace with Awsam’s LinkedIn
    github: "https://github.com/awsamIbr", // TODO: replace if needed
    bio:
      "Awsam is a sharp and focused developer who enjoys solving complex backend problems and creating robust fullstack apps. He brings clean code and creative ideas to every project.",
    skills: {
      spotlight: ["Express", "PostgreSQL", "Docker", "React", "API Design"],
      levels: [
        { name: "Node.js/Express", value: 90 },
        { name: "PostgreSQL", value: 84 },
        { name: "API Design", value: 88 },
        { name: "React", value: 75 },
        { name: "Docker", value: 70 },
        { name: "Git/GitHub", value: 85 }
      ]
    }
  }
];

function SkillChips({ items }) {
  return (
    <div className="d-flex flex-wrap gap-2 justify-content-center mt-2">
      {items.map((s, i) => (
        <Badge key={i} bg="light" text="dark" className="skill-chip">
          <i className="bi bi-star me-1"></i>
          {s}
        </Badge>
      ))}
    </div>
  );
}

function SkillLevels({ items }) {
  return (
    <div className="mt-3 text-start">
      {items.map((s, i) => (
        <div key={i} className="mb-2">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-semibold small">{s.name}</span>
            <span className="text-muted small">{s.value}%</span>
          </div>
          <ProgressBar now={s.value} className="skill-bar" />
        </div>
      ))}
    </div>
  );
}

export default function About() {
  const [expandedBio, setExpandedBio] = useState({});
  const [showLevels, setShowLevels] = useState({});

  const toggle = (stateSetter, key) =>
    stateSetter(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <Container className="about-section text-center fade-in">
      <h2 className="mb-4 text-purple display-5 title-accent title-animate">Who Are We?</h2>
      <p className="lead text-muted">
        We are a team of passionate students and developers building elegant and modern web apps.
      </p>
      <i className="bi bi-quote text-purple fs-3 d-block mb-2"></i>
      <p className="fst-italic text-secondary">“Code together, grow together.”</p>

      <Row className="mt-5 justify-content-center">
        {teamMembers.map((member, index) => (
          <Col key={index} md={5} lg={4} className="mb-4">
            <Card className="shadow-sm h-100 card-animate about-card">
              <div className="avatar-wrapper mx-auto mt-4">
                <Card.Img
                  variant="top"
                  src={member.image}
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

                {/* Spotlight skills (chips) */}
                <SkillChips items={member.skills.spotlight} />

                {/* Bio toggle */}
                <div className="mt-3">
                  <Button
                    variant="outline-purple"
                    size="sm"
                    onClick={() => toggle(setExpandedBio, index)}
                    className="me-2"
                  >
                    {expandedBio[index] ? "Hide Bio" : "More About Me"}
                  </Button>

                  <Button
                    variant={showLevels[index] ? "purple" : "outline-purple"}
                    size="sm"
                    onClick={() => toggle(setShowLevels, index)}
                  >
                    {showLevels[index] ? "Hide Skill " : "Skill"}
                  </Button>
                </div>

                {/* Bio */}
                <div className={`bio-text mt-3 text-muted ${expandedBio[index] ? "show" : ""}`}>
                  <i className="bi bi-chat-left-quote-fill text-purple fs-5 mb-2 d-block"></i>
                  {member.bio}
                </div>

                {/* Levels */}
                <div className={`levels-panel ${showLevels[index] ? "open" : ""}`}>
                  {showLevels[index] && <SkillLevels items={member.skills.levels} />}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
