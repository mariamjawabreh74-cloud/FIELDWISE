import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "../lib/i18n";
import { InsufficientData } from "../components/InsufficientData";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
describe("insufficient data screen", () => {
  it("lists exactly the missing inputs and routes to their forms", () => {
    render(
      <MemoryRouter>
        <InsufficientData missingInputs={["location", "boundary"]} />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("A farm location")).toBeInTheDocument();
    expect(screen.getByText("A valid field boundary")).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /Add this detail/ });
    expect(links[0]).toHaveAttribute("href", "/farm/location");
    expect(links[1]).toHaveAttribute("href", "/farm/boundary");
    expect(
      screen.queryByText("Build a plan with this"),
    ).not.toBeInTheDocument();
  });
});
