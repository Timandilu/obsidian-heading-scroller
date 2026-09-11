# Heading Scroller

A quiet heading rail for Obsidian that stays at the edge of a Markdown note and expands into a clean outline when you need it.

The rail appears only when a note contains at least two headings.

## Features

- Follow the current section while you read or edit.
- Click a tick to jump to its heading.
- Hover or focus the rail to reveal the full outline.
- Choose the left or right edge in **Settings → Heading Scroller**.
- Tap once on touch devices to open the outline, then choose a heading.
- Respect the operating system's reduced-motion setting.

## Installation

Once Heading Scroller is listed in the Community plugins directory:

1. Open **Settings → Community plugins → Browse** in Obsidian.
2. Search for **Heading Scroller**.
3. Select **Install**, then **Enable**.

For manual installation, download `main.js`, `manifest.json`, and `styles.css` from the latest release into `.obsidian/plugins/heading-scroller/`, then reload Obsidian.

## Privacy

Heading Scroller works entirely inside Obsidian. It makes no network requests, collects no telemetry, requires no account, and does not access files outside your vault.

## Development

```bash
corepack enable
pnpm install
pnpm check
```

## License

[MIT](LICENSE)
