/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signUpWithEmail, signInWithEmail, logOut, getOrCreateUser } from "./firebase";
import { getFirestore, doc, updateDoc, increment, arrayUnion, getDoc } from "firebase/firestore";

const db = getFirestore();

// ── Constants ──────────────────────────────────────────────────────────────────
const MAX_LIVES = 5;
const RESTORE_MS = 5 * 60 * 1000;
const XP_CORRECT = 15;
const XP_LESSON  = 50;
const getLevel = xp => Math.floor(xp / 100) + 1;
const getLvlPct = xp => xp % 100;

// ── Languages ──────────────────────────────────────────────────────────────────
const LANGS = [
  {code:"es",flag:"🇪🇸",native:"Español",  en:"Spanish"   },
  {code:"fr",flag:"🇫🇷",native:"Français", en:"French"    },
  {code:"pt",flag:"🇧🇷",native:"Português",en:"Portuguese"},
  {code:"de",flag:"🇩🇪",native:"Deutsch",  en:"German"    },
  {code:"it",flag:"🇮🇹",native:"Italiano", en:"Italian"   },
  {code:"zh",flag:"🇨🇳",native:"中文",      en:"Chinese"   },
  {code:"ar",flag:"🇸🇦",native:"العربية",  en:"Arabic"    },
  {code:"ja",flag:"🇯🇵",native:"日本語",    en:"Japanese"  },
  {code:"hi",flag:"🇮🇳",native:"हिन्दी",   en:"Hindi"     },
  {code:"ru",flag:"🇷🇺",native:"Русский",  en:"Russian"   },
  {code:"ko",flag:"🇰🇷",native:"한국어",    en:"Korean"    },
  {code:"tr",flag:"🇹🇷",native:"Türkçe",   en:"Turkish"   },
];

const T = {
  es:{hi:"¡Hola",tagline:"Tu tutor de inglés con IA",pick:"Elige tu idioma",cats:["Negocios","General","Gramática","Vocabulario","Pronunciación","Conversación"],loading:"Generando ejercicios...",send:"Enviar",back:"Volver",login:"Iniciar sesión",signup:"Crear cuenta",google:"Continuar con Google",noAcc:"¿Sin cuenta?",hasAcc:"¿Ya tienes?",email:"Correo",pass:"Contraseña",name:"Nombre",streak:"Racha",lessons:"Lecciones",xp:"XP",level:"Nivel",correct:"¡Correcto! 🎉",wrong:"Incorrecto",check:"Comprobar",cont:"Continuar",skip:"Omitir",done:"¡Lección completa! 🏆",earned:"XP ganados",next:"Siguiente lección",type:"Escribe tu respuesta...",arrange:"Ordena las palabras",choose:"Elige la correcta",speak:"Pronunciar",listening:"Escuchando...",tapSpeak:"Toca para hablar",tryAgain:"Intentar de nuevo",perfect:"¡Perfecto!",great:"¡Muy bien!",good:"¡Bien!",almost:"¡Casi! Intenta de nuevo",retry:"Reintentar",score:"Puntuación",hint:"Pista",tutor:"Tutor"},
  fr:{hi:"Bonjour",tagline:"Votre tuteur d'anglais IA",pick:"Choisissez votre langue",cats:["Affaires","Général","Grammaire","Vocabulaire","Prononciation","Conversation"],loading:"Génération des exercices...",send:"Envoyer",back:"Retour",login:"Se connecter",signup:"Créer compte",google:"Continuer avec Google",noAcc:"Pas de compte?",hasAcc:"Déjà compte?",email:"Email",pass:"Mot de passe",name:"Nom",streak:"Série",lessons:"Leçons",xp:"XP",level:"Niveau",correct:"Correct ! 🎉",wrong:"Incorrect",check:"Vérifier",cont:"Continuer",skip:"Passer",done:"Leçon terminée ! 🏆",earned:"XP gagnés",next:"Prochaine leçon",type:"Écrivez votre réponse...",arrange:"Arrangez les mots",choose:"Choisissez la bonne",speak:"Prononcer",listening:"Écoute...",tapSpeak:"Touchez pour parler",tryAgain:"Réessayer",perfect:"Parfait !",great:"Très bien !",good:"Bien !",almost:"Presque ! Réessayez",retry:"Réessayer",score:"Score",hint:"Indice",tutor:"Tuteur"},
  pt:{hi:"Olá",tagline:"Seu tutor de inglês com IA",pick:"Escolha seu idioma",cats:["Negócios","Geral","Gramática","Vocabulário","Pronúncia","Conversação"],loading:"Gerando exercícios...",send:"Enviar",back:"Voltar",login:"Entrar",signup:"Criar conta",google:"Continuar com Google",noAcc:"Sem conta?",hasAcc:"Já tem?",email:"Email",pass:"Senha",name:"Nome",streak:"Sequência",lessons:"Lições",xp:"XP",level:"Nível",correct:"Correto! 🎉",wrong:"Incorreto",check:"Verificar",cont:"Continuar",skip:"Pular",done:"Lição completa! 🏆",earned:"XP ganhos",next:"Próxima lição",type:"Escreva sua resposta...",arrange:"Ordene as palavras",choose:"Escolha a correta",speak:"Pronunciar",listening:"Ouvindo...",tapSpeak:"Toque para falar",tryAgain:"Tentar novamente",perfect:"Perfeito!",great:"Muito bem!",good:"Bem!",almost:"Quase! Tente novamente",retry:"Tentar de novo",score:"Pontuação",hint:"Dica",tutor:"Tutor"},
};
const DT = {hi:"Hello",tagline:"Your AI English coach",pick:"Choose your language",cats:["Business","General","Grammar","Vocabulary","Pronunciation","Conversation"],loading:"Generating exercises...",send:"Send",back:"Back",login:"Sign in",signup:"Create account",google:"Continue with Google",noAcc:"No account?",hasAcc:"Have one?",email:"Email",pass:"Password",name:"Name",streak:"Streak",lessons:"Lessons",xp:"XP",level:"Level",correct:"Correct! 🎉",wrong:"Incorrect",check:"Check",cont:"Continue",skip:"Skip",done:"Lesson complete! 🏆",earned:"XP earned",next:"Next lesson",type:"Type your answer...",arrange:"Arrange the words",choose:"Choose the correct one",speak:"Pronounce it",listening:"Listening...",tapSpeak:"Tap to speak",tryAgain:"Try again",perfect:"Perfect!",great:"Great job!",good:"Good!",almost:"Almost! Try again",retry:"Try again",score:"Score",hint:"Hint",tutor:"Tutor"};
const getT = l => l ? {...DT,...(T[l.code]||{})} : DT;

// ── Categories ─────────────────────────────────────────────────────────────────
const CATS = [
  {id:"business",   icon:"💼",color:"#10e8b5",grad:"linear-gradient(135deg,#10e8b5,#06c49a)",topics:["Professional Emails","Meeting Vocabulary","Presentations","Negotiations","Job Interviews","Phone Calls","Networking","Business Writing"]},
  {id:"general",    icon:"🌍",color:"#f59e0b",grad:"linear-gradient(135deg,#f59e0b,#f97316)",topics:["Daily Conversations","Shopping","Travel","Healthcare","Dining Out","Making Friends","Directions","Weather"]},
  {id:"grammar",    icon:"📐",color:"#8b5cf6",grad:"linear-gradient(135deg,#8b5cf6,#6d28d9)",topics:["Present Tenses","Past Tenses","Future Tenses","Modal Verbs","Conditionals","Passive Voice","Articles","Prepositions"]},
  {id:"vocabulary", icon:"📚",color:"#ec4899",grad:"linear-gradient(135deg,#ec4899,#be185d)",topics:["Common Idioms","Phrasal Verbs","Business Terms","Collocations","Academic Words","Slang","Synonyms","Antonyms"]},
  {id:"pronunciation",icon:"🎙️",color:"#38bdf8",grad:"linear-gradient(135deg,#38bdf8,#0284c7)",topics:["Vowel Sounds","Consonants","Word Stress","Intonation","Connected Speech","Silent Letters","Rhythm","Accent Reduction"]},
  {id:"conversation",icon:"💬",color:"#fb923c",grad:"linear-gradient(135deg,#fb923c,#ea580c)",topics:["Small Talk","Storytelling","Opinions","Requests","Apologizing","Agreeing","Disagreeing","Interrupting Politely"]},
];

