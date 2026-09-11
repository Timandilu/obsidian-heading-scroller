import { MarkdownView } from "obsidian";

import {
  activeHeadingForLine,
  HeadingItem,
  normalizeHeadings,
  shouldShowHeadingScroller,
} from "./heading-model";
import { HeadingScrollerSettings } from "./types";

const HEADING_SELECTOR =
  ".markdown-preview-view h1, .markdown-preview-view h2, .markdown-preview-view h3, .markdown-preview-view h4, .markdown-preview-view h5, .markdown-preview-view h6";

export class HeadingScroller {
  private root: HTMLElement;
  private rail: HTMLElement;
  private panel: HTMLElement;
  private headings: HeadingItem[] = [];
  private markerButtons: HTMLButtonElement[] = [];
  private outlineButtons: HTMLButtonElement[] = [];
  private signature = "";
  private activeIndex = -1;
  private animationFrame: number | null = null;
  private settings: HeadingScrollerSettings;

  private readonly handleScroll = (): void => this.scheduleActiveUpdate();
  private readonly handleOutsidePointer = (event: PointerEvent): void => {
    if (!this.root.contains(event.target as Node))
      this.root.removeClass("is-open");
  };

  constructor(
    private readonly view: MarkdownView,
    settings: HeadingScrollerSettings,
  ) {
    this.settings = settings;
    this.view.containerEl.addClass("heading-scroller-host");
    this.root = this.view.containerEl.createDiv({ cls: "heading-scroller" });
    this.root.setAttribute("aria-label", "Heading scroller");
    this.panel = this.root.createDiv({ cls: "heading-scroller__panel" });
    this.rail = this.root.createDiv({ cls: "heading-scroller__rail" });
    this.rail.setAttribute("role", "navigation");
    this.rail.setAttribute("aria-label", "Document headings");
    this.applySide();

    this.view.containerEl.addEventListener("scroll", this.handleScroll, true);
    this.root.ownerDocument.addEventListener(
      "pointerdown",
      this.handleOutsidePointer,
      true,
    );
    this.refresh(true);
  }

  public refresh(force = false): void {
    const file = this.view.file;
    const cached = file
      ? this.view.app.metadataCache.getFileCache(file)?.headings
      : undefined;
    const headings = normalizeHeadings(cached);
    const signature = `${file?.path ?? ""}|${headings
      .map((heading) => `${heading.level}:${heading.line}:${heading.text}`)
      .join("|")}`;

    if (force || signature !== this.signature) {
      this.signature = signature;
      this.headings = headings;
      this.render();
    }
    this.scheduleActiveUpdate();
  }

  public updateSettings(settings: HeadingScrollerSettings): void {
    this.settings = settings;
    this.applySide();
  }

  public destroy(): void {
    if (this.animationFrame !== null) {
      this.root.ownerDocument.defaultView?.cancelAnimationFrame(
        this.animationFrame,
      );
    }
    this.view.containerEl.removeEventListener(
      "scroll",
      this.handleScroll,
      true,
    );
    this.root.ownerDocument.removeEventListener(
      "pointerdown",
      this.handleOutsidePointer,
      true,
    );
    this.root.remove();
    this.view.containerEl.removeClass("heading-scroller-host");
  }

  private applySide(): void {
    this.root.toggleClass(
      "heading-scroller--left",
      this.settings.side === "left",
    );
    this.root.toggleClass(
      "heading-scroller--right",
      this.settings.side === "right",
    );
  }

  private render(): void {
    this.panel.empty();
    this.rail.empty();
    this.markerButtons = [];
    this.outlineButtons = [];
    this.activeIndex = -1;
    const shouldShow = shouldShowHeadingScroller(this.headings);
    this.root.toggleClass("is-hidden", !shouldShow);
    if (!shouldShow) return;

    this.panel.setAttribute("role", "navigation");
    this.panel.setAttribute("aria-label", "Table of contents");
    this.panel.createDiv({ cls: "heading-scroller__eyebrow", text: "INHALTE" });
    const outline = this.panel.createDiv({ cls: "heading-scroller__outline" });

    this.headings.forEach((heading, index) => {
      const marker = this.rail.createEl("button", {
        cls: [
          "heading-scroller__marker",
          `heading-scroller__marker--level-${heading.level}`,
        ],
        attr: {
          type: "button",
          title: heading.text,
          "aria-label": `Scroll to ${heading.text}`,
        },
      });
      marker.createSpan({ cls: "heading-scroller__tick" });
      marker.addEventListener("click", (event) =>
        this.handleMarkerClick(event, index),
      );
      this.markerButtons.push(marker);

      const link = outline.createEl("button", {
        cls: [
          "heading-scroller__link",
          `heading-scroller__link--depth-${Math.min(heading.level - 1, 5)}`,
        ],
        text: heading.text,
        attr: {
          type: "button",
          title: heading.text,
        },
      });
      link.addEventListener("click", () => this.scrollToHeading(index));
      this.outlineButtons.push(link);
    });
  }

