import React from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { Palette, ListTodo } from "lucide-react";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AvatarMenu from "@/components/ui/avatar-menu";

function App() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <div className="flex h-screen">
        {!hideSidebar && (
          <aside className="w-16 flex flex-col items-center gap-4 border-r border-outline/10 bg-white py-4">
            <AvatarMenu />
            <Link
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-variant"
              to="/"
              title="Todo"
            >
              <ListTodo className="h-5 w-5" />
            </Link>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-variant"
              aria-label="切换主题"
            >
              <Palette className="h-5 w-5" />
            </button>
          </aside>
        )}

        <main className="flex-1">
          <div className="h-full bg-white shadow-sm">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
