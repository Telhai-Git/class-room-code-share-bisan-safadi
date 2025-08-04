// src/components/Header.jsx
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";

function Header() {
    return (
            <AppBar position="static" sx={{ background: "linear-gradient(to right, #283E51, #485563)" }}>
            <Toolbar sx={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
                
                {/* Left side: Title + Nav buttons */}
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: "bold", marginRight: 2 }}>
                        Portfolio
                    </Typography>

                    <Button component={Link} to="/" color="inherit" variant="text">Home</Button>
                    <Button component={Link} to="/about" color="inherit" variant="text">About</Button>
                    <Button component={Link} to="/projects" color="inherit" variant="text">Projects</Button>
                    <Button component={Link} to="/contact" color="inherit" variant="text">Contact</Button>
                    <Button component={Link} to="/cv" color="inherit" variant="text">CV</Button>
                    <Button component={Link} to="/blog" color="inherit" variant="text">Blog</Button>
                    <Button component={Link} to="/login" color="inherit" variant="text">Login</Button>
                </Box>

            </Toolbar>
        </AppBar>
    );
}

export default Header;
