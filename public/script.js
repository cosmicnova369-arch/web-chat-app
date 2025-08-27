// Initialize Socket.IO connection
const socket = io();

// Get DOM elements
const usernameModal = document.getElementById('usernameModal');
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const chatContainer = document.getElementById('chatContainer');
const currentUser = document.getElementById('currentUser');
const leaveBtn = document.getElementById('leaveBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const usersList = document.getElementById('usersList');
const userCount = document.getElementById('userCount');
const typingIndicator = document.getElementById('typingIndicator');
const charCounter = document.getElementById('charCounter');
const roomInfo = document.getElementById('roomInfo');
const roomLink = document.getElementById('roomLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const imageBtn = document.getElementById('imageBtn');
const videoBtn = document.getElementById('videoBtn');
const voiceBtn = document.getElementById('voiceBtn');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const audioInput = document.getElementById('audioInput');

// Global variables
let username = '';
let currentRoomId = '';
let isTyping = false;
let typingTimer;
let typingUsers = new Set();
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Initialize the application
function init() {
    setupRoom();
    showUsernameModal();
    setupEventListeners();
}

// Setup room from URL
function setupRoom() {
    const pathParts = window.location.pathname.split('/');
    if (pathParts[1] === 'room' && pathParts[2]) {
        currentRoomId = pathParts[2];
    } else {
        // Generate a new room ID
        currentRoomId = generateRoomId();
        // Update URL without page reload
        window.history.pushState({}, '', `/room/${currentRoomId}`);
    }
    
    // Show room info
    const fullLink = `${window.location.origin}/room/${currentRoomId}`;
    roomLink.textContent = fullLink;
    roomInfo.classList.remove('hidden');
}

// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Show username modal
function showUsernameModal() {
    usernameModal.classList.remove('hidden');
    usernameInput.focus();
}

// Hide username modal and show chat
function showChat() {
    usernameModal.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    messageInput.focus();
}

// Setup event listeners
function setupEventListeners() {
    // Username input and join button
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
    
    joinBtn.addEventListener('click', joinChat);
    leaveBtn.addEventListener('click', leaveChat);
    copyLinkBtn.addEventListener('click', copyRoomLink);
    
    // Message input and send button
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
            handleTyping();
        }
    });
    
    messageInput.addEventListener('input', updateCharCounter);
    sendBtn.addEventListener('click', sendMessage);
    
    // File upload buttons
    imageBtn.addEventListener('click', () => imageInput.click());
    videoBtn.addEventListener('click', () => videoInput.click());
    voiceBtn.addEventListener('click', toggleVoiceRecording);
    
    // File input handlers
    imageInput.addEventListener('change', handleFileUpload);
    videoInput.addEventListener('change', handleFileUpload);
    audioInput.addEventListener('change', handleFileUpload);
    
    // Stop typing when user stops typing
    messageInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            if (isTyping) {
                socket.emit('typing', { isTyping: false });
                isTyping = false;
            }
        }, 1000);
    });
}

// Copy room link
function copyRoomLink() {
    const link = roomLink.textContent;
    navigator.clipboard.writeText(link).then(() => {
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = 'Copy';
        }, 2000);
    });
}

// Join chat function
function joinChat() {
    const inputUsername = usernameInput.value.trim();
    
    if (!inputUsername) {
        alert('Please enter a username');
        return;
    }
    
    if (inputUsername.length < 2) {
        alert('Username must be at least 2 characters long');
        return;
    }
    
    username = inputUsername;
    currentUser.textContent = `Welcome, ${username}!`;
    
    // Join the specific room
    socket.emit('join room', { roomId: currentRoomId, username });
    
    showChat();
}

// Leave chat function
function leaveChat() {
    if (confirm('Are you sure you want to leave the chat?')) {
        socket.disconnect();
        location.reload();
    }
}

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Emit message to server
    socket.emit('chat message', { message, type: 'text' });
    
    // Clear input
    messageInput.value = '';
    updateCharCounter();
    
    // Stop typing indicator
    if (isTyping) {
        socket.emit('typing', { isTyping: false });
        isTyping = false;
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Show loading message
    const loadingMsg = { username, message: 'Uploading...', timestamp: new Date().toLocaleTimeString() };
    displayMessage(loadingMsg);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const result = await response.json();
        
        // Determine message type
        let messageType = 'file';
        if (result.fileType.startsWith('image/')) messageType = 'image';
        else if (result.fileType.startsWith('video/')) messageType = 'video';
        else if (result.fileType.startsWith('audio/')) messageType = 'audio';
        
        // Send file message
        socket.emit('chat message', {
            message: result.fileName,
            type: messageType,
            fileUrl: result.fileUrl,
            fileName: result.fileName
        });
        
        // Remove loading message
        messages.removeChild(messages.lastChild);
        
    } catch (error) {
        alert('Failed to upload file: ' + error.message);
        // Remove loading message
        messages.removeChild(messages.lastChild);
    }
    
    // Clear file input
    event.target.value = '';
}

