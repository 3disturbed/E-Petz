window.isLoggedIn = false;
window.socket = null;
window.currentUsername = '';
window.currentChannel = 'General';

import {
    fetchAndUpdateInventory,
    updateInventoryDisplay,
    displayFilteredItems,
    handleItemAction
} from './modals/inventoryModal.js';

import {
    connectSocket,
    handleGlobalChatSend,
    displayChannelMessages,
    displayMessage
} from './modals/globalChatModal.js';

const savedSessionKey = localStorage.getItem('sessionKey') || '';

function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

// Add modal toggle function
window.toggleModal = function(show, modalId = 'loginModal') {
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
