// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container, Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./App.css";





import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

// 🚫 REMOVE this line
// import Menu from "./components/Menu.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Projects from "./pages/Projects.jsx";
import Contact from "./pages/Contact.jsx";
import CV from "./pages/CV.jsx";
import Blog from "./pages/Blog.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function App() {
  const { darkMode } = useContext(AppContext);

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App"> {/* ✅ Add this wrapper to apply background */}
        <Router>
          <Header />

          <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cv" element={<CV />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Box>
          </Container>

          <Footer />
        </Router>
      </div>
    </ThemeProvider>
  );

}

export default App;
