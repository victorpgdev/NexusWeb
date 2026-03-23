const { app } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * BANCO DE DADOS (NEXUS DB - Mock SQLite) (#11)
 * 1. Persist\u00EAncia local (history, bookmarks, settings, rewards).
 * 2. Transa\u00E7\u00F5es simuladas e Backup autom\u00E1tico.
 */

const DB_PATH = path.join(app.getPath('userData'), 'nexus-db.json');
const BACKUP_PATH = path.join(app.getPath('userData'), 'nexus-db.backup.json');

class NexusDB {
    constructor() {
        this.data = {
            users: [],
            history: [],
            bookmarks: [],
            settings: { theme: 'dark', accent: '#00ccff' },
            rewards: { points: 0, lastClaimed: null }
        };
        this.load();
        
        // Backup Autom\u00E1tico (#11, #13)
        setInterval(() => this.backup(), 10 * 60 * 1000); 
    }

    load() {
        if (fs.existsSync(DB_PATH)) {
            try {
                const raw = fs.readFileSync(DB_PATH, 'utf8');
                this.data = JSON.parse(raw);
            } catch (e) {
                console.error("[DB] Falha ao carregar DB, usando backup...", e);
                this.restoreFromBackup();
            }
        }
    }

    save() {
        try {
            // #11: Simula\u00C7\u00C3o de transa\u00C7\u00C3o (grava\u00C7\u00C3o at\u00D4mica via tmp)
            const tmp = DB_PATH + '.tmp';
            fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
            fs.renameSync(tmp, DB_PATH);
        } catch (e) {
            console.error("[DB] Erro ao salvar dados", e);
        }
    }

    backup() {
        fs.copyFileSync(DB_PATH, BACKUP_PATH);
        console.log("[DB] Backup autom\u00E1tico conclu\u00EDdo.");
    }

    restoreFromBackup() {
        if (fs.existsSync(BACKUP_PATH)) {
            const raw = fs.readFileSync(BACKUP_PATH, 'utf8');
            this.data = JSON.parse(raw);
            this.save();
        }
    }

    // --- M\u00C9TODOS DE DADOS (#5, #6) ---
    get(key) { return this.data[key]; }
    
    set(key, val) { 
        this.data[key] = val; 
        this.save(); 
    }

    addHistory(item) {
        this.data.history.unshift(item); // #11: History Management
        if (this.data.history.length > 1000) this.data.history.pop();
        this.save();
    }

    addPoint(amount = 1) { // #6: Rewards
        this.data.rewards.points += amount;
        this.save();
    }
}

const db = new NexusDB();
module.exports = db;
