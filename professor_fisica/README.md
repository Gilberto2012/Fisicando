# Professor Virtual de Física - Dashboard de MUV (JAMstack + Supabase + Antigravity)

Este repositório contém o sistema completo do **Professor Virtual de Física**, projetado para guiar estudantes no aprendizado de **Movimento Uniformemente Variado (MUV)** usando a **Taxonomia de Bloom** de maneira interativa e com suporte a simulação física em tempo real.

---

## 🏗️ Arquitetura do Sistema

A aplicação foi estruturada seguindo o padrão JAMstack moderno de alto desempenho:

*   **Frontend**: HTML5, CSS3 (com Glassmorphism Premium, variáveis organizadas e responsividade) e Javascript puro. Inclui uma simulação física 2D dinâmica desenhada em HTML5 Canvas com plots gráficos de posição e velocidade em tempo real.
*   **Banco de Dados & Auth**: Supabase (PostgreSQL em nuvem + serviço integrado de Autenticação).
*   **Funções Serverless**: Estrutura de Netlify Functions para processar dados de IA e enviar relatórios via API REST de forma segura.
*   **Agente de IA**: Backend experimental integrado ao **Google Antigravity SDK** em Python.

---

## 📁 Estrutura de Pastas

```text
professor_fisica/
├── index.html                   # Interface gráfica (Chat + Simulador + Modais)
├── css/
│   └── styles.css               # Folha de estilos premium com tema escuro e glassmorphism
├── js/
│   ├── auth.js                  # Lógica de login/cadastro de alunos via Supabase Auth
│   ├── db.js                    # Persistência de sessões, respostas e notas no Supabase DB
│   ├── simulator.js             # Simulador físico e gerador dos gráficos de MUV via Canvas
│   ├── lesson.js                # Banco de perguntas da aula e lógica de avaliação Bloom
│   └── app.js                   # Orquestrador principal da interface do usuário
├── functions/
│   ├── analyze.js               # Serverless function para avaliação de IA via Gemini API
│   └── send-report.js           # Serverless function para envio de relatórios via EmailJS
├── supabase/
│   └── schema.sql               # Migrações SQL e políticas RLS para rodar no editor Supabase
├── backend/
│   ├── agent.py                 # Agente Python que se conecta ao Google Antigravity SDK
│   └── requirements.txt         # Dependências do script Python
└── README.md                    # Este arquivo com instruções completas
```

---

## 🔧 Configuração e Deploy Passo a Passo

### 1. Banco de Dados e Autenticação (Supabase)
1. Crie uma conta gratuita em [Supabase](https://supabase.com/).
2. Crie um novo projeto no seu painel.
3. No menu lateral, acesse **SQL Editor**, clique em **New Query** e cole todo o conteúdo do arquivo [supabase/schema.sql](supabase/schema.sql). Clique em **Run** para criar a estrutura de tabelas e as políticas de segurança.
4. Vá em **Project Settings > API** e copie a **Project API URL** e a **anon public key**.
5. No frontend da aplicação, clique em **Configurar** e salve estas duas chaves no painel.

### 2. Envio de E-mail de Relatórios (EmailJS)
1. Crie uma conta gratuita em [EmailJS](https://www.emailjs.com/).
2. Conecte um serviço de e-mail (como Gmail ou Outlook) para obter seu **Service ID**.
3. Crie um template de e-mail e anote o **Template ID**. Use chaves de variáveis como `{{student_name}}`, `{{bloom_summary}}`, `{{responses_text}}` e `{{recommendations}}`.
4. Obtenha sua **Public Key** na aba Account/Integration.
5. Insira todas as chaves no modal de **Configurações** do sistema no navegador.

### 3. Deploy no Netlify (Funções Serverless)
1. Suba este projeto para um repositório no seu GitHub.
2. Crie uma conta no [Netlify](https://www.netlify.com/) e conecte com seu GitHub.
3. Crie um novo site apontando para o repositório deste projeto.
4. Nas configurações do site no Netlify, adicione as seguintes variáveis de ambiente:
    *   `GEMINI_API_KEY`: Chave da API do Google Gemini (necessária para que a função serverless de análise use inteligência artificial avançada).
    *   `EMAILJS_PUBLIC_KEY`: Chave pública do EmailJS.
    *   `EMAILJS_SERVICE_ID`: Service ID obtido no EmailJS.
    *   `EMAILJS_TEMPLATE_ID`: Template ID obtido no EmailJS.
    *   `TEACHER_EMAIL`: E-mail padrão do professor que receberá os relatórios.
5. O Netlify fará o deploy automático do frontend e criará os endpoints de API baseados na pasta `functions/`.

---

## 🐍 Rodando o Agente Python (Antigravity SDK)

Se desejar testar a análise usando o Python em um ambiente de desenvolvimento local ou servidor dedicado:

1. Acesse a pasta `backend/` no terminal.
2. Certifique-se de ter o Python 3.10+ instalado.
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure a chave de API no terminal:
   *   No Windows: `set GEMINI_API_KEY="sua-chave"`
   *   No Linux/macOS: `export GEMINI_API_KEY="sua-chave"`
5. Execute o agente passando a pergunta, resposta e o nível Bloom desejado:
   ```bash
   python agent.py "O que caracteriza o MRU?" "A velocidade é constante e a aceleração é zero." "remember"
   ```
6. O terminal exibirá o JSON avaliado contendo o `score` de 0 a 10 e o `feedback` pedagógico.
