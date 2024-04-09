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

  const getUserQuery = `SELECT * FROM user WHERE username = '${username}';`
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

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username = '${username}'
  `
  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    // console.log(dbUser)
    const passwordValidation = await bcrypt.compare(password, dbUser.password)
    if (passwordValidation === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const getUserQuery = `
  SELECT 
    *
  FROM
    user
  WHERE
    username = '${username}';
  `
  const dbUser = await db.get(getUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isCorrectPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isCorrectPassword) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const newHashPassword = await bcrypt.hash(newPassword,10)
        const updatePasswordQuery = `
        UPDATE 
          user
        SET
          password = '${newHashPassword}';
        `
        await db.run(updatePasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app