// src/context/AppContext.jsx
import { createContext, useState } from "react";

// יצירת קונטקסט
export const AppContext = createContext();

export function AppProvider({ children }) {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        <AppContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </AppContext.Provider>
    );
}
