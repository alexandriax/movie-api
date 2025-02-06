# myFlix API
an API that provides data about movies, directors, and genres. Allows users to create accounts, update their profiles, and manage their list of favorite movies. 

### Features
- user authentication
- browse a collection of movies
- get details about movies, genres, and directors
- add and remove favorite movies
- update user profile details
- secure authentication with jwt

### Technologies Used
- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js & JWT
- JSDoc
- Heroku

### Setup
**clone the repository**
`git clone https://github.com/alexnadriax/movie-api.git cd movie-api`

**install dependencies**
`npm install`

### Available Endpoints
- GET /movies 
- GET /movies/:id
- GET /movies/genre/:genreName
- GET /movies/director/:name
- POST /users
- POST /login
- GET /users/:username
- PUT /users/:userId
- POST /users/:userId/movies/:id
- DELETE /users/:userId/movies/:id
- DELETE /users/:username

---

Latest version hosted [here](https://alexandriax.github.io/myFlix-Angular-client/welcome)