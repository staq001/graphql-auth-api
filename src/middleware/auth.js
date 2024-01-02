const jwt = require('jsonwebtoken')
const User = require('../models/user')



module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization')
  if (!authHeader) {
    req.isAuth = false
    return next()
  }
  const token = authHeader.split(" ")[1] // Bearer tokenvalue
  if (!token || token === "") {
    req.isAuth = false
    return next()
  }
  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.JWTSECRET)
  } catch (e) {
    req.isAuth = false
    return next()
  }
  if (!decodedToken) {
    req.isAuth = false
    return next()
  }

  req.isAuth = true
  req.userId = decodedToken.userId
  const user = await User.findOne({ _id: decodedToken.userId })
  req.user = user

  next()
}