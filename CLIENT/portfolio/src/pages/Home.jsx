import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import "./Home.css";

function Home() {
    return (
        <Container className="py-5">
            {/* Welcome Title */}
            <div className="text-center">
            <h1 className="mb-4 text-purple display-4 title-accent title-animate">
                Welcome to Our Portfolio
            </h1>
            </div>
            {/* Subtitle Paragraphs Centered */}
            <div className="text-center">
                <p className="lead text-muted">
                    Two curious minds, one shared journey — building, learning, and evolving through every fullstack challenge.
                </p>
                <i className="bi bi-quote text-purple fs-3 d-block mb-2"></i>
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
                    <Card className="team-card shadow-sm border-0 card-animate">
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
                    <Card className="team-card shadow-sm border-0 card-animate">
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
