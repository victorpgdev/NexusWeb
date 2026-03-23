const { session, ipcMain } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

/**
 * MÓDULO DE SEGURANÇA (SHIELD) - V4 (Brave-Inspired Deep Engine)
 * Bloqueia nativamente Ads In-Video (YouTube), Rastreadores Ocultos e Cookies Intrusivos 
 * interceptando requisições C++ injetadas no Node.js via listas do EasyList.
 */

let blockedCount = 0;
let blockerInstance = null;

async function setupShield(browserSession = session.defaultSession) {
    console.log("[SHIELD] Inicializando motor de AdBlock nativo tipo-Brave...");
    
    try {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron');
        
        // Inicializa usando o motor pré-compilado (ultra rápido) e salva em cache binário no disco
        blockerInstance = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, {
            path: path.join(app.getPath('userData'), 'shield-engine.bin'),
            read: fs.promises.readFile,
            write: fs.promises.writeFile,
        });
        
        blockerInstance.on('request-blocked', () => {
            blockedCount++;
        });

        blockerInstance.on('request-redirected', () => {
            blockedCount++;
        });

        // Amarra o bloqueador agressivamente dentro do Cérebro (Sessão) do Electron
        blockerInstance.enableBlockingInSession(browserSession);
        
        console.log("[SHIELD] Motor do Brave 100% ativo! Interceptação Militar On.");
    } catch (e) {
        console.error("[SHIELD] Falha ao baixar listas massivas de bloqueio:", e);
    }

    // Handle Stats via IPC para a UI
    ipcMain.handle('get-shield-stats', () => ({
        blockedCount: blockedCount,
        isShieldActive: blockerInstance !== null
    }));

    // PRIVACY HEADERS: Destrói telemetria de rede padrão estilo Brave Scripts
    browserSession.webRequest.onBeforeSendHeaders({ urls: ["<all_urls>"] }, (details, callback) => {
        const headers = details.requestHeaders;
        
        // Bloquear x-client-data (Enviado pelo Chrome original para rastreamento de uso)
        delete headers['X-Client-Data'];
        
        // Reduz a quebra de privacidade via "Referer" invisível
        if (details.resourceType === 'subFrame' || details.resourceType === 'image') {
            try {
                headers['Referer'] = new URL(details.url).origin;
            } catch (err) {}
        }
        callback({ requestHeaders: headers });
    });

    // Disfarça a assinatura única do navegador para bloquear fingerprinting
    browserSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36");
}

module.exports = { setupShield };