// ── Pronunciation similarity ───────────────────────────────────────────────────
function similarity(a, b) {
  a = a.toLowerCase().replace(/[^a-z\s]/g,"").trim();
  b = b.toLowerCase().replace(/[^a-z\s]/g,"").trim();
  if (a === b) return 100;
  const aW = a.split(/\s+/);
  const bW = b.split(/\s+/);
  let matches = 0;
  bW.forEach(w => { if (aW.includes(w)) matches++; });
  const wordScore = bW.length > 0 ? matches / bW.length : 0;
  // Also check char-level for partial credit
  const longer = Math.max(a.length, b.length);
  let charMatches = 0;
  const aChars = a.split("");
  b.split("").forEach(c => { const i = aChars.indexOf(c); if (i > -1) { charMatches++; aChars.splice(i,1); }});
  const charScore = longer > 0 ? charMatches / longer : 0;
  return Math.round((wordScore * 0.7 + charScore * 0.3) * 100);
}

function getScoreLabel(score, t) {
  if (score >= 90) return {label: t.perfect, color:"#58cc02", emoji:"🌟"};
  if (score >= 70) return {label: t.great,   color:"#10e8b5", emoji:"✨"};
  if (score >= 50) return {label: t.good,    color:"#f59e0b", emoji:"👍"};
  return {label: t.almost, color:"#ff4b4b", emoji:"🔄"};
}

// ── Lives helpers ──────────────────────────────────────────────────────────────
function getLives(uid) {
  try {
    const raw = localStorage.getItem("ll_" + (uid||"g"));
    if (!raw) return MAX_LIVES;
    const {lives, lastLost} = JSON.parse(raw);
    if (lives >= MAX_LIVES) return MAX_LIVES;
    const elapsed = Date.now() - lastLost;
    const restored = Math.floor(elapsed / RESTORE_MS);
    return Math.min(MAX_LIVES, lives + restored);
  } catch { return MAX_LIVES; }
}
function saveLives(uid, n, prevLives) {
  try {
    const key = "ll_" + (uid||"g");
    const prev = JSON.parse(localStorage.getItem(key)||"{}");
    localStorage.setItem(key, JSON.stringify({lives:n, lastLost: n < prevLives ? Date.now() : (prev.lastLost || Date.now())}));
  } catch {}
}
function getNextRestoreCountdown(uid, lives) {
  try {
    if (lives >= MAX_LIVES) return "";
    const raw = localStorage.getItem("ll_" + (uid||"g"));
    if (!raw) return "";
    const {lastLost} = JSON.parse(raw);
    const elapsed = Date.now() - lastLost;
    const remaining = RESTORE_MS - (elapsed % RESTORE_MS);
    const m = Math.floor(remaining/60000);
    const s = Math.floor((remaining%60000)/1000);
    return `${m}:${s.toString().padStart(2,"0")}`;
  } catch { return ""; }
}

// ── AI ─────────────────────────────────────────────────────────────────────────
async function genExercises(topic, catId, langName) {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      system:`You are an expert English teacher. Student's native language: ${langName}. Teaching them ENGLISH.
Create 7 varied exercises about "${topic}" (${catId}).
Mix these types: multiple_choice, fill_blank, arrange_words, speak.

Return ONLY valid JSON:
{
  "exercises": [
    {"type":"multiple_choice","instruction":"situational context IN ${langName} — what English phrase fits this situation?","options":["correct English","wrong English 1","wrong English 2","wrong English 3"],"answer":"correct English"},
    {"type":"fill_blank","instruction":"context IN ${langName}","sentence":"English sentence with ___ blank","answer":"missing English word","hint":"meaning IN ${langName}"},
    {"type":"arrange_words","instruction":"context IN ${langName} — build this English sentence","words":["shuffled","english","words"],"answer":"correct English sentence"},
    {"type":"speak","instruction":"context IN ${langName} — say this in English","phrase":"English phrase to pronounce","phonetic":"phonetic pronunciation guide","tip":"pronunciation tip IN ${langName}"}
  ]
}
RULES:
- multiple_choice: EXACTLY 4 English options, answer is one
- arrange_words: 4-6 English words max, shuffled
- speak: simple clear English phrase, phonetic in brackets like [heh-LOH], tip in ${langName}
- Include at least 1 speak exercise per set
- ALL instructions in ${langName}, ALL answers in English`,
      messages:[{role:"user",content:`7 exercises about: ${topic}`}]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return JSON.parse(data.text.replace(/```json|```/g,"").trim()).exercises;
}

async function chatTutor(msgs, langName, topic) {
  const res = await fetch("/api/chat",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      system:`Warm English tutor for ${langName} speaker studying "${topic}". Respond in ${langName} with English examples. Max 4 sentences.`,
      messages:msgs.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}))
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

// ── Speech ──────────────────────────────────────────────────────────────────────
function speakText(text, cb) {
  if (!window.speechSynthesis){cb?.();return;}
  window.speechSynthesis.cancel();
  const go = () => {
    const u = new SpeechSynthesisUtterance(text);
    const vs = window.speechSynthesis.getVoices();
    const checks = [
      v=>/natural/i.test(v.name)&&/en/i.test(v.lang),
      v=>/microsoft.*(aria|jenny|guy)/i.test(v.name),
      v=>/samantha/i.test(v.name)&&v.localService,
      v=>/(enhanced|premium)/i.test(v.name)&&/en/i.test(v.lang),
      v=>v.localService&&/en.US/i.test(v.lang),
      v=>/en.US/i.test(v.lang),
    ];
    for(const c of checks){const v=vs.find(c);if(v){u.voice=v;break;}}
    u.lang="en-US";u.rate=0.82;u.pitch=1.0;
    u.onend=cb;u.onerror=cb;
    window.speechSynthesis.speak(u);
  };
  if (window.speechSynthesis.getVoices().length===0) {
    window.speechSynthesis.onvoiceschanged = go;
  } else {
    go();
  }
}

// ── Firebase ───────────────────────────────────────────────────────────────────
async function saveProgress(uid, xp, topic, catId) {
  const ref = doc(db,"users",uid);
  const snap = await getDoc(ref);
  const d = snap.data()||{};
  const today = new Date().toDateString();
  const yest = new Date(Date.now()-86400000).toDateString();
  let su = {lastActive:today};
  if (d.lastActive===today) su.streak=d.streak||1;
  else if (d.lastActive===yest) su.streak=increment(1);
  else su.streak=1;
  await updateDoc(ref,{...su,xp:increment(xp),totalLessons:increment(1),completedLessons:arrayUnion(`${catId}:${topic}`)});
  return (await getDoc(ref)).data();
}

// ── CSS ────────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=JetBrains+Mono:wght@500;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --c:#10e8b5;--c2:#06c49a;--bg:#0a1628;--card:#111f35;--card2:#162640;--card3:#1a2d4a;
  --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);
  --txt:#e8f4ff;--muted:#5a7a9a;--muted2:#3d5570;
  --ok:#58cc02;--err:#ff4b4b;--xp:#ffd900;--warn:#f59e0b;
  --r:14px;--r2:20px;--r3:28px;
}
body{background:var(--bg);}
.app{font-family:'Nunito',sans-serif;background:var(--bg);min-height:100vh;color:var(--txt);overflow-x:hidden;}

/* Orbs */
.orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;}
.orb1{width:600px;height:600px;background:radial-gradient(circle,rgba(16,232,181,0.08) 0%,transparent 70%);top:-200px;right:-200px;animation:drift1 20s ease-in-out infinite;}
.orb2{width:500px;height:500px;background:radial-gradient(circle,rgba(99,60,220,0.07) 0%,transparent 70%);bottom:-150px;left:-150px;animation:drift2 25s ease-in-out infinite;}
.orb3{width:300px;height:300px;background:radial-gradient(circle,rgba(245,158,11,0.05) 0%,transparent 70%);top:40%;left:30%;animation:drift3 30s ease-in-out infinite;}
@keyframes drift1{0%,100%{transform:translate(0,0);}50%{transform:translate(-30px,30px);}}
@keyframes drift2{0%,100%{transform:translate(0,0);}50%{transform:translate(30px,-20px);}}
@keyframes drift3{0%,100%{transform:translate(0,0);}50%{transform:translate(20px,20px);}}
.pg{position:relative;z-index:1;}

