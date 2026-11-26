export function installImageViewer(labels) {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-viewer';
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'image-viewer-close'; close.textContent = '×';
  const photo = document.createElement('img');
  dialog.append(close, photo); document.body.append(dialog);
  let trigger;
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-zoom-image]');
    if (!button) return;
    const source = button.querySelector('img');
    if (!source?.naturalWidth) return;
    trigger = button;
    close.setAttribute('aria-label', labels().closeImage);
    dialog.setAttribute('aria-label', labels().zoomImage);
    photo.src = source.src; photo.alt = source.alt;
    dialog.showModal();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { photo.removeAttribute('src'); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
}

export function installCodeCopy() {
  const timers = new WeakMap();
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-code]');
    if (!button || button.disabled) return;
    const block = button.closest('.code-block');
    const code = block?.querySelector('pre code');
    if (!code) return;
    const feedback = block.querySelector('.code-feedback');
    const setLabel = (ko, en) => {
      button.querySelector('.copy-label-ko').textContent = ko;
      button.querySelector('.copy-label-en').textContent = en;
    };
    clearTimeout(timers.get(button));
    button.disabled = true;
    if (feedback) { feedback.textContent = ''; feedback.classList.add('sr-only'); }
    try {
      await navigator.clipboard.writeText(code.textContent);
      if (!button.isConnected) return;
      button.dataset.copyState = 'copied';
      setLabel('복사됨', 'Copied');
      if (feedback) feedback.textContent = document.documentElement.lang.startsWith('en') ? 'Code copied.' : '코드를 복사했습니다.';
    } catch {
      if (!button.isConnected) return;
      button.dataset.copyState = 'error';
      setLabel('다시 시도', 'Retry');
      if (feedback) {
        feedback.classList.remove('sr-only');
        feedback.textContent = document.documentElement.lang.startsWith('en') ? 'Could not copy. Select the code and copy it manually.' : '복사하지 못했습니다. 코드를 선택해 직접 복사해 주세요.';
      }
    } finally {
      button.disabled = false;
      if (button.isConnected) timers.set(button, setTimeout(() => {
        delete button.dataset.copyState;
        setLabel('복사', 'Copy');
      }, 2400));
    }
  });
}
