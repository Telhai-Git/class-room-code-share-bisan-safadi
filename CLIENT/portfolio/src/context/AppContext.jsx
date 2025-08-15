// src/context/AppContext.jsx
import { createContext, useContext, useMemo, useState } from "react";

// Create context
export const AppContext = createContext(null);

// Easy hook
export function useApp() {
    return useContext(AppContext);
}
export function AppProvider({ children }) {
    const [darkMode, setDarkMode] = useState(false);
    const toggleDarkMode = () => setDarkMode(v => !v);

    // NEW: read either key (adminToken or token)
    const initial = () => localStorage.getItem("token") || localStorage.getItem("adminToken");
    const [token, setToken] = useState(initial);

    const loginSaveToken = (t) => {
        localStorage.setItem("token", t);
        localStorage.setItem("adminToken", t); // keep both for compatibility
        setToken(t);
    };
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setToken(null);
    };

    const value = useMemo(() => ({ darkMode, toggleDarkMode, token, loginSaveToken, logout }), [darkMode, token]);
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
