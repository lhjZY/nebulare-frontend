import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/LoginPage";
import { ThemePaletteDialog } from "@/components/theme/ThemePaletteDialog";
import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";
function App() {
  const location = useLocation();
  const [themeDialogOpen, setThemeDialogOpen] = React.useState(false);
  const hideSidebar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <AuthGuard>
      <div className="min-h-screen bg-surface text-on-surface">
        <div className="flex h-screen">
          {!hideSidebar && <Sidebar setThemeDialogOpen={setThemeDialogOpen} />}

          <main className="flex-1">
            <div className="h-full bg-white shadow-xs">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/register" element={<AuthPage />} />
              </Routes>
            </div>
          </main>
        </div>
        <ThemePaletteDialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen} />
      </div>
    </AuthGuard>
  );
}

export default App;
