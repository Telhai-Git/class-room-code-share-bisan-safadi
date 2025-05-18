// src/components/Header.jsx
import { AppBar, Toolbar, Typography } from "@mui/material";

function Header() {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div">
                    Osem's Portfolio
                </Typography>
            </Toolbar>
        </AppBar>
    );
}

export default Header;
