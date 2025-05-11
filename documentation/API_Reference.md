# IRMA API Reference

This document provides an overview of the IRMA REST API endpoints.

## Base URL

All API requests should be made to:
```
http://localhost:5000/api
```

## Authentication

Most API endpoints require authentication. Include a JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

To obtain a token, use the login endpoint.

## Endpoints

### Authentication

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth required**: No
- **Permissions required**: None
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin",
      "permissions": ["permission1", "permission2"]
    }
  }
  ```

### Users

#### Get All Users

- **URL**: `/users`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_users`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    }
  ]
  ```

#### Get User by ID

- **URL**: `/users/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_users` or own profile
- **Success Response**: `200 OK`
  ```json
  {
    "id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin"
  }
  ```

#### Create User

- **URL**: `/users`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: `manage_users`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "secure_password",
    "role": "user"
  }
  ```
- **Success Response**: `201 Created`

### Clients

#### Get All Clients

- **URL**: `/clients`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_clients`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "client_id",
      "name": "ABC Company",
      "contactPerson": "Jane Smith",
      "email": "jane@abccompany.com",
      "phone": "123-456-7890"
    }
  ]
  ```

#### Get Client by ID

- **URL**: `/clients/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_clients`
- **Success Response**: `200 OK`
  ```json
  {
    "id": "client_id",
    "name": "ABC Company",
    "contactPerson": "Jane Smith",
    "email": "jane@abccompany.com",
    "phone": "123-456-7890"
  }
  ```

### Projects

#### Get All Projects

- **URL**: `/projects`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_projects`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "project_id",
      "name": "Website Redesign",
      "client": "client_id",
      "startDate": "2023-01-01",
      "endDate": "2023-03-31",
      "budget": 25000,
      "status": "active"
    }
  ]
  ```

#### Get Project by ID

- **URL**: `/projects/:id`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_projects`
- **Success Response**: `200 OK`
  ```json
  {
    "id": "project_id",
    "name": "Website Redesign",
    "client": {
      "id": "client_id",
      "name": "ABC Company"
    },
    "startDate": "2023-01-01",
    "endDate": "2023-03-31",
    "budget": 25000,
    "status": "active",
    "description": "Complete website redesign for ABC Company",
    "team": [
      {
        "id": "user_id",
        "name": "John Doe",
        "role": "Project Manager"
      }
    ]
  }
  ```

### Timesheets

#### Get Timesheets

- **URL**: `/timesheets`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_timesheets` or own timesheets
- **Query Parameters**:
  - `startDate`: filter by start date (YYYY-MM-DD)
  - `endDate`: filter by end date (YYYY-MM-DD)
  - `userId`: filter by user ID
  - `projectId`: filter by project ID
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "timesheet_id",
      "user": "user_id",
      "project": "project_id",
      "date": "2023-01-15",
      "hours": 8,
      "description": "Frontend development",
      "status": "approved"
    }
  ]
  ```

#### Create Timesheet Entry

- **URL**: `/timesheets`
- **Method**: `POST`
- **Auth required**: Yes
- **Permissions required**: None (users can create their own timesheet entries)
- **Request Body**:
  ```json
  {
    "project": "project_id",
    "date": "2023-01-15",
    "hours": 8,
    "description": "Frontend development"
  }
  ```
- **Success Response**: `201 Created`

### Invoices

#### Get All Invoices

- **URL**: `/invoices`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_invoices`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": "invoice_id",
      "client": "client_id",
      "amount": 5000,
      "issueDate": "2023-02-01",
      "dueDate": "2023-03-01",
      "status": "pending"
    }
  ]
  ```

### Reports

#### Generate Time Utilization Report

- **URL**: `/reports/time-utilization`
- **Method**: `GET`
- **Auth required**: Yes
- **Permissions required**: `view_reports`
- **Query Parameters**:
  - `startDate`: start date (YYYY-MM-DD)
  - `endDate`: end date (YYYY-MM-DD)
  - `projectId`: (optional) filter by project
- **Success Response**: `200 OK`
  ```json
  {
    "projects": [
      {
        "id": "project_id",
        "name": "Website Redesign",
        "totalHours": 120,
        "budgetedHours": 160,
        "utilizationRate": 0.75
      }
    ]
  }
  ```

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request** - Invalid request body or parameters
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Server Error** - Unexpected server error

Example error response:
```json
{
  "error": "Resource not found",
  "message": "The requested project does not exist"
}
```