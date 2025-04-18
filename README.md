Code Snippet Manager
The Code Snippet Manager is a full-stack web application designed to help developers store, manage, and share code snippets efficiently. Built with AngularJS on the client side and Express.js with MongoDB on the server side, this project provides a user-friendly interface to create, edit, search, and organize code snippets by language, category, and tags. It includes features such as user authentication, snippet verification, personal collections, and admin controls.
Features

User Authentication: Register and log in with a unique username and @csm.com email, with admin privileges for designated users.
Snippet Management: Add, edit, and delete snippets with support for multiple programming languages (JavaScript, Python, Java, HTML, CSS, Ruby, PHP, SQL).
Search Functionality: Filter snippets by title, code, tags, language, and category.
Personal Collections: Save snippets to a personal collection for easy access.
Verification System: Admins can verify or report snippets as invalid, ensuring quality control.
Code Highlighting: Syntax highlighting powered by Prism.js for better code readability.
Responsive Design: Optimized for both desktop and mobile devices with a modern, gradient-based UI.

Tech Stack

Frontend: AngularJS, HTML, CSS
Backend: Express.js, Node.js
Database: MongoDB with Mongoose
Authentication: JWT, bcrypt
Other: CORS, dotenv

Installation

Clone the repository: git clone <repository-url>
Navigate to the project directory: cd code-snippet-manager
Install server dependencies: npm install in the server directory
Set up environment variables in a .env file (see .env.example for template)
Start the server: npm start
Open index.html in a web browser to access the client side.

Usage

Register with a valid @csm.com email to get started.
Log in to manage your snippets or view the public collection.
Admins (registered with the admin email) can verify snippets and perform additional administrative tasks.

Contributing
Contributions are welcome! Please fork the repository and submit pull requests for any enhancements or bug fixes.
License
This project is licensed under the ISC License.

 
