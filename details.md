# Project Implementation Details

This document defines the **core system responsibilities, business rules, and architectural constraints** of the Hospital Management Backend. This is **not a task list**. It specifies the **required design and behavior** of the system.

---

## 1. Authorization (Not Authentication)

Authentication (login) is already implemented. The system must now clearly define and enforce:

> Access control rules for each role.

### Roles (RBAC)

- **admin**
- **doctor**
- **patient**

### Required Middlewares

- `verifyJWT`
- `authorizeRoles("admin", "doctor", "patient")`

### Mandatory Rules

- A patient must not be able to delete a doctor
- A doctor must not be able to view other doctors’ patients
- An admin can manage all entities

### Architectural Constraint

- Authorization logic must be implemented in middleware
- Controllers must not contain access control logic

---

## 2. Core Domain Logic

This section defines the central business logic of the system.

### Core Entities

- Doctor Availability
- Appointment
- Time Slot
- Appointment Status

### Appointment Lifecycle

```
AVAILABLE → BOOKED → COMPLETED / CANCELLED
```

### Mandatory Business Rules

- One slot can be assigned to only one patient
- Double booking must not be possible
- Doctor availability must control appointment creation
- Cancellation must restore the slot if it occurs before the cutoff time

These rules must be explicitly enforced in the backend.

---

## 3. Appointment & Availability Controllers (Separation of Responsibilities)

Controllers must be separated by responsibility and role.

### Doctor Side

- Set availability (date + time range)
- View own appointments
- Update appointment status

### Patient Side

- Search doctors
- View available slots
- Book appointment
- Cancel appointment

### Admin Side

- View system-wide statistics
- Disable doctors
- Resolve conflicts

A single controller must not handle all of these responsibilities.

---

## 4. Data Integrity & Concurrency Control

The system must be safe under concurrent access.

### Required Techniques

- MongoDB transactions
- Or atomic updates with conditions

This is required to prevent inconsistent states such as multiple bookings for the same slot.

---

## 5. Error Handling & API Contracts

All APIs must follow a consistent and predictable contract.

### Enforce

- Consistent response format
- Meaningful HTTP status codes
- Custom error classes
- Centralized error handling middleware

Clients must always receive clear and structured responses.

---

## 6. Validation

All critical input must be validated on the backend.

### The Backend Must Validate

- Dates
- Time ranges
- MongoDB ObjectIds
- Role-specific request payloads

Schema-based validation must be used consistently.

---

## 7. Logging & Auditing

The system must maintain traceability of important operations.

### At Minimum, Track

- Who created an appointment
- Who cancelled an appointment
- When the appointment status changed

### This Enables

- Analytics
- Reports
  n- Compliance and auditing requirements

---

## 8. Performance & Scaling

Performance optimization must be done only after correctness is ensured.

### After Core Logic Is Stable

- Pagination
- Indexing
- Caching (Redis)
- Read/write separation (future)

---

## 9. Security Basics

The following are mandatory security requirements:

- Password hashing
- Token expiration and rotation
- Rate limiting
- Input sanitization

---

## 10. Documentation & Tests

### Documentation

- API documentation
- Postman collection

### Tests (At Minimum)

- Booking logic
- Conflict handling
- Authorization rules

Automated tests must be used to verify critical business logic.

---

## Final Note

This document defines the **required behavior and constraints** of the system. Any implementation that does not satisfy these sections must be considered incomplete or incorrect from a system design perspective.
