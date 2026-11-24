import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  decorators: [(Story, context) => {
    const title = String(context.title ?? "");
    const isCashier = title.startsWith("Cashier/");
    const isDark = context.globals.theme === "dark";
    const scope = isCashier ? (isDark ? "cashier-ds" : "cashier-paper") : "";
    const isFullBleed =
      title.startsWith("Cashier/Screens/") || title === "Cashier/Design system";
    return (
      <div
        className={`${isDark ? "dark" : ""} ${scope} min-h-screen bg-background text-foreground`}
      >
        <div className={isCashier && isFullBleed ? "" : "p-6"}>
          <Story />
        </div>
      </div>
    );
  }],
  globalTypes: {
    theme: { description: "Theme", toolbar: { title: "Theme", items: ["light", "dark"], dynamicTitle: true } },
  },
  initialGlobals: { theme: "dark" },
  parameters: { layout: 'fullscreen', a11y: { test: 'todo' } },
}
export default preview
