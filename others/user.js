const mongoose = require('mongoose');
const sequencing = require('./sequence');

// User Schema
const userSchema = new mongoose.Schema({
  _id: Number,
  userType: String,
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

// Middleware to auto-increment _id
userSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      this._id = await sequencing.getNextSequenceValue('user');
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Fitness Schema
const fitnessSchema = new mongoose.Schema({
  _id: Number,
  fitnessName: String,
  fitnessAddress: String,
  fitnessContact: String,
  fitnessEmail: String,
  fitnessWebsite: String,
  fitnessInstagram: String,
  fitnessFacebook: String,
  fitnessImage: String,
});

// Middleware to auto-increment _id for fitness
fitnessSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      this._id = await sequencing.getNextSequenceValue('question');
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Question Schema
const questionSchema = new mongoose.Schema({
  _id: Number,
  question: String,
  optionA: String,
  optionB: String,
  optionC: String,
  optionD: String,
});

// Middleware to auto-increment _id for questions
questionSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      this._id = await sequencing.getNextSequenceValue('question');
    } catch (error) {
      return next(error);
    }
  }
  next();
});


// Video Schema **************************************************************************************************
const videoFileSchema = new mongoose.Schema({
  _id: Number,
  video: String,
})

// Middleware to auto-increment _id for video
videoFileSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      this._id = await sequencing.getNextSequenceValue('video');
    } catch (error) {
      return next(error);
    }
  }
  next();
});



// Models
const User = mongoose.model('User', userSchema);
const Fitness = mongoose.model('Fitness', fitnessSchema);
const Question = mongoose.model('Question', questionSchema);
const Video = mongoose.model('Video', videoFileSchema);

module.exports = {
  User,
  Fitness,
  Question,
  Video,
};
