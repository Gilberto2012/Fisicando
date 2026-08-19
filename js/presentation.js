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

