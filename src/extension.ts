import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
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
    private apiCallRegex =
      /apiClient\(\)\.([a-zA-Z0-9_]+(?:\.(?:[a-zA-Z0-9_]+(?:\([^)]*\))?))+)[.,]\s*['\"]?(get|post|put|delete|\$get|\$post|\$put|\$delete)['\"]?\b/g;

    provideCodeLenses(
      document: vscode.TextDocument,
      token: vscode.CancellationToken
    ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
      const codeLenses: vscode.CodeLens[] = [];
      const text = document.getText();
      for (const match of text.matchAll(this.apiCallRegex)) {
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

  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", language: "typescript" },
      new ApiCallCodeLensProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", language: "javascript" },
      new ApiCallCodeLensProvider()
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { scheme: "file", language: "typescriptreact" },
      new ApiCallCodeLensProvider()
    )
  );

  const jumpDisposable = vscode.commands.registerCommand(
    "api-route-jumper.jumpToServer",
    (apiCall: string) => {
      const config = vscode.workspace.getConfiguration("apiRouteJumper");
      const serverRouteRoot: string = config.get(
        "serverRouteRoot",
        "apps/server/src/routes/"
      );
      const parts = apiCall.split(".");
      const routeParts = parts
        .slice(1, -1)
        .map((part) => part.replace(/\(.*\)/, ""));
      const serverPath = `${serverRouteRoot.replace(
        /\/$/,
        ""
      )}/${routeParts.join("/")}/_handlers.ts`;
      const wsFolder = vscode.workspace.workspaceFolders?.[0];
      if (wsFolder) {
        const fileUri = vscode.Uri.joinPath(wsFolder.uri, serverPath);
        vscode.workspace.fs.stat(fileUri).then(
          () =>
            vscode.window.showTextDocument(fileUri, {
              preview: false,
              viewColumn: vscode.ViewColumn.Active,
            }),
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
