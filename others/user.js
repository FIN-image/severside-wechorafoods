const mongoose = require('mongoose');
const sequencing = require('./sequence');

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

userSchema.pre("save", function(next){
  let doc = this;
  sequencing.getSequenceNextValue("user_id")
  .then(counter => {
    console.log("infuse", counter);
    if(!counter){
      sequencing.insertCounter("user_id")
      .then(counter => {
        doc._id = counter;
        console.log(doc)
        next();
      })
      .catch(error => next(error))
    }else{
      doc._id = counter;
      next();
    }
  })
  .catch(error => next(error))
});

const fitnessSchema = new mongoose.Schema({
  fitnessName: String,
  fitnessAddress: String,
  fitnessContact: String,
  fitnessEmail: String,
  fitnessWebsite: String,
  fitnessInstagram: String,
  fitnessFacebook: String,
  fitnessImage: String,
})

const User = mongoose.model('User', userSchema);
const Fitness = mongoose.model('Fitness', fitnessSchema);

module.exports = {
  User,
  Fitness,
};