/* =====================================================================
   BANCO DE DADOS LOCAL (localStorage) E AUTO-SEED DE DADOS RICOS
   ===================================================================== */

class LocalDatabase {
    constructor() {
        this.init();
    }

    init() {
        // Verificar se há dados. Se não houver, realizar o auto-seed.
        if (!localStorage.getItem('PHYS_STUDENTS')) {
            this.seed();
        }
    }

    // --- LEITURAS E GRAVAÇÕES ---
    getStudents() {
        return JSON.parse(localStorage.getItem('PHYS_STUDENTS')) || [];
    }

    saveStudent(student) {
        const students = this.getStudents();
        const idx = students.findIndex(s => s.id === student.id || s.name === student.name);
        if (idx !== -1) {
            students[idx] = { ...students[idx], ...student };
        } else {
            students.push(student);
        }
        localStorage.setItem('PHYS_STUDENTS', JSON.stringify(students));
        return student;
    }

    getLessons() {
        return JSON.parse(localStorage.getItem('PHYS_LESSONS')) || [];
    }

    saveLesson(lesson) {
        const lessons = this.getLessons();
        lessons.push(lesson);
        localStorage.setItem('PHYS_LESSONS', JSON.stringify(lessons));
        return lesson;
    }

    getSubmissions() {
        return JSON.parse(localStorage.getItem('PHYS_SUBMISSIONS')) || [];
    }

    saveSubmission(sub) {
        const subs = this.getSubmissions();
        subs.push(sub);
        localStorage.setItem('PHYS_SUBMISSIONS', JSON.stringify(subs));
        return sub;
    }

    getForumTopics() {
        return JSON.parse(localStorage.getItem('PHYS_FORUM_TOPICS')) || [];
    }

    saveForumTopic(topic) {
        const topics = this.getForumTopics();
        topics.push(topic);
        localStorage.setItem('PHYS_FORUM_TOPICS', JSON.stringify(topics));
        return topic;
    }

    saveForumReply(topicId, reply) {
        const topics = this.getForumTopics();
        const topic = topics.find(t => t.id === topicId);
        if (topic) {
            topic.replies.push(reply);
            localStorage.setItem('PHYS_FORUM_TOPICS', JSON.stringify(topics));
            // Disparar evento para notificar outras abas ou componentes
            window.dispatchEvent(new Event('forumUpdate'));
        }
    }

    getDirectMessages() {
        return JSON.parse(localStorage.getItem('PHYS_DIRECT_MESSAGES')) || [];
    }

    saveDirectMessage(msg) {
        const msgs = this.getDirectMessages();
        msgs.push(msg);
        localStorage.setItem('PHYS_DIRECT_MESSAGES', JSON.stringify(msgs));
        return msg;
    }

    getSystemSettings() {
        const defaultSettings = {
            geminiApiKey: "",
            emailjsPublicKey: "",
            emailjsServiceId: "",
            emailjsTemplateId: "",
            teacherEmail: "professor@escola.com",
            prompts: {
                "1º EM": "Você é um tutor de Física paciente. Nunca dê a resposta pronta, use analogias do cotidiano e guie por perguntas.",
                "2º EM": "Você é um tutor de Física provocativo. Faça perguntas reflexivas e estimule a dedução matemática das fórmulas.",
                "3º EM": "Você é um professor focado no ENEM. Sempre traga aplicações práticas e conecte os conceitos com questões típicas da prova."
            }
        };
        const saved = localStorage.getItem('PHYS_SETTINGS');
        return saved ? JSON.parse(saved) : defaultSettings;
    }

    saveSystemSettings(settings) {
        localStorage.setItem('PHYS_SETTINGS', JSON.stringify(settings));
    }

