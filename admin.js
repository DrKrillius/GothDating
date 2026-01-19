// Get user role
function getUserRole(username) {
    const users = getAllUsers();
    return users[username]?.role || 'user';
}

// Check if user is admin
function isUserAdmin(username) {
    return getUserRole(username) === 'admin' || username === 'Admin@Dating';
}

// Check if current user is admin
function isAdmin() {
    const currentUser = sessionStorage.getItem('currentUser');
    return currentUser && isUserAdmin(currentUser) && sessionStorage.getItem('isAdmin') === 'true';
}

// Check if user is logged in
if (!isAdmin()) {
    window.location.href = 'login.html';
}

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

// Save user
function saveUser(username, password, role = 'user') {
    const users = getAllUsers();
    users[username] = {
        password: password,
        role: role,
        createdAt: new Date().toISOString(),
        profiles: []
    };
    localStorage.setItem('users', JSON.stringify(users));
    return users[username];
}

// Get user role
function getUserRole(username) {
    const users = getAllUsers();
    return users[username]?.role || 'user';
}

// Set user role
function setUserRole(username, role) {
    const users = getAllUsers();
    if (users[username]) {
        users[username].role = role;
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }
    return false;
}

// Remove user
function removeUser(username) {
    const users = getAllUsers();
    if (users[username]) {
        delete users[username];
        localStorage.setItem('users', JSON.stringify(users));
        
        // Also remove user's graveyard and previous souls
        localStorage.removeItem(`graveyard_${username}`);
        localStorage.removeItem(`previousSouls_${username}`);
        return true;
    }
    return false;
}

// Get user list (all users for dropdowns, excluding main admin for some operations)
function getUserList(excludeMainAdmin = true) {
    const users = getAllUsers();
    if (excludeMainAdmin) {
        return Object.keys(users).filter(u => u !== 'Admin@Dating');
    }
    return Object.keys(users);
}

// Display all users
function displayUsersList() {
    const users = getAllUsers();
    const usersList = document.getElementById('usersList');
    
    if (Object.keys(users).length === 0) {
        usersList.innerHTML = '<p class="empty-message">No users found</p>';
        return;
    }
    
    let html = '<div class="users-table">';
    html += '<div class="user-row header-row">';
    html += '<div class="user-cell"><strong>Username</strong></div>';
    html += '<div class="user-cell"><strong>Role</strong></div>';
    html += '<div class="user-cell"><strong>Created</strong></div>';
    html += '<div class="user-cell"><strong>Profiles</strong></div>';
    html += '</div>';
    
    // Sort users: Admin@Dating first, then admins, then users
    const sortedUsers = Object.entries(users).sort((a, b) => {
        if (a[0] === 'Admin@Dating') return -1;
        if (b[0] === 'Admin@Dating') return 1;
        const roleA = a[1].role || 'user';
        const roleB = b[1].role || 'user';
        if (roleA === 'admin' && roleB !== 'admin') return -1;
        if (roleA !== 'admin' && roleB === 'admin') return 1;
        return a[0].localeCompare(b[0]);
    });
    
    for (const [username, userData] of sortedUsers) {
        const role = userData.role || (username === 'Admin@Dating' ? 'admin' : 'user');
        const created = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A';
        const profileCount = (userData.profiles || []).length;
        const roleBadge = role === 'admin' ? '<span style="color: #ff00ff;">👑 Admin</span>' : '<span style="color: #b8860b;">👤 User</span>';
        
        html += `<div class="user-row ${username === 'Admin@Dating' ? 'admin-row' : ''}">`;
        html += `<div class="user-cell">${username === 'Admin@Dating' ? '👑 ' : ''}${username}</div>`;
        html += `<div class="user-cell">${roleBadge}</div>`;
        html += `<div class="user-cell">${created}</div>`;
        html += `<div class="user-cell">${profileCount}</div>`;
        html += '</div>';
    }
    
    html += '</div>';
    usersList.innerHTML = html;
}

// Populate user select dropdowns
function populateUserSelects() {
    const users = getUserList();
    const selects = ['removeUsername', 'impersonateUsername', 'messageUsername', 'changeRoleUsername', 'resetUsername'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">-- Select User --</option>';
        users.forEach(username => {
            const option = document.createElement('option');
            option.value = username;
            const role = getUserRole(username);
            option.textContent = `${username} (${role})`;
            select.appendChild(option);
        });
    });
}

