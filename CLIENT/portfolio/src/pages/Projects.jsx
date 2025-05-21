// src/pages/Projects.jsx
import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";

function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com/api/projects")
            .then((res) => res.json())
            .then((data) => {
                setProjects(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching projects:", err);
                setLoading(false);
            });
    }, []);


    return (
        <div>
            <Typography variant="h4" gutterBottom>
                My Projects
            </Typography>

            {loading ? (
                <CircularProgress />
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} key={project.id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{project.title}</Typography>
                                    <Typography variant="body2">{project.description}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </div>
    );
}

export default Projects;
