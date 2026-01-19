// Get current user
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

// Get all users
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users') || '{}');
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

// Check if user is logged in
const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'login.html';
}
// Admins can also create profiles, so no redirect needed

const createProfileForm = document.getElementById('createProfileForm');
const profileImageInput = document.getElementById('profileImage');

// Function to convert image file to base64 data URL
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

createProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileName = document.getElementById('profileName').value.trim();
    const imageFile = profileImageInput.files[0];
    const profileNameField = document.getElementById('profileNameField').value.trim();
    const profileSurname = document.getElementById('profileSurname').value.trim();
    const profileAge = document.getElementById('profileAge').value.trim();
    const profileAdditionalInfo = document.getElementById('profileAdditionalInfo').value.trim();
    
    if (!profileName) {
        alert('💀 Please enter a profile name');
        return;
    }
    
    if (!imageFile) {
        alert('💀 Please upload an image');
        return;
    }
    
    // Get current user's profiles
    const userProfiles = getUserProfiles();
    
    // Check if profile name already exists
    if (userProfiles.some(p => p.name === profileName)) {
        alert('💀 A profile with this name already exists');
        return;
    }
    
    // Convert image to base64
    let imageDataUrl;
    try {
        imageDataUrl = await convertImageToBase64(imageFile);
    } catch (error) {
        alert('💀 Error uploading image. Please try again.');
        return;
    }
    
    // Build profile info object
    const profileInfo = {};
    if (profileNameField) profileInfo.Name = profileNameField;
    if (profileSurname) profileInfo.Surname = profileSurname;
    if (profileAge) profileInfo.age = profileAge;
    if (profileAdditionalInfo) profileInfo['Additional info'] = profileAdditionalInfo;
    
    // Create new profile
    const newProfile = {
        name: profileName,
        image: imageDataUrl, // Store as base64 data URL
        info: Object.keys(profileInfo).length > 0 ? profileInfo : null, // Store info as object
        createdAt: new Date().toISOString()
    };
    
    // Add to user's profiles
    userProfiles.push(newProfile);
    saveUserProfiles(userProfiles);
    
    alert(`💀 Profile "${profileName}" has been created!`);
    
    // Reset form
    createProfileForm.reset();
    
    // Optionally redirect to main page
    // window.location.href = 'index.html';
});

