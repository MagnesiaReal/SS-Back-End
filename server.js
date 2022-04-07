let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let usersRouter = require('./routes/users');

let app = express();
const port = 50000;
app.listen(port, () => {
  
  console.log('listening on ', port);

});

//const mongoClient = require('mongodb').MongoClient;

//let collection;
//let db;


//mongoClient.connect('mongodb://localhost/ssdb', {userNewUrlParser: true, userUnifiedTopology: true},(err, client => {
  //if(err) throw err;
  //console.log('Connected to Database');
  //db = client.db('ssdb');
  //collection = db.collection('product');
//}));

const mysql = require('mysql');

conn = mysql.createConnection({
  host: "localhost",
  user: "ssuser",
  password: "sspass",
  database: "ssdb",
  multipleStatements: true
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use('/users', usersRouter);

module.exports = app;
