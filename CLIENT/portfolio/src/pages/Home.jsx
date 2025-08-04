// src/pages/Home.jsx
import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import "./Home.css";

function Home() {
    return (
        <Container className="py-5"> {/* Remove 'fluid' here */}
            {/* Welcome Text Centered */}
            <div className="text-center">
                <h1 className="mb-4 text-purple display-4">Welcome to Our Portfolio</h1>

                <p className="lead text-muted">
                    We are a creative and collaborative team passionate about building modern web applications.
                </p>
                <p className="subtitle-font fst-italic text-secondary">
                    “Innovation, elegance, and teamwork — that’s what defines us.”
                </p>
                <p className="subtitle-font fw-semibold text-purple">
                    Explore our projects and meet the developers behind the code.
                </p>
            </div>

            {/* Team Cards */}
            <Row className="mt-5 justify-content-center">
                {/* Bisan Card */}
                <Col xs={12} md={6} lg={4} className="mb-4">
                    <Card className="team-card shadow-lg border-0">
                        <Card.Img variant="top" src="/images/bisan.jpg" className="team-img" />
                        <Card.Body>
                            <Card.Title className="text-purple">Bisan</Card.Title>
                            <Card.Text>
                                “I enjoy creating elegant frontends and working in teams.”
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Awsam Card */}
                <Col xs={12} md={6} lg={4} className="mb-4">
                    <Card className="team-card shadow-lg border-0">
                        <Card.Img variant="top" src="/images/awsam.jpg" className="team-img" />
                        <Card.Body>
                            <Card.Title className="text-purple">Awsam</Card.Title>
                            <Card.Text>
                                “I focus on backend systems and solving logic problems.”
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Home;
