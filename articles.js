export function normalizeArticles(input) {
  if (!Array.isArray(input)) throw new Error('文章数据格式不正确');
  const used = new Set();
  return input.filter(item => {
    if (!item || item.draft === true || typeof item.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id) || used.has(item.id) || typeof item.title !== 'string' || !item.title.trim()) return false;
    if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || Number.isNaN(Date.parse(item.date)) || new Date(item.date).toISOString().slice(0,10) !== item.date) return false;
    if (!Array.isArray(item.content) || !item.content.some(b => b && typeof b.text==='string' && b.text.trim())) return false;
    used.add(item.id); return true;
  }).map(item => ({...item,title:item.title.trim(),summary:typeof item.summary==='string'?item.summary:'',tags:Array.isArray(item.tags)?item.tags.filter(x=>typeof x==='string').slice(0,5):[]})).sort((a,b)=>b.date.localeCompare(a.date));
}
export function articleUrl(id) { return 'article.html?id='+encodeURIComponent(id); }
function node(tag, text, className) {
  const element=document.createElement(tag);
  if(text!==undefined) element.textContent=text;
  if(className) element.className=className;
  return element;
}
function formatDate(date) {return new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(date));}
export function renderBlocks(blocks,container) {
  for(const block of blocks) {
    if(!block) continue;
    if(block.type==='image') {
      // Article pictures are local assets only, never executable or external URLs.
      if(typeof block.src!=='string' || !/^images\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(block.src)) continue;
      const figure=node('figure',undefined,'reading-figure');
      const image=node('img');image.src=block.src;image.alt=typeof block.alt==='string'?block.alt:'';
      image.loading='lazy';image.decoding='async';image.width=1536;image.height=1024;
      figure.append(image);
      if(typeof block.caption==='string' && block.caption.trim()) figure.append(node('figcaption',block.caption));
      container.append(figure);continue;
    }
    if(typeof block.text!=='string') continue;
    if(block.type==='list') {
      const list=node('ul');
      block.text.split('\n').filter(Boolean).forEach(text=>list.append(node('li',text)));
      container.append(list);
    } else {
      const tag={paragraph:'p',heading:'h2',subheading:'h3',quote:'blockquote'}[block.type] || 'p';
      container.append(node(tag,block.text));
    }
  }
}
function showStatus(container,title,description) {
  container.replaceChildren();const box=node('div',undefined,'reading-status');box.append(node('h1',title),node('p',description));container.append(box);
}
async function start() {
  const list=document.getElementById('articles-list');
  const reader=document.getElementById('article-reader');
  if(!list && !reader) return;
  let articles;
  try {
    const response=await fetch(new URL('./articles.json',import.meta.url),{cache:'no-cache'});
    if(!response.ok) throw new Error('load');
    articles=normalizeArticles(await response.json());
  } catch {
    if(reader) showStatus(reader,'暂时无法加载文章','请刷新重试，或返回首页稍后阅读。');
    if(list) {list.replaceChildren(node('p','文章暂时未能加载，请刷新重试。'));}
    return;
  }
  if(list && articles.length) {
    list.replaceChildren();
    articles.forEach(article=>{
      const link=node('a',undefined,'article-list-item');link.href=articleUrl(article.id);
      const date=node('time',formatDate(article.date),'article-list-meta');date.dateTime=article.date;
      const content=node('div');content.append(node('h3',article.title),node('p',article.summary));
      if(article.tags.length){const tags=node('div',undefined,'article-list-tags');article.tags.forEach(t=>tags.append(node('span',t)));content.append(tags);}
      const arrow=node('span','↗','article-list-arrow');arrow.setAttribute('aria-hidden','true');link.append(date,content,arrow);list.append(link);
    });
  }
  if(reader) {
    const id=new URLSearchParams(location.search).get('id');
    const article=articles.find(a=>a.id===id);
    if(!article){showStatus(reader,'这篇文章还没有发布','你可以返回首页，在“我的文章”栏目查看已发布内容。');return;}
    document.title=article.title+' — 郑晓燕';
    document.querySelector('meta[name="description"]').content=article.summary;
    reader.replaceChildren();reader.append(node('p','WORDS & PERSPECTIVES','reading-kicker'),node('h1',article.title));
    const meta=node('div','郑晓燕 · '+formatDate(article.date),'reading-meta');reader.append(meta);
    if(article.summary)reader.append(node('p',article.summary,'reading-summary'));
    const body=node('div',undefined,'reading-body');renderBlocks(article.content,body);reader.append(body);
    const end=node('div',undefined,'reading-end');end.append(node('span','文 / 郑晓燕 · 个人观点与思考'));
    const back=node('a','← 返回文章列表');back.href='index.html#articles';end.append(back);reader.append(end);
  }
}
if(typeof document!=='undefined') start();
