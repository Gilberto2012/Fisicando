/* =====================================================================
   NETLIFY SERVERLESS FUNCTION: /api/send-report
   Envia o e-mail de desempenho de forma segura no lado do servidor
   ===================================================================== */

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json; charset=utf-8'
    };

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
        const { toEmail, studentName, bloomSummary, responsesText, recommendations } = body;

        // Recuperar chaves de variáveis de ambiente do Netlify
        const serviceId = process.env.EMAILJS_SERVICE_ID;
        const templateId = process.env.EMAILJS_TEMPLATE_ID;
        const publicKey = process.env.EMAILJS_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Opcional para validações extras

        if (!serviceId || !templateId || !publicKey) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Configurações de e-mail do servidor incompletas. Cadastre as variáveis no painel Netlify.' 
                })
            };
        }

        // Fazer chamada direta à API REST do EmailJS (Segurança ponta a ponta)
        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                service_id: serviceId,
                template_id: templateId,
                user_id: publicKey,
                accessToken: privateKey, // Chave privada do EmailJS (se houver)
                template_params: {
                    to_email: toEmail || process.env.TEACHER_EMAIL,
                    student_name: studentName,
                    bloom_summary: bloomSummary,
                    responses_text: responsesText,
                    recommendations: recommendations,
                    date_time: new Date().toLocaleString('pt-BR')
                }
            })
        });

        if (response.ok) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Relatório enviado com sucesso via API REST.' })
            };
        } else {
            const errText = await response.text();
            throw new Error(`Falha no envio do EmailJS: ${errText}`);
        }

    } catch (error) {
        console.error("Erro interno no envio do relatório:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Erro interno no servidor' })
        };
    }
};
