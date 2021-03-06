const express = require('express');
const router = express.Router();
bcrypt = require('bcrypt');

nodemailer = require('nodemailer');
randomstring = require('randomstring');
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// #######################################################
// ############# GENERAL VARIABLES #######################
// #######################################################
let verifications = [];
let changePasswords = [];
let timerId = null;
let timerIdPass = null;

const transporter = nodemailer.createTransport({
  service: 'Yahoo',
  //auth: {
    //user: 'serviciosocial.encb2022@gmail.com',
    //pass: 'serviciosocialENCB2022'
  //}
  secure: false,
  auth: {
    user: 'stea.tesis@yahoo.com',
    pass: 'xkehiqvllytqwxvl'
  }
});


// #######################################################
// ####################### LOGIN USER ####################
// #######################################################
router.post('/login', (req, res) => {

  logger.info("LOGIN>> checking credentials");

  console.log(req.body.email, req.body.pass);

  let sql = `SELECT user_id as userId, name, birth, admin, uuid, pass FROM users WHERE email=?`;

  conn.query(sql, [req.body.email], (err,data)=>{
    if(err) throw err;

    logger.warn("LOGIN>> Extracted data -> ", data[0]);
    
    if (data.length > 0) {

      bcrypt.compare(req.body.pass, data[0].pass,(err,result)=>{

        logger.debug("LOGIN>> Password comparation is: ", result);
    
        if(err) throw err;
        else if(result){
          
          let userData = data[0];
          delete userData.pass;

          console.log(userData);

          res.status(200);
          res.json({
            message: "Ok you've been verified, take your user data :)",
            userData: userData
          });

        } else {
          
          res.status(403); // Forbidden, incorrect pass maybe
          res.json({
            message: "Incorrect pass or user I dont know, I'm a simple server"
          });
          
        }

      });
    } else {
      res.status(401); // ok not found this email xd
      res.json({
        message: "Incorrect user or pass I dont know... or maybe yes..."
      });
    }
  });


});

function sendRecoverPassMail(req, res) {
  
  const code = randomstring.generate(40);
  const recoveryUrl = `${req.body.fullUrl}/changepass/${code}`;
  console.log(recoveryUrl);  

  const mailOptions = {
    from: 'stea.tesis@yahoo.com',
    to: req.body.email,
    subject: 'ENCB Recover password',
    html: `<h1>Este enlace expirara en 30 minutos !!!!!!</h1><br/> Url de recuperaci??n: ${recoveryUrl}`
  };
  
  transporter.sendMail(mailOptions, (err, info) => {
     if (err) {

      logger.error("REGISTER>> error: ", err);
      res.status(401);
      res.json({
        message: "Invalid email or doesn't exist for recover pass"
      });

    } else {

      logger.info("LOGIN>> forgot password sent: ", info.response);
      
      changePasswords.push({email: req.body.email, code: code});
      if (timerIdPass == null) {

        timerIdPass = setInterval(()=>{

          if(changePasswords.length) changePasswords.shift();
          else {

            clearInterval(timerIdPass);
            timerIdPass = null;

          }

        }, 1800000);  

      }

      logger.info("LOGIN>> The user has thirty minuts to change the pasword");
      res.status(200);
      res.json({
        message: "We sent a mail to recover your password"
      });

    }
   

    
  });

  
}

router.post('/forgotpass', (req, res)=> {
 
  let sql = `SELECT * FROM users WHERE email=?`;

  conn.query(sql, [req.body.email], (err,data)=> {
    if(err) throw err;

    if(data.length) sendRecoverPassMail(req, res);
    else {
      
      res.status(401);
      res.json({message: "This user doesn't exist"});

    }
    
  });

});


router.post('/verifychangepass', (req, res) => {
  
  changePassword = changePasswords.find(p => p.code === req.body.code);

  if(changePassword) {
    logger.info("VERIFYCHANGEPASS>> code is real")
    res.status(200);
    res.json({
      message: "Request exist",
      email: changePassword.email
    });

  } else {
    logger.info("VERIFYCHANGEPASS>> hmmm error code or email expired");
    res.status(401);
    res.json({
      message: "Invalid Request"
    });

  }

});


router.post('/changepass', (req, res)=> {
  
  bcrypt.hash(req.body.pass, 10, (err, hash) => {
    if(err) throw err;
    
    let sql = `UPDATE users SET pass=?, uuid=? WHERE email=?`;
    
    changePassword = changePasswords.find(p => p.code === req.body.code);

    values = [
      hash,
      uuid.v4(),
      changePassword.email
    ];
    
    conn.query(sql, values, (err, data)=> {
      if(err) {
        res.status(500);
        res.json({message: "Internal Error"});
        throw err;
      }
      
      if(data.affectedRows) {
        
        changePasswords.slice(changePasswords.findIndex(p=> p.email === req.body.code));
        logger.info("CHANGEPASS>> Password changed");
        res.status(200);
        res.json({message: "Password changed successfully"});

      } else { 
        
        res.status(401);
        res.json({message: "Request expired or email doesn't exist in the system"});

      }
    });

  });

});

