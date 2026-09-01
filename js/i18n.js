export const LANG=(navigator.language||'en').toLowerCase().startsWith('zh')?'zh':'en';
export const T={
    en:{ code:'CODE', enter:'ENTER CODE', ok:'OK', retry:'RETRY', exit:'EXIT',
        wrong:'Wrong code. Try again.', used:'Code already used.', plus3:'+3 HINTS',
        verify:'VERIFY', plusV:'VERIFY x3',
        confirm:'Spend 2 hints to reveal all correct blocks?', yes:'YES', no:'NO',
        need2:n=>`Not enough hints. You need 2, you have ${n}.`,
        save:'SAVE CODE', load:'LOAD CODE',
        saveDone:'Copy this code and keep it safe:', loadOk:'Record loaded.', loadBad:'Invalid code.' },
    zh:{ code:'代碼', enter:'輸入代碼', ok:'確定', retry:'重試', exit:'離開',
        wrong:'代碼錯誤，請再試一次。', used:'代碼已使用。', plus3:'+3 提示',
        verify:'驗證', plusV:'驗證 x3',
        confirm:'花費 2 個提示顯示所有正確方塊？', yes:'是', no:'否',
        need2:n=>`提示不足：需要 2 個，你只有 ${n} 個。`,
        save:'儲存碼', load:'讀取碼',
        saveDone:'請複製並妥善保存此代碼：', loadOk:'紀錄已讀取。', loadBad:'代碼無效。' }
};
