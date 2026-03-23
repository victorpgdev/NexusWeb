const { ipcMain, shell } = require('electron');
const db = require('./db.cjs');

/**
 * MEDIADOR DE COMUNICA\u00C7\u00C3O (IPC)
 * 1. Processamento de Barra de Navega\u00C7\u00C3o (#7)
 * 2. Integra\u00C7\u00C3o de servi\u00C7os de IA (#4)
 * 3. Gest\u00C3o de Sincroniza\u00C7\u00C3o (#5)
 * 4. Tratamento de Erros Global (#12)
 */

function setupIPCAdapters() {
    
    // --- NAVEGA\u00C7\u00C3O INTELIGENTE (#7) ---
    ipcMain.handle('resolve-navigation', async (event, query) => {
        const q = query.trim();
        if (!q) return null;

        // Validar URL (Regex simplificada conforme #7)
        const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (urlRegex.test(q)) {
            let finalUrl = q;
            if (!q.startsWith('http')) finalUrl = 'https://' + q;
            return { action: 'navigate', url: finalUrl };
        } else {
            // #7: Texto puro -> Pesquisa Google (ou Brave Search se preferido)
            return { action: 'search', url: `https://www.google.com/search?q=${encodeURIComponent(q)}` };
        }
    });

    // --- RECOMPENSAS (#6) ---
    ipcMain.handle('get-rewards', async () => db.get('rewards'));
    
    // Simula\u00C7\u00C3o de ganho de pontos por inatividade bloqueada (#6)
    ipcMain.on('user-interaction', () => {
        db.addPoint(0.1); // points por intera\u00C7\u00C3o v\u00E1lida
    });

    // --- IA SERVICE (SIMULADO PARA SIDEBAR #4) ---
    ipcMain.handle('ai-summary', async (event, content) => {
        // #4: IA Roda como servi\u00C7o separado (Mock). 
        // Em produ\u00C7\u00C3o, aqui chamamos a API Gemini ou LLM local.
        console.log(`[IA] Resumindo conte\u00FAdo (${content.length} caracteres)`);
        if (content.length > 10000) content = content.substring(0, 10000); // #4 Limite de seguran\u00C7a
        
        return "Resumo da IA: Este site discute tecnologia e navegadores modernos com foco em seguran\u00C7a.";
    });

    // --- GEST\u00C3O DE ERROS (#12) ---
    process.on('uncaughtException', (err) => {
        console.error("[CRITICAL ERROR] O navegador continuou rodando ap\u00F3s: ", err);
        // #12: Nenhum erro pode fechar o navegador
    });

    // --- SISTEMA DE ACESSO AO DB (#11) ---
    ipcMain.handle('db-get-history', async () => db.get('history'));
    ipcMain.handle('db-save-bookmark', async (event, bookmark) => {
        const bookmarks = db.get('bookmarks');
        bookmarks.push(bookmark);
        db.set('bookmarks', bookmarks);
        return true;
    });

}

module.exports = { setupIPCAdapters };
