// Mobile nav
const hbg = document.getElementById('hbg');
const mobNav = document.getElementById('mob-nav');
hbg.addEventListener('click', () => {
  const isOpen = mobNav.classList.toggle('open');
  hbg.classList.toggle('open', isOpen);
  hbg.setAttribute('aria-expanded', isOpen);
});
function closeNav() {
  mobNav.classList.remove('open');
  hbg.classList.remove('open');
  hbg.setAttribute('aria-expanded', 'false');
}
document.addEventListener('click', e => {
  if (!hbg.contains(e.target) && !mobNav.contains(e.target)) closeNav();
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const hash = link.getAttribute('href');
    if (hash === '#') return;
    const target = document.querySelector(hash);
    if (target) { e.preventDefault(); window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); }
  });
});

// Fade-in on scroll
const scrollObs = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('on');
}), { threshold: 0.1 });
document.querySelectorAll('.fi').forEach(el => scrollObs.observe(el));

// FAQ accordion
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const wasOpen = btn.getAttribute('aria-expanded') === 'true';
  document.querySelectorAll('.faq-q').forEach(q => {
    q.setAttribute('aria-expanded', 'false');
    q.nextElementSibling.classList.remove('open');
  });
  if (!wasOpen) { btn.setAttribute('aria-expanded', 'true'); answer.classList.add('open'); }
}

// Modals close on backdrop or Escape
['privacyModal','a11yModal'].forEach(id => {
  const modal = document.getElementById(id);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['privacyModal','a11yModal'].forEach(id => { const m = document.getElementById(id); if (m) m.style.display = 'none'; });
    if (chatOpen) toggleChat(false);
  }
});

// Contact form
document.getElementById('cform').addEventListener('submit', function(e) {
  e.preventDefault();
  let isValid = true;
  this.querySelectorAll('[required]').forEach(field => {
    const filled = field.value.trim();
    field.style.borderColor = filled ? '' : '#c0392b';
    if (!filled) isValid = false;
  });
  if (!isValid) return;
  const btn = document.getElementById('sbtn');
  btn.disabled = true; btn.textContent = 'Submitting...';
  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(new FormData(this)))
  }).finally(() => {
    document.getElementById('fok').style.display = 'block';
    btn.style.display = 'none';
    this.reset();
  });
});

// Voice TTS
const synth = window.speechSynthesis;
let selectedVoice = null;
function pickVoice() {
  const v = synth.getVoices();
  selectedVoice = v.find(x => x.lang === 'en-US' && /samantha|zira|susan|ava|victoria|allison/i.test(x.name))
    || v.find(x => x.lang.startsWith('en')) || v[0] || null;
}
pickVoice();
if (synth.onvoiceschanged !== undefined) synth.onvoiceschanged = pickVoice;
function speak(text) {
  if (!voiceOn || !synth) return;
  synth.cancel();
  const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/https?:\/\/\S+/g, '').replace(/\n+/g, '. ').trim();
  const utt = new SpeechSynthesisUtterance(clean);
  utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
  if (selectedVoice) utt.voice = selectedVoice;
  synth.speak(utt);
}

// Chatbot
const chatBtn  = document.getElementById('chatBtn');
const chatX    = document.getElementById('chatX');
const chatWin  = document.getElementById('chatWin');
const chatMsgs = document.getElementById('chatMsgs');
const chatInp  = document.getElementById('chatInput');
const qrs      = document.getElementById('qreplies');
const voiceBtn = document.getElementById('voiceBtn');
let chatHistory = [], chatOpen = false, voiceOn = false;

voiceBtn.addEventListener('click', () => {
  voiceOn = !voiceOn;
  voiceBtn.setAttribute('aria-pressed', voiceOn);
  voiceBtn.textContent = voiceOn ? String.fromCodePoint(0x1F50A) : String.fromCodePoint(0x1F507);
  if (!voiceOn) synth.cancel(); else speak('Voice mode is on.');
});

chatBtn.addEventListener('click', () => toggleChat(!chatOpen));
chatX.addEventListener('click', () => toggleChat(false));

function toggleChat(state) {
  chatOpen = state;
  chatWin.classList.toggle('open', chatOpen);
  chatBtn.setAttribute('aria-expanded', chatOpen);
  document.getElementById('chatIcon').textContent = chatOpen ? '✕' : String.fromCodePoint(0x1F4AC);
  document.getElementById('chatBadge').style.display = chatOpen ? 'none' : '';
  if (chatOpen) chatInp.focus(); else synth.cancel();
}

function qReply(text) { chatInp.value = text; sendChat(); qrs.style.display = 'none'; }

function appendMsg(role, text) {
  const wrap = document.createElement('div');
  wrap.className = 'cmsg ' + role;
  const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const av = '<div class="msg-av"><img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=60&q=75" alt="" aria-hidden="true" width="28" height="28"></div>';
  wrap.innerHTML = role === 'bot' ? av + '<div class="bubble">' + html + '</div>' : '<div class="bubble">' + html + '</div>';
  chatMsgs.appendChild(wrap);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'cmsg bot typing'; div.id = 'typing-indicator';
  div.innerHTML = '<div class="msg-av"><img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=60&q=75" alt="" aria-hidden="true" width="28" height="28"></div><div class="bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}
function hideTyping() { document.getElementById('typing-indicator')?.remove(); }

async function sendChat() {
  const text = chatInp.value.trim();
  if (!text) return;
  chatInp.value = ''; chatInp.style.height = ''; qrs.style.display = 'none';
  appendMsg('user', text);
  chatHistory.push({ role: 'user', content: text });
  showTyping();
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    hideTyping();
    const data = await res.json();
    const reply = data.reply || "I'm having a little trouble. Please call (405) 555-0100!";
    appendMsg('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    speak(reply);
  } catch(err) {
    hideTyping();
    appendMsg('bot', "I'm having a little trouble. Please call (405) 555-0100!");
  }
}

chatInp.addEventListener('input', () => {
  chatInp.style.height = '';
  chatInp.style.height = Math.min(chatInp.scrollHeight, 90) + 'px';
});
function chatKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }
