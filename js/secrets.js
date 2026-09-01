export const SECRET_BIN='01110010 01100101 01110011 01110000 01100101 01100011 01110100';
export const SECRET2_BIN='01101000 01110101 01101101 01100010 01101100 01100101';
export const fromBin=s=>s.split(' ').map(b=>String.fromCharCode(parseInt(b,2))).join('');
