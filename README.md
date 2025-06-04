# Secure Group Messaging API - Learning Yoga Assesment

A production-ready RESTful API for creating, managing, and messaging in secure public/private groups with AES-128 encryption and full group moderation.

---

## URLs

- **Production API:** [https://secure-group-api.onrender.com/](https://secure-group-api.onrender.com/)  
- **Swagger API Docs:** [https://secure-group-api.onrender.com/api-docs](https://secure-group-api.onrender.com/api-docs)  
- **Development Server:** `http://localhost:5000`

---

## Authentication

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Authenticate user    |

---

## Groups

| Method | Endpoint                                    | Description                          |
|--------|---------------------------------------------|------------------------------------|
| POST   | `/api/groups`                               | Create a new group                  |
| GET    | `/api/groups/discover`                      | Discover public groups              |
| GET    | `/api/groups/{id}/members`                  | List group members                  |
| POST   | `/api/groups/{id}/join`                     | Join a group                       |
| GET    | `/api/groups/{id}`                          | Get group details                   |
| DELETE | `/api/groups/{id}`                          | Delete a group (Owner only)         |
| POST   | `/api/groups/{id}/leave`                    | Leave a group                      |
| POST   | `/api/groups/{id}/transfer`                 | Transfer group ownership            |
| PATCH  | `/api/groups/{id}/settings`                 | Update group settings (Owner/Admin only) |
| POST   | `/api/groups/{id}/request-join`             | Request to join a private group     |
| POST   | `/api/groups/{id}/join-requests/{userId}/approve` | Approve a join request (Owner only)  |
| POST   | `/api/groups/{id}/join-requests/{userId}/decline` | Decline a join request (Owner only)  |
| POST   | `/api/groups/{id}/banish/{userId}`          | Banish a user from group (Owner only)|
| POST   | `/api/groups/{id}/messages`                  | Send a message to group             |
| GET    | `/api/groups/{id}/messages`                  | Get group messages                  |
| PATCH  | `/api/groups/{id}/members/{userId}/role`    | Update a member's role (Owner/Admin only) |
| POST   | `/api/groups/{id}/members/{userId}`          | Add a member to group (Owner/Admin only)  |
| DELETE | `/api/groups/{id}/members/{userId}`          | Remove a member from group (Owner/Admin only) |

---

## Messages

| Method | Endpoint                 | Description            |
|--------|--------------------------|------------------------|
| POST   | `/api/messages/{groupId}`| Send a message to group|

---

## Users

| Method | Endpoint         | Description           |
|--------|------------------|-----------------------|
| GET    | `/api/users/me`  | Get current user info |

---

## Schemas

- User  
- Group  
- Message

---

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone git@github.com:OLUWATOSIN-sys/l-yoga.git
   cd secure-group-api
