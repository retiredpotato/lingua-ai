import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signUpWithEmail, signInWithEmail, logOut, getOrCreateUser, saveLesson, saveTopicVisit, saveChatMessage, getUserProgress } from "./firebase";

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
  es: { tagline:"Tu tutor personal de inglés con IA",pickLang:"Elige tu idioma para comenzar",greeting:"¡Bienvenido de nuevo",catNames:["Inglés de Negocios","Inglés General","Gramática","Vocabulario","Pronunciación","Conversación"],topicsLabel:"Temas disponibles",loadingLesson:"Preparando tu lección...",chatPlaceholder:"Pregunta algo en español...",send:"Enviar",back:"Volver",tutorWelcome:"¡Hola! Soy tu tutor de inglés. ¿Tienes alguna pregunta?",listen:"Escuchar",listening:"Reproduciendo...",tipLabel:"💡 Consejo",practiceLabel:"✏️ Práctica",loginTitle:"Inicia sesión para continuar",loginSub:"Guarda tu progreso y rachas",emailLabel:"Correo",passLabel:"Contraseña",nameLabel:"Tu nombre",loginBtn:"Iniciar sesión",signupBtn:"Crear cuenta",googleBtn:"Continuar con Google",noAccount:"¿No tienes cuenta?",hasAccount:"¿Ya tienes cuenta?",streakLabel:"Racha",lessonsLabel:"Lecciones",topicsLabel2:"Temas",progressTitle:"Tu progreso" },
  fr: { tagline:"Votre tuteur personnel d'anglais avec IA",pickLang:"Choisissez votre langue",greeting:"Bienvenue",catNames:["Anglais des Affaires","Anglais Général","Grammaire","Vocabulaire","Prononciation","Conversation"],topicsLabel:"Sujets disponibles",loadingLesson:"Préparation de votre leçon...",chatPlaceholder:"Posez une question en français...",send:"Envoyer",back:"Retour",tutorWelcome:"Bonjour! Je suis votre tuteur d'anglais. Avez-vous des questions?",listen:"Écouter",listening:"Lecture...",tipLabel:"💡 Conseil",practiceLabel:"✏️ Pratique",loginTitle:"Connectez-vous pour continuer",loginSub:"Sauvegardez vos progrès",emailLabel:"Email",passLabel:"Mot de passe",nameLabel:"Votre nom",loginBtn:"Se connecter",signupBtn:"Créer un compte",googleBtn:"Continuer avec Google",noAccount:"Pas de compte?",hasAccount:"Déjà un compte?",streakLabel:"Série",lessonsLabel:"Leçons",topicsLabel2:"Sujets",progressTitle:"Vos progrès" },
  pt: { tagline:"Seu tutor pessoal de inglês com IA",pickLang:"Escolha seu idioma",greeting:"Bem-vindo",catNames:["Inglês nos Negócios","Inglês Geral","Gramática","Vocabulário","Pronúncia","Conversação"],topicsLabel:"Tópicos disponíveis",loadingLesson:"Preparando sua aula...",chatPlaceholder:"Faça uma pergunta em português...",send:"Enviar",back:"Voltar",tutorWelcome:"Olá! Sou seu tutor de inglês. Tem alguma dúvida?",listen:"Ouvir",listening:"Reproduzindo...",tipLabel:"💡 Dica",practiceLabel:"✏️ Prática",loginTitle:"Entre para continuar",loginSub:"Salve seu progresso",emailLabel:"Email",passLabel:"Senha",nameLabel:"Seu nome",loginBtn:"Entrar",signupBtn:"Criar conta",googleBtn:"Continuar com Google",noAccount:"Não tem conta?",hasAccount:"Já tem conta?",streakLabel:"Sequência",lessonsLabel:"Lições",topicsLabel2:"Tópicos",progressTitle:"Seu progresso" },
  de: { tagline:"Dein persönlicher KI-Englischlehrer",pickLang:"Wähle deine Sprache",greeting:"Willkommen zurück",catNames:["Business-Englisch","Allgemeines Englisch","Grammatik","Wortschatz","Aussprache","Konversation"],topicsLabel:"Verfügbare Themen",loadingLesson:"Lektion wird vorbereitet...",chatPlaceholder:"Stell eine Frage auf Deutsch...",send:"Senden",back:"Zurück",tutorWelcome:"Hallo! Ich bin dein Englischlehrer. Hast du Fragen?",listen:"Anhören",listening:"Wird abgespielt...",tipLabel:"💡 Tipp",practiceLabel:"✏️ Übung",loginTitle:"Anmelden um fortzufahren",loginSub:"Speichere deinen Fortschritt",emailLabel:"E-Mail",passLabel:"Passwort",nameLabel:"Dein Name",loginBtn:"Anmelden",signupBtn:"Konto erstellen",googleBtn:"Mit Google fortfahren",noAccount:"Kein Konto?",hasAccount:"Schon ein Konto?",streakLabel:"Streak",lessonsLabel:"Lektionen",topicsLabel2:"Themen",progressTitle:"Dein Fortschritt" },
  it: { tagline:"Il tuo tutor personale di inglese con IA",pickLang:"Scegli la tua lingua",greeting:"Bentornato",catNames:["Inglese per il Lavoro","Inglese Generale","Grammatica","Vocabolario","Pronuncia","Conversazione"],topicsLabel:"Argomenti disponibili",loadingLesson:"Preparazione della lezione...",chatPlaceholder:"Fai una domanda in italiano...",send:"Invia",back:"Indietro",tutorWelcome:"Ciao! Sono il tuo tutor di inglese. Hai domande?",listen:"Ascolta",listening:"In riproduzione...",tipLabel:"💡 Suggerimento",practiceLabel:"✏️ Esercizio",loginTitle:"Accedi per continuare",loginSub:"Salva i tuoi progressi",emailLabel:"Email",passLabel:"Password",nameLabel:"Il tuo nome",loginBtn:"Accedi",signupBtn:"Crea account",googleBtn:"Continua con Google",noAccount:"Non hai un account?",hasAccount:"Hai già un account?",streakLabel:"Serie",lessonsLabel:"Lezioni",topicsLabel2:"Argomenti",progressTitle:"I tuoi progressi" },
  zh: { tagline:"您的个人AI英语教师",pickLang:"选择您的语言开始",greeting:"欢迎回来",catNames:["商务英语","通用英语","语法","词汇","发音","会话"],topicsLabel:"可用主题",loadingLesson:"正在准备您的课程...",chatPlaceholder:"用中文提问...",send:"发送",back:"返回",tutorWelcome:"你好！我是您的英语老师。有什么问题吗？",listen:"听",listening:"播放中...",tipLabel:"💡 提示",practiceLabel:"✏️ 练习",loginTitle:"登录以继续",loginSub:"保存您的进度",emailLabel:"邮箱",passLabel:"密码",nameLabel:"您的姓名",loginBtn:"登录",signupBtn:"创建账户",googleBtn:"使用Google继续",noAccount:"没有账户？",hasAccount:"已有账户？",streakLabel:"连续",lessonsLabel:"课程",topicsLabel2:"主题",progressTitle:"您的进度" },
  ar: { tagline:"معلمك الشخصي للغة الإنجليزية",pickLang:"اختر لغتك للبدء",greeting:"مرحباً بعودتك",catNames:["الإنجليزية التجارية","الإنجليزية العامة","القواعد","المفردات","النطق","المحادثة"],topicsLabel:"المواضيع المتاحة",loadingLesson:"جارٍ تحضير درسك...",chatPlaceholder:"اطرح سؤالاً بالعربية...",send:"إرسال",back:"رجوع",tutorWelcome:"مرحباً! أنا معلمك للغة الإنجليزية. هل لديك أسئلة؟",listen:"استمع",listening:"جارٍ التشغيل...",tipLabel:"💡 نصيحة",practiceLabel:"✏️ تمرين",loginTitle:"سجل الدخول للمتابعة",loginSub:"احفظ تقدمك",emailLabel:"البريد الإلكتروني",passLabel:"كلمة المرور",nameLabel:"اسمك",loginBtn:"تسجيل الدخول",signupBtn:"إنشاء حساب",googleBtn:"المتابعة مع Google",noAccount:"ليس لديك حساب؟",hasAccount:"لديك حساب؟",streakLabel:"السلسلة",lessonsLabel:"الدروس",topicsLabel2:"المواضيع",progressTitle:"تقدمك" },
  ja: { tagline:"AIによるあなた専用の英語チューター",pickLang:"言語を選んで始めましょう",greeting:"おかえりなさい",catNames:["ビジネス英語","一般英語","文法","語彙","発音","会話"],topicsLabel:"利用可能なトピック",loadingLesson:"レッスンを準備中...",chatPlaceholder:"日本語で質問してください...",send:"送信",back:"戻る",tutorWelcome:"こんにちは！英語チューターです。質問はありますか？",listen:"聴く",listening:"再生中...",tipLabel:"💡 ヒント",practiceLabel:"✏️ 練習",loginTitle:"続けるにはログイン",loginSub:"進捗を保存",emailLabel:"メール",passLabel:"パスワード",nameLabel:"お名前",loginBtn:"ログイン",signupBtn:"アカウント作成",googleBtn:"Googleで続ける",noAccount:"アカウントなし？",hasAccount:"アカウントをお持ちですか？",streakLabel:"連続",lessonsLabel:"レッスン",topicsLabel2:"トピック",progressTitle:"あなたの進捗" },
  hi: { tagline:"आपका व्यक्तिगत AI अंग्रेज़ी शिक्षक",pickLang:"शुरू करने के लिए भाषा चुनें",greeting:"वापसी पर स्वागत",catNames:["बिज़नेस अंग्रेज़ी","सामान्य अंग्रेज़ी","व्याकरण","शब्द भंडार","उच्चारण","बातचीत"],topicsLabel:"उपलब्ध विषय",loadingLesson:"आपका पाठ तैयार हो रहा है...",chatPlaceholder:"हिंदी में प्रश्न पूछें...",send:"भेजें",back:"वापस",tutorWelcome:"नमस्ते! मैं आपका अंग्रेज़ी शिक्षक हूँ। कोई प्रश्न है?",listen:"सुनें",listening:"चल रहा है...",tipLabel:"💡 सुझाव",practiceLabel:"✏️ अभ्यास",loginTitle:"जारी रखने के लिए लॉग इन करें",loginSub:"अपनी प्रगति सहेजें",emailLabel:"ईमेल",passLabel:"पासवर्ड",nameLabel:"आपका नाम",loginBtn:"लॉग इन",signupBtn:"खाता बनाएं",googleBtn:"Google से जारी रखें",noAccount:"खाता नहीं है?",hasAccount:"पहले से खाता है?",streakLabel:"स्ट्रीक",lessonsLabel:"पाठ",topicsLabel2:"विषय",progressTitle:"आपकी प्रगति" },
  ru: { tagline:"Ваш личный ИИ-репетитор по английскому",pickLang:"Выберите язык для начала",greeting:"Добро пожаловать",catNames:["Деловой английский","Общий английский","Грамматика","Словарный запас","Произношение","Разговор"],topicsLabel:"Доступные темы",loadingLesson:"Подготовка урока...",chatPlaceholder:"Задайте вопрос на русском...",send:"Отправить",back:"Назад",tutorWelcome:"Привет! Я ваш репетитор. Есть вопросы?",listen:"Слушать",listening:"Воспроизведение...",tipLabel:"💡 Совет",practiceLabel:"✏️ Упражнение",loginTitle:"Войдите чтобы продолжить",loginSub:"Сохраняйте прогресс",emailLabel:"Email",passLabel:"Пароль",nameLabel:"Ваше имя",loginBtn:"Войти",signupBtn:"Создать аккаунт",googleBtn:"Продолжить с Google",noAccount:"Нет аккаунта?",hasAccount:"Уже есть аккаунт?",streakLabel:"Серия",lessonsLabel:"Уроки",topicsLabel2:"Темы",progressTitle:"Ваш прогресс" },
  ko: { tagline:"당신의 개인 AI 영어 튜터",pickLang:"언어를 선택하세요",greeting:"다시 오셨군요",catNames:["비즈니스 영어","일반 영어","문법","어휘","발음","회화"],topicsLabel:"이용 가능한 주제",loadingLesson:"수업을 준비하는 중...",chatPlaceholder:"한국어로 질문하세요...",send:"보내기",back:"뒤로",tutorWelcome:"안녕하세요! 영어 튜터입니다. 질문이 있으신가요?",listen:"듣기",listening:"재생 중...",tipLabel:"💡 팁",practiceLabel:"✏️ 연습",loginTitle:"계속하려면 로그인하세요",loginSub:"진행 상황을 저장하세요",emailLabel:"이메일",passLabel:"비밀번호",nameLabel:"이름",loginBtn:"로그인",signupBtn:"계정 만들기",googleBtn:"Google로 계속",noAccount:"계정이 없으신가요?",hasAccount:"이미 계정이 있으신가요?",streakLabel:"연속",lessonsLabel:"수업",topicsLabel2:"주제",progressTitle:"나의 진행 상황" },
  tr: { tagline:"Kişisel yapay zeka İngilizce öğretmeniniz",pickLang:"Dilinizi seçin",greeting:"Tekrar hoş geldiniz",catNames:["İş İngilizcesi","Genel İngilizce","Gramer","Kelime Bilgisi","Telaffuz","Konuşma"],topicsLabel:"Mevcut konular",loadingLesson:"Dersiniz hazırlanıyor...",chatPlaceholder:"Türkçe soru sorun...",send:"Gönder",back:"Geri",tutorWelcome:"Merhaba! İngilizce öğretmeninizim. Sorularınız var mı?",listen:"Dinle",listening:"Çalınıyor...",tipLabel:"💡 İpucu",practiceLabel:"✏️ Alıştırma",loginTitle:"Devam etmek için giriş yapın",loginSub:"İlerlemenizi kaydedin",emailLabel:"E-posta",passLabel:"Şifre",nameLabel:"Adınız",loginBtn:"Giriş yap",signupBtn:"Hesap oluştur",googleBtn:"Google ile devam et",noAccount:"Hesabınız yok mu?",hasAccount:"Zaten hesabınız var mı?",streakLabel:"Seri",lessonsLabel:"Dersler",topicsLabel2:"Konular",progressTitle:"İlerlemeniz" },
};

