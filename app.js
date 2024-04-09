const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
const PORT = 3000
db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(PORT, () => {
      console.log(`Server Started at port ${PORT}`)
    })
  } catch (e) {
    console.log(`ERROR: ${e}`)
  }
}
initializeDBandServer()

//API 1

app.post('/register', async (request, response) => {
  const userDetails = request.body
  const {username, name, password, gender, location} = userDetails

  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUserQuery)
  if (dbUser === undefined) {
    //add new user
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashPassword = await bcrypt.hash(password, 10)
      const addUserQuery = `
            INSERT INTO
                user(username, name, password, gender, location)
            VALUES
                (
                    '${username}',
                    '${name}',
                    '${hashPassword}',
                    '${gender}',
                    '${location}'
                );
            `
      await db.run(addUserQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
