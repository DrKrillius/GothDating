// Get current user
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
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

// Get current user's data
function getCurrentUserData() {
    const username = getCurrentUser();
    if (!username) return null;
    const users = getAllUsers();
    return users[username] || null;
}

// Get profiles for current user
function getUserProfiles() {
    const userData = getCurrentUserData();
    if (!userData) return [];
    return userData.profiles || [];
}

// Save profiles for current user
function saveUserProfiles(profiles) {
    const username = getCurrentUser();
    if (!username) return;
    const users = getAllUsers();
    if (users[username]) {
        users[username].profiles = profiles;
        localStorage.setItem('users', JSON.stringify(users));
    }
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

// Check if user is logged in, redirect if not
const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'login.html';
}
// Admins can use the normal dating app and access admin panel via button

// Get profiles - start with default ones, then add user's created profiles
let profiles = [
    {
        name: "Jearn van goth",
        image: "User/Jearn van goth.png"
    },
    {
        name: "Stickerson",
        image: "User/Sticking.png"
    },
];

// Function to reload profiles (useful after creating new ones)
function reloadProfiles() {
    const defaultProfiles = [
        {
            name: "Jearn van goth",
            image: "User/Jearn van goth.png"
        },
        {
            name: "Stickerson",
            image: "User/Sticking.png"
        },
    ];
    const userProfiles = getUserProfiles();
    profiles = [...defaultProfiles, ...userProfiles];
    console.log('Profiles reloaded. Total:', profiles.length);
    console.log('All profiles:', profiles);
}

// Add user's created profiles
reloadProfiles();

let currentProfileIndex = 0;
let usersShown = 0; // Track how many users have been shown (accepted or rejected)

// Get DOM elements
const profileCard = document.getElementById('profileCard');
const profileImage = document.getElementById('profileImage');
const profileName = document.getElementById('profileName');
const acceptBtn = document.getElementById('acceptBtn');
const rejectBtn = document.getElementById('rejectBtn');
const lightEffect = document.getElementById('lightEffect');
const matchMessage = document.getElementById('matchMessage');

// Check if elements exist
if (!profileCard || !profileImage || !profileName || !acceptBtn || !rejectBtn) {
    console.error('Required elements not found!', {
        profileCard: !!profileCard,
        profileImage: !!profileImage,
        profileName: !!profileName,
        acceptBtn: !!acceptBtn,
        rejectBtn: !!rejectBtn
    });
}

// Get user-specific storage key
function getStorageKey(key) {
    const username = getCurrentUser();
    return username ? `${key}_${username}` : key;
}

// Remove duplicates from localStorage (user-specific)
function removeDuplicates() {
    const username = getCurrentUser();
    if (!username) return;
    
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

// Check if there are any available profiles (not in graveyard)
function hasAvailableProfiles() {
    for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        const exists = profileExists(profile.name);
        // Only skip if profile is in graveyard (accepted)
        // Profiles in previous souls (rejected) can appear again
        if (!exists.inGraveyard) {
            return true;
        }
    }
    return false;
}

