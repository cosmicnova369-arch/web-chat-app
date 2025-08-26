# 🚀 Private Web Chat App

A modern, feature-rich real-time web chat application with a sleek dark theme. Built with Node.js, Express, Socket.IO, and SQLite. Perfect for private conversations with persistent message history and rich media sharing.

## ✨ Features

- **🔗 Private Room Links** - Generate shareable room URLs for private conversations
- **💾 Message Persistence** - All messages saved to SQLite database and restored on reconnect
- **📸 Image Sharing** - Upload and share photos instantly
- **🎥 Video Sharing** - Share video files with built-in player
- **🎤 Voice Messages** - Record and send voice notes in real-time
- **📁 File Uploads** - Support for various media formats (50MB limit)
- **🌙 Dark Theme** - Beautiful black/purple dark interface
- **Real-time messaging** - Instant message delivery using WebSockets
- **User presence** - See who's currently online
- **Typing indicators** - Know when someone is typing
- **Responsive design** - Works perfectly on desktop and mobile
- **Message timestamps** - See when messages were sent
- **Character counter** - 500 character limit with visual feedback
- **System notifications** - Join/leave notifications

## 🔋 Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: SQLite3 for message persistence
- **File Uploads**: Multer middleware
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time Communication**: WebSockets via Socket.IO
- **Media Recording**: Web Audio API for voice messages
- **Styling**: Modern dark theme CSS with animations

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14.0.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

### 3. Create Your Private Room

**For a new room:**
- Go to: `http://localhost:3000`
- A unique room will be generated automatically

**To join a specific room:**
- Go to: `http://localhost:3000/room/YOUR_ROOM_ID`
- Example: `http://localhost:3000/room/mychat123`

### 4. Share the Room Link
- Copy the room link shown in the welcome modal
- Share it with your girlfriend so you can chat privately!

## 📁 Project Structure

```
web-chat-app/
├── public/             # Frontend files
│   ├── index.html     # Main HTML file
│   ├── style.css      # Dark theme stylesheet
│   └── script.js      # Enhanced client-side JavaScript
├── uploads/           # Media file storage
├── server.js          # Enhanced Express server
├── chat.db            # SQLite database (created automatically)
├── package.json       # Dependencies and scripts
└── README.md          # This file
```

## 🎯 How to Use

### 💆 Getting Started
1. **Visit your room URL** - Go to your unique room link
2. **Enter username** - Choose your display name
3. **Share the link** - Copy and share with your girlfriend

### 💬 Messaging
- **Text messages** - Type and press Enter
- **Photos** - Click 📷 Photo button to upload images
- **Videos** - Click 🎥 Video button to share videos  
- **Voice notes** - Click 🎤 Voice to record audio messages
- **File uploads** - Support for images, videos, and audio files

### 🔍 Special Features
- **Message History** - All messages are saved and restored when you reconnect
- **Private Rooms** - Each room is completely isolated
- **Real-time Updates** - See typing indicators and instant message delivery
- **Media Playback** - Click images to view full-size, videos have built-in controls

## 🔧 Configuration

### Port Configuration
By default, the server runs on port 3000. To change this, set the `PORT` environment variable:

```bash
# Windows
set PORT=8080 && npm start

# macOS/Linux
PORT=8080 npm start
```

### Development Mode
For development with automatic server restart on file changes:

```bash
npm run dev
```

## 🌐 Deployment

### Local Network Access
To allow access from other devices on your network, the server automatically binds to all network interfaces. Find your local IP address and share:
- `http://YOUR_LOCAL_IP:3000`

### Production Deployment
For production deployment on platforms like Heroku, Vercel, or DigitalOcean:

1. Ensure all dependencies are in `package.json`
2. Set the `PORT` environment variable
3. Use `npm start` as the start command
4. Make sure your firewall allows the chosen port

## 🔐 Security Features

- **XSS Protection**: All user input is properly escaped
- **Input Validation**: Username and message length limits
- **No Authentication**: This is a simple demo app - add authentication for production use

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**
- Check if Node.js is installed: `node --version`
- Ensure port 3000 is not in use by another application
- Run `npm install` to ensure dependencies are installed

**Can't connect from other devices:**
- Check your firewall settings
- Ensure devices are on the same network
- Use your computer's IP address, not localhost

**Messages not appearing:**
- Check browser console for errors (F12 → Console)
- Ensure JavaScript is enabled
- Try refreshing the page

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `public/style.css`:
- Primary color: `#667eea`
- Secondary color: `#764ba2`
- Background colors and other styling

### Adding Features
Some ideas for enhancements:
- Message history persistence
- Private messaging
- File sharing
- Emoji support
- User authentication
- Chat rooms/channels

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📞 Support

If you encounter any issues or have questions, please create an issue in the project repository.

---

**Enjoy chatting! 💬**
