# 🚀 Frontend Integration Guide - MERN Dashboard API

## 📋 Complete API Reference with Request/Response Examples

### 🔧 Base Configuration
- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token in Authorization header

---

## 📋 Data Types & Validation Rules

### **🔤 String Field Constraints**
| Field | Min Length | Max Length | Notes |
|-------|------------|------------|-------|
| `name` | 2 | 50 | Required for users |
| `email` | - | - | Must be valid email format |
| `password` | 6 | - | Required for registration |
| `phone` | - | 15 | Optional |
| `address` | - | 200 | Optional |
| `licenseNumber` | - | 20 | Optional |
| `gender` | - | - | Optional, enum values |
| `profileImage` | - | - | Optional, image file path |
| `make` | 1 | 50 | Required for vehicles |
| `model` | 1 | 50 | Required for vehicles |
| `licensePlate` | 1 | 20 | Required, unique, auto-uppercase |
| `vin` | 17 | 17 | Optional, unique, auto-uppercase |
| `color` | - | 30 | Optional |
| `tripNumber` | - | - | Required, unique, auto-uppercase |
| `incidentNumber` | - | - | Required, unique, auto-uppercase |
| `description` | 10 | 1000 | Required for incidents |
| `notes` | - | 500 | Optional for trips |
| `resolution` | - | 1000 | Optional for incidents |

### **🔢 Number Field Constraints**
| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| `year` | 1900 | Current Year + 1 | Required for vehicles |
| `mileage` | 0 | - | Default: 0 |
| `distance` | 0 | - | Optional for trips |
| `estimatedDuration` | 0 | - | Minutes, optional |
| `actualDuration` | 0 | - | Minutes, optional |
| `estimatedCost` | 0 | - | Optional for incidents |
| `latitude` | -90 | 90 | Required for coordinates |
| `longitude` | -180 | 180 | Required for coordinates |

### **📅 Date Field Formats**
| Field | Format | Example | Notes |
|-------|--------|---------|-------|
| `scheduledStartTime` | ISO8601 | `2024-01-15T10:30:00.000Z` | Required |
| `scheduledEndTime` | ISO8601 | `2024-01-15T14:30:00.000Z` | Required |
| `actualStartTime` | ISO8601 | `2024-01-15T10:35:00.000Z` | Optional |
| `actualEndTime` | ISO8601 | `2024-01-15T14:25:00.000Z` | Optional |
| `dateTime` | ISO8601 | `2024-01-15T10:30:00.000Z` | Auto-generated |
| `lastServiceDate` | ISO8601 | `2024-01-01T00:00:00.000Z` | Optional |
| `nextServiceDate` | ISO8601 | `2024-07-01T00:00:00.000Z` | Optional |
| `insuranceExpiry` | ISO8601 | `2024-12-31T00:00:00.000Z` | Optional |
| `registrationExpiry` | ISO8601 | `2024-12-31T00:00:00.000Z` | Optional |

### **🎯 Enum Values**

#### **User Role**
```javascript
role: 'admin' | 'driver'
```

#### **User Gender**
```javascript
gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
```

#### **Vehicle Status**
```javascript
status: 'active' | 'inactive' | 'maintenance' | 'retired'
```

#### **Trip Status**
```javascript
status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed'
```

#### **Incident Type**
```javascript
incidentType: 'smoke_detection' | 'phone_usage' | 'drowsiness' | 'overspeeding' | 'harsh_brake'
```

#### **Incident Severity**
```javascript
severity: 'low' | 'medium' | 'high' | 'critical'
```

#### **Incident Status**
```javascript
status: 'reported' | 'investigating' | 'resolved' | 'closed'
```

### **📍 Location Object Structure**
```javascript
location: {
  address: "123 Main St, City, State", // Required string
  coordinates: {
    latitude: 40.7128,  // Required number (-90 to 90)
    longitude: -74.0060 // Required number (-180 to 180)
  }
}
```

### **👤 Customer Object Structure (Trips)**
```javascript
customer: {
  name: "John Customer",     // Optional string
  phone: "+1234567890",      // Optional string
  email: "customer@email.com" // Optional string
}
```

### **👥 Witness Object Structure (Incidents)**
```javascript
witnessDetails: [
  {
    name: "Jane Witness",           // Optional string
    phone: "+1234567890",          // Optional string
    statement: "I saw the accident" // Optional string
  }
]
```

### **💥 Damage Details Object Structure (Incidents)**
```javascript
damageDetails: {
  vehicleDamage: "Front bumper damaged", // Optional string (max 500 chars)
  cargoDamage: "Boxes scattered",        // Optional string (max 500 chars)
  estimatedCost: 1500.50                 // Optional number (min 0)
}
```

### **👮 Police Report Object Structure (Incidents)**
```javascript
policeReport: {
  reportNumber: "PR-2024-001",    // Optional string
  officerName: "Officer Smith",   // Optional string
  station: "Downtown Police"      // Optional string
}
```

