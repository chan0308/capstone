import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// App.tsx 안에서 CSS를 import 안 하고 있다면,
// 여기서 해도 됨: import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
