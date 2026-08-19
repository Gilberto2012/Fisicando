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
            await setupStudentSession(profile);
            document.getElementById('btnRoleProfessor').style.display = 'none';
            document.getElementById('btnRolePresentation').style.display = 'none';
        } else if (profile.role === 'professor' || profile.role === 'admin') {
            setupProfessorSession(profile);
            await setupStudentSession(profile, true); // Professores e admins também ganham acesso à área do aluno para testes, mas sem mudar a tela na hora do login
            if (profile.role === 'admin') {
                document.getElementById('btnProfTabModeration').style.display = 'block';
            }
            document.getElementById('btnRoleProfessor').style.display = 'inline-block';
            document.getElementById('btnRolePresentation').style.display = 'inline-block';
        }
        
        // Mostrar botão de logout
        document.getElementById('btnLogout').style.display = 'inline-block';
        
    } else if (event === 'SIGNED_OUT') {
        studentSession = null;
        document.getElementById('studentWorkspace').style.display = 'none';
        document.getElementById('studentLoginCard').style.display = 'block';
        document.getElementById('btnLogout').style.display = 'none';
        document.getElementById('btnRoleProfessor').style.display = 'inline-block';
        document.getElementById('btnRolePresentation').style.display = 'inline-block';
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

async function setupStudentSession(profile, skipViewSwitch = false) {
    studentSession = {
        id: profile.id,
        name: profile.nome,
        class: profile.turma,
        xp: 0,
        level: 'Aprendiz',
        badges: ["Primeiro Passo"],
        startTime: new Date()
    };

    // Tentar buscar aula atribuída no Supabase
    const { data: atrib, error } = await supabaseClient
        .from('aulas_atribuidas')
        .select(`
            id,
            aulas (
                id, title, topic, series, code, questions
            )
        `)
        .or(`turma.eq.${profile.turma},aluno_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (atrib && atrib.aulas) {
        activeLesson = atrib.aulas;
    } else {
        // Fallback para a trilha padrão caso não haja nenhuma atribuição
        activeLesson = {
            id: "L-default",
            title: "Trilha Padrão: Introdução à Cinemática",
            topic: "Cinemática",
            series: "1º EM",
            code: "PADRAO1",
            questionIds: ["q001", "q002", "q004"]
        };
        activeLesson.questions = activeLesson.questionIds.map(id => PHYSICS_QUESTION_BANK.find(q => q.id === id)).filter(Boolean);
    }
    
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
    professorSession = profile;
    document.getElementById('studentNameDisplay').textContent = profile.nome + ' (Prof)';
    switchView('professor');
}

