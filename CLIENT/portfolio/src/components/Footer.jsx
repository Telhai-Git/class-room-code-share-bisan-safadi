// src/components/Footer.jsx
import { Box, Typography } from "@mui/material";

function Footer() {
    return (
        <Box
            sx={{
                padding: 2,
                textAlign: "center",
                backgroundColor: "#eeeeee",
                marginTop: 4,
            }}
        >
            <Typography variant="body2" color="textSecondary">
                © Awsam&Bisan 2025 — All rights reserved.
            </Typography>
        </Box>
    );
}

export default Footer;
