// src/pages/AdminDashboard.jsx
import { Link } from "react-router-dom";

export default function AdminDashboard() {
    return (
        <div style={{ padding: "2rem" }}>
            <h1>Admin Dashboard</h1>
            <p>Welcome! Choose what you want to manage:</p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <Link to="/projects" className="btn btn-outline-primary">
                    Manage Projects
                </Link>

                <Link to="/blog" className="btn btn-outline-secondary">
                    Manage Blogs
                </Link>
            </div>
        </div>
    );
}