### **🏢 Insurance Object Structure (Incidents)**
```javascript
insurance: {
  claimNumber: "CL-2024-001",     // Optional string
  adjusterName: "John Adjuster",  // Optional string
  adjusterPhone: "+1234567890"    // Optional string
}
```

### **📎 Attachments Object Structure (Incidents)**
```javascript
attachments: [
  {
    filename: "incident_photo_1.jpg",     // String
    originalName: "IMG_001.jpg",          // String
    mimetype: "image/jpeg",               // String
    size: 1024000,                        // Number (bytes)
    url: "/uploads/incident_photo_1.jpg"  // String
  }
]
```

### **🔍 Query Parameters**
| Parameter | Type | Min | Max | Default | Notes |
|-----------|------|-----|-----|---------|-------|
| `page` | Integer | 1 | - | 1 | For pagination |
| `limit` | Integer | 1 | 100 | 10 | Items per page |
| `status` | String | - | - | - | Filter by status |
| `assignedDriver` | ObjectId | - | - | - | Filter by driver ID |
| `assignedVehicle` | ObjectId | - | - | - | Filter by vehicle ID |
| `incidentType` | String | - | - | - | Filter by incident type |
| `severity` | String | - | - | - | Filter by severity |
| `priority` | String | - | - | - | Filter by priority |

---

## 🔐 Authentication APIs

### 1. Register User (Driver Only)
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Driver",
  "email": "driver@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": "123 Main St, City",
  "licenseNumber": "DL123456789",
  "gender": "male"
}
```

**Field Constraints:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters
- `phone`: Optional, max 15 characters
- `address`: Optional, max 200 characters
- `licenseNumber`: Optional, max 20 characters
- `gender`: Optional, must be one of: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`
- **Note**: Registration always creates drivers. Admins created via script only.

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully. Your account is pending admin approval.",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "address": "123 Main St, City",
      "licenseNumber": "DL123456789",
      "gender": "male",
      "profileImage": null,
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ Important Notes:**
- New drivers are created with `isActive: false` by default
- They receive a token but **cannot login** until admin approves them
- Admin must use `PUT /api/users/:id/activate` to approve the driver

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "phone": "+1234567890",
      "address": "Admin Address",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Error Response (401) - Account Pending Approval:**
```json
{
  "success": false,
  "message": "Your account is pending admin approval. Please contact administrator."
}
```

### 3. Get Current User Profile
**GET** `/auth/me`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "phone": "+1234567890",
      "address": "Admin Address",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

### 4. Update Current User Profile
**PUT** `/auth/me`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "03017422047",
  "address": "Pakistan, 60000",
  "licenseNumber": "3630242787805",
  "gender": "male"
}
```

**Field Constraints:**
- `name`: Optional, 2-50 characters
- `phone`: Optional, max 15 characters
- `address`: Optional, max 200 characters
- `licenseNumber`: Optional, max 20 characters
- `gender`: Optional, must be one of: `'male'`, `'female'`, `'other'`, `'prefer_not_to_say'`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Updated Name",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "03017422047",
      "address": "Pakistan, 60000",
      "licenseNumber": "3630242787805",
      "gender": "male",
      "profileImage": "/uploads/profile_1704067200000_507f1f77bcf86cd799439011_123456789.jpg",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Gender must be one of: male, female, other, prefer_not_to_say",
      "param": "gender",
      "location": "body"
    }
  ]
}
```

---

## 👥 Users Management APIs

### 1. Get All Users (Admin Only)
**GET** `/users?page=1&limit=10`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. Get All Drivers (Admin Only)
**GET** `/users/drivers?page=1&limit=10`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "licenseNumber": "DL123456789",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 3. Get User by ID (Admin or Own Profile)
**GET** `/users/:id`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "address": "123 Main St, City",
      "licenseNumber": "DL123456789",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to access this user"
}
```

### 4. Update User (Admin or Own Profile)
**PUT** `/users/:id`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "name": "John Driver Updated",
  "phone": "+1234567891",
  "address": "456 New St, New City",
  "licenseNumber": "DL987654321"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver Updated",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567891",
      "address": "456 New St, New City",
      "licenseNumber": "DL987654321",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to update this user"
}
```

### 4. Upload Profile Image
**POST** `/auth/upload-profile-image`
**Headers:** `Authorization: Bearer YOUR_TOKEN`
**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `profileImage`: Image file (required)
  - **File Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
  - **Max Size**: 5MB
  - **Field Name**: `profileImage`

**Example using JavaScript FormData:**
```javascript
const formData = new FormData();
formData.append('profileImage', fileInput.files[0]);

fetch('/api/auth/upload-profile-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: formData
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "profileImage": "/uploads/profile_1704067200000_507f1f77bcf86cd799439011_123456789.jpg",
    "filename": "profile_1704067200000_507f1f77bcf86cd799439011_123456789.jpg"
  }
}
```

**Error Responses:**

**No File Provided (400):**
```json
{
  "success": false,
  "error": "No image file provided"
}
```

**File Too Large (400):**
```json
{
  "success": false,
  "error": "File too large. Maximum size is 5MB."
}
```

