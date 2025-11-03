# Code Snippet Manager

The Code Snippet Manager is a full-stack web application designed to help developers store, manage, and share code snippets efficiently. Built with AngularJS on the client side and Express.js with MongoDB on the server side, this project provides a user-friendly interface to create, edit, search, and organize code snippets by language, category, and tags. It includes features such as user authentication, snippet verification, personal collections, and admin controls.

## Features

- **User Authentication**: Register and log in with a unique username and @csm.com email, with admin privileges for designated users.
- **Snippet Management**: Add, edit, and delete snippets with support for multiple programming languages (JavaScript, Python, Java, HTML, CSS, Ruby, PHP, SQL).
- **Search Functionality**: Filter snippets by title, code, tags, language, and category.
- **Personal Collections**: Save snippets to a personal collection for easy access.
- **Verification System**: Admins can verify or report snippets as invalid, ensuring quality control.
- **Code Highlighting**: Syntax highlighting powered by Prism.js for better code readability.
- **Responsive Design**: Optimized for both desktop and mobile devices with a modern Bootstrap-based UI.
- **Comprehensive Logging**: Built-in logging system for development and debugging purposes.

## Tech Stack

- **Frontend**: AngularJS, HTML, CSS, Bootstrap 5
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **Styling**: Bootstrap 5, Bootstrap Icons, Custom CSS
- **Syntax Highlighting**: Prism.js
- **Other**: CORS, dotenv

## Project Structure

```
code-snippet-manager/
├── client/                          # Frontend files
│   ├── index.html                  # Main HTML file
│   ├── app.html                    # Main application template
│   ├── login.html                  # Login page template
│   ├── register.html               # Registration page template
│   ├── app.js                      # AngularJS application logic
│   ├── bootstrap-styles.css        # Custom Bootstrap styles
│   └── styles-backup.css           # Original custom styles (backup)
├── server/                         # Backend files
│   ├── index.js                    # Main server file
│   ├── package.json                # Server dependencies
│   ├── node_modules/               # Server dependencies (not committed - in .gitignore)
│   ├── .env                       # Environment variables (not committed - in .gitignore)
│   └── models/                    # Database models
│       ├── User.js                # User model
│       ├── Snippet.js             # Snippet model
│       ├── Collection.js          # Collection model
│       └── Report.js              # Report model
├── node_modules/                   # Dependencies (not committed - in .gitignore)
├── package.json                    # Root package file
├── .gitignore                      # Git ignore rules (dependencies, env files, IDE configs, etc.)
├── .claude/                        # Claude Code IDE settings (not committed - in .gitignore)
├── README.md                      # Project documentation
└── .gitattributes                 # Git configuration
```

## Installation

### Prerequisites

