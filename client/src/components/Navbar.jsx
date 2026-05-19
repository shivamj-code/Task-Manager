import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getCurrentUser } from "../utils/auth.js";

const THEME_STORAGE_KEY = "task-manager-theme";

const getInitialTheme = () => localStorage.getItem(THEME_STORAGE_KEY) || "light";

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleLogout = () => {
    const shouldLogout = window.confirm("Are you sure you want to logout?");

    if (!shouldLogout) return;

    clearAuth();
    navigate("/login", { replace: true });
  };

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <header className="navbar">
      <div>
        <p className="navbar__eyebrow">Task Manager</p>
        <h1>Workspace Board</h1>
      </div>

      <div className="navbar__actions">
        {user?.name && (
          <span className="navbar__user">
            Signed in as <strong>{user.name}</strong>
          </span>
        )}
        <button className="button button--ghost" type="button" onClick={handleThemeToggle}>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <button className="button button--logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default React.memo(Navbar);
