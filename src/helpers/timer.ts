export default function timer(val: number, dec?: boolean, suff?: boolean, html?: boolean): string {
  if ( isNaN(val) ) return ( dec ) ? "0.00" : "0";

  let v = ~~(val / 10);
  let ms = v % 100; v = ~~(v / 100);
  let s = v % 60;   v = ~~(v / 60);
  let m = v % 60;   v = ~~(v / 60);
  let h = v % 60;   v = ~~(v / 60);
  let p1 = [h, m].filter(e => e != 0);
  
  p1.push(s);

  let sf = [ 's', 'm', 'h' ][ p1.length - 1 ];

  let newP1 = p1.map((e, p) => {
    if ( p > 0 )
      return ['', '<span class="digit">'][~~html] + ("00" + e).substr(-2, 2) + ['', '</span>'][~~html];
    return ['', '<span class="digit">'][~~html] + e + ['', '</span>'][~~html];
  }).join(":");

  let time = (( dec || (suff && sf === 's') )
    ? newP1 + `.${['', '<span class="digit">'][~~html] + ('00' + ms).substr(-2, 2) + ['', '</span>'][~~html]}`
    : newP1);

  return time + ((suff) ? sf : '');
}