import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/LoginPage";
import Header from "@/components/layout/Header";
import AuthGuard from "@/components/auth/AuthGuard";

function App() {
  const location = useLocation();
  const hideHeader = location.pathname === "/login" || location.pathname === "/register";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="flex flex-col h-screen">
          {!hideHeader && <Header />}

          <main className="flex-1 overflow-hidden">
            <div className="h-full bg-background">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default App;
