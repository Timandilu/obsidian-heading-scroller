import { PluginSettingTab, Setting } from "obsidian";

import type HeadingScrollerPlugin from "./main";
import { ScrollerSide } from "./types";

export class HeadingScrollerSettingTab extends PluginSettingTab {
  constructor(private readonly plugin: HeadingScrollerPlugin) {
    super(plugin.app, plugin);
  }

  public display(): void {
    this.containerEl.empty();
    this.containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "A quiet outline at the edge of each Markdown note.",
    });

    new Setting(this.containerEl)
      .setName("Scroller position")
      .setDesc("Place the heading rail on the left or right edge of the note.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("left", "Left")
          .addOption("right", "Right")
          .setValue(this.plugin.settings.side)
          .onChange(async (value) => {
            this.plugin.settings.side = value as ScrollerSide;
            await this.plugin.saveSettings();
          }),
      );
  }
}
