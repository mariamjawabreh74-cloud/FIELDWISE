import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import i18n from "../lib/i18n";
import { LanguageToggle } from "../components/LanguageToggle";
import { SimulatedBanner } from "../components/SimulatedBanner";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

function keys(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) =>
    typeof entry === "object" && entry !== null
      ? keys(entry as Record<string, unknown>, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("language and RTL", () => {
  it("has an Arabic translation for every English string", () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort());
  });
  it("renders Arabic right-to-left and switches to English", async () => {
    await act(async () => {
      await i18n.changeLanguage("ar");
    });
    render(
      <>
        <LanguageToggle />
        <SimulatedBanner simulated />
      </>,
    );
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(screen.getByText(ar.common.simulated)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(screen.getByText(en.common.simulated)).toBeInTheDocument();
  });
  it("does not show a simulated banner for real data", () => {
    render(<SimulatedBanner simulated={false} />);
    expect(screen.queryByTestId("simulated-banner")).not.toBeInTheDocument();
  });
});
