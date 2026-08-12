/* =====================================================================
   INTEGRAÇÃO COM SUPABASE AUTH (AUTENTICAÇÃO)
   Professor Virtual de Física (MUV)
   ===================================================================== */

class SupabaseAuth {
    constructor() {
        this.supabase = null;
        this.initClient();
    }

    // Inicializa o cliente Supabase a partir das chaves do localStorage ou variáveis
    initClient() {
        const url = localStorage.getItem('SUPABASE_URL') || '';
        const anonKey = localStorage.getItem('SUPABASE_ANON_KEY') || '';
        
        if (url && anonKey) {
            try {
                // @ts-ignore
                this.supabase = supabase.createClient(url, anonKey);
            } catch (e) {
                console.error("Erro ao inicializar o cliente Supabase:", e);
                this.supabase = null;
            }
        } else {
            console.warn("Chaves do Supabase não configuradas no localStorage.");
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
