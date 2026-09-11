export type ScrollerSide = "left" | "right";

export interface HeadingScrollerSettings {
  side: ScrollerSide;
}

export const DEFAULT_SETTINGS: HeadingScrollerSettings = {
  side: "left",
};
