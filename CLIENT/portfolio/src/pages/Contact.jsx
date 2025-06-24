// src/pages/Contact.jsx
import { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

function Contact() {
    const [form, setForm] = useState({ name: "", email: "", message: "" });
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setSuccess(true);
                setForm({ name: "", email: "", message: "" });
            } else {
                alert("Something went wrong.");
            }
        } catch (err) {
            console.error("Error:", err);
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
            <Typography variant="h4" gutterBottom>Contact Me</Typography>
            {success && <Typography color="green">Message sent successfully!</Typography>}
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Name"
                    name="name"
                    fullWidth
                    margin="normal"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    margin="normal"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <TextField
                    label="Message"
                    name="message"
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    required
                />
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>Send</Button>
            </form>
        </Box>
    );
}

export default Contact;
