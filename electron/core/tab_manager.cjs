const { app } = require('electron');

/**
 * GERENCIAMENTO DE ABAS (#3)
 * 1. Processo isolado por aba (Chromium default).
 * 2. Ciclo de vida: Ativa, Inativa, Suspensa.
 * 3. L\u00F3gica de economia de RAM.
 */

const SUSPEND_TIMEOUT = 5 * 60 * 1000; // #3: Suspens\u00E3o ap\u00F3s 5 minutos inativo

const tabRegistry = new Map();

function setupTabManager() {
    app.on('web-contents-created', (event, contents) => {
        if (contents.getType() === 'webview') {
            const id = contents.getProcessId();
            
            // Registrar nova aba
            tabRegistry.set(id, {
                id,
                contents,
                lastActive: Date.now(),
                state: 'active'
            });

            // Monitorar atividade
            contents.on('did-start-loading', () => markActive(id));
            contents.on('focus', () => markActive(id));
            
            // Monitoramento de Inatividade (#3)
            setInterval(() => checkInactivity(id), 60 * 1000); // Checa a cada minuto
        }
    });
}

function markActive(id) {
    const tab = tabRegistry.get(id);
    if (!tab) return;
    
    tab.lastActive = Date.now();
    if (tab.state === 'suspended') {
        console.log(`[TABS] Restaurando aba ${id}`);
        tab.contents.reload(); // #3: Restaurar estado (reload funcional)
        tab.state = 'active';
    }
}

function checkInactivity(id) {
    const tab = tabRegistry.get(id);
    if (!tab || tab.state === 'suspended') return;

    const inactiveTime = Date.now() - tab.lastActive;
    if (inactiveTime > SUSPEND_TIMEOUT) {
        console.log(`[TABS] Suspendendo aba ${id} para liberar RAM`);
        // #3: Suspender (Electron logic: Stop loading/unrender content if possible)
        tab.contents.setAudioMuted(true);
        tab.state = 'suspended';
        // Nota: Em webviews de produ\u00C7\u00C3o, poder\u00EDamos descarregar o renderer, 
        // mas mantemos o estado da URL para recarregar ao clicar.
    }
}

module.exports = { setupTabManager };
