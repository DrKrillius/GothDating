// Get current user
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
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

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
}

// Get user-specific storage key
function getStorageKey(key) {
    const username = getCurrentUser();
    return username ? `${key}_${username}` : key;
}

// Check if user is logged in
const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'login.html';
} else if (isUserAdmin(currentUser) && sessionStorage.getItem('isAdmin') === 'true') {
    // Admin should be on admin page, not graveyard
    window.location.href = 'admin.html';
}

const graveyardGrid = document.getElementById('graveyardGrid');
const previousSoulsGrid = document.getElementById('previousSoulsGrid');

// Remove duplicates from localStorage
function removeDuplicates() {
    let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
    let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
    
    // Remove duplicates from graveyard (keep first occurrence)
    const seenGraveyard = new Set();
    graveyard = graveyard.filter(profile => {
        if (seenGraveyard.has(profile.name)) {
            return false;
        }
        seenGraveyard.add(profile.name);
        return true;
    });
    
    // Remove duplicates from previous souls (keep first occurrence)
    const seenPreviousSouls = new Set();
    previousSouls = previousSouls.filter(profile => {
        if (seenPreviousSouls.has(profile.name)) {
            return false;
        }
        seenPreviousSouls.add(profile.name);
        return true;
    });
    
    // If a profile exists in both, remove from previous souls (graveyard takes priority)
    const graveyardNames = new Set(graveyard.map(p => p.name));
    previousSouls = previousSouls.filter(profile => !graveyardNames.has(profile.name));
    
    localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
    localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
}

// Load profiles from localStorage
function loadGraveyard() {
    // Clean up duplicates first
    removeDuplicates();
    
    const graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
    const previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');

    // Display graveyard (accepted)
    if (graveyard.length === 0) {
        graveyardGrid.innerHTML = '<p class="empty-message">No souls in your graveyard yet...</p>';
    } else {
        graveyardGrid.innerHTML = graveyard.map((profile, index) => `
            <div class="profile-mini-card clickable" onclick="viewProfile('graveyard', ${index})">
                <img src="${profile.image}" alt="${profile.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22750%22%3E%3Crect fill=%22%23222%22 width=%22500%22 height=%22750%22/%3E%3Ctext fill=%22%23fff%22 font-family=%22Arial%22 font-size=%2220%22 x=%22250%22 y=%22375%22 text-anchor=%22middle%22%3E${profile.name}%3C/text%3E%3C/svg%3E'">
                <div class="mini-name">${profile.name}</div>
            </div>
        `).join('');
    }

    // Display previous souls (rejected)
    if (previousSouls.length === 0) {
        previousSoulsGrid.innerHTML = '<p class="empty-message">No previous souls yet...</p>';
    } else {
        previousSoulsGrid.innerHTML = previousSouls.map((profile, index) => `
            <div class="profile-mini-card rejected">
                <div class="clickable" onclick="viewProfile('previousSouls', ${index})">
                    <img src="${profile.image}" alt="${profile.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22750%22%3E%3Crect fill=%22%23222%22 width=%22500%22 height=%22750%22/%3E%3Ctext fill=%22%23fff%22 font-family=%22Arial%22 font-size=%2220%22 x=%22250%22 y=%22375%22 text-anchor=%22middle%22%3E${profile.name}%3C/text%3E%3C/svg%3E'">
                    <div class="mini-name">${profile.name}</div>
                </div>
                <button class="dig-mini-btn" onclick="digProfile(${index}); event.stopPropagation();" title="Dig Them">
                    ⛏️
                </button>
            </div>
        `).join('');
    }
}

// View profile detail page
function viewProfile(source, index) {
    const profile = source === 'graveyard' 
        ? JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]')[index]
        : JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]')[index];
    
    if (profile) {
        // Store profile data and source info in sessionStorage for the detail page
        sessionStorage.setItem('viewingProfile', JSON.stringify({
            profile: profile,
            source: source,
            index: index
        }));
        window.location.href = 'profile.html';
    }
}

// Dig profile from previous souls (move to graveyard)
function digProfile(index) {
    let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
    let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
    
    if (index >= 0 && index < previousSouls.length) {
        const profile = previousSouls[index];
        
        // Check if profile already exists in graveyard
        const existsInGraveyard = graveyard.some(p => p.name === profile.name);
        
        if (!existsInGraveyard) {
            previousSouls.splice(index, 1);
            graveyard.push(profile);
            
            localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
            localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
        }
        
        // Reload the graveyard display
        loadGraveyard();
    }
}

// Load on page load
loadGraveyard();

