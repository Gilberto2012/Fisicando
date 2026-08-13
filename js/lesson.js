/* =====================================================================
   BANCO DE QUESTÕES DE FÍSICA E REGRAS PEDAGÓGICAS (TAXONOMIA DE BLOOM)
   ===================================================================== */

const PHYSICS_QUESTION_BANK = [
    // --- 1. CINEMÁTICA ---
    {
        id: "q001",
        enunciado: "Um carro percorre uma estrada reta com velocidade constante de 72 km/h. Quanto tempo, em horas, ele leva para percorrer uma distância de 180 km? Apresente o seu raciocínio e cálculo.",
        tipo: "calculo",
        bloomLevel: "remember",
        palavrasChave: ["tempo", "dividir", "2.5", "2,5", "horas", "distancia", "velocidade"],
        respostaEsperada: "O tempo é de 2,5 horas (t = d / v = 180 / 72 = 2,5 horas).",
        formula: "v = d / t ou t = d / v",
        dificuldade: 1,
        dicas: [
            "Use a fórmula básica da velocidade média: v = d / t.",
            "Lembre-se de que queremos encontrar o tempo (t), então podemos isolá-lo: t = d / v.",
            "Divida a distância total de 180 km pela velocidade constante de 72 km/h."
        ],
        fonte: "Elaboração própria",
        tags: ["MRU", "Velocidade Média", "Cinemática"],
        explicacao: "No Movimento Retilíneo Uniforme (MRU), a velocidade é constante. A relação entre espaço, tempo e velocidade é dada por v = d/t. Para obter o tempo t, dividimos a distância percorrida pela velocidade: t = 180 km / 72 km/h = 2,5 horas (ou 2 horas e 30 minutos)."
    },
    {
        id: "q002",
        enunciado: "Um veículo parte do repouso e atinge a velocidade de 20 m/s após 5 segundos em uma pista reta com aceleração constante. Qual o valor da aceleração desse veículo? Explique como obteve a resposta.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["4", "m/s2", "aceleracao", "variacao", "tempo", "dividir", "repouso"],
        respostaEsperada: "A aceleração é de 4 m/s² (a = Δv / Δt = (20 - 0) / 5 = 4 m/s²).",
        formula: "a = Δv / Δt",
        dificuldade: 2,
        dicas: [
            "Aceleração mede a variação da velocidade pelo tempo: a = (v_final - v_inicial) / t.",
            "Partir do repouso significa que a velocidade inicial (v_inicial) é 0 m/s.",
            "A velocidade varia de 0 a 20 m/s em 5 segundos. Faça a divisão da variação pelo tempo."
        ],
        fonte: "Elaboração própria",
        tags: ["MUV", "Aceleração", "Cinemática"],
        explicacao: "A aceleração escalar média é a variação da velocidade dividida pelo tempo decorrido. Como o carro partiu do repouso, v0 = 0 e vf = 20 m/s. Portanto, a = (20 - 0) / 5 = 4 m/s²."
    },
    {
        id: "q003",
        enunciado: "Uma pedra é abandonada do alto de uma ponte e atinge a água após 3 segundos. Desprezando a resistência do ar e adotando a aceleração da gravidade g = 10 m/s², qual é a altura da ponte? Apresente os seus cálculos.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["45", "metros", "gravidade", "queda", "livre", "tempo", "equacao"],
        respostaEsperada: "A altura da ponte é 45 metros (h = g * t² / 2 = 10 * 3² / 2 = 45m).",
        formula: "h = (g * t^2) / 2",
        dificuldade: 2,
        dicas: [
            "Em queda livre partindo do repouso, a altura percorrida é calculada pela fórmula h = g * t² / 2.",
            "Eleve o tempo de 3 segundos ao quadrado antes de multiplicar pela gravidade g = 10.",
            "Divida o resultado obtido por 2 para encontrar a altura final."
        ],
        fonte: "FUVEST (adaptada)",
        tags: ["Queda Livre", "Gravidade", "Cinemática"],
        explicacao: "Em queda livre (sem velocidade inicial e sem resistência do ar), o espaço percorrido em função do tempo é h = g.t²/2. Substituindo os valores: h = 10 * 3² / 2 = 10 * 9 / 2 = 90 / 2 = 45 metros."
    },
    {
        id: "q004",
        enunciado: "Em um gráfico de Velocidade versus Tempo (v x t) de um objeto em movimento uniformemente variado (MUV), o que a área sob a reta representa fisicamente e o que a inclinação dessa reta representa? Explique conceitualmente.",
        tipo: "grafico",
        bloomLevel: "understand",
        palavrasChave: ["distancia", "deslocamento", "aceleracao", "inclinacao", "area", "fisicamente", "variacao de posicao"],
        respostaEsperada: "A área sob a reta representa o deslocamento (variação de posição) e a inclinação da reta representa a aceleração.",
        formula: "Área = Deslocamento (Δs), Inclinação = Aceleração (a)",
        dificuldade: 2,
        dicas: [
            "Pense nas unidades. No gráfico v x t, o produto dos eixos é Velocidade (m/s) x Tempo (s). O que isso mede?",
            "A inclinação de uma linha mede a taxa de variação vertical dividida pela variação horizontal (eixo y pelo eixo x). O que é velocidade dividida por tempo?",
            "A inclinação nos dá a taxa de aceleração e a área corresponde ao espaço percorrido (deslocamento)."
        ],
        fonte: "Elaboração própria",
        tags: ["Análise Gráfica", "MUV", "Cinemática"],
        explicacao: "Em qualquer gráfico v x t, a área da figura formada sob a curva é numericamente igual ao deslocamento (Δs) do móvel. A inclinação da reta (coeficiente angular) indica a taxa de variação da velocidade no tempo, que é a definição física de aceleração (a)."
    },
    {
        id: "q005",
        enunciado: "Se soltarmos uma folha de papel aberta e uma amassada de uma mesma altura em uma sala comum, qual delas atingirá o solo primeiro e por quê? Como seria esse comportamento se estivessem no vácuo completo? Classifique o fenômeno.",
        tipo: "cotidiano",
        bloomLevel: "evaluate",
        palavrasChave: ["amassada", "ar", "resistencia", "vacuo", "juntas", "massa", "gravidade", "peso"],
        respostaEsperada: "Na sala comum, a folha amassada cai primeiro devido à menor resistência do ar. No vácuo, cairiam juntas porque não há ar e a aceleração da gravidade atua igualmente sobre ambas, independente da forma ou massa.",
        formula: "Nenhuma",
        dificuldade: 3,
        dicas: [
            "Pense em qual folha sofre mais atrito ou oposição com as moléculas de ar da sala.",
            "No vácuo não há matéria (sem ar). Qual força ou obstáculo estaria ausente para frear as folhas?",
            "Lembre-se do famoso experimento de Galileu sobre a queda dos corpos no vácuo."
        ],
        fonte: "ENEM (adaptada)",
        tags: ["Resistência do Ar", "Queda Livre", "Gravidade"],
        explicacao: "No ar, a folha aberta tem maior área de contato, sofrendo uma força de resistência do ar maior que a folha amassada, o que reduz sua aceleração. No vácuo, não há resistência do ar; portanto, os dois corpos caem sob ação exclusiva da gravidade com a mesma aceleração (g), atingindo o solo ao mesmo tempo."
    },

    // --- 2. LEIS DE NEWTON ---
    {
        id: "q006",
        enunciado: "Com base na Primeira Lei de Newton (Lei da Inércia), explique detalhadamente por que uma pessoa que está em pé em um ônibus em movimento é arremessada para a frente quando o motorista freia bruscamente.",
        tipo: "conceitual",
        bloomLevel: "understand",
        palavrasChave: ["inercia", "movimento", "continuar", "estado", "repouso", "corpo", "freia"],
        respostaEsperada: "Por inércia, o corpo do passageiro tende a manter o seu estado original de movimento em linha reta e com velocidade constante, continuando a avançar quando o ônibus é freado.",
        formula: "F_resultante = 0 => v = constante",
        dificuldade: 1,
        dicas: [
            "Defina o que é a inércia: a propriedade da matéria de resistir a mudanças em seu estado de repouso ou movimento.",
            "Antes de o ônibus frear, qual era o estado de movimento do corpo do passageiro?",
            "Quando a força dos freios atua no ônibus, ela é aplicada diretamente ao corpo do passageiro?"
        ],
        fonte: "Elaboração própria",
        tags: ["Inércia", "1ª Lei de Newton", "Dinâmica"],
        explicacao: "De acordo com a Primeira Lei de Newton, um corpo tende a manter seu estado de repouso ou de movimento retilíneo uniforme a menos que uma força externa atue sobre ele. Como o passageiro se movia junto com o ônibus, ao ocorrer a frenagem, seu corpo tende a continuar em movimento para a frente com a mesma velocidade."
    },
    {
        id: "q007",
        enunciado: "Um bloco de massa m = 5 kg está sobre uma mesa horizontal perfeitamente lisa (sem atrito) e é puxado por uma força horizontal constante de F = 20 N. Determine a aceleração adquirida pelo bloco. Mostre o cálculo.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["4", "m/s2", "segunda", "lei", "forca", "massa", "dividir"],
        respostaEsperada: "A aceleração é de 4 m/s² (F = m * a => a = F / m = 20 / 5 = 4 m/s²).",
        formula: "F = m * a",
        dificuldade: 1,
        dicas: [
            "Use a Segunda Lei de Newton (Princípio Fundamental da Dinâmica): F = m * a.",
            "Temos a Força resultante (20 N) e a massa (5 kg). Isole a aceleração (a) na fórmula.",
            "Divida o valor da força pela massa do bloco."
        ],
        fonte: "Elaboração própria",
        tags: ["2ª Lei de Newton", "Força e Aceleração", "Dinâmica"],
        explicacao: "Pela Segunda Lei de Newton (F = m.a), a aceleração gerada em um corpo é diretamente proporcional à força resultante aplicada e inversamente proporcional à sua massa. Assim: a = F / m = 20 N / 5 kg = 4 m/s²."
    },
    {
        id: "q008",
        enunciado: "Um estudante empurra com todas as suas forças uma grande parede de concreto de sua escola aplicando uma força horizontal de 150 N. A parede permanece imóvel. O estudante afirma que a parede não exerceu nenhuma força sobre ele. Com base na Terceira Lei de Newton, avalie a afirmação do estudante. Qual a força de reação exercida pela parede?",
        tipo: "conceitual",
        bloomLevel: "remember",
        palavrasChave: ["incorreta", "errado", "reacao", "acao", "150", "mesma", "sentido", "oposto", "parede"],
        respostaEsperada: "A afirmação é incorreta. Pela Terceira Lei de Newton (Ação e Reação), a parede exerce uma força de reação de mesma intensidade (150 N) e mesma direção sobre o estudante, porém no sentido oposto.",
        formula: "F_ação = -F_reação",
        dificuldade: 2,
        dicas: [
            "Enuncie a 3ª Lei de Newton: 'Para toda ação, há sempre uma reação de mesma intensidade e direção, mas sentidos opostos'.",
            "Se o estudante empurra a parede (ação), a parede reage empurrando o estudante (reação).",
            "As forças de ação e reação SEMPRE ocorrem em corpos diferentes e têm exatamente o mesmo valor numérico."
        ],
        fonte: "Elaboração própria",
        tags: ["Ação e Reação", "3ª Lei de Newton", "Dinâmica"],
        explicacao: "A afirmação do estudante viola a Terceira Lei de Newton. Forças sempre surgem aos pares (interações). Se o aluno empurra a parede com 150 N (ação), a parede reage instantaneamente empurrando-o de volta com os mesmos 150 N (reação), na mesma direção, mas em sentido contrário."
    },
    {
        id: "q009",
        enunciado: "Por que os pneus dos automóveis possuem sulcos (desenhos e ranhuras) na borracha e o que aconteceria se os carros trafegassem com pneus completamente lisos (conhecidos como pneus 'carecas') em um dia de chuva forte sobre o asfalto? Explique a física do atrito envolvida.",
        tipo: "cotidiano",
        bloomLevel: "analyze",
        palavrasChave: ["atrito", "agua", "aquaplanagem", "sulcos", "escoar", "derrapar", "pneus", "aderencia"],
        respostaEsperada: "Os sulcos servem para escoar a água e evitar a aquaplanagem. Pneus lisos flutuariam sobre a camada de água, reduzindo drasticamente a força de atrito com o asfalto e provocando derrapagens.",
        formula: "Fat = μ * N",
        dificuldade: 2,
        dicas: [
            "Qual o papel da água que fica acumulada entre o pneu e o asfalto?",
            "Como os sulcos ajudam a lidar com essa água no pneu em movimento?",
            "Explique o conceito de atrito cinético/estático e como a perda de contato direto com o asfalto afeta a capacidade de frear."
        ],
        fonte: "ENEM",
        tags: ["Força de Atrito", "Aquaplanagem", "Cotidiano"],
        explicacao: "Os sulcos dos pneus têm a função de drenar a água acumulada na pista de rolamento. Sem eles (pneu careca), cria-se uma película de água sob o pneu, impedindo o contato da borracha com o asfalto (aquaplanagem). Isso reduz o coeficiente de atrito (μ) a quase zero, impedindo a tração e frenagem do veículo."
    },
    {
        id: "q010",
        enunciado: "Um carro de corrida faz uma curva circular horizontal com velocidade de módulo constante (ex: 100 km/h). Existe aceleração atuando sobre o veículo nesse caso? Qual é a força resultante responsável por manter o carro na trajetória curva e como ela atua?",
        tipo: "conceitual",
        bloomLevel: "evaluate",
        palavrasChave: ["sim", "centripeta", "aceleracao", "direcao", "vetor", "atrito", "centro", "curva"],
        respostaEsperada: "Sim, existe aceleração centrípeta devido à mudança na direção do vetor velocidade. A força resultante responsável é a força centrípeta (provida pela força de atrito estático entre os pneus e a pista) que aponta para o centro da curva.",
        formula: "Ac = v² / R e Fc = m * v² / R",
        dificuldade: 3,
        dicas: [
            "Lembre-se de que a velocidade é uma grandeza vetorial (possui valor, direção e sentido). Se a direção muda, existe aceleração?",
            "Qual aceleração é responsável por alterar apenas a direção da velocidade, sem alterar seu módulo?",
            "O que evita que o carro saia pela tangente da curva? Pense na força de contato lateral entre os pneus e o asfalto."
        ],
        fonte: "Elaboração própria",
        tags: ["Força Centrípeta", "Aceleração Vetorial", "Movimento Curvilíneo"],
        explicacao: "Sim, há aceleração. A velocidade é vetorial. Embora seu módulo (100 km/h) seja constante, sua direção varia a cada instante. Essa variação direcional caracteriza a aceleração centrípeta, que aponta para o centro da curva. A força resultante que causa essa aceleração é a força centrípeta, que na curva é a própria força de atrito entre os pneus e o asfalto."
    },

    // --- 3. TERMODINÂMICA ---
    {
        id: "q011",
        enunciado: "O que é a temperatura de um gás ideal sob o ponto de vista microscópico (Teoria Cinética dos Gases)? Explique como a temperatura se relaciona com o comportamento das moléculas do gás.",
        tipo: "conceitual",
        bloomLevel: "remember",
        palavrasChave: ["agitacao", "moleculas", "energia", "cinetica", "movimento", "calor", "velocidade"],
        respostaEsperada: "A temperatura é uma medida do grau de agitação térmica (ou energia cinética média) das moléculas do gás. Quanto maior a agitação, maior a temperatura.",
        formula: "Ec = (3/2) * k * T",
        dificuldade: 1,
        dicas: [
            "Imagine o que as moléculas de um gás fazem quando ele é aquecido (ganham velocidade).",
            "Use o termo 'energia cinética' (energia do movimento) associado às moléculas.",
            "Resuma a relação entre a agitação microscópica e a grandeza macroscópica chamada temperatura."
        ],
        fonte: "Elaboração própria",
        tags: ["Teoria Cinética", "Temperatura", "Termodinâmica"],
        explicacao: "Microscopicamente, a temperatura absoluta de um gás é diretamente proporcional à energia cinética média de translação de suas partículas. Ou seja, ela é uma representação macroscópica direta da velocidade e da agitação interna média de seus átomos/moléculas."
    },
    {
        id: "q012",
        enunciado: "Uma panela contém 200 g de água pura à temperatura inicial de 20 °C. Sabendo que o calor específico da água é c = 1 cal/g°C, calcule a quantidade de calor (em calorias) necessária para aquecer essa massa de água até 50 °C. Mostre seu cálculo.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["6000", "calorias", "q", "m", "c", "t", "multiplicar", "6.000", "cal"],
        respostaEsperada: "São necessárias 6000 calorias (Q = m * c * ΔT = 200 * 1 * (50 - 20) = 200 * 30 = 6000 cal).",
        formula: "Q = m * c * ΔT",
        dificuldade: 1,
        dicas: [
            "Use a equação fundamental da calorimetria: Q = m * c * ΔT (famoso 'Que Macete').",
            "Calcule a variação de temperatura (ΔT = Temperatura final - Temperatura inicial).",
            "Multiplique a massa (200g), o calor específico (1 cal/g°C) e a variação de temperatura obtida."
        ],
        fonte: "Elaboração própria",
        tags: ["Calor Sensível", "Calorimetria", "Termodinâmica"],
        explicacao: "O calor necessário para alterar a temperatura sem mudar o estado físico é o calor sensível. Usamos Q = m.c.ΔT. A variação de temperatura ΔT é 50°C - 20°C = 30°C. Substituindo: Q = 200g * 1 cal/g°C * 30°C = 6000 cal (ou 6 kcal)."
    },
    {
        id: "q013",
        enunciado: "Um balão contendo um gás ideal sofre uma transformação isobárica (pressão constante). Se a temperatura absoluta (em Kelvin) desse gás for duplicada, o que ocorrerá com o volume ocupado pelo gás no interior do balão? Explique com base na Lei de Charles.",
        tipo: "calculo",
        bloomLevel: "understand",
        palavrasChave: ["duplicar", "dobrar", "proporcional", "volume", "temperatura", "isobarica", "charles"],
        respostaEsperada: "O volume também irá duplicar (dobrar). Em uma transformação isobárica, o volume de uma massa gasosa é diretamente proporcional à sua temperatura absoluta (V1/T1 = V2/T2).",
        formula: "V / T = constante",
        dificuldade: 2,
        dicas: [
            "Uma transformação isobárica mantém a pressão constante.",
            "A Lei de Charles afirma que sob pressão constante, Volume e Temperatura Absoluta são grandezas diretamente proporicionais.",
            "Se as grandezas são diretamente proporcionais, o que acontece com uma quando a outra dobra de valor?"
        ],
        fonte: "Elaboração própria",
        tags: ["Gases Ideais", "Lei de Charles", "Termodinâmica"],
        explicacao: "Na transformação isobárica (p = constante), vigora a Lei de Charles e Gay-Lussac: V/T = constante. Isso estabelece que o volume ocupado pelo gás varia na mesma proporção de sua temperatura absoluta (em Kelvin). Portanto, se T final é 2 * T inicial, o volume final necessariamente será 2 * V inicial."
    },
    {
        id: "q014",
        enunciado: "Durante uma rápida transformação adiabática de um gás ideal contido em um pistão, o gás realiza um trabalho de 50 J sobre o meio externo. Sob a luz da Primeira Lei da Termodinâmica, explique o que acontece com a energia interna e com a temperatura desse gás.",
        tipo: "conceitual",
        bloomLevel: "analyze",
        palavrasChave: ["diminui", "esfria", "queda", "trabalho", "energia", "interna", "adiabatica", "calor", "zero", "reduz"],
        respostaEsperada: "A energia interna diminui em 50 J (ΔU = -50 J) e, consequentemente, a temperatura do gás diminui (o gás resfria). Em processos adiabáticos não há troca de calor (Q=0), então ΔU = -W.",
        formula: "ΔU = Q - W",
        dificuldade: 3,
        dicas: [
            "Lembre-se de que em uma transformação adiabática não ocorre troca de calor com o meio (Q = 0).",
            "Escreva a Primeira Lei da Termodinâmica: ΔU = Q - W (onde U é energia interna, Q é calor e W é trabalho).",
            "Se Q = 0 e o trabalho W é positivo (+50 J, pois o gás realiza trabalho), qual o valor e o sinal de ΔU? Como isso afeta a temperatura?"
        ],
        fonte: "UNICAMP (adaptada)",
        tags: ["1ª Lei da Termodinâmica", "Processo Adiabático", "Trabalho de um Gás"],
        explicacao: "Pela Primeira Lei da Termodinâmica, ΔU = Q - W. Por ser adiabática, Q = 0, logo ΔU = -W. Como o gás realiza trabalho de 50 J (W = +50 J), a variação da energia interna é ΔU = -50 J. Como a energia interna (U) diminui, a temperatura absoluta do gás também cai, resultando em resfriamento."
    },
    {
        id: "q015",
        enunciado: "É possível construir uma máquina térmica que, operando em ciclos, retire calor de uma fonte quente e o converta integralmente em trabalho útil (rendimento de 100%)? Justifique sua resposta citando a lei física violada por essa suposta máquina.",
        tipo: "enem",
        bloomLevel: "evaluate",
        palavrasChave: ["nao", "impossivel", "segunda", "lei", "rendimento", "100", "calor", "trabalho", "fonte", "fria", "entropia"],
        respostaEsperada: "Não é possível. Isso viola a Segunda Lei da Termodinâmica (Enunciado de Kelvin-Planck), que afirma ser impossível converter integralmente calor em trabalho em um ciclo térmico. Sempre haverá perda de calor para uma fonte fria.",
        formula: "η = 1 - (Q_fria / Q_quente) < 1",
        dificuldade: 3,
        dicas: [
            "Pense nas exigências da natureza sobre os fluxos de calor. O calor pode fluir de forma 100% eficiente para trabalho?",
            "Qual lei da termodinâmica lida com a desordem (entropia) e a impossibilidade de rendimentos perfeitos?",
            "Lembre-se de que uma parte do calor absorvido de uma fonte quente DEVE obrigatoriamente ser rejeitada para onde?"
        ],
        fonte: "ENEM",
        tags: ["Segunda Lei da Termodinâmica", "Máquinas Térmicas", "Rendimento"],
        explicacao: "De acordo com o enunciado de Kelvin-Planck da Segunda Lei da Termodinâmica, é impossível construir um dispositivo que opere em ciclo térmico e que converta integralmente calor absorvido de uma fonte quente em trabalho mecânico. É obrigatório haver uma rejeição de calor para uma fonte de menor temperatura (fonte fria), garantindo rendimento sempre inferior a 100%."
    },

    // --- 4. ONDULATÓRIA ---
    {
        id: "q016",
        enunciado: "Uma onda periódica propaga-se ao longo de uma corda esticada com uma frequência constante de 50 Hz. Sabendo que o comprimento de onda dessa oscilação é λ = 0,2 metros, calcule a velocidade de propagação da onda na corda. Mostre a fórmula e o cálculo.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["10", "m/s", "velocidade", "onda", "frequencia", "comprimento", "multiplicar", "v", "lambda", "f"],
        respostaEsperada: "A velocidade de propagação é de 10 m/s (v = λ * f = 0,2 * 50 = 10 m/s).",
        formula: "v = λ * f",
        dificuldade: 1,
        dicas: [
            "Use a equação fundamental da ondulatória: v = λ * f (velocidade = comprimento de onda x frequência).",
            "Substitua os valores: λ (comprimento de onda) = 0,2 m e f (frequência) = 50 Hz.",
            "Realize a multiplicação direta dos dois valores."
        ],
        fonte: "Elaboração própria",
        tags: ["Equação Fundamental", "Velocidade de Onda", "Ondulatória"],
        explicacao: "A velocidade de propagação de uma onda é determinada pela relação fundamental v = λ * f. Sabendo que f = 50 Hz e λ = 0,2 m, temos: v = 0,2 * 50 = 10 m/s."
    },
    {
        id: "q017",
        enunciado: "Quando uma onda sonora produzida no ar por um diapasão penetra na água de uma piscina, sua velocidade de propagação aumenta. O que acontece com a frequência e com o comprimento de onda desse som ao mudar de meio? Justifique fisicamente.",
        tipo: "conceitual",
        bloomLevel: "understand",
        palavrasChave: ["frequencia", "constante", "nao altera", "comprimento", "aumenta", "fonte", "meio", "refracao"],
        respostaEsperada: "A frequência permanece constante (pois depende apenas da fonte emissora), enquanto o comprimento de onda aumenta proporcionalmente ao aumento da velocidade no novo meio (v = λ * f).",
        formula: "v1 / λ1 = v2 / λ2",
        dificuldade: 2,
        dicas: [
            "A frequência de uma onda é definida no momento de sua criação. Ela pode mudar depois que a onda já foi emitida?",
            "Use a relação v = λ * f. Se f é constante e a velocidade (v) aumenta ao entrar na água, o que deve acontecer com o comprimento de onda (λ) para manter a igualdade?",
            "Lembre-se de que a mudança de meio de propagação é chamada de refração."
        ],
        fonte: "Elaboração própria",
        tags: ["Refração", "Frequência e Comprimento de Onda", "Ondulatória"],
        explicacao: "Na refração (mudança de meio), a frequência (f) da onda nunca se altera, pois é uma característica exclusiva da fonte que a gerou. Como a velocidade (v) do som na água é maior do que no ar e v = λ.f, para manter a proporcionalidade, o comprimento de onda (λ) deve necessariamente aumentar na água."
    },
    {
        id: "q018",
        enunciado: "Explique, sob o ponto de vista físico da ondulatória, por que o som da sirene de uma ambulância parece mais 'agudo' (frequência maior) quando o veículo está se aproximando de nós e se torna visivelmente mais 'grave' (frequência menor) quando ele se afasta.",
        tipo: "cotidiano",
        bloomLevel: "analyze",
        palavrasChave: ["doppler", "efeito", "frequencia", "aparente", "aproximacao", "afastamento", "frentes", "onda", "comprimir", "afastar"],
        respostaEsperada: "Esse é o Efeito Doppler. Na aproximação, as frentes de onda são comprimidas, aumentando a frequência aparente (som agudo). No afastamento, as frentes se espaçam, diminuindo a frequência aparente (som grave).",
        formula: "f' = f * (v_som ± v_obs) / (v_som ∓ v_fonte)",
        dificuldade: 2,
        dicas: [
            "Nomeie o efeito ondulatório responsável por essa alteração na percepção da frequência de uma fonte móvel.",
            "Descreva o que acontece com o espaçamento das frentes de onda sonoras à frente da ambulância em movimento.",
            "Descreva o que ocorre com o espaçamento das frentes de onda atrás da ambulância à medida que ela se afasta."
        ],
        fonte: "ENEM",
        tags: ["Efeito Doppler", "Frequência Aparente", "Cotidiano"],
        explicacao: "O Efeito Doppler é a alteração da frequência percebida por um observador devido ao movimento relativo entre ele e a fonte emissora. Na aproximação, a fonte 'persegue' as ondas que emite, comprimindo o comprimento de onda e elevando a frequência percebida (som mais agudo). No afastamento, ocorre o inverso: as ondas se espaçam, resultando em menor frequência aparente (som mais grave)."
    },
    {
        id: "q019",
        enunciado: "Fone de ouvido modernos com 'cancelamento de ruído ativo' conseguem abafar barulhos externos gerando ondas sonoras próprias. Explique como funciona essa tecnologia com base no fenômeno ondulatório da interferência.",
        tipo: "enem",
        bloomLevel: "evaluate",
        palavrasChave: ["interferencia", "destrutiva", "inversao", "fase", "cancelamento", "crista", "vale", "anulacao", "ruido", "ondas"],
        respostaEsperada: "O circuito do fone capta o ruído externo e emite uma onda com a mesma frequência e amplitude, mas com fase invertida. O encontro dessas duas ondas gera uma interferência destrutiva, anulando o som do ruído.",
        formula: "Diferença de caminho = (2n + 1) * λ / 2",
        dificuldade: 3,
        dicas: [
            "Identifique o tipo específico de interferência necessário para fazer um som 'desaparecer' (anular-se).",
            "Para anular uma crista de onda sonora (pressão alta), o fone deve emitir um vale de onda (pressão baixa). Qual é o termo para isso?",
            "Explique a função do microfone embutido no fone e do processador de sinal que gera a onda 'espelho'."
        ],
        fonte: "ENEM",
        tags: ["Interferência Destrutiva", "Cancelamento de Ruído", "Tecnologia"],
        explicacao: "Os fones de cancelamento ativo possuem microfones externos que captam o ruído. Um processador de som analisa a onda e gera uma onda idêntica em frequência e amplitude, porém com fase invertida (defasagem de 180°). O alto-falante reproduz essa onda invertida. Quando ela se choca com o ruído externo, ocorre uma interferência destrutiva: a crista de uma encontra o vale da outra, resultando em amplitude nula (silêncio)."
    },
    {
        id: "q020",
        enunciado: "Uma taça de cristal de alta qualidade pode trincar ou quebrar se um cantor lírico profissional emitir e sustentar uma nota musical específica e muito forte próxima a ela. Qual é o fenômeno ondulatório que explica a quebra da taça e de que maneira ele ocorre?",
        tipo: "cotidiano",
        bloomLevel: "evaluate",
        palavrasChave: ["ressonancia", "frequencia", "natural", "vibracao", "amplitude", "cristal", "energia"],
        respostaEsperada: "O fenômeno é a ressonância. A taça absorve energia da onda sonora porque a nota cantada tem frequência idêntica à frequência natural de vibração do cristal, fazendo a taça vibrar com amplitude crescente até quebrar.",
        formula: "Nenhuma",
        dificuldade: 2,
        dicas: [
            "Todo objeto sólido possui uma frequência própria na qual ele vibra naturalmente ao sofrer um impacto (pense no barulho da taça ao ser tocada por uma colher).",
            "Quando uma onda externa atinge a taça com exatamente essa mesma frequência, o que ocorre com a quantidade de energia absorvida?",
            "Explique a relação entre a amplitude das oscilações da taça e o limite de elasticidade do cristal."
        ],
        fonte: "Elaboração própria",
        tags: ["Ressonância", "Frequência Natural", "Cotidiano"],
        explicacao: "Ocorre a Ressonância. Quando a frequência da onda sonora emitida coincide com a frequência natural de oscilação mecânica da taça de cristal, esta começa a vibrar em simpatia. Como a fonte continua fornecendo energia nessa frequência exata, a amplitude de oscilação do cristal aumenta progressivamente, superando a força de coesão molecular da taça, levando-a à ruptura."
    },

    // --- 5. ÓPTICA ---
    {
        id: "q021",
        enunciado: "Enuncie as duas Leis da Reflexão da Luz e explique conceitualmente qual é a diferença crucial entre a reflexão especular (que ocorre em um espelho) e a reflexão difusa (que ocorre em uma parede áspera).",
        tipo: "conceitual",
        bloomLevel: "remember",
        palavrasChave: ["incidencia", "reflexao", "igual", "normal", "coplanares", "especular", "difusa", "irregular", "paralelos", "direcao"],
        respostaEsperada: "1ª Lei: O raio incidente, o refletido e a reta normal são coplanares. 2ª Lei: O ângulo de incidência é igual ao de reflexão. Na especular, raios paralelos refletem paralelos e formam imagem clara; na difusa, a superfície irregular reflete raios em várias direções, permitindo enxergar o objeto mas sem formar imagem.",
        formula: "θ_incidente = θ_refletido",
        dificuldade: 1,
        dicas: [
            "Lembre-se da reta imaginária perpendicular à superfície (reta normal) e a relação angular entre os raios.",
            "Pense em superfícies lisas e polidas vs. superfícies ásperas microscopicamente.",
            "Por que você consegue ver seu reflexo em um lago calmo (especular), mas não em uma folha de papel branca (difusa), mesmo que ambos reflitam a luz?"
        ],
        fonte: "Elaboração própria",
        tags: ["Leis da Reflexão", "Reflexão Especular", "Reflexão Difusa", "Óptica"],
        explicacao: "As Leis da Reflexão estabelecem que: 1) o raio incidente, o raio refletido e a normal pertencem ao mesmo plano; 2) o ângulo de incidência é rigorosamente igual ao ângulo de reflexão (θi = θr). Na reflexão especular (lago, espelho), a superfície é perfeitamente lisa e os raios incidentes paralelos refletem mantendo-se paralelos. Na reflexão difusa (parede, papel), a rugosidade microscópica faz com que cada raio reflita com ângulos diferentes, espalhando a luz em todas as direções."
    },
    {
        id: "q022",
        enunciado: "A luz propaga-se no vácuo com uma velocidade aproximada de c = 3.10^8 m/s. Ao penetrar em uma placa de vidro cujo índice de refração absoluto é n = 1,5, qual passa a ser a velocidade da luz no interior desse vidro? Mostre a fórmula e o cálculo.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["2.10^8", "2x10^8", "2.108", "velocidade", "vidro", "indice", "refracao", "dividir", "c/n"],
        respostaEsperada: "A velocidade no vidro é de 2 * 10^8 m/s (v = c / n = 3.10^8 / 1,5 = 2.10^8 m/s).",
        formula: "n = c / v => v = c / n",
        dificuldade: 2,
        dicas: [
            "A definição de índice de refração é n = c / v (razão entre velocidade da luz no vácuo e no meio).",
            "Isole a velocidade no meio (v) na equação: v = c / n.",
            "Divida 3.10^8 por 1,5 para encontrar o resultado em m/s."
        ],
        fonte: "Elaboração própria",
        tags: ["Índice de Refração", "Velocidade da Luz", "Refração", "Óptica"],
        explicacao: "O índice de refração (n) mede o quanto a luz é 'freada' ao entrar em um meio material, sendo definido pela relação n = c/v. Consequentemente, a velocidade da luz no meio é dada por v = c/n. Para o vidro: v = (3.10^8 m/s) / 1,5 = 2.10^8 m/s."
    },
    {
        id: "q023",
        enunciado: "Um objeto real e vertical é colocado diante de um espelho esférico côncavo, a uma distância maior que o raio de curvatura (ou seja, além do centro de curvatura do espelho). Explique detalhadamente quais são as características da imagem formada por esse espelho.",
        tipo: "grafico",
        bloomLevel: "analyze",
        palavrasChave: ["real", "invertida", "menor", "centro", "foco", "espelho", "concavo", "imagem"],
        respostaEsperada: "A imagem formada é real, invertida e de tamanho menor do que o objeto, localizando-se entre o centro de curvatura e o foco do espelho.",
        formula: "1/f = 1/p + 1/p'",
        dificuldade: 2,
        dicas: [
            "Desenhe mentalmente os raios notáveis: um raio paralelo ao eixo principal reflete passando pelo foco.",
            "Outro raio notável: o raio que passa pelo centro de curvatura reflete sobre si mesmo.",
            "Onde os raios refletidos se cruzam? A imagem é de cabeça para baixo (invertida) ou de pé (direita)? Ela pode ser projetada (real)?"
        ],
        fonte: "Elaboração própria",
        tags: ["Espelhos Esféricos", "Formação de Imagem", "Espelho Côncavo", "Óptica"],
        explicacao: "Quando um objeto é posicionado além do centro de curvatura (C) de um espelho côncavo, os raios notáveis refletidos se cruzam fisicamente em um ponto situado entre o centro (C) e o foco (F), abaixo do eixo principal. Isso gera uma imagem com as seguintes propriedades: Real (formada pelo cruzamento dos próprios raios luminosos, e não de seus prolongamentos), Invertida (de cabeça para baixo) e Menor (tamanho reduzido em relação ao objeto original)."
    },
    {
        id: "q024",
        enunciado: "A miopia é uma anomalia da visão que dificulta enxergar objetos distantes. Qual é o tipo de lente (convergente ou divergente) utilizado nos óculos de uma pessoa míope para corrigir esse problema de refração? Explique fisicamente como essa lente atua nos raios de luz para focar a imagem no local correto.",
        tipo: "enem",
        bloomLevel: "understand",
        palavrasChave: ["divergente", "afastar", "espalhar", "antes", "retina", "foco", "miopia", "lente", "atras"],
        respostaEsperada: "Usa-se lente divergente. Na miopia, a imagem se forma antes da retina devido ao alongamento do olho ou excesso de curvatura. A lente divergente afasta (espalha) levemente os raios incidentes, fazendo com que a imagem se desloque para trás, focando exatamente sobre a retina.",
        formula: "Nenhuma",
        dificuldade: 2,
        dicas: [
            "No olho míope, o ponto focal de objetos distantes se forma antes da retina (a imagem fica 'curta').",
            "Queremos que a imagem se forme mais atrás no olho. Precisamos 'abrir' ou 'fechar' os raios de luz antes de eles entrarem no olho?",
            "Lentes convergentes aproximam os raios; lentes divergentes os espalham."
        ],
        fonte: "ENEM",
        tags: ["Lentes Corretivas", "Óptica da Visão", "Miopia", "Óptica"],
        explicacao: "O globo ocular do míope é excessivamente longo ou sua córnea/cristalino são muito curvos, fazendo com que os raios paralelos de objetos distantes convirjam prematuramente, formando a imagem ANTES da retina. Para corrigir isso, aplica-se uma lente divergente à frente do olho. Essa lente espalha os raios de luz antes de atingirem o cristalino, atrasando o ponto de convergência dos raios para que a imagem se forme com nitidez exatamente SOBRE a retina."
    },
    {
        id: "q025",
        enunciado: "Explique de forma detalhada o mecanismo físico de formação de um arco-íris na atmosfera terrestre após uma chuva. Quais são os três principais fenômenos ópticos que ocorrem sequencialmente com os raios de luz solar ao penetrar e sair de cada gotícula de água suspensa no ar?",
        tipo: "cotidiano",
        bloomLevel: "evaluate",
        palavrasChave: ["refracao", "dispersao", "reflexao", "interna", "gotas", "agua", "cores", "espectro"],
        respostaEsperada: "A luz solar sofre: 1) Refração ao entrar na gota, acompanhada de Dispersão (separação das cores); 2) Reflexão Interna Total na parede posterior interna da gota; 3) Segunda Refração ao sair da gota em direção aos olhos do observador.",
        formula: "Lei de Snell-Descartes: n1 * sen(θ1) = n2 * sen(θ2)",
        dificuldade: 3,
        dicas: [
            "A luz branca do sol é composta por várias cores que viajam juntas. O que acontece com a velocidade de cada cor ao entrar na água da gota? (Isso se chama dispersão).",
            "Após entrar na gota e se dividir nas cores do espectro, os raios batem no 'fundo' interno da gota e voltam para dentro. Qual o nome desse fenômeno de retorno?",
            "Para sair da gota em direção ao olho humano, a luz passa da água de volta para o ar. Qual o nome desse terceiro fenômeno de mudança de meio?"
        ],
        fonte: "FUVEST",
        tags: ["Dispersão da Luz", "Refração", "Reflexão Interna Total", "Arco-Íris", "Óptica"],
        explicacao: "O arco-íris resulta da interação da luz branca solar com gotículas esféricas de água suspensas na atmosfera. O processo ocorre em três fases: 1) Refração e Dispersão: A luz passa do ar para a água da gota, mudando de direção. Como cada cor tem um índice de refração diferente na água, elas se separam (dispersão). 2) Reflexão Interna: Os raios separados atingem a parede oposta da gota e sofrem reflexão interna total. 3) Segunda Refração: Ao saírem da gota voltando para o ar, os raios desviam-se novamente, ampliando a separação angular das cores espectrais que chegam aos olhos do observador."
    },

    // --- 6. ELETRICIDADE ---
    {
        id: "q026",
        enunciado: "Um resistor de resistência elétrica R = 10 ohms é conectado aos terminais de uma tomada residencial que fornece uma diferença de potencial de V = 120 V. Determine a intensidade da corrente elétrica que percorre o resistor. Apresente os cálculos.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["12", "amperes", "i", "u", "r", "dividir", "corrente", "12a"],
        respostaEsperada: "A corrente elétrica é de 12 A (V = R * i => i = V / R = 120 / 10 = 12 A).",
        formula: "V = R * i",
        dificuldade: 1,
        dicas: [
            "Utilize a Primeira Lei de Ohm: V = R * i (tensão = resistência x corrente).",
            "Queremos achar a corrente (i), então reescreva a fórmula isolando-a: i = V / R.",
            "Divida a tensão de 120 V pela resistência de 10 ohms."
        ],
        fonte: "Elaboração própria",
        tags: ["1ª Lei de Ohm", "Corrente Elétrica", "Eletricidade"],
        explicacao: "Pela Primeira Lei de Ohm, a diferença de potencial (V) aplicada nos extremos de um resistor é o produto de sua resistência (R) pela intensidade da corrente (i) que o atravessa. Para isolar a corrente, fazemos i = V/R. Substituindo os valores: i = 120 V / 10 Ω = 12 A."
    },
    {
        id: "q027",
        enunciado: "Em um circuito elétrico residencial contendo três resistores de valores diferentes associados em SÉRIE e alimentados por uma bateria ideal, o que podemos afirmar sobre a corrente elétrica que passa por cada resistor e sobre a tensão (voltagem) total do circuito?",
        tipo: "conceitual",
        bloomLevel: "remember",
        palavrasChave: ["corrente", "igual", "mesma", "tensao", "soma", "dividida", "total", "resistencia", "serie"],
        respostaEsperada: "A corrente elétrica é idêntica (a mesma) em todos os resistores. A tensão total fornecida pelo circuito é igual à soma das quedas de tensão individuais em cada resistor (V_total = V1 + V2 + V3).",
        formula: "i_total = i1 = i2 = i3 e V_total = V1 + V2 + V3",
        dificuldade: 2,
        dicas: [
            "Em circuitos em série, há apenas um único caminho para a passagem dos elétrons. O fluxo de corrente pode se dividir?",
            "A energia elétrica (tensão) é consumida à medida que a corrente atravessa cada obstáculo (resistor). O que ocorre com a voltagem de entrada?",
            "Conclua se a corrente se mantém uniforme e se a voltagem se distribui pelos componentes."
        ],
        fonte: "Elaboração própria",
        tags: ["Associação em Série", "Corrente e Tensão", "Eletricidade"],
        explicacao: "Em uma associação em série: 1) A corrente elétrica (i) é a mesma em todos os pontos do circuito, pois as cargas elétricas dispõem de apenas um único trajeto físico para circular. 2) A tensão total (V) do circuito se divide proporcionalmente entre as resistências, sendo a voltagem total igual à soma das tensões em cada componente (V = V1 + V2 + V3)."
    },
    {
        id: "q028",
        enunciado: "Duas lâmpadas incandescentes idênticas são conectadas em PARALELO a uma bateria ideal de 12 V. Se uma das lâmpadas queimar repentinamente abrindo o seu filamento, a outra lâmpada continuará acesa ou se apagará? Explique o motivo físico.",
        tipo: "cotidiano",
        bloomLevel: "understand",
        palavrasChave: ["acesa", "independente", "paralelo", "caminho", "tensao", "mesma", "bateria", "funcionar"],
        respostaEsperada: "A outra lâmpada continuará acesa com o mesmo brilho. Em circuitos paralelos, os caminhos de corrente são independentes e todos os componentes recebem a mesma tensão total (12 V). O rompimento de um ramo não afeta o outro.",
        formula: "V1 = V2 = V_fonte",
        dificuldade: 2,
        dicas: [
            "Em uma ligação em paralelo, os componentes estão ligados de forma independente à fonte de energia.",
            "Pense se a corrente elétrica que vai para a segunda lâmpada depende de passar pela primeira lâmpada.",
            "Qual a tensão aplicada nos terminais de cada lâmpada em uma ligação paralela?"
        ],
        fonte: "ENEM",
        tags: ["Associação em Paralelo", "Circuitos Residenciais", "Cotidiano", "Eletricidade"],
        explicacao: "Na associação em paralelo, a tensão nos terminais de todos os ramos é igual à tensão da fonte (12 V). Como os ramos são caminhos eletricamente paralelos e independentes, o fato de uma lâmpada queimar (romper o circuito naquele filamento específico) não interrompe o fluxo de corrente nas demais ramificações. A segunda lâmpada continuará sob a tensão de 12 V e brilhando normalmente."
    },
    {
        id: "q029",
        enunciado: "Para aumentar a temperatura da água de um chuveiro elétrico residencial comum (mudar a chave da posição 'Verão' para 'Inverno'), devemos aumentar ou diminuir o comprimento físico do filamento da resistência elétrica interna? Justifique seu raciocínio usando as leis físicas de Ohm e potência.",
        tipo: "enem",
        bloomLevel: "analyze",
        palavrasChave: ["diminuir", "menor", "resistencia", "aumentar", "corrente", "potencia", "calor", "ohms", "inverno"],
        respostaEsperada: "Devemos diminuir o comprimento do filamento da resistência. Um comprimento menor reduz a resistência (R = ρ*L/A). Sob tensão constante, uma resistência menor aumenta a corrente (I = V/R) e, consequentemente, aumenta a potência dissipada em calor (P = V²/R).",
        formula: "R = ρ * L / A e P = V² / R",
        dificuldade: 3,
        dicas: [
            "Relacione o comprimento de um fio (L) com a sua resistência elétrica (R) usando a Segunda Lei de Ohm: R = ρ.L/A.",
            "Para aquecer mais a água (modo Inverno), precisamos de mais potência térmica (calor). A potência dissipada sob tensão constante da tomada (110V ou 220V) é calculada por P = V²/R.",
            "Se queremos uma potência (P) maior para aquecer mais a água, a resistência (R) deve ser maior ou menor? Logo, o fio deve ser maior ou menor?"
        ],
        fonte: "ENEM",
        tags: ["Segunda Lei de Ohm", "Potência Elétrica", "Efeito Joule", "Chuveiro Elétrico", "Eletricidade"],
        explicacao: "Para aquecer mais a água (Inverno), o chuveiro precisa dissipar mais energia térmica por segundo, exigindo maior potência (P). Como a voltagem residencial (V) é fixa, da fórmula P = V²/R vemos que a potência é inversamente proporcional à resistência (R). Logo, precisamos de uma menor resistência. Pela Segunda Lei de Ohm (R = ρ.L/A), a resistência é diretamente proporcional ao comprimento (L) do fio. Para reduzir R, devemos reduzir o comprimento L do filamento em uso."
    },
    {
        id: "q030",
        enunciado: "Um aparelho de ar-condicionado de potência elétrica constante P = 1500 W (1,5 kW) fica ligado durante exatamente 8 horas por dia. Calcule o consumo total de energia elétrica deste eletrodoméstico ao longo de um mês de 30 dias em quilowatts-hora (kWh). Apresente a fórmula e os cálculos.",
        tipo: "calculo",
        bloomLevel: "apply",
        palavrasChave: ["360", "kwh", "energia", "potencia", "tempo", "horas", "dias", "multiplicar", "1.5", "1,5"],
        respostaEsperada: "O consumo mensal é de 360 kWh (E = P * t = 1,5 kW * (8 horas/dia * 30 dias) = 1,5 * 240 = 360 kWh).",
        formula: "E = P * t",
        dificuldade: 2,
        dicas: [
            "Use a fórmula da energia elétrica: E = P * Δt (energia = potência x intervalo de tempo).",
            "Converta a potência de Watts para quilowatts dividindo por 1000: 1500 W = 1,5 kW.",
            "Calcule o total de horas de funcionamento no mês (8 horas por dia x 30 dias). Multiplique esse tempo pela potência em kW."
        ],
        fonte: "Elaboração própria",
        tags: ["Consumo de Energia", "Potência e Energia", "Eletricidade"],
        explicacao: "O consumo de energia elétrica (E) é o produto da potência do aparelho (P) pelo tempo de funcionamento (t). A potência em kW é P = 1500 W / 1000 = 1,5 kW. O tempo total de uso no mês é t = 8 horas/dia * 30 dias = 240 horas. Assim, o consumo de energia é: E = 1,5 kW * 240 h = 360 kWh."
    }
];

