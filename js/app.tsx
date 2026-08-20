// runs initialization during import
import "./telemetry";
import "./phoenix.js";
import { App } from "./components/app.js";
import { initColorScheme } from "./util/colorScheme";
import { createRoot } from "react-dom/client";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(document.getElementById("app")!);
initColorScheme();
root.render(<App />);
