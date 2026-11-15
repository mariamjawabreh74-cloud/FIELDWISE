import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function filesAt(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesAt(join(path, entry.name))
      : [join(path, entry.name)],
  );
}
describe("frontend-only application boundary", () => {
  it("keeps components and pages away from fetch and direct mock imports", () => {
    const files = [
      ...filesAt("src/components"),
      ...filesAt("src/pages"),
    ].filter((file) => /\.tsx?$/.test(file));
    const violations = files.filter((file) =>
      /\bfetch\s*\(|from\s+['"][^'"]*mocks\//.test(readFileSync(file, "utf8")),
    );
    expect(violations).toEqual([]);
  });
  it("keeps application network access inside the API boundary", () => {
    const files = filesAt("src").filter(
      (file) =>
        /\.tsx?$/.test(file) &&
        !file.includes("/test/") &&
        !file.includes("/lib/api/"),
    );
    expect(
      files.filter((file) => /\bfetch\s*\(/.test(readFileSync(file, "utf8"))),
    ).toEqual([]);
  });
});
