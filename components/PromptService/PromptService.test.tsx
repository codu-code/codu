import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { PromptDialog } from "@/components/PromptService";

class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver;

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("./PromptContext", () => ({
  usePrompt: jest.fn(),
}));

describe("PromptDialog Component", () => {
  const mockConfirm = jest.fn();
  const mockCancel = jest.fn();

  jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
  }));

  const PromptDialogTestComponent = (
    <PromptDialog
      title="Test Title"
      subTitle="Test Subtitle"
      content="Test Content"
      confirm={mockConfirm}
      cancel={mockCancel}
      confirmText="Continue without saving"
      cancelText="Keep editing"
    />
  );

  it("renders with provided title, subtitle and content", () => {
    render(PromptDialogTestComponent);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("calls confirm callback when continue button is clicked", async () => {
    render(PromptDialogTestComponent);
    await userEvent.click(
      screen.getByRole("button", { name: "Continue without saving" }),
    );
    expect(mockConfirm).toHaveBeenCalled();
  });

  it("calls cancel callback when cancel button is clicked", async () => {
    render(PromptDialogTestComponent);
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(mockCancel).toHaveBeenCalled();
  });

  it("calls cancel callback when close icon is clicked", async () => {
    render(PromptDialogTestComponent);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(mockCancel).toHaveBeenCalled();
  });
});
