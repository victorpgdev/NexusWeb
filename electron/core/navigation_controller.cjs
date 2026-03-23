const { ipcMain, shell, app } = require('electron');
const db = require('../profile/profile_manager.cjs');

/**
 * MEDIADOR DE COMUNICA\u00C7\u00C3O (IPC)
 * 1. Processamento de Barra de Navega\u00C7\u00C3o (#7)
 * 2. Integra\u00C7\u00C3o de servi\u00C7os de IA (#4)
 * 1. Processamento de Barra de Navega\u00C7\u00C3O (#7)
 * 2. Integra\u00C7\u00C3O de servi\u00C7os de IA (#4)
 * 3. Gest\u00C3O de Sincroniza\u00C7\u00C3O (#5)
 * 4. Tratamento de Erros Global (#12)
 */

function setupIPCAdapters() {
    
        // --- DOWNLOAD ACTIONS ---
        ipcMain.handle('open-file', (event, path) => {
            if (path) shell.openPath(path);
        });

        // --- INFRA: PROCESS METRICS (Chromium Style) ---
        ipcMain.handle('get-process-metrics', async () => {
            return app.getAppMetrics();
        });

        // --- NAVEGAÇÃO INTELIGENTE (#7) ---
        ipcMain.handle('resolve-navigation', async (event, query, engine) => {
            const q = query.trim();
            if (!q) return null;

            // #Chromium: Internal URLs support (nexus://)
            if (q.startsWith('nexus://')) {
                return { action: 'internal', url: q };
            }

            // Validar URL (Regex simplificada conforme #7)
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (urlRegex.test(q)) {
                let finalUrl = q;
                if (!q.startsWith('http')) finalUrl = 'https://' + q;
                return { action: 'navigate', url: finalUrl };
            } else {
                // #7: Texto puro -> Pesquisa
                const searchEngines = {
                    google: 'https://www.google.com/search?q=',
                    brave: 'https://search.brave.com/search?q=',
                    bing: 'https://www.bing.com/search?q='
                };
                const baseUrl = searchEngines[engine] || searchEngines.google;
                return { action: 'search', url: baseUrl + encodeURIComponent(q) };
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
    ipcMain.handle('db-clear-history', async () => {
        db.set('history', []);
        return true;
    });
    ipcMain.handle('db-delete-history-item', async (event, index) => {
        const history = db.get('history');
        history.splice(index, 1);
        db.set('history', history);
        return true;
    });

    ipcMain.handle('db-get-bookmarks', async () => db.get('bookmarks'));
    ipcMain.handle('db-save-bookmark', async (event, bookmark) => {
        const bookmarks = db.get('bookmarks');
        // Check duplication
        if (bookmarks.some(b => b.url === bookmark.url)) return false;
        bookmarks.push(bookmark);
        db.set('bookmarks', bookmarks);
        return true;
    });
    ipcMain.handle('db-delete-bookmark', async (event, url) => {
        const bookmarks = db.get('bookmarks');
        const filtered = bookmarks.filter(b => b.url !== url);
        db.set('bookmarks', filtered);
        return true;
    });

    // --- CHROMIUM: DEVTOOLS (#Chromium) ---
    ipcMain.on('toggle-devtools', (event) => {
        const win = event.sender.getOwnerBrowserWindow();
        if (win) win.webContents.toggleDevTools();
    });

}

module.exports = { setupIPCAdapters };
