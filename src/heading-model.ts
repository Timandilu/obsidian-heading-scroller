export interface CachedHeadingLike {
  heading: string;
  level: number;
  position: { start: { line: number } };
}

export interface HeadingItem {
  text: string;
  level: number;
  line: number;
}

export function normalizeHeadings(
  headings: CachedHeadingLike[] | undefined,
): HeadingItem[] {
  return (headings ?? [])
    .filter(
      (heading) =>
        heading.heading.trim().length > 0 &&
        heading.level >= 1 &&
        heading.level <= 6,
    )
    .map((heading) => ({
      text: heading.heading.trim(),
      level: heading.level,
      line: Math.max(0, heading.position.start.line),
    }));
}

export function activeHeadingForLine(
  headings: HeadingItem[],
  line: number,
): number {
  if (headings.length === 0) return -1;
  let activeIndex = 0;
  for (let index = 0; index < headings.length; index += 1) {
    if (headings[index].line > line) break;
    activeIndex = index;
  }
  return activeIndex;
}

export function shouldShowHeadingScroller(headings: HeadingItem[]): boolean {
  return headings.length >= 2;
}
