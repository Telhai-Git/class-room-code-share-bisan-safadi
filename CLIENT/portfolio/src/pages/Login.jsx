import { useState } from "react";

export default function AdminLogin({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const API_BASE =
        (typeof import.meta !== "undefined" &&
            import.meta.env &&
            import.meta.env.VITE_API_BASE) ||
        "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (!username.trim() || !password.trim()) {
            setErrorMsg("Please fill in both username and password.");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`${API_BASE}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim(), password: password.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                setErrorMsg(data?.message || "Login failed");
                return;
            }

            // Save token
            localStorage.setItem("adminToken", data.token);
            localStorage.setItem("adminUser", JSON.stringify(data.user));

            // Optional callback to update parent state
            if (onLogin) onLogin(data.user);

            // Redirect to admin dashboard
            window.location.href = "/admin";
        } catch (err) {
            console.error(err);
            setErrorMsg("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "50px auto" }}>
            <h2>Admin Login</h2>
            {errorMsg && <div style={{ color: "red", marginBottom: 10 }}>{errorMsg}</div>}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 10 }}>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>
                <div style={{ marginBottom: 10 }}>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px" }}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}
