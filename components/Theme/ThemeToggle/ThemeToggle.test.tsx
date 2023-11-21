import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import { axe, toHaveNoViolations } from "jest-axe";
import ThemeToggle from "./ThemeToggle";

expect.extend(toHaveNoViolations);

describe("Theme Toggle", () => {
  const user = userEvent.setup();

  it("renders with no axe violations", async () => {
    const { container } = render(<ThemeToggle />, { wrapper: ThemeProvider });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders a theme toggle button and toggles pressed state", async () => {
    render(<ThemeToggle />, { wrapper: ThemeProvider });

    const toggleButton = screen.getByRole("button", {
      name: "Toggle Dark Mode",
      pressed: false,
    });

    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-pressed", "true");

    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-pressed", "false");
  });
});
