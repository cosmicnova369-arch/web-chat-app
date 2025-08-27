const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images, videos, and audio files
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|avi|mp3|wav|ogg|m4a/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, videos, and audio files are allowed!'));
        }
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('chat.db');

// Create tables
db.serialize(() => {
    // Rooms table
    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Messages table
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT,
        username TEXT,
        message TEXT,
        message_type TEXT DEFAULT 'text',
        file_url TEXT,
        file_name TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES rooms (id)
    )`);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());

// Store connected users by room
const roomUsers = {};

// API Routes
app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/room/:roomId/messages', (req, res) => {
    const roomId = req.params.roomId;
    
    db.all(
        `SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC LIMIT 100`,
        [roomId],
        (err, rows) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch messages' });
                return;
            }
            res.json(rows);
        }
    );
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype
    });
});

// Socket.IO handling
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);
    
    socket.on('join room', (data) => {
        const { roomId, username } = data;
        socket.join(roomId);
        
        // Initialize room users if not exists
        if (!roomUsers[roomId]) {
            roomUsers[roomId] = {};
        }
        
        roomUsers[roomId][socket.id] = username;
        socket.currentRoom = roomId;
        socket.currentUsername = username;
        
        // Create room in database if it doesn't exist
        db.run(
            `INSERT OR IGNORE INTO rooms (id, name) VALUES (?, ?)`,
            [roomId, `Room ${roomId.substring(0, 8)}`]
        );
        
        // Broadcast user joined to room
        socket.to(roomId).emit('user joined', {
            username: username,
            message: `${username} joined the chat`
        });
        
        // Send current users list to room
        io.to(roomId).emit('users list', Object.values(roomUsers[roomId] || {}));
        
        // Load message history
        db.all(
            `SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC LIMIT 50`,
            [roomId],
            (err, rows) => {
                if (!err && rows.length > 0) {
                    socket.emit('message history', rows);
                }
            }
        );
    });
    
    socket.on('chat message', (data) => {
        if (!socket.currentRoom || !socket.currentUsername) return;
        
        const message = {
            id: Date.now(),
            username: socket.currentUsername,
            message: data.message,
            message_type: data.type || 'text',
            file_url: data.fileUrl || null,
            file_name: data.fileName || null,
            timestamp: new Date().toISOString()
        };
        
        // Save to database
        db.run(
            `INSERT INTO messages (room_id, username, message, message_type, file_url, file_name) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [socket.currentRoom, message.username, message.message, message.message_type, message.file_url, message.file_name]
        );
        
        // Broadcast to room
        io.to(socket.currentRoom).emit('chat message', message);
    });
    
    socket.on('typing', (data) => {
        if (!socket.currentRoom || !socket.currentUsername) return;
        
        socket.to(socket.currentRoom).emit('typing', {
            username: socket.currentUsername,
            isTyping: data.isTyping
        });
    });
    
    socket.on('delete message', (data) => {
        if (!socket.currentRoom || !socket.currentUsername) return;
        
        const { messageId } = data;
        
        // Verify message ownership before deletion
        db.get(
            `SELECT username FROM messages WHERE id = ? AND room_id = ?`,
            [messageId, socket.currentRoom],
            (err, row) => {
                if (err) {
                    console.error('Error checking message ownership:', err);
                    return;
                }
                
                // Only allow deletion if user owns the message
                if (row && row.username === socket.currentUsername) {
                    // Delete from database
                    db.run(
                        `DELETE FROM messages WHERE id = ? AND room_id = ?`,
                        [messageId, socket.currentRoom],
                        (err) => {
                            if (!err) {
                                // Broadcast deletion to all users in room
                                io.to(socket.currentRoom).emit('message deleted', {
                                    messageId: messageId,
                                    deletedBy: socket.currentUsername
                                });
                            }
                        }
                    );
                }
            }
        );
    });
    
    socket.on('disconnect', () => {
        if (socket.currentRoom && socket.currentUsername && roomUsers[socket.currentRoom]) {
            // Remove user from room
            delete roomUsers[socket.currentRoom][socket.id];
            
            // Broadcast user left to room
            socket.to(socket.currentRoom).emit('user left', {
                username: socket.currentUsername,
                message: `${socket.currentUsername} left the chat`
            });
            
            // Send updated users list to room
            io.to(socket.currentRoom).emit('users list', Object.values(roomUsers[socket.currentRoom] || {}));
        }
        console.log('User disconnected:', socket.id);
    });
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    db.close((err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
    console.log(`Create a private room by visiting: http://localhost:${PORT}/room/YOUR_ROOM_ID`);
    console.log('Press Ctrl+C to stop the server');
});
