import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useResource } from "../hooks/useResource";
import { AsyncState } from "../components/AsyncState";
import type { ApiResponse } from "../lib/api/types";
import i18n from "../lib/i18n";

function ResourceExample({
  load,
}: {
  load: () => Promise<ApiResponse<string[]>>;
}) {
  const resource = useResource(load);
  return (
    <MemoryRouter>
      <AsyncState resource={resource}>
        {(values) => <p>{values.join(", ")}</p>}
      </AsyncState>
    </MemoryRouter>
  );
}
beforeEach(async () => {
  await i18n.changeLanguage("en");
});
describe("loading, empty, failure, and stale responses", () => {
  it("shows a retry and recovers after a failed call", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ status: "ok", simulated: true, data: ["loaded"] });
    render(<ResourceExample load={load} />);
    expect(
      await screen.findByText("We couldn't load this just now."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("loaded")).toBeInTheDocument();
  });
  it("shows an empty state with a retry", async () => {
    const load = vi
      .fn()
      .mockResolvedValue({ status: "ok", simulated: true, data: [] });
    render(<ResourceExample load={load} />);
    expect(await screen.findByText("Nothing here yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
  it("never lets a stale recommendation replace a newer insufficient-data result", async () => {
    let resolveOld: (result: ApiResponse<string[]>) => void = () => {};
    const oldLoad = () =>
      new Promise<ApiResponse<string[]>>((resolve) => {
        resolveOld = resolve;
      });
    const newLoad = vi.fn().mockResolvedValue({
      status: "insufficient_data",
      simulated: true,
      missing_inputs: ["boundary"],
    });
    const { rerender } = render(<ResourceExample load={oldLoad} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<ResourceExample load={newLoad} />);
    expect(await screen.findByTestId("insufficient-data")).toBeInTheDocument();
    await act(async () => {
      resolveOld({
        status: "ok",
        simulated: true,
        data: ["stale recommendation"],
      });
    });
    expect(screen.queryByText("stale recommendation")).not.toBeInTheDocument();
    expect(screen.getByText("A valid field boundary")).toBeInTheDocument();
  });
});
