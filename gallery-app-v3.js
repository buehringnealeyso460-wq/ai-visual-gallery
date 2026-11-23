const state = { items: [] };
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

fetch('gallery.json', { cache: 'no-store' })
  .then(response => response.json())
  .then(gallery => {
    state.items = gallery.items || [];
    applySettings(gallery.settings || {});
    render();
  })
  .catch(() => render());

function applySettings(settings) {
  $('eyebrow').textContent = settings.eyebrow || 'PERSONAL AI GALLERY';
  $('hero-title').innerHTML = escapeHtml(settings.heroTitle || '一些由想象力\n生长出来的画面').replace(/\n/g, '<br>');
  $('intro').textContent = settings.intro || '';
  $('gallery-title').textContent = settings.galleryTitle || '作品收藏';
  if (settings.backgroundImage) {
    document.body.style.backgroundImage = `linear-gradient(#111115dc,#111115ef),url("${String(settings.backgroundImage).replace(/["\\]/g, '')}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundAttachment = 'fixed';
  }
}

function kind(item) {
  if (item.kind) return item.kind;
  return item.type === 'image' ? 'image' : 'short';
}

function imageOrientation(item) {
  if (item.orientation === 'landscape' || item.orientation === 'portrait') return item.orientation;
  if (item.width && item.height) return item.width >= item.height ? 'landscape' : 'portrait';
  return 'portrait';
}

function render() {
  const visible = typeof visibleWorks === 'function' ? visibleWorks() : state.items;
  const images = visible.filter(item => kind(item) === 'image');
  const shortFilms = visible.filter(item => kind(item) === 'short');
  const longFilms = visible.filter(item => kind(item) === 'long');
  $('count').textContent = `${visible.length} 件作品`;
  renderImages(images);
  renderVideos('short', shortFilms);
  renderVideos('long', longFilms);
  $('empty').hidden = visible.length > 0;
}

function renderImages(items) {
  const container = $('image-grid');
  container.closest('.work-group').hidden = items.length === 0;
  container.className = 'image-layout';
  const landscape = items.filter(item => imageOrientation(item) === 'landscape');
  const portrait = items.filter(item => imageOrientation(item) === 'portrait');
  container.innerHTML = [
    orientationSection('横屏作品', 'landscape', landscape),
    orientationSection('竖屏作品', 'portrait', portrait)
  ].join('');
  $('image-count').textContent = `${items.length} 件`;
  bindCards(container);
}

function orientationSection(title, orientation, items) {
  if (!items.length) return '';
  return `<section class="orientation-group"><div class="orientation-heading"><h4>${title}</h4><span>${items.length} 件</span></div><div class="orientation-grid ${orientation}-grid">${items.map(imageCard).join('')}</div></section>`;
}

function imageCard(item, index) {
  const preview = item.thumbnail || item.src;
  const mobilePreview = item.mobileThumbnail || preview;
  const production = ({ ai: 'AI 制作', traditional: '传统影视' })[item.production] || '未标注';
  const loading = index < 4 ? 'eager' : 'lazy';
  const priority = index < 2 ? 'high' : 'low';
  return `<button class="card" data-id="${escapeHtml(item.id)}"><div class="media image-skeleton"><picture><source media="(max-width:720px)" srcset="${escapeHtml(mobilePreview)}"><img src="${escapeHtml(preview)}" alt="${escapeHtml(item.title)}" width="${item.width || ''}" height="${item.height || ''}" loading="${loading}" decoding="async" fetchpriority="${priority}" onload="this.closest('.media').classList.remove('image-skeleton')"></picture></div><div class="caption"><b>${escapeHtml(item.title)}</b><small>${production}</small></div></button>`;
}

function renderVideos(groupName, items) {
  const grid = $(`${groupName}-grid`);
  grid.closest('.work-group').hidden = items.length === 0;
  grid.className = 'grid compact-video-grid';
  grid.innerHTML = items.map(videoCard).join('');
  $(`${groupName}-count`).textContent = `${items.length} 件`;
  bindCards(grid);
}

function videoCard(item) {
  const production = ({ ai: 'AI 制作', traditional: '传统影视' })[item.production] || '未标注';
  const media = item.bvid
    ? `<div class="bili-card"><span class="bili-mark">BILIBILI</span><strong>${escapeHtml(item.title)}</strong></div>`
    : `<video src="${escapeHtml(item.src)}" muted playsinline preload="metadata"></video>`;
  return `<button class="card" data-id="${escapeHtml(item.id)}"><div class="media">${media}<span class="play">播放</span></div><div class="caption"><b>${escapeHtml(item.title)}</b><small>${production}</small></div></button>`;
}

function bindCards(container) {
  container.querySelectorAll('.card').forEach(element => {
    element.onclick = () => view(element.dataset.id);
  });
}

function biliPlayer(item) {
  const params = new URLSearchParams({ isOutside: 'true', bvid: item.bvid, p: String(item.page || 1), autoplay: '0', danmaku: '0', poster: '1', high_quality: '1', as_wide: '1' });
  return `<div class="bili-frame"><iframe src="https://player.bilibili.com/player.html?${params}" scrolling="no" frameborder="0" allow="fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(item.title)}"></iframe></div>`;
}

function view(id) {
  const item = state.items.find(work => work.id === id);
  if (!item) return;
  if (item.bvid) $('viewer-media').innerHTML = biliPlayer(item);
  else if (kind(item) === 'image') $('viewer-media').innerHTML = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.title)}">`;
  else $('viewer-media').innerHTML = `<video src="${escapeHtml(item.src)}" controls playsinline></video>`;
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
