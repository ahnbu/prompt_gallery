import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./styles.css"

class RootElementError extends Error {
  constructor() {
    super("Root element #root was not found")
    this.name = "RootElementError"
  }
}

const rootElement = document.getElementById("root")

if (rootElement === null) {
  throw new RootElementError()
}

createRoot(rootElement).render(<App />)
