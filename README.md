# Disclio

Disclio is a full-stack CD collection management application built with a React/Vite frontend and a Spring Boot backend. The project combines catalog management, song management, statistics, real-time chat, admin monitoring, automatic CD generation, offline-first behavior, secure authentication, role-based authorization, session management, password recovery by email, HTTPS transport, and LAN-accessible development setup.

This README is intentionally detailed and documents what is implemented in the current codebase, including smaller quality-of-life behaviors and internal mechanisms.

## Table of Contents

1. Overview
2. Tech Stack
3. Application Structure
4. Core Functional Areas
5. Authentication, Authorization, Sessions, and Recovery
6. Data Management Features
7. Real-Time and Background Features
8. Offline and Caching Features
9. Admin and Monitoring Features
10. Networking, HTTPS, and LAN Access
11. GraphQL API Overview
12. Data Storage Overview
13. Testing
14. Configuration
15. How to Run
16. Current Implementation Notes

## Overview

Disclio supports the following major use cases:

- browsing a CD collection in multiple UI modes
- adding, editing, and deleting CDs
- managing songs inside CDs
- viewing collection statistics
- chatting in real time with other users
- authenticating users securely with role-aware access
- restricting admin-only features such as generator control and monitoring views
- recovering passwords via email-delivered reset tokens
- logging in with one-time email codes
- protecting selected accounts with three-way authentication
- synchronizing queued mutations after reconnecting from offline mode
- refreshing collection views in real time when the automatic generator adds content
- serving frontend and backend over HTTPS
- exposing the application on the local network during development

The application uses a `USER` / `ADMIN` role model. Permissions are enforced on the backend and reflected in the frontend routing and UI visibility.

## Tech Stack

### Frontend

- React 18
- Vite
- React Router
- STOMP over WebSocket
- Recharts for statistics
- Framer Motion
- IndexedDB for offline mutation queue
- localStorage and sessionStorage for client-side persistence
- Vitest + Testing Library

### Backend

- Spring Boot 3
- Spring Web
- Spring GraphQL
- Spring WebSocket
- Spring Data JPA
- Spring Security
- Spring Mail
- Microsoft SQL Server
- MongoDB
- JWT via `jjwt`
- H2 for backend tests

## Application Structure

### Frontend

Main frontend application:

- [disclioapp.client/src/App.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/App.jsx)

Important frontend areas:

- authentication UI: [disclioapp.client/src/authentication/AuthView.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/authentication/AuthView.jsx)
- API helpers: [disclioapp.client/src/api/client.js](D:/Disclio/DisclioApp/disclioapp.client/src/api/client.js)
- offline queue: [disclioapp.client/src/hooks/offlineSupport.js](D:/Disclio/DisclioApp/disclioapp.client/src/hooks/offlineSupport.js)
- paginated CD loading and cache: [disclioapp.client/src/hooks/useCDPagination.js](D:/Disclio/DisclioApp/disclioapp.client/src/hooks/useCDPagination.js)
- user dashboard: [disclioapp.client/src/views/dashboard/DashboardView.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/dashboard/DashboardView.jsx)
- admin dashboard: [disclioapp.client/src/views/dashboard/AdminDashboard.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/dashboard/AdminDashboard.jsx)
- statistics: [disclioapp.client/src/views/statistics/StatisticsView.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/statistics/StatisticsView.jsx)
- chat: [disclioapp.client/src/views/chatView/ChatView.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/chatView/ChatView.jsx)

### Backend

Spring Boot entry point:

- [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/Application.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/Application.java)

Important backend areas:

- GraphQL schema: [DisclioApp.Server/src/main/resources/graphql/schema.graphqls](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/resources/graphql/schema.graphqls)
- auth service: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/AuthService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/AuthService.java)
- JWT service: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/JwtService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/JwtService.java)
- mail sender: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/PasswordRecoveryEmailService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/PasswordRecoveryEmailService.java)
- role/permission seeding: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/SecurityBootstrap.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/SecurityBootstrap.java)
- auth filter: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/CookieAuthFilter.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/CookieAuthFilter.java)
- security config: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/SecurityConfig.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/SecurityConfig.java)
- CORS config: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/CorsConfig.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/CorsConfig.java)
- WebSocket config: [DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/WebSocketConfig.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/WebSocketConfig.java)

