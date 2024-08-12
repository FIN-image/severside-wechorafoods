const express = require("express");
const mongoose = require('mongoose');
const User = require("./others/user"); 
const Payment = require("./others/payment"); 
// const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const extractUserId = require('./others/extractUserId');
const nodemailer = require('nodemailer');

const app = express();
// app.use(bodyParser.json());

app.use(cors())


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error);
});

// Middleware
app.use(express.json()); // Parse JSON bodies

// Calculate BMR based on user's data
const calculateBMR = (gender, weight, height, age) => {
  let bmr;
  if (gender === 'Male') {
      bmr = Math.ceil(10 * weight + 6.25 * height - 5 * age + 5);
  } else {
      bmr = Math.ceil(10 * weight + 6.25 * height - 5 * age - 161);
  }
  return bmr;
};

const calculateBMI = (gender, height, weight) => {
  let bmi;
  if (gender === 'Male') {
      bmi = Math.ceil(weight / ((height / 100) ** 2));
  } else {
      bmi = Math.ceil(weight / ((height / 100) ** 2));
  }
  return bmi;
};

const calculateTDEE = (bmr, activity_level) => {
  let tdee;
  let dee;
  if (activity_level === "sedentary"){
    dee = bmr * 1.2;
    tdee = Math.ceil(dee * 100) / 100;
  }else if (activity_level === "lightlyActive"){
    dee = bmr * 1.375;
    tdee = Math.ceil(dee * 100) / 100;
  }else if (activity_level === "moderatelyActive"){
    dee = bmr * 1.55;
    tdee = Math.ceil(dee * 100) / 100;
  }else if (activity_level === "veryActive"){
    dee = bmr * 1.725;
    tdee = Math.ceil(dee * 100) / 100;
  }else if(activity_level === "extraActive"){
    dee = bmr * 1.95;
    tdee = Math.ceil(dee * 100) / 100;
  }
  return tdee;
};

// Average BMI Calculation
const BMI_Average = (bmi, firstname) => {
  let classification;
  let bmiAverage;
  let remark;
  let user;
  let greeting;
  let difference;

  const differentAverage ={
      "values": [
        {
          "protein": 19.9,
          "fats": 12.1,
          "energy": 11.5,
          "minerals": 21.0,
          "vitamins": 12.5
        },
        {
          "protein": 35.0,
          "fats": 7.5,
          "energy": 28.4,
          "minerals": 17.5,
          "vitamins": 15.25
        },
        {
          "protein": 25.0,
          "fats": 8.0,
          "energy": 42.5,
          "minerals": 4.5,
          "vitamins": 21.0
        },
        {
          "protein": 16.5,
          "fats": 26.0,
          "energy": 7.5,
          "minerals": 12.0,
          "vitamins": 7.5
        },
        {
          "protein": 2.5,
          "fats": 0.75,
          "energy": 3.5,
          "minerals": 24.0,
          "vitamins": 1.5
        },
        {
          "protein": 0.0,
          "fats": 45.0,
          "energy": 4.5,
          "minerals": 0.0,
          "vitamins": 12.5
        },
      ],
      "labels": ["Food of animal origin", "Cereals", "Roots & Tubers", "Legumes, Pulses & Nuts", "Fruits & Vegetables", "Fats & Oils"]
    };

  if(bmi <= 21.7){
    classification = "Normal Range";
    bmiAverage = bmi;
    remark = "Average";
    user = firstname;
    greeting = "Congratulations";
    difference = "Your BMI appears to be in good shape. Please keep this weight in place."

  } else if(bmi <= 27.45){
    classification = "Over Weight";
    bmiAverage = bmi;
    remark = "Middle Increase";
    user = firstname;
    greeting = "Hello";
    difference = `Your BMI is "${classification}". You need to burn ${bmi - 21.7}kg of calories. We recommend that you visit the nearest fitness center around or click on the link below to subscribe to our meal plan.`;

  } else if(bmi <= 32.45){
    classification = "Obesity Class I";
    bmiAverage = bmi;
    remark = "Moderate";
    user = firstname;
    greeting = "Hello";
    difference = `Your BMI is "${classification}". You need to burn ${bmi - 21.7}kg of calories. We recommend that you visit the nearest fitness center around or click on the link below to subscribe to our meal plan.`;

  } else if(bmi <= 39.9){
    classification = "Obesity Class II";
    bmiAverage = bmi;
    remark = "Severe";
    user = firstname;
    greeting = "Hello";
    difference = `Your BMI is "${classification}". You need to burn ${bmi - 21.7}kg of calories. We recommend that you visit the nearest fitness center around or click on the link below to subscribe to our meal plan.`;

  } else if(bmi >= 40){
    classification = "Obesity Class III";
    bmiAverage = bmi;
    remark = "Very Severe";
    user = firstname;
    greeting = "Hello";
    difference = `Your BMI is "${classification}". You need to burn ${bmi - 21.7}kg of calories. We recommend that you visit the nearest fitness center around or click on the link below to subscribe to our meal plan.`;

  }
  return {classification, bmiAverage, remark, user, greeting, difference, differentAverage};
}

