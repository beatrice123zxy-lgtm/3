// 每次重新打开页面先展示欢迎页；站内跳转不会重新出现。
(() => {
  const screen = document.getElementById('entry-screen');
  const content = document.getElementById('site-content');
  const video = document.getElementById('entry-video');
  const enter = document.getElementById('entry-enter');
  const motion = document.getElementById('entry-motion');
  if (!screen || !content || !video || !enter || !motion) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let pausedByUser = false;
  document.body.classList.add('entry-active');
  function syncEntryVideo() {
    const shouldPause = screen.hidden || document.hidden || reduce.matches || pausedByUser;
    screen.classList.toggle('is-motion-paused', shouldPause);
    if (shouldPause) video.pause();
    else { const playing=video.play(); if(playing) playing.catch(()=>{}); }
    motion.setAttribute('aria-pressed',String(pausedByUser));
    motion.textContent=pausedByUser?'播放光影 ▷':'暂停光影 Ⅱ';
  }
  enter.addEventListener('click', () => {
    screen.hidden = true;
    content.hidden = false;
    content.removeAttribute('inert');
    document.body.classList.remove('entry-active');
    syncEntryVideo();
    window.dispatchEvent(new Event('site-entered'));
    const hash = window.location.hash;
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if(target) target.scrollIntoView({behavior:'instant',block:'start'});
    else window.scrollTo({top:0,behavior:'instant'});
    const heading=(target || content).querySelector('h1,h2');
    if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
  });
  motion.addEventListener('click', () => {pausedByUser=!pausedByUser;syncEntryVideo();});
  document.addEventListener('visibilitychange',syncEntryVideo);
  reduce.addEventListener('change',syncEntryVideo);
  syncEntryVideo();
  try {
    const previous = document.referrer ? new URL(document.referrer) : null;
    if (previous && previous.origin === location.origin && previous.pathname.endsWith('/article.html') && location.hash === '#articles') enter.click();
  } catch {}
})();

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");
const currentYear = document.querySelector("#current-year");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "打开导航菜单" : "关闭导航菜单");
    siteNav.classList.toggle("is-open", !isExpanded);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement && window.matchMedia("(max-width: 600px)").matches) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "打开导航菜单");
      siteNav.classList.remove("is-open");
    }
  });
}

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

// 背景仅在桌面、允许动态效果且当前页面可见时播放。
(() => {
 const video = document.querySelector('.lume-hero__video');
 const toggle = document.querySelector('.lume-video-toggle');
 if (!video || !toggle) return;
 const reduce = matchMedia('(prefers-reduced-motion: reduce)');
 const mobile = matchMedia('(max-width: 820px)');
 let pausedByUser = false;
 function syncVideo() {
  const shouldPlay = !reduce.matches && !mobile.matches && !document.hidden && !document.getElementById('site-content')?.hidden && !pausedByUser;
  if (shouldPlay) { const play = video.play(); if(play) play.catch(() => {}); }
  else video.pause();
  toggle.textContent = pausedByUser ? '播放视频' : '暂停视频';
  toggle.setAttribute('aria-pressed', String(pausedByUser));
 }
 video.addEventListener('playing', () => video.classList.add('lume-is-ready'));
 toggle.addEventListener('click', () => { pausedByUser = !pausedByUser; syncVideo(); });
 reduce.addEventListener('change', syncVideo);
 mobile.addEventListener('change', syncVideo);
 document.addEventListener('visibilitychange', syncVideo);
 window.addEventListener('site-entered', syncVideo);
 syncVideo();
})();