## Core Functional Areas

### 1. CD Collection Management

The application supports standard CRUD operations for CDs:

- create CD
- update CD
- delete CD
- view a single CD
- list CDs
- load CDs in pages
- view a total CD count

CDs contain:

- title
- artist
- category
- manufacturer
- year
- condition
- rating
- description
- photos
- songs

These operations are defined in the GraphQL schema and backed by secured GraphQL controllers and service layers.

### 2. Song Management

Each CD can include songs with:

- title
- duration
- track number

Implemented actions include:

- add song to CD
- delete song
- query songs by CD

The frontend also sanitizes string-only song inputs into full song objects with generated track numbers and a fallback duration of `0:00` before submission.

### 3. Multiple Collection Views

The frontend includes more than one way to browse the same collection:

- `MasterView`
- `GridView`
- `DetailsView`
- `SongListView`

This provides both summary browsing and record-level drill-down.

### 4. Landing and Navigation Flow

The app includes:

- a landing page
- a dedicated authentication route
- protected routes for authenticated users
- a dedicated admin route

The frontend uses route guards to enforce:

- login required for protected areas
- admin role required for admin pages

## Authentication, Authorization, Sessions, and Recovery

### 1. Password Hashing

Passwords are no longer stored as plaintext for new users.

Implemented behavior:

- new passwords are hashed with BCrypt during signup
- legacy plaintext passwords can still be recognized during login
- if a legacy plaintext password matches, it is automatically upgraded to a BCrypt hash

This upgrade path allows old accounts to continue working while moving them to a safer storage format.

### 2. JWT-Based Authentication

The backend issues JWT access tokens through [JwtService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/JwtService.java).

The token contains:

- `sub` = username
- `sessionId`
- `role`
- `permissions`
- issued-at
- expiration

This means the token is not just an "is logged in" flag. It also carries the authenticated role and granted permission set.

### 3. Secure Cookie Storage

Authentication tokens are stored in the `disclio_access_token` cookie.

Cookie properties are configured to support secure usage:

- `HttpOnly`
- `Secure`
- `SameSite` configurable
- path `/`

Because the cookie is `HttpOnly`, frontend JavaScript cannot read it directly. The backend remains the source of truth.

### 4. Backend-Driven Auth State

The frontend does not trust browser-written `username` cookies or `localStorage` for login state.

Instead it uses:

- the backend `me` query
- the `disclio_access_token` cookie
- React auth state derived from server responses

This is implemented through:

- [client.js](D:/Disclio/DisclioApp/disclioapp.client/src/api/client.js)
- [App.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/App.jsx)
- [AuthView.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/authentication/AuthView.jsx)

### 5. Session Management

Sessions are not represented only by JWT expiration. There is also a backend session table:

- `auth_sessions`

The session model tracks:

- session ID
- associated user
- last activity time
- expiration time
- revocation status

This allows:

- explicit logout
- inactivity timeout
- forced invalidation of sessions
- revalidation of every request against a server-side session record

### 6. Inactivity Logout

The app implements inactivity logout on both sides:

- frontend inactivity timer in [App.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/App.jsx)
- backend session expiration updates in [AuthService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/AuthService.java)

The frontend watches activity events such as:

- click
- keydown
- mousemove
- scroll
- touchstart

If the timer expires, the app logs the user out and clears auth state.

### 7. Role-Based Authorization

The app currently supports these roles:

- `USER`
- `ADMIN`

Permissions are seeded at startup by [SecurityBootstrap.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/config/SecurityBootstrap.java).

`USER` permissions:

- `READ_CD`
- `VIEW_STATISTICS`
- `CREATE_CD`
- `UPDATE_CD`
- `DELETE_CD`
- `CREATE_SONG`
- `DELETE_SONG`

Admin-only permissions added on top:

- `START_GENERATOR`
- `STOP_GENERATOR`
- `VIEW_LOG`

Authorization is enforced server-side with `@PreAuthorize(...)` annotations across GraphQL controllers.

