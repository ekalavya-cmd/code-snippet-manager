# Code Snippet Manager

The Code Snippet Manager is a full-stack web application designed to help developers store, manage, and share code snippets efficiently. Built with AngularJS on the client side and Express.js with MongoDB on the server side, this project provides a user-friendly interface to create, edit, search, and organize code snippets by language, category, and tags. It includes features such as user authentication, snippet verification, personal collections, and admin controls.

## Features

- **User Authentication**: Register and log in with a unique username and @csm.com email, with admin privileges for designated users.
- **Snippet Management**: Add, edit, and delete snippets with support for multiple programming languages (JavaScript, Python, Java, HTML, CSS, Ruby, PHP, SQL).
- **Search Functionality**: Filter snippets by title, code, tags, language, and category.
- **Personal Collections**: Save snippets to a personal collection for easy access.
- **Verification System**: Admins can verify or report snippets as invalid, ensuring quality control.
- **Code Highlighting**: Syntax highlighting powered by Prism.js for better code readability.
- **Responsive Design**: Optimized for both desktop and mobile devices with a modern, gradient-based UI.

## Tech Stack

- **Frontend**: AngularJS, HTML, CSS
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcrypt
- **Other**: CORS, dotenv

## Installation

1. Clone the repository: `git clone https://github.com/ekalavya-cmd/code-snippet-manager.git`
2. Navigate to the project directory: `cd code-snippet-manager`

### Prerequisites

- Node.js and npm installed
- MongoDB running locally (or update `MONGO_URI` in `.env` for a remote database)
- Serve package installed globally: `npm install -g serve`

### Setup

3. Create a `.env` file in the `server` directory with the following variables (see `.env.example` for a template):
   - `PORT=3000`
   - `MONGO_URI=mongodb://localhost:27017/snippetDB`
   - `ADMIN_EMAIL=admin@csm.com`
   - `JWT_SECRET=your-secure-jwt-secret`
4. Install server dependencies: `cd server && npm install`
5. Install client dependencies (if any additional packages are needed in `client`): `cd client && npm install`

## Running the Application

To run the application, open two terminal windows and execute the following commands:

### Terminal 1: Start the Server

- Navigate to the server directory: `cd server`
- Start the Node.js server: `node index.js`
- The server will run on `http://localhost:3000`, and you should see a confirmation message in the terminal.

### Terminal 2: Start the Client

- Navigate to the client directory: `cd client`
- Serve the client files: `serve`
- The client will be available at a dynamically assigned port, which will be displayed in the terminal output (e.g., `http://localhost:<port>`). Open the provided URL in your web browser to access the application.

## Usage

-   **Getting Started:** Register with a valid @csm.com email to create an account; log in to unlock features, with admin privileges for the designated email.
-   **Managing Snippets:** Create snippets with title, code, language, tags, and category; edit or delete your own, with admins managing all snippets.
-   **Searching and Filtering:** Search by keywords in titles, code, or tags; refine with language and category dropdowns for quick results.
-   **Personal Collections:** Add snippets to your collection with one click; remove them and manage your curated set in the collection view.
-   **Verification Process:** Admins verify snippets for trust or report as invalid; ensures high-quality, reliable code examples.
-   **Code Reuse:** Copy snippet code to clipboard instantly; perfect for seamless integration into your projects.
-   **Cross-Device Experience:** Access the app on desktops or smartphones; enjoy a consistent, responsive interface anywhere.
-   **Navigation and Efficiency:** Switch between all snippets and your collection; use "Enter" to navigate forms or submit for a smooth workflow.

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any enhancements or bug fixes.

## License

This project is licensed under the ISC License.
