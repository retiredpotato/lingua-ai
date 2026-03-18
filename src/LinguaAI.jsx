import { useState, useEffect, useRef } from "react";

const LANGUAGES = [
  { code: "es", flag: "🇪🇸", native: "Español",   english: "Spanish"    },
  { code: "fr", flag: "🇫🇷", native: "Français",  english: "French"     },
  { code: "pt", flag: "🇧🇷", native: "Português", english: "Portuguese" },
  { code: "de", flag: "🇩🇪", native: "Deutsch",   english: "German"     },
  { code: "it", flag: "🇮🇹", native: "Italiano",  english: "Italian"    },
  { code: "zh", flag: "🇨🇳", native: "中文",       english: "Chinese"    },
  { code: "ar", flag: "🇸🇦", native: "العربية",   english: "Arabic"     },
  { code: "ja", flag: "🇯🇵", native: "日本語",     english: "Japanese"   },
  { code: "hi", flag: "🇮🇳", native: "हिन्दी",    english: "Hindi"      },
  { code: "ru", flag: "🇷🇺", native: "Русский",   english: "Russian"    },
  { code: "ko", flag: "🇰🇷", native: "한국어",     english: "Korean"     },
  { code: "tr", flag: "🇹🇷", native: "Türkçe",    english: "Turkish"    },
];

const TRANSLATIONS = {
  es: {
    tagline: "Tu tutor personal de inglés con IA",
    pickLang: "Elige tu idioma para comenzar",
    greeting: "¡Hola!",
    catNames: ["Inglés de Negocios","Inglés General","Gramática","Vocabulario","Pronunciación","Conversación"],
    topicsLabel: "Temas disponibles",
    loadingLesson: "Preparando tu lección...",
    chatPlaceholder: "Pregunta algo en español...",
    send: "Enviar", back: "Volver",
    tutorWelcome: "¡Hola! Soy tu tutor de inglés. Estoy aquí para ayudarte. ¿Tienes alguna pregunta sobre esta lección?",
    listen: "Escuchar", listening: "Reproduciendo...",
    tipLabel: "💡 Consejo", practiceLabel: "✏️ Práctica",
  },
  fr: {
    tagline: "Votre tuteur personnel d'anglais avec IA",
    pickLang: "Choisissez votre langue pour commencer",
    greeting: "Bonjour!",
    catNames: ["Anglais des Affaires","Anglais Général","Grammaire","Vocabulaire","Prononciation","Conversation"],
    topicsLabel: "Sujets disponibles",
    loadingLesson: "Préparation de votre leçon...",
    chatPlaceholder: "Posez une question en français...",
    send: "Envoyer", back: "Retour",
    tutorWelcome: "Bonjour! Je suis votre tuteur d'anglais. Avez-vous des questions?",
    listen: "Écouter", listening: "Lecture...",
    tipLabel: "💡 Conseil", practiceLabel: "✏️ Pratique",
  },
  pt: {
    tagline: "Seu tutor pessoal de inglês com IA",
    pickLang: "Escolha seu idioma para começar",
    greeting: "Olá!",
    catNames: ["Inglês nos Negócios","Inglês Geral","Gramática","Vocabulário","Pronúncia","Conversação"],
    topicsLabel: "Tópicos disponíveis",
    loadingLesson: "Preparando sua aula...",
    chatPlaceholder: "Faça uma pergunta em português...",
    send: "Enviar", back: "Voltar",
    tutorWelcome: "Olá! Sou seu tutor de inglês. Tem alguma dúvida?",
    listen: "Ouvir", listening: "Reproduzindo...",
    tipLabel: "💡 Dica", practiceLabel: "✏️ Prática",
  },
};

