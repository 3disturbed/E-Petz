export function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

export async function handleLogin(event) {
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
            window.currentUsername = data.username;
            localStorage.setItem('username', data.username);
            window.isLoggedIn = true;
            window.updateNavLinks();
            window.toggleModal(false);
            document.getElementById('fixed-right-navbar').style.display = 'flex';
            window.connectSocket();
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: Server error');
    }
}

export async function handleRegister(event) {
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

// Make functions globally available
window.toggleForms = toggleForms;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
