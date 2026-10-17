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

// 用户可随时暂停背景；离开当前标签页时也暂停，减少无效动画。
const meadow = document.querySelector('.meadow-hero');
const motionToggle = document.querySelector('.motion-toggle');
let motionPaused = false;
function updateMeadowMotion() {
  if (meadow) meadow.classList.toggle('is-paused', motionPaused || document.hidden);
}
if (meadow && motionToggle) {
  motionToggle.addEventListener('click', () => {
    motionPaused = !motionPaused;
    motionToggle.setAttribute('aria-pressed', String(motionPaused));
    motionToggle.textContent = motionPaused ? '播放背景动效' : '暂停背景动效';
    updateMeadowMotion();
  });
  document.addEventListener('visibilitychange', updateMeadowMotion);
  updateMeadowMotion();
}
