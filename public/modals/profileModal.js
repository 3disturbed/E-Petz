function getProfileTooltip(section) {
    switch(section) {
        case 'vip':
            return 'View and upgrade your membership status';
        case 'avatar':
            return 'Change your profile picture';
        case 'bio':
            return 'Update your personal information';
        case 'stats':
            return 'View your achievements and progress';
        case 'delete':
            return 'Permanently delete your account';
        default:
            return '';
    }
}

function initializeProfile() {
    const navItems = document.querySelectorAll('.profile-nav-item');
    navItems.forEach(item => {
        // Add tooltips
        tooltip.attachToElement(item, getProfileTooltip(item.dataset.section));

        // Add click handlers
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all sections
            document.querySelectorAll('.profile-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show selected section
            const sectionId = `${item.dataset.section}Section`;
            document.getElementById(sectionId).style.display = 'block';
        });
    });

    // Show first section by default
    navItems[0].click();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfile);
