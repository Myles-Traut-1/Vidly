# Vidly

Vidly is a Node.js + Express REST API for managing a movie rental business. It allows a user to register and log in, browse movie-related data, create and update customers and genres, rent movies, and process returns.

This project is a classic example API used to teach backend application patterns: routing, validation, authentication, authorization, MongoDB integration, Mongoose models, and transaction-safe operations.

If you are new to the codebase, think of it as a small service that exposes business logic over HTTP. Clients (web apps, mobile apps, or other services) send requests to the API, and the API reads and writes data in MongoDB.

---

## What this application does

At a high level, Vidly handles:

- User registration and login
- JWT-based authentication
- Admin-only actions
- Movie catalog management
- Customer management
- Movie rental creation and return processing
- Validation and error handling

The app is not a frontend app. It is only the backend API layer.

---

## Tech stack

This project uses:

- Node.js
- Express.js for routing and HTTP handling
- MongoDB with Mongoose for persistence
- JWT for authentication
- Joi for request validation
- Winston for logging
- Jest + Supertest for testing
- MongoMemoryReplSet for integration tests

---

## Project structure

```text
vidly/
├── config/                     # Application configuration files
│   ├── config.js               # Ensures required env/config values exist
│   ├── default.json            # Default app config
│   ├── development.json        # Dev-specific config
│   ├── test.json               # Test-specific config
│   └── custom-environment-variables.json
├── db/
│   └── db.js                   # MongoDB connection logic
├── logs/                       # Application log files
├── middleware/                 # Express middleware for auth, validation, etc.
│   ├── admin.js                # Checks if user is admin
│   ├── auth.js                 # Validates JWT token
│   ├── error.js                # Global error handler
│   ├── validate.js             # Generic Joi validation helper
│   └── validateObjectId.js     # Ensures a valid Mongo ObjectId is passed
├── models/                     # Mongoose schemas and models
│   ├── customer.js             # Customer schema/model
│   ├── genre.js                # Genre schema/model
│   ├── movies.js               # Movie schema/model
│   ├── rentals.js              # Rental schema/model with static methods
│   └── user.js                 # User schema/model and auth token generation
├── routes/                     # API endpoints grouped by resource
│   ├── auth.js                 # Register/login/me routes
│   ├── customers.js            # Customer CRUD routes
│   ├── genres.js               # Genre CRUD routes
│   ├── movies.js               # Movie CRUD routes
│   ├── rentals.js              # Rental creation and listing routes
│   ├── returns.js              # Return processing
│   └── index.js??              # Not present in this project
├── tests/                      # Automated tests
│   ├── integration/            # End-to-end HTTP tests against API routes
│   └── unit/                   # Focused unit tests for config/auth/db/error logic
├── utils/
│   ├── logger.js               # Winston logger setup
│   └── utils.js                # Validation functions used by routes
├── index.js                    # Entry point; app setup and route mounting
├── package.json                # Scripts and dependencies
├── readMe.md                   # Project documentation
└── coverages etc               # Generated from tests
```

---

## How the app starts

The application entry point is [index.js](index.js).

That file does the following:

1. Creates the Express app
2. Loads configuration
3. Connects to MongoDB
4. Adds middleware like JSON parsing and Helmet
5. Mounts resource routes under /api
6. Adds the global error handler
7. Starts the server on port 3000 or whichever port is defined in the environment

Important startup flow:

```js
require("./config/config")();
require("./db/db")();
```

This means the app validates configuration first, then connects to MongoDB before serving requests.

---

## Configuration

The app uses the `config` package to manage runtime configuration.

Relevant file:

- [config/default.json](config/default.json)
- [config/custom-environment-variables.json](config/custom-environment-variables.json)
- [config/config.js](config/config.js)

The default config includes:

```json
{
  "name": "Vidly",
  "jwtPrivateKey": "",
  "db": "mongodb://127.0.0.1:27017/Vidly?directConnection=true"
}
```

Important:

- `jwtPrivateKey` must be set or the app will fail at startup.
- The app expects a MongoDB instance running locally on localhost:27017.
- In development, you may set the JWT key in environment variables or update the config file.

The app checks for a valid JWT secret in [config/config.js](config/config.js):

```js
if(!config.get("jwtPrivateKey")) {
    throw new Error("FATAL ERROR... jwtPrivateKey not set");
}
```

This is a useful place to look if the app crashes immediately on startup.

---

## Database and models

MongoDB is used as the primary data store.

The database connection is established in [db/db.js](db/db.js):

```js
mongoose.connect(db)
```

The app uses Mongoose schemas located in [models](models).

### Core models

#### Genre

Stored in [models/genre.js](models/genre.js)

- Contains a `name` field
- Used to group movies by category like Comedy, Action, Drama

#### Customer

Stored in [models/customer.js](models/customer.js)

