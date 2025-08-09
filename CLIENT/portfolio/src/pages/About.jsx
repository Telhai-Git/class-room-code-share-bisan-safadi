// src/pages/About.jsx
import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import "./About.css";

const teamMembers = [
    {
        name: "Bisan Safadi",
        role: "Fullstack Developer",
        education: "Computer Science student 🎓",
        image: "/images/bisan.jpg",
        linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b/",
        github: "https://github.com/dashboard",
        bio: "Bisan is a dedicated and creative developer who enjoys building user-friendly interfaces and learning new technologies. She's passionate about teamwork and turning ideas into real applications.",
    },
    {
        name: "Awsam Ibraheem",
        role: "Fullstack Developer",
        education: "Computer Science student 🎓",
        image: "/images/awsam.jpg",
        linkedin: "https://www.linkedin.com/in/bisan-safadi-ba743531b/", // Replace with Awsam's actual LinkedIn if different
        github: "https://github.com/dashboard", // Replace with his GitHub if different
        bio: "Awsam is a sharp and focused developer who enjoys solving complex backend problems and creating robust fullstack apps. He brings clean code and creative ideas to every project.",
    }
];


function About() {
    const [expanded, setExpanded] = useState({});

    const toggleBio = (index) => {
        setExpanded((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        <Container className="about-section text-center fade-in">
            <h2 className="mb-4 text-purple display-5 title-accent title-animate">Who Are We?</h2>
            <p className="lead text-muted">
                We are a team of passionate students and developers building elegant and modern web apps.
            </p>
            <i className="bi bi-quote text-purple fs-3 d-block mb-2"></i>
            <p className="fst-italic text-secondary">
                “Code together, grow together.”
            </p>

            <Row className="mt-5 justify-content-center">
                {teamMembers.map((member, index) => (
                    <Col key={index} md={4} className="mb-4">
                        <Card className="shadow-sm h-100 card-animate">
                            <Card.Img
                                variant="top"
                                src={member.image}
                                className="rounded-circle mx-auto mt-3 card-img-top"
                                style={{ width: "120px", height: "120px", objectFit: "cover" }}
                            />
                            <Card.Body>
                                <Card.Title className="text-purple fw-bold">{member.name}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">{member.role}</Card.Subtitle>
                                <Card.Text>{member.education}</Card.Text>
                                <div className="mb-2">
                                    {member.linkedin && (
                                        <a href={member.linkedin} target="_blank" rel="noreferrer" className="icon-link me-2">
                                            <i className="bi bi-linkedin fs-4"></i>
                                        </a>
                                    )}
                                    {member.github && (
                                        <a href={member.github} target="_blank" rel="noreferrer" className="icon-link">
                                            <i className="bi bi-github fs-4"></i>
                                        </a>
                                    )}
                                </div>

                                <Button variant="outline-purple" size="sm" onClick={() => toggleBio(index)}>
                                    {expanded[index] ? "Hide" : "More About Me"}
                                </Button>

                                <div className={`bio-text mt-3 text-muted ${expanded[index] ? "show" : ""}`}>
                                    <i className="bi bi-chat-left-quote-fill text-purple fs-5 mb-2 d-block"></i>
                                    {member.bio}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default About;
