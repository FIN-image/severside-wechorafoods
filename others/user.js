const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: String,
  email: String,
  password: String,
  confirm_password: String,
  weight: String,
  height: String,
  age: String,
  gender: String,
  bmr: String,
  bmi: String,
  tdee: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
