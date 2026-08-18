/* =====================================================================
   INTEGRAÇÃO COM SUPABASE AUTH (AUTENTICAÇÃO)
   Professor Virtual de Física (MUV)
   ===================================================================== */

class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.initClient();
    }

    // Inicializa o cliente Supabase (BancoIa) com fallback para localStorage
    initClient() {
        const url = localStorage.getItem('SUPABASE_URL') || 'https://cygrmkfmqzxxjtlnjhcv.supabase.co';
        const anonKey = localStorage.getItem('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z3Jta2ZtcXp4eGp0bG5qaGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjAxODksImV4cCI6MjEwMjI5NjE4OX0.IuGMgtbI3cKoATadUlRDq22W3LrkoT2ysuE7uch0juY';
        
        if (url && anonKey) {
            try {
                // @ts-ignore
                this.supabase = supabase.createClient(url, anonKey);
            } catch (e) {
                console.error("Erro ao inicializar o cliente Supabase:", e);
                this.supabase = null;
            }
        } else {
            console.warn("Chaves do Supabase não configuradas.");
        }
    }

    // Tenta reconfigurar o cliente quando o usuário salvar novas chaves
    reconfigure() {
        this.initClient();
    }

    // Verifica se a conexão está ativa
    isConnected() {
        return this.supabase !== null;
    }

    // Cadastro de Aluno
    async signUp(email, password, nomeCompleto) {
        if (!this.isConnected()) throw new Error("Supabase não está configurado.");
        
        const { data, error } = await this.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nome_completo: nomeCompleto
                }
            }
        });
        
        if (error) throw error;
        return data;
    }

    // Login de Aluno
    async signIn(email, password) {
        if (!this.isConnected()) throw new Error("Supabase não está configurado.");
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        return data;
    }

    // Logout
    async signOut() {
        if (!this.isConnected()) return;
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
    }

    // Obter Usuário Atual
    async getCurrentUser() {
        if (!this.isConnected()) return null;
        const { data: { user }, error } = await this.supabase.auth.getUser();
        if (error || !user) return null;
        return user;
    }

    // Monitorar Alterações de Estado da Autenticação
    onAuthStateChanged(callback) {
        if (!this.isConnected()) return { unsubscribe: () => {} };
        const { data: { subscription } } = this.supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
        return subscription;
    }
}

// Instanciar globalmente
const authService = new SupabaseAuth();
