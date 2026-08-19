// =====================================================================
// INTEGRAÇÃO COM GEMINI API CLIENT-SIDE (CALL)
// =====================================================================
async function callGeminiAPI(apiKey, studentName, question, studentAnswer, classPrompt, persona, onChunk) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;
    
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

                Responda no seguinte formato estrito, substituindo os colchetes por seus valores. Você DEVE incluir a tag ---SCORE--- no final.

                [Seu feedback explicativo de tutor, guiando o aluno didaticamente. Nunca dê a resposta pronta se ele errar. Destaque erros conceituais no estilo da sua persona. Em português do Brasil.]
                
                ---SCORE---
                [Número decimal de 0.0 a 10.0 representando a precisão física e adequação ao nível Bloom]

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

