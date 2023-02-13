const path = require('path');

const express = require('express');

const session = require('express-session');

const sessionStorage = require('connect-mongodb-session');

const MongoDbStore = sessionStorage(session);

const store = new MongoDbStore({
  uri: 'mongodb://127.0.0.1:27017',
  databaseName: 'auth-demo',
  collection: 'sessions'
});


const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'secrect-gv',
  resave: false,
  saveUninitialized: false,
  store: store
}));

app.use(async function(req, res, next) {
  if(!req.session.user) {
    return next();
  }

  const user = await db.getDb().collection('users').findOne({_id: req.session.user.id});
  res.locals.isAuthorized = user.isAuthorized;
  res.locals.isAuthenticated = req.session.isAuthenticated;
  next();
})

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