// Add user form
document.getElementById('addUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!username || !password) {
        alert('💀 Please enter both username and password');
        return;
    }
    
    if (username === 'Admin@Dating') {
        alert('💀 Cannot create admin user through this form');
        return;
    }
    
    const users = getAllUsers();
    if (users[username]) {
        alert('💀 User already exists');
        return;
    }
    
    saveUser(username, password, role);
    alert(`💀 User "${username}" has been created as ${role}!`);
    document.getElementById('addUserForm').reset();
    populateUserSelects();
    displayUsersList();
});

// Remove user form
document.getElementById('removeUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('removeUsername').value;
    
    if (!username) {
        alert('💀 Please select a user');
        return;
    }
    
    if (confirm(`💀 Are you sure you want to remove user "${username}"? This will delete all their data.`)) {
        if (removeUser(username)) {
            alert(`💀 User "${username}" has been removed!`);
            populateUserSelects();
            displayUsersList();
        } else {
            alert('💀 User not found');
        }
    }
});

// Change role form
document.getElementById('changeRoleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('changeRoleUsername').value;
    const newRole = document.getElementById('newRole').value;
    
    if (!username) {
        alert('💀 Please select a user');
        return;
    }
    
    if (username === 'Admin@Dating') {
        alert('💀 Cannot change main admin role');
        return;
    }
    
    if (setUserRole(username, newRole)) {
        alert(`💀 User "${username}" role changed to ${newRole}!`);
        populateUserSelects();
        displayUsersList();
    } else {
        alert('💀 User not found');
    }
});

// Impersonate user form
document.getElementById('impersonateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('impersonateUsername').value;
    
    if (!username) {
        alert('💀 Please select a user');
        return;
    }
    
    // Store that we're impersonating
    const currentAdmin = sessionStorage.getItem('currentUser');
    sessionStorage.setItem('impersonating', 'true');
    sessionStorage.setItem('originalAdmin', currentAdmin);
    
    // Switch to user
    sessionStorage.setItem('currentUser', username);
    sessionStorage.setItem('isAdmin', 'false');
    
    alert(`💀 Now impersonating user: ${username}`);
    window.location.href = 'index.html';
});

// Message user form
document.getElementById('messageUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('messageUsername').value;
    const message = document.getElementById('messageText').value.trim();
    
    if (!username || !message) {
        alert('💀 Please select a user and enter a message');
        return;
    }
    
    // Store message for user
    const userMessages = JSON.parse(localStorage.getItem(`messages_${username}`) || '[]');
    userMessages.push({
        message: message,
        from: 'Admin',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem(`messages_${username}`, JSON.stringify(userMessages));
    
    alert(`💀 Message sent to ${username}!`);
    document.getElementById('messageUserForm').reset();
});

// Reset user data
function resetUserData(username, resetProfiles = false) {
    if (!username) return false;
    
    // Clear graveyard
    localStorage.removeItem(`graveyard_${username}`);
    
    // Clear previous souls
    localStorage.removeItem(`previousSouls_${username}`);
    
    // Clear messages
    localStorage.removeItem(`messages_${username}`);
    
    // Optionally reset created profiles
    if (resetProfiles) {
        const users = getAllUsers();
        if (users[username]) {
            users[username].profiles = [];
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    return true;
}

// Reset user form
document.getElementById('resetUserForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('resetUsername').value;
    const resetProfiles = document.getElementById('resetProfiles').checked;
    
    if (!username) {
        alert('💀 Please select a user');
        return;
    }
    
    if (username === 'Admin@Dating') {
        alert('💀 Cannot reset admin user');
        return;
    }
    
    const confirmMessage = resetProfiles 
        ? `💀 Are you sure you want to reset ALL data for "${username}"?\n\nThis will clear:\n- Graveyard (accepted profiles)\n- Previous Souls (rejected profiles)\n- Messages\n- Created Profiles\n\nThis action cannot be undone!`
        : `💀 Are you sure you want to reset data for "${username}"?\n\nThis will clear:\n- Graveyard (accepted profiles)\n- Previous Souls (rejected profiles)\n- Messages\n\nCreated profiles will be kept.\n\nThis action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
        if (resetUserData(username, resetProfiles)) {
            alert(`💀 User "${username}" data has been reset!`);
            displayUsersList(); // Refresh user list to show updated profile count
        } else {
            alert('💀 Failed to reset user data');
        }
    }
});

// Logout function
function logout() {
    if (confirm('💀 Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// Load user list on page load
populateUserSelects();
displayUsersList();

