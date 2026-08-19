// =====================================================================
// INTEGRAÇÃO COM GEMINI API CLIENT-SIDE (CALL)
// =====================================================================
async function callGeminiAPI(apiKey, studentName, question, studentAnswer, classPrompt, persona, onChunk) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: `Você é um Tutor de Física Virtual de Ensino Médio, auxiliando o(a) aluno(a) ${studentName}.
Persona ativa: "${persona}".
INSTRUÇÕES DA SUA PERSONA (MANDATÓRIO): "${classPrompt}"

REGRA DE OURO (MÉTODO SOCRÁTICO):
NUNCA, sob hipótese alguma, dê a resposta pronta ou o gabarito diretamente se o aluno errar ou fizer uma pergunta direta.
O seu objetivo é FAZER O ALUNO PENSAR. Se o aluno errar ou pedir a resposta, responda com uma contra-pergunta ou analogia do cotidiano que o guie para o raciocínio correto.

CONTEXTO DA QUESTÃO:
- Nível de Bloom esperado: ${question.bloomLevel.toUpperCase()}.
- Pergunta feita: "${question.enunciado}"
- Gabarito/Resposta Esperada (SOMENTE PARA SUA REFERÊNCIA, NÃO REVELE): "${question.respostaEsperada}"

RESPOSTA DO ALUNO:
"${studentAnswer}"

INSTRUÇÕES DE FORMATAÇÃO (ESTRITAMENTE OBRIGATÓRIO):
Responda APENAS no seguinte formato, substituindo os colchetes pelo seu conteúdo. Você DEVE incluir a tag ---SCORE--- no final:

[Seu feedback socrático, encarnando 100% a sua Persona (siga as INSTRUÇÕES DA SUA PERSONA). Fale a língua do aluno. Se ele errou, não dê a resposta, faça uma pergunta reflexiva. Em português do Brasil.]

---SCORE---
[Número decimal de 0.0 a 10.0 representando a precisão física e adequação da resposta do aluno]

---SIMULATOR---
[OPCIONAL: Apenas se você quiser alterar o cenário atual do simulador para exemplificar sua explicação, envie um JSON neste formato exato (sem texto a mais): {"v0": 20, "a": -5, "x0": 0}. Senão, omita a tag ---SIMULATOR---]`
            }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let fullText = "";

    while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.replace('data: ', '').trim();
                    if (dataStr) {
                        try {
                            const dataObj = JSON.parse(dataStr);
                            if (dataObj.candidates && dataObj.candidates[0].content) {
                                const textPart = dataObj.candidates[0].content.parts[0].text;
                                fullText += textPart;
                                if (onChunk) onChunk(fullText);
                            }
                        } catch(e) {}
                    }
                }
            }
        }
    }
    
    let score = 0;
    let feedback = fullText;
    let simulatorParams = null;

    const scoreMatch = fullText.match(/---SCORE---\s*([\d.]+)/);
    if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
        feedback = feedback.replace(scoreMatch[0], "").trim();
    }

    const simMatch = fullText.match(/---SIMULATOR---\s*({[^}]+})/);
    if (simMatch) {
        try {
            simulatorParams = JSON.parse(simMatch[1]);
            feedback = feedback.replace(simMatch[0], "").trim();
        } catch(e) {}
    }
    
    // Limpar restos de tags que possam ter ficado
    feedback = feedback.replace(/---SCORE---/g, "").replace(/---SIMULATOR---/g, "").trim();

    return {
        score,
        feedback,
        simulatorParams
    };
}

