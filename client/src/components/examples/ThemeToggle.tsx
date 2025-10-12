import { ThemeToggle } from "../ThemeToggle";
import { ThemeProvider } from "@/lib/theme-provider";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}