**Invalid File Type (400):**
```json
{
  "success": false,
  "error": "Only image files are allowed!"
}
```

**Field Constraints:**
- **File Types**: Only image files (`image/*`)
- **Max Size**: 5MB
- **File Name**: Auto-generated with format: `profile_timestamp_userId_random.jpg`
- **Old Image**: Automatically deleted when new image is uploaded

**Important Notes:**
- ✅ **Automatic Old Image Deletion**: If user already has a profile image, it will be automatically deleted when uploading a new one
- ✅ **Unique Filenames**: Each uploaded image gets a unique filename to prevent conflicts
- ✅ **Image URL**: The returned `profileImage` field contains the full URL path to access the image
- ✅ **Static File Serving**: Images are served at `/uploads/filename` endpoint

### 5. Activate User (Admin Only)
**PUT** `/users/:id/activate`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "address": "123 Main St, City",
      "licenseNumber": "DL123456789",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

### 6. Deactivate User (Admin Only)
**PUT** `/users/:id/deactivate`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Driver",
      "email": "driver@example.com",
      "role": "driver",
      "phone": "+1234567890",
      "address": "123 Main St, City",
      "licenseNumber": "DL123456789",
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (400) - Cannot Deactivate Self:**
```json
{
  "success": false,
  "message": "Cannot deactivate your own account"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**⚠️ Important Notes:**
- ✅ **Admin Only**: Only admin users can activate/deactivate other users
- ✅ **Self-Protection**: Admins cannot deactivate their own account
- ✅ **Login Control**: Deactivated users cannot login (will get "pending approval" message)
- ✅ **Driver Approval**: Use activate endpoint to approve new driver registrations

---

## 🚗 Vehicles Management APIs

**🔍 Vehicle Access Logic:**
- **Admin Users**: Can see ALL vehicles in the system
- **Driver Users**: Can only see vehicles they have used in trips (not assigned vehicles)
- **Trip-Based Access**: When a driver is assigned to a trip with a specific vehicle, that vehicle becomes visible to them
- **Dynamic List**: Driver's vehicle list grows as they are assigned to more trips with different vehicles

### 1. Get All Vehicles (Admin: All, Driver: Vehicles Used in Trips)
**GET** `/vehicles?page=1&limit=10`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "licensePlate": "ABC123",
      "vin": "1HGBH41JXMN109186",
      "color": "Silver",
      "status": "active",
      "mileage": 15000,
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. Get Vehicle by ID (Admin or Assigned Driver)
**GET** `/vehicles/:id`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Vehicle retrieved successfully",
  "data": {
    "vehicle": {
      "_id": "507f1f77bcf86cd799439013",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "licensePlate": "ABC123",
      "vin": "1HGBH41JXMN109186",
      "color": "Silver",
      "status": "active",
      "mileage": 15000,
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to access this vehicle"
}
```

### 3. Create Vehicle (Admin Only)
**POST** `/vehicles`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Request Body:**
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

**Field Constraints:**
- `make`: Required, 1-50 characters
- `model`: Required, 1-50 characters
- `year`: Required, 1900 to current year + 1
- `licensePlate`: Required, 1-20 characters, unique, auto-uppercase
- `vin`: Optional, exactly 17 characters, unique, auto-uppercase
- `color`: Optional, max 30 characters
- `status`: Optional, must be one of: `'active'`, `'inactive'`, `'maintenance'`, `'retired'`
- `mileage`: Optional, minimum 0, default 0
- All dates: ISO8601 format

**Success Response (201):**
```json
{
  "success": true,
  "message": "Vehicle created successfully",
  "data": {
    "vehicle": {
      "_id": "507f1f77bcf86cd799439013",
      "make": "Toyota",
      "model": "Camry",
      "year": 2023,
      "licensePlate": "ABC123",
      "vin": "1HGBH41JXMN109186",
      "color": "Silver",
      "status": "active",
      "mileage": 15000,
      "assignedDriver": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Vehicle make is required",
      "param": "make",
      "location": "body"
    }
  ]
}
```

---

## 🚛 Trips Management APIs

### 1. Get All Trips
**GET** `/trips?page=1&limit=10`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trips retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "tripNumber": "TRP000001",
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "assignedVehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
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
      "status": "scheduled",
      "distance": 25.5,
      "estimatedDuration": 240,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. Get Trip by ID (Admin or Assigned Driver)
