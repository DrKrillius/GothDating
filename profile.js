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
    // Admin should be on admin page, not profile page
    window.location.href = 'admin.html';
}

const profileDetailImage = document.getElementById('profileDetailImage');
const profileDetailName = document.getElementById('profileDetailName');
const profilePersonalInfo = document.getElementById('profilePersonalInfo');
const profileStatus = document.getElementById('profileStatus');
const removeBtn = document.getElementById('removeBtn');
const moveBtn = document.getElementById('moveBtn');
const messageActions = document.getElementById('messageActions');
const messageBtn = document.getElementById('messageBtn');

let currentProfileData = null;

// Map profile names to info file names
function getInfoFileName(profileName, profileData) {
    // Check if profile has an infoFile property (user-created profiles)
    if (profileData && profileData.infoFile) {
        return profileData.infoFile;
    }
    
    // Try to find matching file by checking if name contains key parts
    const nameMap = {
        "Jearn van goth": "Jearn van goth.txt",
        "Stickerson": "Sticking.txt"
    };
    
    // Direct match
    if (nameMap[profileName]) {
        return nameMap[profileName];
    }
    
    // Try partial match (case insensitive)
    const lowerName = profileName.toLowerCase();
    for (const [key, value] of Object.entries(nameMap)) {
        if (lowerName.includes(key.toLowerCase().split(' ')[0]) || 
            key.toLowerCase().includes(lowerName.split(' ')[0])) {
            return value;
        }
    }
    
    return null;
}

// Parse info text file content
function parseInfoText(text) {
    const info = {};
    const lines = text.split('\n');
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            info[key] = value;
        }
    });
    return info;
}

// Load profile info from text file
async function loadProfileInfo(profileName, profileData) {
    // First, check if profile has info stored directly as an object
    if (profileData && profileData.info && typeof profileData.info === 'object') {
        console.log('Using profile info from object:', profileData.info);
        return profileData.info;
    }
    
    // If profile has an infoFile property, try to load from that file
    if (profileData && profileData.infoFile) {
        try {
            const response = await fetch(profileData.infoFile);
            if (response.ok) {
                const text = await response.text();
                const parsed = parseInfoText(text);
                console.log('Parsed info from file:', parsed);
                return parsed;
            }
        } catch (error) {
            console.warn(`Could not load info from user-specified file: ${profileData.infoFile}`, error);
        }
    }
    
    // Otherwise, try to find matching file by name
    const fileName = getInfoFileName(profileName, profileData);
    if (!fileName) {
        console.log('No file name found for:', profileName);
        return null;
    }

    try {
        // Try different path formats
        const paths = [
            `User info/${fileName}`,
            `./User info/${fileName}`,
            `../User info/${fileName}`
        ];
        
        for (const filePath of paths) {
            try {
                console.log('Trying to load from:', filePath);
                const response = await fetch(filePath);
                if (response.ok) {
                    const text = await response.text();
                    console.log('File content loaded:', text);
                    const parsed = parseInfoText(text);
                    console.log('Parsed info:', parsed);
                    return parsed;
                }
            } catch (err) {
                console.log('Failed to load from:', filePath, err);
                continue;
            }
        }
        
        console.error('Failed to load file from any path');
        return null;
    } catch (error) {
        console.error('Error loading profile info:', error);
        console.error('Profile name:', profileName);
        console.error('File name:', fileName);
        return null;
    }
}

// Format and display profile information
function displayProfileInfo(info) {
    if (!info || Object.keys(info).length === 0) {
        // Try to show a helpful message
        const profileName = profileDetailName.textContent;
        profilePersonalInfo.innerHTML = `
            <p style="color: #666; font-style: italic;">No information available yet.</p>
            <p style="color: #888; font-size: 0.9em; margin-top: 10px;">Note: If using file:// protocol, please use a local server (e.g., python -m http.server)</p>
        `;
        return;
    }

    let html = '<div class="info-grid">';
    
    if (info.Name) {
        html += `<div class="info-item"><strong>Name:</strong> ${info.Name}</div>`;
    }
    if (info.Surname) {
        html += `<div class="info-item"><strong>Surname:</strong> ${info.Surname}</div>`;
    }
    if (info.age) {
        html += `<div class="info-item"><strong>Age:</strong> ${info.age}</div>`;
    }
    if (info['Card number']) {
        html += `<div class="info-item"><strong>Card Number:</strong> ${info['Card number']}</div>`;
    }
    if (info.Location) {
        html += `<div class="info-item"><strong>Location:</strong> ${info.Location}</div>`;
    }
    if (info['Additional info']) {
        html += `<div class="info-item"><strong>Additional Info:</strong> ${info['Additional info']}</div>`;
    }
    
    html += '</div>';
    profilePersonalInfo.innerHTML = html;
}