const DEFAULT_T = {
  tagline: "Your personal AI English tutor",
  pickLang: "Choose your language to begin",
  greeting: "Hello!",
  catNames: ["Business English","General English","Grammar","Vocabulary","Pronunciation","Conversation"],
  topicsLabel: "Available topics",
  loadingLesson: "Preparing your lesson...",
  chatPlaceholder: "Ask your tutor a question...",
  send: "Send", back: "Back",
  tutorWelcome: "Hello! I'm your English tutor. I'm here to help you learn. Do you have any questions?",
  listen: "Listen", listening: "Playing...",
  tipLabel: "💡 Tip", practiceLabel: "✏️ Practice",
};

const getT = (lang) => (lang ? { ...DEFAULT_T, ...(TRANSLATIONS[lang.code] || {}) } : DEFAULT_T);

const CATEGORIES = [
  { id: "business",      icon: "💼", color: "#10e8b5",
    topics: ["Professional Emails","Meeting Vocabulary","Presentations","Negotiations","Job Interviews","Phone Calls","Networking"] },
  { id: "general",       icon: "🌍", color: "#f59e0b",
    topics: ["Daily Conversations","Shopping & Services","Travel & Directions","Healthcare","Dining Out","Making Friends"] },
  { id: "grammar",       icon: "📐", color: "#8b5cf6",
    topics: ["Verb Tenses","Articles & Prepositions","Conditional Sentences","Modal Verbs","Passive Voice","Reported Speech"] },
  { id: "vocabulary",    icon: "📚", color: "#ec4899",
    topics: ["Common Idioms","Phrasal Verbs","Business Terms","Collocations","Academic Words","Slang & Informal"] },
  { id: "pronunciation", icon: "🎙️", color: "#38bdf8",
    topics: ["Vowel Sounds","Consonant Sounds","Word Stress","Sentence Intonation","Connected Speech"] },
  { id: "conversation",  icon: "💬", color: "#fb923c",
    topics: ["Small Talk","Storytelling","Expressing Opinions","Making Requests","Apologizing Politely"] },
];

