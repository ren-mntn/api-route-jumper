import * as assert from 'assert';
import { API_CALL_REGEX, generateServerPath } from '../api-parser';

/**
 * extension.tsの実際のロジックをテストする
 * regexとパス生成ロジックの同期を保証
 */

// テストケース
const testCases = [
  {
    name: '単一行APIコール (基本)',
    code: `apiClient().app.users._userId(userId).shops.post()`,
    shouldMatch: true,
    description: '既存の単一行パターン'
  },
  {
    name: '単一行APIコール ($get)',
    code: "apiClient().app.users._userId(userId).shops, '$get'",
    shouldMatch: true,
    description: '文字列形式のHTTPメソッド'
  },
  {
    name: '複数行APIコール (問題ケース)',
    code: `apiClient()
  .app.users._userId(userId)
  .coupons._couponId(String(couponId))
  .use.post()`,
    shouldMatch: true,
    description: '改行を含むAPIコール'
  },
  {
    name: '複数行APIコール (returnあり)',
    code: `return await apiClient()
    .app.users._userId(userId)
    .shops.get()`,
    shouldMatch: true,
    description: 'return文と改行を含むAPIコール'
  },
  {
    name: 'useMutation 基本パターン',
    code: `const { mutateAsync: functionName } = useMutation(async () => {
  return await apiClient().app.users._userId(userId).shops.post();
});`,
    shouldMatch: true,
    description: 'useMutation内の基本APIコール'
  },
  {
    name: 'useMutation 複数行パターン（引数あり）',
    code: `const { mutateAsync: functionName } = useMutation(
  async ({ param1, param2 }: { param1: string; param2: number }) => {
    return await apiClient().app.users._userId(userId).shops.post({
      body: { param1, param2 }
    });
  }
);`,
    shouldMatch: true,
    description: 'useMutation内の複数行APIコール（引数付き）'
  },
  {
    name: 'deleteSurvey パターン (単一行)',
    code: `const { mutateAsync: deleteSurvey } = useMutation({
  mutationFn: async (surveyId: string) => {
    return await apiClient().admin.surveys._surveyId(surveyId).delete();
  }
});`,
    shouldMatch: true,
    description: '実際のコード - deleteSurvey'
  },
  {
    name: 'deletePushNotification パターン (複数行)',
    code: `const { mutateAsync: deletePushNotification } = useMutation({
  mutationFn: async (pushNotificationId: string) => {
    return await apiClient()
      .admin.push_notifications._pushNotificationId(pushNotificationId)
      .delete();
  }
});`,
    shouldMatch: true,
    description: '実際のコード - deletePushNotification'
  },
  {
    name: 'useAspidaQuery 基本パターン',
    code: `const { data: dataName } = useAspidaQuery(
  apiClient().app.users._userId(userId).shops,
  '$get',
  {
    query: { limit: 10 },
    enabled: true
  }
);`,
    shouldMatch: true,
    description: 'useAspidaQuery内のAPIコール（文字列メソッド）'
  },
  {
    name: '非APIコール',
    code: 'someOtherFunction().call()',
    shouldMatch: false,
    description: 'apiClient以外の関数呼び出し'
  }
];

// パス生成テストケース
const pathTestCases = [
  {
    apiCall: 'apiClient().app.users._userId(userId).shops.post()',
    expected: 'app/users/_userId/shops',
    description: '基本的なパス生成'
  },
  {
    apiCall: 'apiClient().admin.push_notifications.send.post()',
    expected: 'admin/push-notifications/send',
    description: 'アンダースコアをハイフンに変換'
  },
  {
    apiCall: 'apiClient().admin.push_notifications._pushNotificationId(id).delete()',
    expected: 'admin/push-notifications/_pushNotificationId',
    description: 'deleteメソッドのパス生成'
  },
  {
    apiCall: 'apiClient().admin.surveys._surveyId(surveyId).delete()',
    expected: 'admin/surveys/_surveyId',
    description: 'パラメータ名保持'
  }
];

/**
 * 正規表現のテストを実行
 */
function testRegexDetection() {
  console.log('=== API Call Detection Tests ===');
  
  let passCount = 0;
  let totalCount = testCases.length;
  
  testCases.forEach((testCase, index) => {
    // regexをリセット（グローバルregexの状態クリア）
    API_CALL_REGEX.lastIndex = 0;
    const matches = testCase.code.match(API_CALL_REGEX);
    const didMatch = matches !== null && matches.length > 0;
    
    const status = didMatch === testCase.shouldMatch ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} Case ${index + 1}: ${testCase.name}`);
    
    if (didMatch === testCase.shouldMatch) {
      passCount++;
    } else {
      console.log(`  Expected: ${testCase.shouldMatch ? 'MATCH' : 'NO MATCH'}`);
      console.log(`  Actual: ${didMatch ? 'MATCH' : 'NO MATCH'}`);
      console.log(`  Code: ${testCase.code.replace(/\n/g, '\\n')}`);
      if (matches) {
        console.log(`  Found: ${matches[0]}`);
      }
    }
  });
  
  console.log(`\nResults: ${passCount}/${totalCount} tests passed`);
  return passCount === totalCount;
}

/**
 * パス生成のテストを実行
 */
function testPathGeneration() {
  console.log('\n=== Path Generation Tests ===');
  
  let passCount = 0;
  let totalCount = pathTestCases.length;
  
  pathTestCases.forEach((testCase, index) => {
    const actualPath = generateServerPath(testCase.apiCall);
    
    const status = actualPath === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} Path ${index + 1}: ${testCase.description}`);
    
    if (actualPath === testCase.expected) {
      passCount++;
    } else {
      console.log(`  Expected: ${testCase.expected}`);
      console.log(`  Actual: ${actualPath}`);
    }
  });
  
  console.log(`\nResults: ${passCount}/${totalCount} tests passed`);
  return passCount === totalCount;
}

// テスト実行
if (require.main === module) {
  console.log('API Route Jumper - Extension Tests');
  console.log('Testing actual extension.ts logic\n');
  
  const regexTestsPassed = testRegexDetection();
  const pathTestsPassed = testPathGeneration();
  
  console.log('\n=== Overall Results ===');
  console.log(`Regex Detection: ${regexTestsPassed ? 'PASS' : 'FAIL'}`);
  console.log(`Path Generation: ${pathTestsPassed ? 'PASS' : 'FAIL'}`);
  
  if (regexTestsPassed && pathTestsPassed) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

export { testCases, pathTestCases };