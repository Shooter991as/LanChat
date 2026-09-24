import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./components/pages/LoginPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ChatPage } from "./components/pages/ChatPage";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    return token && username ? { token, username } : null;
  });

  const handleAuthSuccess = ({ token, username }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setUser({ token, username });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/chat" replace /> : <LoginPage onLogin={handleAuthSuccess} />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/chat" replace /> : <RegisterPage onRegister={handleAuthSuccess} />
          }
        />
        <Route
          path="/chat"
          element={
            user ? <ChatPage user={user} onLogout={handleLogout} /> : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

