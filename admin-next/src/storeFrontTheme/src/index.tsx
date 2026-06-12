import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ECommerceLanding } from "./screens/ECommerceLanding/ECommerceLanding";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <ECommerceLanding />
  </StrictMode>,
);