/* Nav */
.nav{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:rgba(10,22,40,0.88);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;}
.logo{font-size:1.3rem;font-weight:900;background:linear-gradient(135deg,#10e8b5,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px;}
.nav-pills{display:flex;align-items:center;gap:6px;}
.pill{display:flex;align-items:center;gap:5px;background:var(--card);border:1px solid var(--border2);padding:5px 12px;border-radius:20px;font-size:0.78rem;font-weight:800;}
.pill-fire{color:#ff9600;}
.pill-xp{color:var(--xp);}
.pill-heart{color:var(--err);}
.pill-timer{color:var(--err);font-size:0.68rem;}
.nav-r{display:flex;gap:8px;align-items:center;}
.btn-sm{background:none;border:1px solid var(--border2);color:var(--muted);font-family:'Nunito',sans-serif;font-size:0.75rem;font-weight:800;padding:5px 12px;border-radius:20px;cursor:pointer;transition:all 0.2s;}
.btn-sm:hover{color:var(--err);border-color:rgba(255,75,75,0.3);}
.btn-back{background:none;border:none;color:var(--muted);font-family:'Nunito',sans-serif;font-size:0.88rem;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;transition:color 0.2s;padding:0;}
.btn-back:hover{color:var(--c);}
.wrap{max-width:680px;margin:0 auto;padding:0 20px;}

/* Welcome */
.hero{text-align:center;padding:56px 20px 40px;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(16,232,181,0.1);border:1px solid rgba(16,232,181,0.25);padding:6px 18px;border-radius:20px;font-size:0.78rem;font-weight:800;color:var(--c);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;}
.hero h1{font-size:clamp(2.8rem,7vw,4.5rem);font-weight:900;line-height:1.0;margin-bottom:14px;letter-spacing:-1.5px;}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,#10e8b5,#38bdf8,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.hero-sub{color:var(--muted);font-size:1.05rem;max-width:420px;margin:0 auto 20px;line-height:1.7;font-weight:600;}
.hero-features{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:48px;}
.hf{display:flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:700;color:var(--muted);}
.hf-dot{width:6px;height:6px;border-radius:50%;}
.eyebrow{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--c);font-weight:800;margin-bottom:16px;text-align:center;}
.lang-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;max-width:680px;margin:0 auto;padding-bottom:60px;}
.lang-card{background:var(--card);border:2px solid var(--border);border-radius:var(--r2);padding:16px 10px;text-align:center;cursor:pointer;transition:all 0.22s;font-weight:800;position:relative;overflow:hidden;}
.lang-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(16,232,181,0.08),transparent);opacity:0;transition:opacity 0.22s;}
.lang-card:hover{border-color:rgba(16,232,181,0.5);transform:translateY(-4px) scale(1.02);box-shadow:0 12px 40px rgba(16,232,181,0.15);}
.lang-card:hover::before{opacity:1;}
.lang-flag{font-size:2rem;display:block;margin-bottom:8px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));}
.lang-native{font-size:0.85rem;display:block;font-weight:800;}
.lang-en{font-size:0.65rem;color:var(--muted);margin-top:2px;font-weight:700;}

/* Auth */
.auth-wrap{max-width:400px;margin:48px auto 0;}
.auth-card{background:var(--card);border:1px solid var(--border2);border-radius:var(--r3);padding:32px 28px;position:relative;overflow:hidden;}
.auth-card::before{content:'';position:absolute;top:-60px;right:-60px;width:150px;height:150px;background:radial-gradient(circle,rgba(16,232,181,0.12),transparent);border-radius:50%;}
.auth-icon{font-size:2.5rem;margin-bottom:14px;display:block;filter:drop-shadow(0 4px 8px rgba(16,232,181,0.3));}
.auth-card h2{font-size:1.5rem;font-weight:900;margin-bottom:4px;letter-spacing:-0.5px;}
.auth-card p{color:var(--muted);font-size:0.85rem;margin-bottom:22px;font-weight:600;}
.f-label{font-size:0.7rem;font-weight:800;color:var(--muted);margin-bottom:5px;display:block;text-transform:uppercase;letter-spacing:0.08em;}
.f-in{width:100%;background:var(--card2);border:1.5px solid var(--border2);border-radius:var(--r);padding:12px 15px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:700;outline:none;margin-bottom:12px;transition:all 0.2s;}
.f-in:focus{border-color:rgba(16,232,181,0.6);background:var(--card3);box-shadow:0 0 0 3px rgba(16,232,181,0.08);}
.f-in::placeholder{color:var(--muted2);}
.abtn{width:100%;border:none;border-radius:var(--r);padding:13px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:900;cursor:pointer;transition:all 0.2s;margin-bottom:10px;letter-spacing:0.02em;}
.abtn.primary{background:linear-gradient(135deg,var(--c),var(--c2));color:#051510;}
.abtn.primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(16,232,181,0.35);}
.abtn.google{background:var(--card2);color:var(--txt);border:1.5px solid var(--border2);}
.abtn.google:hover{background:var(--card3);}
.abtn:disabled{opacity:0.4;cursor:not-allowed;transform:none!important;box-shadow:none!important;}
.auth-err{color:var(--err);font-size:0.8rem;margin-bottom:10px;font-weight:700;background:rgba(255,75,75,0.08);padding:8px 12px;border-radius:8px;border-left:3px solid var(--err);}
.auth-switch{text-align:center;font-size:0.82rem;color:var(--muted);margin-top:10px;font-weight:700;}
.auth-switch span{color:#38bdf8;cursor:pointer;font-weight:800;}
.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted2);font-size:0.72rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border2);}

/* Home */
.home-top{padding:24px 0 18px;}
.home-top h2{font-size:1.6rem;font-weight:900;margin-bottom:3px;letter-spacing:-0.5px;}
.home-top p{color:var(--muted);font-size:0.88rem;font-weight:600;}
.level-card{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:18px 20px;margin-bottom:16px;position:relative;overflow:hidden;}
.level-card::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--c),#38bdf8,#818cf8);}
.lc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.lc-badge{background:linear-gradient(135deg,var(--c),#38bdf8);color:#051510;font-size:0.72rem;font-weight:900;padding:4px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.08em;}
.lc-xp{font-size:0.8rem;color:var(--muted);font-weight:700;}
.xp-bar-wrap{height:10px;background:var(--card2);border-radius:5px;overflow:hidden;position:relative;}
.xp-bar-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--c),#38bdf8);transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;}
.xp-bar-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);animation:shimmer 2s infinite;}
@keyframes shimmer{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
.stat{background:var(--card);border:1px solid var(--border);border-radius:var(--r2);padding:14px 10px;text-align:center;transition:all 0.2s;cursor:default;}
.stat:hover{border-color:var(--border2);transform:translateY(-2px);}
.stat-val{font-size:1.7rem;font-weight:900;line-height:1;}
.stat-lbl{font-size:0.65rem;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.1em;font-weight:800;}
.cat-section{margin-bottom:8px;}
.cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding-bottom:48px;}
@media(min-width:500px){.cat-grid{grid-template-columns:repeat(3,1fr);}}
.cat-card{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r2);padding:20px 14px;cursor:pointer;transition:all 0.22s;position:relative;overflow:hidden;}
.cat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--r2) var(--r2) 0 0;opacity:0;transition:opacity 0.22s;}
.cat-card:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(0,0,0,0.4);}
.cat-card:hover::before{opacity:1;}
.cat-icon{font-size:2.2rem;display:block;margin-bottom:10px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));}
.cat-name{font-size:0.88rem;font-weight:900;margin-bottom:3px;}
.cat-ct{font-size:0.68rem;color:var(--muted);font-weight:700;}

/* Topics */
.topic-hd{padding:24px 0 16px;}
.topic-hd h2{font-size:1.5rem;font-weight:900;letter-spacing:-0.5px;}
.topic-list{display:flex;flex-direction:column;gap:8px;padding-bottom:48px;}
.topic-row{background:var(--card);border:1.5px solid var(--border);border-radius:var(--r2);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s;}
.topic-row:hover{background:var(--card2);border-color:var(--border2);transform:translateX(6px);}
.topic-row.done{border-color:rgba(88,204,2,0.25);background:rgba(88,204,2,0.04);}
.topic-name{font-size:0.95rem;font-weight:800;}
.topic-done{font-size:0.68rem;color:var(--ok);margin-top:2px;font-weight:700;}
.topic-arr{color:var(--muted2);font-size:1rem;}
.topic-row:hover .topic-arr{color:var(--c);}

