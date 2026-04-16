# Scripts Directory

This directory contains utility scripts for the MERN Dashboard Backend.

## Available Scripts

### createsuperuser.js

Creates admin users securely through the command line.

**Usage:**
```bash
# Using npm script (recommended)
npm run create-admin

# Or directly
node scripts/createsuperuser.js
```

**Features:**
- Interactive prompts for user input
- Password confirmation
- Email validation
- Duplicate user prevention
- Secure password hashing
- Admin role enforcement
- Database connection management

**Security:**
- Only creates admin users (never drivers)
- Validates all inputs
- Prevents duplicate admin creation
- Runs independently from the main server
- No public API endpoint exposure

## Environment Requirements

Make sure your `.env` file is properly configured with:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret

## Notes

- The script will warn if an admin already exists
- All inputs are validated before user creation
- Passwords are hidden during input for security
- The script automatically closes database connections when finished
