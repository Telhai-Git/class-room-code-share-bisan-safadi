// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container, Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import Menu from "./components/Menu.jsx";

import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Projects from "./pages/Projects.jsx";
import Contact from "./pages/Contact.jsx";

function App() {
  const { darkMode } = useContext(AppContext);

  // יצירת theme לפי מצב כהה או בהיר
  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Menu />
        <Container maxWidth="md">
          <Box sx={{ my: 4 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Box>
        </Container>
        <Footer />
      </Router>
    </ThemeProvider>
  );
}

export default App;
