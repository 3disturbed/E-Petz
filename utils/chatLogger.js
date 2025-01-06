const fs = require('fs').promises;
const path = require('path');

const CHATLOG_DIR = path.join(process.cwd(), 'chatlog');
const PROCESSED_DIR = path.join(process.cwd(), 'chatlog', 'processed');

async function ensureDirectories() {
    try {
        await fs.mkdir(CHATLOG_DIR, { recursive: true });
        await fs.mkdir(PROCESSED_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating chat log directories:', error);
    }
}

async function logChatMessage(username, channel, message) {
    const timestamp = Date.now();
    const date = new Date(timestamp);
    const fileName = `${username}-${channel}-${date.toISOString().split('T')[0]}-${timestamp}.txt`;
    const filePath = path.join(CHATLOG_DIR, fileName);

    try {
        await fs.writeFile(filePath, `${message}\n`);
    } catch (error) {
        console.error('Error logging chat message:', error);
    }
}

async function processLogs() {
    try {
        const files = await fs.readdir(CHATLOG_DIR);
        const logs = new Map(); // hour timestamp -> messages

        // Group messages by hour
        for (const file of files) {
            if (!file.endsWith('.txt')) continue;

            const filePath = path.join(CHATLOG_DIR, file);
            const stats = await fs.stat(filePath);
            const hourTimestamp = Math.floor(stats.ctimeMs / (1000 * 60 * 60)) * (1000 * 60 * 60);
            
            const content = await fs.readFile(filePath, 'utf8');
            const [username, channel] = file.split('-');
            
            if (!logs.has(hourTimestamp)) {
                logs.set(hourTimestamp, []);
            }
            
            logs.get(hourTimestamp).push({
                username,
                channel,
                message: content.trim(),
                timestamp: stats.ctimeMs
            });

            // Delete the original file
            await fs.unlink(filePath);
        }

        // Write hourly log files
        for (const [timestamp, messages] of logs) {
            const date = new Date(timestamp);
            const fileName = `${date.toISOString().split(':')[0]}.log`;
            const filePath = path.join(PROCESSED_DIR, fileName);
            
            const logContent = messages
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(m => `[${new Date(m.timestamp).toISOString()}] ${m.username} @ ${m.channel}: ${m.message}`)
                .join('\n');

            await fs.writeFile(filePath, logContent + '\n');
        }
    } catch (error) {
        console.error('Error processing chat logs:', error);
    }
}

module.exports = {
    ensureDirectories,
    logChatMessage,
    processLogs
};
