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

// Aplica parâmetros dinâmicos enviados pela IA para o simulador
function applyDynamicScenario(params) {
    if (!params) return;

    if (params.v0 !== undefined) {
        const v0Slider = document.getElementById('v0Slider');
        if (v0Slider) {
            v0Slider.value = params.v0;
            document.getElementById('v0Val').textContent = params.v0;
        }
    }
    
    if (params.a !== undefined) {
        const accSlider = document.getElementById('accSlider');
        if (accSlider) {
            accSlider.value = params.a;
            document.getElementById('accVal').textContent = params.a;
        }
    }

    // Foca na aba do simulador
    switchStudentTab('multimedia');
    switchMultimediaSubTab('simulator');

    if (window.simulator) {
        // Pausa para reiniciar com os novos valores
        window.simulator.pause();
        window.simulator.setParams(
            params.v0 !== undefined ? params.v0 : window.simulator.initialVelocity, 
            params.a !== undefined ? params.a : window.simulator.acceleration
        );
        
        setTimeout(() => {
            window.simulator.start();
            const btn = document.getElementById('simPlayBtn');
            if (btn) btn.textContent = '⏸️ Pausar';
        }, 100);
    }
}