- Includes `name`, `phone`, and `isGold`
- Represents someone who rents movies

#### Movie

Stored in [models/movies.js](models/movies.js)

- Includes `title`, `genre`, `numberInStock`, and `dailyRentalRate`
- Stores embedded genre data for convenience in rental records

#### Rental

Stored in [models/rentals.js](models/rentals.js)

- Stores a customer snapshot and movie snapshot
- Tracks `dateOut`, `dateReturned`, and `rentalFee`
- Includes custom static and instance methods:
  - `lookup(customerId, movieId)`
  - `return()`

This is a great example of business logic living near the model rather than in route handlers.

#### User

Stored in [models/user.js](models/user.js)

- Stores `name`, `email`, `password`, and `isAdmin`
- Includes `generateAuthToken()` which creates a signed JWT

---

## Authentication and authorization

Authentication is handled by [middleware/auth.js](middleware/auth.js).

This middleware:

- Reads the `x-auth-token` header
- Verifies the JWT
- Adds the decoded user payload to `req.user`
- Rejects requests without a token or with an invalid token

Example behavior:

```js
const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
req.user = decoded;
```

This means each authenticated request can later check properties such as:

- `req.user._id`
- `req.user.isAdmin`

Admin authorization is checked by [middleware/admin.js](middleware/admin.js):

```js
if(!req.user.isAdmin) {
    return res.status(403).send("Access Denied!");
}
```

The routes for delete operations often require both `auth` and `admin` middleware.

---

## API routes

All routes are mounted in [index.js](index.js), usually under `/api/...`.

### Authentication routes

File: [routes/auth.js](routes/auth.js)

#### GET /api/auth/me

- Requires valid JWT
- Returns the current logged-in user without the password

#### POST /api/auth/register

- Validates user input
- Checks if email already exists
- Hashes the password with bcrypt
- Saves the new user
- Returns the user info and JWT

#### POST /api/auth/login

- Validates credentials
- Finds user by email
- Compares password hash
- Returns a JWT token

---

### Genres

File: [routes/genres.js](routes/genres.js)

Routes:

- GET /api/genres
- GET /api/genres/:id
- POST /api/genres
- PUT /api/genres/:id
- DELETE /api/genres/:id

Behavior:

- Each genre has a name
- Names are normalized to lowercase on save/update
- Only authenticated users can create/update
- Admin users can delete

---

### Customers

File: [routes/customers.js](routes/customers.js)

Routes:

- GET /api/customers
- GET /api/customers/:id
- POST /api/customers
- PUT /api/customers/:id
- DELETE /api/customers/:id

Behavior:

- Creates customer records with a name, phone number, and `isGold` flag
- Uses validation via Joi
- Requires auth for create/update/delete
- Requires admin for delete

---

### Movies

File: [routes/movies.js](routes/movies.js)

Routes:

- GET /api/movies
- GET /api/movies/:id
- POST /api/movies
- PUT /api/movies/:id
- DELETE /api/movies/:id

Behavior:

- Validates `genreId`
- Finds the referenced genre
- Saves a movie with embedded genre data
- Keeps inventory count via `numberInStock`
- Requires auth to create/update
- Requires admin to delete

---

### Rentals

File: [routes/rentals.js](routes/rentals.js)

Routes:

- GET /api/rentals
- GET /api/rentals/:id
- POST /api/rentals
- DELETE /api/rentals/:id

Important behavior:

- When a rental is created, the API checks that the customer exists
- It also checks the movie is in stock using a MongoDB transaction
- It decrements `numberInStock` in the movie record
- It creates a rental record containing a snapshot of the customer and movie data
- Uses `mongoose.startSession()` and `session.startTransaction()` to protect data consistency

This is a very good example of transactional updates in MongoDB.

---

### Returns

File: [routes/returns.js](routes/returns.js)

Routes:

- POST /api/returns

Behavior:

- Finds the active rental using `Rental.lookup(customerId, movieId)`
- Prevents duplicate processing
- Calls the rental instance method `return()` to set the return date and calculate fees
- Increments `numberInStock` on the related movie
- Saves the rental and updates inventory in a transaction

This route ties together the model logic and database consistency patterns.

---

## Validation layer

Request validation is centralized in [utils/utils.js](utils/utils.js) and applied through [middleware/validate.js](middleware/validate.js).

This pattern keeps route files focused on business logic instead of repeated validation code.

Examples:

- `validateGenre()` checks the format of a genre name
- `validateMovie()` checks title, genreId, stock count, and rental rate
- `validateRental()` checks required IDs
- `validateRegistration()` and `validateLogin()` check user input

If validation fails, the app responds with a 400 status and the first Joi error message.

---

## Error handling

The global error handling middleware is in [middleware/error.js](middleware/error.js).

This middleware is attached in [index.js](index.js) and catches exceptions thrown by Express routes or custom logic.

