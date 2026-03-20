import { useMemo } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "./scenes/homePage";
import LoginPage from "./scenes/loginPage";
import LandingPage from "./scenes/landingPage";
import ProfilePage from "./scenes/profilePage";
import MessagesPage from "./scenes/messagesPage";
import ResetPasswordPage from "./scenes/resetPasswordPage";
import { useSelector } from "react-redux";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { themeSettings } from "./theme";
import { SocketProvider } from "./context/SocketContext";

function App() {
  const mode = useSelector((state) => state.mode);
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
  const isAuth = Boolean(useSelector((state) => state.token));

  return (
    <div className="app">
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SocketProvider>
            <Routes>
              <Route path="/"               element={<LandingPage />} />
              <Route path="/login"          element={<LoginPage />} />
              <Route path="/home"           element={isAuth ? <HomePage />    : <Navigate to="/login" />} />
              <Route path="/profile/:userId" element={isAuth ? <ProfilePage /> : <Navigate to="/login" />} />
              <Route path="/messages"        element={isAuth ? <MessagesPage /> : <Navigate to="/login" />} />
              <Route path="/reset-password"   element={<ResetPasswordPage />} />
            </Routes>
          </SocketProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
