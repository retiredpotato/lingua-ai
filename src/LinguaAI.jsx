/* eslint-disable react-hooks/exhaustive-deps, no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, signUpWithEmail, signInWithEmail, logOut, getOrCreateUser, getUserProgress } from "./firebase";
import { getFirestore, doc, updateDoc, increment, arrayUnion, getDoc } from "firebase/firestore";

const db = getFirestore();

// ── Languages ──────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { code:"es",flag:"🇪🇸",native:"Español",  english:"Spanish"    },
  { code:"fr",flag:"🇫🇷",native:"Français", english:"French"     },
  { code:"pt",flag:"🇧🇷",native:"Português",english:"Portuguese" },
  { code:"de",flag:"🇩🇪",native:"Deutsch",  english:"German"     },
  { code:"it",flag:"🇮🇹",native:"Italiano", english:"Italian"    },
  { code:"zh",flag:"🇨🇳",native:"中文",      english:"Chinese"    },
  { code:"ar",flag:"🇸🇦",native:"العربية",  english:"Arabic"     },
  { code:"ja",flag:"🇯🇵",native:"日本語",    english:"Japanese"   },
  { code:"hi",flag:"🇮🇳",native:"हिन्दी",   english:"Hindi"      },
  { code:"ru",flag:"🇷🇺",native:"Русский",  english:"Russian"    },
  { code:"ko",flag:"🇰🇷",native:"한국어",    english:"Korean"     },
  { code:"tr",flag:"🇹🇷",native:"Türkçe",   english:"Turkish"    },
];

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  es:{tagline:"Tu tutor de inglés con IA",pick:"Elige tu idioma",greeting:"¡Hola",cats:["Negocios","General","Gramática","Vocabulario","Pronunciación","Conversación"],topics:"Temas",loading:"Generando ejercicios...",send:"Enviar",back:"Volver",login:"Iniciar sesión",signup:"Crear cuenta",google:"Continuar con Google",noAcc:"¿Sin cuenta?",hasAcc:"¿Ya tienes cuenta?",email:"Correo",pass:"Contraseña",name:"Nombre",loginTitle:"Bienvenido de nuevo",signupTitle:"Crea tu cuenta",streak:"Racha",lessons:"Lecciones",xp:"XP",level:"Nivel",correct:"¡Correcto!",wrong:"Respuesta incorrecta",check:"Comprobar",cont:"Continuar",skip:"Omitir",complete:"¡Lección completada!",earned:"XP ganados",nextLesson:"Siguiente lección",typeAnswer:"Escribe tu respuesta...",arrange:"Toca las palabras en orden",choose:"Elige la traducción correcta",hearts:"Vidas",startLesson:"Comenzar lección",chatPlaceholder:"Pregunta al tutor...",tutor:"Tutor"},
  fr:{tagline:"Votre tuteur d'anglais IA",pick:"Choisissez votre langue",greeting:"Bonjour",cats:["Affaires","Général","Grammaire","Vocabulaire","Prononciation","Conversation"],topics:"Sujets",loading:"Génération des exercices...",send:"Envoyer",back:"Retour",login:"Se connecter",signup:"Créer un compte",google:"Continuer avec Google",noAcc:"Pas de compte?",hasAcc:"Déjà un compte?",email:"Email",pass:"Mot de passe",name:"Nom",loginTitle:"Bon retour",signupTitle:"Créez votre compte",streak:"Série",lessons:"Leçons",xp:"XP",level:"Niveau",correct:"Correct!",wrong:"Mauvaise réponse",check:"Vérifier",cont:"Continuer",skip:"Passer",complete:"Leçon terminée!",earned:"XP gagnés",nextLesson:"Prochaine leçon",typeAnswer:"Écrivez votre réponse...",arrange:"Touchez les mots dans l'ordre",choose:"Choisissez la bonne traduction",hearts:"Vies",startLesson:"Commencer la leçon",chatPlaceholder:"Posez une question...",tutor:"Tuteur"},
  pt:{tagline:"Seu tutor de inglês com IA",pick:"Escolha seu idioma",greeting:"Olá",cats:["Negócios","Geral","Gramática","Vocabulário","Pronúncia","Conversação"],topics:"Tópicos",loading:"Gerando exercícios...",send:"Enviar",back:"Voltar",login:"Entrar",signup:"Criar conta",google:"Continuar com Google",noAcc:"Sem conta?",hasAcc:"Já tem conta?",email:"Email",pass:"Senha",name:"Nome",loginTitle:"Bem-vindo de volta",signupTitle:"Crie sua conta",streak:"Sequência",lessons:"Lições",xp:"XP",level:"Nível",correct:"Correto!",wrong:"Resposta errada",check:"Verificar",cont:"Continuar",skip:"Pular",complete:"Lição completa!",earned:"XP ganhos",nextLesson:"Próxima lição",typeAnswer:"Escreva sua resposta...",arrange:"Toque as palavras em ordem",choose:"Escolha a tradução correta",hearts:"Vidas",startLesson:"Começar lição",chatPlaceholder:"Pergunte ao tutor...",tutor:"Tutor"},
  de:{tagline:"Dein KI-Englischlehrer",pick:"Wähle deine Sprache",greeting:"Hallo",cats:["Business","Allgemein","Grammatik","Wortschatz","Aussprache","Konversation"],topics:"Themen",loading:"Übungen werden erstellt...",send:"Senden",back:"Zurück",login:"Anmelden",signup:"Konto erstellen",google:"Mit Google fortfahren",noAcc:"Kein Konto?",hasAcc:"Schon ein Konto?",email:"E-Mail",pass:"Passwort",name:"Name",loginTitle:"Willkommen zurück",signupTitle:"Konto erstellen",streak:"Streak",lessons:"Lektionen",xp:"XP",level:"Level",correct:"Richtig!",wrong:"Falsche Antwort",check:"Prüfen",cont:"Weiter",skip:"Überspringen",complete:"Lektion abgeschlossen!",earned:"XP verdient",nextLesson:"Nächste Lektion",typeAnswer:"Schreibe deine Antwort...",arrange:"Tippe die Wörter in der richtigen Reihenfolge",choose:"Wähle die richtige Übersetzung",hearts:"Leben",startLesson:"Lektion starten",chatPlaceholder:"Frage den Tutor...",tutor:"Tutor"},
  it:{tagline:"Il tuo tutor di inglese IA",pick:"Scegli la tua lingua",greeting:"Ciao",cats:["Lavoro","Generale","Grammatica","Vocabolario","Pronuncia","Conversazione"],topics:"Argomenti",loading:"Creazione esercizi...",send:"Invia",back:"Indietro",login:"Accedi",signup:"Crea account",google:"Continua con Google",noAcc:"Nessun account?",hasAcc:"Hai già un account?",email:"Email",pass:"Password",name:"Nome",loginTitle:"Bentornato",signupTitle:"Crea il tuo account",streak:"Serie",lessons:"Lezioni",xp:"XP",level:"Livello",correct:"Corretto!",wrong:"Risposta sbagliata",check:"Controlla",cont:"Continua",skip:"Salta",complete:"Lezione completata!",earned:"XP guadagnati",nextLesson:"Prossima lezione",typeAnswer:"Scrivi la tua risposta...",arrange:"Tocca le parole nell'ordine",choose:"Scegli la traduzione corretta",hearts:"Vite",startLesson:"Inizia lezione",chatPlaceholder:"Chiedi al tutor...",tutor:"Tutor"},
  zh:{tagline:"您的AI英语导师",pick:"选择您的语言",greeting:"你好",cats:["商务","通用","语法","词汇","发音","会话"],topics:"主题",loading:"正在生成练习...",send:"发送",back:"返回",login:"登录",signup:"创建账户",google:"使用Google继续",noAcc:"没有账户？",hasAcc:"已有账户？",email:"邮箱",pass:"密码",name:"姓名",loginTitle:"欢迎回来",signupTitle:"创建您的账户",streak:"连续",lessons:"课程",xp:"经验",level:"等级",correct:"正确！",wrong:"答案错误",check:"检查",cont:"继续",skip:"跳过",complete:"课程完成！",earned:"获得经验",nextLesson:"下一课",typeAnswer:"写下您的答案...",arrange:"按顺序点击单词",choose:"选择正确的翻译",hearts:"生命",startLesson:"开始课程",chatPlaceholder:"问老师...",tutor:"导师"},
  ar:{tagline:"مدرسك الشخصي للإنجليزية",pick:"اختر لغتك",greeting:"مرحباً",cats:["الأعمال","عام","قواعد","مفردات","نطق","محادثة"],topics:"المواضيع",loading:"جارٍ إنشاء التمارين...",send:"إرسال",back:"رجوع",login:"تسجيل الدخول",signup:"إنشاء حساب",google:"المتابعة مع Google",noAcc:"ليس لديك حساب؟",hasAcc:"لديك حساب؟",email:"البريد",pass:"كلمة المرور",name:"الاسم",loginTitle:"مرحباً بعودتك",signupTitle:"أنشئ حسابك",streak:"السلسلة",lessons:"الدروس",xp:"نقاط",level:"المستوى",correct:"صحيح!",wrong:"إجابة خاطئة",check:"تحقق",cont:"متابعة",skip:"تخطي",complete:"اكتملت الدرس!",earned:"نقاط مكتسبة",nextLesson:"الدرس التالي",typeAnswer:"اكتب إجابتك...",arrange:"انقر الكلمات بالترتيب",choose:"اختر الترجمة الصحيحة",hearts:"أرواح",startLesson:"ابدأ الدرس",chatPlaceholder:"اسأل المدرس...",tutor:"المدرس"},
  ja:{tagline:"AIによるあなたの英語コーチ",pick:"言語を選択",greeting:"こんにちは",cats:["ビジネス","一般","文法","語彙","発音","会話"],topics:"トピック",loading:"問題を作成中...",send:"送信",back:"戻る",login:"ログイン",signup:"アカウント作成",google:"Googleで続ける",noAcc:"アカウントなし？",hasAcc:"アカウントをお持ちですか？",email:"メール",pass:"パスワード",name:"名前",loginTitle:"おかえりなさい",signupTitle:"アカウントを作成",streak:"連続",lessons:"レッスン",xp:"XP",level:"レベル",correct:"正解！",wrong:"不正解",check:"確認",cont:"続ける",skip:"スキップ",complete:"レッスン完了！",earned:"獲得XP",nextLesson:"次のレッスン",typeAnswer:"答えを入力...",arrange:"順番に単語をタップ",choose:"正しい翻訳を選択",hearts:"ライフ",startLesson:"レッスン開始",chatPlaceholder:"チューターに質問...",tutor:"チューター"},
  hi:{tagline:"आपका AI अंग्रेज़ी कोच",pick:"अपनी भाषा चुनें",greeting:"नमस्ते",cats:["व्यापार","सामान्य","व्याकरण","शब्द","उच्चारण","बातचीत"],topics:"विषय",loading:"अभ्यास तैयार हो रहे हैं...",send:"भेजें",back:"वापस",login:"लॉग इन",signup:"खाता बनाएं",google:"Google से जारी रखें",noAcc:"खाता नहीं है?",hasAcc:"खाता है?",email:"ईमेल",pass:"पासवर्ड",name:"नाम",loginTitle:"वापसी पर स्वागत",signupTitle:"खाता बनाएं",streak:"स्ट्रीक",lessons:"पाठ",xp:"XP",level:"स्तर",correct:"सही!",wrong:"गलत जवाब",check:"जांचें",cont:"जारी रखें",skip:"छोड़ें",complete:"पाठ पूर्ण!",earned:"XP अर्जित",nextLesson:"अगला पाठ",typeAnswer:"अपना जवाब लिखें...",arrange:"शब्दों को क्रम में टैप करें",choose:"सही अनुवाद चुनें",hearts:"जीवन",startLesson:"पाठ शुरू करें",chatPlaceholder:"ट्यूटर से पूछें...",tutor:"ट्यूटर"},
  ru:{tagline:"Ваш ИИ-тренер по английскому",pick:"Выберите язык",greeting:"Привет",cats:["Бизнес","Общий","Грамматика","Словарь","Произношение","Разговор"],topics:"Темы",loading:"Создание упражнений...",send:"Отправить",back:"Назад",login:"Войти",signup:"Создать аккаунт",google:"Продолжить с Google",noAcc:"Нет аккаунта?",hasAcc:"Есть аккаунт?",email:"Email",pass:"Пароль",name:"Имя",loginTitle:"С возвращением",signupTitle:"Создайте аккаунт",streak:"Серия",lessons:"Уроки",xp:"XP",level:"Уровень",correct:"Правильно!",wrong:"Неверный ответ",check:"Проверить",cont:"Продолжить",skip:"Пропустить",complete:"Урок завершён!",earned:"Получено XP",nextLesson:"Следующий урок",typeAnswer:"Введите ответ...",arrange:"Нажимайте слова по порядку",choose:"Выберите правильный перевод",hearts:"Жизни",startLesson:"Начать урок",chatPlaceholder:"Спросите репетитора...",tutor:"Репетитор"},
  ko:{tagline:"당신의 AI 영어 코치",pick:"언어를 선택하세요",greeting:"안녕하세요",cats:["비즈니스","일반","문법","어휘","발음","회화"],topics:"주제",loading:"문제 생성 중...",send:"보내기",back:"뒤로",login:"로그인",signup:"계정 만들기",google:"Google로 계속",noAcc:"계정 없음?",hasAcc:"계정 있음?",email:"이메일",pass:"비밀번호",name:"이름",loginTitle:"다시 오셨군요",signupTitle:"계정 만들기",streak:"연속",lessons:"수업",xp:"XP",level:"레벨",correct:"정답!",wrong:"오답",check:"확인",cont:"계속",skip:"건너뛰기",complete:"수업 완료!",earned:"XP 획득",nextLesson:"다음 수업",typeAnswer:"답을 입력하세요...",arrange:"순서대로 단어를 눌러요",choose:"올바른 번역을 선택하세요",hearts:"생명",startLesson:"수업 시작",chatPlaceholder:"튜터에게 질문...",tutor:"튜터"},
  tr:{tagline:"AI İngilizce koçunuz",pick:"Dilinizi seçin",greeting:"Merhaba",cats:["İş","Genel","Gramer","Kelime","Telaffuz","Konuşma"],topics:"Konular",loading:"Alıştırmalar oluşturuluyor...",send:"Gönder",back:"Geri",login:"Giriş yap",signup:"Hesap oluştur",google:"Google ile devam et",noAcc:"Hesabınız yok mu?",hasAcc:"Hesabınız var mı?",email:"E-posta",pass:"Şifre",name:"İsim",loginTitle:"Tekrar hoş geldiniz",signupTitle:"Hesabınızı oluşturun",streak:"Seri",lessons:"Dersler",xp:"XP",level:"Seviye",correct:"Doğru!",wrong:"Yanlış cevap",check:"Kontrol et",cont:"Devam",skip:"Atla",complete:"Ders tamamlandı!",earned:"Kazanılan XP",nextLesson:"Sonraki ders",typeAnswer:"Cevabınızı yazın...",arrange:"Kelimelere sırayla dokunun",choose:"Doğru çeviriyi seçin",hearts:"Can",startLesson:"Dersi başlat",chatPlaceholder:"Öğretmene sor...",tutor:"Öğretmen"},
};

const DT = {tagline:"Your AI English coach",pick:"Choose your language",greeting:"Hello",cats:["Business","General","Grammar","Vocabulary","Pronunciation","Conversation"],topics:"Topics",loading:"Generating exercises...",send:"Send",back:"Back",login:"Sign in",signup:"Create account",google:"Continue with Google",noAcc:"No account?",hasAcc:"Have an account?",email:"Email",pass:"Password",name:"Name",loginTitle:"Welcome back",signupTitle:"Create your account",streak:"Streak",lessons:"Lessons",xp:"XP",level:"Level",correct:"Correct!",wrong:"Incorrect",check:"Check",cont:"Continue",skip:"Skip",complete:"Lesson complete!",earned:"XP earned",nextLesson:"Next lesson",typeAnswer:"Type your answer...",arrange:"Tap words in order",choose:"Choose the correct translation",hearts:"Hearts",startLesson:"Start lesson",chatPlaceholder:"Ask your tutor...",tutor:"Tutor"};

const getT = (lang) => lang ? { ...DT, ...(T[lang.code] || {}) } : DT;

// ── Categories ─────────────────────────────────────────────────────────────────
const CATS = [
  {id:"business", icon:"💼",color:"#10e8b5",topics:["Professional Emails","Meeting Vocabulary","Presentations","Negotiations","Job Interviews","Phone Calls","Networking","Business Writing"]},
  {id:"general",  icon:"🌍",color:"#f59e0b",topics:["Daily Conversations","Shopping","Travel","Healthcare","Dining Out","Making Friends","Directions","Weather"]},
  {id:"grammar",  icon:"📐",color:"#8b5cf6",topics:["Present Tenses","Past Tenses","Future Tenses","Modal Verbs","Conditionals","Passive Voice","Articles","Prepositions"]},
  {id:"vocabulary",icon:"📚",color:"#ec4899",topics:["Common Idioms","Phrasal Verbs","Business Terms","Collocations","Academic Words","Slang","Synonyms","Antonyms"]},
  {id:"pronunciation",icon:"🎙️",color:"#38bdf8",topics:["Vowel Sounds","Consonants","Word Stress","Intonation","Connected Speech","Silent Letters","Rhythm","Accent Reduction"]},
  {id:"conversation",icon:"💬",color:"#fb923c",topics:["Small Talk","Storytelling","Opinions","Requests","Apologizing","Agreeing","Disagreeing","Interrupting Politely"]},
];

// ── XP / Level ──────────────────────────────────────────────────────────────────
const XP_PER_CORRECT = 15;
const XP_PER_LESSON  = 50;
const xpForLevel = (lvl) => lvl * 100;
const getLevel   = (xp)  => Math.floor(xp / 100) + 1;
const getLevelProgress = (xp) => (xp % 100);

// ── AI ─────────────────────────────────────────────────────────────────────────
async function generateExercises(topic, catId, langName) {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      system: `You are an English teacher. Student speaks ${langName} natively and is learning English.
Create 6 exercises to teach English about "${topic}" (${catId}).

TEACHING APPROACH:
- Describe a REAL SITUATION in ${langName} so the student understands the context
- The student must then produce or recognize the correct ENGLISH response
- This teaches them to USE English in real life, not just translate words

Return ONLY valid JSON, no markdown, no backticks:
{
  "exercises": [
    {
      "type": "multiple_choice",
      "instruction": "Describe a real situation IN ${langName} — e.g. 'Estás en una reunión y quieres pedir la palabra.' The student picks the right English phrase to use.",
      "options": ["correct English phrase to use","wrong English option 1","wrong English option 2","wrong English option 3"],
      "answer": "correct English phrase to use"
    },
    {
      "type": "fill_blank",
      "instruction": "Short context IN ${langName} explaining the situation",
      "sentence": "English sentence with ___ where an English word is missing",
      "answer": "the missing English word",
      "hint": "what the missing word means IN ${langName}"
    },
    {
      "type": "arrange_words",
      "instruction": "IN ${langName}: tell the student what English sentence to build and why it is useful",
      "words": ["shuffled","English","words"],
      "answer": "correct English sentence"
    }
  ]
}
STRICT RULES:
- multiple_choice: NO english field. EXACTLY 4 ENGLISH options. Answer is one of them.
- fill_blank: NO english field. Sentence and answer are in ENGLISH only.
- arrange_words: NO english field. Words and answer are ENGLISH only. 4-6 words max, shuffled.
- Instructions and hints are ALWAYS in ${langName}.
- NEVER show the answer in the instruction.`,
      messages: [{role:"user", content:`Create 6 English-teaching exercises about: ${topic}`}]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  const text = data.text.replace(/```json|```/g,"").trim();
  const parsed = JSON.parse(text);
  return parsed.exercises;
}

async function askTutor(messages, langName, topic) {
  const res = await fetch("/api/chat", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      system:`You are a warm English tutor for a ${langName} speaker studying "${topic}". Always respond in ${langName} with English examples. Be encouraging. Max 4 sentences.`,
      messages: messages.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.content}))
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

// ── Speech ──────────────────────────────────────────────────────────────────────
function speak(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const go = () => {
    const voices = window.speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance(text);
    const checks = [
      v => /natural/i.test(v.name) && /en/i.test(v.lang),
      v => /microsoft.*aria|jenny|guy/i.test(v.name),
      v => /microsoft/i.test(v.name) && /en.US/i.test(v.lang),
      v => /samantha/i.test(v.name),
      v => /(enhanced|premium)/i.test(v.name) && /en/i.test(v.lang),
      v => v.localService && /en.US/i.test(v.lang),
      v => /en.US/i.test(v.lang),
    ];
    for (const c of checks) { const v = voices.find(c); if (v) { u.voice=v; break; } }
    u.lang="en-US"; u.rate=0.82; u.pitch=1.0;
    u.onend=onEnd; u.onerror=onEnd;
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length===0
    ? (window.speechSynthesis.onvoiceschanged=go) : go();
}

// ── Firebase helpers ────────────────────────────────────────────────────────────
async function addXP(uid, amount, topic, catId) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const d = snap.data() || {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now()-86400000).toDateString();
  let streakUpdate = { lastActive: today };
  if (d.lastActive === today) streakUpdate.streak = d.streak || 1;
  else if (d.lastActive === yesterday) streakUpdate.streak = increment(1);
  else streakUpdate.streak = 1;
  await updateDoc(ref, {
    ...streakUpdate,
    xp: increment(amount),
    totalLessons: increment(1),
    completedLessons: arrayUnion(`${catId}:${topic}`),
  });
  return (await getDoc(ref)).data();
}

// ── CSS ─────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--c:#10e8b5;--bg:#0f1923;--card:#1a2635;--card2:#1e2d40;--border:rgba(255,255,255,0.07);--txt:#e8f1f8;--muted:#4d6882;--correct:#58cc02;--wrong:#ff4b4b;--xp:#ffd900;--r:16px;}
.la{font-family:'Nunito',sans-serif;background:var(--bg);min-height:100vh;color:var(--txt);overflow-x:hidden;}
.la-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(100px);}
.la-o1{width:400px;height:400px;background:rgba(16,232,181,0.06);top:-100px;right:-100px;}
.la-o2{width:350px;height:350px;background:rgba(99,60,180,0.06);bottom:-100px;left:-80px;}
.pg{position:relative;z-index:1;}

/* Nav */
.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:rgba(15,25,35,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;}
.logo{font-size:1.25rem;font-weight:900;background:linear-gradient(135deg,var(--c),#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.nav-stats{display:flex;align-items:center;gap:14px;}
.ns{display:flex;align-items:center;gap:5px;font-size:0.82rem;font-weight:700;}
.ns-fire{color:#ff9600;}
.ns-xp{color:var(--xp);}
.ns-heart{color:#ff4b4b;}
.nav-r{display:flex;align-items:center;gap:8px;}
.chip{display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--border);padding:6px 14px;border-radius:20px;font-size:0.8rem;font-weight:700;cursor:pointer;transition:background 0.2s;}
.chip:hover{background:var(--card2);}
.btn-ghost{background:none;border:1px solid var(--border);color:var(--muted);font-family:'Nunito',sans-serif;font-size:0.78rem;font-weight:700;padding:6px 12px;border-radius:20px;cursor:pointer;transition:all 0.2s;}
.btn-ghost:hover{color:#ff4b4b;border-color:rgba(255,75,75,0.3);}
.btn-back{background:none;border:none;color:var(--muted);font-family:'Nunito',sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;transition:color 0.2s;padding:0;}
.btn-back:hover{color:var(--c);}
.wrap{max-width:680px;margin:0 auto;padding:0 20px;}

/* Welcome */
.hero{text-align:center;padding:60px 20px 40px;}
.hero h1{font-size:clamp(2.4rem,6vw,3.8rem);font-weight:900;line-height:1.05;margin-bottom:12px;}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,var(--c),#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.hero p{color:var(--muted);font-size:1rem;margin-bottom:48px;line-height:1.7;}
.eyebrow{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.18em;color:var(--c);font-weight:800;margin-bottom:18px;}
.lang-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;max-width:680px;margin:0 auto;padding-bottom:60px;}
.lang-card{background:var(--card);border:2px solid var(--border);border-radius:var(--r);padding:18px 10px;text-align:center;cursor:pointer;transition:all 0.2s;font-weight:700;}
.lang-card:hover{background:rgba(16,232,181,0.08);border-color:rgba(16,232,181,0.4);transform:translateY(-2px);}
.lang-flag{font-size:1.8rem;display:block;margin-bottom:8px;}
.lang-native{font-size:0.88rem;display:block;}
.lang-en{font-size:0.68rem;color:var(--muted);margin-top:2px;}

/* Auth */
.auth-box{max-width:400px;margin:60px auto 0;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:32px 28px;}
.auth-box h2{font-size:1.4rem;font-weight:900;margin-bottom:4px;}
.auth-box p{color:var(--muted);font-size:0.85rem;margin-bottom:22px;}
.f-label{font-size:0.75rem;font-weight:700;color:var(--muted);margin-bottom:4px;display:block;text-transform:uppercase;letter-spacing:0.05em;}
.f-input{width:100%;background:var(--card2);border:1.5px solid var(--border);border-radius:10px;padding:11px 14px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:600;outline:none;margin-bottom:12px;transition:border-color 0.2s;}
.f-input:focus{border-color:rgba(16,232,181,0.5);}
.f-input::placeholder{color:#1e334a;}
.abtn{width:100%;border:none;border-radius:12px;padding:13px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:800;cursor:pointer;transition:all 0.18s;margin-bottom:10px;}
.abtn.primary{background:var(--c);color:#051510;}
.abtn.primary:hover{background:#0dd4a4;transform:translateY(-1px);}
.abtn.google{background:var(--card2);color:var(--txt);border:1.5px solid var(--border);}
.abtn.google:hover{background:rgba(255,255,255,0.07);}
.abtn:disabled{opacity:0.35;cursor:not-allowed;transform:none!important;}
.auth-err{color:#ff4b4b;font-size:0.8rem;margin-bottom:10px;font-weight:700;}
.auth-switch{text-align:center;font-size:0.82rem;color:var(--muted);margin-top:10px;font-weight:700;}
.auth-switch span{color:#38bdf8;cursor:pointer;}
.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:#1e334a;font-size:0.75rem;font-weight:700;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* Home */
.home-header{padding:28px 0 20px;}
.home-header h2{font-size:1.5rem;font-weight:900;margin-bottom:3px;}
.home-header p{color:var(--muted);font-size:0.88rem;}
.level-bar{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;}
.level-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.level-badge{background:linear-gradient(135deg,var(--c),#38bdf8);color:#051510;font-size:0.75rem;font-weight:900;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.05em;}
.level-xp{font-size:0.78rem;color:var(--muted);font-weight:700;}
.xp-bar{height:8px;background:var(--card2);border-radius:4px;overflow:hidden;}
.xp-fill{height:100%;background:linear-gradient(90deg,var(--c),#38bdf8);border-radius:4px;transition:width 0.6s ease;}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 10px;text-align:center;}
.stat-val{font-size:1.6rem;font-weight:900;}
.stat-lbl{font-size:0.68rem;color:var(--muted);margin-top:2px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}
.cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding-bottom:48px;}
@media(min-width:520px){.cat-grid{grid-template-columns:repeat(3,1fr);}}
.cat-card{background:var(--card);border:2px solid var(--border);border-radius:var(--r);padding:18px 14px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
.cat-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.4);}
.cat-top{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity 0.2s;}
.cat-card:hover .cat-top{opacity:1;}
.cat-icon{font-size:1.8rem;display:block;margin-bottom:10px;}
.cat-name{font-size:0.9rem;font-weight:800;}
.cat-count{font-size:0.72rem;color:var(--muted);margin-top:2px;font-weight:700;}

/* Topics */
.topic-head{padding:28px 0 18px;}
.topic-head h2{font-size:1.4rem;font-weight:900;}
.topic-list{display:flex;flex-direction:column;gap:8px;padding-bottom:48px;}
.topic-item{background:var(--card);border:1.5px solid var(--border);border-radius:14px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;transition:all 0.2s;}
.topic-item:hover{background:var(--card2);transform:translateX(4px);}
.topic-item.done{border-color:rgba(88,204,2,0.3);background:rgba(88,204,2,0.05);}
.topic-name{font-size:0.95rem;font-weight:800;}
.topic-done{font-size:0.7rem;color:var(--correct);margin-top:2px;font-weight:700;}
.topic-arr{color:var(--muted);font-size:1rem;transition:color 0.2s;}
.topic-item:hover .topic-arr{color:var(--c);}

/* Exercise screen */
.ex-nav{display:flex;align-items:center;gap:12px;padding:14px 20px;background:rgba(15,25,35,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100;}
.ex-close{background:none;border:none;color:var(--muted);font-size:1.1rem;cursor:pointer;padding:4px;transition:color 0.2s;}
.ex-close:hover{color:#ff4b4b;}
.prog-track{flex:1;height:16px;background:var(--card2);border-radius:8px;overflow:hidden;}
.prog-fill{height:100%;background:linear-gradient(90deg,var(--c),#38bdf8);border-radius:8px;transition:width 0.4s ease;}
.ex-hearts{display:flex;gap:4px;}
.ex-heart{font-size:1rem;}

.ex-wrap{max-width:600px;margin:0 auto;padding:32px 20px;}
.ex-type-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(16,232,181,0.1);border:1px solid rgba(16,232,181,0.2);color:var(--c);font-size:0.72rem;font-weight:800;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:16px;}
.ex-instruction{font-size:1rem;font-weight:700;color:var(--muted);margin-bottom:8px;}
.ex-english{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:12px;}
.ex-eng-text{font-size:1.1rem;font-weight:800;flex:1;}
.ex-speak{background:rgba(16,232,181,0.1);border:1px solid rgba(16,232,181,0.2);color:var(--c);border-radius:10px;padding:7px 12px;font-size:0.8rem;font-weight:800;cursor:pointer;transition:all 0.2s;white-space:nowrap;font-family:'Nunito',sans-serif;}
.ex-speak:hover{background:rgba(16,232,181,0.2);}
.ex-speak.on{animation:pulse 0.9s infinite;}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,232,181,0.4);}50%{box-shadow:0 0 0 8px rgba(16,232,181,0);}}

/* Multiple choice */
.mc-options{display:flex;flex-direction:column;gap:10px;}
.mc-opt{background:var(--card);border:2px solid var(--border);border-radius:14px;padding:15px 18px;text-align:left;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:700;color:var(--txt);cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:12px;}
.mc-opt:hover:not(:disabled){background:var(--card2);border-color:rgba(16,232,181,0.4);transform:translateX(4px);}
.mc-opt.correct{background:rgba(88,204,2,0.12);border-color:var(--correct);color:var(--correct);}
.mc-opt.wrong{background:rgba(255,75,75,0.1);border-color:var(--wrong);color:var(--wrong);}
.mc-opt.selected{background:rgba(16,232,181,0.08);border-color:rgba(16,232,181,0.5);color:var(--c);}
.mc-opt:disabled{cursor:default;}
.mc-letter{width:32px;height:32px;border-radius:8px;border:2px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:0.78rem;font-weight:900;flex-shrink:0;}

/* Fill blank */
.fb-sentence{font-size:1.2rem;font-weight:800;line-height:1.7;margin-bottom:6px;text-align:center;}
.fb-blank{display:inline-block;border-bottom:3px solid var(--c);min-width:80px;padding:0 8px;color:var(--c);}
.fb-hint{font-size:0.8rem;color:var(--muted);margin-bottom:20px;text-align:center;font-weight:700;}
.fb-input{width:100%;background:var(--card);border:2px solid var(--border);border-radius:14px;padding:14px 18px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:1rem;font-weight:700;outline:none;transition:border-color 0.2s;text-align:center;}
.fb-input:focus{border-color:rgba(16,232,181,0.5);}
.fb-input.correct{border-color:var(--correct);background:rgba(88,204,2,0.08);}
.fb-input.wrong{border-color:var(--wrong);background:rgba(255,75,75,0.08);}
.fb-input::placeholder{color:#1e334a;}

/* Arrange words */
.aw-answer{min-height:60px;background:var(--card);border:2px solid var(--border);border-radius:14px;padding:12px 14px;display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;align-items:center;transition:border-color 0.2s;}
.aw-answer.correct{border-color:var(--correct);}
.aw-answer.wrong{border-color:var(--wrong);}
.aw-placeholder{color:#1e334a;font-size:0.85rem;font-weight:700;}
.aw-bank{display:flex;flex-wrap:wrap;gap:8px;min-height:48px;}
.word-chip{background:var(--card2);border:2px solid rgba(255,255,255,0.12);border-radius:10px;padding:8px 14px;font-family:'Nunito',sans-serif;font-size:0.9rem;font-weight:700;cursor:pointer;transition:all 0.18s;color:var(--txt);}
.word-chip:hover{background:rgba(16,232,181,0.1);border-color:rgba(16,232,181,0.4);}
.word-chip.placed{background:rgba(16,232,181,0.1);border-color:rgba(16,232,181,0.4);color:var(--c);}
.word-chip.correct{background:rgba(88,204,2,0.12);border-color:var(--correct);color:var(--correct);}
.word-chip.wrong{background:rgba(255,75,75,0.1);border-color:var(--wrong);color:var(--wrong);}

/* Feedback bar */
.fb-bar{position:fixed;bottom:0;left:0;right:0;padding:20px;border-top:1px solid var(--border);z-index:200;transition:all 0.3s;}
.fb-bar.correct-bg{background:rgba(88,204,2,0.12);}
.fb-bar.wrong-bg{background:rgba(255,75,75,0.08);}
.fb-bar.neutral-bg{background:rgba(15,25,35,0.95);backdrop-filter:blur(20px);}
.fb-inner{max-width:600px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;}
.fb-msg{font-size:1rem;font-weight:800;}
.fb-msg.c{color:var(--correct);}
.fb-msg.w{color:var(--wrong);}
.fb-correct-answer{font-size:0.82rem;color:var(--muted);margin-top:3px;font-weight:700;}
.fb-btn{border:none;border-radius:14px;padding:14px 28px;font-family:'Nunito',sans-serif;font-size:0.95rem;font-weight:800;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
.fb-btn.go{background:var(--c);color:#051510;}
.fb-btn.go:hover{background:#0dd4a4;transform:translateY(-1px);}
.fb-btn.skip{background:var(--card2);color:var(--muted);border:1.5px solid var(--border);}
.fb-btn.skip:hover{background:rgba(255,255,255,0.07);}

/* Completion */
.complete-wrap{text-align:center;padding:48px 20px 120px;}
.complete-emoji{font-size:4rem;margin-bottom:16px;display:block;animation:bounce2 0.6s ease;}
@keyframes bounce2{0%,100%{transform:scale(1);}50%{transform:scale(1.2);}}
.complete-wrap h2{font-size:2rem;font-weight:900;margin-bottom:8px;}
.complete-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:28px 0;}
.cs{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 10px;text-align:center;}
.cs-val{font-size:1.6rem;font-weight:900;}
.cs-val.xp{color:var(--xp);}
.cs-val.cor{color:var(--correct);}
.cs-lbl{font-size:0.68rem;color:var(--muted);margin-top:3px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;}
.complete-btn{background:var(--c);color:#051510;border:none;border-radius:14px;padding:15px 40px;font-family:'Nunito',sans-serif;font-size:1rem;font-weight:900;cursor:pointer;transition:all 0.2s;}
.complete-btn:hover{background:#0dd4a4;transform:translateY(-2px);}

/* Tutor chat panel */
.tutor-panel{position:fixed;right:0;top:0;bottom:0;width:320px;background:var(--card);border-left:1px solid var(--border);display:flex;flex-direction:column;z-index:150;transform:translateX(100%);transition:transform 0.3s ease;}
.tutor-panel.open{transform:translateX(0);}
.tp-head{padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.tp-head h3{font-size:0.9rem;font-weight:800;}
.tp-close{background:none;border:none;color:var(--muted);font-size:1.1rem;cursor:pointer;}
.tp-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;}
.tp-msg{max-width:90%;}
.tp-msg.user{align-self:flex-end;}
.tp-msg.assistant{align-self:flex-start;}
.tp-bbl{padding:8px 12px;border-radius:12px;font-size:0.82rem;line-height:1.6;font-weight:600;}
.user .tp-bbl{background:var(--c);color:#051510;border-bottom-right-radius:3px;}
.assistant .tp-bbl{background:var(--card2);border:1px solid var(--border);border-bottom-left-radius:3px;}
.tp-typing{display:flex;gap:4px;padding:4px;align-items:center;}
.tp-dot{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:tb 1s infinite;}
.tp-dot:nth-child(2){animation-delay:0.15s;}.tp-dot:nth-child(3){animation-delay:0.3s;}
@keyframes tb{0%,100%{transform:translateY(0);opacity:0.4;}50%{transform:translateY(-5px);opacity:1;}}
.tp-foot{padding:10px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0;}
.tp-in{flex:1;background:var(--card2);border:1.5px solid var(--border);border-radius:10px;padding:9px 12px;color:var(--txt);font-family:'Nunito',sans-serif;font-size:0.82rem;font-weight:600;outline:none;transition:border-color 0.2s;}
.tp-in:focus{border-color:rgba(16,232,181,0.4);}
.tp-in::placeholder{color:#1e334a;}
.tp-send{background:var(--c);color:#051510;border:none;border-radius:10px;padding:9px 14px;font-family:'Nunito',sans-serif;font-size:0.8rem;font-weight:800;cursor:pointer;}

.tutor-fab{position:fixed;bottom:90px;right:20px;background:linear-gradient(135deg,var(--c),#38bdf8);color:#051510;border:none;border-radius:50%;width:52px;height:52px;font-size:1.3rem;cursor:pointer;box-shadow:0 4px 20px rgba(16,232,181,0.3);transition:all 0.2s;z-index:140;display:flex;align-items:center;justify-content:center;}
.tutor-fab:hover{transform:scale(1.1);}

.fade{animation:fi 0.3s ease;}
@keyframes fi{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.ex-pad{padding-bottom:100px;}
`;

// ── App ────────────────────────────────────────────────────────────────────────
export default function LinguaAI() {
  const [view,    setView]    = useState("welcome");
  const [lang,    setLang]    = useState(null);
  const [user,    setUser]    = useState(null);
  const [prog,    setProg]    = useState(null);
  const [authMode,setAuthMode]= useState("login");
  const [aEmail,  setAEmail]  = useState("");
  const [aPass,   setAPass]   = useState("");
  const [aName,   setAName]   = useState("");
  const [aErr,    setAErr]    = useState("");
  const [aLoad,   setALoad]   = useState(false);
  const [cat,     setCat]     = useState(null);
  const [topic,   setTopic]   = useState(null);

  // Exercise state
  const [exercises, setExercises] = useState([]);
  const [exIdx,     setExIdx]     = useState(0);
  const [exLoad,    setExLoad]    = useState(false);
  const [exErr,     setExErr]     = useState("");
  const MAX_LIVES = 5;
  const RESTORE_MS = 5 * 60 * 1000; // 5 minutes per life

  const getLives = () => {
    try {
      const raw = localStorage.getItem("lingua_lives");
      if (!raw) return MAX_LIVES;
      const {lives, lastLost, lostTimes} = JSON.parse(raw);
      if (lives >= MAX_LIVES) return MAX_LIVES;
      const now = Date.now();
      const elapsed = now - lastLost;
      const restoreTime = RESTORE_MS * Math.max(1, MAX_LIVES - lives);
      const restored = Math.floor(elapsed / restoreTime);
      return Math.min(MAX_LIVES, lives + restored);
    } catch { return MAX_LIVES; }
  };

  const saveLives = (n) => {
    try {
      const current = getLives();
      localStorage.setItem("lingua_lives", JSON.stringify({lives:n, lastLost: n < current ? Date.now() : JSON.parse(localStorage.getItem("lingua_lives")||"{}").lastLost || Date.now()}));
    } catch {}
  };

  const [hearts, setHeartsState] = useState(() => getLives());
  const setHearts = (fn) => {
    setHeartsState(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn;
      saveLives(next);
      return next;
    });
  };
  const [correct,   setCorrect]   = useState(0);
  const [feedback,  setFeedback]  = useState(null); // null | "correct" | "wrong"
  const [answered,  setAnswered]  = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const [xpEarned,  setXpEarned]  = useState(0);

  // Per-exercise answer state
  const [mcSelected, setMcSelected] = useState(null);
  const [fbValue,    setFbValue]    = useState("");
  const [awPlaced,   setAwPlaced]   = useState([]);
  const [awBank,     setAwBank]     = useState([]);

  // Tutor
  const [tutorOpen,  setTutorOpen]  = useState(false);
  const [tutorMsgs,  setTutorMsgs]  = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoad,  setTutorLoad]  = useState(false);
  const tutorBottom = useRef(null);

  useEffect(() => { tutorBottom.current?.scrollIntoView({behavior:"smooth"}); }, [tutorMsgs]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const lc = localStorage.getItem("lingua_lang") || "es";
        const l  = LANGUAGES.find(x => x.code === lc) || LANGUAGES[0];
        setLang(l);
        setView("home"); // redirect immediately - don't wait for Firestore
        getOrCreateUser(u, l.code).then(p => setProg(p)).catch(e => console.log("Firestore:", e));
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const tr = getT(lang);
  const completedLessons = prog?.completedLessons || [];
  const totalXP  = prog?.xp || 0;
  const level    = getLevel(totalXP);
  const lvlProg  = getLevelProgress(totalXP);
  const catIdx   = c => CATS.findIndex(x => x.id === c?.id);

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
      setView("home"); // redirect immediately
      getOrCreateUser(cred.user, lang?.code || "es").then(p => setProg(p)).catch(e => console.log("Firestore:", e));
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
      setView("home"); // redirect immediately - don't wait for Firestore
      getOrCreateUser(cred.user, lang?.code || "es").then(p => setProg(p)).catch(e => console.log("Firestore:", e));
    } catch(e) {
      setAErr(e.message.replace("Firebase: ","").replace(/\(auth.*\)/,""));
    }
    setALoad(false);
  };

  const handleLogout = async () => {
    await logOut();
    setUser(null); setProg(null); setView("welcome"); setLang(null);
  };

  // Start lesson
  const startLesson = async (tp) => {
    setTopic(tp);
    setExercises([]); setExIdx(0); setExLoad(true); setExErr("");
    setHearts(getLives()); setCorrect(0); setFeedback(null); setAnswered(false);
    setXpEarned(0); setMcSelected(null); setFbValue(""); setAwPlaced([]); setAwBank([]);
    setTutorMsgs([{role:"assistant", content: `${tr.tutor}: ${lang.native} 🤖`}]);
    setView("exercise");
    try {
      const exs = await generateExercises(tp, cat.id, lang.english);
      setExercises(exs);
      // pre-load arrange words bank for first exercise
      if (exs[0]?.type === "arrange_words") {
        setAwBank([...exs[0].words].map((w,i) => ({word:w, id:i, placed:false})));
      }
    } catch(e) { setExErr(e.message || "Failed to load exercises. Please try again."); }
    setExLoad(false);
  };

  // Reset per-exercise state when moving to next
  const loadExercise = useCallback((idx, exs) => {
    setExIdx(idx);
    setMcSelected(null); setFbValue(""); setFeedback(null); setAnswered(false);
    const ex = exs[idx];
    if (ex?.type === "arrange_words") {
      setAwBank([...ex.words].map((w,i) => ({word:w, id:i, placed:false})));
      setAwPlaced([]);
    } else {
      setAwBank([]); setAwPlaced([]);
    }
    // auto-speak english
    if (ex?.english) {
      setSpeaking(true);
      speak(ex.english, () => setSpeaking(false));
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (exercises.length > 0 && exIdx === 0 && view === "exercise") {
      loadExercise(0, exercises);
    }
  }, [exercises]);

  const handleSpeak = () => {
    const ex = exercises[exIdx];
    if (!ex) return;
    setSpeaking(true);
    speak(ex.english || "", () => setSpeaking(false));
  };

  // Check answer
  const checkAnswer = () => {
    if (answered) return;
    const ex = exercises[exIdx];
    let isCorrect = false;

    if (ex.type === "multiple_choice") {
      isCorrect = mcSelected === ex.answer;
    } else if (ex.type === "fill_blank") {
      isCorrect = fbValue.trim().toLowerCase() === ex.answer.toLowerCase();
    } else if (ex.type === "arrange_words") {
      const attempt = awPlaced.map(w => w.word).join(" ");
      isCorrect = attempt.toLowerCase() === ex.answer.toLowerCase();
    }

    setAnswered(true);
    setFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setCorrect(c => c + 1);
      setXpEarned(x => x + XP_PER_CORRECT);
    } else {
      setHearts(h => Math.max(0, h - 1));
    }
  };

  const nextExercise = async () => {
    const next = exIdx + 1;
    if (next >= exercises.length || hearts === 0) {
      const earned = xpEarned + XP_PER_LESSON;
      setXpEarned(earned);
      setView("complete"); // go to complete immediately, don't wait for Firebase
      if (user) {
        try {
          const p = await addXP(user.uid, earned, topic, cat.id);
          setProg(p);
        } catch(e) { console.log("XP save failed:", e); }
      }
    } else {
      loadExercise(next, exercises);
    }
  };

  // Arrange words handlers
  const placeWord = (item) => {
    if (answered) return;
    if (!item.placed) {
      setAwBank(b => b.map(w => w.id === item.id ? {...w, placed:true} : w));
      setAwPlaced(p => [...p, item]);
    }
  };
  const removeWord = (item) => {
    if (answered) return;
    setAwPlaced(p => p.filter(w => w.id !== item.id));
    setAwBank(b => b.map(w => w.id === item.id ? {...w, placed:false} : w));
  };

  // Tutor chat
  const sendTutor = async () => {
    if (!tutorInput.trim() || tutorLoad) return;
    const userMsg = {role:"user", content: tutorInput};
    const updated = [...tutorMsgs, userMsg];
    setTutorMsgs(updated); setTutorInput(""); setTutorLoad(true);
    try {
      const reply = await askTutor(updated, lang.english, topic || "English");
      setTutorMsgs(p => [...p, {role:"assistant", content:reply}]);
    } catch {
      setTutorMsgs(p => [...p, {role:"assistant", content:"Connection issue."}]);
    }
    setTutorLoad(false);
  };

  const ex = exercises[exIdx];
  const progress = exercises.length > 0 ? (exIdx / exercises.length) * 100 : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{CSS}</style>
      <div className="la">
        <div className="la-orb la-o1"/><div className="la-orb la-o2"/>

        {/* WELCOME */}
        {view === "welcome" && (
          <div className="pg fade">
            <div className="wrap">
              <div className="hero">
                <h1>Lingua<em>AI</em></h1>
                <p>{DT.tagline}</p>
                <div className="eyebrow">{DT.pick}</div>
              </div>
              <div className="lang-grid">
                {LANGUAGES.map(l => (
                  <div key={l.code} className="lang-card" onClick={() => pickLang(l)}>
                    <span className="lang-flag">{l.flag}</span>
                    <span className="lang-native">{l.native}</span>
                    <span className="lang-en">{l.english}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUTH */}
        {view === "auth" && lang && (
          <div className="pg fade">
            <nav className="nav">
              <button className="btn-back" onClick={() => setView("welcome")}>← {tr.back}</button>
              <div className="chip">{lang.flag} {lang.native}</div>
            </nav>
            <div className="wrap">
              <div className="auth-box">
                <div style={{fontSize:"2rem",marginBottom:"12px"}}>🎓</div>
                <h2>{authMode === "login" ? tr.loginTitle : tr.signupTitle}</h2>
                <p>{authMode === "login" ? "Track your progress & streaks" : "Start your English journey"}</p>
                <button className="abtn google" onClick={handleGoogle} disabled={aLoad}>G &nbsp; {tr.google}</button>
                <div className="divider">or</div>
                {authMode === "signup" && (
                  <><label className="f-label">{tr.name}</label><input className="f-input" placeholder={tr.name} value={aName} onChange={e => setAName(e.target.value)}/></>
                )}
                <label className="f-label">{tr.email}</label>
                <input className="f-input" type="email" placeholder={tr.email} value={aEmail} onChange={e => setAEmail(e.target.value)}/>
                <label className="f-label">{tr.pass}</label>
                <input className="f-input" type="password" placeholder={tr.pass} value={aPass} onChange={e => setAPass(e.target.value)} onKeyDown={e => e.key==="Enter" && handleEmail()}/>
                {aErr && <div className="auth-err">{aErr}</div>}
                <button className="abtn primary" onClick={handleEmail} disabled={aLoad}>
                  {aLoad ? "..." : authMode === "login" ? tr.login : tr.signup}
                </button>
                <div className="auth-switch">
                  {authMode === "login" ? tr.noAcc : tr.hasAcc}{" "}
                  <span onClick={() => {setAuthMode(authMode==="login"?"signup":"login");setAErr("");}}>{authMode === "login" ? tr.signup : tr.login}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HOME */}
        {view === "home" && lang && user && (
          <div className="pg">
            <nav className="nav">
              <div className="logo">LinguaAI</div>
              <div className="nav-stats">
                <div className="ns"><span className="ns-fire">🔥</span>{prog?.streak||1}</div>
                <div className="ns"><span className="ns-xp">⚡</span>{totalXP}</div>
                <div className="ns"><span className="ns-heart">❤️</span>{getLives()}/{MAX_LIVES}</div>
              </div>
              <div className="nav-r">
                <div className="chip" onClick={() => setView("welcome")}>{lang.flag}</div>
                <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
              </div>
            </nav>
            <div className="wrap fade">
              <div className="home-header">
                <h2>{tr.greeting}, {user.displayName?.split(" ")[0] || "there"}! 👋</h2>
                <p>{tr.tagline}</p>
              </div>

              <div className="level-bar">
                <div className="level-row">
                  <div className="level-badge">Level {level}</div>
                  <div className="level-xp">{lvlProg} / 100 XP</div>
                </div>
                <div className="xp-bar"><div className="xp-fill" style={{width:`${lvlProg}%`}}/></div>
              </div>

              <div className="stats-row">
                <div className="stat"><div className="stat-val" style={{color:"#ff9600"}}>🔥{prog?.streak||1}</div><div className="stat-lbl">{tr.streak}</div></div>
                <div className="stat"><div className="stat-val" style={{color:"var(--correct)"}}>{prog?.totalLessons||0}</div><div className="stat-lbl">{tr.lessons}</div></div>
                <div className="stat"><div className="stat-val" style={{color:"var(--xp)"}}>⚡{totalXP}</div><div className="stat-lbl">{tr.xp}</div></div>
              </div>

              <div className="eyebrow">CHOOSE A CATEGORY</div>
              <div className="cat-grid">
                {CATS.map((c,i) => (
                  <div key={c.id} className="cat-card" onClick={() => {setCat(c); setView("topics");}}>
                    <div className="cat-top" style={{background:`linear-gradient(90deg,${c.color},transparent)`}}/>
                    <span className="cat-icon">{c.icon}</span>
                    <div className="cat-name">{tr.cats[i]}</div>
                    <div className="cat-count">{c.topics.length} topics</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TOPICS */}
        {view === "topics" && lang && cat && (
          <div className="pg">
            <nav className="nav">
              <button className="btn-back" onClick={() => setView("home")}>← {tr.back}</button>
              <div className="chip" style={{color:cat.color}}>{cat.icon} {tr.cats[catIdx(cat)]}</div>
            </nav>
            <div className="wrap fade">
              <div className="topic-head">
                <div className="eyebrow" style={{color:cat.color}}>{tr.topics}</div>
                <h2>{tr.cats[catIdx(cat)]}</h2>
              </div>
              <div className="topic-list">
                {cat.topics.map(tp => {
                  const done = completedLessons.includes(`${cat.id}:${tp}`);
                  return (
                    <div key={tp} className={`topic-item${done?" done":""}`} onClick={() => startLesson(tp)}>
                      <div>
                        <div className="topic-name">{tp}</div>
                        {done && <div className="topic-done">✓ Completed</div>}
                      </div>
                      <span className="topic-arr">{done ? "✓" : "→"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* EXERCISE */}
        {view === "exercise" && lang && (
          <>
            <nav className="ex-nav">
              <button className="ex-close" onClick={() => setView("topics")}>✕</button>
              <div className="prog-track"><div className="prog-fill" style={{width:`${progress}%`}}/></div>
              <div className="ex-hearts">
                {[...Array(MAX_LIVES)].map((_,i) => (
                  <span key={i} className="ex-heart">{i < hearts ? "❤️" : "🖤"}</span>
                ))}
              </div>
            </nav>

            <div className="ex-wrap ex-pad fade">
              {exLoad && (
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:"2rem",marginBottom:"16px"}}>⚡</div>
                  <div style={{color:"var(--muted)",fontWeight:700}}>{tr.loading}</div>
                </div>
              )}

              {exErr && (
                <div style={{textAlign:"center",padding:"60px 0"}}>
                  <div style={{fontSize:"2rem",marginBottom:"16px"}}>⚠️</div>
                  <div style={{color:"#ff4b4b",fontWeight:700,marginBottom:"20px"}}>{exErr}</div>
                  <button className="complete-btn" onClick={() => startLesson(topic)}>Try Again</button>
                </div>
              )}

              {!exLoad && !exErr && ex && (
                <>
                  {/* Type badge */}
                  <div className="ex-type-badge">
                    {ex.type==="multiple_choice"?"🎯 "+tr.choose : ex.type==="fill_blank"?"✏️ Fill in" : "🔀 "+tr.arrange}
                  </div>

                  {/* Instruction */}
                  <div className="ex-instruction">{ex.instruction}</div>

                  {/* English phrase card — only show for fill_blank and arrange_words, not multiple choice */}
                  {ex.english && ex.type !== "multiple_choice" && (
                    <div className="ex-english">
                      <div className="ex-eng-text">{ex.english}</div>
                      <button className={`ex-speak${speaking?" on":""}`} onClick={handleSpeak}>
                        {speaking ? "🔊..." : "🔊 Listen"}
                      </button>
                    </div>
                  )}
                  {ex.type === "multiple_choice" && (
                    <button className={`ex-speak${speaking?" on":""}`} style={{marginBottom:"16px"}} onClick={handleSpeak}>
                      {speaking ? "🔊 Playing..." : "🔊 Listen to context"}
                    </button>
                  )}

                  {/* Multiple Choice */}
                  {ex.type === "multiple_choice" && (
                    <div className="mc-options">
                      {ex.options.map((opt, i) => {
                        const letters = ["A","B","C","D"];
                        let cls = "";
                        if (answered) {
                          if (opt === ex.answer) cls = "correct";
                          else if (opt === mcSelected) cls = "wrong";
                        } else if (opt === mcSelected) {
                          cls = "selected";
                        }
                        return (
                          <button key={i} className={`mc-opt ${cls}`} disabled={answered}
                            onClick={() => { if (!answered) setMcSelected(opt); }}>
                            <span className="mc-letter">{letters[i]}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in the blank */}
                  {ex.type === "fill_blank" && (
                    <div>
                      <div className="fb-sentence" style={{marginBottom:"8px"}}>
                        {ex.sentence.split("___").map((part, i, arr) => (
                          <span key={i}>{part}{i < arr.length-1 && <span className="fb-blank">{answered ? ex.answer : fbValue || "___"}</span>}</span>
                        ))}
                      </div>
                      <div className="fb-hint">💡 {ex.hint}</div>
                      <input
                        className={`fb-input${answered ? (fbValue.trim().toLowerCase()===ex.answer.toLowerCase()?" correct":" wrong") : ""}`}
                        placeholder={tr.typeAnswer}
                        value={fbValue}
                        onChange={e => setFbValue(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && !answered && checkAnswer()}
                        disabled={answered}
                      />
                    </div>
                  )}

                  {/* Arrange words */}
                  {ex.type === "arrange_words" && (
                    <div>
                      <div className={`aw-answer${answered?(awPlaced.map(w=>w.word).join(" ").toLowerCase()===ex.answer.toLowerCase()?" correct":" wrong"):""}`}>
                        {awPlaced.length === 0
                          ? <span className="aw-placeholder">{tr.arrange}</span>
                          : awPlaced.map((w,i) => (
                            <span key={w.id} className={`word-chip placed${answered?(awPlaced.map(x=>x.word).join(" ").toLowerCase()===ex.answer.toLowerCase()?" correct":" wrong"):""}`}
                              onClick={() => removeWord(w)}>{w.word}</span>
                          ))
                        }
                      </div>
                      <div className="aw-bank">
                        {awBank.filter(w => !w.placed).map(w => (
                          <span key={w.id} className="word-chip" onClick={() => placeWord(w)}>{w.word}</span>
                        ))}
                      </div>
                      {answered && awPlaced.map(w=>w.word).join(" ").toLowerCase() !== ex.answer.toLowerCase() && (
                        <div style={{marginTop:"12px",color:"var(--muted)",fontSize:"0.85rem",fontWeight:700}}>
                          ✅ {ex.answer}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Feedback + action bar */}
            {!exLoad && !exErr && ex && (
              <div className={`fb-bar${feedback?" "+(feedback==="correct"?"correct-bg":"wrong-bg"):" neutral-bg"}`}>
                <div className="fb-inner">
                  <div>
                    {feedback === "correct" && <div className="fb-msg c">✓ {tr.correct}</div>}
                    {feedback === "wrong"   && (
                      <>
                        <div className="fb-msg w">✗ {tr.wrong}</div>
                        <div className="fb-correct-answer">✅ {ex.answer}</div>
                      </>
                    )}
                    {!feedback && <div style={{fontSize:"0.82rem",color:"var(--muted)",fontWeight:700}}>{exIdx+1} / {exercises.length}</div>}
                  </div>
                  <div style={{display:"flex",gap:"8px"}}>
                    {!answered && (
                      <button className="fb-btn skip" onClick={() => {
                        setFeedback("wrong"); setAnswered(true);
                        setHearts(h => Math.max(0,h-1));
                      }}>{tr.skip}</button>
                    )}
                    <button className="fb-btn go"
                      onClick={answered ? nextExercise : checkAnswer}
                      disabled={
                        !answered && (
                          (ex.type==="multiple_choice" && !mcSelected) ||
                          (ex.type==="fill_blank" && !fbValue.trim()) ||
                          (ex.type==="arrange_words" && awPlaced.length===0)
                        )
                      }>
                      {answered ? tr.cont : tr.check}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tutor FAB */}
            <button className="tutor-fab" onClick={() => setTutorOpen(o => !o)}>🤖</button>

            {/* Tutor Panel */}
            <div className={`tutor-panel${tutorOpen?" open":""}`}>
              <div className="tp-head">
                <h3>🤖 {tr.tutor} · {lang.native}</h3>
                <button className="tp-close" onClick={() => setTutorOpen(false)}>✕</button>
              </div>
              <div className="tp-msgs">
                {tutorMsgs.map((m,i) => (
                  <div key={i} className={`tp-msg ${m.role}`}><div className="tp-bbl">{m.content}</div></div>
                ))}
                {tutorLoad && <div className="tp-msg assistant"><div className="tp-bbl"><div className="tp-typing"><div className="tp-dot"/><div className="tp-dot"/><div className="tp-dot"/></div></div></div>}
                <div ref={tutorBottom}/>
              </div>
              <div className="tp-foot">
                <input className="tp-in" placeholder={tr.chatPlaceholder} value={tutorInput}
                  onChange={e => setTutorInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && sendTutor()}/>
                <button className="tp-send" onClick={sendTutor} disabled={tutorLoad}>{tr.send}</button>
              </div>
            </div>
          </>
        )}

        {/* COMPLETE */}
        {view === "complete" && lang && (
          <div className="pg">
            <nav className="nav">
              <div className="logo">LinguaAI</div>
              <div className="chip">{lang.flag} {lang.native}</div>
            </nav>
            <div className="wrap fade">
              <div className="complete-wrap">
                <span className="complete-emoji">🏆</span>
                <h2>{tr.complete}</h2>
                <p style={{color:"var(--muted)",fontWeight:700}}>{topic}</p>
                <div className="complete-stats">
                  <div className="cs"><div className="cs-val xp">+{xpEarned}</div><div className="cs-lbl">{tr.earned}</div></div>
                  <div className="cs"><div className="cs-val cor">{correct}/{exercises.length}</div><div className="cs-lbl">Correct</div></div>
                  <div className="cs"><div className="cs-val" style={{color:"#ff9600"}}>🔥{prog?.streak||1}</div><div className="cs-lbl">{tr.streak}</div></div>
                </div>
                {prog && (
                  <div style={{marginBottom:"28px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.8rem",fontWeight:700,color:"var(--muted)",marginBottom:"8px"}}>
                      <span>Level {getLevel(totalXP)}</span>
                      <span>{getLevelProgress(totalXP)} / 100 XP</span>
                    </div>
                    <div className="xp-bar"><div className="xp-fill" style={{width:`${getLevelProgress(totalXP)}%`}}/></div>
                  </div>
                )}
                <button className="complete-btn" onClick={() => setView("topics")}>{tr.nextLesson} →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
