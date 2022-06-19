if(process.env.NODE_ENV !== "production"){
    require('dotenv').config();
}

const mongoose = require('mongoose');
const express = require("express");
const { reset } = require('nodemon');
const path= require('path');
const methodOverride= require('method-override');
const dbUrl=process.env.DB_URL || 'mongodb://localhost:27017/bytesealDSC'

//MongoDB Initiation
//mongodb://localhost:27017/bytesealDSC
mongoose.connect(dbUrl, {

    // useNewUrlParser: true,
    // useCreateIndex: true,
    // useUnifiedTopology: true,
    // useFindAndModify: false
});
// const deviceId = mongoose.model('deviceID', { name: String });
// const dscCred = mongoose.model('dscCred', {password: String});
const dbSchema= new mongoose.Schema({

    deviceId: String,
    password: String, 
    uniqueID: String,
    authStatus: String,
    authTime: String, 
});

const User= mongoose.model('User', dbSchema);



//********************************* */

const app = express();
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'))

app.get("/", (req,res)=>{

    res.render('auth.ejs');

})
app.get("/enroll", async (req,res)=>{

    res.render('home.ejs');
})

app.get("/users", async (req,res)=>{

    const users= await User.find(req.body);
    console.log(users)
})


app.post("/enroll", (req,res)=> {

    const {fname, uid, lname}= req.body;
    console.log(req.body.fname);
    console.log(req.body.lname);
    const newUser= new User({deviceId: req.body.fname, password: req.body.lname, uniqueID: req.body.uid, authStatus: 'NULL', authTime: 'NULL'} )
    newUser.save().then(() => console.log('Device ID and DSC Cred saved'));
});


app.put("/auth", async (req,res)=>{

    // const filter= {deviceId: req.body.sign};
    // const update= {authStatus: 'OK', authTime: Date()};
    // let doc =  User.findOneAndUpdate(filter, update, {returnOriginal: false});
    res.send('Put');
    console.log(req.body.sign);
    // console.log(req.body)
    const user=await User.find(req.body)
    console.log(user)
    let doc= await User.findOneAndUpdate(req.body, {authStatus: "DOK", authTime:Date()});
    //console.log("updated info");
    console.log(doc);
    
});



const port = 3000;
app.listen(port, ()=>{
console.log(`server started on ${port}`)
});
