import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { UnknownOption } from "../components/UnknownOption";
import {
  cropHistorySchema,
  emptyProfileValues,
  profileSchema,
} from "../lib/schemas";
import i18n from "../lib/i18n";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
describe("honest unknown answers", () => {
  it("accepts all unknown profile answers and no soil test", () => {
    const result = profileSchema.safeParse(emptyProfileValues);
    expect(result.success).toBe(true);
    if (result.success)
      expect(
        Object.values(result.data.soilTest).every((value) => value === null),
      ).toBe(true);
  });
  it("accepts unknown crop history without inventing crops or months", () => {
    expect(
      cropHistorySchema.safeParse({ entries: [], unknown: true }).success,
    ).toBe(true);
    expect(
      cropHistorySchema.safeParse({ entries: [], unknown: false }).success,
    ).toBe(false);
  });
  it("validates optional soil test values when supplied", () => {
    expect(
      profileSchema.safeParse({
        ...emptyProfileValues,
        soilTest: { ...emptyProfileValues.soilTest, ph: 15 },
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...emptyProfileValues,
        soilTest: { ...emptyProfileValues.soilTest, ph: 7.2 },
      }).success,
    ).toBe(true);
  });
  it("makes the unknown path keyboard accessible", async () => {
    function Example() {
      const [unknown, setUnknown] = useState(false);
      return <UnknownOption checked={unknown} onChange={setUnknown} />;
    }
    render(<Example />);
    const choice = screen.getByRole("checkbox", { name: "I don't know" });
    expect(choice).toHaveAttribute("aria-checked", "false");
    await userEvent.tab();
    await userEvent.keyboard(" ");
    expect(choice).toHaveAttribute("aria-checked", "true");
  });
});
