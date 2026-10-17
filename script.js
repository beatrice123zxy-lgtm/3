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
  const shouldPlay = !reduce.matches && !mobile.matches && !document.hidden && !pausedByUser;
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
 syncVideo();
})();
