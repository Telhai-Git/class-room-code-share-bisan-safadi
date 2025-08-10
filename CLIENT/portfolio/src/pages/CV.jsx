// src/pages/CV.jsx
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import MemberCard from "../components/MemberCard";
import "./CV.css";

export default function CV() {
  const members = [
    // === Member 1: Bisan (summarized from your PDF exactly) ===
    {
      name: "Bisan Safadi",
      title: "Computer Science Student, Tel‑Hai College (3rd year)",
      location: "North District, Israel",
      summary:
        "CS student passionate about technology since high school. Strong in coding, algorithms, and software development. I enjoy teamwork and continuous learning. Volunteer mentor at QueenB, teaching 14‑year‑olds core CS ideas and inspiring confidence.",
      skills: [
        "Python","Java","C++","C","C#",
        "HTML","CSS","JavaScript","React",
        "Data Structures","Algorithms",
        "Software Engineering","Full Stack",
        "Image Processing"
      ],
      tools: ["CLion","IntelliJ","CEDAR","PyCharm"],
      email: "bisan26.06@gmail.com",
      linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b",
      pdfHref: "/cv/Bisan-Safadi-CV.pdf"
    },

    {
      name: "Awsam Ibraheem",
      title: "B.Sc. Software Engineering, Tel‑Hai College (3rd year) — GPA 84.5",
      location: "",
      summary:
        "Third‑year software engineering student focused on web and app development. Completed core CS courses with strong grades (e.g., Data Structures 100, Systems Programming 95). Built projects in .NET (C# desktop), Android (Java), and full‑stack web (HTML/CSS/JS/Node/Express). Active in the Rothschild Ambassadors Program; volunteer with Elevation; experience as an Information Systems Assistant at the Upper Galilee Regional Council.",
      skills: [
        "Python","Java","C++","C","C#","SQL",
        "HTML","CSS","JavaScript","React","JSON",
        "Node.js","Express",
        "SQLite","MongoDB","Firebase","MySQL",
        "Git","GitHub"
      ],
      tools: ["Visual Studio","Android Studio","VS Code","Git"],
      phone: "+972-58-444-6775",
      email: "awsam1021@gmail.com",
      linkedin: "http://www.linkedin.com/in/awsam-ibraheem",
      github: "https://github.com/awsamIbr",
      pdfHref: "/cv/Awsam-ibraheem-CV.pdf", // exact filename you uploaded
    },
  ];

  return (
    <Container className="py-5">
<h1 className="mb-4 text-purple display-4 title-accent title-animate text-center">
  Our CVs
</h1>


      <Row className="g-4">
        {members.slice(0, 2).map((m) => (
          <Col key={m.name} md={6}>
            <MemberCard {...m} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