// Show sorry message
function showSorryMessage() {
    profileCard.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; padding: 40px; text-align: center;">
            <h2 style="color: #ff00ff; font-size: 2em; margin-bottom: 20px;">💀 Sorry 💀</h2>
            <p style="color: #b8860b; font-size: 1.3em;">Nobody likes you enough to appear here</p>
            <button onclick="restartQueue()" style="margin-top: 30px; padding: 15px 30px; background: linear-gradient(135deg, #8b4513, #654321); color: #ffd700; border: 2px solid #b8860b; border-radius: 10px; font-size: 1.2em; cursor: pointer; font-family: 'Courier New', monospace; font-weight: bold;">Return to Start</button>
        </div>
    `;
    acceptBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
}

// Initialize first profile
function loadProfile() {
    console.log('Loading profile...');
    console.log('Current profile index:', currentProfileIndex);
    console.log('Total profiles:', profiles.length);
    console.log('All profiles:', profiles);
    
    // Check if we've shown 5 users - show sorry message
    if (usersShown >= 5) {
        showSorryMessage();
        return;
    }

    // Check if we've gone through all profiles
    if (currentProfileIndex >= profiles.length) {
        // Reset to start of profiles list to show them again
        currentProfileIndex = 0;
    }

    // Skip profiles that are in graveyard (accepted) or previous souls (rejected)
    let attempts = 0;
    while (currentProfileIndex < profiles.length && attempts < profiles.length) {
        const profile = profiles[currentProfileIndex];
        
        if (!profile) {
            console.error('Profile is null at index:', currentProfileIndex);
            currentProfileIndex++;
            attempts++;
            continue;
        }
        
        console.log('Checking profile:', profile.name);
        const exists = profileExists(profile.name);
        
        // Skip if in graveyard (accepted) or previous souls (rejected)
        if (exists.inGraveyard || exists.inPreviousSouls) {
            console.log('Profile already in graveyard or previous souls, skipping');
            currentProfileIndex++;
            attempts++;
            // If we've gone through all profiles, reset to beginning
            if (currentProfileIndex >= profiles.length) {
                currentProfileIndex = 0;
            }
            continue;
        }
        
        // Found a profile that's not in graveyard or previous souls, show it
        console.log('Displaying profile:', profile.name);
        profileImage.src = profile.image;
        profileName.textContent = profile.name;
        
        // Reset card state
        profileCard.classList.remove('digging', 'rejecting');
        lightEffect.classList.remove('active');
        matchMessage.classList.remove('show');
        
        // Make sure buttons are visible
        acceptBtn.style.display = 'flex';
        rejectBtn.style.display = 'flex';
        
        return;
    }
    
    // If we get here, all profiles are in graveyard or previous souls - show sorry
    console.log('All profiles have been shown or are in graveyard/previous souls');
    showSorryMessage();
}

// Restart the queue
function restartQueue() {
    currentProfileIndex = 0;
    usersShown = 0; // Reset the counter for new session
    acceptBtn.style.display = 'flex';
    rejectBtn.style.display = 'flex';
    loadProfile();
}

// Check if profile already exists in graveyard or previous souls
function profileExists(profileName) {
    const graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
    const previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
    
    return {
        inGraveyard: graveyard.some(p => p.name === profileName),
        inPreviousSouls: previousSouls.some(p => p.name === profileName),
        graveyardIndex: graveyard.findIndex(p => p.name === profileName),
        previousSoulsIndex: previousSouls.findIndex(p => p.name === profileName)
    };
}

// Accept action - Dig them!
if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
        console.log('Accept button clicked');
        console.log('Current profile index:', currentProfileIndex);
        console.log('Profiles length:', profiles.length);
        console.log('Current profiles:', profiles);
        
        if (currentProfileIndex >= profiles.length) {
            console.log('Profile index out of range');
            return;
        }
        
        const profile = profiles[currentProfileIndex];
        console.log('Current profile:', profile);
        
        if (!profile) {
            console.error('No profile found at index:', currentProfileIndex);
            return;
        }
        
        const exists = profileExists(profile.name);
    
    // If already in graveyard, skip
    if (exists.inGraveyard) {
        currentProfileIndex++;
        loadProfile();
        return;
    }
    
    // If in previous souls, move to graveyard instead
    if (exists.inPreviousSouls) {
        let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
        let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
        
        previousSouls.splice(exists.previousSoulsIndex, 1);
        graveyard.push(profile);
        
        localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
        localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
    } else {
        // New profile - add to graveyard
        let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
        graveyard.push(profile);
        localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
    }
    
    profileCard.classList.add('digging');
    
    setTimeout(() => {
        matchMessage.classList.add('show');
        
        setTimeout(() => {
            matchMessage.classList.remove('show');
            currentProfileIndex++;
            usersShown++; // Increment counter when user is accepted
            loadProfile();
        }, 2000);
    }, 600);
    });
} else {
    console.error('Accept button not found!');
}

// Reject action - Light takes them away
if (rejectBtn) {
    rejectBtn.addEventListener('click', () => {
        console.log('Reject button clicked');
        console.log('Current profile index:', currentProfileIndex);
        console.log('Profiles length:', profiles.length);
        
        if (currentProfileIndex >= profiles.length) {
            console.log('Profile index out of range');
            return;
        }
        
        const profile = profiles[currentProfileIndex];
        console.log('Current profile:', profile);
        
        if (!profile) {
            console.error('No profile found at index:', currentProfileIndex);
            return;
        }
        
        const exists = profileExists(profile.name);
    
    // If in graveyard, move to previous souls (so they can come back in queue)
    if (exists.inGraveyard) {
        let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
        let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
        
        // Remove from graveyard if not already in previous souls
        if (!exists.inPreviousSouls) {
            graveyard.splice(exists.graveyardIndex, 1);
            previousSouls.push(profile);
        } else {
            // Already in previous souls, just remove from graveyard
            graveyard.splice(exists.graveyardIndex, 1);
        }
        
        localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
        localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
    } else if (!exists.inPreviousSouls) {
        // New profile or not in previous souls - add to previous souls
        let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
        previousSouls.push(profile);
        localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
    }
    // If already in previous souls, just continue (they'll appear again in queue)
    
    profileCard.classList.add('rejecting');
    lightEffect.classList.add('active');
    
    setTimeout(() => {
        currentProfileIndex++;
        usersShown++; // Increment counter when user is rejected
        loadProfile();
    }, 1500);
    });
} else {
    console.error('Reject button not found!');
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        rejectBtn.click();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        acceptBtn.click();
    }
});

// Logout function
function logout() {
    if (confirm('💀 Are you sure you want to leave the darkness?')) {
        // Check if impersonating
        const impersonating = sessionStorage.getItem('impersonating');
        const originalAdmin = sessionStorage.getItem('originalAdmin');
        
        if (impersonating === 'true' && originalAdmin) {
            // Return to admin panel
            sessionStorage.setItem('currentUser', originalAdmin);
            sessionStorage.setItem('isAdmin', 'true');
            sessionStorage.removeItem('impersonating');
            sessionStorage.removeItem('originalAdmin');
            window.location.href = 'admin.html';
        } else {
            // Normal logout
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }
}

// Clean up duplicates on page load
removeDuplicates();

// Load first profile when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadProfile();
    });
} else {
    loadProfile();
}