// #######################################################
// ################### REGISTER NEW USER #################
// #######################################################
function sendVerificationMail(req, res) {

  const code = randomstring.generate(6);
  const mailtext = 'Este es tu codigo de verificaci??n para ServicioSocialENCB, r??pido expira en 30 minutos, go fast!!!\n Codigo: ' + code;
  

  const mailOptions = {
    from: 'stea.tesis@yahoo.com',
    to: req.body.email,
    subject: 'SSENCB Verification mail',
    text: mailtext
  }
  
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {

      logger.error("REGISTER>> error: ", err);
      res.status(401);
      res.json({
        message: "Invalid email or doesn't exist"
      });

    }
    else {

      // at this point the user have 30 minutes to verify the account
      logger.info("REGGISTER>> Email sent: ", info.response);

      verifications.push({email: req.body.email, code: code});
      if (timerId == null) {

        timerId = setInterval(()=>{

          if(verifications.length) verifications.shift();
          else {

            clearInterval(timerId);
            timerId = null;

          }

        }, 1800000);  

      }

      logger.info("REGISTER>> User has thirty minuts to verify him account");
      res.status(200);
      res.json({
        message: "Valid information, please verify this user"
      });

    }

  });
  
}

router.post('/register',(req,res) => {

  logger.info("REGISTER>> registering user");

  let sqlexist = `SELECT * FROM users WHERE email=?`;
  conn.query(sqlexist, [req.body.email], (err, data)=> {    
    if(err) throw err;

    logger.info("REGISTER>> data.length: ", data.length);
      
    if(data.length === 0) {
      sendVerificationMail(req, res);
    } else {
      logger.warn("REGISTER>> Email already exist: ", req.body.email);
      res.status(409);// Resource conflict
      res.send("Email already exist");
    }
  });

});

function sendVerifyCredentials(req, res) {
  const sql = `SELECT * FROM users WHERE email=?`;

  conn.query(sql, [req.body.email],(err, data)=>{

    if(err) {

      logger.error("VERIFY>> Internal server error at sendVerifyCredentials");
      console.log(err);
      res.status(500);
      res.json({
        message: "Internal Server Error plase try again later"
      });
      throw err;

    }
    if(data.length) {

      res.status(200); // Succesfully
      res.json({
        message: "Usuario registrado con ??xito",
        uuid: data[0].uuid,
        userId: data[0].user_id
      });

    }

  });
}

function insertNewUser(req, res) {

  let sql = `INSERT INTO users(name,email,birth,admin,pass,uuid) VALUES (?)`;
  bcrypt.hash(req.body.pass, 10,(err,hash)=>{
  
    if(err) throw err;
    
    let values = [
      req.body.name,
      req.body.email,
      req.body.born,
      0,
      hash,
      uuid.v4()
    ]; 
    conn.query(sql, [values], (err,data) => {
      
      if(err) {


        logger.error("VERIFY>> Internal server error");
        console.log(err);
        res.status(500);
        res.json({
          message: "Internal Server Error plase try again later"
        });
        throw err;

      }
      else if(data.affectedRows) {

        logger.info("VERIFY>> Server send a success response");
        sendVerifyCredentials(req, res);

      } else {
        
        logger.error("VERIFY>> I have no idea why the user was not registered");
        res.status(500);
        res.json({
          message: "User doesn't registered but I don't know why"
        });

      }
      
    });

  });

}

router.post('/verify', (req, res) => {

  // dont forget this query, might useful in the future
  //let sql = `INSERT INTO Usuario(nombre,apellido,email,nacimiento,admin,pass, uuid) SELECT ? WHERE NOT EXISTS (SELECT * FROM Usuario WHERE email = ?)`;
  const verification = verifications.find(v => (v.email === req.body.email && v.code === req.body.code));
  if(verification) {

    verifications.slice(verifications.findIndex(v => (v.email === req.body.email && v.code === req.body.code)),1);
       
    logger.info("VERIFY>> Verified account succesfully");
    insertNewUser(req, res);

  } else {
      
    logger.warn("VERIFY>> hmmm... user sent a wrong code or time expired");
    res.status(401);
    res.json({
      message: "Wrong code I think, or time expired"
    });
    
  } 

});


// #######################################################
// ################## CHECK USER SESSION #################
// #######################################################
router.put('/checksession', (req,res) => {
  let sql = `SELECT * FROM users WHERE uuid = ?`;
  
  logger.info("CHECKSESSION>> UUID: ", req.body.UUID);
  conn.query(sql, [req.body.UUID], (err,data) => {
    if(err) throw err;
    
    logger.info("CHECKSESSION>> recovered data: ", data);
    if(data.length) {
      
      res.status(200);
      res.json({
        message: "It's OK, the user is logged"
      });

    } else {

      logger.error("CHEKSESSION>> Invalid user or session expired");
      res.status(401)
      .json({
        message: "This session has expired and now your gonna redirect to login"
      });

    }
  })
});


module.exports = router;
module.exports = router;
