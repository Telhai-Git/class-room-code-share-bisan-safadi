// src/components/Menu.jsx
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

function Menu() {
    const { darkMode, toggleDarkMode } = useContext(AppContext);

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                padding: 2,
                backgroundColor: "#f5f5f5",
            }}
        >
            <Button component={Link} to="/" variant="contained">Home</Button>
            <Button component={Link} to="/about" variant="contained">About</Button>
            <Button component={Link} to="/projects" variant="contained">Projects</Button>
            <Button component={Link} to="/contact" variant="contained">Contact</Button>

            {/* כפתור מצב כהה/בהיר */}
            <Button onClick={toggleDarkMode} variant="outlined">
                {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </Button>
        </Box>
    );
}

export default Menu;
