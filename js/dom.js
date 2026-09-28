const $=id=>document.getElementById(id);
export const dom={
    hud:$('hud'),hudLevel:$('hud-level'),hudTime:$('hud-time'),hudScore:$('hud-score'),hudHearts:$('hud-hearts'),hudEq:$('hud-eq'),
    hintBtn:$('hud-hint'),hintCount:$('hint-count'),levelPath:$('level-path'),
    hudCalc:$('hud-calc'),calcVal:$('calc-val'),appleCountEl:$('apple-count'),
    screenSelect:$('screen-select'),screenResult:$('screen-result'),
    codeStack:$('code-stack'),codeBtn:$('code-btn'),advStack:$('adv-stack'),advBtn:$('adv-btn'),
    verifyStack:$('verify-stack'),verifyBtn:$('verify-btn'),verifyCount:$('verify-count'),verifyPanel:$('verify-panel'),
    codeModal:$('code-modal'),codeTitle:$('code-title'),codeInput:$('code-input'),codeMsg:$('code-msg'),
    codeOk:$('code-ok'),codeRetry:$('code-retry'),codeExit:$('code-exit'),
    advModal:$('adv-modal'),advMsg:$('adv-msg'),advYes:$('adv-yes'),advNo:$('adv-no'),
    btnNext:$('btn-next'),btnMenu:$('btn-menu'),hudBack:$('hud-back'),
    btnExport:$('btn-export'),btnImport:$('btn-import'),canvas:$('canvas-container'),loading:$('loading'),assistBtn:$('normal-assist-btn'),assistClose:$('normal-assist-close'),hintWrap:$('hint-wrap'),hintTitle:$('normal-hint-title')
};
