const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
require('../db/mongoose.js')

const sex = ['male', "female", "others"]

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("invalid email!")
      }
    }
  },
  sex: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      const sex = ['male', 'female', 'others']
      const validSex = sex.some((s) => value === s)
      if (!validSex) {
        throw new Error('Invalid sex. Only "male", "female" and "others" are valid!')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('password contains word "password"')
      }
    }
  },
}, {
  timestamps: true
})


// userSchema.pre("save", async function (next) {
//   const user = this

//   if (user.isModified('password')) {
//     user.password = await bcrypt.hash(user.password, 8)
//   }
//   next()
// })

const User = mongoose.model('User', userSchema)


module.exports = User