function productionSelect(value = '', prompt = '请选择制作方式') {
  const select = document.createElement('select');
  select.style.cssText = 'padding:12px;border-radius:10px;background:#272b33;color:#f1eee8;border:1px solid #555b67;max-width:100%';
  for (const [key, label] of [['', prompt], ['traditional', '传统影视'], ['ai', 'AI 制作']]) {
    select.add(new Option(label, key));
  }
  select.value = value;
  return select;
}
const productionField = document.createElement('label');
productionField.textContent = '制作方式';
const productionInput = productionSelect();
productionInput.id = 'production';
productionField.append(productionInput);
document.querySelector('#works .formgrid').prepend(productionField);
const renderWorks = render;
render = function () {
  renderWorks();
  document.querySelectorAll('#items .delete').forEach(button => {
    const item = data.items.find(work => work.id === button.dataset.id);
    if (!item) return;
    const select = productionSelect(item.production, '未标注');
    select.setAttribute('aria-label', item.title + '的制作方式');
    button.previousElementSibling.append(select);
    select.onchange = async () => {
      const original = item.production;
      select.disabled = true;
      item.production = select.value;
      try {
        await saveJson('Update artwork production type');
        toast('制作方式已发布');
      } catch {
        item.production = original;
        select.value = original || '';
        alert('保存失败，请刷新列表后重试。');
      } finally {
        select.disabled = false;
      }
    };
  });
};