// Load profile data from sessionStorage
async function loadProfileDetail() {
    const stored = sessionStorage.getItem('viewingProfile');
    if (!stored) {
        // No profile data, redirect back
        window.location.href = 'graveyard.html';
        return;
    }

    const data = JSON.parse(stored);
    currentProfileData = data;

    const profile = data.profile;
    
    // Display profile image and name
    profileDetailImage.src = profile.image;
    profileDetailName.textContent = profile.name;

    // Load and display profile information from text file
    const info = await loadProfileInfo(profile.name, profile);
    displayProfileInfo(info);
    
    // Set status and button text based on source
    if (data.source === 'graveyard') {
        profileStatus.textContent = "💀 In Your Graveyard (You dug them!)";
        profileStatus.style.color = "#ff00ff";
        removeBtn.innerHTML = '<span class="btn-icon">💀</span><span class="btn-text">Move to Previous Souls</span>';
        moveBtn.style.display = 'none';
        // Show message button for graveyard profiles
        messageActions.style.display = 'flex';
    } else {
        profileStatus.textContent = "👻 In Previous Souls (Taken by the light)";
        profileStatus.style.color = "#aaa";
        removeBtn.style.display = 'none';
        moveBtn.innerHTML = '<span class="btn-icon">⛏️</span><span class="btn-text">Dig Them</span>';
        // Hide message button for previous souls
        messageActions.style.display = 'none';
    }
}

// Remove profile (moves from graveyard to previous souls)
removeBtn.addEventListener('click', () => {
    if (!currentProfileData) return;

    const { source, index, profile } = currentProfileData;
    
    // Only works for graveyard - moves to previous souls
    if (source === 'graveyard') {
        let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
        let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
        
        // Check if already in previous souls
        const existsInPreviousSouls = previousSouls.some(p => p.name === profile.name);
        
        if (!existsInPreviousSouls) {
            graveyard.splice(index, 1);
            previousSouls.push(profile);
            
            localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
            localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
        }
    }

    // Redirect back to graveyard
    window.location.href = 'graveyard.html';
});

// Dig profile (moves from previous souls to graveyard)
moveBtn.addEventListener('click', () => {
    if (!currentProfileData) return;

    const { source, index, profile } = currentProfileData;
    
    // Only works for previous souls - moves to graveyard (digs them)
    if (source === 'previousSouls') {
        let graveyard = JSON.parse(localStorage.getItem(getStorageKey('graveyard')) || '[]');
        let previousSouls = JSON.parse(localStorage.getItem(getStorageKey('previousSouls')) || '[]');
        
        // Check if already in graveyard
        const existsInGraveyard = graveyard.some(p => p.name === profile.name);
        
        if (!existsInGraveyard) {
            previousSouls.splice(index, 1);
            graveyard.push(profile);
            
            localStorage.setItem(getStorageKey('graveyard'), JSON.stringify(graveyard));
            localStorage.setItem(getStorageKey('previousSouls'), JSON.stringify(previousSouls));
        }
    }

    // Redirect back to graveyard
    window.location.href = 'graveyard.html';
});

// Message button handler
messageBtn.addEventListener('click', () => {
    if (!currentProfileData) return;
    
    const profile = currentProfileData.profile;
    // Show blocked message
    alert(`💀 This user have blocked you 😆 `)
    // Navigate to message/construction page
    window.location.href = 'message.html'
    ;
});

// Load profile on page load
loadProfileDetail();
