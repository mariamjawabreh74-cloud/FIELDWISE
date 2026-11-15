import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../lib/i18n";
import { DatasetCard } from "../components/DatasetCard";
import { datasets } from "../mocks/environment";
import { mockApi, resetMockStore } from "../lib/api/mock";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});
describe("environmental transparency", () => {
  it("shows unavailable and partial states without calling them ready", () => {
    render(
      <>
        <DatasetCard
          dataset={datasets.find((item) => item.dataset === "ecostress")!}
          onRetry={() => {}}
        />
        <DatasetCard
          dataset={datasets.find((item) => item.dataset === "landsat")!}
          onRetry={() => {}}
        />
      </>,
    );
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.getByText("Partial coverage")).toBeInTheDocument();
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });
  it("makes resolution and limitations accessible from every source control", async () => {
    render(
      <DatasetCard
        dataset={datasets.find((item) => item.dataset === "smap")!}
        onRetry={() => {}}
      />,
    );
    expect(screen.getByText("~9 km · regional estimate")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Source & limitations" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/not the full crop root zone/)).toBeInTheDocument();
  });
  it("progresses a simulated analysis through running to complete", async () => {
    resetMockStore();
    vi.useFakeTimers();
    try {
      const first = mockApi.startAnalysis("demo-jenin");
      await vi.advanceTimersByTimeAsync(300);
      const queued = await first;
      expect(queued.status).toBe("ok");
      if (queued.status === "ok") expect(queued.data.stage).toBe("queued");
      await vi.advanceTimersByTimeAsync(1500);
      const middle = mockApi.getAnalysisStatus("demo-jenin");
      await vi.advanceTimersByTimeAsync(300);
      const running = await middle;
      if (running.status === "ok") expect(running.data.stage).toBe("running");
      await vi.advanceTimersByTimeAsync(4000);
      const last = mockApi.getAnalysisStatus("demo-jenin");
      await vi.advanceTimersByTimeAsync(300);
      const done = await last;
      if (done.status === "ok") expect(done.data.stage).toBe("complete");
    } finally {
      vi.useRealTimers();
    }
  });
});