### 8. Password Recovery by Email

The app supports password recovery through:

- `requestPasswordReset(identifier)`
- `resetPassword(token, newPassword)`

Implemented behavior:

- users can request a recovery token by username or email
- the backend generates a random token
- only a SHA-256 hash of the token is stored
- tokens expire after a configured number of minutes
- old unused reset tokens for the same user are invalidated
- successful password reset re-hashes the password
- successful password reset revokes active sessions

The email sender is implemented in [PasswordRecoveryEmailService.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/main/java/com/example/DisclioApp/Server/service/PasswordRecoveryEmailService.java).

The frontend supports:

- entering username or email to request recovery
- returning to the app and entering the token
- setting a new password
- confirming the new password

Small but important usability behavior:

- the password recovery step is persisted in `sessionStorage`
- if a phone reloads the page after switching to the mail app, the auth view reopens on the reset form

### 9. Email Code Login

The app also supports passwordless email-code login through:

- `requestEmailLoginCode(identifier)`
- `loginWithEmailCode(identifier, code)`

Implemented behavior:

- the identifier can be a username or email
- the backend generates a one-time code
- the code is emailed to the address on file
- the frontend can complete login using the emailed code instead of a password

This is useful both as a secondary login option and as part of the stronger secure-login flow.

### 10. Three-Way Authentication

The current three-way authentication flow is:

1. password
2. one-time email code
3. TOTP authenticator code

This flow is implemented through:

- `beginSecureLogin(username, password)`
- `verifySecureLoginCode(pendingLoginId, code)`
- `finishSecureLogin(pendingLoginId, totpCode)`

Important implementation details:

- users still begin from the regular `LOGIN` button
- after the password step, the backend decides whether the account has three-way authentication enabled
- if it is enabled, the frontend automatically continues into:
  - email code verification
  - authenticator verification
- if it is not enabled, the frontend falls back to normal password login

This means users do not need a separate login entry point for secure login anymore.

### 11. Authenticator / TOTP Setup

Users can enable authenticator verification from the dashboard.

Implemented behavior:

- the backend generates a TOTP secret
- the backend also generates an `otpauth://` URI
- the frontend renders a QR code for enrollment
- the user scans the QR code in Microsoft Authenticator or another TOTP app
- the user confirms setup by entering the current 6-digit code

Supporting operations include:

- `totpEnabled`
- `startTotpSetup`
- `finishTotpSetup(code)`

This approach works over LAN/IP because it does not rely on WebAuthn or hostname-restricted passkey flows.

## Data Management Features

### Pagination

CD lists are loaded in pages through `pagedCds(page, size)`.

The frontend:

- requests page 1 initially
- stores current page
- tracks total count
- calculates `hasMore`
- prefetches the next page in advance

This behavior is implemented in [useCDPagination.js](D:/Disclio/DisclioApp/disclioapp.client/src/hooks/useCDPagination.js).

### Local CD Cache

The same hook also persists CD data in `localStorage`:

- `cached_cds`
- `cached_cds_total`

When the server fetch fails:

- the app falls back to cached CDs
- the UI can still show the latest locally-known state

### Offline Mutation Support

When offline, write operations are queued in IndexedDB rather than dropped.

Stored queue behaviors include:

- add request to queue with timestamp
- retrieve queued operations
- delete synced operation

The queue uses:

- DB name: `CDAppDB`
- store name: `offlineMutations`

Implemented in [offlineSupport.js](D:/Disclio/DisclioApp/disclioapp.client/src/hooks/offlineSupport.js).

### Offline Create / Update / Delete UX

When the device is offline:

- add CD is applied locally with a temporary negative ID
- update CD is applied to cached data
- delete CD is applied to cached data
- queued requests are replayed later when the connection comes back

The app also prevents duplicate sync loops using an `isSyncingRef`.

## Real-Time and Background Features

### 1. Real-Time Chat

The chat module supports:

- verifying the recipient user before chatting
- loading historical messages
- publishing new messages over STOMP
- receiving messages live from a public topic

Implemented behavior:

- recipient must exist before the chat becomes active
- Enter key sends messages
- messages are visually separated into sent vs received bubbles

