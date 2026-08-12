# -*- coding: utf-8 -*-
"""
=====================================================================
AGENTE DE INTELIGÊNCIA ARTIFICIAL - ANTIGRAVITY SDK
Avaliação Pedagógica do Aluno Baseada na Taxonomia de Bloom
=====================================================================
"""

import asyncio
import json
import sys
import os
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig

# Instruções de sistema para o Agente Pedagógico
INSTRUCOES_SISTEMA = """
Você é o Professor Virtual de Física, especialista em Movimento Uniformemente Variado (MUV) e na Taxonomia de Bloom.
Sua tarefa é analisar a resposta de um aluno a uma determinada pergunta do fluxo de aprendizagem.

Você deve responder rigorosamente no seguinte formato JSON, sem qualquer marcação de markdown (como ```json):
{
    "score": [nota de 0 a 10 de acordo com a precisão física e pedagógica],
    "feedback": "[Frase curta, incentivadora, clara e explicativa apontando acertos ou ajudando a corrigir erros]"
}
"""

async def analisar_resposta(pergunta, resposta, nivel_bloom):
    # Configurar o Agente Antigravity com as instruções de sistema em português
    config = LocalAgentConfig(
        system_instructions=INSTRUCOES_SISTEMA,
        capabilities=CapabilitiesConfig()  # Habilita capacidades padrão
    )
    
    prompt = f"""
    Analise a resposta do estudante sob a ótica da Taxonomia de Bloom no nível: '{nivel_bloom}'.
    
    Pergunta: "{pergunta}"
    Resposta do Estudante: "{resposta}"
    
    Gere o score de 0 a 10 e o feedback em português.
    """
    
    try {
        # Inicializar e rodar o Agente de IA de forma assíncrona
        async with Agent(config) as agent:
            response = await agent.chat(prompt)
            
            # Acumular a resposta textual completa do agente
            texto_resposta = ""
            async for token in response:
                texto_resposta += token
                
            # Limpar e estruturar a resposta do JSON
            texto_resposta = texto_resposta.strip().replace("```json", "").replace("```", "")
            return json.loads(texto_resposta)
            
    except Exception as e:
        # Fallback caso ocorra algum erro de conexão ou parsing
        return {
            "score": 5,
            "feedback": f"Erro de processamento no Agente Python: {str(e)}. Vamos continuar o aprendizado!"
        }

async def main():
    # Verifica se os argumentos foram passados (pergunta, resposta, nivel_bloom)
    if len(sys.argv) < 4:
        # Modo interativo simples se chamado sem parâmetros suficientes
        print(json.dumps({
            "error": "Uso incorreto. Exemplo: python agent.py 'pergunta' 'resposta' 'nivel_bloom'"
        }, ensure_ascii=False))
        return
        
    pergunta = sys.argv[1]
    resposta = sys.argv[2]
    nivel_bloom = sys.argv[3]
    
    resultado = await analisar_resposta(pergunta, resposta, nivel_bloom)
    print(json.dumps(resultado, ensure_ascii=False))

if __name__ == "__main__":
    # Tratamento especial de encoding para Windows
    if sys.platform.startswith('win'):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    
    asyncio.run(main())
