// Local storage keys
const KEY_PROFILE = 'c14_profile';
const KEY_CHECKINS = 'c14_checkins';
const KEY_URGES = 'c14_urges';

let state = {
  profile: JSON.parse(localStorage.getItem(KEY_PROFILE) || 'null'),
  checkins: JSON.parse(localStorage.getItem(KEY_CHECKINS) || '[]'),
  urges: JSON.parse(localStorage.getItem(KEY_URGES) || '[]'),
  mepicaTimer: null,
  mepicaSeconds: 600,
  temp: { mood: null }
};

function saveAll(){
  localStorage.setItem(KEY_PROFILE, JSON.stringify(state.profile));
  localStorage.setItem(KEY_CHECKINS, JSON.stringify(state.checkins));
  localStorage.setItem(KEY_URGES, JSON.stringify(state.urges));
}

function showView(id){
  ['onboarding','home','checkin','mepica','progress','help','settings'].forEach(v=>{
    document.getElementById(v).classList.add('hidden');
  });
  document.getElementById(id).classList.remove('hidden');
  if(id==='home') renderHome();
  if(id==='progress') renderProgress();
}

function setAddiction(a){
  if(!state.profile) state.profile = { addiction:a, reason:'', start: new Date().toISOString(), relapse:null };
  else state.profile.addiction = a;
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
}

function finishOnboarding(){
  const reason = document.getElementById('reason').value.trim();
  if(!state.profile) state.profile = { addiction:'otro', reason, start: new Date().toISOString(), relapse:null };
  else state.profile.reason = reason || state.profile.reason || 'Voy por mi mejor versión.';
  saveAll();
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('home').classList.remove('hidden');
  renderHome();
}

function renderHome(){
  const why = document.getElementById('why');
  const streakEl = document.getElementById('streak');
  why.textContent = (state.profile && state.profile.reason) ? state.profile.reason : '—';
  const days = calcStreakDays();
  streakEl.textContent = days + (days===1?' día':' días');
}

function calcStreakDays(){
  // streak = days since last relapse (we don't record relapse, so use start date)
  if(!state.profile) return 0;
  const start = new Date(state.profile.start);
  const now = new Date();
  const diff = Math.floor((now - start)/(1000*60*60*24));
  return diff >=0 ? diff : 0;
}

function setMood(m){ state.temp.mood = m; }

function saveCheckin(){
  const mood = state.temp.mood || '😐';
  const craving = parseInt(document.getElementById('craving').value || '0',10);
  const note = document.getElementById('note').value.trim();
  const date = new Date().toISOString().slice(0,10);
  state.checkins.push({date, mood, craving, note});
  saveAll();
  alert('Check‑in guardado');
  showView('home');
}

function startMePica(){
  state.mepicaSeconds = 600;
  document.getElementById('timer').textContent = '10:00';
  showView('mepica');
  state.mepicaTimer = setInterval(()=>{
    state.mepicaSeconds--;
    const m = String(Math.floor(state.mepicaSeconds/60)).padStart(2,'0');
    const s = String(state.mepicaSeconds%60).padStart(2,'0');
    document.getElementById('timer').textContent = `${m}:${s}`;
    if(state.mepicaSeconds<=0){ completeMePica(); }
  }, 1000);
}

function cancelMePica(){
  clearInterval(state.mepicaTimer);
  showView('home');
}

function completeMePica(){
  clearInterval(state.mepicaTimer);
  state.urges.push({ ts:new Date().toISOString(), duration:600, completed:true });
  saveAll();
  alert('Bien ahí. Ola surfeada.');
  showView('home');
}

function renderProgress(){
  document.getElementById('statCheckins').textContent = state.checkins.length;
  document.getElementById('statUrges').textContent = state.urges.length;
  document.getElementById('statLast').textContent = state.checkins.length ? state.checkins[state.checkins.length-1].date : '—';
}

function resetApp(){
  if(confirm('¿Borrar todos tus datos locales?')){
    localStorage.removeItem(KEY_PROFILE);
    localStorage.removeItem(KEY_CHECKINS);
    localStorage.removeItem(KEY_URGES);
    state.profile=null; state.checkins=[]; state.urges=[];
    location.reload();
  }
}

// Share card generator
function downloadCard(){
  const c = document.getElementById('card');
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f141a';
  ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.fillText('Clarity14', 60, 160);
  ctx.font = '48px system-ui, sans-serif';
  const days = calcStreakDays();
  ctx.fillText('Racha limpia: '+days+' días', 60, 260);
  ctx.fillText('Check‑ins: '+state.checkins.length, 60, 340);
  ctx.fillText('“Ola surfeada, no consumí.”', 60, 420);
  const url = c.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = 'clarity14-card.png';
  a.click();
}

// boot
window.addEventListener('load', ()=>{
  if(state.profile){
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('home').classList.remove('hidden');
    renderHome();
  }
});
