const selection = { media: '', production: '' };
function visibleWorks() {
  return state.items.filter(item =>
    (!selection.media || selection.media === (kind(item) === 'image' ? 'image' : 'video')) &&
    (!selection.production || selection.production === item.production));
}
const controls = document.createElement('div');
controls.className = 'archive-controls';
document.querySelector('.heading').after(controls);
for (const [key, label, choices] of [
  ['media', '作品类型', { '': '全部作品', image: '图片', video: '视频' }],
  ['production', '制作方式', { '': '全部制作方式', traditional: '传统影视', ai: 'AI 制作' }]
]) {
  const group = document.createElement('div');
  group.className = 'filters';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', label);
  controls.append(group);
  for (const [value, name] of Object.entries(choices)) {
    const button = document.createElement('button');
    button.textContent = name;
    button.setAttribute('aria-pressed', String(!value));
    button.onclick = () => {
      selection[key] = value;
      group.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      $('empty').querySelector('b').textContent = '这里暂时没有作品';
      $('empty').querySelector('span').textContent = '可以试试其他筛选条件。';
      render();
    };
    group.append(button);
  }
}
document.querySelector('#viewer').addEventListener('close', () => {
  document.querySelector('#viewer-media').replaceChildren();
});
