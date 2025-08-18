// src/api.js
const PROD_BASE = "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

// Auto-pick base: localhost when developing, Render when deployed
const API_BASE =
  (typeof window !== "undefined" && window.location.hostname === "localhost")
    ? "http://localhost:3001"
    : PROD_BASE;

// Safer join
function join(base, path) {
  const b = base.replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function api(path, { method = "GET", body, auth = true, headers: extraHeaders } = {}) {
  const headers = { "Content-Type": "application/json", ...(extraHeaders || {}) };

  if (auth) {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(join(API_BASE, path), {
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
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    console.error("[api] error", res.status, text || data);
    throw new Error((data && (data.message || data.error)) || text || `HTTP ${res.status}`);
  }
  return data;
}
