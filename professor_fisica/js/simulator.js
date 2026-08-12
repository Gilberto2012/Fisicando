/* =====================================================================
   SIMULADOR DE MUV EM CANVAS 2D
   Professor Virtual de Física (MUV)
   ===================================================================== */

class MUVSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Estado físico inicial
        this.initialVelocity = 0; // v0 (m/s)
        this.acceleration = 2;    // a (m/s^2)
        this.time = 0;            // t (s)
        this.position = 0;        // s (m)
        this.velocity = 0;        // v (m/s)
        
        // Configurações do simulador
        this.isRunning = false;
        this.lastTime = 0;
        this.maxTime = 10;        // Limite da simulação em segundos
        this.scaleX = 8;          // Fator de escala de pixels para metros
        
        // Histórico para os gráficos
        this.history = [];
        
        // Carregar imagens ou formas
        this.carColor = '#38bdf8';
        
        // Ajustar tamanho inicial
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Ajusta o Canvas para caber no container mantendo a qualidade de alta definição
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.draw();
    }

    // Configura os valores iniciais a partir da interface
    setParams(v0, a) {
        this.initialVelocity = parseFloat(v0);
        this.acceleration = parseFloat(a);
        if (!this.isRunning) {
            this.reset();
        }
    }

    // Inicia a animação
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    // Pausa a animação
    pause() {
        this.isRunning = false;
    }

    // Reinicia a simulação
    reset() {
        this.time = 0;
        this.position = 0;
        this.velocity = this.initialVelocity;
        this.history = [{ t: 0, s: 0, v: this.initialVelocity }];
        this.draw();
    }

    // Loop de renderização e cálculo físico
    loop(timestamp) {
        if (!this.isRunning) return;
        
        const dt = (timestamp - this.lastTime) / 1000; // Tempo em segundos
        this.lastTime = timestamp;
        
        // Limita dt para evitar saltos gigantescos se a aba for ocultada
        const step = Math.min(dt, 0.1);
        
        // Equações horárias do MUV
        this.time += step;
        
        if (this.time >= this.maxTime) {
            this.time = this.maxTime;
            this.isRunning = false;
        }
        
        // s = s0 + v0*t + 0.5*a*t^2
        this.position = this.initialVelocity * this.time + 0.5 * this.acceleration * this.time * this.time;
        // v = v0 + a*t
        this.velocity = this.initialVelocity + this.acceleration * this.time;
        
        // Guardar histórico para desenhar o gráfico
        this.history.push({
            t: this.time,
            s: this.position,
            v: this.velocity
        });
        
        this.draw();
        
        if (this.isRunning) {
            requestAnimationFrame((t) => this.loop(t));
        }
    }

    // Função de desenho principal
    draw() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, width, height);
        
        // Divisão de áreas
        const roadHeight = 110;
        
        // 1. Desenhar a Estrada e o Carro
        this.drawRoad(ctx, 0, roadHeight, width);
        this.drawCar(ctx, this.position * this.scaleX, roadHeight - 30);
        
        // 2. Desenhar as informações físicas atuais
        this.drawHUD(ctx, width);
        
        // 3. Desenhar os dois Gráficos na metade inferior
        const graphY = roadHeight + 25;
        const graphHeight = height - graphY - 15;
        const graphWidth = (width - 60) / 2;
        
        this.drawPositionGraph(ctx, 20, graphY, graphWidth, graphHeight);
        this.drawVelocityGraph(ctx, 40 + graphWidth, graphY, graphWidth, graphHeight);
    }

    // Desenha a pista de simulação
    drawRoad(ctx, y, roadHeight, width) {
        // Céu
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, y + roadHeight);
        
        // Estrada (asfalto)
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, y + roadHeight - 40, width, 40);
        
        // Grama
        ctx.fillStyle = '#065f46';
        ctx.fillRect(0, y + roadHeight, width, 2);
        
        // Faixa tracejada central da pista
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.setLineDash([15, 10]);
        ctx.beginPath();
        ctx.moveTo(0, y + roadHeight - 20);
        ctx.lineTo(width, y + roadHeight - 20);
        ctx.stroke();
        ctx.setLineDash([]); // Reset das linhas tracejadas
        
        // Marcações de distância (metros)
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        for (let m = 0; m * this.scaleX < width; m += 10) {
            const posX = m * this.scaleX;
            ctx.fillRect(posX, y + roadHeight - 5, 2, 5);
            ctx.fillText(`${m}m`, posX + 2, y + roadHeight - 8);
        }
    }

    // Desenha um carrinho estilizado
    drawCar(ctx, x, y) {
        // Mantém o carro dentro da tela dando loop visual se ultrapassar a largura
        const carWidth = 35;
        const carHeight = 18;
        const drawX = x % (this.canvas.width / window.devicePixelRatio + carWidth) - carWidth;
        
        ctx.save();
        ctx.translate(drawX, y);
        
        // Sombra do carro
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(carWidth/2, carHeight + 2, carWidth/2 + 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo do carro (Chassis)
        ctx.fillStyle = this.carColor;
        ctx.beginPath();
        ctx.roundRect(0, carHeight / 3, carWidth, (carHeight / 3) * 2, 4);
        ctx.fill();
        
        // Cabine do carro (Teto)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(carWidth / 4, 0, carWidth / 2, carHeight / 2, 4);
        ctx.fill();
        
        // Rodas
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(carWidth / 4, carHeight, 6, 0, Math.PI * 2);
        ctx.arc((carWidth / 4) * 3, carHeight, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho neon na roda
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(carWidth / 4, carHeight, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc((carWidth / 4) * 3, carHeight, 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    // HUD com dados físicos
    drawHUD(ctx, width) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(width - 240, 10, 230, 80, 12);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('ESTADO DA SIMULAÇÃO (MUV)', width - 225, 25);
        
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px monospace';
        ctx.fillText(`Tempo:      ${this.time.toFixed(2)} s`, width - 225, 42);
        ctx.fillText(`Posição:    ${this.position.toFixed(2)} m`, width - 225, 56);
        ctx.fillText(`Velocidade: ${this.velocity.toFixed(2)} m/s`, width - 225, 70);
        ctx.fillText(`Aceleração: ${this.acceleration.toFixed(2)} m/s²`, width - 225, 84);
    }

    // Desenha o gráfico de Posição vs Tempo (Parábola)
    drawPositionGraph(ctx, x, y, w, h) {
        this.drawBaseGraph(ctx, x, y, w, h, 'Posição x Tempo', 't (s)', 's (m)');
        
        if (this.history.length < 2) return;
        
        // Achar a escala máxima do gráfico
        const maxS = Math.max(10, Math.max(...this.history.map(item => Math.abs(item.s))));
        
        ctx.save();
        ctx.strokeStyle = '#a855f7'; // Roxo para posição
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        
        this.history.forEach((pt, index) => {
            const px = x + 30 + (pt.t / this.maxTime) * (w - 45);
            const py = y + h - 25 - (pt.s / maxS) * (h - 40);
            
            if (index === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
    }

    // Desenha o gráfico de Velocidade vs Tempo (Reta)
    drawVelocityGraph(ctx, x, y, w, h) {
        this.drawBaseGraph(ctx, x, y, w, h, 'Velocidade x Tempo', 't (s)', 'v (m/s)');
        
        if (this.history.length < 2) return;
        
        const maxV = Math.max(10, Math.max(...this.history.map(item => Math.abs(item.v))));
        
        ctx.save();
        ctx.strokeStyle = '#06b6d4'; // Ciano para velocidade
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        
        this.history.forEach((pt, index) => {
            const px = x + 30 + (pt.t / this.maxTime) * (w - 45);
            const py = y + h - 25 - (pt.v / maxV) * (h - 40);
            
            if (index === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
    }

    // Desenha o grid e os eixos base do gráfico
    drawBaseGraph(ctx, x, y, w, h, title, labelX, labelY) {
        // Fundo do gráfico
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        
        // Eixos
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Eixo Y
        ctx.moveTo(x + 30, y + 10);
        ctx.lineTo(x + 30, y + h - 25);
        // Eixo X
        ctx.lineTo(x + w - 15, y + h - 25);
        ctx.stroke();
        
        // Textos dos eixos
        ctx.fillStyle = '#64748b';
        ctx.font = '8px sans-serif';
        ctx.fillText(labelY, x + 5, y + 15);
        ctx.fillText(labelX, x + w - 25, y + h - 12);
        
        // Título do Gráfico
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(title, x + 35, y + 18);
    }
}
