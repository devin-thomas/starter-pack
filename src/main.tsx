import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import type { SiteData } from "./site-data";
import "./index.css";

let root: HTMLElement | null = document.getElementById("root");
let payload: HTMLElement | null = document.getElementById("site-data");
if (!root || !payload?.textContent)
  throw new Error(
    "Site content is missing. Run the documented build or dev command.",
  );
const data: SiteData = JSON.parse(payload.textContent);
hydrateRoot(
  root,
  <App path={window.location.pathname.replace(/\/$/, "") || "/"} data={data} />,
);
