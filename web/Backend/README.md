# MERN Dashboard Backend API

A comprehensive Express.js backend API for a role-based dashboard system supporting Admin and Driver roles with authentication, CRUD operations, and analytics.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Admin and Driver user management with profile updates
- **Vehicle Management**: Complete vehicle CRUD with driver assignment
- **Trip Management**: Trip scheduling, tracking, and completion
- **Incident Reporting**: Comprehensive incident tracking and resolution
- **Analytics & Reports**: Dashboard statistics and performance analytics
- **Data Validation**: Input validation and error handling
- **Pagination**: Efficient data pagination for large datasets

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/mern_dashboard
   PORT=5000

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   JWT_EXPIRE=7d

   # Environment
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
/backend
  /models          # Mongoose schemas
    - User.js
    - Vehicle.js
    - Trip.js
    - Incident.js
  /routes          # Express routes
    - auth.js
    - users.js
    - vehicles.js
    - trips.js
    - incidents.js
    - reports.js
  /controllers     # Business logic
    - authController.js
    - userController.js
    - vehicleController.js
    - tripController.js
    - incidentController.js
    - reportController.js
  /middlewares     # Custom middlewares
    - auth.js
    - validation.js
  /utils           # Utility functions
    - database.js
    - jwt.js
    - errorHandler.js
    - responseHandler.js
  /scripts         # Utility scripts
    - createsuperuser.js
  server.js        # Entry point
  package.json
```

## 🔐 Authentication

### User Roles
- **Admin**: Full access to all resources and management functions
- **Driver**: Limited access to their own resources and assigned trips/vehicles

### Admin Creation
**Important**: Admin users can only be created through the secure script, not via the registration API.

```bash
# Create an admin user
npm run create-admin
```

This ensures that admin accounts are created through controlled, secure processes rather than public registration endpoints.

### JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `PUT /change-password` - Change password

### Users (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (Admin only)
- `GET /drivers` - Get all drivers (Admin only)
- `PUT /:id/activate` - Activate user (Admin only)
- `PUT /:id/deactivate` - Deactivate user (Admin only)

### Vehicles (`/api/vehicles`)
- `GET /` - Get all vehicles (Admin only)
- `GET /:id` - Get vehicle by ID
- `POST /` - Create vehicle (Admin only)
- `PUT /:id` - Update vehicle (Admin only)
- `DELETE /:id` - Delete vehicle (Admin only)
- `PUT /:id/assign` - Assign vehicle to driver (Admin only)
- `PUT /:id/unassign` - Unassign vehicle (Admin only)
- `GET /status/:status` - Get vehicles by status (Admin only)
- `GET /driver/:driverId` - Get driver's vehicles

### Trips (`/api/trips`)
- `GET /` - Get trips (Admin: all, Driver: own)
- `GET /:id` - Get trip by ID
- `POST /` - Create trip (Admin only)
- `PUT /:id` - Update trip (Admin only)
- `DELETE /:id` - Delete trip (Admin only)
- `PUT /:id/start` - Start trip (Assigned driver only)
- `PUT /:id/complete` - Complete trip (Assigned driver only)
- `PUT /:id/cancel` - Cancel trip (Admin only)
- `GET /status/:status` - Get trips by status (Admin only)
- `GET /driver/:driverId` - Get driver's trips

### Incidents (`/api/incidents`)
- `GET /` - Get incidents (Admin: all, Driver: own)
- `GET /:id` - Get incident by ID
- `POST /` - Create incident
- `PUT /:id` - Update incident (Admin only)
- `DELETE /:id` - Delete incident (Admin only)
- `PUT /:id/resolve` - Resolve incident (Admin only)
- `PUT /:id/close` - Close incident (Admin only)
- `GET /status/:status` - Get incidents by status (Admin only)
- `GET /severity/:severity` - Get incidents by severity (Admin only)
- `GET /driver/:driverId` - Get driver's incidents

### Reports (`/api/reports`) - Admin Only
- `GET /dashboard` - Dashboard statistics
- `GET /incidents-per-driver` - Incidents per driver report
- `GET /trips-per-vehicle-driver` - Trips per vehicle/driver report
- `GET /vehicle-status` - Vehicle status report
- `GET /driver-performance` - Driver performance report
- `GET /monthly-trends` - Monthly trends report

## 📊 Data Models

### User
- name, email, password, role (admin/driver)
- phone, address, licenseNumber
- isActive, profileImage

### Vehicle
- make, model, year, licensePlate, vin
- color, assignedDriver, status
- mileage, service dates, insurance/registration expiry

### Trip
- tripNumber, assignedDriver, assignedVehicle
- startLocation, endLocation (with coordinates)
- scheduled/actual start/end times
- status, distance, duration, priority, cargo, customer

### Incident
- incidentNumber, reportedBy, driver, vehicle, trip
- incidentType, severity, status, location
- description, witnessDetails, damageDetails
- policeReport, insurance, resolution

## 🔍 Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

### Filtering
- `status` - Filter by status
- `role` - Filter by user role
- `severity` - Filter by incident severity
- `startDate` / `endDate` - Date range filtering

## 🚨 Error Handling

The API returns standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🧪 Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- curl commands

### Sample Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password123"}'
```

## 🔧 Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRE` - JWT expiration time
- `NODE_ENV` - Environment (development/production)

## 📝 Notes

- All timestamps are in ISO 8601 format
- Passwords are automatically hashed using bcrypt
- JWT tokens expire after 7 days by default
- All routes except auth endpoints require authentication
- Admin routes require admin role
- Drivers can only access their own resources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
