/* =====================================================================
   ORQUESTRADOR PRINCIPAL DO SISTEMA (PhysEdu SPA)
   ===================================================================== */

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const supabaseUrl = 'https://cygrmkfmqzxxjtlnjhcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z3Jta2ZtcXp4eGp0bG5qaGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjAxODksImV4cCI6MjEwMjI5NjE4OX0.IuGMgtbI3cKoATadUlRDq22W3LrkoT2ysuE7uch0juY';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentView = 'student'; // student | professor | presentation
let studentSession = null;  // Dados do aluno logado: { name, class, lesson, start, xp, level, badges }
let activeLesson = null;     // Aula em andamento: { id, title, topic, series, code, questionIds, questions }
let activeQuestionIdx = 0;   // Índice da pergunta atual no fluxo da aula
let hintCountUsed = 0;       // Quantas dicas o aluno já pediu na questão atual
let studentResponses = [];   // Respostas do aluno na sessão atual: [ { questionId, studentAnswer, score, time, bloomLevel } ]
let activeStudentTab = 'multimedia';
let activeMultimediaSubTab = 'simulator';
let activeCreationMode = 'manual';
let activeProfessorTab = 'lessons';

// Instâncias de Gráficos Chart.js
let studentBloomRadarChart = null;
let classEvolutionsLineChart = null;
let classBloomBarsChart = null;
let presStatsChart = null;

// Configuração do EmailJS e Gemini
let systemSettings = {
    geminiApiKey: "",
    emailjsPublicKey: "",
    emailjsServiceId: "",
    emailjsTemplateId: "",
    teacherEmail: "professor@escola.com",
    prompts: {}
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Carregar configurações iniciais
    systemSettings = LocalDB.getSystemSettings();
    
    // Inicializar o simulador físico local de MUV
    if (typeof MUVSimulator !== 'undefined') {
        window.simulator = new MUVSimulator('physicsCanvas');
        updateSimParams();
    }

    // Configurar listener para o Fórum
    window.addEventListener('forumUpdate', () => {
        renderForum();
    });

    // Renderizar dados iniciais
    renderCreatedLessonsList();
    renderCuratorQuestionsTable();
    loadClassPromptSettings();
    populatePresentationLessons();

    // Roteador de Visão Inicial
    switchView('student');
});

// =====================================================================
// SPA ROUTER (MUDANÇA DE VISÕES)
// =====================================================================
function switchView(viewName) {
    currentView = viewName;
    
    // Atualizar botões de navegação no header
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    if (viewName === 'student') document.getElementById('btnRoleStudent').classList.add('active');
    if (viewName === 'professor') document.getElementById('btnRoleProfessor').classList.add('active');
    if (viewName === 'presentation') document.getElementById('btnRolePresentation').classList.add('active');

    // Ocultar todas as visões
    document.querySelectorAll('.spa-view').forEach(view => view.classList.remove('active'));

    // Exibir visão selecionada
    if (viewName === 'student') {
        document.getElementById('viewStudent').classList.add('active');
        if (studentSession) {
            document.getElementById('studentLoginCard').style.display = 'none';
            document.getElementById('studentWorkspace').style.display = 'grid';
            document.getElementById('studentXpBadge').style.display = 'inline-block';
        } else {
            document.getElementById('studentLoginCard').style.display = 'block';
            document.getElementById('studentWorkspace').style.display = 'none';
            document.getElementById('studentXpBadge').style.display = 'none';
        }
    } else if (viewName === 'professor') {
        document.getElementById('viewProfessor').classList.add('active');
        renderAnalyticsDashboard();
        renderCreatedLessonsList();
    } else if (viewName === 'presentation') {
        document.getElementById('viewPresentation').classList.add('active');
        populatePresentationLessons();
        loadPresentationLesson();
        startPresentationSync();
    }
}

// =====================================================================
// MODO ALUNO: TELA DE LOGIN & CONFIGURAÇÃO DA SESSÃO
// =====================================================================
// SUPABASE AUTH E LOGIN
// =====================================================================

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
        if (error) {
            console.error("Erro ao buscar perfil", error);
            return;
        }

        if (profile.status === 'pendente') {
            alert("⏳ Cadastro realizado! Seu acesso está aguardando a aprovação da coordenação.");
            await supabaseClient.auth.signOut();
            return;
        }

        if (profile.status === 'bloqueado') {
            alert("🚫 Acesso bloqueado. Entre em contato com a coordenação.");
            await supabaseClient.auth.signOut();
            return;
        }

        // Aprovado
        if (profile.role === 'aluno') {
            setupStudentSession(profile);
        } else if (profile.role === 'professor' || profile.role === 'admin') {
            setupProfessorSession(profile);
            setupStudentSession(profile, true); // Professores e admins também ganham acesso à área do aluno para testes, mas sem mudar a tela na hora do login
            if (profile.role === 'admin') {
                document.getElementById('btnProfTabModeration').style.display = 'block';
            }
        }
        
        // Mostrar botão de logout
        document.getElementById('btnLogout').style.display = 'inline-block';
        
    } else if (event === 'SIGNED_OUT') {
        studentSession = null;
        document.getElementById('studentWorkspace').style.display = 'none';
        document.getElementById('studentLoginCard').style.display = 'block';
        document.getElementById('btnLogout').style.display = 'none';
        switchView('student');
    }
});

async function logoutApp() {
    await supabaseClient.auth.signOut();
    window.location.reload();
}

async function handleLogin() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    if(!email || !password) return alert("Preencha e-mail e senha");
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error) alert("Erro no login: " + error.message);
}

async function handleSignup() {
    try {
        console.log("handleSignup disparado!");
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const nome = document.getElementById('signupName').value;
        const role = document.getElementById('signupRole').value;
        const turma = role === 'aluno' ? document.getElementById('signupClass').value : 'N/A';

        console.log("Valores coletados:", email, role, nome);

        if(!email || !password || !nome) return alert("Preencha todos os campos obrigatórios");

        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { nome, role, turma }
            }
        });

        if(error) alert("Erro no cadastro: " + error.message);
        else alert("Cadastro efetuado! Aguarde a aprovação da coordenação.");
    } catch (err) {
        console.error(err);
        alert("Erro inesperado ao cadastrar: " + err.message);
    }
}

function toggleAuthMode(mode) {
    if (mode === 'login') {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('tabLogin').className = 'btn-primary';
        document.getElementById('tabSignup').className = 'btn-secondary';
        document.getElementById('tabLogin').style.background = '';
        document.getElementById('tabSignup').style.background = 'rgba(255,255,255,0.1)';
    } else {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
        document.getElementById('tabLogin').className = 'btn-secondary';
        document.getElementById('tabSignup').className = 'btn-primary';
        document.getElementById('tabSignup').style.background = '';
        document.getElementById('tabLogin').style.background = 'rgba(255,255,255,0.1)';
    }
}

function toggleSignupRole() {
    const role = document.getElementById('signupRole').value;
    document.getElementById('signupTurmaGroup').style.display = role === 'aluno' ? 'block' : 'none';
}

function setupStudentSession(profile, skipViewSwitch = false) {
    studentSession = {
        id: profile.id,
        name: profile.nome,
        class: profile.turma,
        xp: 0,
        level: 'Aprendiz',
        badges: ["Primeiro Passo"],
        startTime: new Date()
    };

    activeLesson = {
        id: "L-default",
        title: "Trilha Padrão: Introdução à Cinemática",
        topic: "Cinemática",
        series: "1º EM",
        code: "PADRAO1",
        questionIds: ["q001", "q002", "q004"]
    };
    activeLesson.questions = activeLesson.questionIds.map(id => PHYSICS_QUESTION_BANK.find(q => q.id === id)).filter(Boolean);
    activeQuestionIdx = 0;
    studentResponses = [];
    hintCountUsed = 0;

    document.getElementById('studentNameDisplay').textContent = studentSession.name + ` (${studentSession.class})`;
    document.getElementById('studentLoginCard').style.display = 'none';
    document.getElementById('studentWorkspace').style.display = 'grid';
    
    if (!skipViewSwitch) {
        switchView('student');
    }

    initStudentChat();
    updateLessonProgressBar();
    renderLeaderboard();
    renderBadges();
    renderForum();
    renderDirectChat();
    updateStudentReportTab();
}

function setupProfessorSession(profile) {
    document.getElementById('studentNameDisplay').textContent = profile.nome + ' (Prof)';
    switchView('professor');
}

// =====================================================================
// FLUXO DO CHAT DO ALUNO
// =====================================================================
function initStudentChat() {
    const chatContainer = document.getElementById('studentChatMessages');
    chatContainer.innerHTML = '';

    const firstMsg = `Olá, <strong>${studentSession.name}</strong>! Sou o seu Professor Virtual de Física. 👋<br><br>` + 
                     `Hoje nossa aula é sobre: <strong>${activeLesson.title}</strong> (${activeLesson.topic}).<br><br>` +
                     `Vamos para o primeiro desafio!`;
    appendChatBubble(firstMsg, 'teacher');

    setTimeout(() => {
        askActiveQuestion();
    }, 1000);
}

function askActiveQuestion() {
    const currentQuestion = activeLesson.questions[activeQuestionIdx];
    hintCountUsed = 0;
    
    // Atualizar texto das dicas no botão
    document.getElementById('hintsLeftText').textContent = currentQuestion.dicas.length;

    // Perguntar
    const questionText = `<strong>Questão ${activeQuestionIdx + 1}:</strong> ${currentQuestion.enunciado}`;
    appendChatBubble(questionText, 'teacher');

    // Atualizar recursos multimídia e simulador associados ao tópico do exercício
    updateMultimediaResources(currentQuestion);
}

function updateLessonProgressBar() {
    const total = activeLesson.questions.length;
    const current = activeQuestionIdx + 1;
    const pct = Math.round((current / total) * 100);

    document.getElementById('lessonProgressText').textContent = `Questão ${current} de ${total}`;
    document.getElementById('lessonProgressBar').style.width = `${pct}%`;
}

