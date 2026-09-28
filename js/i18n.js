const saved=(typeof localStorage!=='undefined'&&localStorage.mcLang)||'';
export const LANG=saved||((navigator.language||'en').toLowerCase().startsWith('zh')?'zh':'en');
export const T={
 en:{ correct:'Correct', code:'CODE', enter:'ENTER CODE', ok:'OK', retry:'RETRY', exit:'EXIT',
        wrong:'Wrong code. Try again.', used:'Code already used.', plus3:'+3 HINTS', verify:'VERIFY', plusV:'VERIFY x3',
        confirm:'Spend 2 hints to reveal all correct blocks?', yes:'YES', no:'NO',
        need2:n=>`Not enough hints. You need 2, you have ${n}.`, save:'SAVE CODE', load:'LOAD CODE',
        saveDone:'Copy this code and keep it safe:', loadOk:'Record loaded.', loadBad:'Invalid code.',
        level:'LEVEL', seconds:'s', hint:'HINT', hintX2:'HINT x2', home:'HOME', assist:'HELP', closeAssist:'BACK', levels:'LEVELS', next:'NEXT',
        points:'POINTS', calculator:'CALCULATOR', goldenApples:'GOLDEN APPLES', gameTitle:'MATH CUBE', gameSub:'Observe the cube. Solve the equation.',
        levelCleared:'LEVEL CLEARED!', levelFailed:'LEVEL FAILED', failedStats:'Three incorrect attempts.<br>Use 1 point to restart this level.',
        restartLevel:'RESTART LEVEL', score:'SCORE', time:'TIME', perfect:'Perfect', noHint:'No hint', newRecord:'NEW RECORD' },
 zh:{ correct:'正確', code:'代碼', enter:'輸入代碼', ok:'確定', retry:'重試', exit:'離開',
        wrong:'代碼錯誤，請再試一次。', used:'代碼已使用。', plus3:'+3 提示', verify:'驗證', plusV:'驗證 ×3',
        confirm:'花費 2 個提示顯示所有正確方塊？', yes:'是', no:'否',
        need2:n=>`提示不足：需要 2 個，你只有 ${n} 個。`, save:'儲存碼', load:'讀取碼',
        saveDone:'請複製並妥善保存此代碼：', loadOk:'紀錄已讀取。', loadBad:'代碼無效。',
        level:'第', levelSuffix:'關', seconds:'秒', hint:'提示', hintX2:'提示 ×2', home:'首頁', assist:'輔助', closeAssist:'返回', levels:'關卡', next:'下一關',
        points:'點數', calculator:'計算機', goldenApples:'金蘋果', gameTitle:'數學魔方', gameSub:'觀察魔方，解開算式。',
        levelCleared:'關卡完成！', levelFailed:'關卡失敗', failedStats:'你已錯誤三次。<br>使用 1 點數重新開始此關。',
        restartLevel:'重新開始此關', score:'分數', time:'時間', perfect:'完美', noHint:'沒有使用提示', newRecord:'新紀錄' },
 ja:{ points:'ポイント', correct:'正解', code:'コード', enter:'コードを入力', ok:'確認', retry:'再試行', exit:'終了', wrong:'コードが違います。もう一度試してください。', used:'コードは使用済みです。', plus3:'+3 ヒント', verify:'確認', plusV:'確認 ×3', confirm:'ヒントを2個使って正しいブロックを表示しますか？', yes:'はい', no:'いいえ', need2:n=>`ヒントが足りません。必要数は2個、残りは${n}個です。`, save:'コードを保存', load:'コードを読み込む', saveDone:'このコードをコピーして保管してください：', loadOk:'記録を読み込みました。', loadBad:'コードが無効です。', level:'レベル', levelSuffix:'', seconds:'秒', hint:'ヒント', hintX2:'ヒント ×2', home:'ホーム', assist:'ヘルプ', closeAssist:'戻る', levels:'レベル一覧', next:'次へ', points:'點數', calculator:'計算機', goldenApples:'ゴールデンアップル', gameTitle:'数学キューブ', gameSub:'キューブを見て、式を解こう。', levelCleared:'レベルクリア！', levelFailed:'レベル失敗', failedStats:'3回間違えました。<br>1ポイントでこのレベルを再開できます。', restartLevel:'レベルを再開', score:'スコア', time:'時間', perfect:'パーフェクト', noHint:'ヒントなし', newRecord:'新記録' },
 ko:{ correct:'정답', code:'코드', enter:'코드 입력', ok:'확인', retry:'다시 시도', exit:'나가기', wrong:'코드가 잘못되었습니다. 다시 시도하세요.', used:'이미 사용한 코드입니다.', plus3:'+3 힌트', verify:'확인', plusV:'확인 ×3', confirm:'힌트 2개를 사용하여 정답 블록을 모두 표시할까요?', yes:'예', no:'아니요', need2:n=>`힌트가 부족합니다. 2개가 필요하며 현재 ${n}개가 있습니다.`, save:'코드 저장', load:'코드 불러오기', saveDone:'이 코드를 복사하여 안전하게 보관하세요:', loadOk:'기록을 불러왔습니다.', loadBad:'코드가 올바르지 않습니다.', level:'레벨', levelSuffix:'', seconds:'초', hint:'힌트', hintX2:'힌트 ×2', home:'홈', assist:'도움말', closeAssist:'뒤로', levels:'레벨 선택', next:'다음', points:'포인트', calculator:'계산기', goldenApples:'황금 사과', gameTitle:'수학 큐브', gameSub:'큐브를 보고 수식을 풀어보세요.', levelCleared:'레벨 완료!', levelFailed:'레벨 실패', failedStats:'세 번 틀렸습니다.<br>1포인트로 이 레벨을 다시 시작할 수 있습니다.', restartLevel:'레벨 다시 시작', score:'점수', time:'시간', perfect:'완벽', noHint:'힌트 없음', newRecord:'신기록' }
};
export function getLang(){const l=(typeof localStorage!=='undefined'&&localStorage.mcLang)||LANG;return l.startsWith('zh')?'zh':l;}
export function normalText(key,...args){const l=getLang();const t=T[l]||T.en;const v=t[key]??T.en[key]??key;return typeof v==='function'?v(...args):v;}
