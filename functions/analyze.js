/* =====================================================================
   NETLIFY SERVERLESS FUNCTION: /api/analyze
   Processa e analisa a resposta do aluno com a Taxonomia de Bloom
   ===================================================================== */

const { GoogleGenAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
    // Definir cabeçalhos CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json; charset=utf-8'
    };

    // Responder requisição de preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers, 
            body: JSON.stringify({ error: 'Método não permitido. Use POST.' }) 
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { alunoNome, respostaTexto, perguntaPasso, nivelBloom } = body;

        if (!respostaTexto) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Parâmetro respostaTexto é obrigatório.' })
            };
        }

        // Recuperar chave API do Gemini configurada nas variáveis do Netlify
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (geminiApiKey) {
            // Integração Real com IA (Gemini API) se a chave estiver configurada
            try {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                const prompt = `
                    Você é um professor de física virtual avaliando uma resposta sobre MUV (Movimento Uniformemente Variado).
                    Nome do Aluno: ${alunoNome}
                    Nível de Bloom Esperado: ${nivelBloom}
                    Pergunta feita: "${perguntaPasso}"
                    Resposta do Aluno: "${respostaTexto}"
                    
                    Analise a resposta pedagógica do aluno. Classifique de 0 a 10 de acordo com a precisão física e retorne no seguinte formato JSON (sem markdown):
                    {
                        "score": [número de 0 a 10],
                        "feedback": "[Frase motivadora em português avaliando os acertos ou erros conceituais de forma didática]"
                    }
                `;
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const jsonText = response.text().trim();
                
                // Limpar possíveis marcações de markdown do JSON retornadas pela IA
                const cleanedJsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(cleanedJsonText);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        score: analysis.score,
                        feedback: analysis.feedback,
                        metodo: "Gemini AI API"
                    })
                };
            } catch (aiError) {
                console.error("Falha ao chamar a API do Gemini, usando análise local fallback:", aiError);
            }
        }

        // REGRA DE FALLBACK (Análise Regex Local caso não haja chave da API)
        let score = 5;
        let feedback = "Bom esforço! Mas tente detalhar um pouco mais a física envolvida.";
        
        const clean = respostaTexto.toLowerCase();
        if (clean.length > 5) {
            score = 8;
            feedback = "Resposta muito boa. Você demonstrou compreender o movimento.";
        }
        if (clean.includes('constante') || clean.includes('m/s') || clean.includes('aceleracao')) {
            score = 10;
            feedback = "Excelente! Você utilizou termos científicos corretos e demonstrou domínio do tema.";
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                score,
                feedback,
                metodo: "Regra Estática (Sem Chave Gemini)"
            })
        };

    } catch (error) {
        console.error("Erro interno do servidor:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Erro interno no servidor' })
        };
    }
};