// Registration route
app.post('/api/register', async (req, res) => {
    const { userType, firstname, lastname, username, email, password, confirm_password, gender, weight, height, age, activity_level} = req.body;
  
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      if (password !== confirm_password) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Calculate BMR
      const bmr = calculateBMR(gender, weight, height, age);

      // Calculate BMI
      const bmi = calculateBMI(gender, height, weight);

      // Calculate TDEE
      const tdee = calculateTDEE(bmr, activity_level);
  
      // Create new user
      const newUser = new User({
        userType,
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        gender,
        weight,
        height,
        age,
        bmr,
        bmi,
        tdee,
      });
  
      // Save user to the database
      await newUser.save();
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error nn' });
    }
  });

  // Login route
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const userData = {
          userType: user.userType,
        }
        // Return JWT to client
        res.status(200).json({ token, user: userData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Dashboard route
app.get('/api/dashboard', extractUserId, async (req, res) => {
  const userId = req.userId; // userId extracted from JWT

  try {
      // Find user by userId in the database
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      
      const bmi = user.bmi
      const bmiAvg = BMI_Average(bmi)
      // Construct the response object with user data
      const userData = {
          name: user.username,
          username: user.username, // Use username instead of firstname for username
          email: user.email,
          age: user.age,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          bmr: user.bmr,
          bmi: user.bmi,
          tdee: user.tdee,
          bmiAvg: bmiAvg,
          message: 'Dashboard data retrieved successfully'
      };

      // Send the constructed user data as JSON response
      res.status(200).json(userData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});

// Email route
app.post('/api/email', async (req, res) => {
  try {
    const users = await User.find({});
    if (!users.length) {
      return res.status(404).json({ message: 'No users found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER,
        pass: process.env.PASS
      }
    });

    // Construct the email body
    let emailBody = "Esteem User, kindly use the link below to update your health information for the week. Thank you, ...Regards Wechora Foods";
    
    try {
      await transporter.sendMail({
        from: process.env.FROM,
        to: process.env.TO,
        subject: 'Latest Health Information',
        html: emailBody
      });
      res.sendStatus(200);
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Error sending email' });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});



  // try {
  //   const users = await User.find({});

  //   const hasBmi = users.some(user => {
  //     console.log(user.bmi)
  //   });
  //   return res.json({ status: "ok", message: "Email sent successful"});
  // } catch (error) {
  //   return res.status(500).json({ status: "error", message: error.message });
  // }


// Update route
app.post('/api/updateUser', extractUserId, async(req, res) => {
  const userId = req.userId
  const { name, weight, height, age, gender, activity_level, oldDate, newDate } = req.body;

  // Calculate BMR
  const bmr = calculateBMR(gender, weight, height, age);

  // Calculate BMI
  const bmi = calculateBMI(gender, height, weight);

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activity_level);

  try{
    await User.updateOne({_id: userId}, {
      $set: {
        name: name,
        weight: weight,
        height: height,
        age: age,
        gender: gender,
        oldDate: oldDate,
        newDate: newDate,
        bmr: bmr,
        bmi: bmi,
        tdee: tdee,
      }
    })
    return res.json({status: "ok", data: "updated"})
  } catch (error){
    return res.json({status: "error", data: error})
  }
});

// Define the routes
app.post('/api/payment', (req, res) => {
  const { subscriberName, email, planSubscribed, amount } = req.body;
  // Validate input
  if (!subscriberName || !email || !planSubscribed || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
  }
  User.findOne({ email: email })
  .then(user => {
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }
      Payment.create(req.body)
      .then(payment => res.json(payment))
      .catch(err => res.status(500).json({ error: "Internal server error" }));
  })
  .catch(err => res.status(500).json({ error: "Internal server error" }));
});

  
// Routes
app.get("/", (req, res) => { 
    console.log('i am running');
    res.status(200).send('Hello, World! ');
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

