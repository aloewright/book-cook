import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");
createRoot(root).render(
  <StrictMode>
    <div style={{ padding: 48, fontFamily: "system-ui" }}>
      <h1>Book Generators</h1>
      <p>Boot succeeded. Routing scaffolds in Task 11.</p>
    </div>
  </StrictMode>
);