The chat history is fetched through GraphQL and live delivery uses WebSocket/STOMP.

### 2. Live CD Refresh

The user dashboard subscribes to `/topic/cds`.

When new CDs are pushed through the topic:

- the dashboard triggers `refresh()`
- paginated CD data is reloaded

This keeps the gallery in sync with automated generator activity.

### 3. Automatic CD Generator

The backend includes generator functionality for adding CDs automatically.

GraphQL actions:

- `startGenerator`
- `stopGenerator`

Important access rule:

- generator control is admin-only on the backend
- generator button visibility is admin-only on the frontend

The frontend dashboard now hides the generator controls for non-admin users.

## Admin and Monitoring Features

### 1. Admin Dashboard

The admin dashboard contains two major sections:

- Observation List
- System Logs

Implemented in [AdminDashboard.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/dashboard/AdminDashboard.jsx).

### 2. Observation List

The observation list shows suspicious users or suspicious behavior detected by monitoring rules.

Each row contains:

- target username
- detection timestamp
- reason

### 3. System Logs

The logs section supports:

- paginated log viewing
- newest entries first
- infinite scrolling using `IntersectionObserver`
- admin-only access

Displayed log data includes:

- user ID
- role
- timestamp
- action description

### 4. Empty and Error States

Admin pages include explicit UI states for:

- scanning / loading
- no suspicious activity
- no logs yet
- access denied
- end of historical log list

### 5. Manual and Automatic Log Support

The schema includes:

- `getSystemLogs`
- `pagedSystemLogs`
- `totalLogCount`
- `createManualLog`

The backend also contains logging-related infrastructure and suspicious-user tracking models.

## Statistics Features

The application exposes statistics for:

- ratings distribution
- song-count frequency across CDs

GraphQL queries:

- `ratingStats`
- `songFrequencyStats`

The frontend transforms these into Recharts-friendly data maps and renders them visually in the statistics views.

## Networking, HTTPS, and LAN Access

### HTTPS

Both frontend and backend are configured for HTTPS development.

Backend:

- Spring Boot serves on port `8443`
- SSL configuration is read from `application.properties`
- PKCS12 keystore is supported

Frontend:

- Vite can read a PKCS12/PFX file from environment config
- Vite serves on port `5173`
- HMR is configured for secure WebSocket usage

### LAN Access

The project has been adjusted to allow access from other devices on the same local network:

- backend binds to `0.0.0.0`
- frontend host is configurable
- CORS and WebSocket allowed-origin patterns include LAN-style origins
- Vite can auto-open a LAN HTTPS URL

### Auto-Resolved API Base URL

Frontend API behavior:

- if `VITE_API_BASE_URL` is set, it uses that
- otherwise it builds the backend URL from the current page protocol and hostname, targeting port `8443`

This is implemented in [client.js](D:/Disclio/DisclioApp/disclioapp.client/src/api/client.js).

## GraphQL API Overview

### Main Queries

- `cds`
- `cd(id)`
- `pagedCds(page, size)`
- `totalCount`
- `ratingStats`
- `songFrequencyStats`
- `songsByCd(cdId)`
- `me`
- `userExists(username)`
- `getChatHistory(user1, user2)`
- `totpEnabled`
- `getSystemLogs`
- `pagedSystemLogs(page, size)`
- `totalLogCount`
- `getObservationList`

### Main Mutations

- `addCD(...)`
- `updateCD(...)`
- `deleteCD(id)`
- `addSong(...)`
- `deleteSong(id)`
- `startGenerator`
- `stopGenerator`
- `login(username, password)`
- `beginSecureLogin(username, password)`
- `verifySecureLoginCode(pendingLoginId, code)`
- `finishSecureLogin(pendingLoginId, totpCode)`
- `requestEmailLoginCode(identifier)`
- `loginWithEmailCode(identifier, code)`
- `startTotpSetup`
- `finishTotpSetup(code)`
- `signup(...)`
- `logout`
- `requestPasswordReset(identifier)`
- `resetPassword(token, newPassword)`
- `createManualLog(...)`

## Data Storage Overview

### SQL Server

