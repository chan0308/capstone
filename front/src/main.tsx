import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";   // ✅ 디자인 CSS

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
