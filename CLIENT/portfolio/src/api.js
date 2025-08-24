// src/api.js

// === Set your production backend URL here ===
const PROD_BASE = "https://awsam-ibraheem-bisan-safadi-portfolio.onrender.com";

// Auto-pick base: localhost in dev, PROD_BASE in prod
export const API_BASE =
  (typeof window !== "undefined" && window.location.hostname === "localhost")
    ? "http://localhost:3001"
    : PROD_BASE;

// Safe URL join
export function join(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
}

// JSON helper (for normal JSON APIs)
export async function api(path, { method = "GET", body, auth = true, headers: extraHeaders } = {}) {
  const headers = { "Content-Type": "application/json", ...(extraHeaders || {}) };

  if (auth) {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
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
  try { data = text ? JSON.parse(text) : null; } catch { }

  if (!res.ok) {
    console.error("[api] error", res.status, text || data);
    throw new Error((data && (data.message || data.error)) || text || `HTTP ${res.status}`);
  }
  return data;
}

// Form-data helper (for file uploads like PDFs/images)
// IMPORTANT: do NOT set Content-Type here; the browser sets the boundary automatically.
export async function apiForm(path, formData, { method = "POST", auth = true, headers: extraHeaders } = {}) {
  const headers = { ...(extraHeaders || {}) };

  if (auth) {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(join(API_BASE, path), { method, headers, body: formData });
  } catch (e) {
    console.error("[apiForm] network error", e);
    throw new Error("Network error (check API base URL and server availability)");
  }

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { }

  if (!res.ok) {
    console.error("[apiForm] error", res.status, text || data);
    throw new Error((data && (data.message || data.error)) || text || `HTTP ${res.status}`);
  }
  return data;
}

// Optional convenience endpoints
export const endpoints = {
  imagesList: () => api("/api/images-blob", { auth: false }),
  imageSrc: (id) => join(API_BASE, `/api/images-blob/${id}`),

  cvList: (member) => api(`/api/cv${member ? `?member=${member}` : ""}`, { auth: false }),
  cvLatestView: (member) => join(API_BASE, `/api/cv/latest?member=${member}`),
  cvLatestDownload: (member) => join(API_BASE, `/api/cv/latest?member=${member}&download=1`),
};