The project also uses Winston logging in [utils/logger.js](utils/logger.js) so errors can be written to log files under the [logs](logs) directory.

---

## Testing

The project includes both integration and unit tests under [tests](tests).

Examples:

- [tests/integration/routes/genres.test.js](tests/integration/routes/genres.test.js)
- [tests/integration/routes/auth.test.js](tests/integration/routes/auth.test.js)
- [tests/unit/config/config.test.js](tests/unit/config/config.test.js)

The test setup uses an in-memory MongoDB replica set via `mongodb-memory-server`.

This means the tests can run without a local MongoDB database installed.

### Running tests

Because the package script includes watch mode, use a direct Jest invocation for a clean one-time run:

```bash
npx jest --runInBand --watchAll=false --coverage
```

or, if you want to use the package script, you can also run:

```bash
npm test
```

Be aware that `npm test` is configured as a watch-based command, so it is usually better for local development than for CI-style test execution.

---

## How to run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB

Make sure MongoDB is running locally at:

```text
mongodb://127.0.0.1:27017/Vidly?directConnection=true
```

If you do not have MongoDB installed locally, use Docker or another MongoDB instance and update the config file.

### 3. Set JWT secret

The app requires a JWT private key.

Either:

- update [config/default.json](config/default.json), or
- set an environment variable based on [config/custom-environment-variables.json](config/custom-environment-variables.json)

### 4. Start the app

```bash
node index.js
```

or for development:

```bash
npx nodemon index.js
```

### 5. Server port

The app listens on port 3000 by default unless a `PORT` environment variable is set.

---

## Typical request flow

A typical request to create a genre looks like this:

```http
POST /api/genres
x-auth-token: <jwt>
Content-Type: application/json

{
  "name": "Action"
}
```

The flow is:

1. Request reaches Express route
2. `auth` middleware verifies the JWT
3. `validate(validateGenre)` checks the body
4. Route creates a `Genre` instance
5. Mongoose saves it to MongoDB
6. Response is sent back to the client

This pattern repeats throughout the app.

---

## Working on this project as a junior developer

When making changes, use this workflow:

### 1. Understand the feature by route

Look for the resource you are changing, for example:

- [routes/genres.js](routes/genres.js) for genre logic
- [routes/movies.js](routes/movies.js) for movie logic
- [routes/rentals.js](routes/rentals.js) for rental logic

### 2. Check the model

Find the corresponding Mongoose model in [models](models) and read the schema before changing a route.

### 3. Validate the request shape

Most request validation lives in [utils/utils.js](utils/utils.js). If the API rejects a request, check the validator and the Joi schema first.

### 4. Consider middleware order

Pay attention to route definitions like:

```js
router.post('/', [auth, validate(validateGenre)], async (req, res) => { ... })
```

This means the request must pass authentication before validation, and validation before saving data.

### 5. Add or update tests

Whenever you implement a new API behavior or fix a bug, add a corresponding test in [tests](tests). This project already follows that pattern, so follow it.

### 6. Keep business logic close to the model when possible

The rental and user models are good examples of logic placed on the model itself rather than scattering it across routes.

---

## Common troubleshooting tips

### App fails with "jwtPrivateKey not set"

Check [config/default.json](config/default.json) and make sure the value is populated.

### Cannot connect to MongoDB

- Verify MongoDB is running
- Check the DB URL in [config/default.json](config/default.json)
- Confirm no port mismatch or firewall issue

### Request returns 401

The request is missing or has an invalid `x-auth-token` header.

### Request returns 403

The token is valid, but the user is not an admin.

### Validation errors happen unexpectedly

Check the exact Joi schema in [utils/utils.js](utils/utils.js) and compare it to the payload being sent.

---

## Good files to read first

If you are new to this project, start in this order:

1. [index.js](index.js) — server setup and route registration
2. [routes/auth.js](routes/auth.js) — authentication flow and token generation
3. [middleware/auth.js](middleware/auth.js) — token verification
4. [models/user.js](models/user.js) — user model and JWT creation
5. [routes/genres.js](routes/genres.js) — basic CRUD pattern
6. [routes/rentals.js](routes/rentals.js) — more advanced transaction example
7. [tests/integration/routes/genres.test.js](tests/integration/routes/genres.test.js) — how expected behavior is verified

---

## Summary

Vidly is a backend API for a movie rental system that demonstrates common enterprise-style patterns in a compact project:

- REST API structure
- Express routing
- MongoDB schemas and transactions
- Validation
- Authentication and authorization
- Logging and error handling
- Testing with Jest and Supertest

This project is small enough to understand quickly, but rich enough to teach the fundamentals of building real backend services in Node.js.

If you are reading the code for the first time, focus on the flow: route -> middleware -> validation -> model -> MongoDB -> response.

That is the main pattern used across the entire application.
