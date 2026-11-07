# API Documentation

baseUrl = http://localhost:3000/api/v1
Full request/response details: see Postman collection `Hospital Management`.

## Auth

### POST /auth/register/admin

Registers a new admin account.

> **Note:** Uses the secret key, not JWT.

### POST /auth/login/admin

Logs in an admin and returns a token.

### POST /auth/register/patient

Registers a new patient account.

### POST /auth/login/patient

Logs in a patient and returns a token.

### POST /auth/register/doctor

Registers a new doctor account.

### POST /auth/login/doctor

Logs in a doctor and returns a token.