  private handleMarkerClick(event: MouseEvent, index: number): void {
    event.stopPropagation();
    const coarsePointer =
      this.root.ownerDocument.defaultView?.matchMedia("(hover: none)").matches;
    if (coarsePointer && !this.root.hasClass("is-open")) {
      this.root.addClass("is-open");
      return;
    }
    this.scrollToHeading(index);
  }

  private scrollToHeading(index: number): void {
    const heading = this.headings[index];
    if (!heading) return;

    if (this.view.getMode() === "preview") {
      const renderedHeadings = Array.from(
        this.view.containerEl.querySelectorAll<HTMLElement>(HEADING_SELECTOR),
      );
      const target = renderedHeadings[index];
      target?.scrollIntoView({
        block: "start",
        behavior: this.prefersReducedMotion() ? "auto" : "smooth",
      });
    } else {
      const position = { line: heading.line, ch: 0 };
      this.view.editor.setCursor(position);
      this.view.editor.scrollIntoView({ from: position, to: position }, true);
      this.view.editor.focus();
    }

    this.setActiveIndex(index);
    this.root.removeClass("is-open");
  }

  private scheduleActiveUpdate(): void {
    if (this.animationFrame !== null) return;
    const hostWindow = this.root.ownerDocument.defaultView;
    if (!hostWindow) return;
    this.animationFrame = hostWindow.requestAnimationFrame(() => {
      this.animationFrame = null;
      this.updateActiveHeading();
    });
  }

  private updateActiveHeading(): void {
    if (this.headings.length === 0) return;
    let nextIndex: number;

    if (this.view.getMode() === "preview") {
      const rendered = Array.from(
        this.view.containerEl.querySelectorAll<HTMLElement>(HEADING_SELECTOR),
      );
      const scroller = this.view.containerEl.querySelector<HTMLElement>(
        ".markdown-preview-view",
      );
      if (rendered.length === 0 || !scroller) return;

      const boundary =
        scroller.getBoundingClientRect().top +
        Math.min(112, scroller.clientHeight * 0.2);
      nextIndex = 0;
      for (
        let index = 0;
        index < Math.min(rendered.length, this.headings.length);
        index += 1
      ) {
        if (rendered[index].getBoundingClientRect().top > boundary) break;
        nextIndex = index;
      }
    } else {
      const scroller =
        this.view.containerEl.querySelector<HTMLElement>(".cm-scroller");
      if (!scroller) return;
      const maximumScroll = Math.max(
        1,
        scroller.scrollHeight - scroller.clientHeight,
      );
      const estimatedLine = Math.round(
        (scroller.scrollTop / maximumScroll) *
          Math.max(0, this.view.editor.lineCount() - 1),
      );
      nextIndex = activeHeadingForLine(this.headings, estimatedLine);
    }

    this.setActiveIndex(nextIndex);
  }

  private setActiveIndex(index: number): void {
    if (index === this.activeIndex || index < 0) return;
    this.markerButtons[this.activeIndex]?.removeClass("is-active");
    this.outlineButtons[this.activeIndex]?.removeClass("is-active");
    this.markerButtons[this.activeIndex]?.removeAttribute("aria-current");
    this.outlineButtons[this.activeIndex]?.removeAttribute("aria-current");

    this.activeIndex = index;
    this.markerButtons[index]?.addClass("is-active");
    this.outlineButtons[index]?.addClass("is-active");
    this.markerButtons[index]?.setAttribute("aria-current", "location");
    this.outlineButtons[index]?.setAttribute("aria-current", "location");

    if (this.root.matches(":hover") || this.root.hasClass("is-open")) {
      this.outlineButtons[index]?.scrollIntoView({ block: "nearest" });
    }
  }

  private prefersReducedMotion(): boolean {
    return Boolean(
      this.root.ownerDocument.defaultView?.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches,
    );
  }
}
