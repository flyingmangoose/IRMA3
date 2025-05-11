# IRMA - Integrated Resource Management Application

IRMA is a comprehensive resource management application designed to help organizations manage projects, track time, create invoices, and generate reports.

## Features

- 👥 **User Management**: Create and manage users with different roles and permissions
- 🏢 **Client Management**: Track clients and their contact information
- 📊 **Project Management**: Manage projects, budgets, and deadlines
- ⏱️ **Time Tracking**: Log and approve timesheets for projects
- 💰 **Invoice Generation**: Create and manage invoices based on timesheets
- 📈 **Reporting**: Generate detailed reports on resource allocation and project status
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

### Frontend
- Vue.js 2
- Vuetify
- Vue Router
- Vuex

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/irma.git
   cd irma
   ```

2. Setup backend
   ```
   cd backend
   npm install
   cp .env.example .env
   # Edit .env file with your MongoDB connection string and other settings
   ```

3. Setup frontend
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start MongoDB (if running locally)
   ```
   mongod
   ```

2. Start the backend server (in the backend directory)
   ```
   npm run dev
   ```

3. Start the frontend development server (in the frontend directory)
   ```
   npm run serve
   ```

4. Open your browser and navigate to `http://localhost:8080`

## Deployment

For deployment instructions, see [IRMA_Deployment_Guide.md](./documentation/IRMA_Deployment_Guide.md) in the documentation directory.

## Project Structure

```
irma/
├── backend/             # Express server, API routes, and MongoDB models
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   └── server.js        # Server entry point
├── frontend/            # Vue.js client application
│   ├── public/          # Static files
│   └── src/             # Vue source files
│       ├── components/  # Vue components
│       ├── views/       # Vue views/pages
│       ├── App.vue      # Main app component
│       ├── main.js      # Application entry point
│       └── router.js    # Vue router configuration
└── documentation/       # Project documentation
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with ❤️ by IRMA Development Team 