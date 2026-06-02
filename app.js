AFRAME.registerComponent('gestor-navegacion', {
  init() {
    const target = document.querySelector('#origin-target');
    const hint = document.createElement('div');
    hint.id = 'scan-diagnostic';
    hint.textContent = 'Escanee el marcador';
    hint.style.position = 'fixed';
    hint.style.top = '12px';
    hint.style.left = '12px';
    hint.style.zIndex = '9999';
    hint.style.padding = '8px 10px';
    hint.style.borderRadius = '10px';
    hint.style.background = 'rgba(0,0,0,0.65)';
    hint.style.color = '#fff';
    hint.style.fontFamily = 'sans-serif';
    hint.style.fontSize = '14px';
    hint.style.pointerEvents = 'none';
    document.body.appendChild(hint);

    if (!target) {
      hint.textContent = 'Marcador no configurado';
      return;
    }

    target.addEventListener('targetFound', () => {
      hint.textContent = 'Marcador detectado';
    });

    target.addEventListener('targetLost', () => {
      hint.textContent = 'Marcador no detectado';
    });
  }
});
