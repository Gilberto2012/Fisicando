/* =====================================================================
   ORQUESTRADOR PRINCIPAL DO SISTEMA (PhysEdu SPA)
   ===================================================================== */

// --- ESTADO GLOBAL DA APLICAÇÃO ---
const supabaseUrl = 'https://cygrmkfmqzxxjtlnjhcv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z3Jta2ZtcXp4eGp0bG5qaGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjAxODksImV4cCI6MjEwMjI5NjE4OX0.IuGMgtbI3cKoATadUlRDq22W3LrkoT2ysuE7uch0juY';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let currentView = 'student'; // student | professor | presentation
let studentSession = null;  // Dados do aluno logado: { name, class, lesson, start, xp, level, badges }
let professorSession = null;
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

