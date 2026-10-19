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

function cleanAssistantAnswer(text) {
  if (typeof text !== 'string') return '';
  let value = text;
  // 只清理模型专用的思考区块；普通回答仍用 textContent 安全显示。
  value = value.replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>/gi, '');
  const strayClose = /<\/think\s*>/gi;
  let match, lastEnd = -1;
  while ((match = strayClose.exec(value))) lastEnd = strayClose.lastIndex;
  if (lastEnd >= 0) value = value.slice(lastEnd);
  value = value.replace(/<think\b[^>]*>[\s\S]*$/gi, '');
  value = value.replace(/<!--\s*dify-deepseek-reasoning\s*-->[\s\S]*?<!--\s*\/dify-deepseek-reasoning\s*-->/gi, '');
  value = value.replace(/<!--\s*dify-deepseek-reasoning\s*-->[\s\S]*$/gi, '');
  return value.trim();
}

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

// 自有聊天界面。仅通过后端代理访问 AI；网页中不保存任何 API 密钥。
(() => {
  const panel = document.getElementById('xy-chat');
  const launcher = document.getElementById('xy-launcher');
  const input = document.getElementById('xy-input');
  const messages = document.getElementById('xy-messages');
  const sendButton = document.getElementById('xy-send');
  const endpoint = document.querySelector('meta[name="xiaoyan-chat-endpoint"]')?.content.trim() || '';
  const isDemo = !endpoint;
  const insecurePage = !isDemo && !globalThis.isSecureContext;
  function createVisitorId() {
    if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
    // getRandomValues 在部分不支持 randomUUID 的浏览器中仍然可用。
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto?.getRandomValues === 'function') globalThis.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    // 仅作为匿名会话标识使用，不承担登录或授权功能。
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  let conversationId = '';
  let userId = createVisitorId();
  let busy = false;
  let controller = null;
  let generation = 0;
  let returnFocus = launcher;
  if (!isDemo) {
    document.getElementById('xy-mode').textContent = 'AI 助手 · 由晓燕设定回答规则';
    document.getElementById('xy-demo-notice').textContent = insecurePage
      ? '当前页面未使用 HTTPS。窗口可以打开，网站完成 HTTPS 配置后才能连接 AI。'
      : '对话将发送至 AI 服务处理，请勿输入密码等敏感信息。';
  }
  function addMessage(role, text, error = false) {
    const article = document.createElement('div');
    article.className = 'xy-message' + (role === 'user' ? ' xy-message-user' : '') + (error ? ' xy-message-error' : '');
    const label = document.createElement('span');
    label.className = 'xy-message-label';
    label.textContent = role === 'user' ? '你' : isDemo ? '晓燕的小助手 · 示例回复' : '晓燕的 AI 小助手';
    const body = document.createElement('p');
    body.textContent = text;
    article.append(label, body);
    messages.append(article);
    messages.scrollTop = messages.scrollHeight;
    return article;
  }
  function welcome() {
    messages.replaceChildren();
    addMessage('assistant', '嘿嘿，欢迎来到晓燕的世界！🌿\n我是她的 AI 小助手，可以介绍她的经历、项目和联系方式。你想先了解什么？');
  }
  function setOpen(open) {
    if (open) returnFocus = document.activeElement;
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? '收起晓燕的 AI 小助手' : '打开晓燕的 AI 小助手');
    if (open && matchMedia('(min-width:601px)').matches) input.focus({preventScroll:true});
    if (!open && returnFocus instanceof HTMLElement) returnFocus.focus({preventScroll:true});
  }
  function setBusy(value) {
    busy = value;
    sendButton.disabled = value;
    panel.querySelectorAll('[data-xy-question]').forEach(button => button.disabled = value);
    messages.setAttribute('aria-busy', String(value));
  }
  function demoAnswer(question) {
    if (/联系|邮箱|合作|邮件/.test(question)) return '想联系晓燕，可以发送邮件到 postmaster@zxyagent.com，说明你的想法或合作需求。具体安排由她本人确认哦。';
    if (/公司|学历|学校|地址|住哪|客户|报价|工资/.test(question)) return '这部分资料暂时还没有补充，我可不能偷偷编出来嘛。你可以发邮件到 postmaster@zxyagent.com，向晓燕本人了解。';
    if (/项目|作品/.test(question)) return '晓燕做过货运信息管理与系统集成、智能收件箱和询价助手，分别处理物流追踪、业务邮件分派和报价草稿生成。你可以在“项目经历”里看看，嘿嘿。';
    if (/介绍|经验|经历|晓燕|是谁/.test(question)) return '郑晓燕有 3 年 AI 产品经理经验，曾在华为担任 AI 产品经理助理，在深圳市易仓科技担任 AI 产品经理，关注 AI 与业务自动化。嘿嘿，欢迎来到她的世界！';
    return '嘿嘿，现在是界面演示，我还没有连接 AI，暂时只能展示几条预设回答。你可以试试“介绍一下郑晓燕”或“怎么联系她”。';
  }
  async function send(question, appendUser = true) {
    const text = question.trim();
    if (!text || busy) return;
    if (insecurePage) {addMessage('assistant', '当前页面通过 HTTP 打开，暂不发送对话。请先完成网站的 HTTPS 配置，再使用聊天。', true); return;}
    if (text.length > 1000) return;
    const run = generation;
    if (appendUser) addMessage('user', text);
    input.value = ''; input.style.height = '';
    setBusy(true);
    const pending = addMessage('assistant', isDemo ? '正在展示示例回复…' : '正在想想怎么回答你…');
    try {
      let answer;
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 350));
        answer = demoAnswer(text);
      } else {
        controller = new AbortController();
        const requestController = controller;
        const timeout = setTimeout(() => requestController.abort(), 65000);
        try {
          const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text,conversationId,userId}),signal:requestController.signal});
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || '助手暂时没有连接成功，请稍后再试。');
          if (typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('助手没有返回回答，请稍后重试。');
          if (run !== generation) return;
          answer = cleanAssistantAnswer(data.answer);
          if (!answer) throw new Error('这次没有收到完整的正式回答，请稍后重试。');
          if (typeof data.conversationId === 'string') conversationId = data.conversationId;
        } finally { clearTimeout(timeout); }
      }
      if (run !== generation) return;
      pending.remove();
      addMessage('assistant', answer);
    } catch (error) {
      if (run !== generation) return;
      pending.remove();
      const line = addMessage('assistant', error.name === 'AbortError' ? '这次等待有点久，请稍后重试，也可以直接给晓燕发邮件。' : error.message, true);
      const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = '重新发送';
      retry.addEventListener('click', () => { if (!busy) {line.remove(); send(text, false);} });
      line.append(retry);
    } finally {if (run === generation) { controller = null; setBusy(false); }}
  }
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  document.getElementById('xy-close').addEventListener('click', () => setOpen(false));
  document.getElementById('xy-reset').addEventListener('click', () => {
    generation++; controller?.abort(); controller = null; conversationId = ''; userId = createVisitorId();
    setBusy(false); welcome();
  });
  document.getElementById('xy-form').addEventListener('submit', event => {event.preventDefault();send(input.value);});
  input.addEventListener('keydown', event => {if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault();send(input.value);}});
  input.addEventListener('input', () => {input.style.height = ''; input.style.height = Math.min(input.scrollHeight,90)+'px';});
  document.querySelectorAll('[data-xy-question]').forEach(button => button.addEventListener('click', () => send(button.dataset.xyQuestion)));
  panel.addEventListener('keydown', event => {if(event.key === 'Escape') setOpen(false);});
  welcome();
})();
