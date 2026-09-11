import { MarkdownView, Plugin } from "obsidian";

import { HeadingScroller } from "./heading-scroller";
import { HeadingScrollerSettingTab } from "./settings-tab";
import { DEFAULT_SETTINGS, HeadingScrollerSettings } from "./types";

export default class HeadingScrollerPlugin extends Plugin {
  public settings: HeadingScrollerSettings = { ...DEFAULT_SETTINGS };
  private scrollers = new Map<MarkdownView, HeadingScroller>();
  private syncFrame: number | null = null;

  public async onload(): Promise<void> {
    const stored =
      (await this.loadData()) as Partial<HeadingScrollerSettings> | null;
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...(stored ?? {}),
      side: stored?.side === "right" ? "right" : "left",
    };

    this.addSettingTab(new HeadingScrollerSettingTab(this));
    this.addCommand({
      id: "toggle-side",
      name: "Move to the other side",
      callback: () => {
        this.settings.side = this.settings.side === "left" ? "right" : "left";
        void this.saveSettings();
      },
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.scheduleSync()),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.scheduleSync()),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.scheduleSync()),
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        for (const [view, scroller] of this.scrollers) {
          if (view.file?.path === file.path) scroller.refresh();
        }
      }),
    );
    this.registerEvent(this.app.vault.on("rename", () => this.scheduleSync()));
    this.registerEvent(this.app.vault.on("delete", () => this.scheduleSync()));

    this.app.workspace.onLayoutReady(() => this.syncViews());
  }

  public onunload(): void {
    if (this.syncFrame !== null) window.cancelAnimationFrame(this.syncFrame);
    for (const scroller of this.scrollers.values()) scroller.destroy();
    this.scrollers.clear();
  }

  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    for (const scroller of this.scrollers.values()) {
      scroller.updateSettings(this.settings);
    }
  }

  private scheduleSync(): void {
    if (this.syncFrame !== null) return;
    this.syncFrame = window.requestAnimationFrame(() => {
      this.syncFrame = null;
      this.syncViews();
    });
  }

  private syncViews(): void {
    const currentViews = new Set<MarkdownView>();
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      if (!(leaf.view instanceof MarkdownView)) continue;
      currentViews.add(leaf.view);
      const existing = this.scrollers.get(leaf.view);
      if (existing) {
        existing.refresh();
      } else {
        this.scrollers.set(
          leaf.view,
          new HeadingScroller(leaf.view, this.settings),
        );
      }
    }

    for (const [view, scroller] of this.scrollers) {
      if (!currentViews.has(view) || !view.containerEl.isConnected) {
        scroller.destroy();
        this.scrollers.delete(view);
      }
    }
  }
}
