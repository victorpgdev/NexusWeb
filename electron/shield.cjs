const { session, ipcMain } = require('electron');

/**
 * M\u00D3DULO DE SEGURAN\u00C7A (SHIELD) - V2
 * 1. Intercepta requisi\u00E7\u00F5es HTTP/HTTPS.
 * 2. Bloqueia Ads e Trackers (EasyList-style).
 * 3. Sanitiza URLs de navega\u00E7\u00E3o e refor\u00C7a HTTPS.
 */

const SHIELD_TIMEOUT = 100; // Timeout m\u00E1ximo agressivo de 100ms
let blockedCount = 0;

const adDomains = [
    'google-analytics.com', 'doubleclick.net', 'facebook.net', 'ads.com',
    'adnxs.com', 'taboola.com', 'api.mixpanel.com', 'hotjar.com',
    'advertising.com', 'amazon-adsystem.com', 'quantserve.com',
    'outbrain.com', 'criteo.com', 'pubmatic.com', 'rubiconproject.com',
    'openx.net', 'yieldmo.com', 'adtech.com', 'smartadserver.com',
    'moatads.com', 'scorecardresearch.com', 'serving-sys.com'
];

function setupShield(browserSession = session.defaultSession) {
    // 1. Filtragem de Rede (Ad-Block & Privacy)
    browserSession.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
        const url = new URL(details.url);
        
        // Skip local and core nexus requests
        if (url.hostname.includes('localhost') || url.protocol === 'nexus:') {
            return callback({ cancel: false });
        }

        const checkPromise = (async () => {
            // Bloqueio de dom\u00EDnios de an\u00FAncios conhecidos
            if (adDomains.some(domain => url.hostname.includes(domain))) {
                blockedCount++;
                // Notify UI via broadcast (simulated/simplified)
                return { cancel: true };
            }

            // For\u00E7ar HTTPS para navega\u00E7\u00E3o externa
            if (url.protocol === 'http:') {
                return { redirectURL: details.url.replace('http:', 'https:') };
            }

            return { cancel: false };
        })();

        // Fail-safe logic
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ cancel: false }), SHIELD_TIMEOUT));
        
        Promise.race([checkPromise, timeoutPromise])
            .then(result => callback(result))
            .catch(() => callback({ cancel: false }));
    });

    // Handle Stats via IPC
    ipcMain.handle('get-shield-stats', () => ({
        blockedCount: blockedCount,
        isShieldActive: true
    }));

    // 2. Anti-Fingerprint User-Agent (Updated to latest Chrome)
    browserSession.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36");
}

module.exports = { setupShield };