/* Exercise nav */
.ex-nav{display:flex;align-items:center;gap:12px;padding:12px 20px;background:rgba(10,22,40,0.92);backdrop-filter:blur(24px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;}
.ex-x{background:none;border:none;color:var(--muted);font-size:1.1rem;cursor:pointer;padding:4px;transition:color 0.2s;line-height:1;}
.ex-x:hover{color:var(--err);}
.prog-bar{flex:1;height:14px;background:var(--card2);border-radius:7px;overflow:hidden;}
.prog-fill{height:100%;border-radius:7px;background:linear-gradient(90deg,var(--c),#38bdf8);transition:width 0.5s cubic-bezier(0.34,1.56,0.64,1);}
.hearts-row{display:flex;gap:3px;}
.heart-ic{font-size:1rem;transition:all 0.2s;}
.heart-ic.lost{filter:grayscale(1);opacity:0.3;transform:scale(0.85);}

/* Exercise body */
.ex-body{max-width:620px;margin:0 auto;padding:28px 20px 120px;}
.ex-badge{display:inline-flex;align-items:center;gap:7px;font-size:0.7rem;font-weight:900;padding:5px 14px;border-radius:20px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;}
.ex-instruction{font-size:1.05rem;font-weight:700;color:var(--muted);margin-bottom:20px;line-height:1.55;}

/* Multiple choice */
.mc-grid{display:flex;flex-direction:column;gap:10px;}
.mc-btn{background:var(--card);border:2px solid var(--border2);border-radius:var(--r2);padding:14px 18px;text-align:left;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;color:var(--txt);cursor:pointer;transition:all 0.18s;display:flex;align-items:center;gap:14px;width:100%;}
.mc-btn:hover:not(:disabled){background:var(--card2);border-color:rgba(16,232,181,0.4);transform:translateX(4px);}
.mc-btn.sel{background:rgba(16,232,181,0.08);border-color:var(--c);color:var(--c);}
.mc-btn.ok{background:rgba(88,204,2,0.1);border-color:var(--ok);color:var(--ok);}
.mc-btn.no{background:rgba(255,75,75,0.08);border-color:var(--err);color:var(--err);}
.mc-btn:disabled{cursor:default;}
.mc-letter{width:30px;height:30px;border-radius:8px;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:900;flex-shrink:0;}

/* Fill blank */
.fb-sent{font-size:1.2rem;font-weight:800;line-height:1.8;text-align:center;margin-bottom:8px;}
.fb-blank{display:inline-block;min-width:70px;border-bottom:3px solid var(--c);padding:0 8px;color:var(--c);}
.fb-hint-txt{font-size:0.8rem;color:var(--muted);text-align:center;margin-bottom:18px;font-weight:700;}
.fb-in{width:100%;background:var(--card);border:2px solid var(--border2);border-radius:var(--r2);padding:14px 18px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:1rem;font-weight:700;outline:none;transition:all 0.2s;text-align:center;}
.fb-in:focus{border-color:rgba(16,232,181,0.5);background:var(--card2);}
.fb-in.ok{border-color:var(--ok);background:rgba(88,204,2,0.06);}
.fb-in.no{border-color:var(--err);background:rgba(255,75,75,0.06);}
.fb-in::placeholder{color:var(--muted2);}

/* Arrange words */
.aw-drop{min-height:58px;background:var(--card);border:2px dashed var(--border2);border-radius:var(--r2);padding:12px 14px;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;align-items:center;transition:all 0.2s;}
.aw-drop.ok{border-color:var(--ok);border-style:solid;background:rgba(88,204,2,0.05);}
.aw-drop.no{border-color:var(--err);border-style:solid;background:rgba(255,75,75,0.05);}
.aw-ph{color:var(--muted2);font-size:0.85rem;font-weight:700;}
.aw-bank{display:flex;flex-wrap:wrap;gap:8px;min-height:46px;}
.wchip{background:var(--card2);border:2px solid var(--border2);border-radius:10px;padding:8px 14px;font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:800;cursor:pointer;transition:all 0.18s;color:var(--txt);}
.wchip:hover{background:rgba(16,232,181,0.1);border-color:rgba(16,232,181,0.45);transform:translateY(-2px);}
.wchip.placed{background:rgba(16,232,181,0.1);border-color:var(--c);color:var(--c);}
.wchip.ok{background:rgba(88,204,2,0.1);border-color:var(--ok);color:var(--ok);}
.wchip.no{background:rgba(255,75,75,0.08);border-color:var(--err);color:var(--err);}

/* Pronunciation exercise */
.speak-card{background:linear-gradient(135deg,rgba(56,189,248,0.08),rgba(129,140,248,0.08));border:1.5px solid rgba(56,189,248,0.2);border-radius:var(--r3);padding:24px;margin-bottom:20px;text-align:center;position:relative;overflow:hidden;}
.speak-card::before{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;background:radial-gradient(circle,rgba(56,189,248,0.12),transparent);border-radius:50%;}
.speak-phrase{font-size:1.5rem;font-weight:900;color:#e8f4ff;margin-bottom:8px;letter-spacing:-0.5px;}
.speak-phonetic{font-family:'JetBrains Mono',monospace;font-size:1rem;color:#38bdf8;margin-bottom:6px;font-weight:500;}
.speak-tip{font-size:0.82rem;color:var(--muted);font-weight:700;margin-top:4px;}
.speak-listen{display:inline-flex;align-items:center;gap:8px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;border-radius:20px;padding:7px 16px;font-family:'Nunito',sans-serif;font-size:0.8rem;font-weight:800;cursor:pointer;transition:all 0.2s;margin-top:12px;}
.speak-listen:hover{background:rgba(56,189,248,0.18);}
.speak-listen.playing{animation:pulseglow 0.9s infinite;}
@keyframes pulseglow{0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,0.4);}50%{box-shadow:0 0 0 8px rgba(56,189,248,0);}}

.mic-area{display:flex;flex-direction:column;align-items:center;gap:16px;padding:8px 0;}
.mic-btn{width:80px;height:80px;border-radius:50%;border:none;font-size:2rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;position:relative;}
.mic-btn.idle{background:linear-gradient(135deg,var(--c),#38bdf8);box-shadow:0 6px 24px rgba(16,232,181,0.3);}
.mic-btn.idle:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(16,232,181,0.45);}
.mic-btn.recording{background:linear-gradient(135deg,var(--err),#ff6b35);box-shadow:0 6px 24px rgba(255,75,75,0.4);animation:mic-pulse 1s infinite;}
@keyframes mic-pulse{0%,100%{box-shadow:0 6px 24px rgba(255,75,75,0.4),0 0 0 0 rgba(255,75,75,0.3);}50%{box-shadow:0 6px 24px rgba(255,75,75,0.4),0 0 0 16px rgba(255,75,75,0);}}
.mic-btn.done{background:linear-gradient(135deg,#58cc02,#3d9900);}
.mic-label{font-size:0.85rem;font-weight:800;color:var(--muted);}
.sound-wave{display:flex;align-items:center;gap:4px;height:32px;}
.wave-bar{width:4px;border-radius:2px;background:var(--err);animation:wave 0.8s ease-in-out infinite;}
.wave-bar:nth-child(1){animation-delay:0s;height:8px;}
.wave-bar:nth-child(2){animation-delay:0.1s;height:20px;}
.wave-bar:nth-child(3){animation-delay:0.2s;height:28px;}
.wave-bar:nth-child(4){animation-delay:0.3s;height:16px;}
.wave-bar:nth-child(5){animation-delay:0.4s;height:24px;}
.wave-bar:nth-child(6){animation-delay:0.3s;height:14px;}
.wave-bar:nth-child(7){animation-delay:0.2s;height:22px;}
@keyframes wave{0%,100%{transform:scaleY(0.4);}50%{transform:scaleY(1);}}

.score-ring{width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;border:4px solid;margin:0 auto 8px;}
.score-num{font-size:1.8rem;line-height:1;}
.score-pct{font-size:0.65rem;font-weight:800;opacity:0.8;}
.score-label{font-size:1.1rem;font-weight:900;margin-bottom:4px;}
.score-heard{font-size:0.82rem;color:var(--muted);font-weight:700;}
.score-heard em{color:var(--txt);font-style:normal;font-weight:800;}

/* Feedback bar */
.fb-bar{position:fixed;bottom:0;left:0;right:0;padding:16px 20px;border-top:1px solid var(--border);z-index:200;transition:background 0.3s;}
.fb-bar.neu{background:rgba(10,22,40,0.96);backdrop-filter:blur(24px);}
.fb-bar.ok-bg{background:rgba(88,204,2,0.1);border-color:rgba(88,204,2,0.2);}
.fb-bar.no-bg{background:rgba(255,75,75,0.08);border-color:rgba(255,75,75,0.2);}
.fb-inner{max-width:620px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.fb-left{}
.fb-status{font-size:1rem;font-weight:900;display:flex;align-items:center;gap:8px;}
.fb-status.ok{color:var(--ok);}
.fb-status.no{color:var(--err);}
.fb-correct{font-size:0.82rem;color:var(--muted);margin-top:3px;font-weight:700;}
.fb-prog{font-size:0.78rem;color:var(--muted);font-weight:700;}
.fb-btns{display:flex;gap:8px;flex-shrink:0;}
.fbtn{border:none;border-radius:var(--r2);padding:12px 22px;font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:900;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
.fbtn.go{background:linear-gradient(135deg,var(--c),var(--c2));color:#051510;}
.fbtn.go:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(16,232,181,0.35);}
.fbtn.skip{background:var(--card2);color:var(--muted);border:1.5px solid var(--border2);}
.fbtn.skip:hover{background:var(--card3);}
.fbtn:disabled{opacity:0.35;cursor:not-allowed;transform:none!important;}

/* Complete */
.complete{text-align:center;padding:40px 20px 100px;}
.complete-trophy{font-size:5rem;display:block;margin-bottom:12px;animation:trophy-pop 0.7s cubic-bezier(0.34,1.56,0.64,1);}
@keyframes trophy-pop{0%{transform:scale(0);opacity:0;}100%{transform:scale(1);opacity:1;}}
.complete h2{font-size:2.2rem;font-weight:900;letter-spacing:-1px;margin-bottom:6px;}
.complete-sub{color:var(--muted);font-weight:700;margin-bottom:28px;}
.complete-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
.cs{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:16px 10px;text-align:center;}
.cs-v{font-size:1.7rem;font-weight:900;line-height:1;}
.cs-v.xp{color:var(--xp);}
.cs-v.ok{color:var(--ok);}
.cs-v.fire{color:#ff9600;}
.cs-l{font-size:0.65rem;color:var(--muted);margin-top:4px;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;}
.lvl-section{background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:16px 18px;margin-bottom:24px;}
.lvl-row{display:flex;justify-content:space-between;font-size:0.8rem;font-weight:800;color:var(--muted);margin-bottom:8px;}
.complete-btn{background:linear-gradient(135deg,var(--c),#38bdf8);color:#051510;border:none;border-radius:var(--r2);padding:15px 40px;font-family:'Nunito',sans-serif;font-size:1rem;font-weight:900;cursor:pointer;transition:all 0.2s;letter-spacing:0.02em;}
.complete-btn:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(16,232,181,0.35);}

/* Tutor */
.tutor-fab{position:fixed;bottom:90px;right:18px;width:52px;height:52px;border-radius:50%;border:none;background:linear-gradient(135deg,#818cf8,#6d28d9);color:#fff;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 20px rgba(129,140,248,0.4);transition:all 0.2s;z-index:140;display:flex;align-items:center;justify-content:center;}
.tutor-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(129,140,248,0.55);}
.tutor-panel{position:fixed;right:0;top:0;bottom:0;width:310px;background:var(--card);border-left:1px solid var(--border2);display:flex;flex-direction:column;z-index:150;transform:translateX(100%);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);}
.tutor-panel.open{transform:translateX(0);}
.tp-hd{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:linear-gradient(135deg,rgba(129,140,248,0.08),transparent);}
.tp-hd h3{font-size:0.88rem;font-weight:900;}
.tp-x{background:none;border:none;color:var(--muted);font-size:1rem;cursor:pointer;}
.tp-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;}
.tm{max-width:90%;}
.tm.user{align-self:flex-end;}
.tm.assistant{align-self:flex-start;}
.tm-bbl{padding:9px 13px;border-radius:14px;font-size:0.82rem;line-height:1.6;font-weight:700;}
.user .tm-bbl{background:linear-gradient(135deg,var(--c),var(--c2));color:#051510;border-bottom-right-radius:3px;}
.assistant .tm-bbl{background:var(--card2);border:1px solid var(--border2);border-bottom-left-radius:3px;}
.tp-ft{padding:10px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;}
.tp-in{flex:1;background:var(--card2);border:1.5px solid var(--border2);border-radius:10px;padding:9px 12px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:0.82rem;font-weight:700;outline:none;transition:border-color 0.2s;}
.tp-in:focus{border-color:rgba(129,140,248,0.5);}
.tp-in::placeholder{color:var(--muted2);}
.tp-send{background:linear-gradient(135deg,#818cf8,#6d28d9);color:#fff;border:none;border-radius:10px;padding:9px 14px;font-family:'Nunito',sans-serif;font-size:0.8rem;font-weight:900;cursor:pointer;}
.tp-typing{display:flex;gap:4px;padding:3px;align-items:center;}
.td{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:tdb 1s infinite;}
.td:nth-child(2){animation-delay:.15s;}.td:nth-child(3){animation-delay:.3s;}
@keyframes tdb{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-5px);opacity:1;}}

/* Heartbreak overlay */
.hb-overlay{position:fixed;inset:0;z-index:999;pointer-events:none;animation:hb 1.8s ease forwards;}
@keyframes hb{0%{background:rgba(255,75,75,0);}10%{background:rgba(255,75,75,0.4);}40%{background:rgba(255,75,75,0.15);}100%{background:rgba(255,75,75,0);}}
.hb-emoji{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:6rem;animation:hb-pop 1.8s ease forwards;z-index:1000;pointer-events:none;filter:drop-shadow(0 0 30px rgba(255,75,75,0.6));}
@keyframes hb-pop{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3);}20%{opacity:1;transform:translate(-50%,-50%) scale(1.4);}50%{opacity:1;transform:translate(-50%,-50%) scale(1);}80%{opacity:1;}100%{opacity:0;transform:translate(-50%,-60%) scale(0.7);}}

.fade{animation:fi 0.35s ease;}
@keyframes fi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.shake{animation:shk 0.5s ease;}
@keyframes shk{0%,100%{transform:translateX(0);}20%{transform:translateX(-10px);}40%{transform:translateX(10px);}60%{transform:translateX(-6px);}80%{transform:translateX(6px);}}
`;

// ── App ────────────────────────────────────────────────────────────────────────
export default function LinguaAI() {
  const [view,       setView]      = useState("welcome");
  const [lang,       setLang]      = useState(null);
  const [user,       setUser]      = useState(null);
  const [prog,       setProg]      = useState(null);
  const [authMode,   setAuthMode]  = useState("login");
  const [aEmail,     setAEmail]    = useState("");
  const [aPass,      setAPass]     = useState("");
  const [aName,      setAName]     = useState("");
  const [aErr,       setAErr]      = useState("");
  const [aLoad,      setALoad]     = useState(false);
  const [cat,        setCat]       = useState(null);
  const [topic,      setTopic]     = useState(null);

  // Exercise state
  const [exs,        setExs]       = useState([]);
  const [exIdx,      setExIdx]     = useState(0);
  const [exLoad,     setExLoad]    = useState(false);
  const [exErr,      setExErr]     = useState("");
  const [answered,   setAnswered]  = useState(false);
  const [feedback,   setFeedback]  = useState(null);
  const [correct,    setCorrect]   = useState(0);
  const [xpEarned,   setXpEarned]  = useState(0);
  const [localXP,    setLocalXP]   = useState(0);
  const [hearts,     setHeartsRaw] = useState(MAX_LIVES);
  const [heartBreak, setHeartBreak]= useState(false);
  const [timer,      setTimer]     = useState("");
  const [speaking,   setSpeaking]  = useState(false);

  // Per-exercise
  const [mcSel,      setMcSel]     = useState(null);
  const [fbVal,      setFbVal]     = useState("");
  const [awPlaced,   setAwPlaced]  = useState([]);
  const [awBank,     setAwBank]    = useState([]);

  // Pronunciation
  const [recState,   setRecState]  = useState("idle"); // idle | recording | done
  const [spokenText, setSpokenText]= useState("");
  const [pronScore,  setPronScore] = useState(null);
  const recRef = useRef(null);

  // Tutor
  const [tOpen,      setTOpen]     = useState(false);
  const [tMsgs,      setTMsgs]     = useState([]);
  const [tInput,     setTInput]    = useState("");
  const [tLoad,      setTLoad]     = useState(false);
  const tBottom = useRef(null);

  useEffect(() => { tBottom.current?.scrollIntoView({behavior:"smooth"}); }, [tMsgs]);

  const uid = user?.uid;

  // Lives timer
  useEffect(() => {
    const tick = () => {
      const lives = getLives(uid);
      setHeartsRaw(lives);
      if (lives < MAX_LIVES) {
        setTimer(getNextRestoreCountdown(uid, lives));
      } else {
        setTimer("");
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [uid]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const lc = localStorage.getItem("lingua_lang") || "es";
        const l = LANGS.find(x => x.code === lc) || LANGS[0];
        setLang(l);
        const savedXP = parseInt(localStorage.getItem("ll_xp_" + u.uid) || "0", 10);
        setLocalXP(savedXP);
        setView("home");
        getOrCreateUser(u, l.code).then(p => {
          setProg(p);
          setLocalXP(0);
          localStorage.removeItem("ll_xp_" + u.uid);
        }).catch(console.error);
      } else {
        setUser(null);
        setLocalXP(0);
      }
    });
    return unsub;
  }, []);

  const tr = getT(lang);
  const completedLessons = prog?.completedLessons || [];
  const baseXP  = prog?.xp || 0;
  const totalXP = baseXP + localXP;
  const level   = getLevel(totalXP);
  const lvlPct  = getLvlPct(totalXP);
  const catIdx  = c => CATS.findIndex(x => x.id === c?.id);

  const setHearts = (n) => {
    const next = typeof n === "function" ? n(hearts) : n;
    setHeartsRaw(next);
    saveLives(uid, next, hearts);
    if (next === 0 && hearts > 0) {
      setHeartBreak(true);
      setTimeout(() => setHeartBreak(false), 1800);
    }
  };

  const addLocalXP = (amount) => {
    setLocalXP(x => {
      const next = x + amount;
      if (uid) localStorage.setItem("ll_xp_" + uid, String(next));
      return next;
    });
  };

  // Pick language
  const pickLang = (l) => {
    setLang(l);
    localStorage.setItem("lingua_lang", l.code);
    setView(user ? "home" : "auth");
  };

  // Auth
  const handleGoogle = async () => {
    setALoad(true); setAErr("");
    try {
      const cred = await signInWithGoogle();
      setUser(cred.user);
      setView("home");
      getOrCreateUser(cred.user, lang?.code || "es").then(p => setProg(p)).catch(console.error);
    } catch(e) { setAErr(e.message); }
    setALoad(false);
  };

  const handleEmail = async () => {
    setALoad(true); setAErr("");
    try {
      let cred;
      if (authMode === "signup") {
        if (!aName.trim()) { setAErr("Please enter your name."); setALoad(false); return; }
        cred = await signUpWithEmail(aEmail, aPass, aName);
      } else {
        cred = await signInWithEmail(aEmail, aPass);
      }
      setUser(cred.user);
      setView("home");
      getOrCreateUser(cred.user, lang?.code || "es").then(p => setProg(p)).catch(console.error);
    } catch(e) {
      const msg = e.message || "";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) setAErr("Incorrect email or password.");
      else if (msg.includes("too-many-requests")) setAErr("Too many attempts. Wait a moment.");
      else if (msg.includes("invalid-email")) setAErr("Please enter a valid email.");
      else if (msg.includes("weak-password")) setAErr("Password must be at least 6 characters.");
      else setAErr("Something went wrong. Please try again.");
    }
    setALoad(false);
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null); setProg(null); setView("welcome"); setLang(null); setLocalXP(0);
  };

  // Exercise engine
  const resetExState = useCallback(() => {
    setMcSel(null); setFbVal(""); setFeedback(null); setAnswered(false);
    setAwPlaced([]); setAwBank([]);
    setRecState("idle"); setSpokenText(""); setPronScore(null);
  }, []);

  const loadEx = useCallback((idx, exercises) => {
    setExIdx(idx);
    resetExState();
    const ex = exercises[idx];
    if (!ex) return;
    if (ex.type === "arrange_words") {
      setAwBank([...ex.words].map((w,i) => ({word:w,id:i,placed:false})));
    }
    // Auto-speak for pronunciation exercises
    if (ex.type === "speak") {
      setTimeout(() => speakText(ex.phrase), 600);
    }
  }, [resetExState]);

  const startLesson = async (tp) => {
    setTopic(tp);
    setExs([]); setExIdx(0); setExLoad(true); setExErr("");
    setCorrect(0); setXpEarned(0);
    resetExState();
    setHearts(getLives(uid));
    setTMsgs([{role:"assistant", content:"🤖 " + tr.tutor}]);
    setView("exercise");
    try {
      const exercises = await genExercises(tp, cat.id, lang.en);
      setExs(exercises);
      loadEx(0, exercises);
    } catch(e) { setExErr(e.message || "Failed to load. Please try again."); }
    setExLoad(false);
  };

  useEffect(() => {
    if (exs.length > 0 && exIdx === 0) loadEx(0, exs);
  }, [exs]);

  // Pronunciation recording
  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Please use Chrome or Edge."); return; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart = () => setRecState("recording");
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setSpokenText(text);
      const ex = exs[exIdx];
      const score = similarity(text, ex.phrase);
      setPronScore(score);
      setRecState("done");
      setAnswered(true);
      const passed = score >= 50;
      setFeedback(passed ? "correct" : "wrong");
      if (passed) {
        setCorrect(c => c+1);
        setXpEarned(x => x + XP_CORRECT);
        addLocalXP(XP_CORRECT);
      } else {
        setHearts(h => Math.max(0, h-1));
      }
    };
    rec.onerror = () => { setRecState("idle"); };
    rec.onend = () => { if (recState === "recording") setRecState("idle"); };
    recRef.current = rec;
    rec.start();
  };

  const stopRecording = () => {
    recRef.current?.stop();
  };

  const retryPronunciation = () => {
    setPronScore(null); setSpokenText(""); setRecState("idle");
    setAnswered(false); setFeedback(null);
  };

  // Check answer
  const checkAnswer = () => {
    if (answered) return;
    const ex = exs[exIdx];
    let ok = false;
    if (ex.type === "multiple_choice") ok = mcSel === ex.answer;
    else if (ex.type === "fill_blank") ok = fbVal.trim().toLowerCase() === ex.answer.toLowerCase();
    else if (ex.type === "arrange_words") ok = awPlaced.map(w=>w.word).join(" ").toLowerCase() === ex.answer.toLowerCase();
    setAnswered(true);
    setFeedback(ok ? "correct" : "wrong");
    if (ok) { setCorrect(c=>c+1); setXpEarned(x=>x+XP_CORRECT); addLocalXP(XP_CORRECT); }
    else { setHearts(h => Math.max(0, h-1)); }
  };

  const nextExercise = async () => {
    const next = exIdx + 1;
    if (next >= exs.length || hearts <= 0) {
      const total = xpEarned + XP_LESSON;
      setXpEarned(total);
      addLocalXP(XP_LESSON);
      setView("complete");
      if (uid) {
        saveProgress(uid, total, topic, cat.id)
          .then(p => { setProg(p); setLocalXP(0); localStorage.removeItem("ll_xp_" + uid); })
          .catch(console.error);
      }
    } else {
      loadEx(next, exs);
    }
  };

  // Arrange words
  const placeWord = (item) => {
    if (answered || item.placed) return;
    setAwBank(b => b.map(w => w.id===item.id ? {...w,placed:true} : w));
    setAwPlaced(p => [...p, item]);
  };
  const removeWord = (item) => {
    if (answered) return;
    setAwPlaced(p => p.filter(w => w.id!==item.id));
    setAwBank(b => b.map(w => w.id===item.id ? {...w,placed:false} : w));
  };

  // Tutor
  const sendTutor = async () => {
    if (!tInput.trim() || tLoad) return;
    const updated = [...tMsgs, {role:"user", content:tInput}];
    setTMsgs(updated); setTInput(""); setTLoad(true);
    try {
      const reply = await chatTutor(updated, lang.en, topic||"English");
      setTMsgs(p => [...p, {role:"assistant", content:reply}]);
    } catch { setTMsgs(p => [...p, {role:"assistant", content:"Connection issue."}]); }
    setTLoad(false);
  };

  const handleSpeak = () => {
    const ex = exs[exIdx];
    if (!ex) return;
    setSpeaking(true);
    speakText(ex.phrase || ex.answer || ex.english || "", () => setSpeaking(false));
  };

  const ex = exs[exIdx];
  const progPct = exs.length > 0 ? (exIdx / exs.length) * 100 : 0;
  const awCorrect = answered && ex?.type==="arrange_words" && awPlaced.map(w=>w.word).join(" ").toLowerCase()===ex.answer.toLowerCase();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="orb orb1"/><div className="orb orb2"/><div className="orb orb3"/>

        {/* ── WELCOME ── */}
        {view==="welcome" && (
          <div className="pg fade">
            <div className="wrap">
              <div className="hero">
                <div className="hero-badge">🌍 AI-Powered Language Learning</div>
                <h1>Speak English<br/>with <em>Confidence</em></h1>
                <p className="hero-sub">Interactive lessons, pronunciation practice, and an AI tutor — all in your language.</p>
                <div className="hero-features">
                  {["🎯 Real exercises","🎙️ Voice practice","🤖 AI tutor","🔥 Streak tracking"].map(f=>(
                    <div key={f} className="hf"><div className="hf-dot" style={{background:"var(--c)"}}/>{f}</div>
                  ))}
                </div>
                <div className="eyebrow">{DT.pick}</div>
              </div>
              <div className="lang-grid">
                {LANGS.map(l=>(
                  <div key={l.code} className="lang-card" onClick={()=>pickLang(l)}>
                    <span className="lang-flag">{l.flag}</span>
                    <span className="lang-native">{l.native}</span>
                    <span className="lang-en">{l.en}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AUTH ── */}
        {view==="auth" && lang && (
          <div className="pg fade">
            <nav className="nav">
              <button className="btn-back" onClick={()=>setView("welcome")}>← {tr.back}</button>
              <div className="pill">{lang.flag} {lang.native}</div>
            </nav>
            <div className="wrap">
              <div className="auth-wrap">
                <div className="auth-card">
                  <span className="auth-icon">{authMode==="login"?"👋":"🎓"}</span>
                  <h2>{authMode==="login"?"Welcome back!":"Create your account"}</h2>
                  <p>{authMode==="login"?"Sign in to continue your progress":"Start your English journey today"}</p>
                  <button className="abtn google" onClick={handleGoogle} disabled={aLoad}>
                    <span>G</span> &nbsp; {tr.google}
                  </button>
                  <div className="divider">or</div>
                  {authMode==="signup" && (
                    <><label className="f-label">{tr.name}</label>
                    <input className="f-in" placeholder="Your name" value={aName} onChange={e=>setAName(e.target.value)}/></>
                  )}
                  <label className="f-label">{tr.email}</label>
                  <input className="f-in" type="email" placeholder="your@email.com" value={aEmail} onChange={e=>setAEmail(e.target.value)}/>
                  <label className="f-label">{tr.pass}</label>
                  <input className="f-in" type="password" placeholder="••••••••" value={aPass} onChange={e=>setAPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleEmail()}/>
                  {aErr && <div className="auth-err">{aErr}</div>}
                  <button className="abtn primary" onClick={handleEmail} disabled={aLoad}>
                    {aLoad?"...":authMode==="login"?tr.login:tr.signup}
                  </button>
                  <div className="auth-switch">
                    {authMode==="login"?tr.noAcc:tr.hasAcc}{" "}
                    <span onClick={()=>{setAuthMode(authMode==="login"?"signup":"login");setAErr("");}}>
                      {authMode==="login"?tr.signup:tr.login}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HOME ── */}
        {view==="home" && lang && user && (
          <div className="pg">
            <nav className="nav">
              <div className="logo">LinguaAI</div>
              <div className="nav-pills">
                <div className="pill"><span className="pill-fire">🔥</span>{prog?.streak||1}</div>
                <div className="pill"><span className="pill-xp">⚡</span>{totalXP} XP</div>
                <div className="pill">
                  <span className="pill-heart">❤️</span>{hearts}/{MAX_LIVES}
                  {timer && <span className="pill-timer">&nbsp;{timer}</span>}
                </div>
              </div>
              <div className="nav-r">
                <div className="pill" style={{cursor:"pointer"}} onClick={()=>setView("welcome")}>{lang.flag}</div>
                <button className="btn-sm" onClick={handleLogout}>Sign out</button>
              </div>
            </nav>
            <div className="wrap fade">
              <div className="home-top">
                <h2>{tr.hi}, {user.displayName?.split(" ")[0]||"there"} 👋</h2>
                <p>{tr.tagline}</p>
              </div>

              <div className="level-card">
                <div className="lc-top">
                  <div className="lc-badge">Level {level}</div>
                  <div className="lc-xp">{lvlPct} / 100 XP</div>
                </div>
                <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{width:`${lvlPct}%`}}/></div>
              </div>

              <div className="stats-row">
                <div className="stat">
                  <div className="stat-val" style={{color:"#ff9600"}}>🔥{prog?.streak||1}</div>
                  <div className="stat-lbl">{tr.streak}</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{color:"var(--ok)"}}>{prog?.totalLessons||0}</div>
                  <div className="stat-lbl">{tr.lessons}</div>
                </div>
                <div className="stat">
                  <div className="stat-val" style={{color:"var(--xp)"}}>⚡{totalXP}</div>
                  <div className="stat-lbl">{tr.xp}</div>
                </div>
              </div>

              <div className="cat-section">
                <div className="eyebrow">CHOOSE A CATEGORY</div>
                <div className="cat-grid">
                  {CATS.map((c,i)=>(
                    <div key={c.id} className="cat-card" style={{borderColor:c.color+"22"}}
                      onClick={()=>{setCat(c);setView("topics");}}>
                      <div className="cat-card" style={{position:"absolute",top:0,left:0,right:0,height:"3px",background:c.grad,borderRadius:0}}/>
                      <span className="cat-icon">{c.icon}</span>
                      <div className="cat-name">{tr.cats[i]}</div>
                      <div className="cat-ct">{c.topics.length} topics</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TOPICS ── */}
        {view==="topics" && lang && cat && (
          <div className="pg">
            <nav className="nav">
              <button className="btn-back" onClick={()=>setView("home")}>← {tr.back}</button>
              <div className="pill" style={{color:cat.color}}>{cat.icon} {tr.cats[catIdx(cat)]}</div>
            </nav>
            <div className="wrap fade">
              <div className="topic-hd">
                <div className="eyebrow" style={{color:cat.color,textAlign:"left"}}>{tr.cats[catIdx(cat)]}</div>
                <h2>{tr.cats[catIdx(cat)]}</h2>
              </div>
              <div className="topic-list">
                {cat.topics.map(tp=>{
                  const done = completedLessons.includes(`${cat.id}:${tp}`);
                  return (
                    <div key={tp} className={`topic-row${done?" done":""}`} onClick={()=>startLesson(tp)}>
                      <div>
                        <div className="topic-name">{tp}</div>
                        {done && <div className="topic-done">✓ Completed</div>}
                      </div>
                      <span className="topic-arr">{done?"✓":"→"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── EXERCISE ── */}
        {view==="exercise" && lang && (
          <>
            <nav className="ex-nav">
              <button className="ex-x" onClick={()=>setView("topics")}>✕</button>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${progPct}%`}}/></div>
              <div className={`hearts-row${hearts===1?" shake":""}`}>
                {[...Array(MAX_LIVES)].map((_,i)=>(
                  <span key={i} className={`heart-ic${i>=hearts?" lost":""}`}>❤️</span>
                ))}
              </div>
            </nav>

            {heartBreak && <><div className="hb-overlay"/><div className="hb-emoji">💔</div></>}

            <div className="ex-body fade">
              {exLoad && (
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:"3rem",marginBottom:"16px",animation:"trophy-pop 0.6s ease"}}>⚡</div>
                  <div style={{color:"var(--muted)",fontWeight:700,fontSize:"1rem"}}>{tr.loading}</div>
                </div>
              )}

              {exErr && (
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:"14px"}}>⚠️</div>
                  <div style={{color:"var(--err)",fontWeight:700,marginBottom:"20px"}}>{exErr}</div>
                  <button className="complete-btn" onClick={()=>startLesson(topic)}>Try Again</button>
                </div>
              )}

              {!exLoad && !exErr && ex && (
                <>
                  {/* Badge */}
                  <div className="ex-badge" style={
                    ex.type==="speak"
                      ? {background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.25)",color:"#38bdf8"}
                      : ex.type==="arrange_words"
                      ? {background:"rgba(251,146,60,0.1)",border:"1px solid rgba(251,146,60,0.25)",color:"#fb923c"}
                      : ex.type==="fill_blank"
                      ? {background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",color:"#a78bfa"}
                      : {background:"rgba(16,232,181,0.1)",border:"1px solid rgba(16,232,181,0.25)",color:"var(--c)"}
                  }>
                    {ex.type==="speak"?"🎙️ Pronunciation"
                      :ex.type==="arrange_words"?"🔀 Arrange words"
                      :ex.type==="fill_blank"?"✏️ Fill in the blank"
                      :"🎯 Choose the correct answer"}
                  </div>

                  <div className="ex-instruction">{ex.instruction}</div>

                  {/* SPEAK exercise */}
                  {ex.type==="speak" && (
                    <>
                      <div className="speak-card">
                        <div className="speak-phrase">"{ex.phrase}"</div>
                        {ex.phonetic && <div className="speak-phonetic">{ex.phonetic}</div>}
                        {ex.tip && <div className="speak-tip">💡 {ex.tip}</div>}
                        <button className={`speak-listen${speaking?" playing":""}`}
                          onClick={()=>{setSpeaking(true);speakText(ex.phrase,()=>setSpeaking(false));}}>
                          {speaking?"🔊 Playing...":"🔊 Listen first"}
                        </button>
                      </div>

                      {pronScore === null ? (
                        <div className="mic-area">
                          {recState==="recording"
                            ? (<>
                                <div className="sound-wave">
                                  {[...Array(7)].map((_,i)=><div key={i} className="wave-bar"/>)}
                                </div>
                                <button className="mic-btn recording" onClick={stopRecording}>⏹</button>
                                <div className="mic-label">{tr.listening}</div>
                              </>)
                            : (<>
                                <button className="mic-btn idle" onClick={startRecording}>🎤</button>
                                <div className="mic-label">{tr.tapSpeak}</div>
                              </>)
                          }
                        </div>
                      ) : (
                        <div style={{textAlign:"center",padding:"12px 0"}}>
                          {(() => {
                            const {label,color,emoji} = getScoreLabel(pronScore, tr);
                            return (
                              <>
                                <div className="score-ring" style={{borderColor:color,color}}>
                                  <div className="score-num">{pronScore}</div>
                                  <div className="score-pct">/ 100</div>
                                </div>
                                <div className="score-label" style={{color}}>{emoji} {label}</div>
                                {spokenText && (
                                  <div className="score-heard">
                                    I heard: <em>"{spokenText}"</em>
                                  </div>
                                )}
                                {pronScore < 50 && (
                                  <button onClick={retryPronunciation}
                                    style={{marginTop:"14px",background:"none",border:"1.5px solid var(--border2)",color:"var(--muted)",fontFamily:"'Nunito',sans-serif",fontWeight:800,fontSize:"0.85rem",padding:"8px 20px",borderRadius:"20px",cursor:"pointer"}}>
                                    🔄 {tr.retry}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}

                  {/* MULTIPLE CHOICE */}
                  {ex.type==="multiple_choice" && (
                    <div className="mc-grid">
                      {ex.options.map((opt,i)=>{
                        const letters=["A","B","C","D"];
                        let cls="";
                        if (answered) {
                          if (opt===ex.answer) cls="ok";
                          else if (opt===mcSel) cls="no";
                        } else if (opt===mcSel) cls="sel";
                        return (
                          <button key={i} className={`mc-btn ${cls}`} disabled={answered}
                            onClick={()=>!answered&&setMcSel(opt)}>
                            <span className="mc-letter">{letters[i]}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* FILL BLANK */}
                  {ex.type==="fill_blank" && (
                    <div>
                      <div className="fb-sent">
                        {ex.sentence.split("___").map((part,i,arr)=>(
                          <span key={i}>{part}
                            {i<arr.length-1 && <span className="fb-blank">{answered?ex.answer:fbVal||"___"}</span>}
                          </span>
                        ))}
                      </div>
                      {ex.hint && <div className="fb-hint-txt">💡 {ex.hint}</div>}
                      <input className={`fb-in${answered?(fbVal.trim().toLowerCase()===ex.answer.toLowerCase()?" ok":" no"):""}`}
                        placeholder={tr.type} value={fbVal}
                        onChange={e=>setFbVal(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&!answered&&checkAnswer()}
                        disabled={answered}/>
                    </div>
                  )}

                  {/* ARRANGE WORDS */}
                  {ex.type==="arrange_words" && (
                    <div>
                      <div className={`aw-drop${answered?(awCorrect?" ok":" no"):""}`}>
                        {awPlaced.length===0
                          ? <span className="aw-ph">{tr.arrange}</span>
                          : awPlaced.map((w,i)=>(
                              <span key={w.id} className={`wchip placed${answered?(awCorrect?" ok":" no"):""}`}
                                onClick={()=>removeWord(w)}>{w.word}</span>
                          ))
                        }
                      </div>
                      <div className="aw-bank">
                        {awBank.filter(w=>!w.placed).map(w=>(
                          <span key={w.id} className="wchip" onClick={()=>placeWord(w)}>{w.word}</span>
                        ))}
                      </div>
                      {answered && !awCorrect && (
                        <div style={{marginTop:"12px",color:"var(--muted)",fontSize:"0.85rem",fontWeight:700}}>
                          ✅ {ex.answer}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Feedback bar */}
            {!exLoad && !exErr && ex && (
              <div className={`fb-bar${feedback?" "+(feedback==="correct"?"ok-bg":"no-bg"):" neu"}`}>
                <div className="fb-inner">
                  <div className="fb-left">
                    {feedback==="correct" && <div className="fb-status ok">✓ {tr.correct}</div>}
                    {feedback==="wrong" && (
                      <><div className="fb-status no">✗ {tr.wrong}</div>
                      {ex.type!=="speak" && <div className="fb-correct">✅ {ex.answer}</div>}</>
                    )}
                    {!feedback && <div className="fb-prog">{exIdx+1} / {exs.length}</div>}
                  </div>
                  <div className="fb-btns">
                    {!answered && ex.type!=="speak" && (
                      <button className="fbtn skip" onClick={()=>{setFeedback("wrong");setAnswered(true);setHearts(h=>Math.max(0,h-1));}}>{tr.skip}</button>
                    )}
                    {(answered && ex.type!=="speak") || (answered && ex.type==="speak" && pronScore!==null) ? (
                      <button className="fbtn go" onClick={nextExercise}>{tr.cont} →</button>
                    ) : ex.type!=="speak" ? (
                      <button className="fbtn go" onClick={checkAnswer}
                        disabled={
                          (ex.type==="multiple_choice"&&!mcSel)||
                          (ex.type==="fill_blank"&&!fbVal.trim())||
                          (ex.type==="arrange_words"&&awPlaced.length===0)
                        }>{tr.check}</button>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Tutor FAB */}
            <button className="tutor-fab" onClick={()=>setTOpen(o=>!o)}>🤖</button>

            {/* Tutor panel */}
            <div className={`tutor-panel${tOpen?" open":""}`}>
              <div className="tp-hd">
                <h3>🤖 {tr.tutor} · {lang.native}</h3>
                <button className="tp-x" onClick={()=>setTOpen(false)}>✕</button>
              </div>
              <div className="tp-msgs">
                {tMsgs.map((m,i)=>(
                  <div key={i} className={`tm ${m.role}`}><div className="tm-bbl">{m.content}</div></div>
                ))}
                {tLoad && <div className="tm assistant"><div className="tm-bbl"><div className="tp-typing"><div className="td"/><div className="td"/><div className="td"/></div></div></div>}
                <div ref={tBottom}/>
              </div>
              <div className="tp-ft">
                <input className="tp-in" placeholder={tr.send+"..."} value={tInput}
                  onChange={e=>setTInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendTutor()}/>
                <button className="tp-send" onClick={sendTutor} disabled={tLoad}>{tr.send}</button>
              </div>
            </div>
          </>
        )}

        {/* ── COMPLETE ── */}
        {view==="complete" && lang && (
          <div className="pg">
            <nav className="nav">
              <div className="logo">LinguaAI</div>
              <div className="pill">{lang.flag} {lang.native}</div>
            </nav>
            <div className="wrap fade">
              <div className="complete">
                <span className="complete-trophy">🏆</span>
                <h2>{tr.done}</h2>
                <p className="complete-sub">{topic}</p>
                <div className="complete-stats">
                  <div className="cs"><div className="cs-v xp">+{xpEarned}</div><div className="cs-l">{tr.earned}</div></div>
                  <div className="cs"><div className="cs-v ok">{correct}/{exs.length}</div><div className="cs-l">Correct</div></div>
                  <div className="cs"><div className="cs-v fire">🔥{prog?.streak||1}</div><div className="cs-l">{tr.streak}</div></div>
                </div>
                <div className="lvl-section">
                  <div className="lvl-row"><span>Level {getLevel(totalXP)}</span><span>{getLvlPct(totalXP)} / 100 XP</span></div>
                  <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{width:`${getLvlPct(totalXP)}%`}}/></div>
                </div>
                <button className="complete-btn" onClick={()=>setView("topics")}>{tr.next} →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
