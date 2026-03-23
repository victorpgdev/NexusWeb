const { session, ipcMain } = require('electron');

/**
 * M\u00D3DULO DE SEGURAN\u00C7A (SHIELD) - V3 (Brave-Inspired)
 */

const SHIELD_TIMEOUT = 100;
let blockedCount = 0;

const adDomains = [
    // Core Tracking
    'google-analytics.com', 'analytics.google.com', 'googletagmanager.com', 'google-analytics.l.google.com',
    'doubleclick.net', 'googleads.g.doubleclick.net', 'facebook.net', 'facebook.com/tr',
    'hotjar.com', 'api.mixpanel.com', 'quantserve.com', 'outbrain.com', 'criteo.com',
    'scorecardresearch.com', 'serving-sys.com', 'adnxs.com', 'taboola.com',
    
    // Telemetry & Behavior
    'telemetry.microsoft.com', 'vortex.data.microsoft.com', 'browser.pipe.aria.microsoft.com',
    'stats.g.doubleclick.net', 'pixel.facebook.com', 'connect.facebook.net',
    
    // Obvious Ads
    'ads.com', 'advertising.com', 'amazon-adsystem.com', 'pubmatic.com', 'rubiconproject.com',
    'openx.net', 'smartadserver.com', 'adtech.com', 'moatads.com'
];

function setupShield(browserSession = session.defaultSession) {
    // 1. BRAVE SHIELD: Bloqueio agressivo de Ad/Trackers e Pings
    browserSession.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
        const url = new URL(details.url);
        
        // Ignorar local e nexus core
        if (url.hostname.includes('localhost') || url.protocol === 'nexus:') {
            return callback({ cancel: false });
        }

        // Bloquear <a ping> (Rastreio de cliques nativo do navegador)
        if (details.resourceType === 'ping') {
            blockedCount++;
            return callback({ cancel: true });
        }

        const isBlocked = adDomains.some(domain => url.hostname.includes(domain));
        if (isBlocked) {
            blockedCount++;
            return callback({ cancel: true });
        }

        // For\u00E7ar HTTPS
        if (url.protocol === 'http:') {
            return callback({ redirectURL: details.url.replace('http:', 'https:') });
        }

        callback({ cancel: false });
    });

    // 2. PRIVACY HEADERS: Limpeza de rastreio em cabe\u00E7alhos (Estilo Brave)
    browserSession.webRequest.onBeforeSendHeaders({ urls: ["<all_urls>"] }, (details, callback) => {
        const headers = details.requestHeaders;
        
        // Bloquear x-client-data (Enviado pelo Chrome/Edge para identificar vers\u00E3o/experimentos)
        delete headers['X-Client-Data'];
        
        // Reduzir informa\u00E7\u00F5es de Referrer para sites de terceiros
        if (details.resourceType === 'subFrame' || details.resourceType === 'image') {
            headers['Referer'] = new URL(details.url).origin;
        }

        callback({ requestHeaders: headers });
    });

    // Handle Stats via IPC
    ipcMain.handle('get-shield-stats', () => ({
        blockedCount: blockedCount,
        isShieldActive: true
    }));

    // 3. ANTI-FINGERPRINTING: User-Agent Gen\u00E9rico Est\u00E1vel
    browserSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36");
}

module.exports = { setupShield };
