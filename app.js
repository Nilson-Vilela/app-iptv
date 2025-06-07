// app.js atualizado com suporte a HLS (m3u8) e organização visual

function parseM3U(data) {
  const lines = data.split('\n');
  const canais = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF:')) {
      const info = lines[i];
      const url = lines[i + 1];
      const nomeMatch = info.match(/,(.*)$/);
      const logoMatch = info.match(/tvg-logo="(.*?)"/);
      canais.push({
        nome: nomeMatch ? nomeMatch[1] : 'Canal sem nome',
        logo: logoMatch ? logoMatch[1] : '',
        url: url.trim()
      });
    }
  }

  return canais;
}

function exibirCanais(canais) {
  const lista = document.getElementById('listaCanais');
  lista.innerHTML = '';

  canais.forEach(canal => {
    const item = document.createElement('div');
    item.className = 'canal-item';
    item.innerHTML = `
      <img src="${canal.logo}" alt="${canal.nome}" class="canal-logo" title="${canal.nome}" />
    `;
    item.onclick = () => carregarCanal(canal.url);
    lista.appendChild(item);
  });
}

function carregarCanal(url) {
  const video = document.getElementById('player');
  video.muted = true; // Força autoplay

  if (Hls.isSupported()) {
    if (window.hls) {
      window.hls.destroy();
    }
    window.hls = new Hls();
    window.hls.loadSource(url);
    window.hls.attachMedia(video);

    window.hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().then(() => {
        // Somente desmuta após a primeira reprodução com sucesso
        setTimeout(() => {
          video.muted = false;
        }, 1000);
      }).catch(err => {
        console.warn('Autoplay bloqueado: ', err);
      });
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.play().then(() => {
      setTimeout(() => {
        video.muted = false;
      }, 1000);
    }).catch(err => {
      console.warn('Autoplay bloqueado: ', err);
    });
  } else {
    alert('Seu navegador não suporta HLS');
  }
}

fetch('lista.txt')
  .then(response => response.text())
  .then(data => {
    const canais = parseM3U(data);
    exibirCanais(canais);
    if (canais.length > 0) {
      carregarCanal(canais[0].url); // Toca o primeiro canal automaticamente
    }
  })

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('iptv-cache').then(function (cache) {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './app.js',
        './lista.txt'
      ]);
    })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