- **Node.js and npm**: Download and install from [nodejs.org](https://nodejs.org/)
- **MongoDB**: Install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **Serve package**: Install globally for serving the client files

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/ekalavya-cmd/code-snippet-manager.git
   cd code-snippet-manager
   ```

2. **Install global dependencies**
   ```bash
   npm install -g serve
   ```

3. **Configure environment variables**
   - Navigate to the `server` directory
   - Create a `.env` file with your configuration:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/snippetDB
   ADMIN_EMAIL=admin@csm.com
   JWT_SECRET=your-secure-jwt-secret-here
   ```

   > **⚠️ Security Note**: The `.env` file contains sensitive information and should never be committed to version control. It is already included in `.gitignore` to prevent accidental commits.

4. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

5. **Start MongoDB**
   - If using local MongoDB: Start the MongoDB service
   - If using MongoDB Atlas: Ensure your connection string is correct in `.env`

## Running the Application

To run the application, you need to start both the server and client in separate terminal windows:

### Terminal 1: Start the Backend Server

```bash
cd server
node index.js
```

**Expected output:**
```
Server running on port 3000
Successfully connected to MongoDB
MongoDB connection established
```

### Terminal 2: Start the Frontend Client

```bash
cd client
serve
```

**Expected output:**
```
   ┌─────────────────────────────────────────────────┐
   │                                                 │
   │   Serving!                                      │
   │                                                 │
   │   - Local:            http://localhost:3000     │
   │   - On Your Network:  http://192.168.1.x:3000   │
   │                                                 │
   │   Copied local address to clipboard!            │
   │                                                 │
   └─────────────────────────────────────────────────┘
```

**Note:** If port 3000 is occupied by the server, the client will automatically use the next available port (e.g., 3001, 5000, etc.).

Open the provided URL in your web browser to access the application.

## Usage

### Getting Started
- **Registration**: Create an account with a valid @csm.com email address
- **Admin Access**: The email specified in `ADMIN_EMAIL` environment variable gets admin privileges automatically
- **Login**: Sign in with your email/username and password

### Managing Snippets
- **Create**: Add new snippets with title, code, language, tags, and category
- **Edit**: Modify your own snippets (admins can edit any snippet)
- **Delete**: Only admins can delete snippets
- **Verification**: Admins can mark snippets as verified or invalid

### Search and Filter
- **Text Search**: Search by keywords in titles, code, or tags
- **Language Filter**: Filter by programming language
- **Category Filter**: Filter by snippet category
- **Real-time Results**: Search results update as you type

### Personal Collections
- **Add to Collection**: Save useful snippets to your personal collection
- **Manage Collection**: View and organize your saved snippets
- **Remove from Collection**: Remove snippets you no longer need

### Code Features
- **Syntax Highlighting**: Automatic code highlighting based on language
- **Copy to Clipboard**: One-click code copying functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Admin Features
- **Snippet Verification**: Mark snippets as verified for quality assurance
- **Snippet Management**: Edit and delete any snippet
- **User Management**: Full control over all user-generated content

## Development Features

### Logging System
The application includes a comprehensive logging system for development:

- **Browser Logs**: All application activities are logged in the browser console
- **Local Storage**: Logs are automatically saved to browser's localStorage
- **Export Functionality**: Export logs as text files for analysis
- **Debug Functions**: Access logging functions through browser console:
  ```javascript
  // View all logs in a table format
  viewSnippetLogs()
  
  // Export logs as a downloadable file
  exportSnippetLogs()
  
  // Clear all stored logs
  clearSnippetLogs()
  ```

### Debugging
- **Console Logging**: Detailed logs for all operations
- **Error Handling**: Comprehensive error catching and reporting
- **Network Monitoring**: Track API requests and responses
- **State Management**: Monitor application state changes

## API Endpoints

### Authentication
- `POST /register` - Register a new user
- `POST /login` - Login user and get JWT token

### Snippets
- `GET /snippets` - Get all snippets
- `POST /snippets` - Create a new snippet
- `PUT /snippets/:id` - Update a snippet
- `DELETE /snippets/:id` - Delete a snippet (admin only)
- `GET /snippets/search` - Search snippets with filters

### Verification (Admin only)
- `PUT /snippets/:id/verify` - Mark snippet as verified
- `PUT /snippets/:id/report-invalid` - Mark snippet as invalid

### Collections
- `POST /collection` - Add snippet to personal collection
- `GET /collection` - Get user's collection
- `DELETE /collection/:snippetId` - Remove snippet from collection

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=3000                                    # Server port
MONGO_URI=mongodb://localhost:27017/snippetDB  # MongoDB connection string
ADMIN_EMAIL=admin@csm.com                    # Admin user email
JWT_SECRET=your-secure-jwt-secret-here       # JWT signing secret
```

> **Important**: The `.env` file is listed in `.gitignore` and will not be committed to your repository. This protects your sensitive configuration data.

## Troubleshooting

### Common Issues

1. **Cleaning Up Previously Committed Files**
   If `node_modules/`, `.env`, or `.claude/` were previously committed to git, remove them:
   ```bash
   # Remove from git tracking (but keep locally)
   git rm -r --cached node_modules
   git rm -r --cached server/node_modules
   git rm --cached server/.env
   git rm -r --cached .claude

   # Commit the removal
   git commit -m "Remove ignored files from git tracking"

   # Push the changes
   git push
   ```

   > **Note**: These files/folders will remain on your local system but won't be tracked by git anymore. New clones won't include them, which is correct - users should run `npm install` to get dependencies.

2. **Port Already in Use**
   - Server: Change `PORT` in `.env` file
   - Client: The `serve` command will automatically use the next available port

3. **MongoDB Connection Failed**
   - Ensure MongoDB is running locally
   - Check the `MONGO_URI` in your `.env` file
   - For MongoDB Atlas, verify your connection string and network access

4. **Cannot Register Admin User**
   - Verify `ADMIN_EMAIL` in `.env` matches your registration email exactly
   - Check MongoDB connection and user creation logs

5. **Syntax Highlighting Not Working**
   - Ensure internet connection for CDN resources
   - Check browser console for Prism.js loading errors

### Windows 11 Specific Notes

- Use PowerShell or Command Prompt for running commands
- MongoDB service can be started via Services or MongoDB Compass
- Ensure Node.js and npm are added to your system PATH

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please:

1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Ensure all dependencies are properly installed
4. Verify your MongoDB connection

For additional help, please open an issue in the repository.