**GET** `/trips/:id`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trip retrieved successfully",
  "data": {
    "trip": {
      "_id": "507f1f77bcf86cd799439014",
      "tripNumber": "TRP000001",
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "assignedVehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
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
      "status": "scheduled",
      "distance": 25.5,
      "estimatedDuration": 240,
      "notes": "Handle with care",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to access this trip"
}
```

### 3. Create Trip (Admin Only)
**POST** `/trips`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Request Body:**
```json
{
  "assignedDriver": "507f1f77bcf86cd799439011",
  "assignedVehicle": "507f1f77bcf86cd799439013",
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
  "notes": "Handle with care"
}
```

**Field Constraints:**
- `assignedDriver`: Required, valid MongoDB ObjectId
- `assignedVehicle`: Required, valid MongoDB ObjectId
- `startLocation.address`: Required, non-empty string
- `startLocation.coordinates.latitude`: Required, -90 to 90
- `startLocation.coordinates.longitude`: Required, -180 to 180
- `endLocation.address`: Required, non-empty string
- `endLocation.coordinates.latitude`: Required, -90 to 90
- `endLocation.coordinates.longitude`: Required, -180 to 180
- `scheduledStartTime`: Required, ISO8601 format
- `scheduledEndTime`: Required, ISO8601 format
- `distance`: Optional, minimum 0
- `estimatedDuration`: Optional, minimum 0 (in minutes)
- `notes`: Optional, max 500 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Trip created successfully",
  "data": {
    "trip": {
      "_id": "507f1f77bcf86cd799439014",
      "tripNumber": "TRP000001",
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "assignedVehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
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
      "status": "scheduled",
      "distance": 25.5,
      "estimatedDuration": 240,
      "notes": "Handle with care",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 4. Update Trip Status
**PUT** `/trips/:tripId/status`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "status": "in_progress",
  "actualStartTime": "2024-01-15T10:30:00.000Z",
  "actualEndTime": "2024-01-15T14:30:00.000Z",
  "notes": "Status change notes"
}
```

**Field Constraints:**
- `status`: Required, must be one of: `'in_progress'`, `'completed'`, `'cancelled'`
- `actualStartTime`: Optional, ISO8601 format, can only be set when status is `'in_progress'`
- `actualEndTime`: Optional, ISO8601 format, can only be set when status is `'completed'`
- `notes`: Optional, max 500 characters

**Status Transition Rules:**
- `scheduled` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `delayed` → `in_progress`, `cancelled`
- `completed` → (no transitions allowed)
- `cancelled` → (no transitions allowed)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Trip status updated successfully",
  "data": {
    "trip": {
      "_id": "507f1f77bcf86cd799439014",
      "tripNumber": "TRP000001",
      "assignedDriver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com",
        "phone": "+1234567890"
      },
      "assignedVehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "year": 2023,
        "licensePlate": "ABC123"
      },
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
      "actualStartTime": "2024-01-15T10:30:00.000Z",
      "actualEndTime": "2024-01-15T14:30:00.000Z",
      "status": "completed",
      "distance": 25.5,
      "estimatedDuration": 240,
      "actualDuration": 240,
      "notes": "Status change notes",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    }
  }
}
```

**Error Response (400) - Invalid Status Transition:**
```json
{
  "success": false,
  "message": "Invalid status transition from 'completed' to 'in_progress'. Allowed transitions: "
}
```

**Error Response (400) - Invalid Time Setting:**
```json
{
  "success": false,
  "message": "actualStartTime can only be set when status is in_progress"
}
```

**Error Response (403) - Permission Denied:**
```json
{
  "success": false,
  "message": "Not authorized to update this trip"
}
```

**Error Response (404) - Trip Not Found:**
```json
{
  "success": false,
  "message": "Trip not found"
}
```

---

## 🚨 Incidents Management APIs

### 1. Get All Incidents
**GET** `/incidents?page=1&limit=10`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Incidents retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "incidentNumber": "INC000001",
      "reportedBy": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "driver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "vehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
      "incidentType": "phone_usage",
      "severity": "medium",
      "status": "reported",
      "location": {
        "address": "789 Incident St, Incident City",
        "coordinates": {
          "latitude": 40.7505,
          "longitude": -73.9934
        }
      },
      "description": "Driver was detected using phone while driving. Safety violation reported.",
      "dateTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. Get Incident by ID (Admin or Incident Driver)
**GET** `/incidents/:id`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Incident retrieved successfully",
  "data": {
    "incident": {
      "_id": "507f1f77bcf86cd799439015",
      "incidentNumber": "INC000001",
      "reportedBy": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "driver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "vehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
      "trip": {
        "_id": "507f1f77bcf86cd799439014",
        "tripNumber": "TRP000001"
      },
      "incidentType": "phone_usage",
      "severity": "medium",
      "status": "reported",
      "location": {
        "address": "789 Incident St, Incident City",
        "coordinates": {
          "latitude": 40.7505,
          "longitude": -73.9934
        }
      },
      "description": "Driver was detected using phone while driving. Safety violation reported.",
      "witnessDetails": [
        {
          "name": "Jane Witness",
          "phone": "+1987654321",
          "statement": "Witnessed driver using phone while driving. Safety concern reported."
        }
      ],
      "damageDetails": {
        "vehicleDamage": "No physical damage",
        "cargoDamage": "None",
        "estimatedCost": 0
      },
      "policeReport": {
        "reportNumber": "PR123456",
        "officerName": "Officer Smith",
        "station": "Central Police Station"
      },
      "dateTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Not authorized to access this incident"
}
```

### 3. Create Incident
**POST** `/incidents`
**Headers:** `Authorization: Bearer YOUR_TOKEN`

