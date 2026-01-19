const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Get all users from localStorage
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

// Save user to localStorage
function saveUser(username, password, role = 'user') {
    const users = getAllUsers();
    users[username] = {
        password: password,
        role: role || 'user',
        createdAt: new Date().toISOString(),
        profiles: [] // Dating profiles this user has created
    };
    localStorage.setItem('users', JSON.stringify(users));
    return users[username];
}

// Get user role
function getUserRole(username) {
    const users = getAllUsers();
    return users[username]?.role || 'user';
}

// Check if user is admin
function isUserAdmin(username) {
    return getUserRole(username) === 'admin' || username === 'Admin@Dating';
}

// Get user by username
function getUser(username) {
    const users = getAllUsers();
    return users[username] || null;
}

// Set current logged in user
function setCurrentUser(username) {
    sessionStorage.setItem('currentUser', username);
}

// Get current logged in user
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// Check if admin login
function isAdminLogin(username, password) {
    return username === 'Admin@Dating' && password === 'Admin@123';
}

// Login form handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('💀 Please enter both username and password');
        return;
    }
    
    // Check for admin login
    if (isAdminLogin(username, password)) {
        // Ensure Admin@Dating has admin role
        const users = getAllUsers();
        if (!users['Admin@Dating']) {
            saveUser('Admin@Dating', 'Admin@123', 'admin');
        } else if (users['Admin@Dating'].role !== 'admin') {
            users['Admin@Dating'].role = 'admin';
            localStorage.setItem('users', JSON.stringify(users));
        }
        setCurrentUser('Admin@Dating');
        sessionStorage.setItem('isAdmin', 'true');
        // Redirect to normal dating app, admin can access panel via button
        window.location.href = 'index.html';
        return;
    }
    
    let user = getUser(username);
    
    // If user doesn't exist, create new user
    if (!user) {
        user = saveUser(username, password);
        alert(`💀 Welcome to the darkness, ${username}! Your profile has been created.`);
    } else {
        // Check password
        if (user.password !== password) {
            alert('💀 Incorrect password. The darkness rejects you.');
            return;
        }
    }
    
    // Set current user and redirect to normal dating app
    setCurrentUser(username);
    const userRole = getUserRole(username);
    if (isUserAdmin(username)) {
        sessionStorage.setItem('isAdmin', 'true');
    } else {
        sessionStorage.setItem('isAdmin', 'false');
    }
    window.location.href = 'index.html';
});

// Create User button handler
const createUserBtn = document.getElementById('createUserBtn');
createUserBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('💀 Please enter both username and password to create an account.');
        return;
    }
    
    // Check if user already exists
    const existingUser = getUser(username);
    if (existingUser) {
        alert(`💀 Username "${username}" already exists. Please choose a different username or login.`);
        return;
    }
    
    // Check for admin username conflict
    if (username === 'Admin@Dating') {
        alert('💀 This username is reserved. Please choose a different username.');
        return;
    }
    
    // Create new user
    const newUser = saveUser(username, password);
    alert(`💀 Welcome to the darkness, ${username}! Your account has been created successfully.\n\nYou can now login with your credentials.`);
    
    // Clear password field
    passwordInput.value = '';
});

// Check if user is already logged in
const currentUser = getCurrentUser();
if (currentUser) {
    // All logged in users go to normal dating app
    window.location.href = 'index.html';
}

