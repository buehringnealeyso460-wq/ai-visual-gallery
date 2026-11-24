const galleryState = {
  items: [],
  filtered: [],
  index: 0,
  view: 'slider',
  mediaFilter: 'all',
  productionFilter: 'all',
  switching: false
};

const element = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

fetch('gallery.json', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error('作品数据读取失败');
    return response.json();
  })
  .then(gallery => {
    galleryState.items = gallery.items || [];
    applySettings(gallery.settings || {});
    applyFilters();
    if (location.hash === '#archive') setView('list');
  })
  .catch(showEmpty);

function applySettings(settings) {
  const brand = settings.brandName || '黄华修的作品馆';
  document.title = brand;
  element('brand-name').textContent = brand;
  element('about-title').textContent = brand;
  element('creative-label').textContent = settings.creativeLabel || settings.eyebrow || 'AI VISUAL ARTIST / FILMMAKER';
  element('archive-title').textContent = settings.galleryTitle || '作品展示';
  element('archive-statement').textContent = settings.heroTitle || '';
  element('archive-description').textContent = settings.intro || '';
  element('about-description').textContent = settings.intro || '';
  if (settings.backgroundImage) {
    const safeBackground = String(settings.backgroundImage).replace(/["\\]/g, '');
    document.body.style.backgroundImage = `linear-gradient(#11110fe8,#11110ff2),url("${safeBackground}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
  }
}

function workKind(item) {
  if (item.kind) return item.kind;
  return item.type === 'image' ? 'image' : 'short';
}

function isImage(item) {
  return workKind(item) === 'image';
}

function orientation(item) {
  if (!isImage(item)) return 'landscape';
  if (item.orientation) return item.orientation;
  return Number(item.width) >= Number(item.height) ? 'landscape' : 'portrait';
}

function productionLabel(item) {
  return item.production === 'traditional' ? 'TRADITIONAL FILM' : 'AI CREATION';
}

function typeLabel(item) {
  if (isImage(item)) return orientation(item) === 'portrait' ? 'IMAGE / PORTRAIT' : 'IMAGE / LANDSCAPE';
  return workKind(item) === 'long' ? 'LONG FILM / BILIBILI' : 'SHORT FILM / BILIBILI';
}

function splitTitle(title) {
  const clean = String(title || '未命名作品').replace(/[《》]/g, '').trim();
  const punctuation = clean.search(/[，,：:—–]/);
  if (punctuation > 1 && punctuation < clean.length - 2) {
    return [clean.slice(0, punctuation), clean.slice(punctuation + 1)];
  }
  const separator = clean.indexOf('-');
  if (separator > 1 && separator < clean.length - 2) {
    return [clean.slice(0, separator), clean.slice(separator + 1)];
  }
  const characters = Array.from(clean);
  if (characters.length <= 5) return [clean, ''];
  const midpoint = Math.ceil(characters.length / 2);
  return [characters.slice(0, midpoint).join(''), characters.slice(midpoint).join('')];
}

function previewMarkup(item, eager = false) {
  if (!item) return '';
  if (isImage(item)) {
    const preview = item.thumbnail || item.src;
    const mobile = item.mobileThumbnail || preview;
    const loading = eager ? 'fetchpriority="high"' : 'loading="lazy"';
    return `<picture><source media="(max-width:720px)" srcset="${escapeHtml(mobile)}"><img src="${escapeHtml(preview)}" alt="${escapeHtml(item.title)}" ${loading} decoding="async"></picture>`;
  }
  return `<span class="video-poster"><small>BILIBILI / ${workKind(item).toUpperCase()}</small><strong>${escapeHtml(item.title)}</strong></span>`;
}

function applyFilters() {
  galleryState.filtered = galleryState.items.filter(item => {
    const media = isImage(item) ? 'image' : 'video';
    const mediaMatches = galleryState.mediaFilter === 'all' || galleryState.mediaFilter === media;
    const productionMatches = galleryState.productionFilter === 'all' || galleryState.productionFilter === item.production;
    return mediaMatches && productionMatches;
  });
  galleryState.index = Math.min(galleryState.index, Math.max(0, galleryState.filtered.length - 1));
  element('empty-state').hidden = galleryState.filtered.length > 0;
  element('slider-view').hidden = galleryState.view !== 'slider' || !galleryState.filtered.length;
  renderFeatured();
  renderArchive();
}

function showEmpty() {
  galleryState.filtered = [];
  element('slider-view').hidden = true;
  element('archive-view').hidden = true;
  element('empty-state').hidden = false;
}

function renderFeatured() {
  if (!galleryState.filtered.length) return;
  const item = galleryState.filtered[galleryState.index];
  const previous = galleryState.filtered[(galleryState.index - 1 + galleryState.filtered.length) % galleryState.filtered.length];
  const next = galleryState.filtered[(galleryState.index + 1) % galleryState.filtered.length];
  const [leftTitle, rightTitle] = splitTitle(item.title);
  element('title-left').textContent = leftTitle;
  element('title-right').textContent = rightTitle;
  element('featured-composition').dataset.longTitle = String(Array.from(item.title || '').length > 12);
  element('featured-category').textContent = `${productionLabel(item)} / ${(item.category || '未分类').toUpperCase()}`;
  element('featured-mode').textContent = typeLabel(item);
  element('featured-media').innerHTML = previewMarkup(item, true);
  element('featured-frame').classList.toggle('is-portrait', orientation(item) === 'portrait');
  element('featured-frame').setAttribute('aria-label', `查看作品详情：${item.title}`);
  element('work-number').textContent = `${String(galleryState.index + 1).padStart(2, '0')}.`;
  element('work-title').textContent = item.title;
  element('work-year').textContent = item.year || '—';
  element('work-progress').textContent = `${String(galleryState.index + 1).padStart(2, '0')} / ${String(galleryState.filtered.length).padStart(2, '0')}`;
  element('peek-previous').innerHTML = peekMarkup(previous, '上一件');
  element('peek-next').innerHTML = peekMarkup(next, '下一件');
}

function peekMarkup(item, label) {
  if (!item) return '';
  if (isImage(item)) {
    const preview = item.mobileThumbnail || item.thumbnail || item.src;
    return `<img src="${escapeHtml(preview)}" alt=""><span class="sr-only">${label}：${escapeHtml(item.title)}</span>`;
  }
  return `<span class="peek-label">${label}<br>${escapeHtml(item.title)}</span>`;
}

function renderArchive() {
  element('archive-list').innerHTML = galleryState.filtered.map((item, index) => `
    <button class="archive-row" type="button" data-index="${index}">
      <span class="archive-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="archive-thumb ${orientation(item) === 'portrait' ? 'is-portrait' : ''}">${previewMarkup(item)}</span>
      <span class="archive-name">${escapeHtml(item.title)}</span>
      <span class="archive-year">${escapeHtml(item.year || '—')}</span>
      <span class="archive-category">${escapeHtml(item.category || typeLabel(item))}</span>
    </button>`).join('');
  element('archive-list').querySelectorAll('.archive-row').forEach(row => {
    row.onclick = () => openViewer(galleryState.filtered[Number(row.dataset.index)]);
  });
}

function move(direction) {
  if (galleryState.switching || galleryState.filtered.length < 2) return;
  galleryState.switching = true;
  const composition = element('featured-composition');
  composition.style.setProperty('--slide-direction', direction > 0 ? '-18px' : '18px');
  composition.classList.add('is-leaving');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => {
    galleryState.index = (galleryState.index + direction + galleryState.filtered.length) % galleryState.filtered.length;
    renderFeatured();
    composition.style.setProperty('--slide-direction', direction > 0 ? '18px' : '-18px');
    requestAnimationFrame(() => composition.classList.remove('is-leaving'));
    setTimeout(() => { galleryState.switching = false; }, reduced ? 0 : 380);
  }, reduced ? 0 : 180);
}

function setView(view) {
  galleryState.view = view;
  element('slider-button').classList.toggle('is-active', view === 'slider');
  element('list-button').classList.toggle('is-active', view === 'list');
  element('slider-view').hidden = view !== 'slider' || !galleryState.filtered.length;
  element('archive-view').hidden = view !== 'list';
  element('about-view').hidden = true;
  document.querySelector('.step-controls').hidden = view !== 'slider';
}

function setFilter(group, value) {
  if (group === 'media') galleryState.mediaFilter = value;
  else galleryState.productionFilter = value;
  const container = element(group === 'media' ? 'media-filters' : 'production-filters');
  container.querySelectorAll('button').forEach(button => {
    button.classList.toggle('is-active', button.dataset.filter === value);
  });
  applyFilters();
}

function biliPlayer(item) {
  const parameters = new URLSearchParams({
    isOutside: 'true', bvid: item.bvid, p: String(item.page || 1), autoplay: '0',
    danmaku: '0', poster: '1', high_quality: '1', as_wide: '1'
  });
  return `<div class="bili-frame"><iframe src="https://player.bilibili.com/player.html?${parameters}" scrolling="no" allow="fullscreen; picture-in-picture" allowfullscreen title="${escapeHtml(item.title)}"></iframe></div>`;
}

function openViewer(item) {
  if (!item) return;
  if (item.bvid) {
    element('viewer-media').innerHTML = biliPlayer(item);
  } else if (isImage(item)) {
    element('viewer-media').innerHTML = `<div class="viewer-image"><img src="${escapeHtml(item.thumbnail || item.src)}" alt="${escapeHtml(item.title)}"><a href="${escapeHtml(item.src)}" target="_blank" rel="noopener">查看高清原图</a></div>`;
  } else {
    element('viewer-media').innerHTML = `<video src="${escapeHtml(item.src)}" controls playsinline></video>`;
  }
  element('viewer-title').textContent = item.title;
  element('viewer-description').textContent = item.description || '';
  element('viewer-category').textContent = item.category || '未分类';
  element('viewer-meta').textContent = `${productionLabel(item)} / ${item.year || '年份未填写'}`;
  element('viewer').showModal();
}

element('featured-frame').onclick = () => openViewer(galleryState.filtered[galleryState.index]);
element('previous-work').onclick = () => move(-1);
element('next-work').onclick = () => move(1);
element('peek-previous').onclick = () => move(-1);
element('peek-next').onclick = () => move(1);
element('slider-button').onclick = () => setView('slider');
element('list-button').onclick = () => setView('list');
element('open-archive').onclick = () => {
  location.hash = 'archive';
  setView('list');
};
element('mobile-archive').onclick = () => {
  location.hash = 'archive';
  setView('list');
};
element('work-link').onclick = () => {
  history.replaceState(null, '', location.pathname + location.search + '#work');
  setView('slider');
};
element('open-about').onclick = () => {
  element('slider-view').hidden = true;
  element('archive-view').hidden = true;
  element('about-view').hidden = false;
  document.querySelector('.step-controls').hidden = true;
};
element('about-back').onclick = () => setView(galleryState.view);
element('media-filters').querySelectorAll('button').forEach(button => {
  button.onclick = () => setFilter('media', button.dataset.filter);
});
element('production-filters').querySelectorAll('button').forEach(button => {
  button.onclick = () => setFilter('production', button.dataset.filter);
});

element('viewer').querySelector('.close').onclick = () => element('viewer').close();
element('viewer').onclick = event => {
  if (event.target === element('viewer')) element('viewer').close();
};
element('viewer').addEventListener('close', () => element('viewer-media').replaceChildren());

document.addEventListener('keydown', event => {
  if (event.target.matches('input,textarea,select,[contenteditable]') || element('viewer').open || galleryState.view !== 'slider') return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    move(-1);
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    move(1);
  }
});

let wheelLock = false;
element('slider-view').addEventListener('wheel', event => {
  if (Math.abs(event.deltaY) < 18 || wheelLock) return;
  event.preventDefault();
  wheelLock = true;
  move(event.deltaY > 0 ? 1 : -1);
  setTimeout(() => { wheelLock = false; }, 650);
}, { passive: false });

let touchStartY = 0;
element('slider-view').addEventListener('touchstart', event => {
  touchStartY = event.touches[0].clientY;
}, { passive: true });
element('slider-view').addEventListener('touchend', event => {
  const distance = touchStartY - event.changedTouches[0].clientY;
  if (Math.abs(distance) > 55) move(distance > 0 ? 1 : -1);
}, { passive: true });
