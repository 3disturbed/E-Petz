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

function getNavTooltip(type) {
    switch(type) {
        case 'dashboard':
            return 'View your pet statistics and daily activities';
        case 'store':
            return 'Buy items, eggs, and accessories';
        case 'pets':
            return 'Manage and interact with your pets';
        case 'quests':
            return 'Complete tasks to earn rewards';
        case 'inventory':
            return 'View and manage your items';
        case 'auctions':
            return 'Buy and sell items with other players';
        case 'inbox':
            return 'Check your messages and notifications';
        case 'social':
            return 'Connect with other players';
        case 'profile':
            return 'View and edit your profile';
        case 'globalChat':
            return 'Chat with other players in different locations';
        default:
            return '';
    }
}

function updateNavLinks() {
    const navLinks = document.getElementById('nav-links');
    const rightNav = document.getElementById('fixed-right-navbar');
    
    if (isLoggedIn) {
        // Main navigation buttons
        const mainNavButtons = [
            { id: 'dashboard', text: 'Dashboard' },
            { id: 'store', text: 'Store' },
            { id: 'pets', text: 'Pets' },
            { id: 'quests', text: 'Quests' },
            { id: 'inventory', text: 'Inventory' },
            { id: 'auctions', text: 'Auctions' }
        ];

        navLinks.innerHTML = mainNavButtons.map(btn => `
            <button onclick="toggleModal(true, '${btn.id}Modal')">${btn.text}</button>
        `).join('');

        // Right sidebar buttons
        const rightNavButtons = [
            { id: 'inbox', text: 'Inbox' },
            { id: 'social', text: 'Social' },
            { id: 'profile', text: 'My Profile' },
            { id: 'globalChat', text: 'Global Chat' }
        ];

        rightNav.innerHTML = rightNavButtons.map(btn => `
            <button onclick="toggleModal(true, '${btn.id}Modal')">${btn.text}</button>
        `).join('');

        // Add tooltips to all navigation buttons
        [...mainNavButtons, ...rightNavButtons].forEach(btn => {
            const button = document.querySelector(`button[onclick*="${btn.id}Modal"]`);
            if (button) {
                tooltip.attachToElement(button, getNavTooltip(btn.id));
            }
        });

        rightNav.style.display = 'flex';
    } else {
        const playButton = `<button id="PlayButton" onclick="toggleModal(true)">Play Now!</button>`;
        navLinks.innerHTML = playButton;
        rightNav.style.display = 'none';

        // Add tooltip to play button
        const playBtn = document.getElementById('PlayButton');
        if (playBtn) {
            tooltip.attachToElement(playBtn, 'Start your pet adventure!');
        }
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
function getFilterTooltip(type) {
    switch(type) {
        case 'Egg':
            return 'View all eggs that can hatch into pets';
        case 'Food':
            return 'View all food items to feed your pets';
        case 'Toy':
            return 'View all toys to play with your pets';
        case 'Cosmetic':
            return 'View all cosmetic items and accessories';
        default:
            return 'View all items in your inventory';
    }
}

function updateInventoryDisplay(inventory) {
    const itemsList = document.getElementById('itemsList');
    const filtersList = document.getElementById('itemTypeFilters');
    const coinDisplay = document.getElementById('coinCount');
    
    coinDisplay.textContent = inventory.coins;

    // Get unique item types
    const itemTypes = [...new Set(inventory.items.map(item => item.type))];
    
    // Create filters with tooltips
    filtersList.innerHTML = `
        <button class="filter-button active" data-type="all">All Items</button>
        ${itemTypes.map(type => `
            <button class="filter-button" data-type="${type}">${type}</button>
        `).join('')}
    `;

    // Add filter click handlers and tooltips
    filtersList.querySelectorAll('.filter-button').forEach(button => {
        const type = button.dataset.type;
        
        // Add tooltip
        tooltip.attachToElement(button, getFilterTooltip(type));

        // Add click handler
        button.addEventListener('click', () => {
            filtersList.querySelectorAll('.filter-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            displayFilteredItems(inventory.items, type);
        });
    });

    // Initial display of all items
    displayFilteredItems(inventory.items, 'all');
}

function displayFilteredItems(items, filterType) {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    const filteredItems = filterType === 'all' 
        ? items 
        : items.filter(item => item.type === filterType);

    filteredItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-entry';
        itemElement.setAttribute('data-type', item.type);
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="item-icon">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                ${item.quantity > 1 ? `<div class="item-quantity">x${item.quantity}</div>` : ''}
            </div>
            <button class="item-action" onclick="handleItemAction('${item.id}')">${getItemActionButton(item)}</button>
        `;

        // Attach tooltip to the item element
        tooltip.attachToElement(itemElement, item.description);

        itemsList.appendChild(itemElement);
    });
}

// Remove old tooltip event listeners since they're now handled by tooltip.js
// ...rest of the code...

function getItemActionButton(item) {
    // Customize button text based on item type
    switch(item.type) {
        case 'food':
            return 'Feed';
        case 'toy':
            return 'Play';
        case 'cosmetic':
            return 'Wear';
        default:
            return 'Use';
    }
}

function handleItemAction(itemId) {
    // Handle item usage based on type
    console.log('Using item:', itemId);
    // Implement item usage logic here
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