**Request Body:**
```json
{
  "driver": "507f1f77bcf86cd799439011",
  "vehicle": "507f1f77bcf86cd799439013",
  "trip": "507f1f77bcf86cd799439014",
  "incidentType": "phone_usage",
  "severity": "medium",
  "location": {
    "address": "789 Incident St, Incident City",
    "coordinates": {
      "latitude": 40.7505,
      "longitude": -73.9934
    }
  },
  "description": "Driver was detected using phone while driving. Safety violation reported.",
  "witnessDetails": [
    {
      "name": "Jane Witness",
      "phone": "+1987654321",
      "statement": "Witnessed driver using phone while driving. Safety concern reported."
    }
  ],
  "damageDetails": {
    "vehicleDamage": "No physical damage",
    "cargoDamage": "None",
    "estimatedCost": 0
  },
  "policeReport": {
    "reportNumber": "PR123456",
    "officerName": "Officer Smith",
    "station": "Central Police Station"
  }
}
```

**Field Constraints:**
- `incidentType`: Must be one of: `'smoke_detection'`, `'phone_usage'`, `'drowsiness'`, `'overspeeding'`, `'harsh_brake'`
- `severity`: Must be one of: `'low'`, `'medium'`, `'high'`, `'critical'`
- `description`: Required, 10-1000 characters
- `latitude`: Required, -90 to 90
- `longitude`: Required, -180 to 180
- `estimatedCost`: Optional, minimum 0

**Success Response (201):**
```json
{
  "success": true,
  "message": "Incident reported successfully",
  "data": {
    "incident": {
      "_id": "507f1f77bcf86cd799439015",
      "incidentNumber": "INC000001",
      "reportedBy": "507f1f77bcf86cd799439011",
      "driver": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Driver",
        "email": "driver@example.com"
      },
      "vehicle": {
        "_id": "507f1f77bcf86cd799439013",
        "make": "Toyota",
        "model": "Camry",
        "licensePlate": "ABC123"
      },
      "trip": {
        "_id": "507f1f77bcf86cd799439014",
        "tripNumber": "TRP000001"
      },
      "incidentType": "phone_usage",
      "severity": "medium",
      "status": "reported",
      "location": {
        "address": "789 Incident St, Incident City",
        "coordinates": {
          "latitude": 40.7505,
          "longitude": -73.9934
        }
      },
      "description": "Driver was detected using phone while driving. Safety violation reported.",
      "witnessDetails": [
        {
          "name": "Jane Witness",
          "phone": "+1987654321",
          "statement": "Witnessed driver using phone while driving. Safety concern reported."
        }
      ],
      "damageDetails": {
        "vehicleDamage": "No physical damage",
        "cargoDamage": "None",
        "estimatedCost": 0
      },
      "policeReport": {
        "reportNumber": "PR123456",
        "officerName": "Officer Smith",
        "station": "Central Police Station"
      },
      "dateTime": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 📊 Reports & Analytics APIs (Admin Only)

### 1. Dashboard Statistics
**GET** `/reports/dashboard`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Query Parameters:**
- `startDate` (optional): Filter data from this date (ISO8601 format)
- `endDate` (optional): Filter data until this date (ISO8601 format)

**Note:** Completion rate is calculated as: `(completed trips / ended trips) * 100` where ended trips = completed + cancelled trips. This gives a more accurate success rate by excluding ongoing trips.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "stats": {
      "users": {
        "total": 10,
        "drivers": 8,
        "admins": 2,
        "activeDrivers": 7
      },
      "vehicles": {
        "total": 15,
        "active": 12,
        "inactive": 3
      },
      "trips": {
        "total": 45,
        "completed": 38,
        "cancelled": 7,
        "pending": 5,
        "inProgress": 2,
        "delayed": 0,
        "endedTrips": 45,
        "completionRate": 84.44
      },
      "incidents": {
        "total": 8,
        "reported": 3,
        "resolved": 5,
        "incidentRate": 17.78
      }
    }
  }
}
```

### 2. Driver Performance Report
**GET** `/reports/driver-performance`
**Headers:** `Authorization: Bearer ADMIN_TOKEN`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Driver performance report retrieved successfully",
  "data": {
    "driverPerformance": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "driverName": "John Driver",
        "driverEmail": "driver@example.com",
        "totalTrips": 15,
        "completedTrips": 14,
        "totalDistance": 375.5,
        "avgDuration": 245.5,
        "totalIncidents": 1,
        "criticalIncidents": 0,
        "completionRate": 93.33,
        "incidentRate": 6.67
      }
    ]
  }
}
```

---

## 🔧 Utility APIs

### 1. Health Check
**GET** `/health`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### 2. API Info
**GET** `/`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Welcome to MERN Dashboard Backend API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "users": "/api/users",
    "vehicles": "/api/vehicles",
    "trips": "/api/trips",
    "incidents": "/api/incidents",
    "reports": "/api/reports",
    "health": "/api/health"
  }
}
```

---

## ❌ Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized, no token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "User role driver is not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Name must be between 2 and 50 characters",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server Error"
}
```

---

## 🎯 Frontend Integration Tips

### 1. Token Management
```javascript
// Store token after login
localStorage.setItem('token', response.data.token);

