import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { CaptureProvider } from "./state/CaptureContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CaptureProvider>
        <App />
      </CaptureProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