// ── API — calls our own backend, key never exposed ────────────────────────────
async function geminiCall(systemPrompt, messages) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: Array.isArray(messages)
        ? messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }))
        : [{ role: "user", parts: [{ text: messages }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(typeof data.error === "string" ? data.error : data.error.message);
  return data.candidates[0].content.parts[0].text;
}

async function generateLesson(topic, categoryId, langName) {
  const text = await geminiCall(
    `You are an expert English teacher. The student's native language is ${langName}.
Respond ONLY with a valid JSON object — no markdown, no backticks, no extra text:
{
  "title": "lesson title in ${langName}",
  "intro": "2-3 sentences introducing the topic IN ${langName}",
  "phrases": [
    { "english": "English phrase", "translation": "translation in ${langName}", "note": "short tip IN ${langName}" }
  ],
  "tip": "one grammar/usage tip IN ${langName}",
  "exercise": "one practice exercise IN ${langName}"
}
Include exactly 5-6 phrases. Real-world focus.`,
    `Create a ${categoryId} English lesson about: ${topic}`
  );
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function tutorChat(messages, langName, topic) {
  return geminiCall(
    `You are a warm, patient English tutor for a ${langName} speaker studying: "${topic}".
- Always respond in ${langName} so the student understands
- Include English examples with ${langName} translations
- Be encouraging and clear. Max 3-5 sentences.`,
    messages
  );
}

// ── Speech ────────────────────────────────────────────────────────────────────
function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  const checks = [
    (v) => /samantha/i.test(v.name) && v.localService,
    (v) => /(enhanced|premium|neural)/i.test(v.name) && /en[-_]US/i.test(v.lang),
    (v) => /(enhanced|premium|neural)/i.test(v.name) && /en/i.test(v.lang),
    (v) => v.localService && /en[-_]US/i.test(v.lang),
    (v) => /en[-_]US/i.test(v.lang),
  ];
  for (const check of checks) { const v = voices.find(check); if (v) return v; }
  return null;
}

function speakEnglish(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const go = () => {
    const u = new SpeechSynthesisUtterance(text);
    const v = getBestVoice(); if (v) u.voice = v;
    u.lang = "en-US"; u.rate = 0.88; u.pitch = 1.0;
    u.onend = onEnd; u.onerror = onEnd;
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length === 0
    ? (window.speechSynthesis.onvoiceschanged = go) : go();
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.la{font-family:'Outfit',sans-serif;background:#070f1e;min-height:100vh;color:#e4edf8;overflow-x:hidden;}
.la-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(110px);}
.la-o1{width:500px;height:500px;background:rgba(16,232,181,0.07);top:-150px;right:-120px;}
.la-o2{width:420px;height:420px;background:rgba(99,60,180,0.07);bottom:-130px;left:-110px;}
.la-page{position:relative;z-index:1;}
.la-nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(7,15,30,0.85);backdrop-filter:blur(24px);position:sticky;top:0;z-index:50;}
.la-logo{font-size:1.3rem;font-weight:800;background:linear-gradient(135deg,#10e8b5,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.la-chip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:6px 15px;border-radius:20px;font-size:0.82rem;cursor:pointer;transition:background 0.2s;}
.la-chip:hover{background:rgba(255,255,255,0.09);}
.la-back{background:none;border:none;color:#7a96b0;font-family:'Outfit',sans-serif;font-size:0.88rem;cursor:pointer;display:flex;align-items:center;gap:5px;transition:color 0.2s;padding:0;}
.la-back:hover{color:#10e8b5;}
.la-wrap{max-width:960px;margin:0 auto;padding:0 20px;}
.la-hero{text-align:center;padding:72px 20px 50px;}
.la-hero h1{font-size:clamp(2.5rem,6vw,4.2rem);font-weight:800;line-height:1.08;margin-bottom:14px;}
.la-hero h1 em{font-style:normal;background:linear-gradient(135deg,#10e8b5,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.la-hero p{color:#7a96b0;font-size:1rem;max-width:440px;margin:0 auto 52px;line-height:1.75;}
.la-eyebrow{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.18em;color:#10e8b5;font-weight:600;margin-bottom:20px;}
.la-lgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:12px;max-width:720px;margin:0 auto;padding-bottom:64px;}
.la-lcard{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:20px 12px;text-align:center;cursor:pointer;transition:all 0.22s;}
.la-lcard:hover{background:rgba(16,232,181,0.08);border-color:rgba(16,232,181,0.38);transform:translateY(-3px);}
.la-flag{font-size:2rem;display:block;margin-bottom:9px;}
.la-lnative{font-size:0.9rem;font-weight:600;display:block;}
.la-len{font-size:0.7rem;color:#3d5570;margin-top:3px;}
.la-hint{padding:40px 0 30px;}
.la-hint h2{font-size:1.75rem;font-weight:700;margin-bottom:6px;}
.la-hint p{color:#4d6882;font-size:0.9rem;}
.la-cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:14px;padding-bottom:64px;}
.la-ccard{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:22px 20px;cursor:pointer;transition:all 0.22s;position:relative;overflow:hidden;}
.la-cline{position:absolute;top:0;left:0;right:0;height:2px;opacity:0;transition:opacity 0.22s;}
.la-ccard:hover{transform:translateY(-4px);box-shadow:0 18px 50px rgba(0,0,0,0.45);}
.la-ccard:hover .la-cline{opacity:1;}
.la-cicon{font-size:2rem;display:block;margin-bottom:14px;}
.la-cname{font-size:1rem;font-weight:700;margin-bottom:5px;}
.la-csub{font-size:0.77rem;color:#3d5570;}
.la-carr{position:absolute;right:18px;top:50%;transform:translateY(-50%);opacity:0.25;transition:all 0.22s;}
.la-ccard:hover .la-carr{opacity:1;transform:translateY(-50%) translateX(5px);}
.la-thead{padding:36px 0 22px;}
.la-thead h2{font-size:1.6rem;font-weight:700;}
.la-tlist{display:flex;flex-direction:column;gap:10px;padding-bottom:64px;}
.la-titem{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s;}
.la-titem:hover{background:rgba(255,255,255,0.055);border-color:rgba(255,255,255,0.14);transform:translateX(6px);}
.la-tname{font-size:0.94rem;font-weight:500;}
.la-tarr{color:#1e334a;transition:color 0.2s;}
.la-titem:hover .la-tarr{color:#10e8b5;}
.la-lgrid2{display:grid;grid-template-columns:1fr;gap:18px;padding:24px 0 64px;}
@media(min-width:680px){.la-lgrid2{grid-template-columns:3fr 2fr;}}
.la-panel{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;}
.la-ph{padding:15px 20px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
.la-ph h3{font-size:0.94rem;font-weight:600;}
.la-pb{padding:18px 20px;overflow-y:auto;flex:1;}
.la-intro{font-size:0.87rem;color:#8ba4be;line-height:1.78;margin-bottom:18px;}
.la-phrase{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:11px;padding:12px 14px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;}
.la-ptxt{flex:1;}
.la-pen{font-family:'JetBrains Mono',monospace;font-size:0.88rem;font-weight:500;color:#edf4ff;margin-bottom:4px;}
.la-ptr{font-size:0.79rem;color:#4d6882;margin-bottom:3px;}
.la-pnote{font-size:0.74rem;color:#2e4560;font-style:italic;}
.la-sbtn{flex-shrink:0;background:rgba(16,232,181,0.08);border:1px solid rgba(16,232,181,0.2);color:#10e8b5;border-radius:8px;padding:5px 10px;font-family:'Outfit',sans-serif;font-size:0.73rem;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
.la-sbtn:hover{background:rgba(16,232,181,0.16);}
.la-sbtn.on{animation:la-pulse 0.9s ease-in-out infinite;}
@keyframes la-pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,232,181,0.35);}50%{box-shadow:0 0 0 7px rgba(16,232,181,0);}}
.la-tip{background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:10px;padding:12px 15px;font-size:0.81rem;color:#c4b5fd;line-height:1.68;margin-top:14px;}
.la-tip strong{color:#a78bfa;}
.la-ex{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:12px 15px;font-size:0.81rem;color:#fde68a;line-height:1.68;margin-top:10px;}
.la-ex strong{color:#f59e0b;}
.la-loading{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:52px 20px;gap:16px;}
.la-dots{display:flex;gap:7px;}
.la-dot{width:8px;height:8px;border-radius:50%;animation:la-bounce 1.3s ease-in-out infinite;}
.la-dot:nth-child(1){background:#10e8b5;}
.la-dot:nth-child(2){background:#38bdf8;animation-delay:0.18s;}
.la-dot:nth-child(3){background:#8b5cf6;animation-delay:0.36s;}
@keyframes la-bounce{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-9px);opacity:1;}}
.la-ltxt{font-size:0.84rem;color:#3d5570;}
.la-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:200px;max-height:340px;scrollbar-width:thin;scrollbar-color:#1a2d42 transparent;}
.la-msg{max-width:88%;}
.la-msg.user{align-self:flex-end;}
.la-msg.assistant{align-self:flex-start;}
.la-bbl{padding:9px 13px;border-radius:13px;font-size:0.83rem;line-height:1.62;}
.user .la-bbl{background:#10e8b5;color:#051510;font-weight:500;border-bottom-right-radius:4px;}
.assistant .la-bbl{background:rgba(255,255,255,0.055);border:1px solid rgba(255,255,255,0.09);color:#cde0f4;border-bottom-left-radius:4px;}
.la-typing{display:flex;gap:4px;padding:2px 4px;align-items:center;}
.la-tdot{width:6px;height:6px;border-radius:50%;background:#2e4560;animation:la-bounce 1s ease-in-out infinite;}
.la-tdot:nth-child(2){animation-delay:0.14s;}
.la-tdot:nth-child(3){animation-delay:0.28s;}
.la-cfoot{padding:12px 14px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;}
.la-cinput{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:9px 13px;color:#e4edf8;font-family:'Outfit',sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.2s;}
.la-cinput:focus{border-color:rgba(16,232,181,0.4);}
.la-cinput::placeholder{color:#1e334a;}
.la-csend{background:#10e8b5;color:#051510;border:none;border-radius:9px;padding:9px 16px;font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:background 0.18s;white-space:nowrap;}
.la-csend:hover{background:#0dd4a4;}
.la-csend:disabled{opacity:0.35;cursor:not-allowed;}
.la-fade{animation:la-fi 0.35s ease;}
@keyframes la-fi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
`;

export default function LinguaAI() {
  const [view,     setView]     = useState("welcome");
  const [lang,     setLang]     = useState(null);
  const [cat,      setCat]      = useState(null);
  const [topic,    setTopic]    = useState(null);
  const [lesson,   setLesson]   = useState(null);
  const [lLoad,    setLLoad]    = useState(false);
  const [lErr,     setLErr]     = useState("");
  const [msgs,     setMsgs]     = useState([]);
  const [input,    setInput]    = useState("");
  const [cLoad,    setCLoad]    = useState(false);
  const [speaking, setSpeaking] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const tr = getT(lang);
  const catIdx = (c) => CATEGORIES.findIndex((x) => x.id === c?.id);

  const pickLang = (l) => { setLang(l); setView("home"); };
  const pickCat  = (c) => { setCat(c);  setView("topics"); };

  const startLesson = async (tp) => {
    setTopic(tp); setView("lesson");
    setLesson(null); setLErr(""); setLLoad(true);
    setMsgs([{ role: "assistant", content: tr.tutorWelcome }]);
    try { setLesson(await generateLesson(tp, cat.id, lang.english)); }
    catch (e) { setLErr(e.message || "Could not load lesson."); }
    setLLoad(false);
  };

  const sendChat = async () => {
    if (!input.trim() || cLoad) return;
    const updated = [...msgs, { role: "user", content: input }];
    setMsgs(updated); setInput(""); setCLoad(true);
    try {
      const reply = await tutorChat(updated, lang.english, topic);
      setMsgs((p) => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Connection issue — please try again." }]);
    }
    setCLoad(false);
  };

  const handleSpeak = (text, idx) => { setSpeaking(idx); speakEnglish(text, () => setSpeaking(null)); };

  return (
    <>
      <style>{CSS}</style>
      <div className="la">
        <div className="la-orb la-o1" /><div className="la-orb la-o2" />

        {view === "welcome" && (
          <div className="la-page la-fade">
            <div className="la-wrap">
              <div className="la-hero">
                <h1>Lingua<em>AI</em></h1>
                <p>{DEFAULT_T.tagline}</p>
                <div className="la-eyebrow">{DEFAULT_T.pickLang}</div>
              </div>
              <div className="la-lgrid">
                {LANGUAGES.map((l) => (
                  <div key={l.code} className="la-lcard" onClick={() => pickLang(l)}>
                    <span className="la-flag">{l.flag}</span>
                    <span className="la-lnative">{l.native}</span>
                    <span className="la-len">{l.english}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "home" && lang && (
          <div className="la-page">
            <nav className="la-nav">
              <div className="la-logo">LinguaAI</div>
              <div className="la-chip" onClick={() => setView("welcome")}>{lang.flag} {lang.native}</div>
            </nav>
            <div className="la-wrap la-fade">
              <div className="la-hint"><h2>{tr.greeting}</h2><p>{tr.tagline}</p></div>
              <div className="la-eyebrow">CHOOSE A CATEGORY</div>
              <div className="la-cgrid">
                {CATEGORIES.map((c, i) => (
                  <div key={c.id} className="la-ccard" style={{ borderColor: c.color + "1a" }} onClick={() => pickCat(c)}>
                    <div className="la-cline" style={{ background: `linear-gradient(90deg,${c.color},transparent)` }} />
                    <span className="la-cicon">{c.icon}</span>
                    <div className="la-cname">{tr.catNames[i]}</div>
                    <div className="la-csub">{c.topics.length} topics</div>
                    <span className="la-carr" style={{ color: c.color }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "topics" && lang && cat && (
          <div className="la-page">
            <nav className="la-nav">
              <button className="la-back" onClick={() => setView("home")}>← {tr.back}</button>
              <div className="la-chip">{lang.flag} {lang.native}</div>
            </nav>
            <div className="la-wrap la-fade">
              <div className="la-thead">
                <div className="la-eyebrow" style={{ color: cat.color }}>{cat.icon} {tr.catNames[catIdx(cat)]}</div>
                <h2>{tr.topicsLabel}</h2>
              </div>
              <div className="la-tlist">
                {cat.topics.map((tp) => (
                  <div key={tp} className="la-titem" onClick={() => startLesson(tp)}>
                    <span className="la-tname">{tp}</span>
                    <span className="la-tarr">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "lesson" && lang && cat && topic && (
          <div className="la-page">
            <nav className="la-nav">
              <button className="la-back" onClick={() => setView("topics")}>← {tr.back}</button>
              <div className="la-chip">{lang.flag} {lang.native}</div>
            </nav>
            <div className="la-wrap">
              <div className="la-lgrid2 la-fade">
                <div className="la-panel">
                  <div className="la-ph">
                    <div className="la-eyebrow" style={{ color: cat.color }}>{cat.icon} {topic}</div>
                    <h3>{lesson?.title || (lLoad ? "…" : topic)}</h3>
                  </div>
                  <div className="la-pb">
                    {lLoad && <div className="la-loading"><div className="la-dots"><div className="la-dot"/><div className="la-dot"/><div className="la-dot"/></div><div className="la-ltxt">{tr.loadingLesson}</div></div>}
                    {lErr && <p style={{ color:"#f87171", fontSize:"0.87rem" }}>{lErr}</p>}
                    {lesson && !lLoad && (
                      <>
                        <p className="la-intro">{lesson.intro}</p>
                        {lesson.phrases?.map((ph, i) => (
                          <div key={i} className="la-phrase">
                            <div className="la-ptxt">
                              <div className="la-pen">{ph.english}</div>
                              <div className="la-ptr">{ph.translation}</div>
                              {ph.note && <div className="la-pnote">{ph.note}</div>}
                            </div>
                            <button className={`la-sbtn${speaking === i ? " on" : ""}`} onClick={() => handleSpeak(ph.english, i)}>
                              {speaking === i ? tr.listening : "🔊 " + tr.listen}
                            </button>
                          </div>
                        ))}
                        {lesson.tip && <div className="la-tip"><strong>{tr.tipLabel}: </strong>{lesson.tip}</div>}
                        {lesson.exercise && <div className="la-ex"><strong>{tr.practiceLabel}: </strong>{lesson.exercise}</div>}
                      </>
                    )}
                  </div>
                </div>
                <div className="la-panel">
                  <div className="la-ph"><h3>🤖 {lang.native} Tutor</h3></div>
                  <div className="la-msgs">
                    {msgs.map((m, i) => (
                      <div key={i} className={`la-msg ${m.role}`}>
                        <div className="la-bbl">{m.content}</div>
                      </div>
                    ))}
                    {cLoad && <div className="la-msg assistant"><div className="la-bbl"><div className="la-typing"><div className="la-tdot"/><div className="la-tdot"/><div className="la-tdot"/></div></div></div>}
                    <div ref={bottomRef} />
                  </div>
                  <div className="la-cfoot">
                    <input className="la-cinput" placeholder={tr.chatPlaceholder} value={input}
                      onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                    <button className="la-csend" onClick={sendChat} disabled={cLoad || !input.trim()}>{tr.send}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
