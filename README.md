# API Route Jumper

VSCode 拡張機能：クライアント側の API 呼び出しからサーバーコントローラーファイルへジャンプできるツールです。

## 主な機能

- `apiClient().app.users._userId(userId).shops.post` や `apiClient().app.users._userId(userId).shops, '$get'` などの呼び出しを検出し、該当サーバーファイル（`apps/server/src/routes/.../_handlers.ts`）へジャンプできます。
- TypeScript/TSX/JavaScript ファイルで CodeLens が表示され、クリックでジャンプします。

## 使い方

1. クライアント側の API 呼び出し部分に「Jump to server controller」という CodeLens が表示されます。
2. クリックすると対応するサーバーファイルが新しいタブで開きます。

## 対応パターン例

- ドット記法: `apiClient().app.users._userId(userId).shops.post`
- 文字列メソッド: `apiClient().app.users._userId(userId).shops, '$get'`

## 注意事項

- サーバーファイルが存在しない場合は警告が表示されます。
- ルーティング規則や API 呼び出し記法が変更された場合は、拡張機能のロジックを調整してください。

## 設定でサーバールートを変更する

プロジェクトによってサーバールートのパス（例: apps/server/src/routes/）が異なる場合、VSCode の settings.json で以下のように設定できます。

```json
{
  "apiRouteJumper.serverRouteRoot": "custom/server/routes/"
}
```

デフォルトは `apps/server/src/routes/` です。
