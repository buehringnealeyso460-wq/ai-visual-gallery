const state = { items: [] };
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

fetch('gallery.json', { cache: 'no-store' })
  .then(response => response.json())
  .then(gallery => {
    state.items = gallery.items || [];
    const settings = gallery.settings || {};
    $('eyebrow').textContent = settings.eyebrow || 'PERSONAL AI GALLERY';
    $('hero-title').innerHTML = escapeHtml(settings.heroTitle || '一些由想象力\n生长出来的画面').replace(/\n/g, '<br>');
    $('intro').textContent = settings.intro || '';
    $('gallery-title').textContent = settings.galleryTitle || '作品收藏';
    if (settings.backgroundImage) {
      document.body.style.backgroundImage = `linear-gradient(#111115dc,#111115ef),url("${String(settings.backgroundImage).replace(/["\\]/g, '')}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundAttachment = 'fixed';
    }
    render();
  })
  .catch(() => render());

function kind(item) {
  if (item.kind) return item.kind;
  return item.type === 'image' ? 'image' : 'short';
}

function render() {
  const visible = typeof visibleWorks === 'function' ? visibleWorks() : state.items;
  const groups = { image: [], short: [], long: [] };
  visible.forEach(item => (groups[kind(item)] || groups.short).push(item));
  $('count').textContent = `${visible.length} 件作品`;
  for (const groupName of Object.keys(groups)) {
    const grid = $(`${groupName}-grid`);
    grid.innerHTML = groups[groupName].map(card).join('');
    $(`${groupName}-count`).textContent = `${groups[groupName].length} 件`;
    grid.querySelectorAll('.card').forEach(element => {
      element.onclick = () => view(element.dataset.id);
    });
  }
  $('empty').hidden = visible.length > 0;
}

function card(item) {
  const itemKind = kind(item);
  let media;
  if (itemKind === 'image') {
    media = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}" loading="lazy">`;
  } else if (item.provider === 'bilibili' || item.bvid) {
    media = `<div class="bili-card"><span class="bili-mark">BILIBILI</span><strong>${escapeHtml(item.title)}</strong></div><span class="play">播放</span>`;
  } else {
    media = `<video src="${escapeHtml(item.src)}" muted playsinline preload="metadata"></video><span class="play">播放</span>`;
  }
  const production = ({ ai: 'AI 制作', traditional: '传统影视' })[item.production] || '未标注';
  return `<button class="card" data-id="${escapeHtml(item.id)}"><div class="media">${media}</div><div class="caption"><b>${escapeHtml(item.title)}</b><small>${production}</small></div></button>`;
}

function biliPlayer(item) {
  const params = new URLSearchParams({
    isOutside: 'true',
    bvid: item.bvid,
    p: String(item.page || 1),
    autoplay: '0',
    danmaku: '0',
    poster: '1',
    high_quality: '1',
    as_wide: '1'
  });
  return `<div class="bili-frame"><iframe src="https://player.bilibili.com/player.html?${params}" scrolling="no" frameborder="0" allow="fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(item.title)}"></iframe></div>`;
}

function view(id) {
  const item = state.items.find(work => work.id === id);
  if (!item) return;
  const itemKind = kind(item);
  if (item.provider === 'bilibili' || item.bvid) {
    $('viewer-media').innerHTML = biliPlayer(item);
  } else if (itemKind === 'image') {
    $('viewer-media').innerHTML = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}">`;
  } else {
    $('viewer-media').innerHTML = `<video src="${escapeHtml(item.src)}" controls playsinline></video>`;
  }
  $('viewer-title').textContent = item.title;
  $('viewer-description').textContent = item.description || '';
  $('viewer-category').textContent = item.category || '未分类';
  $('viewer').showModal();
}

function closeViewer() {
  $('viewer-media').replaceChildren();
  $('viewer').close();
}

$('viewer').querySelector('.close').onclick = closeViewer;
$('viewer').onclick = event => {
  if (event.target === $('viewer')) closeViewer();
};
