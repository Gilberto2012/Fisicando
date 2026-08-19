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

    return msgDiv.querySelector('.bubble');
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
        // Chamada real ao Gemini API (com Streaming)
        try {
            // Criar a bolha de chat provisória para o streaming
            const streamBubble = appendChatBubble("<span class='typing-indicator'>...</span>", 'teacher');

            const apiResult = await callGeminiAPI(
                systemSettings.geminiApiKey,
                studentSession.name,
                currentQuestion,
                text,
                classPrompt,
                activePersona,
                (chunk) => {
                    // Ocultar o indicador padrão de digitação do topo, pois a própria bolha está sendo escrita
                    document.getElementById('studentTypingIndicator').style.display = 'none';
                    
                    // Limpar as marcações no chunk
                    let cleanChunk = chunk.replace(/---SCORE---[\s\S]*/, "").replace(/---SIMULATOR---[\s\S]*/, "").replace(/---VIDEO---[\s\S]*/, "");
                    streamBubble.innerHTML = cleanChunk || "<span class='typing-indicator'>...</span>";
                    document.getElementById('studentChatMessages').scrollTop = document.getElementById('studentChatMessages').scrollHeight;
                }
            );
            
            score = apiResult.score || 0;
            feedback = apiResult.feedback;
            
            // Dica motivacional no final
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
            streamBubble.innerHTML = feedback;

            // Injetar os parâmetros no Simulador
            if (apiResult.simulatorParams && typeof applyDynamicScenario === 'function') {
                applyDynamicScenario(apiResult.simulatorParams);
            }
            
            // Injetar o Vídeo recomendado
            if (apiResult.videoParams && typeof applyDynamicVideo === 'function') {
                applyDynamicVideo(apiResult.videoParams);
            }
        } catch (e) {
            console.error("Falha ao chamar a API do Gemini. Usando fallback local.", e);
            document.getElementById('studentTypingIndicator').style.display = 'none';
            const mock = generateMockAIPedagogicalResponse(currentQuestion, text, activePersona, studentSession.name, activeQuestionIdx);
            score = mock.score;
            feedback = mock.feedback;
            detectedKeywords = mock.detectedKeywords;
            
            if (score < 8) feedback = `*(Um bom físico nunca desiste!)*\n\n` + feedback;
            appendChatBubble(feedback, 'teacher');
        }
    } else {
        // Sem chave: Heurística Local
        document.getElementById('studentTypingIndicator').style.display = 'none';
        const mock = generateMockAIPedagogicalResponse(currentQuestion, text, activePersona, studentSession.name, activeQuestionIdx);
        score = mock.score;
        feedback = mock.feedback;
        detectedKeywords = mock.detectedKeywords;

        if (score < 8) feedback = `*(Continue tentando!)*\n\n` + feedback;
        appendChatBubble(feedback, 'teacher');
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
        xpEarned = Math.max(25, 100 - (hintCountUsed * 25));
    } else if (score >= 5) {
        xpEarned = Math.max(15, 50 - (hintCountUsed * 10));
    } else {
        xpEarned = 10;
    }
    
    addStudentXp(xpEarned);

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

