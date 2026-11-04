const vscode = require('vscode');
const path = require('node:path');
const { generateDiagram, markdownImage, relativeImagePath } = require('./service.cjs');

const KEY = 'svgdiagram.apiKey';

async function setApiKey(context) {
  const key = await vscode.window.showInputBox({ title: 'SVG Diagram API key', prompt: 'Enter an API key from svgdiagram.ai/settings. API access requires a Power or Max plan.', password: true, ignoreFocusOut: true, validateInput: value => value.trim() ? null : 'Enter an API key.' });
  if (key === undefined) return false;
  await context.secrets.store(KEY, key.trim());
  vscode.window.showInformationMessage('SVG Diagram API key saved securely.');
  return true;
}

async function createDiagram(context) {
  const editor = vscode.window.activeTextEditor;
  const selection = editor && !editor.selection.isEmpty ? editor.document.getText(editor.selection) : '';
  const prompt = await vscode.window.showInputBox({ title: 'Create diagram', prompt: selection ? 'Edit the selected text before sending it to SVG Diagram.' : 'Describe the diagram to send to SVG Diagram.', value: selection, ignoreFocusOut: true, validateInput: value => value.trim().length >= 3 && value.trim().length <= 6000 ? null : 'Enter 3 to 6,000 characters.' });
  if (prompt === undefined) return;
  let key = await context.secrets.get(KEY);
  if (!key) {
    if (!await setApiKey(context)) return;
    key = await context.secrets.get(KEY);
  }
  const folder = editor?.document.uri.scheme === 'file' ? vscode.Uri.file(path.dirname(editor.document.uri.fsPath)) : vscode.workspace.workspaceFolders?.[0]?.uri;
  const target = await vscode.window.showSaveDialog({ title: 'Save generated diagram', defaultUri: folder ? vscode.Uri.joinPath(folder, 'diagram.svg') : undefined, filters: { 'SVG image': ['svg'] }, saveLabel: 'Generate and save' });
  if (!target) return;
  const svg = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Generating SVG Diagram', cancellable: true }, async (_, token) => {
    const controller = new AbortController();
    const subscription = token.onCancellationRequested(() => controller.abort());
    try { return await generateDiagram(key, prompt.trim(), controller.signal); }
    finally { subscription.dispose(); }
  });
  await saveDiagram(target, svg, editor);
}

async function saveDiagram(target, svg, editor) {
  await vscode.workspace.fs.writeFile(target, Buffer.from(svg, 'utf8'));
  if (editor?.document.languageId === 'markdown' && editor.document.uri.scheme === 'file' && target.scheme === 'file') {
    const choice = await vscode.window.showInformationMessage('Diagram saved. Add a reference to the Markdown document?', 'Insert reference');
    if (choice === 'Insert reference') {
      const relative = await relativeImagePath(editor.document.uri.fsPath, target.fsPath);
      const inserted = await editor.edit(edit => edit.insert(editor.selection.active, `${markdownImage(relative)}\n`));
      if (!inserted) vscode.window.showWarningMessage('Diagram saved, but the Markdown reference could not be inserted.');
    }
  } else vscode.window.showInformationMessage('SVG Diagram saved.');
}

function openMakers(context) {
  const editor = vscode.window.activeTextEditor;
  const panel = vscode.window.createWebviewPanel('svgdiagram.makers', 'SVG Diagram: Free Makers', vscode.ViewColumn.Beside, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
  });
  const script = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'makers.js'));
  const css = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'makers.css'));
  const source = panel.webview.cspSource;
  panel.webview.html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src ${source} 'unsafe-inline'; script-src ${source}"><link rel="stylesheet" href="${css}"></head><body class="svgdiagram-modal"><div id="app"></div><script src="${script}"></script></body></html>`;
  panel.webview.onDidReceiveMessage(async message => {
    if (message?.type !== 'save' || typeof message.id !== 'string' || typeof message.svg !== 'string' || message.svg.length > 2000000) return;
    try {
      const folder = editor?.document.uri.scheme === 'file' ? vscode.Uri.file(path.dirname(editor.document.uri.fsPath)) : vscode.workspace.workspaceFolders?.[0]?.uri;
      const target = await vscode.window.showSaveDialog({ title: 'Save diagram', defaultUri: folder ? vscode.Uri.joinPath(folder, 'diagram.svg') : undefined, filters: { 'SVG image': ['svg'] }, saveLabel: 'Save' });
      if (!target) throw new Error('Save cancelled.');
      await saveDiagram(target, message.svg, editor);
      await panel.webview.postMessage({ id: message.id });
    } catch (error) { await panel.webview.postMessage({ id: message.id, error: error.message }); }
  }, null, context.subscriptions);
}

function activate(context) {
  const run = fn => async () => { try { await fn(); } catch (error) { if (error.name !== 'AbortError') vscode.window.showErrorMessage(`SVG Diagram: ${error.message}`); } };
  context.subscriptions.push(
    vscode.commands.registerCommand('svgdiagram.create', run(() => createDiagram(context))),
    vscode.commands.registerCommand('svgdiagram.makers', run(() => openMakers(context))),
    vscode.commands.registerCommand('svgdiagram.setApiKey', run(() => setApiKey(context))),
    vscode.commands.registerCommand('svgdiagram.removeApiKey', run(async () => { await context.secrets.delete(KEY); vscode.window.showInformationMessage('SVG Diagram API key removed.'); }))
  );
}

module.exports = { activate };
