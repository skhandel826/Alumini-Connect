const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const port = 3019

const app = express();

//middleware
app.use(express.json()); // for JSON payloads
app.use(express.static(__dirname))
app.use(express.urlencoded({extended:true}))

mongoose.connect('mongodb://localhost:27017/student');


const db = mongoose.connection
db.once('open',()=>{
console.log("Mongodb connection successful")
})

//login schema
const userSchema = new mongoose.Schema({  
  loginEmail : String,
  loginPassword : String,
})

//register schema
const registerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  registerEmail: String,
  graduationYear: String,
  degree: String,
  registerPassword: String,
  confirmPassword:String,
});

const User = mongoose.model('data', userSchema);

const RegisterUser = mongoose.model('registers', registerSchema);


 // Serve login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

 // Serve register.html
app.get('/register',(req,res)=>{
  res.sendFile(path.join(__dirname,'register.html'))
})



// Register route
app.post('/register', async (req, res) => {
  console.log("Received data:", req.body);
  const { firstName, lastName, registerEmail, graduationYear, degree, registerPassword,confirmPassword } = req.body;

  try {
    // 🔍 Check if user already exists
    const existingUser = await RegisterUser.findOne({ registerEmail });
    if (existingUser) {
      return res.status(400).send('Email already registered.');
    }

    // 🔐 Hash the password
    const hashedPassword = await bcrypt.hash(registerPassword, 10);

    // 👤 Create new user
    const newUser = new RegisterUser({
      firstName,
      lastName,
      registerEmail,
      graduationYear,
      degree,
      registerPassword: hashedPassword,
      confirmPassword,
    });

    await newUser.save();
    console.log("Registration submitted:", newUser);
    res.send("Registration is Successful!");
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error. Please try again.');
  }
});

//login route

app.post('/login', async (req, res) => {
  const { loginEmail, loginPassword } = req.body;
  try{
    // 🔎 Check if user exists
  const user = await RegisterUser.findOne({ registerEmail: loginEmail });
  if (!user) {
    return res.send("No user found with that email.");
  }

// 🔐 Compare password
const isMatch = await bcrypt.compare(loginPassword, user.registerPassword);
if (isMatch) {
   // Login is successful
   console.log("Login successful");

       // Optional: Save login to another collection
       const alreadyLogged = await User.findOne({ loginEmail });
       if (!alreadyLogged) {
         const newLoginUser = new User({
           loginEmail,
           loginPassword: await bcrypt.hash(loginPassword, 10) // hash here too!
         });
         await newLoginUser.save();
         console.log("Login credentials saved:", newLoginUser);
       }
 
       res.send("Login Successful!");
     } else {
       res.send("Incorrect password.");
     }
   } catch (err) {
     console.error('Login error:', err);
     res.status(500).send('Server error. Please try again.');
   }
 });

//testing
app.get('/users', async (req, res) => {
  const users = await RegisterUser.find();
  res.json(users);
});

app.get('/logins', async (req, res) => {
  const logins = await User.find();
  res.json(logins);
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
})