export function levelConfig(lv){
    const tier=lv<=5?1:lv<=10?2:lv<=15?3:4;
    if(tier===1)return{tier,R:4,B:11,vmin:1,vmax:12,opsRange:[1,1],opsSet:['+','-'],mix:['MAIN','MAIN','MISSING'],par:26};
    if(tier===2)return{tier,R:4,B:14,vmin:1,vmax:15,opsRange:[1,2],opsSet:['+','-','×'],mix:['MAIN','MAIN','MISSING','FIND'],par:38};
    if(tier===3)return{tier,R:4,B:20,vmin:-10,vmax:20,opsRange:[2,3],opsSet:['+','-','×','÷'],mix:['MAIN','MAIN','MAIN','FIND'],par:52};
    return{tier,R:5,B:26,vmin:-12,vmax:20,opsRange:[3,4],opsSet:['+','-','×','÷'],mix:['MAIN','MAIN','MAIN','FIND'],par:72};
}
export const PHRASES=["太棒了！你的智慧令人驚嘆！","真是天才！這關卡難不倒你！",
"完美通關！邏輯思維無懈可擊！","厲害極了！數學界的明日之星！",
"精彩絕倫！觀察力令人佩服！","勢如破竹！沒有謎題能阻擋你！",
"運籌帷幄！策略堪稱完美！","聰明絕頂！一切盡在掌握之中！",
"表現優異！展現了非凡實力！","無與倫比！當之無愧的解謎大師！"];
