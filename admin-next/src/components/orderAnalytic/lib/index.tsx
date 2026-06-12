import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Frame } from "./Frame/Frame";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
);