Relational data stored in SQL Server includes:

- users
- roles
- permissions
- role-permission links
- auth sessions
- password reset tokens
- email login codes
- CDs
- songs
- logs
- observation list

User authentication state also stores TOTP-related fields in SQL Server, including whether authenticator verification is enabled and the associated secret.

### MongoDB

MongoDB is used for chat message persistence and retrieval.

### Browser Storage

Client-side storage currently used:

- `localStorage`
  - cached CDs
  - cached total count
- `sessionStorage`
  - password recovery flow persistence
  - email-code login flow persistence
  - three-way login flow persistence
- IndexedDB
  - queued offline mutations

## Testing

### Backend

Backend tests include:

- application boot test
- repository tests
- service tests
- auth service tests

Examples:

- [AuthServiceTest.java](D:/Disclio/DisclioApp/DisclioApp.Server/src/test/java/com/example/DisclioApp/Server/service/AuthServiceTest.java)

Covered behaviors include:

- password hashing on registration
- session creation on login
- invalid password rejection
- email login code creation and verification
- three-way login progression
- TOTP setup and verification
- reset token creation
- password reset revoking sessions

### Frontend

Frontend tests include:

- auth flow tests
- email-code login tests
- three-way login tests
- dashboard permission tests
- admin dashboard tests
- route/auth tests
- grid/master view behavior tests

Examples:

- [AuthView.test.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/authentication/AuthView.test.jsx)
- [DashboardView.test.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/dashboard/DashboardView.test.jsx)
- [AdminDashboard.test.jsx](D:/Disclio/DisclioApp/disclioapp.client/src/views/dashboard/AdminDashboard.test.jsx)

## Configuration

### Backend Configuration

Important backend properties currently include:

- datasource URL / username / password
- MongoDB host / port / database
- JWT secret
- access token lifetime
- inactivity timeout
- password reset token lifetime
- email login code lifetime
- secure cookie settings
- SMTP mail settings
- HTTPS keystore settings
- bind address

Most security-sensitive properties are designed to be overridable through environment variables.

### Frontend Configuration

Important frontend configuration includes:

- `VITE_API_BASE_URL`
- `VITE_SSL_PFX_PATH`
- `VITE_SSL_PFX_PASSPHRASE`
- `VITE_DEV_HOST`

## How to Run

### Backend

From:

- [DisclioApp.Server](D:/Disclio/DisclioApp/DisclioApp.Server)

Run:

```cmd
.\mvnw.cmd spring-boot:run
```

Or start from IntelliJ with the required environment variables.

### Frontend

From:

- [disclioapp.client](D:/Disclio/DisclioApp/disclioapp.client)

Run:

```cmd
npm install
npm run dev
```

### Tests

Backend:

```cmd
cd D:\Disclio\DisclioApp\DisclioApp.Server
.\mvnw.cmd test
```

Frontend:

```cmd
cd D:\Disclio\DisclioApp\disclioapp.client
npm test -- --run
```

Production-like frontend build:

```cmd
npm run build
```

## Current Implementation Notes

### 1. Password Recovery Delivery

Password recovery is implemented with real email sending through Spring Mail. Delivery speed depends on the SMTP provider and recipient mailbox. Delays may come from the email provider rather than token generation itself.

### 2. Three-Way Authentication Over LAN

The active strong-authentication implementation is based on:

- password
- email code
- TOTP authenticator code

This was chosen because it works reliably over LAN/IP deployments. It does not require DNS-based hostnames the way WebAuthn/passkey-based browser flows do.

### 3. Self-Signed HTTPS Development

When using a local self-signed certificate:

- browsers may show trust warnings
- other devices on the LAN may require certificate trust setup
- `Not secure` in the browser UI can still mean the page is being served over HTTPS but with an untrusted local certificate

### 4. Admin-Only Generator Controls

The backend enforces generator permissions, and the frontend now mirrors that by hiding the controls for non-admin users.

### 5. Offline Experience

Offline mutations are not silently lost:

- they are queued
- reflected locally
- retried after reconnection

This is one of the most important quality-of-life behaviors in the current implementation and is easy to miss if only looking at the high-level UI.
