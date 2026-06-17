const revealElements = document.querySelectorAll('.reveal');
const cards = document.querySelectorAll('.project-card');
const surpriseBtn = document.getElementById('surpriseBtn');
const heroShapes = document.querySelectorAll('.shape');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });

revealElements.forEach((el) => revealObserver.observe(el));

cards.forEach((card) => {
  const title = card.dataset.title;
  const description = card.dataset.desc;
  const btn = card.querySelector('.card-toggle');
  const info = document.createElement('div');
  info.className = 'card-extra';
  info.innerHTML = `<p><strong>${title}</strong><br>${description}</p>`;
  info.style.cssText = 'margin-top:18px; color: #5b6b7c; line-height:1.75; display:none;';
  card.appendChild(info);

  btn.addEventListener('click', () => {
    const isOpen = info.style.display === 'block';
    info.style.display = isOpen ? 'none' : 'block';
    btn.textContent = isOpen ? 'More' : 'Less';
    card.style.boxShadow = isOpen ? '' : '0 35px 80px rgba(117, 199, 255, 0.16)';
  });
});

surpriseBtn.addEventListener('click', () => {
  const hero = document.querySelector('.hero-panel');
  hero.classList.toggle('surprise');
  const original = hero.querySelector('.status-pill');
  original.textContent = hero.classList.contains('surprise') ? 'Surprise' : 'Live';
});


const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playClickSound() {
  // crisper typing click: short sine + filtered noise burst
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.06, now + 0.003);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    // short bright sine transient
    const sine = audioCtx.createOscillator();
    sine.type = 'sine';
    sine.frequency.setValueAtTime(1400, now);
    const sGain = audioCtx.createGain();
    sGain.gain.setValueAtTime(0.0001, now);
    sine.connect(sGain);
    sGain.connect(master);
    sGain.gain.linearRampToValueAtTime(0.055, now + 0.002);
    sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    // filtered noise for the crunchy high-end
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.04); // 40ms
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const nf = audioCtx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 2600;
    nf.Q.value = 0.8;
    const nGain = audioCtx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    noise.connect(nf);
    nf.connect(nGain);
    nGain.connect(master);
    nGain.gain.linearRampToValueAtTime(0.03, now + 0.002);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    sine.start(now);
    sine.stop(now + 0.06);
    noise.start(now);
    noise.stop(now + 0.06);
  } catch (e) {}
}

function playToggleSound() {
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 540;
    gain.gain.value = 0.14;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.start(now);
    osc.frequency.exponentialRampToValueAtTime(820, now + 0.14);
    osc.stop(now + 0.18);
  } catch (e) {}
}

document.querySelectorAll('.button, .card-toggle').forEach((button) => {
  button.addEventListener('click', playClickSound);
});

window.addEventListener('load', () => {
  document.body.classList.add('loaded');
  // photo subtle zoom-out
  const photoImg = document.querySelector('.profile-photo img');
  if (photoImg) {
    photoImg.style.transform = 'scale(1.04)';
    photoImg.style.transition = 'transform 900ms cubic-bezier(.2,.9,.3,1)';
    setTimeout(() => { photoImg.style.transform = 'scale(1)'; }, 260);
  }

  // content bubble assembly: spin sections as bubbles then assemble into boxes
  const sections = Array.from(document.querySelectorAll('.reveal-section'));
  sections.forEach((sec) => sec.classList.add('bubble-spin'));
  // after 2s spin, morph to boxes with a stagger
  setTimeout(() => {
    sections.forEach((sec, i) => {
      setTimeout(() => {
        sec.classList.remove('bubble-spin');
        sec.classList.add('assembled');
      }, i * 120);
    });
  }, 2000);
});

window.addEventListener('mousemove', (event) => {
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;
  heroShapes.forEach((shape, index) => {
    const moveFactor = 18 + index * 6;
    shape.style.transform = `translate(${(x - 0.5) * moveFactor}px, ${(y - 0.5) * moveFactor}px)`;
  });
});

const navLinks = document.querySelectorAll('nav a');
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    playClickSound();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Theme toggle (light/dark) with persistence
const themeToggle = document.getElementById('themeToggle');
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'dark') themeToggle.classList.add('is-dark'); else themeToggle.classList.remove('is-dark');
}
const savedTheme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    playToggleSound();
    // small animation feedback
    themeToggle.classList.add('pulse');
    setTimeout(() => themeToggle.classList.remove('pulse'), 420);
  });
}
