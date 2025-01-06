function getProfileTooltip(tabId) {
    switch(tabId) {
        case 'vip':
            return 'View and upgrade your membership status';
        case 'avatar':
            return 'Change your profile picture';
        case 'bio':
            return 'Update your personal information';
        case 'stats':
            return 'View your game statistics';
        case 'delete':
            return 'Permanently delete your account';
        default:
            return '';
    }
}

function initializeProfileTabs() {
    const tabButtons = document.querySelectorAll('.profile-tab-btn');
    const tabs = document.querySelectorAll('.profile-tab');

    function switchTab(tabId) {
        // Remove active class from all tabs and buttons
        tabs.forEach(tab => tab.classList.remove('active'));
        tabButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to selected tab and button
        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    // Add click handlers to buttons
    tabButtons.forEach(button => {
        const tabId = button.dataset.tab;
        // Add tooltip
        tooltip.attachToElement(button, getProfileTooltip(tabId));
        
        button.addEventListener('click', () => {
            switchTab(tabId);
        });
    });

    // Show first tab by default
    switchTab('vip');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfileTabs);
