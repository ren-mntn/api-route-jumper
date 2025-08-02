import * as vscode from "vscode";
import { findApiCalls, generateServerPath } from "./api-parser";

export function activate(context: vscode.ExtensionContext) {
  // 設定キャッシュ
  let cachedConfig = vscode.workspace.getConfiguration("apiRouteJumper");

  // 設定変更の監視
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration("apiRouteJumper")) {
        cachedConfig = vscode.workspace.getConfiguration("apiRouteJumper");
      }
    }
  );
  context.subscriptions.push(configChangeDisposable);

  const disposable = vscode.commands.registerCommand(
    "api-route-jumper.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from API Route Jumper!"
      );
    }
  );

  context.subscriptions.push(disposable);

  class ApiCallCodeLensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(
      document: vscode.TextDocument,
      token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
      const codeLenses: vscode.CodeLens[] = [];
      const text = document.getText();
      const matches = findApiCalls(text);

      for (const match of matches) {
        const startPos = document.positionAt(match.index!);
        const endPos = document.positionAt(match.index! + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        codeLenses.push(
          new vscode.CodeLens(range, {
            title: "Jump to server controller",
            command: "api-route-jumper.jumpToServer",
            arguments: [match[0]],
          })
        );
      }
      return codeLenses;
    }
  }

  // 複数言語を1つのProviderで処理
  const provider = new ApiCallCodeLensProvider();
  const supportedLanguages = ["typescript", "javascript", "typescriptreact"];

  for (const language of supportedLanguages) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(
        { scheme: "file", language },
        provider
      )
    );
  }

  const jumpDisposable = vscode.commands.registerCommand(
    "api-route-jumper.jumpToServer",
    (apiCall: string) => {
      const serverRouteRoot: string = cachedConfig.get(
        "serverRouteRoot",
        "apps/server/src/routes/"
      );

      const routePath = generateServerPath(apiCall);
      const serverPath = `${serverRouteRoot.replace(
        /\/$/,
        ""
      )}/${routePath}/_handlers.ts`;
      const wsFolder = vscode.workspace.workspaceFolders?.[0];

      if (wsFolder) {
        const fileUri = vscode.Uri.joinPath(wsFolder.uri, serverPath);
        // ファイルを直接開いてエラーハンドリング（stat不要）
        vscode.window
          .showTextDocument(fileUri, {
            preview: false,
            viewColumn: vscode.ViewColumn.Active,
          })
          .then(
            undefined, // 成功時は何もしない
            () =>
              vscode.window.showWarningMessage(
                `Server file not found: ${serverPath}`
              )
          );
      } else {
        vscode.window.showWarningMessage("No workspace folder found.");
      }
    }
  );
  context.subscriptions.push(jumpDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
