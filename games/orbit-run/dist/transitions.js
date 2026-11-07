// The bridge is presentation only. State changes remain in game.js, with one owner.
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createSceneBridge(){
  const overlay=document.getElementById('surface-loading');
  let busy=false;
  const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    get busy(){return busy;},
    async cover(title,detail){
      busy=true;document.getElementById('surface-loading-text').textContent=title;
      document.getElementById('surface-loading-detail').textContent=detail;
      overlay.hidden=false;overlay.classList.remove('revealing');
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);overlay.classList.add('covered');
      await sleep(reduce()?0:450);
    },
    async reveal(){
      // Let a loaded destination render before uncovering it. Never reveal an empty frame.
      await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
      overlay.classList.add('revealing');await sleep(reduce()?0:650);
      overlay.hidden=true;overlay.classList.remove('covered','revealing');busy=false;
    }
  };
}
