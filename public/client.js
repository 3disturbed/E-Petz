function toggleForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}

// Add modal toggle function
function toggleModal(show) {
    const modal = document.getElementById('loginModal');
    modal.style.display = show ? 'flex' : 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        toggleModal(false);
    }
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
            window.location.href = '/dashboard';
        }
    } catch (error) {
        console.error('Login failed:', error);
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
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
            }),
        });
        if (response.ok) {
            toggleForms();
        }
    } catch (error) {
        console.error('Registration failed:', error);
    }
}
