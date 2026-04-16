# MERN Dashboard API - Testing Guide

## 🚀 Quick Setup

### 1. Create Admin User First
```bash
npm run create-admin
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Server will run on: `http://localhost:5000`

---

## 📋 All API Endpoints

### 🔐 Authentication Endpoints

#### Register User (Driver Only)
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/register`
- **Body** (JSON):
```json
{
  "name": "John Driver",
  "email": "driver@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "licenseNumber": "DL123456789"
}
```

#### Login User
- **Method**: POST
- **URL**: `http://localhost:5000/api/auth/login`
- **Body** (JSON):
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### Get Current User Profile
- **Method**: GET
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**: `Authorization: Bearer YOUR_TOKEN_HERE`

#### Update Profile
- **Method**: PUT
- **URL**: `http://localhost:5000/api/auth/me`
- **Headers**: `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (JSON):
```json
{
  "name": "Updated Name",
  "phone": "+9876543210",
  "address": "456 Updated St, New City",
  "licenseNumber": "DL987654321"
}
```

#### Change Password
- **Method**: PUT
- **URL**: `http://localhost:5000/api/auth/change-password`
- **Headers**: `Authorization: Bearer YOUR_TOKEN_HERE`
- **Body** (JSON):
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

### 👥 Users Management

#### Get All Users (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/users?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get All Drivers (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/users/drivers?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get User by ID
- **Method**: GET
- **URL**: `http://localhost:5000/api/users/USER_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Update User
- **Method**: PUT
- **URL**: `http://localhost:5000/api/users/USER_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`
- **Body** (JSON):
```json
{
  "name": "Updated User Name",
  "phone": "+1111111111",
  "address": "Updated Address",
  "licenseNumber": "DL111111111"
}
```

#### Activate User (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/users/USER_ID_HERE/activate`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Deactivate User (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/users/USER_ID_HERE/deactivate`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Delete User (Admin Only)
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/users/USER_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

### 🚗 Vehicles Management

#### Get All Vehicles (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/vehicles?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Create Vehicle (Admin Only)
- **Method**: POST
- **URL**: `http://localhost:5000/api/vehicles`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "make": "Toyota",
  "model": "Camry",
  "year": 2023,
  "licensePlate": "ABC123",
  "vin": "1HGBH41JXMN109186",
  "color": "Silver",
  "status": "active",
  "mileage": 15000,
  "lastServiceDate": "2024-01-15T00:00:00.000Z",
  "nextServiceDate": "2024-07-15T00:00:00.000Z",
  "insuranceExpiry": "2024-12-31T00:00:00.000Z",
  "registrationExpiry": "2024-12-31T00:00:00.000Z"
}
```

#### Get Vehicle by ID
- **Method**: GET
- **URL**: `http://localhost:5000/api/vehicles/VEHICLE_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Update Vehicle (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/vehicles/VEHICLE_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "make": "Toyota",
  "model": "Camry LE",
  "year": 2023,
  "color": "Black",
  "mileage": 16000,
  "status": "active"
}
```

#### Assign Vehicle to Driver (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/vehicles/VEHICLE_ID_HERE/assign`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "driverId": "DRIVER_ID_HERE"
}
```

#### Unassign Vehicle (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/vehicles/VEHICLE_ID_HERE/unassign`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Vehicles by Status (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/vehicles/status/active?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Driver's Vehicles
- **Method**: GET
- **URL**: `http://localhost:5000/api/vehicles/driver/DRIVER_ID_HERE?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Delete Vehicle (Admin Only)
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/vehicles/VEHICLE_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

### 🚛 Trips Management

#### Get All Trips
- **Method**: GET
- **URL**: `http://localhost:5000/api/trips?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Create Trip (Admin Only)
- **Method**: POST
- **URL**: `http://localhost:5000/api/trips`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "assignedDriver": "DRIVER_ID_HERE",
  "assignedVehicle": "VEHICLE_ID_HERE",
  "startLocation": {
    "address": "123 Start St, Start City",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "endLocation": {
    "address": "456 End St, End City",
    "coordinates": {
      "latitude": 40.7589,
      "longitude": -73.9851
    }
  },
  "scheduledStartTime": "2024-02-01T08:00:00.000Z",
  "scheduledEndTime": "2024-02-01T12:00:00.000Z",
  "distance": 25.5,
  "estimatedDuration": 240,
  "priority": "medium",
  "cargo": "Office supplies",
  "customer": {
    "name": "ABC Company",
    "phone": "+1234567890",
    "email": "contact@abc.com"
  },
  "notes": "Handle with care"
}
```

#### Get Trip by ID
- **Method**: GET
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Update Trip (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "priority": "high",
  "notes": "Updated notes - urgent delivery",
  "distance": 30.0,
  "estimatedDuration": 300
}
```

#### Start Trip (Assigned Driver Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE/start`
- **Headers**: `Authorization: Bearer YOUR_DRIVER_TOKEN`

#### Complete Trip (Assigned Driver Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE/complete`
- **Headers**: `Authorization: Bearer YOUR_DRIVER_TOKEN`
- **Body** (JSON):
```json
{
  "notes": "Trip completed successfully. Customer was satisfied."
}
```

#### Cancel Trip (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE/cancel`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "reason": "Customer cancelled the order"
}
```

#### Get Trips by Status (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/trips/status/scheduled?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Driver's Trips
- **Method**: GET
- **URL**: `http://localhost:5000/api/trips/driver/DRIVER_ID_HERE?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Delete Trip (Admin Only)
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/trips/TRIP_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

