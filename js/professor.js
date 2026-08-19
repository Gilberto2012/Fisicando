// =====================================================================
// MODO PROFESSOR: CRIAÇÃO DE AULA
// =====================================================================
// (Função switchProfessorTab original foi movida para o final do arquivo e unificada)

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

async function saveManualLesson() {
    const title = document.getElementById('manLessonTitle').value.trim();
    const topic = document.getElementById('manLessonTopic').value;

    if (!title) {
        alert("Preencha o título da aula.");
        return;
    }

    const questionBlocks = document.querySelectorAll('.manual-question-block');
    const questionsToSave = [];

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
            questionsToSave.push(newQ);
        }
    });

    if (questionsToSave.length === 0) {
        alert("Adicione e preencha pelo menos uma questão física.");
        return;
    }

    const code = 'MAN' + Math.floor(100 + Math.random() * 900);

    const { error } = await supabaseClient.from('aulas').insert([{
        professor_id: professorSession.id,
        title: title,
        topic: topic,
        series: "1º EM",
        code: code,
        questions: questionsToSave
    }]);

    if (error) {
        alert("Erro ao salvar aula no servidor: " + error.message);
        return;
    }

    alert(`Aula salva com sucesso! Código para os alunos: ${code}`);

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

async function saveAutoLesson() {
    const title = document.getElementById('autoLessonTitleInput').value.trim();
    const series = document.getElementById('autoLessonSeries').value;
    const topic = document.getElementById('autoLessonTopic').value;

    if (!title) {
        alert("Preencha o título da aula.");
        return;
    }

    const code = 'AUT' + Math.floor(100 + Math.random() * 900);

    const { error } = await supabaseClient.from('aulas').insert([{
        professor_id: professorSession.id,
        title: title,
        topic: topic,
        series: series,
        code: code,
        questions: generatedAutoQuestionsList
    }]);

    if (error) {
        alert("Erro ao salvar aula no servidor: " + error.message);
        return;
    }

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

async function saveCuratorLesson() {
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

    const code = 'CUR' + Math.floor(100 + Math.random() * 900);

    const questionsToSave = selectedIds.map(id => PHYSICS_QUESTION_BANK.find(q => q.id === id)).filter(Boolean);
    const topic = questionsToSave[0] ? questionsToSave[0].tags[0] : "Física";

    const { error } = await supabaseClient.from('aulas').insert([{
        professor_id: professorSession.id,
        title: title,
        topic: topic,
        series: "3º EM",
        code: code,
        questions: questionsToSave
    }]);

    if (error) {
        alert("Erro ao salvar aula no servidor: " + error.message);
        return;
    }

    alert(`Aula por Curadoria salva com sucesso! Código da Aula: ${code}`);

    document.getElementById('curatorLessonTitle').value = '';
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

async function renderCreatedLessonsList() {
    const tbody = document.getElementById('createdLessonsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando aulas...</td></tr>';

    const { data: lessons, error } = await supabaseClient
        .from('aulas')
        .select('*')
        .eq('professor_id', professorSession.id)
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Erro ao carregar: ${error.message}</td></tr>`;
        return;
    }

    if (!lessons || lessons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma aula criada ainda.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    lessons.forEach(l => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong style="color: var(--accent-blue);">${l.code}</strong></td>
            <td>${l.title}</td>
            <td>${l.topic}</td>
            <td>${l.series}</td>
            <td>${l.questions.length} questões</td>
            <td>
                <button class="btn-success btn-sm" onclick="openAssignModal('${l.id}', '${l.code}')">🔗 Atribuir</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAssignModal(aulaId, aulaCode) {
    document.getElementById('assignLessonIdInput').value = aulaId;
    document.getElementById('assignLessonCodeDisplay').textContent = aulaCode;
    
    // Reset selections
    document.getElementById('assignClassSelect').value = '';
    document.getElementById('assignStudentGroup').style.display = 'none';
    document.getElementById('assignStudentSelect').innerHTML = '<option value="todos">Todos da Turma</option>';

    document.getElementById('assignLessonModal').style.display = 'flex';
}

function closeAssignModal() {
    document.getElementById('assignLessonModal').style.display = 'none';
}

async function loadStudentsForAssignment() {
    const turma = document.getElementById('assignClassSelect').value;
    const studentGroup = document.getElementById('assignStudentGroup');
    const studentSelect = document.getElementById('assignStudentSelect');
    
    if (!turma) {
        studentGroup.style.display = 'none';
        return;
    }

    studentSelect.innerHTML = '<option value="todos">Carregando...</option>';
    studentGroup.style.display = 'block';

    const { data: students, error } = await supabaseClient
        .from('profiles')
        .select('id, nome')
        .eq('role', 'aluno')
        .eq('turma', turma)
        .order('nome', { ascending: true });

    if (error) {
        studentSelect.innerHTML = '<option value="todos">Erro ao carregar alunos</option>';
        return;
    }

    studentSelect.innerHTML = '<option value="todos">Todos da Turma</option>';
    
    if (students && students.length > 0) {
        students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            studentSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = "todos";
        opt.textContent = "Nenhum aluno cadastrado nesta turma";
        studentSelect.appendChild(opt);
    }
}

async function confirmAssignLesson() {
    const aulaId = document.getElementById('assignLessonIdInput').value;
    const turma = document.getElementById('assignClassSelect').value;
    const alunoId = document.getElementById('assignStudentSelect').value;

    if (!turma) {
        alert("Por favor, selecione uma turma.");
        return;
    }

    let insertData = {
        aula_id: aulaId,
        atribuido_por: professorSession.id
    };

    if (alunoId === 'todos') {
        insertData.turma = turma;
    } else {
        insertData.aluno_id = alunoId;
        // Opcional: Ainda guardar a turma para fins de filtro nos relatórios
        insertData.turma = turma;
    }

    const { error } = await supabaseClient.from('aulas_atribuidas').insert([insertData]);

    if (error) {
        alert("Erro ao atribuir aula: " + error.message);
        return;
    }

    if (alunoId === 'todos') {
        alert(`Aula atribuída com sucesso para toda a turma ${turma}!`);
    } else {
        const nomeAluno = document.getElementById('assignStudentSelect').options[document.getElementById('assignStudentSelect').selectedIndex].text;
        alert(`Aula atribuída com sucesso para o aluno ${nomeAluno} (${turma})!`);
    }
    closeAssignModal();
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
// MODERAÇÃO DE USUÁRIOS E NAVEGAÇÃO PROFESSOR
// =====================================================================

function switchProfessorTab(tabId) {
    activeProfessorTab = tabId;
    document.querySelectorAll('.prof-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.prof-tab-panel').forEach(panel => panel.classList.remove('active'));
    
    const btnIdMap = {
        'lessons': 'btnProfTabLessons',
        'assign': 'btnProfTabAssign',
        'analytics': 'btnProfTabAnalytics',
        'moderation': 'btnProfTabModeration',
        'students': 'btnProfTabStudents'
    };
    
    const btnId = btnIdMap[tabId];
    if (btnId) {
        document.getElementById(btnId).classList.add('active');
    }

    let panelId = 'profTabLessons';
    if (tabId === 'assign') panelId = 'profTabAssign';
    if (tabId === 'analytics') panelId = 'profTabAnalytics';
    if (tabId === 'moderation') panelId = 'profTabModeration';
    if (tabId === 'students') panelId = 'profTabStudents';
    
    const panel = document.getElementById(panelId);
    if(panel) panel.classList.add('active');

    if (tabId === 'moderation') {
        loadPendingUsers();
    }
    if (tabId === 'assign') {
        loadAssignPanelLessons();
    }
    if (tabId === 'students') {
        loadStudentsClass();
    }
}

async function loadAssignPanelLessons() {
    const lessonSelect = document.getElementById('assignPanelLessonSelect');
    if (!lessonSelect) return;
    
    lessonSelect.innerHTML = '<option value="">Carregando...</option>';

    const { data: lessons, error } = await supabaseClient
        .from('aulas')
        .select('id, title, code')
        .eq('professor_id', professorSession.id)
        .order('created_at', { ascending: false });

    if (error) {
        lessonSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        return;
    }

    if (!lessons || lessons.length === 0) {
        lessonSelect.innerHTML = '<option value="">Nenhuma aula criada. Crie uma primeira.</option>';
        return;
    }

    lessonSelect.innerHTML = '<option value="">-- Escolha a Aula --</option>';
    lessons.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.title} (${l.code})`;
        lessonSelect.appendChild(opt);
    });
}

async function loadStudentsForPanelAssignment() {
    const turma = document.getElementById('assignPanelClassSelect').value;
    const studentGroup = document.getElementById('assignPanelStudentGroup');
    const studentSelect = document.getElementById('assignPanelStudentSelect');
    
    if (!turma) {
        studentGroup.style.display = 'none';
        return;
    }

    studentSelect.innerHTML = '<option value="todos">Carregando...</option>';
    studentGroup.style.display = 'block';

    const { data: students, error } = await supabaseClient
        .from('profiles')
        .select('id, nome')
        .eq('role', 'aluno')
        .eq('turma', turma)
        .order('nome', { ascending: true });

    if (error) {
        studentSelect.innerHTML = '<option value="todos">Erro ao carregar alunos</option>';
        return;
    }

    studentSelect.innerHTML = '<option value="todos">Todos da Turma</option>';
    
    if (students && students.length > 0) {
        students.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.nome;
            studentSelect.appendChild(opt);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = "todos";
        opt.textContent = "Nenhum aluno cadastrado nesta turma";
        studentSelect.appendChild(opt);
    }
}

async function confirmPanelAssignLesson() {
    const aulaId = document.getElementById('assignPanelLessonSelect').value;
    const turma = document.getElementById('assignPanelClassSelect').value;
    const alunoId = document.getElementById('assignPanelStudentSelect').value;

    if (!aulaId) return alert("Selecione uma aula.");
    if (!turma) return alert("Selecione uma turma.");

    let insertData = {
        aula_id: aulaId,
        atribuido_por: professorSession.id
    };

    if (alunoId === 'todos') {
        insertData.turma = turma;
    } else {
        insertData.aluno_id = alunoId;
        insertData.turma = turma;
    }

    const { error } = await supabaseClient.from('aulas_atribuidas').insert([insertData]);

    if (error) {
        alert("Erro ao atribuir aula: " + error.message);
        return;
    }

    if (alunoId === 'todos') {
        alert(`Aula atribuída com sucesso para toda a turma ${turma}!`);
    } else {
        const nomeAluno = document.getElementById('assignPanelStudentSelect').options[document.getElementById('assignPanelStudentSelect').selectedIndex].text;
        alert(`Aula atribuída com sucesso para o aluno ${nomeAluno} (${turma})!`);
    }

    // Reset fields
    document.getElementById('assignPanelLessonSelect').value = '';
    document.getElementById('assignPanelClassSelect').value = '';
    document.getElementById('assignPanelStudentGroup').style.display = 'none';
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
            <td>${u.email || u.id}</td>
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

// =====================================================================
// GESTÃO DE ALUNOS E TURMAS
// =====================================================================

async function loadStudentsClass() {
    const tbody = document.getElementById('studentsClassTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregando alunos...</td></tr>';
    
    const filterClass = document.getElementById('filterStudentClass').value;
    
    let query = supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'aluno')
        .order('nome', { ascending: true });
        
    if (filterClass !== 'Todos') {
        query = query.eq('turma', filterClass);
    }
    
    const { data: students, error } = await query;
    
    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Erro ao carregar: ${error.message}</td></tr>`;
        return;
    }
    
    if (!students || students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum aluno encontrado nesta turma.</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    students.forEach(student => {
        const tr = document.createElement('tr');
        
        let statusBadge = '';
        if (student.status === 'aprovado') {
            statusBadge = '<span class="status-indicator online" style="display:inline-block; position:static;">Aprovado</span>';
        } else if (student.status === 'pendente') {
            statusBadge = '<span style="color: #f39c12; font-weight: bold;">Pendente</span>';
        } else {
            statusBadge = '<span style="color: #e74c3c; font-weight: bold;">Bloqueado</span>';
        }
        
        tr.innerHTML = `
            <td>${student.nome}</td>
            <td>${student.email || '-'}</td>
            <td>${student.turma || '-'}</td>
            <td>${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

