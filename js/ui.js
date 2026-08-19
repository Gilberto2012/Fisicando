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