### 🚨 Incidents Management

#### Get All Incidents
- **Method**: GET
- **URL**: `http://localhost:5000/api/incidents?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Create Incident
- **Method**: POST
- **URL**: `http://localhost:5000/api/incidents`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`
- **Body** (JSON):
```json
{
  "driver": "DRIVER_ID_HERE",
  "vehicle": "VEHICLE_ID_HERE",
  "trip": "TRIP_ID_HERE",
  "incidentType": "accident",
  "severity": "medium",
  "location": {
    "address": "789 Incident St, Incident City",
    "coordinates": {
      "latitude": 40.7505,
      "longitude": -73.9934
    }
  },
  "description": "Minor collision with another vehicle at intersection. No injuries reported.",
  "witnessDetails": [
    {
      "name": "Jane Witness",
      "phone": "+1987654321",
      "statement": "Saw the accident happen. Driver was not at fault."
    }
  ],
  "damageDetails": {
    "vehicleDamage": "Minor scratches on front bumper",
    "cargoDamage": "None",
    "estimatedCost": 500
  },
  "policeReport": {
    "reportNumber": "PR123456",
    "officerName": "Officer Smith",
    "station": "Central Police Station"
  }
}
```

#### Get Incident by ID
- **Method**: GET
- **URL**: `http://localhost:5000/api/incidents/INCIDENT_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Update Incident (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/incidents/INCIDENT_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "severity": "high",
  "description": "Updated description - more serious than initially reported",
  "damageDetails": {
    "vehicleDamage": "Significant damage to front end",
    "cargoDamage": "Some cargo damaged",
    "estimatedCost": 2500
  }
}
```

#### Resolve Incident (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/incidents/INCIDENT_ID_HERE/resolve`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body** (JSON):
```json
{
  "resolution": "Incident resolved. Insurance claim filed. Driver cleared of fault. Vehicle repaired."
}
```

#### Close Incident (Admin Only)
- **Method**: PUT
- **URL**: `http://localhost:5000/api/incidents/INCIDENT_ID_HERE/close`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Incidents by Status (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/incidents/status/reported?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Incidents by Severity (Admin Only)
- **Method**: GET
- **URL**: `http://localhost:5000/api/incidents/severity/high?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Get Driver's Incidents
- **Method**: GET
- **URL**: `http://localhost:5000/api/incidents/driver/DRIVER_ID_HERE?page=1&limit=10`
- **Headers**: `Authorization: Bearer YOUR_TOKEN`

#### Delete Incident (Admin Only)
- **Method**: DELETE
- **URL**: `http://localhost:5000/api/incidents/INCIDENT_ID_HERE`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

### 📊 Reports & Analytics (Admin Only)

#### Dashboard Statistics
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/dashboard`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Incidents per Driver Report
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/incidents-per-driver`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Trips per Vehicle/Driver Report
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/trips-per-vehicle-driver?groupBy=driver`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Vehicle Status Report
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/vehicle-status`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Driver Performance Report
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/driver-performance`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

#### Monthly Trends Report
- **Method**: GET
- **URL**: `http://localhost:5000/api/reports/monthly-trends?year=2024`
- **Headers**: `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

### 🔧 Utility Endpoints

#### Health Check
- **Method**: GET
- **URL**: `http://localhost:5000/api/health`

#### API Info
- **Method**: GET
- **URL**: `http://localhost:5000/api/`

---

## 🧪 Testing Workflow

### Step 1: Create Admin
```bash
npm run create-admin
```

### Step 2: Login and Get Token
1. Use the login endpoint
2. Copy the token from response
3. Use it in Authorization header: `Bearer YOUR_TOKEN`

### Step 3: Test Endpoints
1. Start with authentication endpoints
2. Create a driver via registration
3. Create vehicles, trips, incidents
4. Test role-based access

### Step 4: Test Role Permissions
- **Admin**: Can access all endpoints
- **Driver**: Can only access their own resources

---

## 📝 Notes

- Replace `YOUR_TOKEN_HERE` with actual JWT token
- Replace `USER_ID_HERE`, `VEHICLE_ID_HERE`, etc. with actual IDs
- All timestamps should be in ISO 8601 format
- Pagination: `?page=1&limit=10`
- All admin-only endpoints require admin token
- Drivers can only access their own resources
