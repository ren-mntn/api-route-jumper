/**
 * API呼び出しの検出とパス生成ロジック
 * VSCodeに依存しない純粋な関数として実装
 */

// API呼び出し検出用の正規表現（プリコンパイル済み）
// 2つのパターンを統合: 1) 通常メソッド呼び出し, 2) 文字列形式メソッド
const API_CALL_PATTERN = /apiClient\(\)[\s\S]*?(?:\.(?:get|post|put|delete|\$get|\$post|\$put|\$delete)\s*\([^;]*?\)|,\s*['"`]\$(?:get|post|put|delete)['"`])/g;

/**
 * API呼び出しを検出する
 * 正規表現の状態管理を内部化してパフォーマンス向上
 */
export function findApiCalls(text: string): RegExpMatchArray[] {
  // 新しい正規表現インスタンスを作成して状態をクリア
  const regex = new RegExp(API_CALL_PATTERN.source, API_CALL_PATTERN.flags);
  const matches: RegExpMatchArray[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(text)) !== null) {
    matches.push(match);
  }
  
  return matches;
}

// 後方互換性のためのexport（既存テストコード用）
export const API_CALL_REGEX = API_CALL_PATTERN;

/**
 * APIコールからサーバーパスを生成
 */
export function generateServerPath(apiCall: string): string {
  // 改行と空白を除去してからパース
  const cleanApiCall = apiCall.replace(/\s+/g, "");
  
  // 文字列形式のHTTPメソッド（'$get'など）を除去
  const methodPattern = /,['"`]\$(?:get|post|put|delete)['"`]/;
  const callWithoutMethod = cleanApiCall.replace(methodPattern, "");
  
  // HTTPメソッド呼び出し全体を除去（引数含む）
  const callPattern = /\.(?:get|post|put|delete|\$get|\$post|\$put|\$delete)\s*\([^;]*?\)$/;
  const callWithoutHttpMethod = callWithoutMethod.replace(callPattern, "");
  
  const parts = callWithoutHttpMethod.split(".");
  const routeParts = parts
    .slice(1) // "apiClient()"を除去
    .map((part) => part.replace(/\(.*\)/, "")) // パラメータを除去
    .map((part) => {
      // パラメータ名（_で始まる）はそのまま、それ以外の_は-に変換
      if (part.startsWith('_')) {
        return part;
      }
      return part.replace(/_/g, "-");
    });
  
  return routeParts.join('/');
}