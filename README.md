# SVG Diagram for VS Code

Create a diagram with ten free makers or generate one from a prompt, then save the SVG. When the active editor is Markdown, you can insert a relative image reference at the cursor. Selected text is offered as an editable prompt; nothing is sent until you submit the prompt and choose where to save the result.

Run **SVG Diagram: Free Makers** to create diagrams locally without an account or network access.

Run **SVG Diagram: Create Diagram** from the command palette. The extension asks for an SVG Diagram API key on first use and stores it in VS Code SecretStorage. API access requires a Power or Max plan. Each generation uses a diagram credit. Manage the key with **SVG Diagram: Set API Key** or **SVG Diagram: Remove API Key**.

The prompt is sent to https://svgdiagram.ai to generate the diagram. The extension does not read or send other workspace files. Review the generated output before sharing it.

Privacy: https://svgdiagram.ai/privacy · Terms: https://svgdiagram.ai/terms · Support: support@svgdiagram.ai

## Build from source

The [source repository](https://github.com/tonyzedginidze/svgdiagram-vscode) includes the shared maker code and pinned dependencies. Run `bun install --frozen-lockfile --ignore-scripts`, then `bun run build` to create `media/makers.js` and `media/makers.css`. Run `bun run test` to check the API client and Markdown path handling. The extension is GPL-2.0-or-later.
