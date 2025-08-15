// src/api.js
const API_BASE = "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

export async function api(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
        const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (e) {
        console.error("[api] network error", e);
        throw new Error("Network error (check API base URL and server availability)");
    }

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { }
    if (!res.ok) {
        console.error("[api] error", res.status, text || data);
        throw new Error((data && (data.message || data.error)) || text || `HTTP ${res.status}`);
    }
    return data;
}