// Retorna as questões filtradas de acordo com as especificações do professor
function getQuestionsForLesson(topic, series, count, bloomLevels) {
    let filtered = PHYSICS_QUESTION_BANK;

    // Filtro de tópico
    if (topic && topic !== "Todos") {
        const topicLower = topic.toLowerCase();
        filtered = filtered.filter(q => {
            if (topicLower === "muv" || topicLower === "cinemática") {
                return q.tags.some(t => t.toLowerCase() === "cinemática" || t.toLowerCase() === "mru" || t.toLowerCase() === "muv" || t.toLowerCase() === "queda livre");
            } else if (topicLower === "leis de newton") {
                return q.tags.some(t => t.toLowerCase() === "dinâmica" || t.toLowerCase().includes("newton") || t.toLowerCase().includes("atrito"));
            } else if (topicLower === "termodinâmica") {
                return q.tags.some(t => t.toLowerCase().includes("termo") || t.toLowerCase().includes("calor") || t.toLowerCase().includes("gás"));
            } else if (topicLower === "ondulatória") {
                return q.tags.some(t => t.toLowerCase().includes("onda") || t.toLowerCase().includes("doppler") || t.toLowerCase().includes("ressonância"));
            } else if (topicLower === "óptica") {
                return q.tags.some(t => t.toLowerCase().includes("ópt") || t.toLowerCase().includes("espelho") || t.toLowerCase().includes("lente") || t.toLowerCase().includes("refração"));
            } else if (topicLower === "eletricidade") {
                return q.tags.some(t => t.toLowerCase().includes("eletri") || t.toLowerCase().includes("ohm") || t.toLowerCase().includes("circuito"));
            }
            return false;
        });
    }

    // Filtro de níveis de Bloom
    if (bloomLevels && bloomLevels.length > 0) {
        filtered = filtered.filter(q => bloomLevels.includes(q.bloomLevel));
    }

    // Embaralhar as questões
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    
    // Retornar a quantidade solicitada
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// Heurísticas pedagógicas locais para avaliar a resposta do aluno caso não haja conexão com a API do Gemini
function analyzeBloomLevelLocal(response, question) {
    const cleanResponse = response.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, ' ');
        
    let score = 0;
    let detectedKeywords = [];
    let feedback = "";
    
    // 1. Verificação matemática especial para a etapa de cálculo
    if (question.tipo === 'calculo') {
        const numbers = response.replace(',', '.').match(/\b\d+(\.\d+)?\b/g);
        const expectedNumMatch = question.respostaEsperada.replace(',', '.').match(/\b\d+(\.\d+)?\b/g);
        
        let gotResult = false;
        if (numbers && expectedNumMatch) {
            const targetNum = expectedNumMatch[0];
            gotResult = numbers.some(n => Math.abs(parseFloat(n) - parseFloat(targetNum)) < 0.05);
        }
        
        if (question.palavrasChave) {
            detectedKeywords = question.palavrasChave.filter(keyword => 
                cleanResponse.includes(keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
            );
        }

        const keywordRatio = detectedKeywords.length / Math.max(1, question.palavrasChave.length);
        
        if (gotResult && keywordRatio >= 0.3) {
            score = 10;
            feedback = "Excelente! Você chegou ao valor correto e explicou o raciocínio matemático perfeitamente.";
        } else if (gotResult) {
            score = 8;
            feedback = "Muito bom, o valor numérico está correto! Para ficar perfeito, detalhe um pouco mais os passos ou as fórmulas usadas.";
        } else if (keywordRatio >= 0.4) {
            score = 6;
            feedback = "Você explicou os conceitos da fórmula e do raciocínio físico muito bem, mas parece ter cometido algum erro no cálculo numérico final. Tente refazer a conta.";
        } else {
            score = 4;
            feedback = "Vamos recordar os passos: tente aplicar a fórmula " + (question.formula || "") + " substituindo os valores dados no enunciado. Tente novamente!";
        }
        
        return { score, detectedKeywords, feedback };
    }
    
    // 2. Verificação de palavras-chave para etapas conceituais, cotidianas, enem, gráficas
    if (question.palavrasChave) {
        detectedKeywords = question.palavrasChave.filter(keyword => 
            cleanResponse.includes(keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        );
    }
    
    const kwCount = detectedKeywords.length;
    const totalKw = question.palavrasChave ? question.palavrasChave.length : 1;
    const ratio = kwCount / totalKw;
    
    const wordCount = response.split(/\s+/).length;
    
    if (ratio >= 0.5 && wordCount >= 12) {
        score = 10;
        feedback = "Resposta excelente e muito completa! Você usou terminologia científica precisa e abordou todos os aspectos físicos necessários.";
    } else if (ratio >= 0.3 && wordCount >= 8) {
        score = 8;
        feedback = "Muito bem colocado! Você identificou os conceitos-chave corretos. Para obter nota máxima, complemente um pouco mais a sua explicação.";
    } else if (kwCount >= 1 || wordCount >= 5) {
        score = 6;
        feedback = "Você está no caminho certo, mas a sua resposta ficou um pouco incompleta. Tente detalhar melhor a relação entre os fenômenos envolvidos.";
    } else {
        score = 4;
        feedback = "Essa é uma pergunta conceitual importante. Lembre-se de refletir sobre as palavras-chave principais e tente explicar com suas próprias palavras.";
    }
    
    return { score, detectedKeywords, feedback };
}

// Gera um feedback de prompt simulando uma IA, de acordo com o estilo selecionado
function generateMockAIPedagogicalResponse(question, responseText, persona, studentName, stepIdx) {
    const analysis = analyzeBloomLevelLocal(responseText, question);
    let intro = "";
    let body = "";
    let suffix = "";
    
    if (persona === "challenger") {
        intro = `Desafio aceito, **${studentName}**! 🎯 `;
        if (analysis.score >= 8) {
            body = `${analysis.feedback} Mas me diga: e se mudássemos um dos parâmetros físicos? Como você provaria que esse comportamento se mantém em condições extremas? O que aconteceria se dobrássemos o valor original?`;
        } else {
            body = `Você tocou em pontos interessantes, mas quero que você vá além. ${analysis.feedback} Pense com rigor: onde está o furo nessa explicação lógica? Tente formular novamente sob outra perspectiva.`;
        }
        suffix = `\n\n*(Tutor Desafiador)*`;
    } else if (persona === "patient") {
        intro = `Olá, **${studentName}**! 😊 Que bom ler a sua resposta. Vamos analisar juntos com calma. `;
        if (analysis.score >= 8) {
            body = `Você se saiu muito bem! ${analysis.feedback} É incrível ver como você percebeu as relações físicas nesse caso. Parabéns pelo empenho!`;
        } else {
            body = `Não se preocupe se parecer confuso no início, a Física exige prática. ${analysis.feedback} Pense como uma analogia: imagine uma fila de dominós ou um trem acelerando... Acelerar significa mudar o ritmo. Vamos tentar novamente?`;
        }
        suffix = `\n\n*(Tutor Paciente)*`;
    } else {
        intro = `Excelente participação, **${studentName}**! ⚡ `;
        if (analysis.score >= 8) {
            body = `Sua análise sobre este nível de Bloom (${question.bloomLevel.toUpperCase()}) foi certeira. ${analysis.feedback}`;
        } else {
            body = `Entendi seu ponto de vista, mas conceitualmente temos um detalhe. ${analysis.feedback}`;
        }
        suffix = `\n\n*(Tutor de Física)*`;
    }
    
    return {
        score: analysis.score,
        feedback: intro + body + suffix,
        detectedKeywords: analysis.detectedKeywords
    };
}
