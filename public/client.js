let isLoggedIn = false;
let socket = null;
let currentUsername = ''; // Add this line to store username
let currentChannel = 'General';

function connectSocket() {
    const sessionKey = localStorage.getItem('sessionKey');
    if (sessionKey && !socket) {
        socket = io({
            query: { sessionKey }
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            socket = null;
        });

        socket.on('messageHistory', (history) => {
            displayChannelMessages(history[currentChannel] || []);
        });

        socket.on('channelMessage', (data) => {
            if (data.channel === currentChannel) {
                displayMessage(data);
            }
        });
    }
}

function displayChannelMessages(messages) {
    const chatBox = document.getElementById('chatMessages');
    chatBox.innerHTML = ''; // Clear existing messages
    messages.forEach(data => displayMessage(data));
    chatBox.scrollTop = chatBox.scrollHeight;
}

function displayMessage(data) {
    const chatBox = document.getElementById('chatMessages');
    if (chatBox) {
        const msgDiv = document.createElement('div');
        const isLocal = data.user === currentUsername;
        console.log(data.user  + " " + currentUsername);
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

const savedSessionKey = localStorage.getItem('sessionKey') || '';

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

// Add modal toggle function
function toggleModal(show, modalId = 'loginModal') {
    const modal = document.getElementById(modalId);
    modal.style.display = show ? 'flex' : 'none';
    
    // Update inventory when opening inventory modal
    if (modalId === 'inventoryModal' && show && isLoggedIn) {
        fetchAndUpdateInventory();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('sessionKey', data.sessionKey);
            currentUsername = data.username; // Store the username
            localStorage.setItem('username', data.username); // Also store in localStorage
            isLoggedIn = true;
            updateNavLinks();
            toggleModal(false);
            document.getElementById('fixed-right-navbar').style.display = 'flex';
            connectSocket(); // Connect socket after successful login
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: Server error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formData.get('username'),
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        if (response.ok) {
            toggleForms();
        } else {
            const errorData = await response.json();
            alert(`Registration failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Registration failed:', error);
        alert('Registration failed: Server error');
    }
}

function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    if (isLoggedIn) {
        navLinks.innerHTML = `
            <button onclick="toggleModal(true, 'dashboardModal')">Dashboard</button>
            <button onclick="toggleModal(true, 'storeModal')">Store</button>
            <button onclick="toggleModal(true, 'petsModal')">Pets</button>
            <button onclick="toggleModal(true, 'questsModal')">Quests</button>
            <button onclick="toggleModal(true, 'inventoryModal')">Inventory</button>
            <button onclick="toggleModal(true, 'auctionsModal')">Auctions</button>
        `;
        document.getElementById('fixed-right-navbar').style.display = 'flex';
    } else {
        navLinks.innerHTML = `<button id="PlayButton" onclick="toggleModal(true)">Play Now!</button>`;
        document.getElementById('fixed-right-navbar').style.display = 'none';
    }
}

// Handle sending global chat messages
async function handleGlobalChatSend(event) {
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
                channel: currentChannel 
            })
        });
        chatInput.value = '';
    } catch (error) {
        console.error('Error sending chat:', error);
    }
}

// Add tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.chat-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentChannel = tab.dataset.channel;
            if (socket) {
                socket.emit('requestChannel', currentChannel);
            }
        });
    });
});

// Check for session key on page load
window.onload = async function() {
    const sessionKey = localStorage.getItem('sessionKey');
    if (sessionKey) {
        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionKey })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    isLoggedIn = true;
                    currentUsername = data.user; // Set username from verify response
                    localStorage.setItem('username', data.user);
                    updateNavLinks();
                    connectSocket();
                    return;
                }
            }
        } catch (error) {
            console.error('Session verification failed:', error);
        }
        // If we get here, session is invalid
        localStorage.removeItem('sessionKey');
        localStorage.removeItem('username');
    }
    toggleModal(true);
}

// Inventory management functions
function updateInventoryDisplay(inventory) {
    const grid = document.getElementById('inventoryGrid');
    const coinDisplay = document.getElementById('coinCount');
    
    grid.innerHTML = '';
    coinDisplay.textContent = inventory.coins;

    // Create all slots (filled + empty)
    for (let i = 0; i < inventory.maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        
        if (i < inventory.items.length) {
            const item = inventory.items[i];
            slot.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                ${item.quantity > 1 ? `<span class="item-count">${item.quantity}</span>` : ''}
                <div class="inventory-tooltip">
                    <strong>${item.name}</strong><br>
                    ${item.description}
                </div>
            `;
            slot.onclick = () => handleItemClick(item);
        } else {
            slot.classList.add('empty');
        }
        
        grid.appendChild(slot);
    }
}

function handleItemClick(item) {
    // Handle item usage, can be expanded based on item type
    console.log('Item clicked:', item);
}

async function fetchAndUpdateInventory() {
    try {
        const response = await fetch('/api/inventory', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('sessionKey')}`
            }
        });
        if (response.ok) {
            const data = await response.json();
            updateInventoryDisplay(data.inventory);
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}
