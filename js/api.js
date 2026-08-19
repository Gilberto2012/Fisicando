// =====================================================================
// INTEGRAÇÃO COM GEMINI API CLIENT-SIDE (CALL)
// =====================================================================
async function callGeminiAPI(apiKey, studentName, question, studentAnswer, classPrompt, persona) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
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

                Você deve responder no formato JSON exato fornecido abaixo, sem nenhuma marcação de formatação markdown extra (como \`\`\`json):
                {
                    "score": [número decimal de 0.0 a 10.0 representando a precisão física e adequação ao nível Bloom],
                    "feedback": "[Seu feedback explicativo de tutor, guiando o aluno didaticamente. Nunca dê a resposta pronta se ele errar. Destaque erros conceituais no estilo da sua persona. Em português do Brasil.]"
                }`
            }]
        }],
        generationConfig: {
            responseMimeType: "application/json"
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Erro na API do Gemini: ${response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text.trim();
    
    // Remover marcações markdown do JSON se a IA esquecer
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
}

