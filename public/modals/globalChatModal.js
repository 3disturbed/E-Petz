export function connectSocket() {
    const sessionKey = localStorage.getItem('sessionKey');
    if (sessionKey && !window.socket) {
        window.socket = io({
            query: { sessionKey }
        });

        window.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            window.socket = null;
        });

        window.socket.on('messageHistory', (history) => {
            displayChannelMessages(history[window.currentChannel] || []);
        });

        window.socket.on('channelMessage', (data) => {
            if (data.channel === window.currentChannel) {
                displayMessage(data);
            }
        });
    }
}

// Make connectSocket globally available
window.connectSocket = connectSocket;

export function displayChannelMessages(messages) {
    const chatBox = document.getElementById('chatMessages');
    chatBox.innerHTML = ''; // Clear existing messages
    messages.forEach(data => displayMessage(data));
    chatBox.scrollTop = chatBox.scrollHeight;
}

export function displayMessage(data) {
    const chatBox = document.getElementById('chatMessages');
    if (chatBox) {
        const msgDiv = document.createElement('div');
        const isLocal = data.user === window.currentUsername;
        console.log(data.user  + " " + window.currentUsername);
        const usernameSpan = document.createElement('span');
        usernameSpan.className = isLocal ? 'message-username-local' : 'message-username-remote';
        usernameSpan.textContent = `${data.user}: `;

        const userSubDiv = document.createElement('div');  

        userSubDiv.appendChild(usernameSpan);      
        msgDiv.appendChild(userSubDiv);

        // create subdiv for message
        const msgSubDiv = document.createElement('div');
        msgSubDiv.className = isLocal ? 'message-local' : 'message-remote';

        msgSubDiv.appendChild(document.createTextNode(data.message));
       
        msgDiv.appendChild(msgSubDiv);
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

export async function handleGlobalChatSend(event) {
    if (event) event.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (!message) return;
    try {
        const sessionKey = localStorage.getItem('sessionKey') || '';
        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sessionKey, 
                message,
                channel: window.currentChannel 
            })
        });
        chatInput.value = '';
    } catch (error) {
        console.error('Error sending chat:', error);
    }
}