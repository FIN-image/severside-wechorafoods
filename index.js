const express = require("express");
const mongoose = require('mongoose');
const User = require("./others/user"); 
// const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const cors = require('cors')
const jwt = require('jsonwebtoken');
const extractUserId = require('./others/extractUserId');

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
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return bmr;
};

// Registration route
app.post('/api/register', async (req, res) => {
    const { firstname, lastname, username, email, password, confirm_password, gender, weight, height, age} = req.body;
  
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
  
      // Create new user
      const newUser = new User({
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

        // Return JWT to client
        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Dashboard route
app.get('/api/dashboard', extractUserId, async (req, res) => {
  const userId = req.userId; // have middleware to extract userId from JWT

  try {
      // Find user by userId
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send user data and BMR to client
      res.status(200).json({
          name: user.firstname,
          bmr: user.bmr,
          message: 'Dashboard data retrieved successfully'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});
  
// Routes
app.get("/", (req, res) => { 
    console.log('i am running');
    res.status(200).send('Hello, World! ');
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