// Toggle voice recording
async function toggleVoiceRecording() {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                const fileName = `voice-${Date.now()}.webm`;
                formData.append('file', audioBlob, fileName);
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    // Send voice message
                    socket.emit('chat message', {
                        message: 'Voice message',
                        type: 'voice',
                        fileUrl: result.fileUrl,
                        fileName: result.fileName
                    });
                } catch (error) {
                    alert('Failed to upload voice message');
                }
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            isRecording = true;
            voiceBtn.textContent = '⏹️ Stop';
            voiceBtn.classList.add('recording');
            
        } catch (error) {
            alert('Could not access microphone: ' + error.message);
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        voiceBtn.textContent = '🎤 Voice';
        voiceBtn.classList.remove('recording');
    }
}

// Handle typing indicator
function handleTyping() {
    if (!isTyping) {
        socket.emit('typing', { isTyping: true });
        isTyping = true;
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (isTyping) {
            socket.emit('typing', { isTyping: false });
            isTyping = false;
        }
    }, 1000);
}

// Update character counter
function updateCharCounter() {
    const length = messageInput.value.length;
    charCounter.textContent = `${length}/500`;
    charCounter.style.color = length > 450 ? '#ff4444' : '#666';
}

// Display message in chat
function displayMessage(data, type = 'message') {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    
    if (type === 'system') {
        messageEl.innerHTML = `
            <div class="message-content system-message">
                <span class="system-text">${data.message}</span>
                <span class="timestamp">${formatTimestamp(data.timestamp || new Date().toISOString())}</span>
            </div>
        `;
    } else {
        const isOwnMessage = data.username === username;
        messageEl.className += isOwnMessage ? ' own-message' : ' other-message';
        
        let mediaContent = '';
        if (data.message_type === 'image' && data.file_url) {
            mediaContent = `<div class="media-message"><img src="${data.file_url}" alt="${data.file_name}" onclick="window.open('${data.file_url}', '_blank')"></div>`;
        } else if (data.message_type === 'video' && data.file_url) {
            mediaContent = `<div class="media-message"><video src="${data.file_url}" controls></video></div>`;
        } else if (data.message_type === 'voice' && data.file_url) {
            mediaContent = `
                <div class="voice-message">
                    <button class="voice-play-btn" onclick="playVoiceMessage('${data.file_url}')">▶️</button>
                    <span class="voice-duration">Voice message</span>
                </div>
            `;
        } else if (data.message_type === 'audio' && data.file_url) {
            mediaContent = `<div class="media-message"><audio src="${data.file_url}" controls></audio></div>`;
        }
        
        const deleteButton = isOwnMessage ? `<button class="delete-btn" onclick="deleteMessage(${data.id || Date.now()})" title="Delete message">🗑️</button>` : '';
        
        messageEl.innerHTML = `
            <div class="message-header">
                <span class="username">${escapeHtml(data.username)}</span>
                <span class="timestamp">${formatTimestamp(data.timestamp)}</span>
                ${deleteButton}
            </div>
            <div class="message-content">
                ${data.message ? escapeHtml(data.message) : ''}
                ${mediaContent}
            </div>
        `;
        
        // Store message ID for deletion
        messageEl.dataset.messageId = data.id || Date.now();
    }
    
    messages.appendChild(messageEl);
    scrollToBottom();
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Play voice message
function playVoiceMessage(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';
    userCount.textContent = users.length;
    
    users.forEach(user => {
        const userEl = document.createElement('li');
        userEl.className = 'user-item';
        userEl.innerHTML = `
            <span class="user-status"></span>
            <span class="user-name">${escapeHtml(user)}</span>
            ${user === username ? '<span class="user-badge">You</span>' : ''}
        `;
        usersList.appendChild(userEl);
    });
}

// Update typing indicator
function updateTypingIndicator() {
    if (typingUsers.size === 0) {
        typingIndicator.textContent = '';
        return;
    }
    
    const users = Array.from(typingUsers);
    let text = '';
    
    if (users.length === 1) {
        text = `${users[0]} is typing...`;
    } else if (users.length === 2) {
        text = `${users[0]} and ${users[1]} are typing...`;
    } else {
        text = `${users.length} people are typing...`;
    }
    
    typingIndicator.textContent = text;
}

// Scroll to bottom of messages
function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load message history
function loadMessageHistory(historyData) {
    historyData.forEach(msg => {
        displayMessage(msg);
    });
}

// Socket event listeners
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('chat message', (data) => {
    displayMessage(data);
});

socket.on('message history', (historyData) => {
    loadMessageHistory(historyData);
});

socket.on('user joined', (data) => {
    displayMessage(data, 'system');
});

socket.on('user left', (data) => {
    displayMessage(data, 'system');
});

socket.on('users list', (users) => {
    updateUsersList(users);
});

socket.on('typing', (data) => {
    if (data.isTyping) {
        typingUsers.add(data.username);
    } else {
        typingUsers.delete(data.username);
    }
    updateTypingIndicator();
});

socket.on('message deleted', (data) => {
    const messageEl = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageEl) {
        messageEl.remove();
    }
});

// Delete message function
function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        socket.emit('delete message', { messageId });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
