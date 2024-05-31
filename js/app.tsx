import "./phoenix.js";
import { App } from "./components/app.js";
import { createRoot } from "react-dom/client";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("app")!);
root.render(<App />);
