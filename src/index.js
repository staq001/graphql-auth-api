const express = require('express')
const bcrypt = require('bcryptjs')
const { buildSchema } = require('graphql')
require('./db/mongoose.js')
const User = require('./models/user.js')
const { graphqlHTTP } = require('express-graphql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const auth = require('./middleware/auth.js')


const app = express()
const port = process.env.PORT || 2500

app.use(auth) // this wil run on every incoming request.

app.use(bodyParser.json())


app.use('/graphql', graphqlHTTP({
  schema: buildSchema(`
  type User {
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    sex: String!
    password: String!
  }

  type AuthData {
    userId: ID!
    token: String!
    tokenExpiration: Int!
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: String!
    sex: String!
    password: String!
  }

  input UserInputNull {
    firstName: String
    lastName: String
    email: String
    sex: String
  }

  input UserPass {
    password: String!
  }


  type RootQuery {
    getAllUsers: [User!]!
    authUser: User!
    login(email: String!, password: String!): AuthData!
  }
  
  type RootMutation {
    createUser(userInput: UserInput): User!
    deleteUser: User!
    updateUser(userInput: UserInputNull): User!
    updatePassword(userInput: UserPass): User!
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
  `),

  rootValue: {
    getAllUsers: async () => {
      return await User.find({})
    },

    // return User profile.
    authUser: async (args, req) => {
      try {
        return req.user
      } catch (e) {
        console.log(e)
      }
    },

    // create User
    createUser: async (args) => {
      const password = await bcrypt.hash(args.userInput.password, 8)
      try {
        const user = new User({
          firstName: args.userInput.firstName,
          lastName: args.userInput.lastName,
          email: args.userInput.email,
          sex: args.userInput.sex,
          password
        })
        await user.save()
        return user
      } catch (e) {
        throw new Error(`User not created: ${e}`)
      }
    },

    // update User
    updateUser: async (args, req) => {
      if (!req.isAuth) {
        throw new Error("Please authenticate")
      }
      try {
        const user = await User.findByIdAndUpdate(req.userId, {
          firstName: args.userInput.firstName,
          lastName: args.userInput.lastName,
          email: args.userInput.email,
          sex: args.userInput.sex,
        }, { new: true, runValidators: true })
        return user
      } catch (e) {
        throw new Error(`Something went wrong ${e}`)
      }
    },

    // update password
    updatePassword: async (args, req) => {
      if (!req.isAuth) {
        throw new Error("Please Authenticate!")
      }

      try {
        const user = User.findByIdAndUpdate(req.userId, {
          password: await bcrypt.hash(args.userInput.password, 8)
        })
      } catch (e) {
        throw new Error(`Somehting went wrong ${e}`)
      }
    },

    // delete User
    deleteUser: async (args, req) => {
      if (!req.isAuth) {
        throw new Error("Please authenticate")
      }
      try {
        return req.user.remove()
      } catch (e) {
        throw new Error(`User not deleted: ${e}`)
      }
    },

    // login User
    login: async ({ email, password }) => {
      try {
        const user = await User.findOne({ email })
        if (!user) {
          throw new Error("User do not exist")
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
          throw new Error("Password is incorrect")
        }
        const token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWTSECRET, { expiresIn: "1h" })
        return { userId: user._id, token: token, tokenExpiration: 1 }
      } catch (e) {
        throw new Error(`Could not login: ${e}`)
      }
    }
  },
  graphiql: true
}))

app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
})