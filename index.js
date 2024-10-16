const express = require("express");
const mongoose = require('mongoose');
const { User, Fitness, Question, Video, TestResult } = require('./others/user');
const Payment = require("./others/payment"); 
// const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const extractUserId = require('./others/extractUserId');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const { error } = require("console");

const app = express();
// app.use(bodyParser.json());

app.use(cors())
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('Error connecting to MongoDB Atlas:', error);
});

// Middleware
app.use(express.json()); // Parse JSON bodies


// Configure storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/assets/'); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({ storage: storage });

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


// Add route to handle file uploads
app.post('/api/fitness', upload.single('fitnessImage'), async (req, res) => {
  const { fitnessName, fitnessAddress, fitnessContact, fitnessEmail, fitnessWebsite, fitnessInstagram, fitnessFacebook } = req.body;
  const fitnessImage = req.file.filename;

  try {
    // Check if the fitness center already exists
    const existingFitness = await Fitness.findOne({ fitnessName, fitnessEmail });
    if (existingFitness) {
      return res.status(400).json({ message: 'Fitness Center already exists' });
    }

    // Create a new fitness center
    const newFitness = new Fitness({
      fitnessName,
      fitnessAddress,
      fitnessContact,
      fitnessEmail,
      fitnessWebsite,
      fitnessInstagram,
      fitnessFacebook,
      fitnessImage // Save the file path in the database
    });

    // Save to the database
    await newFitness.save();
    res.status(200).json({ message: 'Fitness center successfully registered' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Onboard route
app.get('/api/onBoardFitness', async (req, res) => {
  try {
      const fitnessCenters = await Fitness.find();
      if (!fitnessCenters || fitnessCenters.length === 0) {
          return res.status(404).json({ message: 'No center on board' });
      }
      
      const userData = fitnessCenters.map(center => ({
          fitnessName: center.fitnessName,
          fitnessAddress: center.fitnessAddress,
          fitnessContact: center.fitnessContact,
          fitnessEmail: center.fitnessEmail,
          fitnessWebsite: center.fitnessWebsite,
          fitnessInstagram: center.fitnessInstagram,
          fitnessFacebook: center.fitnessFacebook,
          fitnessImage: center.fitnessImage
      }));

      // Send the array of fitness centers as JSON response
      res.status(200).json(userData);
  } catch (error) {
      console.error('Error retrieving fitness centers:', error);
      res.status(500).json({ message: 'Server error' });
  }
});



// Define Training question routes ******************************************************************************************************
app.post('/api/trainingQuestion', async (req, res) => {
  try {
    const { question, optionA, optionB, optionC, optionD, correctAnswer } = req.body;

    const trainingQuestion = new Question({
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
    });

    // Save question to the database
    await trainingQuestion.save();

    res.status(200).json({ message: 'Question uploaded successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Define Training question routes ******************************************************************************************************
app.get('/api/getTrainingQuestion', async(req, res) => {
  try{
    const question = await Question.find();
    if(question.length === 0){
      return res.status(404).json({message: 'No question existed'});
    }
    res.status(200).json(question);
  }catch(error){
    console.log(error);
    res.status(500).json({message: 'Server error in fetching the data'})
  }
});



// Define the routes for video upload ******************************************************************************************************
app.post("/api/video", upload.single("video"), async (req, res) => {
  const video = req.file.filename;
  try{
    const existVideo = await Video.findOne({ video });
    if(existVideo){
      return res.status(400).json({ message: "Video already exists" });
    }
    const newVideo = new Video({
      video: video,
    });
    await newVideo.save();
    res.status(200).json({message: "Video saved to the database successfully"})
  }catch(error){
    console.log(error)
    res.status(500).json({ message: "Server error, please try again later" });
  }
});

app.get("/api/getVideo", async (req, res) => {
  try {
    const videoFiles = await Video.findOne(); // `videoFiles` will be an array
    if (!videoFiles) {
      return res.status(404).json({ message: "No video files in the database" });
    }
    return res.status(200).json(videoFiles);
  } catch (error) {
    console.error("Error fetching video from the database", error);
    res.status(500).json({ message: "Error fetching video from the database", error: error.message });
  }
});

// Define the test result summary ******************************************************************************************************
app.post("/api/TestResult", extractUserId, async (req, res) => {
  const userId = req.userId;
  const { successful, unsuccessful, totalQuestions } = req.body;

  try {
    // Find the user by their unique ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if there's already a test result for this user
    const existingTestResult = await TestResult.findOne({ userId: userId });

    if (existingTestResult) {
      // Update the existing test result if found
      await TestResult.updateOne(
        { userId: userId },  // Corrected to use userId, not _id
        {
          $set: {
            successful: successful,
            unsuccessful: unsuccessful,
            totalQuestions: totalQuestions,
          }
        }
      );
      return res.status(200).json({ message: "Result updated successfully" });
    }

    // If no existing result, create a new test result
    const newTestResult = new TestResult({
      userId: userId,
      successful: successful,
      unsuccessful: unsuccessful,
      totalQuestions: totalQuestions,
    });
    await newTestResult.save();

    return res.status(200).json({ message: "Result created successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Oops! An error occurred while uploading the result" });
  }
});

// Define the resultPdf route ******************************************************************************************************
app.get('/api/resultPDF', extractUserId, async (req, res) => {
  const userId = req.userId; // userId extracted from JWT

  try {
      // Find user by userId in the database
      const user = await User.findById(userId);
      const test = await TestResult.findOne({ userId });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      if (!test) {
        return res.status(404).json({ message: 'Result not found' });
      }
      // Construct the response object with user data
      const testData = {
          userId: test.userId,
          successful: test.successful,
          unsuccessful: test.unsuccessful,
          totalQuestions: test.totalQuestions,
      };
      // Send the constructed user data as JSON response
      res.status(200).json(testData);
      console.log(testData)
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
});


// Define the routes ******************************************************************************************************
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

