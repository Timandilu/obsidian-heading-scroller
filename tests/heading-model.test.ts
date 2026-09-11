import { describe, expect, test } from "vitest";

import {
  activeHeadingForLine,
  normalizeHeadings,
  shouldShowHeadingScroller,
} from "../src/heading-model";

describe("heading model", () => {
  test("normalizes cached headings without losing hierarchy", () => {
    expect(
      normalizeHeadings([
        { heading: " Intro ", level: 1, position: { start: { line: 2 } } },
        { heading: "Details", level: 3, position: { start: { line: 14 } } },
      ]),
    ).toEqual([
      { text: "Intro", level: 1, line: 2 },
      { text: "Details", level: 3, line: 14 },
    ]);
  });

  test("selects the latest heading at or before the current line", () => {
    const headings = [
      { text: "One", level: 1, line: 2 },
      { text: "Two", level: 2, line: 8 },
      { text: "Three", level: 2, line: 20 },
    ];
    expect(activeHeadingForLine(headings, 0)).toBe(0);
    expect(activeHeadingForLine(headings, 8)).toBe(1);
    expect(activeHeadingForLine(headings, 19)).toBe(1);
    expect(activeHeadingForLine(headings, 30)).toBe(2);
  });

  test("returns no active heading for an empty document", () => {
    expect(activeHeadingForLine([], 4)).toBe(-1);
  });

  test("only shows the scroller for two or more headings", () => {
    expect(shouldShowHeadingScroller([])).toBe(false);
    expect(
      shouldShowHeadingScroller([{ text: "Only", level: 1, line: 0 }]),
    ).toBe(false);
    expect(
      shouldShowHeadingScroller([
        { text: "One", level: 1, line: 0 },
        { text: "Two", level: 2, line: 4 },
      ]),
    ).toBe(true);
  });
});