    // --- AUTO-SEED DATA (Massa de Teste para o Professor) ---
    seed() {
        // 1. Alunos Simulados
        const students = [
            { id: "s001", name: "Arthur Silva", class: "1ºA", xp: 1250, level: "Mestre", badges: ["Primeiro Passo", "Físico Matemático", "Pensador Bloom"] },
            { id: "s002", name: "Beatriz Oliveira", class: "1ºA", xp: 620, level: "Cientista", badges: ["Primeiro Passo", "Pensador Bloom"] },
            { id: "s003", name: "Carlos Eduardo", class: "1ºB", xp: 180, level: "Aprendiz", badges: ["Primeiro Passo"] },
            { id: "s004", name: "Daniela Costa", class: "1ºB", xp: 2100, level: "Lenda", badges: ["Primeiro Passo", "Físico Matemático", "Pensador Bloom", "Gênio do Fórum", "Lenda da Física"] },
            { id: "s005", name: "Enzo Gabriel", class: "2ºA", xp: 950, level: "Cientista", badges: ["Primeiro Passo", "Físico Matemático"] },
            { id: "s006", name: "Fernanda Lima", class: "2ºA", xp: 150, level: "Aprendiz", badges: [] },
            { id: "s007", name: "Gabriel Santos", class: "2ºB", xp: 1100, level: "Mestre", badges: ["Primeiro Passo", "Pensador Bloom"] },
            { id: "s008", name: "Helena Rocha", class: "2ºB", xp: 450, level: "Explorador", badges: ["Primeiro Passo"] },
            { id: "s009", name: "Igor Mendes", class: "3ºA", xp: 2200, level: "Lenda", badges: ["Primeiro Passo", "Físico Matemático", "Pensador Bloom", "Gênio do Fórum", "Lenda da Física"] },
            { id: "s010", name: "Julia Souza", class: "3ºA", xp: 850, level: "Cientista", badges: ["Primeiro Passo", "Pensador Bloom"] },
            { id: "s011", name: "Lucas Pereira", class: "3ºB", xp: 350, level: "Explorador", badges: ["Primeiro Passo"] },
            { id: "s012", name: "Mariana Alencar", class: "3ºB", xp: 1350, level: "Mestre", badges: ["Primeiro Passo", "Físico Matemático", "Pensador Bloom"] }
        ];
        localStorage.setItem('PHYS_STUDENTS', JSON.stringify(students));

        // 2. Aulas Simuladas (Salvas pelo Professor)
        const lessons = [
            { id: "L-101", title: "Introdução à Cinemática (MRU/MUV)", topic: "MUV", series: "1º EM", code: "CINEMA1", questionIds: ["q001", "q002", "q004"] },
            { id: "L-201", title: "Aplicações das Leis de Newton", topic: "Leis de Newton", series: "2º EM", code: "NEWTON2", questionIds: ["q006", "q007", "q009"] },
            { id: "L-301", title: "Termodinâmica para o ENEM", topic: "Termodinâmica", series: "3º EM", code: "TERMO3", questionIds: ["q011", "q012", "q015"] }
        ];
        localStorage.setItem('PHYS_LESSONS', JSON.stringify(lessons));

        // 3. Submissões Simuladas de Exercícios (Logs para Gráficos)
        // Isso preencherá o Dashboard do Professor e do Aluno com notas variadas nos níveis Bloom
        const submissions = [];
        const baseDate = new Date();
        
        // Vamos gerar submissões ricas para as turmas
        const testSubmissions = [
            // Arthur (1ºA) - Bons resultados
            { studentName: "Arthur Silva", class: "1ºA", lessonCode: "CINEMA1", date: new Date(baseDate.getTime() - 2*24*60*60*1000).toISOString(), score: 9.3, timeElapsed: 280, bloomScores: { remember: 10, understand: 8, apply: 10, analyze: 9, evaluate: 9, create: 10 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q001", studentAnswer: "O tempo é de 2,5 horas. Dividi os 180 km por 72 km/h.", score: 10, bloomLevel: "remember" },
                { questionId: "q002", studentAnswer: "Fiz 20 / 5 e deu 4 m/s² de aceleração.", score: 8, bloomLevel: "apply" },
                { questionId: "q004", studentAnswer: "A área sob a curva do gráfico de v x t é o deslocamento e a inclinação é a aceleração.", score: 10, bloomLevel: "understand" }
            ]},
            // Beatriz (1ºA) - Resultados médios
            { studentName: "Beatriz Oliveira", class: "1ºA", lessonCode: "CINEMA1", date: new Date(baseDate.getTime() - 1*24*60*60*1000).toISOString(), score: 7.3, timeElapsed: 410, bloomScores: { remember: 8, understand: 6, apply: 8, analyze: 7, evaluate: 8, create: 7 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q001", studentAnswer: "Ele leva 2 horas e meia porque 180/72 = 2.5", score: 10, bloomLevel: "remember" },
                { questionId: "q002", studentAnswer: "Acho que a aceleração é 4 m/s. Dividi 20 por 5.", score: 8, bloomLevel: "apply" },
                { questionId: "q004", studentAnswer: "A linha mostra a aceleração e a área mostra a velocidade.", score: 4, bloomLevel: "understand" }
            ]},
            // Carlos Eduardo (1ºB) - Dificuldade, uso superficial detectado (resposta rápida, copiada)
            { studentName: "Carlos Eduardo", class: "1ºB", lessonCode: "CINEMA1", date: new Date(baseDate.getTime() - 4*60*60*1000).toISOString(), score: 4.6, timeElapsed: 45, bloomScores: { remember: 6, understand: 4, apply: 4, analyze: 4, evaluate: 5, create: 5 }, aiCorrectUse: "Uso Superficial", responses: [
                { questionId: "q001", studentAnswer: "2.5 horas", score: 8, bloomLevel: "remember" },
                { questionId: "q002", studentAnswer: "4 m/s2", score: 6, bloomLevel: "apply" },
                { questionId: "q004", studentAnswer: "sei la", score: 0, bloomLevel: "understand" }
            ]},
            // Daniela Costa (1ºB) - Excelente, uso produtivo
            { studentName: "Daniela Costa", class: "1ºB", lessonCode: "CINEMA1", date: new Date().toISOString(), score: 10, timeElapsed: 320, bloomScores: { remember: 10, understand: 10, apply: 10, analyze: 10, evaluate: 10, create: 10 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q001", studentAnswer: "Dividindo a distância total pela velocidade constante (t = d / v), temos: t = 180 km / 72 km/h = 2,5 horas. O carro leva exatamente duas horas e meia.", score: 10, bloomLevel: "remember" },
                { questionId: "q002", studentAnswer: "Como o carro parte do repouso, v0 = 0. A aceleração é dada pela variação de velocidade pelo tempo: a = (20 - 0) / 5 = 4 m/s².", score: 10, bloomLevel: "apply" },
                { questionId: "q004", studentAnswer: "Fisicamente, a área sob a reta do gráfico v x t equivale numericamente à distância percorrida pelo objeto. Já a inclinação da reta representa sua aceleração (taxa de mudança de velocidade).", score: 10, bloomLevel: "understand" }
            ]},
            // Enzo (2ºA) - Newton, uso produtivo
            { studentName: "Enzo Gabriel", class: "2ºA", lessonCode: "NEWTON2", date: new Date(baseDate.getTime() - 3*24*60*60*1000).toISOString(), score: 8.6, timeElapsed: 220, bloomScores: { remember: 9, understand: 8, apply: 9, analyze: 8, evaluate: 9, create: 9 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q006", studentAnswer: "Isso ocorre por causa da inércia. O passageiro tem a mesma velocidade do ônibus, e quando o ônibus para, o corpo tenta continuar andando.", score: 10, bloomLevel: "understand" },
                { questionId: "q007", studentAnswer: "Pela fórmula F = m.a, temos 20 = 5.a, logo a aceleração é de 4 m/s².", score: 10, bloomLevel: "apply" },
                { questionId: "q009", studentAnswer: "Os pneus lisos derrapam porque a água impede o contato com o asfalto. Sulcos removem a água.", score: 8, bloomLevel: "analyze" }
            ]},
            // Gabriel (2ºB) - Newton
            { studentName: "Gabriel Santos", class: "2ºB", lessonCode: "NEWTON2", date: new Date(baseDate.getTime() - 12*60*60*1000).toISOString(), score: 8.0, timeElapsed: 195, bloomScores: { remember: 8, understand: 8, apply: 8, analyze: 8, evaluate: 8, create: 8 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q006", studentAnswer: "Por causa da inércia que faz os corpos continuarem em movimento.", score: 8, bloomLevel: "understand" },
                { questionId: "q007", studentAnswer: "a = 20 / 5 = 4 m/s²", score: 10, bloomLevel: "apply" },
                { questionId: "q009", studentAnswer: "Os sulcos servem para a água sair e o carro não derrapar na pista molhada.", score: 6, bloomLevel: "analyze" }
            ]},
            // Igor Mendes (3ºA) - Termodinâmica, Lenda
            { studentName: "Igor Mendes", class: "3ºA", lessonCode: "TERMO3", date: new Date(baseDate.getTime() - 5*24*60*60*1000).toISOString(), score: 9.6, timeElapsed: 340, bloomScores: { remember: 10, understand: 10, apply: 10, analyze: 9, evaluate: 9, create: 10 }, aiCorrectUse: "Uso Produtivo", responses: [
                { questionId: "q011", studentAnswer: "A temperatura mede o grau médio de energia cinética das moléculas. Quanto mais quente o gás, mais rápido as moléculas se movem.", score: 10, bloomLevel: "remember" },
                { questionId: "q012", studentAnswer: "Q = m.c.dT = 200 * 1 * (50-20) = 200 * 30 = 6000 calorias.", score: 10, bloomLevel: "apply" },
                { questionId: "q015", studentAnswer: "Não é possível ter uma máquina 100% eficiente porque viola a Segunda Lei da Termodinâmica. Sempre há perda para a fonte fria.", score: 10, bloomLevel: "evaluate" }
            ]}
        ];
        localStorage.setItem('PHYS_SUBMISSIONS', JSON.stringify(testSubmissions));

        // 4. Fórum de Dúvidas
        const forumTopics = [
            {
                id: "f001",
                title: "Dúvida na questão da queda livre da pedra",
                author: "Beatriz Oliveira",
                class: "1ºA",
                content: "Pessoal, por que a fórmula da altura na queda livre é h = g*t²/2? De onde vem esse 'dividido por 2'?",
                date: new Date(baseDate.getTime() - 2*24*60*60*1000).toISOString(),
                resolved: true,
                replies: [
                    {
                        author: "Professor Virtual",
                        role: "teacher",
                        content: "Olá Beatriz! Esse dividido por 2 vem da integração da velocidade no tempo. Lembra que a velocidade na queda livre aumenta constantemente? v = g*t. O gráfico v x t forma um triângulo cuja área é a distância (altura). A área do triângulo é (base * altura) / 2, que nos dá (t * (g*t)) / 2 = g*t²/2!",
                        date: new Date(baseDate.getTime() - 2*24*60*60*1000 + 30*60*1000).toISOString()
                    },
                    {
                        author: "Daniela Costa",
                        role: "student",
                        content: "Caraca, professor! Que explicação sensacional. Eu tinha decorado a fórmula, mas agora realmente entendi o motivo geométrico!",
                        date: new Date(baseDate.getTime() - 2*24*60*60*1000 + 60*60*1000).toISOString()
                    }
                ]
            },
            {
                id: "f002",
                title: "Diferença entre atrito estático e cinético na curva",
                author: "Enzo Gabriel",
                class: "2ºA",
                content: "Por que na questão do carro fazendo curva a força centrípeta é o atrito estático e não o cinético? O carro não está em movimento?",
                date: new Date(baseDate.getTime() - 1*24*60*60*1000).toISOString(),
                resolved: false,
                replies: [
                    {
                        author: "Igor Mendes",
                        role: "student",
                        content: "Cara, o carro está se movendo para a frente, mas lateralmente (na direção do centro da curva) o pneu não desliza sobre a pista. Se ele deslizasse lateralmente, ele estaria derrapando (atrito cinético). Como ele faz a curva firme, a força lateral é atrito estático!",
                        date: new Date(baseDate.getTime() - 1*24*60*60*1000 + 40*60*1000).toISOString()
                    }
                ]
            }
        ];
        localStorage.setItem('PHYS_FORUM_TOPICS', JSON.stringify(forumTopics));

        // 5. Mensagens Diretas com o Professor (Histórico de Chat do Aluno)
        const messages = [
            { id: "m001", studentName: "Arthur Silva", sender: "student", text: "Professor, o senhor vai passar trabalho valendo nota de MUV?", date: new Date(baseDate.getTime() - 3*24*60*60*1000).toISOString() },
            { id: "m002", studentName: "Arthur Silva", sender: "teacher", text: "Olá Arthur! Sim, a nota da aula interativa de MUV aqui no portal fará parte da média mensal. Continue estudando!", date: new Date(baseDate.getTime() - 3*24*60*60*1000 + 2*60*60*1000).toISOString() }
        ];
        localStorage.setItem('PHYS_DIRECT_MESSAGES', JSON.stringify(messages));
    }
}

const LocalDB = new LocalDatabase();
