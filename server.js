logger = require('simple-node-logger').createSimpleLogger('./magnecia_logs/server.log');
uuid = require('uuid');

let express = require('express');
let cookieParser = require('cookie-parser');
let morgan = require('morgan');
let cors = require('cors');

let usersRouter = require('./routes/users');

let app = express();
const port = 50000;
app.listen(port, () => {
  
  console.log('listening on ', port);

});

const mysql = require('mysql');

conn = mysql.createConnection({
  host: "localhost",
  user: "ssuser",
  password: "sspass",
  database: "ssdb",
  multipleStatements: true
});

conn.connect((err) => {
  if (err) throw err;
  console.log("Connected to DataBase");
})


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());


app.use('/routes', usersRouter);

module.exports = app;
