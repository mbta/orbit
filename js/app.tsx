// runs initialization during import
import "./telemetry";
import "./phoenix.js";
import { App } from "./components/app.js";
import { initSocket } from "./socket";
import { createRoot } from "react-dom/client";

initSocket();

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("app")!);
root.render(<App />);