// Use token in requests
const token = localStorage.getItem('token');
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 2. Error Handling
```javascript
// Handle API responses
if (response.success) {
  // Handle success
  setData(response.data);
} else {
  // Handle error
  setError(response.message);
}
```

### 3. Role-Based UI
```javascript
// Check user role
const userRole = user.role; // 'admin' or 'driver'

// Show/hide features based on role
{userRole === 'admin' && <AdminOnlyComponent />}
{userRole === 'driver' && <DriverOnlyComponent />}
```

### 4. Pagination
```javascript
// Handle paginated responses
const { data, pagination } = response.data;
setItems(data);
setPagination(pagination);
```

---

## 🚀 Quick Start for Frontend

1. **Login** to get token
2. **Store token** in localStorage
3. **Use token** in all API requests
4. **Handle responses** based on success/error
5. **Implement role-based** UI components

This guide provides everything your frontend developer needs to integrate the APIs seamlessly! 🎉

---

## 🎭 Role-Based UI Guidelines

### **Admin vs Driver Access Matrix**

Use this matrix to show/hide UI elements based on user role. Check `user.role` to determine what to display.

#### **🔐 Authentication & Profile**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| Login/Register | ✅ | ✅ | Both can login |
| View Own Profile | ✅ | ✅ | Both can see their profile |
| Update Own Profile | ✅ | ✅ | Both can update their profile |
| Upload Profile Image | ✅ | ✅ | Both can upload profile images |
| Change Password | ✅ | ✅ | Both can change password |

#### **👥 User Management**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| View All Users | ✅ | ❌ | **Hide "Users" menu for drivers** |
| View All Drivers | ✅ | ❌ | **Hide "Drivers" menu for drivers** |
| Add New User | ✅ | ❌ | **Hide "Add User" button for drivers** |
| Edit Any User | ✅ | ❌ | **Hide "Edit" buttons for other users** |
| Delete User | ✅ | ❌ | **Hide "Delete" buttons for drivers** |
| Activate/Deactivate User | ✅ | ❌ | **Hide activation controls for drivers** |

#### **🚗 Vehicle Management**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| View All Vehicles | ✅ | ✅ | **Drivers see vehicles they've used in trips** |
| Add New Vehicle | ✅ | ❌ | **Hide "Add Vehicle" button for drivers** |
| Edit Vehicle | ✅ | ❌ | **Hide "Edit Vehicle" buttons for drivers** |
| Delete Vehicle | ✅ | ❌ | **Hide "Delete Vehicle" buttons for drivers** |
| Assign/Unassign Vehicle | ✅ | ❌ | **Hide assignment controls for drivers** |
| View Vehicle Status Reports | ✅ | ❌ | **Hide status filter for drivers** |

#### **🚛 Trip Management**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| View All Trips | ✅ | ✅ | **Drivers see only their trips** |
| Create New Trip | ✅ | ❌ | **Hide "Create Trip" button for drivers** |
| Edit Trip Details | ✅ | ❌ | **Hide "Edit Trip" buttons for drivers** |
| Delete Trip | ✅ | ❌ | **Hide "Delete Trip" buttons for drivers** |
| Start Trip | ✅ | ✅ | **Drivers can start their assigned trips** |
| Complete Trip | ✅ | ✅ | **Drivers can complete their assigned trips** |
| Update Trip Status | ✅ | ✅ | **Drivers can update their assigned trips** |
| Cancel Trip | ✅ | ❌ | **Hide "Cancel Trip" buttons for drivers** |
| View Trip Status Reports | ✅ | ❌ | **Hide status filter for drivers** |

#### **🚨 Incident Management**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| View All Incidents | ✅ | ✅ | **Drivers see only their incidents** |
| Report New Incident | ✅ | ✅ | **Both can report incidents** |
| Edit Incident | ✅ | ❌ | **Hide "Edit Incident" buttons for drivers** |
| Delete Incident | ✅ | ❌ | **Hide "Delete Incident" buttons for drivers** |
| Resolve Incident | ✅ | ❌ | **Hide "Resolve" buttons for drivers** |
| Close Incident | ✅ | ❌ | **Hide "Close" buttons for drivers** |
| View Incident Reports | ✅ | ❌ | **Hide incident reports for drivers** |

#### **📊 Reports & Analytics**
| Feature | Admin | Driver | Notes |
|---------|-------|--------|-------|
| Dashboard Statistics | ✅ | ❌ | **Hide entire "Reports" menu for drivers** |
| Driver Performance | ✅ | ❌ | **Hide performance reports for drivers** |
| Vehicle Status Report | ✅ | ❌ | **Hide vehicle reports for drivers** |
| Monthly Trends | ✅ | ❌ | **Hide trend reports for drivers** |
| All Analytics | ✅ | ❌ | **Hide all analytics for drivers** |

---

## 🎨 Frontend Implementation Examples

### **1. Conditional Rendering Based on Role**

