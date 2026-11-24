import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="cashier-theme">
      <div className="cashier-ds min-h-svh">
        <App />
      </div>
    </ThemeProvider>
  </StrictMode>
)