const DEFAULT_T = {
  tagline:"Your personal AI English tutor",pickLang:"Choose your language to begin",greeting:"Welcome back",
  catNames:["Business English","General English","Grammar","Vocabulary","Pronunciation","Conversation"],
  topicsLabel:"Available topics",loadingLesson:"Preparing your lesson...",chatPlaceholder:"Ask your tutor a question...",
  send:"Send",back:"Back",tutorWelcome:"Hello! I'm your English tutor. Do you have any questions?",
  listen:"Listen",listening:"Playing...",tipLabel:"💡 Tip",practiceLabel:"✏️ Practice",
  loginTitle:"Sign in to continue",loginSub:"Save your progress and learning streaks",
  emailLabel:"Email",passLabel:"Password",nameLabel:"Your name",
  loginBtn:"Sign in",signupBtn:"Create account",googleBtn:"Continue with Google",
  noAccount:"No account?",hasAccount:"Already have an account?",
  streakLabel:"Streak",lessonsLabel:"Lessons",topicsLabel2:"Topics",progressTitle:"Your progress",
};

const getT = (lang) => (lang ? { ...DEFAULT_T, ...(TRANSLATIONS[lang.code] || {}) } : DEFAULT_T);

const CATEGORIES = [
  { id:"business", icon:"💼", color:"#10e8b5", topics:["Professional Emails","Meeting Vocabulary","Presentations","Negotiations","Job Interviews","Phone Calls","Networking"] },
  { id:"general",  icon:"🌍", color:"#f59e0b", topics:["Daily Conversations","Shopping & Services","Travel & Directions","Healthcare","Dining Out","Making Friends"] },
  { id:"grammar",  icon:"📐", color:"#8b5cf6", topics:["Verb Tenses","Articles & Prepositions","Conditional Sentences","Modal Verbs","Passive Voice","Reported Speech"] },
  { id:"vocabulary",icon:"📚",color:"#ec4899", topics:["Common Idioms","Phrasal Verbs","Business Terms","Collocations","Academic Words","Slang & Informal"] },
  { id:"pronunciation",icon:"🎙️",color:"#38bdf8",topics:["Vowel Sounds","Consonant Sounds","Word Stress","Sentence Intonation","Connected Speech"] },
  { id:"conversation",icon:"💬",color:"#fb923c",topics:["Small Talk","Storytelling","Expressing Opinions","Making Requests","Apologizing Politely"] },
];