```javascript
// Check user role
const userRole = user.role; // 'admin' or 'driver'

// Show/hide navigation menu items
{userRole === 'admin' && (
  <NavItem to="/users">Users Management</NavItem>
)}
{userRole === 'admin' && (
  <NavItem to="/reports">Reports & Analytics</NavItem>
)}

// Show/hide action buttons
{userRole === 'admin' && (
  <Button onClick={createVehicle}>Add Vehicle</Button>
)}
{userRole === 'admin' && (
  <Button onClick={editUser}>Edit User</Button>
)}
```

### **2. Role-Based Component Rendering**

```javascript
// Create role-specific components
const AdminOnlyButton = ({ children, ...props }) => {
  return userRole === 'admin' ? <Button {...props}>{children}</Button> : null;
};

const DriverOnlyButton = ({ children, ...props }) => {
  return userRole === 'driver' ? <Button {...props}>{children}</Button> : null;
};

// Usage
<AdminOnlyButton onClick={deleteUser}>Delete User</AdminOnlyButton>
<DriverOnlyButton onClick={startTrip}>Start Trip</DriverOnlyButton>
```

### **3. Conditional API Calls**

```javascript
// Only make API calls for features the user can access
const fetchData = async () => {
  if (userRole === 'admin') {
    // Admin can fetch all data
    const [users, vehicles, trips, incidents] = await Promise.all([
      api.get('/users'),
      api.get('/vehicles'),
      api.get('/trips'),
      api.get('/incidents')
    ]);
  } else {
    // Driver can only fetch their own data
    const [vehicles, trips, incidents] = await Promise.all([
      api.get('/vehicles'), // Returns vehicles used in trips
      api.get('/trips'),    // Returns only their trips
      api.get('/incidents') // Returns only their incidents
    ]);
  }
};
```

### **4. Menu/Navigation Structure**

```javascript
// Admin Navigation
const adminMenu = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'Users', path: '/users', icon: 'users' },
  { name: 'Drivers', path: '/drivers', icon: 'drivers' },
  { name: 'Vehicles', path: '/vehicles', icon: 'vehicles' },
  { name: 'Trips', path: '/trips', icon: 'trips' },
  { name: 'Incidents', path: '/incidents', icon: 'incidents' },
  { name: 'Reports', path: '/reports', icon: 'reports' }
];

// Driver Navigation
const driverMenu = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { name: 'My Vehicles', path: '/vehicles', icon: 'vehicles' },
  { name: 'My Trips', path: '/trips', icon: 'trips' },
  { name: 'My Incidents', path: '/incidents', icon: 'incidents' },
  { name: 'Profile', path: '/profile', icon: 'profile' }
];

// Use appropriate menu based on role
const menuItems = userRole === 'admin' ? adminMenu : driverMenu;
```

### **5. Form Field Visibility**

```javascript
// Show/hide form fields based on role
const UserForm = ({ user, isEditing }) => {
  return (
    <form>
      <input name="name" placeholder="Name" />
      <input name="email" placeholder="Email" />
      <input name="phone" placeholder="Phone" />
      
      {/* Only admins can change role and status */}
      {userRole === 'admin' && (
        <select name="role">
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
      )}
      
      {userRole === 'admin' && (
        <select name="isActive">
          <option value={true}>Active</option>
          <option value={false}>Inactive</option>
        </select>
      )}
    </form>
  );
};
```

---

## 🚀 Quick Implementation Checklist

### **For Admin Users:**
- ✅ Show all navigation menu items
- ✅ Show all CRUD buttons (Create, Edit, Delete)
- ✅ Show reports and analytics sections
- ✅ Show user management features
- ✅ Show vehicle assignment controls
- ✅ Show trip management controls
- ✅ Show incident resolution controls

### **For Driver Users:**
- ❌ Hide "Users" menu
- ❌ Hide "Reports" menu  
- ❌ Hide "Add/Create" buttons
- ❌ Hide "Edit" buttons for others' data
- ❌ Hide "Delete" buttons
- ❌ Hide "View Details" buttons (all info in cards)
- ❌ Hide assignment controls
- ❌ Hide resolution controls
- ✅ Show only vehicles they've used in trips
- ✅ Show only their trips
- ✅ Show only their incidents
- ✅ Show "Start Trip" and "Complete Trip" buttons
- ✅ Show "Report Incident" button

### **Common Patterns:**
```javascript
// Always check role before showing UI elements
const canEdit = userRole === 'admin' || (userRole === 'driver' && isOwnResource);
const canDelete = userRole === 'admin';
const canCreate = userRole === 'admin';
const canViewReports = userRole === 'admin';
```

This approach ensures a clean, role-appropriate user experience without confusing error messages! 🎯

---

## ⚠️ Common Validation Errors & Solutions

### **🔍 Validation Error Response Format**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Field validation message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

### **📝 Common Field Validation Errors**

