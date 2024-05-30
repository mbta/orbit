import "./phoenix.js";
import { App } from "./components/app.js";
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("app") as Element);
root.render(<App />);