function appendChatBubble(htmlContent, sender) {
    const chatContainer = document.getElementById('studentChatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg msg-${sender}`;

    const avatarHTML = sender === 'teacher' 
        ? `<div class="avatar avatar-teacher">🤖</div>`
        : `<div class="avatar avatar-student">🎓</div>`;

    const bubbleClass = sender === 'teacher' ? 'bubble-teacher' : 'bubble-student';

    msgDiv.innerHTML = `
        ${sender === 'teacher' ? avatarHTML : ''}
        <div style="display: flex; flex-direction: column;">
            <div class="bubble ${bubbleClass}">
                ${htmlContent}
            </div>
        </div>
        ${sender === 'student' ? avatarHTML : ''}
    `;

    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Envio de mensagem pelo aluno
async function sendStudentMessage() {
    const inputElement = document.getElementById('studentChatInput');
    const text = inputElement.value.trim();
    if (!text) return;

    inputElement.value = '';
    
    // Adicionar bolha do estudante
    appendChatBubble(text, 'student');

    // Mostrar digitação
    document.getElementById('studentTypingIndicator').style.display = 'flex';
    document.getElementById('studentChatMessages').scrollTop = document.getElementById('studentChatMessages').scrollHeight;

    // Marcar início da resposta se for primeira letra
    const responseStartTime = studentSession.lastActionTime || new Date();
    const timeSpentOnQuestion = Math.round((new Date() - responseStartTime) / 1000); // em segundos

    // Analisar Resposta (API do Gemini ou Regra Local)
    const currentQuestion = activeLesson.questions[activeQuestionIdx];
    let score = 0;
    let feedback = "";
    let detectedKeywords = [];

    // Prompt do professor para essa série
    const classPrompt = systemSettings.prompts[activeLesson.series] || "Você é um tutor de Física.";
    const activePersona = localStorage.getItem('PHYS_ACTIVE_PERSONA') || 'tutor';

    if (systemSettings.geminiApiKey) {
        // Chamada real ao Gemini API
        try {
            const apiResult = await callGeminiAPI(
                systemSettings.geminiApiKey,
                studentSession.name,
                currentQuestion,
                text,
                classPrompt,
                activePersona
            );
            score = apiResult.score;
            feedback = apiResult.feedback;
        } catch (e) {
            console.error("Falha ao chamar a API do Gemini. Usando fallback local.", e);
            const mock = generateMockAIPedagogicalResponse(currentQuestion, text, activePersona, studentSession.name, activeQuestionIdx);
            score = mock.score;
            feedback = mock.feedback;
            detectedKeywords = mock.detectedKeywords;
        }
    } else {
        // Sem chave: Heurística Local
        const mock = generateMockAIPedagogicalResponse(currentQuestion, text, activePersona, studentSession.name, activeQuestionIdx);
        score = mock.score;
        feedback = mock.feedback;
        detectedKeywords = mock.detectedKeywords;
    }

    // Dicas motivacionais aleatórias em caso de notas medianas/baixas
    if (score < 8) {
        const motivationalTips = [
            "Pense mais um pouco...",
            "Você está no caminho certo, continue tentando!",
            "Tente lembrar das variáveis que a questão te forneceu.",
            "Um bom físico nunca desiste! Dê uma olhada no resumo teórico ao lado."
        ];
        const randomTip = motivationalTips[Math.floor(Math.random() * motivationalTips.length)];
        feedback = `*(${randomTip})*\n\n` + feedback;
    }

    // Salvar resposta no log local
    studentResponses.push({
        questionId: currentQuestion.id,
        studentAnswer: text,
        score: score,
        time: timeSpentOnQuestion,
        bloomLevel: currentQuestion.bloomLevel,
        hintsUsed: hintCountUsed
    });

    // Recompensas de Gamificação e XP
    let xpEarned = 0;
    if (score >= 8) {
        // Acerto completo: 100 XP base, reduzindo 25 XP por dica
        xpEarned = Math.max(25, 100 - (hintCountUsed * 25));
    } else if (score >= 5) {
        // Acerto parcial
        xpEarned = Math.max(15, 50 - (hintCountUsed * 10));
    } else {
        // Participação
        xpEarned = 10;
    }
    
    // Atualizar XP e verificar nível
    addStudentXp(xpEarned);

    // Ocultar indicador de digitação
    document.getElementById('studentTypingIndicator').style.display = 'none';

    // Imprimir bolha do tutor com feedback e botão de avançar
    appendChatBubble(feedback, 'teacher');

    // Botão para avançar de questão injetado no chat
    const btnNext = document.createElement('button');
    btnNext.className = 'btn-primary btn-sm';
    btnNext.style.marginTop = '10px';
    btnNext.style.display = 'block';
    
    if (activeQuestionIdx < activeLesson.questions.length - 1) {
        btnNext.textContent = 'Ir para Próxima Questão ➡️';
        btnNext.onclick = () => {
            btnNext.remove();
            activeQuestionIdx++;
            updateLessonProgressBar();
            askActiveQuestion();
        };
    } else {
        btnNext.textContent = 'Concluir Aula e Ver Relatório 📊';
        btnNext.onclick = () => {
            btnNext.remove();
            finishStudentSession();
        };
    }
    
    const lastBubble = document.querySelector('.chat-messages .msg-teacher:last-child .bubble-teacher');
    if (lastBubble) {
        lastBubble.appendChild(btnNext);
    }
    
    // Rolar para baixo
    document.getElementById('studentChatMessages').scrollTop = document.getElementById('studentChatMessages').scrollHeight;
    
    // Atualizar tempo de última ação
    studentSession.lastActionTime = new Date();
}

// Botão Dica
function useHint() {
    const currentQuestion = activeLesson.questions[activeQuestionIdx];
    if (hintCountUsed >= currentQuestion.dicas.length) {
        appendChatBubble("Você já usou todas as dicas disponíveis para esta questão!", 'teacher');
        return;
    }

    const hintText = `💡 <strong>Dica ${hintCountUsed + 1}:</strong> ${currentQuestion.dicas[hintCountUsed]}`;
    hintCountUsed++;
    
    document.getElementById('hintsLeftText').textContent = currentQuestion.dicas.length - hintCountUsed;
    appendChatBubble(hintText, 'teacher');
}

// =====================================================================
// GAMIFICAÇÃO & XP
// =====================================================================
function addStudentXp(amount) {
    studentSession.xp += amount;
    
    // Níveis: Aprendiz (0 XP), Explorador (200 XP), Cientista (500 XP), Mestre (1000 XP), Lenda (2000 XP)
    let newLevel = "Aprendiz";
    let nextLevelXp = 200;
    let prevLevelXp = 0;

    if (studentSession.xp >= 2000) {
        newLevel = "Lenda";
        nextLevelXp = 5000;
        prevLevelXp = 2000;
    } else if (studentSession.xp >= 1000) {
        newLevel = "Mestre";
        nextLevelXp = 2000;
        prevLevelXp = 1000;
    } else if (studentSession.xp >= 500) {
        newLevel = "Cientista";
        nextLevelXp = 1000;
        prevLevelXp = 500;
    } else if (studentSession.xp >= 200) {
        newLevel = "Explorador";
        nextLevelXp = 500;
        prevLevelXp = 200;
    }

    // Verificar passagem de nível
    if (newLevel !== studentSession.level) {
        studentSession.level = newLevel;
        // Injetar mensagem de conquista de nível
        setTimeout(() => {
            appendChatBubble(`🎉 Parabéns! Você subiu de nível. Agora você é um **${newLevel}**! 🚀`, 'teacher');
        }, 800);
    }

    // Salvar progresso no banco de estudantes do LocalDB
    LocalDB.saveStudent({
        id: studentSession.id,
        name: studentSession.name,
        class: studentSession.class,
        xp: studentSession.xp,
        level: studentSession.level,
        badges: studentSession.badges
    });

    // Desbloquear Badges baseado em critérios
    checkAndUnlockBadges();

    // Atualizar badges da UI
    document.getElementById('studentXpVal').textContent = studentSession.xp + " XP";
    
    // Atualizar UI da aba de Gamificação
    document.getElementById('studentLevelBadge').textContent = studentSession.level;
    const progressPct = Math.min(100, Math.round(((studentSession.xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));
    document.getElementById('studentXpProgressBar').style.width = progressPct + "%";
    document.getElementById('studentXpProgressText').textContent = `${studentSession.xp} / ${nextLevelXp} XP`;

    // Atualizar Ranking
    renderLeaderboard();
}

function checkAndUnlockBadges() {
    const b = studentSession.badges;
    
    // Badge 2: "Físico Matemático" (Acertou uma questão de cálculo com nota 10)
    if (!b.includes("Físico Matemático")) {
        const hasPerfectCalc = studentResponses.some(r => {
            const q = PHYSICS_QUESTION_BANK.find(quest => quest.id === r.questionId);
            return q && q.tipo === 'calculo' && r.score === 10;
        });
        if (hasPerfectCalc) {
            b.push("Físico Matemático");
            notifyBadgeUnlock("Físico Matemático", "🧮");
        }
    }

    // Badge 3: "Pensador Bloom" (Atingiu nota 10 em uma questão de nível Analisar, Avaliar ou Criar)
    if (!b.includes("Pensador Bloom")) {
        const hasPerfectBloom = studentResponses.some(r => {
            return ['analyze', 'evaluate', 'create'].includes(r.bloomLevel) && r.score === 10;
        });
        if (hasPerfectBloom) {
            b.push("Pensador Bloom");
            notifyBadgeUnlock("Pensador Bloom", "🧠");
        }
    }

    // Badge 5: "Lenda da Física" (Chegou a 2000 XP)
    if (!b.includes("Lenda da Física") && studentSession.xp >= 2000) {
        b.push("Lenda da Física");
        notifyBadgeUnlock("Lenda da Física", "🌌");
    }

    studentSession.badges = b;
    LocalDB.saveStudent({ id: studentSession.id, name: studentSession.name, class: studentSession.class, badges: b });
    renderBadges();
}

function notifyBadgeUnlock(name, icon) {
    setTimeout(() => {
        appendChatBubble(`🏆 **Novo Badge Conquistado!** Você desbloqueou o selo *${icon} ${name}*. Dê uma olhada no seu painel de Conquistas!`, 'teacher');
    }, 1500);
}

function renderBadges() {
    const list = document.getElementById('studentBadgesGrid');
    list.innerHTML = '';

    const allBadges = [
        { name: "Primeiro Passo", icon: "🚀", desc: "Iniciou sua primeira aula no sistema." },
        { name: "Físico Matemático", icon: "🧮", desc: "Obteve nota 10 em uma questão de Cálculo." },
        { name: "Pensador Bloom", icon: "🧠", desc: "Demonstrou raciocínio avançado em Bloom." },
        { name: "Gênio do Fórum", icon: "💬", desc: "Postou dúvidas ou respondeu colegas no fórum." },
        { name: "Lenda da Física", icon: "🌌", desc: "Atingiu o status máximo de 2000 XP." }
    ];

    allBadges.forEach(badge => {
        const active = studentSession.badges.includes(badge.name);
        const card = document.createElement('div');
        card.className = `badge-card ${active ? 'active' : ''}`;
        card.title = badge.desc;
        card.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <span class="badge-name">${badge.name}</span>
        `;
        list.appendChild(card);
    });
}

function renderLeaderboard() {
    const list = document.getElementById('classLeaderboardList');
    if (!list) return;

    list.innerHTML = '';
    document.getElementById('rankingClassLabel').textContent = studentSession.class;

    const students = LocalDB.getStudents()
        .filter(s => s.class === studentSession.class)
        .sort((a, b) => b.xp - a.xp);

    students.forEach((std, index) => {
        const isMe = std.name === studentSession.name;
        const item = document.createElement('div');
        item.className = `leaderboard-item ${isMe ? 'highlight' : ''}`;
        item.innerHTML = `
            <span class="rank-num">${index + 1}</span>
            <span class="leaderboard-name">${std.name}</span>
            <span class="leaderboard-xp">${std.xp} XP</span>
        `;
        list.appendChild(item);
    });
}

// =====================================================================
// RECURSOS MULTIMÍDIA E SIMULADORES DILIGENTES
// =====================================================================
function updateMultimediaResources(question) {
    // 1. Alternar visualizadores de acordo com o tópico
    const topic = (question.tags && question.tags[0]) || activeLesson.topic;
    
    // Mapeamentos de links de PhET iframe por Tópico de Física
    const phetUrls = {
        "Cinemática": "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html?locale=pt_BR",
        "Leis de Newton": "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=pt_BR",
        "Termodinâmica": "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html?locale=pt_BR",
        "Ondulatória": "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html?locale=pt_BR",
        "Óptica": "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html?locale=pt_BR",
        "Eletricidade": "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_all.html?locale=pt_BR"
    };

    // Mapeamentos de vídeos do YouTube explicativos por Tópico
    const youtubeCodes = {
        "Cinemática": "kbaN17Z41ZM", // Cinemática introdução
        "Leis de Newton": "W9fnE9NdFzo",
        "Termodinâmica": "GYxXCr6HXcw",
        "Ondulatória": "Rmgqv8ETn6o",
        "Óptica": "ObDG87IPzFE",
        "Eletricidade": "BMrIHgI0PlU"
    };

    // Determinar qual simulador usar (se for MUV ou MRU específico, podemos usar o canvas local)
    const isMuvLocal = question.tags && (question.tags.includes("MUV") || question.tags.includes("MRU"));
    
    if (isMuvLocal) {
        document.getElementById('localMuvSimulator').style.display = 'block';
        document.getElementById('phetSimulatorEmbed').style.display = 'none';
        if (window.simulator) {
            window.simulator.resize();
            window.simulator.reset();
        }
    } else {
        document.getElementById('localMuvSimulator').style.display = 'none';
        document.getElementById('phetSimulatorEmbed').style.display = 'block';
        
        // Mapear tópico correspondente
        let mappedTopic = "Cinemática";
        for (let key in phetUrls) {
            if (question.tags && question.tags.some(t => t.toLowerCase().includes(key.toLowerCase()))) {
                mappedTopic = key;
                break;
            }
        }
        document.getElementById('phetIframe').src = phetUrls[mappedTopic] || phetUrls["Cinemática"];
    }

    // Atualizar Vídeo do Youtube
    let mappedVideoTopic = "Cinemática";
    for (let key in youtubeCodes) {
        if (question.tags && question.tags.some(t => t.toLowerCase().includes(key.toLowerCase()))) {
            mappedVideoTopic = key;
            break;
        }
    }
    document.getElementById('youtubeVideoFrame').src = `https://www.youtube.com/embed/${youtubeCodes[mappedVideoTopic]}`;
    document.getElementById('multimediaVideoTitle').textContent = `Videoaula Recomendada: ${mappedVideoTopic} (Ensino Médio)`;

    // Atualizar Texto do Resumo Teórico
    document.getElementById('theoryTextContent').innerHTML = `
        <h3>Conceito: ${question.tags ? question.tags.join(" / ") : "Geral"}</h3>
        <p style="margin-top: 10px;">${question.explicacao}</p>
        ${question.formula ? `<div class="pres-expected-box" style="margin-top: 15px;"><h5>Fórmula Associada:</h5><code>${question.formula}</code></div>` : ""}
    `;

    // Atualizar Exercícios Extras
    const relatedQuestions = PHYSICS_QUESTION_BANK.filter(q => q.id !== question.id && q.tags && question.tags && q.tags.some(t => question.tags.includes(t))).slice(0, 2);
    const exercisesContainer = document.getElementById('extraExercisesContent');
    exercisesContainer.innerHTML = '';
    
    if (relatedQuestions.length > 0) {
        relatedQuestions.forEach(ex => {
            const card = document.createElement('div');
            card.className = 'extra-ex-card';
            card.innerHTML = `
                <h6>Exercício de Fixação (${ex.bloomLevel.toUpperCase()})</h6>
                <p>${ex.enunciado}</p>
                <div class="pres-expected-box" style="padding: 6px 10px; background: rgba(0,0,0,0.15)">
                    <span style="font-size: 0.7rem; color: var(--accent-emerald)">Resposta Correta Esperada:</span>
                    <p style="font-size: 0.72rem; color: white; margin: 4px 0 0 0;">${ex.respostaEsperada}</p>
                </div>
            `;
            exercisesContainer.appendChild(card);
        });
    } else {
        exercisesContainer.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted);">Nenhum exercício extra para este tópico.</p>`;
    }
}

// Chaveador de Abas da Sidebar do Aluno
function switchStudentTab(tabName) {
    activeStudentTab = tabName;
    
    // Atualizar botões de abas
    document.getElementById('tabBtnMultimedia').classList.remove('active');
    document.getElementById('tabBtnGamification').classList.remove('active');
    document.getElementById('tabBtnForum').classList.remove('active');
    document.getElementById('tabBtnDirectTeacher').classList.remove('active');
    document.getElementById('tabBtnReport').classList.remove('active');

    if (tabName === 'multimedia') document.getElementById('tabBtnMultimedia').classList.add('active');
    if (tabName === 'gamification') document.getElementById('tabBtnGamification').classList.add('active');
    if (tabName === 'forum') document.getElementById('tabBtnForum').classList.add('active');
    if (tabName === 'teacher-chat') document.getElementById('tabBtnDirectTeacher').classList.add('active');
    if (tabName === 'report') document.getElementById('tabBtnReport').classList.add('active');

    // Ocultar painéis
    document.getElementById('studentTabMultimedia').classList.remove('active');
    document.getElementById('studentTabGamification').classList.remove('active');
    document.getElementById('studentTabForum').classList.remove('active');
    document.getElementById('studentTabTeacherChat').classList.remove('active');
    document.getElementById('studentTabReport').classList.remove('active');

    // Exibir painel correto
    if (tabName === 'multimedia') {
        document.getElementById('studentTabMultimedia').classList.add('active');
        if (activeMultimediaSubTab === 'simulator' && window.simulator) {
            window.simulator.resize();
        }
    }
    if (tabName === 'gamification') {
        document.getElementById('studentTabGamification').classList.add('active');
        renderLeaderboard();
    }
    if (tabName === 'forum') {
        document.getElementById('studentTabForum').classList.add('active');
        renderForum();
    }
    if (tabName === 'teacher-chat') {
        document.getElementById('studentTabTeacherChat').classList.add('active');
        renderDirectChat();
    }
    if (tabName === 'report') {
        document.getElementById('studentTabReport').classList.add('active');
        updateStudentReportTab();
    }
}

function switchMultimediaSubTab(subTabName) {
    activeMultimediaSubTab = subTabName;
    
    // Alterar botões
    const buttons = document.querySelectorAll('.multimedia-nav .sub-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Identificar e marcar
    const idxMap = { 'simulator': 0, 'video': 1, 'theory': 2, 'exercises': 3 };
    buttons[idxMap[subTabName]].classList.add('active');

    // Ocultar sub-painéis
    document.getElementById('subTabSimulator').classList.remove('active');
    document.getElementById('subTabVideo').classList.remove('active');
    document.getElementById('subTabTheory').classList.remove('active');
    document.getElementById('subTabExercises').classList.remove('active');

    // Exibir correto
    if (subTabName === 'simulator') {
        document.getElementById('subTabSimulator').classList.add('active');
        if (window.simulator) {
            window.simulator.resize();
        }
    }
    if (subTabName === 'video') document.getElementById('subTabVideo').classList.add('active');
    if (subTabName === 'theory') document.getElementById('subTabTheory').classList.add('active');
    if (subTabName === 'exercises') document.getElementById('subTabExercises').classList.add('active');
}

function showExplanationTab() {
    switchStudentTab('multimedia');
    switchMultimediaSubTab('theory');
}

// =====================================================================
// FÓRUM DE DÚVIDAS
// =====================================================================
function openNewForumTopicForm() {
    document.getElementById('forumNewTopicCard').style.display = 'block';
}

function closeNewForumTopicForm() {
    document.getElementById('forumNewTopicCard').style.display = 'none';
}

function submitForumTopic() {
    const title = document.getElementById('forumTopicTitleInput').value.trim();
    const content = document.getElementById('forumTopicContentInput').value.trim();

    if (!title || !content) {
        alert("Preencha o título e o conteúdo da dúvida.");
        return;
    }

    const newTopic = {
        id: 'f_' + Date.now(),
        title: title,
        author: studentSession.name,
        class: studentSession.class,
        content: content,
        date: new Date().toISOString(),
        resolved: false,
        replies: []
    };

    LocalDB.saveForumTopic(newTopic);

    // Recompensa gamificada por participar do fórum
    addStudentXp(30);
    // Adicionar badge do fórum se não houver
    if (!studentSession.badges.includes("Gênio do Fórum")) {
        studentSession.badges.push("Gênio do Fórum");
        LocalDB.saveStudent({ id: studentSession.id, name: studentSession.name, class: studentSession.class, badges: studentSession.badges });
        renderBadges();
        notifyBadgeUnlock("Gênio do Fórum", "💬");
    }

    // Limpar campos e recarregar
    document.getElementById('forumTopicTitleInput').value = '';
    document.getElementById('forumTopicContentInput').value = '';
    closeNewForumTopicForm();
    renderForum();
}

function renderForum() {
    const list = document.getElementById('forumTopicsList');
    if (!list) return;

    list.innerHTML = '';
    const topics = LocalDB.getForumTopics();

    if (topics.length === 0) {
        list.innerHTML = `<p style="font-size: 0.8rem; text-align: center; color: var(--text-secondary); margin-top: 20px;">Nenhuma dúvida postada neste fórum ainda.</p>`;
        return;
    }

    topics.forEach(topic => {
        const card = document.createElement('div');
        card.className = 'forum-topic-card';
        card.innerHTML = `
            <div class="forum-topic-header">
                <span class="forum-topic-author">👤 ${topic.author} (${topic.class})</span>
                <span class="forum-topic-date">${new Date(topic.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <h5>${topic.title}</h5>
            <p class="forum-topic-content">${topic.content}</p>
            <div class="forum-topic-footer">
                <span class="resolved-status ${topic.resolved ? 'resolved' : 'pending'}">${topic.resolved ? '✓ Resolvido' : '● Pendente'}</span>
                <span class="replies-count" onclick="toggleRepliesDisplay('${topic.id}')">💬 ${topic.replies.length} respostas</span>
            </div>
            <div class="forum-replies-section" id="replies_sec_${topic.id}" style="display: none;">
                <div class="replies-list" id="replies_list_${topic.id}">
                    <!-- Listagem das respostas -->
                </div>
                <div class="forum-reply-input-area">
                    <input type="text" id="reply_input_${topic.id}" placeholder="Escreva uma resposta...">
                    <button class="btn-primary btn-sm" onclick="submitForumReply('${topic.id}')">Responder</button>
                </div>
            </div>
        `;
        list.appendChild(card);
        renderRepliesList(topic);
    });
}

function toggleRepliesDisplay(topicId) {
    const sec = document.getElementById(`replies_sec_${topicId}`);
    sec.style.display = sec.style.display === 'none' ? 'flex' : 'none';
}

function renderRepliesList(topic) {
    const list = document.getElementById(`replies_list_${topic.id}`);
    list.innerHTML = '';

    topic.replies.forEach(reply => {
        const isTeacher = reply.role === 'teacher';
        const item = document.createElement('div');
        item.className = `forum-reply-item ${isTeacher ? 'teacher-reply' : ''}`;
        item.innerHTML = `
            <div class="forum-reply-author">${reply.author} ${isTeacher ? '👩‍🏫 (Professor)' : ''}</div>
            <p style="color: var(--text-primary); line-height: 1.4;">${reply.content}</p>
        `;
        list.appendChild(item);
    });
}

function submitForumReply(topicId) {
    const input = document.getElementById(`reply_input_${topicId}`);
    const text = input.value.trim();
    if (!text) return;

    const reply = {
        author: studentSession.name,
        role: 'student',
        content: text,
        date: new Date().toISOString()
    };

    LocalDB.saveForumReply(topicId, reply);
    input.value = '';
    
    // Atualizar localmente
    const topics = LocalDB.getForumTopics();
    const topic = topics.find(t => t.id === topicId);
    renderRepliesList(topic);
    renderForum();
}

// =====================================================================
// CHAT COM PROFESSOR (SIMULADO VIA LOCALSTORAGE)
// =====================================================================
function renderDirectChat() {
    const list = document.getElementById('directChatMessages');
    if (!list) return;

    list.innerHTML = '';
    const messages = LocalDB.getDirectMessages().filter(m => m.studentName === studentSession.name);

    if (messages.length === 0) {
        list.innerHTML = `<p style="font-size: 0.75rem; text-align: center; color: var(--text-muted); margin-top: 50px;">Nenhuma conversa iniciada. Envie uma mensagem à professora.</p>`;
        return;
    }

    messages.forEach(msg => {
        const item = document.createElement('div');
        item.className = `dir-msg ${msg.sender === 'student' ? 'dir-msg-student' : 'dir-msg-teacher'}`;
        item.textContent = msg.text;
        list.appendChild(item);
    });
    list.scrollTop = list.scrollHeight;
}

function sendDirectMessageToTeacher() {
    const input = document.getElementById('directChatInput');
    const text = input.value.trim();
    if (!text) return;

    const msg = {
        id: 'msg_' + Date.now(),
        studentName: studentSession.name,
        sender: 'student',
        text: text,
        date: new Date().toISOString()
    };

    LocalDB.saveDirectMessage(msg);
    input.value = '';
    renderDirectChat();

    // Resposta simulada em 2.5 segundos do professor
    setTimeout(() => {
        const mockResponses = [
            "Olá! Estou analisando a sua mensagem. Qual é a sua dúvida específica sobre a lição?",
            "Muito bom! Lembre-se de ver o simulador na aba de recursos para testar os valores de aceleração.",
            "Recebi sua dúvida. Vou avaliar o relatório do seu desempenho e te respondo no início da aula presencial amanhã."
        ];
        const teacherResponseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        const teacherMsg = {
            id: 'msg_t_' + Date.now(),
            studentName: studentSession.name,
            sender: 'teacher',
            text: teacherResponseText,
            date: new Date().toISOString()
        };
        LocalDB.saveDirectMessage(teacherMsg);
        renderDirectChat();
    }, 2500);
}

// =====================================================================
// MODO ALUNO: FINALIZAÇÃO E RELATÓRIO DO ALUNO
// =====================================================================
function finishStudentSession() {
    // Calcular a nota média
    const sum = studentResponses.reduce((acc, r) => acc + r.score, 0);
    const average = studentResponses.length > 0 ? (sum / studentResponses.length).toFixed(1) : "0.0";
    
    // Tempo total de aula em segundos
    const totalTime = Math.round((new Date() - studentSession.startTime) / 1000);

    // Calcular estatísticas Bloom consolidadas
    const bloomValues = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };
    const bloomCounts = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };

    studentResponses.forEach(r => {
        if (bloomValues[r.bloomLevel] !== undefined) {
            bloomValues[r.bloomLevel] += r.score;
            bloomCounts[r.bloomLevel]++;
        }
    });

    const finalBloomScores = {};
    for (let key in bloomValues) {
        finalBloomScores[key] = bloomCounts[key] > 0 ? Math.round((bloomValues[key] / bloomCounts[key]) * 10) : 0; // Escala 0-100 para o gráfico radar
    }

    // Detecção de Plágio / Uso Superficial de IA
    // Regra: Se o tempo médio de resposta for menor que 8 segundos por pergunta, OU vocabulário curtíssimo
    const avgTimePerQuestion = totalTime / studentResponses.length;
    const avgWords = studentResponses.reduce((acc, r) => acc + r.studentAnswer.split(/\s+/).length, 0) / studentResponses.length;
    
    let aiCorrectUse = "Uso Produtivo";
    if (avgTimePerQuestion < 12 || avgWords < 5) {
        aiCorrectUse = "Uso Superficial";
    }

    // Salvar submissão consolidadas no LocalDB
    const submission = {
        id: 'sub_' + Date.now(),
        studentName: studentSession.name,
        class: studentSession.class,
        lessonCode: activeLesson.code,
        date: new Date().toISOString(),
        score: parseFloat(average),
        timeElapsed: totalTime,
        bloomScores: finalBloomScores,
        aiCorrectUse: aiCorrectUse,
        responses: studentResponses.map(r => ({
            questionId: r.questionId,
            studentAnswer: r.studentAnswer,
            score: r.score,
            bloomLevel: r.bloomLevel
        }))
    };

    LocalDB.saveSubmission(submission);

    // Mudar para a aba de relatório do aluno
    switchStudentTab('report');
}

function updateStudentReportTab() {
    // Carregar última submissão desse aluno
    const subs = LocalDB.getSubmissions().filter(s => s.studentName === studentSession.name);
    if (subs.length === 0) {
        return;
    }

    const lastSub = subs[subs.length - 1];

    document.getElementById('reportAvgScore').textContent = lastSub.score.toFixed(1);
    document.getElementById('reportTimeSpent').textContent = Math.round(lastSub.timeElapsed / 60) + " min";

    // Recomendações personalizadas
    const recommendationsContainer = document.getElementById('studentRecommendationsList');
    recommendationsContainer.innerHTML = '';
    
    const failedBloomLevels = [];
    for (let level in lastSub.bloomScores) {
        if (lastSub.bloomScores[level] < 70) { // Menor que 7.0 em escala 0-100
            failedBloomLevels.push(level);
        }
    }

    const recommendationBook = {
        remember: "Leia os resumos conceituais e crie flashcards com as fórmulas e definições principais.",
        understand: "Explique o fenômeno físico em voz alta ou para um colega para consolidar sua interpretação.",
        apply: "Resolva mais exercícios de cálculo passo a passo, prestando atenção nas unidades de medida.",
        analyze: "Observe gráficos e simulações físicas, tentando associar o comportamento visual com as equações matemáticas.",
        evaluate: "Analise criticamente situações cotidianas sob a luz das leis de Newton e conservação de energia.",
        create: "Tente elaborar você mesmo novos enunciados de exercícios e resolva-os para testar sua capacidade."
    };

    if (failedBloomLevels.length > 0) {
        failedBloomLevels.forEach(level => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Foco em ${level.toUpperCase()}:</strong> ${recommendationBook[level]}`;
            recommendationsContainer.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "Parabéns! Excelente domínio cognitivo de todos os níveis de Bloom nesta lição. Continue assim!";
        recommendationsContainer.appendChild(li);
    }

    // Inicializar ou Atualizar Gráfico Radar de Bloom
    const radarData = [
        lastSub.bloomScores.remember || 0,
        lastSub.bloomScores.understand || 0,
        lastSub.bloomScores.apply || 0,
        lastSub.bloomScores.analyze || 0,
        lastSub.bloomScores.evaluate || 0,
        lastSub.bloomScores.create || 0
    ];

    if (studentBloomRadarChart) {
        studentBloomRadarChart.destroy();
    }

    const ctx = document.getElementById('studentBloomRadarChart').getContext('2d');
    studentBloomRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'],
            datasets: [{
                label: 'Seu Desempenho (Bloom)',
                data: radarData,
                backgroundColor: 'rgba(6, 182, 212, 0.2)',
                borderColor: '#06b6d4',
                pointBackgroundColor: '#06b6d4',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: '#9ca3af', font: { size: 9 } },
                    ticks: { display: false, stepSize: 20 },
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function openStudentFullReportModal() {
    const subs = LocalDB.getSubmissions().filter(s => s.studentName === studentSession.name);
    if (subs.length === 0) return;
    const lastSub = subs[subs.length - 1];

    const container = document.getElementById('studentReportDetails');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4>Trilha: ${lastSub.lessonCode}</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary)">Data de realização: ${new Date(lastSub.date).toLocaleString('pt-BR')}</p>
        </div>
        <div class="stats-overview-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
            <div class="metric-card"><h3>${lastSub.score}</h3><p>Média Final</p></div>
            <div class="metric-card"><h3>${Math.round(lastSub.timeElapsed / 60)}m</h3><p>Tempo de Resolução</p></div>
            <div class="metric-card"><h3>${lastSub.aiCorrectUse}</h3><p>Uso da IA</p></div>
        </div>
        <h5>Gabarito e Suas Respostas Enviadas:</h5>
        <div class="report-answers-feed" style="margin-top: 10px; display: flex; flex-direction: column; gap: 15px;">
            ${lastSub.responses.map((r, idx) => {
                const q = PHYSICS_QUESTION_BANK.find(quest => quest.id === r.questionId);
                return `
                    <div class="card" style="padding: 15px; background: rgba(0,0,0,0.2)">
                        <span class="pres-bloom-tag" style="background: var(--bloom-${q.bloomLevel}); font-size: 0.65rem; padding: 3px 8px;">${q.bloomLevel.toUpperCase()}</span>
                        <h6 style="margin-top: 8px; font-size: 0.85rem;">Pergunta ${idx + 1}: ${q.enunciado}</h6>
                        <div style="margin-top: 8px; font-size: 0.8rem;">
                            <span style="color: var(--accent-purple); font-weight: bold;">Sua Resposta:</span>
                            <p style="color: var(--text-primary); margin-top: 3px;">"${r.studentAnswer}"</p>
                        </div>
                        <div style="margin-top: 8px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="color: var(--accent-emerald); font-weight: bold;">Gabarito Pedagógico:</span>
                                <p style="color: var(--text-secondary); margin-top: 3px;">"${q.respostaEsperada}"</p>
                            </div>
                            <div class="metric-card" style="padding: 5px 12px; margin: 0; background: rgba(255,255,255,0.05); min-width: 70px;">
                                <h5 style="color: ${r.score >= 8 ? 'var(--success)' : r.score >= 5 ? 'var(--warning)' : 'var(--error)'}">${r.score}</h5>
                                <span style="font-size: 0.6rem; color: var(--text-secondary)">Pontos</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    openModal('studentReportModal');
}

// Configuração do EmailJS e envio
function sendReportEmail() {
    const cfg = systemSettings;
    if (!cfg.emailjsPublicKey || !cfg.emailjsServiceId || !cfg.emailjsTemplateId) {
        alert("Configurações do EmailJS ausentes! Por favor, insira as chaves corretas no painel de configurações no topo da página.");
        return;
    }

    const subs = LocalDB.getSubmissions().filter(s => s.studentName === studentSession.name);
    if (subs.length === 0) return;
    const lastSub = subs[subs.length - 1];

    const statusText = document.getElementById('emailStatusText');
    statusText.textContent = "Enviando e-mail de relatório...";
    statusText.style.color = "var(--warning)";

    // Formatar histórico de respostas em texto simples para o e-mail
    const responsesText = lastSub.responses.map((r, i) => {
        const q = PHYSICS_QUESTION_BANK.find(quest => quest.id === r.questionId);
        return `P${i+1} (${r.bloomLevel}): ${q.enunciado}\nR: "${r.studentAnswer}"\nNota: ${r.score}/10\n\n`;
    }).join('\n');

    // Inicializar cliente EmailJS
    emailjs.init(cfg.emailjsPublicKey);

    const templateParams = {
        student_name: lastSub.studentName,
        student_class: lastSub.class,
        lesson_code: lastSub.lessonCode,
        average_score: lastSub.score,
        time_elapsed: Math.round(lastSub.timeElapsed / 60) + " minutos",
        ai_use: lastSub.aiCorrectUse,
        responses_text: responsesText,
        to_email: cfg.teacherEmail
    };

    emailjs.send(cfg.emailjsServiceId, cfg.emailjsTemplateId, templateParams)
        .then(() => {
            statusText.textContent = "Relatório enviado com sucesso para: " + cfg.teacherEmail;
            statusText.style.color = "var(--success)";
        })
        .catch(err => {
            console.error("Erro ao enviar e-mail pelo EmailJS:", err);
            statusText.textContent = "Falha no envio do e-mail. Verifique os IDs de serviço.";
            statusText.style.color = "var(--error)";
        });
}

// =====================================================================
// MODO PROFESSOR: CRIAÇÃO DE AULA
// =====================================================================
function switchProfessorTab(tabName) {
    activeProfessorTab = tabName;
    document.getElementById('btnProfTabLessons').classList.remove('active');
    document.getElementById('btnProfTabAnalytics').classList.remove('active');

    if (tabName === 'lessons') document.getElementById('btnProfTabLessons').classList.add('active');
    if (tabName === 'analytics') document.getElementById('btnProfTabAnalytics').classList.add('active');

    document.getElementById('profTabLessons').classList.remove('active');
    document.getElementById('profTabAnalytics').classList.remove('active');

    if (tabName === 'lessons') {
        document.getElementById('profTabLessons').classList.add('active');
        renderCreatedLessonsList();
    }
    if (tabName === 'analytics') {
        document.getElementById('profTabAnalytics').classList.add('active');
        renderAnalyticsDashboard();
    }
}

function switchCreationMode(modeName) {
    activeCreationMode = modeName;
    const buttons = document.querySelectorAll('.creation-modes-tabs .mode-tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    const idxMap = { 'manual': 0, 'auto': 1, 'curator': 2, 'prompt': 3 };
    buttons[idxMap[modeName]].classList.add('active');

    document.getElementById('modeManual').classList.remove('active');
    document.getElementById('modeAuto').classList.remove('active');
    document.getElementById('modeCurator').classList.remove('active');
    document.getElementById('modePrompt').classList.remove('active');

    if (modeName === 'manual') document.getElementById('modeManual').classList.add('active');
    if (modeName === 'auto') document.getElementById('modeAuto').classList.add('active');
    if (modeName === 'curator') {
        document.getElementById('modeCurator').classList.add('active');
        renderCuratorQuestionsTable();
    }
    if (modeName === 'prompt') {
        document.getElementById('modePrompt').classList.add('active');
        loadClassPromptSettings();
    }
}

// MODO 1: MANUAL
let manualQuestionsCount = 1;
function addManualQuestionField() {
    manualQuestionsCount++;
    const container = document.getElementById('manQuestionsContainer');
    const qBlock = document.createElement('div');
    qBlock.className = 'manual-question-block card';
    qBlock.style.marginTop = '15px';
    qBlock.innerHTML = `
        <h5>Pergunta ${manualQuestionsCount}</h5>
        <div class="form-group">
            <label>Enunciado da Pergunta</label>
            <textarea class="man-q-enunciado" placeholder="Digite a pergunta para o estudante..."></textarea>
        </div>
        <div class="form-row">
            <div class="form-group col-4">
                <label>Nível Bloom</label>
                <select class="man-q-bloom">
                    <option value="remember">Lembrar</option>
                    <option value="understand">Compreender</option>
                    <option value="apply">Aplicar</option>
                    <option value="analyze">Analisar</option>
                    <option value="evaluate">Avaliar</option>
                    <option value="create">Criar</option>
                </select>
            </div>
            <div class="form-group col-4">
                <label>Tipo de Pergunta</label>
                <select class="man-q-type">
                    <option value="conceitual">Conceitual</option>
                    <option value="calculo">Cálculo</option>
                    <option value="grafico">Gráfico</option>
                    <option value="cotidiano">Cotidiano</option>
                    <option value="enem">ENEM</option>
                </select>
            </div>
            <div class="form-group col-4">
                <label>Dificuldade</label>
                <select class="man-q-difficulty">
                    <option value="1">Fácil</option>
                    <option value="2">Médio</option>
                    <option value="3">Difícil</option>
                </select>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group col-6">
                <label>Palavras-Chave de Correção (Separadas por vírgula)</label>
                <input type="text" class="man-q-keywords" placeholder="Ex: atrito, deslizar, calor">
            </div>
            <div class="form-group col-6">
                <label>Resposta Esperada</label>
                <input type="text" class="man-q-expected" placeholder="Resposta exata ou descrição completa">
            </div>
        </div>
        <div class="form-group">
            <label>Dicas de Ajuda (Máximo 3, separadas por barra vertical | )</label>
            <input type="text" class="man-q-hints" placeholder="Dica 1 | Dica 2 | Dica 3">
        </div>
    `;
    container.appendChild(qBlock);
}

function saveManualLesson() {
    const title = document.getElementById('manLessonTitle').value.trim();
    const topic = document.getElementById('manLessonTopic').value;

    if (!title) {
        alert("Preencha o título da aula.");
        return;
    }

    const questionBlocks = document.querySelectorAll('.manual-question-block');
    const newQuestionIds = [];

    questionBlocks.forEach((block, index) => {
        const enunciado = block.querySelector('.man-q-enunciado').value.trim();
        const bloom = block.querySelector('.man-q-bloom').value;
        const type = block.querySelector('.man-q-type').value;
        const difficulty = parseInt(block.querySelector('.man-q-difficulty').value);
        const keywords = block.querySelector('.man-q-keywords').value.split(',').map(s => s.trim()).filter(Boolean);
        const expected = block.querySelector('.man-q-expected').value.trim();
        const hints = block.querySelector('.man-q-hints').value.split('|').map(s => s.trim()).filter(Boolean);

        if (enunciado && expected) {
            const newQ = {
                id: 'q_custom_' + Date.now() + '_' + index,
                enunciado: enunciado,
                tipo: type,
                bloomLevel: bloom,
                palavrasChave: keywords,
                respostaEsperada: expected,
                dificuldade: difficulty,
                dicas: hints,
                fonte: "Elaboração Própria (Manual)",
                tags: [topic],
                explicacao: "Criação manual do professor."
            };
            PHYSICS_QUESTION_BANK.push(newQ);
            newQuestionIds.push(newQ.id);
        }
    });

    if (newQuestionIds.length === 0) {
        alert("Adicione e preencha pelo menos uma questão física.");
        return;
    }

    // Criar código da aula único de 6 caracteres
    const code = 'MAN' + Math.floor(100 + Math.random() * 900);

    const newLesson = {
        id: 'L_' + Date.now(),
        title: title,
        topic: topic,
        series: "1º EM", // Série padrão
        code: code,
        questionIds: newQuestionIds
    };

    LocalDB.saveLesson(newLesson);
    alert(`Aula salva com sucesso! Código para os alunos: ${code}`);

    // Limpar form
    document.getElementById('manLessonTitle').value = '';
    document.getElementById('manQuestionsContainer').innerHTML = '';
    manualQuestionsCount = 0;
    addManualQuestionField();
    renderCreatedLessonsList();
}

// MODO 2: AUTOMÁTICO
let generatedAutoQuestionsList = [];
function generateAutoLesson() {
    const topic = document.getElementById('autoLessonTopic').value;
    const series = document.getElementById('autoLessonSeries').value;
    const qty = parseInt(document.getElementById('autoLessonQty').value);
    
    // Obter checkboxes de Bloom marcados
    const checkedBlooms = [];
    document.querySelectorAll('.auto-bloom-cb:checked').forEach(cb => checkedBlooms.push(cb.value));

    if (checkedBlooms.length === 0) {
        alert("Selecione pelo menos um nível de Bloom para a geração automática.");
        return;
    }

    const matchingQuestions = getQuestionsForLesson(topic, series, qty, checkedBlooms);
    
    if (matchingQuestions.length === 0) {
        alert("Nenhuma questão encontrada no banco para estes filtros específicos. Tente selecionar mais níveis de Bloom.");
        return;
    }

    generatedAutoQuestionsList = matchingQuestions;

    // Renderizar preview
    const preview = document.getElementById('autoLessonPreview');
    preview.style.display = 'block';

    const list = document.getElementById('autoPreviewList');
    list.innerHTML = '';

    matchingQuestions.forEach((q, idx) => {
        const item = document.createElement('div');
        item.className = 'preview-q-item';
        item.innerHTML = `
            <strong>P${idx+1}:</strong> ${q.enunciado}
            <div class="preview-q-meta">Tópico: ${q.tags.join(', ')} | Bloom: ${q.bloomLevel.toUpperCase()} | Dificuldade: ${q.dificuldade === 1 ? 'Fácil' : q.dificuldade === 2 ? 'Médio' : 'Difícil'}</div>
        `;
        list.appendChild(item);
    });

    document.getElementById('autoLessonTitleInput').value = `Lição Automatizada de ${topic} (${series})`;
}

function saveAutoLesson() {
    const title = document.getElementById('autoLessonTitleInput').value.trim();
    const series = document.getElementById('autoLessonSeries').value;
    const topic = document.getElementById('autoLessonTopic').value;

    if (!title) {
        alert("Preencha o título da aula.");
        return;
    }

    // Criar código da aula único de 6 caracteres
    const code = 'AUT' + Math.floor(100 + Math.random() * 900);

    const newLesson = {
        id: 'L_' + Date.now(),
        title: title,
        topic: topic,
        series: series,
        code: code,
        questionIds: generatedAutoQuestionsList.map(q => q.id)
    };

    LocalDB.saveLesson(newLesson);
    alert(`Aula automática salva com sucesso! Código da Aula: ${code}`);

    document.getElementById('autoLessonPreview').style.display = 'none';
    renderCreatedLessonsList();
}

// MODO 3: CURADOR (BANCO DE QUESTÕES)
function renderCuratorQuestionsTable() {
    const tbody = document.getElementById('curatorQuestionTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // Filtros
    const search = document.getElementById('curSearchInput').value.trim().toLowerCase();
    const topicFilter = document.getElementById('curTopicFilter').value;
    const bloomFilter = document.getElementById('curBloomFilter').value;
    const diffFilter = document.getElementById('curDiffFilter').value;

    let filtered = PHYSICS_QUESTION_BANK;

    if (search) {
        filtered = filtered.filter(q => q.enunciado.toLowerCase().includes(search) || q.tags.some(t => t.toLowerCase().includes(search)));
    }
    if (topicFilter) {
        filtered = filtered.filter(q => q.tags.some(t => t.toLowerCase().includes(topicFilter.toLowerCase())));
    }
    if (bloomFilter) {
        filtered = filtered.filter(q => q.bloomLevel === bloomFilter);
    }
    if (diffFilter) {
        filtered = filtered.filter(q => q.dificuldade === parseInt(diffFilter));
    }

    filtered.forEach(q => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="text-center"><input type="checkbox" class="curator-select-cb" value="${q.id}"></td>
            <td style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${q.enunciado}</td>
            <td>${q.tags[0] || 'Geral'}</td>
            <td><span class="status-tag" style="background: var(--bloom-${q.bloomLevel}); color: white; padding: 2px 6px; font-size: 0.65rem;">${q.bloomLevel.toUpperCase()}</span></td>
            <td>${q.dificuldade === 1 ? 'Fácil' : q.dificuldade === 2 ? 'Médio' : 'Difícil'}</td>
            <td>${q.tipo.toUpperCase()}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterCuratorBank() {
    renderCuratorQuestionsTable();
}

function saveCuratorLesson() {
    const title = document.getElementById('curatorLessonTitle').value.trim();
    if (!title) {
        alert("Preencha o título da aula por curadoria.");
        return;
    }

    const selectedIds = [];
    document.querySelectorAll('.curator-select-cb:checked').forEach(cb => selectedIds.push(cb.value));

    if (selectedIds.length === 0) {
        alert("Marque pelo menos uma questão na tabela para adicionar à aula.");
        return;
    }

    // Criar código da aula
    const code = 'CUR' + Math.floor(100 + Math.random() * 900);

    const firstSelectedQ = PHYSICS_QUESTION_BANK.find(q => q.id === selectedIds[0]);
    const topic = firstSelectedQ ? firstSelectedQ.tags[0] : "Física";

    const newLesson = {
        id: 'L_' + Date.now(),
        title: title,
        topic: topic,
        series: "3º EM", // Curadoria voltada ao 3º EM por padrão
        code: code,
        questionIds: selectedIds
    };

    LocalDB.saveLesson(newLesson);
    alert(`Aula por Curadoria salva com sucesso! Código da Aula: ${code}`);

    document.getElementById('curatorLessonTitle').value = '';
    // Desmarcar todos
    document.querySelectorAll('.curator-select-cb:checked').forEach(cb => cb.checked = false);
    renderCreatedLessonsList();
}

// Importador JSON
function importQuestionsJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                // Validar estrutura simples
                let validCount = 0;
                imported.forEach(q => {
                    if (q.enunciado && q.respostaEsperada && q.bloomLevel) {
                        // Garantir ID único
                        q.id = q.id || 'q_imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
                        q.tags = q.tags || ["Importadas"];
                        q.dificuldade = q.dificuldade || 2;
                        q.palavrasChave = q.palavrasChave || [];
                        q.dicas = q.dicas || [];
                        
                        PHYSICS_QUESTION_BANK.push(q);
                        validCount++;
                    }
                });
                alert(`${validCount} questões físicas importadas com sucesso para o banco local!`);
                renderCuratorQuestionsTable();
            } else {
                alert("O arquivo JSON deve ser um array de objetos de questão.");
            }
        } catch (err) {
            alert("Erro ao ler JSON. Formato inválido.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// MODO 4: PROMPT PERSONALIZADO
function loadClassPromptSettings() {
    const series = document.getElementById('promptClassSelect').value;
    const settings = LocalDB.getSystemSettings();
    document.getElementById('customPromptEditor').value = settings.prompts[series] || "";
    document.getElementById('promptExtraInstructions').value = "";
}

function useSuggestedPrompt(persona) {
    const templates = {
        tutor: "Você é um tutor de Física experiente e didático. Nunca dê a resposta de forma mastigada, faça perguntas que induzam o aluno a refletir e a recalcular.",
        patient: "Você é um professor extremamente paciente e empático. Sempre use metáforas simples do dia a dia (como carros, blocos e lâmpadas) e elogie os pequenos acertos do aluno.",
        challenger: "Você é um professor de física provocativo e instigador. Desafie o raciocínio do aluno perguntando o 'porquê' físico de cada detalhe e estimulando o rigor matemático."
    };
    document.getElementById('customPromptEditor').value = templates[persona];
    localStorage.setItem('PHYS_ACTIVE_PERSONA', persona);
}

function saveClassPromptSettings() {
    const series = document.getElementById('promptClassSelect').value;
    const promptText = document.getElementById('customPromptEditor').value.trim();
    const extra = document.getElementById('promptExtraInstructions').value.trim();

    if (!promptText) {
        alert("Preencha o texto do prompt.");
        return;
    }

    const settings = LocalDB.getSystemSettings();
    settings.prompts[series] = promptText + (extra ? ` Instrução complementar: ${extra}` : "");
    LocalDB.saveSystemSettings(settings);
    systemSettings = settings;

    alert("Prompt da Persona salvo com sucesso para " + series);
}

function applyPromptToAllClasses() {
    const promptText = document.getElementById('customPromptEditor').value.trim();
    if (!promptText) {
        alert("Preencha o prompt base.");
        return;
    }

    const settings = LocalDB.getSystemSettings();
    settings.prompts["1º EM"] = promptText;
    settings.prompts["2º EM"] = promptText;
    settings.prompts["3º EM"] = promptText;
    LocalDB.saveSystemSettings(settings);
    systemSettings = settings;

    alert("Prompt replicado para todas as séries do Ensino Médio!");
}

function renderCreatedLessonsList() {
    const tbody = document.getElementById('createdLessonsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const lessons = LocalDB.getLessons();

    lessons.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong style="color: var(--accent-blue);">${l.code}</strong></td>
            <td>${l.title}</td>
            <td>${l.topic}</td>
            <td>${l.series}</td>
            <td>${l.questionIds.length} questões</td>
        `;
        tbody.appendChild(row);
    });
}

// =====================================================================
// PROFESSOR: DASHBOARD DE ANALÍTICAS
// =====================================================================
function renderAnalyticsDashboard() {
    const selectedClass = document.getElementById('analyticsClassSelect').value;
    
    // Carregar todas as submissões
    let subs = LocalDB.getSubmissions();
    let students = LocalDB.getStudents();

    if (selectedClass !== 'Todos') {
        subs = subs.filter(s => s.class === selectedClass);
        students = students.filter(s => s.class === selectedClass);
    }

    // 1. Métricas Gerais (Cards)
    const totalStudents = students.length;
    const totalSubs = subs.length;
    
    let avgScore = 0;
    let avgTime = 0;
    let successRate = 0; // Taxa de acertos (nota >= 7.0)

    if (totalSubs > 0) {
        const sumScore = subs.reduce((acc, s) => acc + s.score, 0);
        avgScore = (sumScore / totalSubs).toFixed(1);

        const sumTime = subs.reduce((acc, s) => acc + s.timeElapsed, 0);
        avgTime = Math.round((sumTime / totalSubs) / 60); // Em minutos

        const successful = subs.filter(s => s.score >= 7.0).length;
        successRate = Math.round((successful / totalSubs) * 100);
    }

    document.getElementById('classCardTotalStudents').textContent = totalStudents;
    document.getElementById('classCardAvgScore').textContent = totalSubs > 0 ? avgScore : "0.0";
    document.getElementById('classCardSuccessRate').textContent = totalSubs > 0 ? successRate + "%" : "0%";
    document.getElementById('classCardAvgTime').textContent = totalSubs > 0 ? avgTime + " min" : "0 min";

    // 2. Gráficos de Evolução Diária/Semanal (Chart.js)
    renderClassCharts(subs);

    // 3. Análise de Dificuldades (Tabela)
    renderDifficultiesTable(subs);

    // 4. Acompanhamento Individual de Alunos
    renderStudentsAnalysisTable(students, subs);
}

function renderClassCharts(subs) {
    // A. Gráfico de Evolução (Line)
    // Agrupar submissões por data (dia) e calcular média
    const datesMap = {};
    subs.forEach(s => {
        const day = s.date.split('T')[0]; // AAAA-MM-DD
        if (!datesMap[day]) datesMap[day] = { sum: 0, count: 0 };
        datesMap[day].sum += s.score;
        datesMap[day].count++;
    });

    const sortedDays = Object.keys(datesMap).sort();
    const lineLabels = sortedDays.map(d => {
        const p = d.split('-');
        return `${p[2]}/${p[1]}`; // DD/MM
    });
    const lineData = sortedDays.map(d => (datesMap[d].sum / datesMap[d].count).toFixed(1));

    if (classEvolutionsLineChart) classEvolutionsLineChart.destroy();
    
    const ctxLine = document.getElementById('classEvolutionsLineChart').getContext('2d');
    classEvolutionsLineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: lineLabels.length > 0 ? lineLabels : ['Sem dados'],
            datasets: [{
                label: 'Média da Turma',
                data: lineData.length > 0 ? lineData : [0],
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.3,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 10, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // B. Distribuição Bloom Geral (Bar/Radar)
    const bloomSums = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };
    const bloomCounts = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };

    subs.forEach(s => {
        for (let level in s.bloomScores) {
            if (s.bloomScores[level] !== undefined && s.bloomScores[level] > 0) {
                bloomSums[level] += s.bloomScores[level] / 10; // escala 0-10
                bloomCounts[level]++;
            }
        }
    });

    const bloomLevelsList = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const barData = bloomLevelsList.map(level => {
        return bloomCounts[level] > 0 ? (bloomSums[level] / bloomCounts[level]).toFixed(1) : 0;
    });

    if (classBloomBarsChart) classBloomBarsChart.destroy();

    const ctxBar = document.getElementById('classBloomBarsChart').getContext('2d');
    classBloomBarsChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'],
            datasets: [{
                data: barData,
                backgroundColor: [
                    '#f43f5e', // remember
                    '#f59e0b', // understand
                    '#10b981', // apply
                    '#06b6d4', // analyze
                    '#3b82f6', // evaluate
                    '#8b5cf6'  // create
                ],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 10, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderDifficultiesTable(subs) {
    const tbody = document.getElementById('classDifficultiesTableBody');
    tbody.innerHTML = '';

    // Agrupar respostas erradas (< 7.0) por Tópico e Bloom
    const map = {};

    subs.forEach(s => {
        s.responses.forEach(resp => {
            const q = PHYSICS_QUESTION_BANK.find(quest => quest.id === resp.questionId);
            if (!q) return;

            const key = q.tags[0] + " | " + q.bloomLevel;
            if (!map[key]) {
                map[key] = { topic: q.tags[0], bloom: q.bloomLevel, errors: 0, total: 0, samples: [] };
            }
            map[key].total++;
            if (resp.score < 7.0) {
                map[key].errors++;
                // Exemplo de erro (raciocínio resumido)
                const answerExcerpt = resp.studentAnswer.length > 30 ? resp.studentAnswer.substring(0, 30) + "..." : resp.studentAnswer;
                if (!map[key].samples.includes(answerExcerpt)) {
                    map[key].samples.push(answerExcerpt);
                }
            }
        });
    });

    const list = Object.values(map).filter(item => item.errors > 0);

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhuma lacuna cognitiva grave mapeada ainda nas submissões.</td></tr>`;
        return;
    }

    // Ordenar por taxa de erro
    list.sort((a, b) => (b.errors / b.total) - (a.errors / a.total));

    const recommendations = {
        remember: "Realizar quiz flashcard rápido em sala para resgatar definições básicas.",
        understand: "Demonstrar o fenômeno usando a simulação interativa PhET com projetor.",
        apply: "Resolver 2 exemplos matemáticos de cálculo de fórmulas no quadro com a classe.",
        analyze: "Discutir a leitura física de inclinações de retas e curvas gráficas no quadro.",
        evaluate: "Criar uma roda de debates avaliando hipóteses físicas de situações de cotidiano.",
        create: "Pedir aos estudantes para formarem duplas e criarem problemas com valores reais."
    };

    list.forEach(item => {
        const errorPct = Math.round((item.errors / item.total) * 100);
        const samplesText = item.samples.slice(0, 2).join(' / ') || "Sem dados textuais";
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.topic}</strong></td>
            <td><span class="status-tag" style="background: var(--bloom-${item.bloom}); color: white; padding: 2px 6px;">${item.bloom.toUpperCase()}</span></td>
            <td style="color: var(--text-secondary); max-width: 200px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${samplesText}">${samplesText}</td>
            <td style="color: var(--error); font-weight: bold;">${errorPct}%</td>
            <td style="font-size: 0.8rem; color: var(--accent-blue);">${recommendations[item.bloom] || "Reforçar conceitos básicos."}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderStudentsAnalysisTable(students, subs) {
    const tbody = document.getElementById('studentAnalysisTableBody');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary);">Nenhum estudante cadastrado nesta turma.</td></tr>`;
        return;
    }

    students.forEach(std => {
        // Encontrar as submissões desse estudante
        const studentSubs = subs.filter(s => s.studentName === std.name);
        
        let avgScore = "-";
        let maxBloom = "-";
        let avgTime = "-";
        let aiIndicator = "-";
        let status = "Sem dados";
        let statusClass = "text-muted";
        
        if (studentSubs.length > 0) {
            const sumScore = studentSubs.reduce((acc, s) => acc + s.score, 0);
            avgScore = (sumScore / studentSubs.length).toFixed(1);

            const sumTime = studentSubs.reduce((acc, s) => acc + s.timeElapsed, 0);
            avgTime = Math.round((sumTime / studentSubs.length) / 60) + " min";

            // Encontrar maior nível de Bloom atingido com nota boa (>=7)
            const goodSub = studentSubs[studentSubs.length - 1]; // última submissão
            const blooms = ['create', 'evaluate', 'analyze', 'apply', 'understand', 'remember'];
            for (let b of blooms) {
                if (goodSub.bloomScores[b] >= 70) {
                    maxBloom = b.toUpperCase();
                    break;
                }
            }
            if (maxBloom === "-") maxBloom = "REMB";

            // Engajamento IA
            aiIndicator = goodSub.aiCorrectUse || "Uso Produtivo";

            // Status Pedagógico
            if (parseFloat(avgScore) >= 8.5) {
                status = "Excelente";
                statusClass = "excelente";
            } else if (parseFloat(avgScore) >= 7.0) {
                status = "Adequado";
                statusClass = "productive";
            } else {
                status = "Em Atenção";
                statusClass = "atencao";
            }
        }

        const aiStatusTag = aiIndicator === "Uso Produtivo" 
            ? `<span class="status-tag productive">Produtivo</span>`
            : aiIndicator === "Uso Superficial"
            ? `<span class="status-tag superficial" title="Cuidado: aluno respondeu muito rápido ou com respostas extremamente curtas/copiadas!">Superficial ⚠️</span>`
            : "-";

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${std.name}</strong></td>
            <td>${std.class}</td>
            <td style="font-weight: bold; color: ${avgScore >= 7 ? 'var(--success)' : avgScore === '-' ? 'white' : 'var(--error)'}">${avgScore}</td>
            <td>${maxBloom}</td>
            <td>${avgTime}</td>
            <td>${aiStatusTag}</td>
            <td><span class="status-tag ${statusClass}">${status}</span></td>
            <td>
                <button class="btn-secondary btn-sm" onclick="openStudentReportForTeacher('${std.name}')">🔎 Relatório</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openStudentReportForTeacher(studentName) {
    const subs = LocalDB.getSubmissions().filter(s => s.studentName === studentName);
    if (subs.length === 0) {
        alert("Este estudante ainda não enviou respostas a nenhuma aula.");
        return;
    }
    const lastSub = subs[subs.length - 1];

    const container = document.getElementById('studentReportDetails');
    container.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4>Estudante: ${lastSub.studentName} (${lastSub.class})</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary)">Data de realização: ${new Date(lastSub.date).toLocaleString('pt-BR')}</p>
        </div>
        <div class="stats-overview-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 20px;">
            <div class="metric-card"><h3>${lastSub.score}</h3><p>Média Final</p></div>
            <div class="metric-card"><h3>${Math.round(lastSub.timeElapsed / 60)}m</h3><p>Tempo de Resolução</p></div>
            <div class="metric-card"><h3>${lastSub.aiCorrectUse}</h3><p>Uso da IA</p></div>
        </div>
        <h5>Respostas e Correções Pedagógicas:</h5>
        <div class="report-answers-feed" style="margin-top: 10px; display: flex; flex-direction: column; gap: 15px;">
            ${lastSub.responses.map((r, idx) => {
                const q = PHYSICS_QUESTION_BANK.find(quest => quest.id === r.questionId);
                return `
                    <div class="card" style="padding: 15px; background: rgba(0,0,0,0.2)">
                        <span class="pres-bloom-tag" style="background: var(--bloom-${q.bloomLevel}); font-size: 0.65rem; padding: 3px 8px;">${q.bloomLevel.toUpperCase()}</span>
                        <h6 style="margin-top: 8px; font-size: 0.85rem;">Pergunta ${idx + 1}: ${q.enunciado}</h6>
                        <div style="margin-top: 8px; font-size: 0.8rem;">
                            <span style="color: var(--accent-purple); font-weight: bold;">Resposta do Aluno:</span>
                            <p style="color: var(--text-primary); margin-top: 3px;">"${r.studentAnswer}"</p>
                        </div>
                        <div style="margin-top: 8px; font-size: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span style="color: var(--accent-emerald); font-weight: bold;">Gabarito Esperado:</span>
                                <p style="color: var(--text-secondary); margin-top: 3px;">"${q.respostaEsperada}"</p>
                            </div>
                            <div class="metric-card" style="padding: 5px 12px; margin: 0; background: rgba(255,255,255,0.05); min-width: 70px;">
                                <h5 style="color: ${r.score >= 8 ? 'var(--success)' : r.score >= 5 ? 'var(--warning)' : 'var(--error)'}">${r.score}</h5>
                                <span style="font-size: 0.6rem; color: var(--text-secondary)">Nota</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Atualizar referências locais no botão
    studentSession = studentSession || {};
    studentSession.name = lastSub.studentName;
    studentSession.class = lastSub.class;

    openModal('studentReportModal');
}

// Exportar CSV
function exportStudentsCSV() {
    const selectedClass = document.getElementById('analyticsClassSelect').value;
    let students = LocalDB.getStudents();
    let subs = LocalDB.getSubmissions();

    if (selectedClass !== 'Todos') {
        students = students.filter(s => s.class === selectedClass);
        subs = subs.filter(s => s.class === selectedClass);
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Aluno,Turma,Media de Notas,Tempo Medio (min),Engajamento IA,Status Pedagogico\n";

    students.forEach(std => {
        const studentSubs = subs.filter(s => s.studentName === std.name);
        let avgScore = "N/A";
        let avgTime = "N/A";
        let aiIndicator = "N/A";
        let status = "Sem dados";

        if (studentSubs.length > 0) {
            const sumScore = studentSubs.reduce((acc, s) => acc + s.score, 0);
            avgScore = (sumScore / studentSubs.length).toFixed(1);
            const sumTime = studentSubs.reduce((acc, s) => acc + s.timeElapsed, 0);
            avgTime = Math.round((sumTime / studentSubs.length) / 60);
            aiIndicator = studentSubs[studentSubs.length - 1].aiCorrectUse;

            if (parseFloat(avgScore) >= 8.5) status = "Excelente";
            else if (parseFloat(avgScore) >= 7.0) status = "Adequado";
            else status = "Em Atencao";
        }

        csvContent += `"${std.name}","${std.class}",${avgScore},${avgTime},"${aiIndicator}","${status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Fisica_Turma_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =====================================================================
// MODO APRESENTAÇÃO (SALA DE AULA)
// =====================================================================
let presentationSyncInterval = null;
let currentPresLesson = null;
let currentPresQuestionIdx = 0;

function populatePresentationLessons() {
    const select = document.getElementById('presLessonSelect');
    if (!select) return;

    select.innerHTML = '';
    const lessons = LocalDB.getLessons();
    lessons.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.code} - ${l.title} (${l.series})`;
        select.appendChild(opt);
    });
}

function loadPresentationLesson() {
    const lessonId = document.getElementById('presLessonSelect').value;
    if (!lessonId) return;

    const lessons = LocalDB.getLessons();
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    // Carregar perguntas associadas
    lesson.questions = lesson.questionIds.map(id => PHYSICS_QUESTION_BANK.find(q => q.id === id)).filter(Boolean);
    currentPresLesson = lesson;
    currentPresQuestionIdx = 0;

    // Preencher dropdown de perguntas
    const selectQ = document.getElementById('presQuestionSelect');
    selectQ.innerHTML = '';
    lesson.questions.forEach((q, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `Pergunta ${idx + 1} (${q.bloomLevel.toUpperCase()})`;
        selectQ.appendChild(opt);
    });

    showPresentationQuestion();
}

function showPresentationQuestion() {
    if (!currentPresLesson || currentPresLesson.questions.length === 0) return;
    
    currentPresQuestionIdx = parseInt(document.getElementById('presQuestionSelect').value) || 0;
    const q = currentPresLesson.questions[currentPresQuestionIdx];

    document.getElementById('presBloomTag').textContent = q.bloomLevel.toUpperCase();
    document.getElementById('presBloomTag').style.backgroundColor = `var(--bloom-${q.bloomLevel})`;
    document.getElementById('presDiffTag').textContent = q.dificuldade === 1 ? 'FÁCIL' : q.dificuldade === 2 ? 'MÉDIO' : 'DIFÍCIL';
    document.getElementById('presQuestionText').innerHTML = q.enunciado;
    document.getElementById('presFormulaCode').textContent = q.formula || "Conceitual (sem fórmula)";
    
    // Rótulo explicativo
    document.getElementById('presCommonErrorText').textContent = q.explicacao;

    updatePresentationStats();
}

function changePresQuestion(dir) {
    if (!currentPresLesson) return;
    const newIdx = currentPresQuestionIdx + dir;
    if (newIdx >= 0 && newIdx < currentPresLesson.questions.length) {
        document.getElementById('presQuestionSelect').value = newIdx;
        showPresentationQuestion();
    }
}

// Sincronização ao vivo para Apresentação
function startPresentationSync() {
    if (presentationSyncInterval) clearInterval(presentationSyncInterval);
    
    presentationSyncInterval = setInterval(() => {
        if (currentView === 'presentation') {
            updatePresentationStats();
        }
    }, 1500); // Sincroniza a cada 1.5s
}

function updatePresentationStats() {
    if (!currentPresLesson) return;
    const q = currentPresLesson.questions[currentPresQuestionIdx];

    const subs = LocalDB.getSubmissions().filter(s => s.lessonCode === currentPresLesson.code);
    
    let correctCount = 0;
    let incorrectCount = 0;
    const feedContainer = document.getElementById('presLiveFeedList');
    feedContainer.innerHTML = '';

    // Filtrar respostas a essa pergunta específica
    const answersList = [];
    subs.forEach(s => {
        const resp = s.responses.find(r => r.questionId === q.id);
        if (resp) {
            answersList.push({
                studentName: s.studentName,
                answer: resp.studentAnswer,
                score: resp.score,
                date: s.date
            });
            if (resp.score >= 7.0) correctCount++;
            else incorrectCount++;
        }
    });

    // Ordenar feed pelas mais recentes
    answersList.sort((a,b) => new Date(b.date) - new Date(a.date));

    answersList.forEach(ans => {
        const feedItem = document.createElement('div');
        feedItem.className = 'pres-feed-item';
        feedItem.innerHTML = `
            <div class="pres-feed-meta">
                <span class="pres-feed-student">👤 ${ans.studentName}</span>
                <span class="pres-feed-score ${ans.score >= 7.0 ? 'correct' : 'incorrect'}">Nota: ${ans.score}/10</span>
            </div>
            <p class="pres-feed-text">"${ans.answer}"</p>
        `;
        feedContainer.appendChild(feedItem);
    });

    if (answersList.length === 0) {
        feedContainer.innerHTML = `<p style="font-size: 0.8rem; text-align: center; color: var(--text-muted); margin-top: 50px;">Aguardando respostas dos alunos para esta pergunta...</p>`;
    }

    // Atualizar gráfico de rosca (Correct/Incorrect)
    if (presStatsChart) presStatsChart.destroy();

    const ctx = document.getElementById('presStatsChart').getContext('2d');
    presStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Correto (Nota >= 7)', 'Incorreto (Nota < 7)'],
            datasets: [{
                data: [correctCount, incorrectCount],
                backgroundColor: ['#10b981', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 12 } }
            }
        }
    });
}

function toggleRevealWhoFailed() {
    if (!currentPresLesson) return;
    const q = currentPresLesson.questions[currentPresQuestionIdx];

    const subs = LocalDB.getSubmissions().filter(s => s.lessonCode === currentPresLesson.code);
    const failedListContainer = document.getElementById('failedStudentsList');
    failedListContainer.innerHTML = '';

    let count = 0;
    subs.forEach(s => {
        const resp = s.responses.find(r => r.questionId === q.id);
        if (resp && resp.score < 7.0) {
            const li = document.createElement('li');
            li.className = 'failed-student-item';
            li.innerHTML = `
                <span class="failed-student-name">👤 ${s.studentName} (${s.class})</span>
                <span class="failed-student-score">${resp.score}/10</span>
            `;
            failedListContainer.appendChild(li);
            count++;
        }
    });

    if (count === 0) {
        failedListContainer.innerHTML = `<li class="failed-student-item" style="border-color: var(--panel-border); background: transparent; justify-content: center;"><span class="failed-student-name" style="color: var(--success);">Nenhum aluno com nota baixa na questão!</span></li>`;
    }

    openModal('failedStudentsModal');
}

// =====================================================================
// INTEGRAÇÃO COM GEMINI API CLIENT-SIDE (CALL)
// =====================================================================
async function callGeminiAPI(apiKey, studentName, question, studentAnswer, classPrompt, persona) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: `Você é um professor de física virtual de Ensino Médio. Persona ativa: "${persona}". Responda estritamente seguindo o prompt de persona associado: "${classPrompt}".
                
                Instruções:
                1. Avalie a resposta do aluno com base na precisão científica da física descrita.
                2. Nível de Bloom esperado para esta pergunta: ${question.bloomLevel.toUpperCase()}.
                3. Pergunta feita: "${question.enunciado}"
                4. Gabarito/Resposta Esperada de referência: "${question.respostaEsperada}"
                5. Resposta fornecida pelo estudante ${studentName}: "${studentAnswer}"

                Você deve responder no formato JSON exato fornecido abaixo, sem nenhuma marcação de formatação markdown extra (como \`\`\`json):
                {
                    "score": [número decimal de 0.0 a 10.0 representando a precisão física e adequação ao nível Bloom],
                    "feedback": "[Seu feedback explicativo de tutor, guiando o aluno didaticamente. Nunca dê a resposta pronta se ele errar. Destaque erros conceituais no estilo da sua persona. Em português do Brasil.]"
                }`
            }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text.trim();
    
    // Remover marcações markdown do JSON se a IA esquecer
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
}

// =====================================================================
// CONTROLES DE MODAIS E CONFIGURAÇÕES
// =====================================================================
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    if (modalId === 'settingsModal') {
        // Carregar configurações nos inputs
        const cfg = LocalDB.getSystemSettings();
        document.getElementById('cfgGeminiKey').value = cfg.geminiApiKey || "";
        document.getElementById('cfgEmailJSKey').value = cfg.emailjsPublicKey || "";
        document.getElementById('cfgEmailJSService').value = cfg.emailjsServiceId || "";
        document.getElementById('cfgEmailJSTemplate').value = cfg.emailjsTemplateId || "";
        document.getElementById('cfgTeacherEmail').value = cfg.teacherEmail || "professor@escola.com";
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function saveSettings() {
    const key = document.getElementById('cfgGeminiKey').value.trim();
    const eKey = document.getElementById('cfgEmailJSKey').value.trim();
    const eServ = document.getElementById('cfgEmailJSService').value.trim();
    const eTemp = document.getElementById('cfgEmailJSTemplate').value.trim();
    const email = document.getElementById('cfgTeacherEmail').value.trim();

    const currentSettings = LocalDB.getSystemSettings();
    const newSettings = {
        ...currentSettings,
        geminiApiKey: key,
        emailjsPublicKey: eKey,
        emailjsServiceId: eServ,
        emailjsTemplateId: eTemp,
        teacherEmail: email
    };

    LocalDB.saveSystemSettings(newSettings);
    systemSettings = newSettings;

    alert("Configurações salvas localmente com sucesso!");
    closeModal('settingsModal');
}

// --- INTEGRAÇÃO COM SIMULADOR CANVAS DE MUV ---
function updateSimParams() {
    const v0Slider = document.getElementById('v0Slider');
    const accSlider = document.getElementById('accSlider');
    if (!v0Slider || !accSlider) return;
    
    const v0 = v0Slider.value;
    const a = accSlider.value;
    
    document.getElementById('v0Val').textContent = v0;
    document.getElementById('accVal').textContent = a;
    
    if (window.simulator) {
        window.simulator.setParams(v0, a);
    }
}

function toggleSim() {
    if (!window.simulator) return;
    const btn = document.getElementById('simPlayBtn');
    if (window.simulator.isRunning) {
        window.simulator.pause();
        btn.textContent = '▶️ Iniciar';
    } else {
        window.simulator.start();
        btn.textContent = '⏸️ Pausar';
    }
}

function resetSim() {
    if (!window.simulator) return;
    window.simulator.reset();
    const btn = document.getElementById('simPlayBtn');
    if (btn) btn.textContent = '▶️ Iniciar';
}

// =====================================================================
// MODERAÇÃO DE USUÁRIOS E NAVEGAÇÃO PROFESSOR
// =====================================================================

function switchProfessorTab(tabId) {
    activeProfessorTab = tabId;
    document.querySelectorAll('.prof-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.prof-tab-panel').forEach(panel => panel.classList.remove('active'));

    const btnIdMap = {
        'lessons': 'btnProfTabLessons',
        'analytics': 'btnProfTabAnalytics',
        'moderation': 'btnProfTabModeration'
    };
    
    const btnId = btnIdMap[tabId];
    if (btnId) {
        document.getElementById(btnId).classList.add('active');
    }

    let panelId = 'profTabLessons';
    if (tabId === 'analytics') panelId = 'profTabAnalytics';
    if (tabId === 'moderation') panelId = 'profTabModeration';
    
    const panel = document.getElementById(panelId);
    if(panel) panel.classList.add('active');

    if (tabId === 'moderation') {
        loadPendingUsers();
    }
}

async function loadPendingUsers() {
    const tbody = document.getElementById('pendingUsersTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando...</td></tr>';
    
    // Buscar usuários pendentes
    const { data: users, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar: ${error.message}</td></tr>`;
        return;
    }

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum usuário pendente de aprovação.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.nome}</td>
            <td>${u.id}</td>
            <td>${u.role}</td>
            <td>${u.turma || '-'}</td>
            <td>
                <button class="btn-success btn-sm" onclick="approveUser('${u.id}')">Aprovar</button>
                <button class="btn-danger btn-sm" onclick="blockUser('${u.id}')">Bloquear</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function approveUser(id) {
    const { error } = await supabaseClient.from('profiles').update({ status: 'aprovado' }).eq('id', id);
    if (error) alert("Erro ao aprovar: " + error.message);
    else {
        alert("Usuário aprovado com sucesso!");
        loadPendingUsers();
    }
}

async function blockUser(id) {
    if(!confirm("Tem certeza que deseja bloquear este usuário?")) return;
    const { error } = await supabaseClient.from('profiles').update({ status: 'bloqueado' }).eq('id', id);
    if (error) alert("Erro ao bloquear: " + error.message);
    else {
        alert("Usuário bloqueado.");
        loadPendingUsers();
    }
}

