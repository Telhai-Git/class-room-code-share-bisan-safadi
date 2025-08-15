// src/components/Header.jsx
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Header() {
    const { token, logout } = useApp();
    const navigate = useNavigate();

    const onLogout = () => {
        logout();           // clears context + localStorage (from AppContext)
        navigate("/login"); // go to login
    };

    return (
        <AppBar position="static" sx={{ background: "linear-gradient(to right, #283E51, #485563)" }}>
            {/* space-between to push right box to the far right */}
            <Toolbar sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                {/* Left: title + public nav */}
                <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: "bold", mr: 2 }}>
                        Portfolio
                    </Typography>

                    <Button component={Link} to="/" color="inherit" variant="text">Home</Button>
                    <Button component={Link} to="/about" color="inherit" variant="text">About</Button>
                    <Button component={Link} to="/projects" color="inherit" variant="text">Projects</Button>
                    <Button component={Link} to="/contact" color="inherit" variant="text">Contact</Button>
                    <Button component={Link} to="/cv" color="inherit" variant="text">CV</Button>
                    <Button component={Link} to="/blog" color="inherit" variant="text">Blog</Button>
                    {!token && (
                        <Button component={Link} to="/login" color="inherit" variant="text">Login</Button>
                    )}
                </Box>

                {/* Right: admin actions (visible only when logged in) */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {token && (
                        <>
                            <Button component={Link} to="/admin/projects" color="inherit" variant="text">
                                Manage Projects
                            </Button>
                            <Button component={Link} to="/admin/blog" color="inherit" variant="text">
                                Manage Blogs
                            </Button>
                            <Button onClick={onLogout} color="inherit" variant="outlined" sx={{ borderColor: "rgba(255,255,255,.6)" }}>
                                Logout
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
