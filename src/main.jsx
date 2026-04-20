import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// StrictMode retiré : il double-monte les composants en dev,
// ce qui crée deux contextes WebGL et déclenche "Context Lost" sur le Canvas Three.js.
createRoot(document.getElementById("root")).render(<App />);