#### **User Registration Errors**
```json
// Name too short
{
  "msg": "Name must be between 2 and 50 characters",
  "param": "name"
}

// Invalid email
{
  "msg": "Please provide a valid email",
  "param": "email"
}

// Password too short
{
  "msg": "Password must be at least 6 characters long",
  "param": "password"
}

// Phone too long
{
  "msg": "Phone number cannot be more than 15 characters",
  "param": "phone"
}

// Invalid gender
{
  "msg": "Gender must be one of: male, female, other, prefer_not_to_say",
  "param": "gender"
}
```

#### **Vehicle Creation Errors**
```json
// Invalid year
{
  "msg": "Year must be a valid year",
  "param": "year"
}

// VIN wrong length
{
  "msg": "VIN must be exactly 17 characters",
  "param": "vin"
}

// Invalid status
{
  "msg": "Status must be one of: active, inactive, maintenance, retired",
  "param": "status"
}
```

#### **Trip Creation Errors**
```json
// Invalid driver ID
{
  "msg": "Valid driver ID is required",
  "param": "assignedDriver"
}

// Invalid coordinates
{
  "msg": "Valid start latitude is required",
  "param": "startLocation.coordinates.latitude"
}

// Invalid date format
{
  "msg": "Valid scheduled start time is required",
  "param": "scheduledStartTime"
}

// Invalid priority
{
  "msg": "Priority must be one of: low, medium, high, urgent",
  "param": "priority"
}
```

#### **Incident Creation Errors**
```json
// Invalid incident type
{
  "msg": "Valid incident type is required",
  "param": "incidentType"
}

// Invalid severity
{
  "msg": "Severity must be one of: low, medium, high, critical",
  "param": "severity"
}

// Description too short
{
  "msg": "Description must be between 10 and 1000 characters",
  "param": "description"
}
```

### **🛠️ Frontend Validation Tips**

#### **1. Pre-validate on Frontend**
```javascript
// Validate before sending request
const validateIncidentType = (type) => {
  const validTypes = [
    'accident', 'breakdown', 'traffic_violation', 
    'fuel_theft', 'cargo_damage', 'weather_related', 
    'mechanical_failure', 'other'
  ];
  return validTypes.includes(type);
};

const validateSeverity = (severity) => {
  const validSeverities = ['low', 'medium', 'high', 'critical'];
  return validSeverities.includes(severity);
};
```

#### **2. Use Dropdowns for Enums**
```javascript
// Instead of text input, use dropdowns
<select name="incidentType" required>
  <option value="">Select Incident Type</option>
  <option value="accident">Accident</option>
  <option value="breakdown">Breakdown</option>
  <option value="traffic_violation">Traffic Violation</option>
  <option value="fuel_theft">Fuel Theft</option>
  <option value="cargo_damage">Cargo Damage</option>
  <option value="weather_related">Weather Related</option>
  <option value="mechanical_failure">Mechanical Failure</option>
  <option value="other">Other</option>
</select>

// Gender dropdown
<select name="gender">
  <option value="">Select Gender (Optional)</option>
  <option value="male">Male</option>
  <option value="female">Female</option>
  <option value="other">Other</option>
  <option value="prefer_not_to_say">Prefer not to say</option>
</select>
```

#### **3. Input Length Validation**
```javascript
// Set maxLength attributes
<input 
  name="description" 
  maxLength="1000" 
  minLength="10"
  required 
/>
<input name="name" maxLength="50" minLength="2" required />
<input name="phone" maxLength="15" />
```

#### **4. Date Format Validation**
```javascript
// Ensure ISO8601 format
const formatDateForAPI = (date) => {
  return new Date(date).toISOString();
};

// Example usage
const startTime = formatDateForAPI(new Date('2024-02-01 08:00'));
// Result: "2024-02-01T08:00:00.000Z"
```

#### **5. Coordinate Validation**
```javascript
// Validate coordinates before sending
const validateCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Example usage
if (!validateCoordinates(latitude, longitude)) {
  alert('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
  return;
}
```

### **🎯 Error Handling Best Practices**

#### **1. Display User-Friendly Messages**
```javascript
const getErrorMessage = (error) => {
  const errorMap = {
    'Name must be between 2 and 50 characters': 'Please enter a name between 2-50 characters',
    'Please provide a valid email': 'Please enter a valid email address',
    'Password must be at least 6 characters long': 'Password must be at least 6 characters',
    'Valid driver ID is required': 'Please select a valid driver',
    'Valid incident type is required': 'Please select an incident type'
  };
  
  return errorMap[error] || error;
};
```

#### **2. Show Field-Specific Errors**
```javascript
// Display errors next to specific fields
{errors.map((error, index) => (
  <div key={index} className="field-error">
    {getErrorMessage(error.msg)}
  </div>
))}
```

#### **3. Prevent Invalid Submissions**
```javascript
// Disable submit button if validation fails
const isFormValid = () => {
  return name.length >= 2 && 
         email.includes('@') && 
         password.length >= 6 &&
         validateIncidentType(incidentType);
};

<button 
  type="submit" 
  disabled={!isFormValid()}
>
  Submit
</button>
```

This comprehensive guide ensures your frontend developer has all the information needed to create a robust, user-friendly interface! 🚀