async function callAI(system, messages) {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ system, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

async function generateLesson(topic, categoryId, langName) {
  const text = await callAI(
    `You are an expert English teacher. Student's native language: ${langName}.
Respond ONLY with valid JSON, no markdown, no backticks:
{"title":"in ${langName}","intro":"2-3 sentences in ${langName}","phrases":[{"english":"phrase","translation":"in ${langName}","note":"tip in ${langName}"}],"tip":"grammar tip in ${langName}","exercise":"exercise in ${langName}"}
Include exactly 5-6 phrases.`,
    [{ role:"user", content:`Create a ${categoryId} English lesson about: ${topic}` }]
  );
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

async function tutorChat(messages, langName, topic) {
  return callAI(
    `You are a warm English tutor for a ${langName} speaker studying "${topic}". Always respond in ${langName} with English examples. Max 4 sentences.`,
    messages.map((m) => ({ role: m.role==="assistant"?"assistant":"user", content: m.content }))
  );
}

function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  const checks = [
    (v) => /natural/i.test(v.name) && /en/i.test(v.lang),
    (v) => /microsoft.*aria|microsoft.*jenny|microsoft.*guy/i.test(v.name),
    (v) => /microsoft/i.test(v.name) && /en[-_]US/i.test(v.lang),
    (v) => /samantha/i.test(v.name) && v.localService,
    (v) => /(enhanced|premium)/i.test(v.name) && /en[-_]US/i.test(v.lang),
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
    u.lang="en-US"; u.rate=0.78; u.pitch=1.0; u.volume=1.0;
    u.onend=onEnd; u.onerror=onEnd;
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length===0
    ? (window.speechSynthesis.onvoiceschanged=go) : go();
}

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
.la-navr{display:flex;align-items:center;gap:10px;}
.la-chip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);padding:6px 15px;border-radius:20px;font-size:0.82rem;cursor:pointer;transition:background 0.2s;}
.la-chip:hover{background:rgba(255,255,255,0.09);}
.la-logout{background:none;border:1px solid rgba(255,255,255,0.1);color:#4d6882;font-family:'Outfit',sans-serif;font-size:0.78rem;padding:6px 12px;border-radius:20px;cursor:pointer;transition:all 0.2s;}
.la-logout:hover{color:#f87171;border-color:rgba(248,113,113,0.3);}
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
.la-authbox{max-width:420px;margin:0 auto;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;}
.la-authbox h2{font-size:1.35rem;font-weight:700;margin-bottom:6px;}
.la-authbox p{color:#4d6882;font-size:0.85rem;margin-bottom:24px;line-height:1.65;}
.la-label{font-size:0.78rem;color:#4d6882;margin-bottom:5px;display:block;}
.la-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:11px 15px;color:#e4edf8;font-family:'Outfit',sans-serif;font-size:0.88rem;outline:none;margin-bottom:14px;transition:border-color 0.2s;}
.la-input:focus{border-color:rgba(16,232,181,0.5);}
.la-input::placeholder{color:#1e334a;}
.la-abtn{width:100%;border:none;border-radius:10px;padding:12px;font-family:'Outfit',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;transition:all 0.18s;margin-bottom:10px;}
.la-abtn.primary{background:#10e8b5;color:#051510;}
.la-abtn.primary:hover{background:#0dd4a4;}
.la-abtn.google{background:rgba(255,255,255,0.06);color:#e4edf8;border:1px solid rgba(255,255,255,0.12);}
.la-abtn.google:hover{background:rgba(255,255,255,0.1);}
.la-abtn:disabled{opacity:0.35;cursor:not-allowed;}
.la-autherr{color:#f87171;font-size:0.8rem;margin-bottom:10px;}
.la-authswitch{text-align:center;font-size:0.8rem;color:#2e4560;margin-top:8px;}
.la-authswitch span{color:#38bdf8;cursor:pointer;}
.la-authswitch span:hover{text-decoration:underline;}
.la-divider{display:flex;align-items:center;gap:10px;margin:14px 0;color:#1e334a;font-size:0.75rem;}
.la-divider::before,.la-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.07);}
.la-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px;}
.la-stat{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px;text-align:center;}
.la-stat-val{font-size:1.8rem;font-weight:800;background:linear-gradient(135deg,#10e8b5,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.la-stat-lbl{font-size:0.72rem;color:#3d5570;margin-top:3px;text-transform:uppercase;letter-spacing:0.1em;}
.la-hint{padding:24px 0 20px;}
.la-hint h2{font-size:1.5rem;font-weight:700;margin-bottom:4px;}
.la-hint p{color:#4d6882;font-size:0.88rem;}
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
.la-titem.done{border-color:rgba(16,232,181,0.25);background:rgba(16,232,181,0.04);}
.la-titem:hover{background:rgba(255,255,255,0.055);transform:translateX(6px);}
.la-tname{font-size:0.94rem;font-weight:500;}
.la-tdone{font-size:0.7rem;color:#10e8b5;margin-top:2px;}
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
.la-dot:nth-child(1){background:#10e8b5;}.la-dot:nth-child(2){background:#38bdf8;animation-delay:0.18s;}.la-dot:nth-child(3){background:#8b5cf6;animation-delay:0.36s;}
@keyframes la-bounce{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-9px);opacity:1;}}
.la-ltxt{font-size:0.84rem;color:#3d5570;}
.la-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:200px;max-height:340px;scrollbar-width:thin;scrollbar-color:#1a2d42 transparent;}
.la-msg{max-width:88%;}.la-msg.user{align-self:flex-end;}.la-msg.assistant{align-self:flex-start;}
.la-bbl{padding:9px 13px;border-radius:13px;font-size:0.83rem;line-height:1.62;}
.user .la-bbl{background:#10e8b5;color:#051510;font-weight:500;border-bottom-right-radius:4px;}
.assistant .la-bbl{background:rgba(255,255,255,0.055);border:1px solid rgba(255,255,255,0.09);color:#cde0f4;border-bottom-left-radius:4px;}
.la-typing{display:flex;gap:4px;padding:2px 4px;align-items:center;}
.la-tdot{width:6px;height:6px;border-radius:50%;background:#2e4560;animation:la-bounce 1s ease-in-out infinite;}
.la-tdot:nth-child(2){animation-delay:0.14s;}.la-tdot:nth-child(3){animation-delay:0.28s;}
.la-cfoot{padding:12px 14px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;}
.la-cinput{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:9px;padding:9px 13px;color:#e4edf8;font-family:'Outfit',sans-serif;font-size:0.82rem;outline:none;transition:border-color 0.2s;}
.la-cinput:focus{border-color:rgba(16,232,181,0.4);}.la-cinput::placeholder{color:#1e334a;}
.la-csend{background:#10e8b5;color:#051510;border:none;border-radius:9px;padding:9px 16px;font-family:'Outfit',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;transition:background 0.18s;white-space:nowrap;}
.la-csend:hover{background:#0dd4a4;}.la-csend:disabled{opacity:0.35;cursor:not-allowed;}
.la-fade{animation:la-fi 0.35s ease;}
@keyframes la-fi{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
`;

export default function LinguaAI() {
  const [view,setView]=useState("welcome");
  const [lang,setLang]=useState(null);
  const [user,setUser]=useState(null);
  const [progress,setProgress]=useState(null);
  const [authMode,setAuthMode]=useState("login");
  const [authEmail,setAuthEmail]=useState("");
  const [authPass,setAuthPass]=useState("");
  const [authName,setAuthName]=useState("");
  const [authErr,setAuthErr]=useState("");
  const [authLoad,setAuthLoad]=useState(false);
  const [cat,setCat]=useState(null);
  const [topic,setTopic]=useState(null);
  const [lesson,setLesson]=useState(null);
  const [lLoad,setLLoad]=useState(false);
  const [lErr,setLErr]=useState("");
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [cLoad,setCLoad]=useState(false);
  const [speaking,setSpeaking]=useState(null);
  const bottomRef=useRef(null);

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async(u)=>{
      setUser(u);
      if(u){
        const langCode=localStorage.getItem("lingua_lang")||"es";
        const l=LANGUAGES.find((x)=>x.code===langCode)||LANGUAGES[0];
        setLang(l);
        const p=await getOrCreateUser(u,l.code);
        setProgress(p);
        setView("home");
      }
    });
    return unsub;
  },[]);

  const tr=getT(lang);
  const catIdx=(c)=>CATEGORIES.findIndex((x)=>x.id===c?.id);
  const completedLessons=progress?.completedLessons||[];

  const pickLang=(l)=>{setLang(l);localStorage.setItem("lingua_lang",l.code);setView(user?"home":"auth");};

  const handleGoogleAuth=async()=>{
    setAuthLoad(true);setAuthErr("");
    try{const cred=await signInWithGoogle();const p=await getOrCreateUser(cred.user,lang.code);setProgress(p);setView("home");}
    catch(e){setAuthErr(e.message);}
    setAuthLoad(false);
  };

  const handleEmailAuth=async()=>{
    setAuthLoad(true);setAuthErr("");
    try{
      let cred;
      if(authMode==="signup"){
        if(!authName.trim()){setAuthErr("Please enter your name.");setAuthLoad(false);return;}
        cred=await signUpWithEmail(authEmail,authPass,authName);
      }else{cred=await signInWithEmail(authEmail,authPass);}
      const p=await getOrCreateUser(cred.user,lang.code);setProgress(p);setView("home");
    }catch(e){setAuthErr(e.message.replace("Firebase: ","").replace(/\(auth.*\)/,""));}
    setAuthLoad(false);
  };

  const handleLogout=async()=>{await logOut();setUser(null);setProgress(null);setView("welcome");setLang(null);};
  const pickCat=(c)=>{setCat(c);setView("topics");};

  const startLesson=async(tp)=>{
    setTopic(tp);setView("lesson");setLesson(null);setLErr("");setLLoad(true);
    setMsgs([{role:"assistant",content:tr.tutorWelcome}]);
    if(user)saveTopicVisit(user.uid,tp);
    try{setLesson(await generateLesson(tp,cat.id,lang.english));}
    catch(e){setLErr(e.message||"Could not load lesson.");}
    setLLoad(false);
  };

  const finishLesson=async()=>{
    if(user&&topic&&cat){await saveLesson(user.uid,topic,cat.id);const p=await getUserProgress(user.uid);setProgress(p);}
  };
  useEffect(()=>{if(lesson&&user)finishLesson();},[lesson]);

  const sendChat=async()=>{
    if(!input.trim()||cLoad)return;
    const updated=[...msgs,{role:"user",content:input}];
    setMsgs(updated);setInput("");setCLoad(true);
    if(user)saveChatMessage(user.uid,topic,"user",input);
    try{
      const reply=await tutorChat(updated,lang.english,topic);
      setMsgs((p)=>[...p,{role:"assistant",content:reply}]);
      if(user)saveChatMessage(user.uid,topic,"assistant",reply);
    }catch{setMsgs((p)=>[...p,{role:"assistant",content:"Connection issue — please try again."}]);}
    setCLoad(false);
  };

  const handleSpeak=(text,idx)=>{setSpeaking(idx);speakEnglish(text,()=>setSpeaking(null));};

  return(
    <><style>{CSS}</style>
    <div className="la">
      <div className="la-orb la-o1"/><div className="la-orb la-o2"/>

      {view==="welcome"&&(
        <div className="la-page la-fade"><div className="la-wrap">
          <div className="la-hero"><h1>Lingua<em>AI</em></h1><p>{DEFAULT_T.tagline}</p><div className="la-eyebrow">{DEFAULT_T.pickLang}</div></div>
          <div className="la-lgrid">{LANGUAGES.map((l)=>(<div key={l.code} className="la-lcard" onClick={()=>pickLang(l)}><span className="la-flag">{l.flag}</span><span className="la-lnative">{l.native}</span><span className="la-len">{l.english}</span></div>))}</div>
        </div></div>
      )}

      {view==="auth"&&lang&&(
        <div className="la-page la-fade">
          <nav className="la-nav"><button className="la-back" onClick={()=>setView("welcome")}>← {tr.back}</button><div className="la-chip">{lang.flag} {lang.native}</div></nav>
          <div className="la-wrap" style={{paddingTop:"64px"}}>
            <div className="la-authbox">
              <div style={{fontSize:"2.2rem",marginBottom:"14px"}}>🎓</div>
              <h2>{tr.loginTitle}</h2><p>{tr.loginSub}</p>
              <button className="la-abtn google" onClick={handleGoogleAuth} disabled={authLoad}>G &nbsp; {tr.googleBtn}</button>
              <div className="la-divider">or</div>
              {authMode==="signup"&&(<><label className="la-label">{tr.nameLabel}</label><input className="la-input" placeholder={tr.nameLabel} value={authName} onChange={(e)=>setAuthName(e.target.value)}/></>)}
              <label className="la-label">{tr.emailLabel}</label>
              <input className="la-input" type="email" placeholder={tr.emailLabel} value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)}/>
              <label className="la-label">{tr.passLabel}</label>
              <input className="la-input" type="password" placeholder={tr.passLabel} value={authPass} onChange={(e)=>setAuthPass(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleEmailAuth()}/>
              {authErr&&<div className="la-autherr">{authErr}</div>}
              <button className="la-abtn primary" onClick={handleEmailAuth} disabled={authLoad}>{authLoad?"...":authMode==="login"?tr.loginBtn:tr.signupBtn}</button>
              <div className="la-authswitch">{authMode==="login"?tr.noAccount:tr.hasAccount}{" "}<span onClick={()=>{setAuthMode(authMode==="login"?"signup":"login");setAuthErr("");}}>{authMode==="login"?tr.signupBtn:tr.loginBtn}</span></div>
            </div>
          </div>
        </div>
      )}

      {view==="home"&&lang&&user&&(
        <div className="la-page">
          <nav className="la-nav">
            <div className="la-logo">LinguaAI</div>
            <div className="la-navr"><div className="la-chip" onClick={()=>setView("welcome")}>{lang.flag} {lang.native}</div><button className="la-logout" onClick={handleLogout}>Sign out</button></div>
          </nav>
          <div className="la-wrap la-fade">
            <div className="la-hint"><h2>{tr.greeting}, {user.displayName?.split(" ")[0]||"there"}!</h2><p>{tr.tagline}</p></div>
            {progress&&(<div className="la-stats">
              <div className="la-stat"><div className="la-stat-val">🔥{progress.streak||1}</div><div className="la-stat-lbl">{tr.streakLabel}</div></div>
              <div className="la-stat"><div className="la-stat-val">{progress.totalLessons||0}</div><div className="la-stat-lbl">{tr.lessonsLabel}</div></div>
              <div className="la-stat"><div className="la-stat-val">{progress.totalTopics||0}</div><div className="la-stat-lbl">{tr.topicsLabel2}</div></div>
            </div>)}
            <div className="la-eyebrow">CHOOSE A CATEGORY</div>
            <div className="la-cgrid">{CATEGORIES.map((c,i)=>(
              <div key={c.id} className="la-ccard" style={{borderColor:c.color+"1a"}} onClick={()=>pickCat(c)}>
                <div className="la-cline" style={{background:`linear-gradient(90deg,${c.color},transparent)`}}/>
                <span className="la-cicon">{c.icon}</span><div className="la-cname">{tr.catNames[i]}</div>
                <div className="la-csub">{c.topics.length} topics</div><span className="la-carr" style={{color:c.color}}>→</span>
              </div>
            ))}</div>
          </div>
        </div>
      )}

      {view==="topics"&&lang&&cat&&(
        <div className="la-page">
          <nav className="la-nav"><button className="la-back" onClick={()=>setView("home")}>← {tr.back}</button><div className="la-chip">{lang.flag} {lang.native}</div></nav>
          <div className="la-wrap la-fade">
            <div className="la-thead"><div className="la-eyebrow" style={{color:cat.color}}>{cat.icon} {tr.catNames[catIdx(cat)]}</div><h2>{tr.topicsLabel}</h2></div>
            <div className="la-tlist">{cat.topics.map((tp)=>{
              const done=completedLessons.includes(`${cat.id}:${tp}`);
              return(<div key={tp} className={`la-titem${done?" done":""}`} onClick={()=>startLesson(tp)}>
                <div><div className="la-tname">{tp}</div>{done&&<div className="la-tdone">✓ Completed</div>}</div>
                <span className="la-tarr">{done?"✓":"→"}</span>
              </div>);
            })}</div>
          </div>
        </div>
      )}

      {view==="lesson"&&lang&&cat&&topic&&(
        <div className="la-page">
          <nav className="la-nav"><button className="la-back" onClick={()=>setView("topics")}>← {tr.back}</button><div className="la-chip">{lang.flag} {lang.native}</div></nav>
          <div className="la-wrap"><div className="la-lgrid2 la-fade">
            <div className="la-panel">
              <div className="la-ph"><div className="la-eyebrow" style={{color:cat.color}}>{cat.icon} {topic}</div><h3>{lesson?.title||(lLoad?"…":topic)}</h3></div>
              <div className="la-pb">
                {lLoad&&<div className="la-loading"><div className="la-dots"><div className="la-dot"/><div className="la-dot"/><div className="la-dot"/></div><div className="la-ltxt">{tr.loadingLesson}</div></div>}
                {lErr&&<p style={{color:"#f87171",fontSize:"0.87rem"}}>{lErr}</p>}
                {lesson&&!lLoad&&(<>
                  <p className="la-intro">{lesson.intro}</p>
                  {lesson.phrases?.map((ph,i)=>(<div key={i} className="la-phrase">
                    <div className="la-ptxt"><div className="la-pen">{ph.english}</div><div className="la-ptr">{ph.translation}</div>{ph.note&&<div className="la-pnote">{ph.note}</div>}</div>
                    <button className={`la-sbtn${speaking===i?" on":""}`} onClick={()=>handleSpeak(ph.english,i)}>{speaking===i?tr.listening:"🔊 "+tr.listen}</button>
                  </div>))}
                  {lesson.tip&&<div className="la-tip"><strong>{tr.tipLabel}: </strong>{lesson.tip}</div>}
                  {lesson.exercise&&<div className="la-ex"><strong>{tr.practiceLabel}: </strong>{lesson.exercise}</div>}
                </>)}
              </div>
            </div>
            <div className="la-panel">
              <div className="la-ph"><h3>🤖 {lang.native} Tutor</h3></div>
              <div className="la-msgs">
                {msgs.map((m,i)=>(<div key={i} className={`la-msg ${m.role}`}><div className="la-bbl">{m.content}</div></div>))}
                {cLoad&&<div className="la-msg assistant"><div className="la-bbl"><div className="la-typing"><div className="la-tdot"/><div className="la-tdot"/><div className="la-tdot"/></div></div></div>}
                <div ref={bottomRef}/>
              </div>
              <div className="la-cfoot">
                <input className="la-cinput" placeholder={tr.chatPlaceholder} value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&sendChat()}/>
                <button className="la-csend" onClick={sendChat} disabled={cLoad||!input.trim()}>{tr.send}</button>
              </div>
            </div>
          </div></div>
        </div>
      )}
    </div></>
  );
}
