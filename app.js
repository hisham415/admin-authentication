const path = require('path');
const express = require('express');
const session = require('express-session');
const mongodbStore = require('connect-mongodb-session');
const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
const mongoDBStore = mongodbStore(session);
const sessionStore = new mongoDBStore({
  uri: 'mongodb://localhost:27017',
  databaseName: 'auth-demo',
  collection: 'sessions',

})
app.use(session({
  secret: 'super-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));
app.use( async (req,res,next)=>{
  const user = req.session.user;
  const isAuth = await req.session.isAuthenticated;
  if(!user || !isAuth){
    return next();
  }
  const userDoc = db.getDb().collection('users').findOne({_id: user.id});
  const isAdmin = userDoc.isAdmin;


  res.locals.isAuth = isAuth;
  res.locals.isAdmin = isAdmin;

  next();
});
app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000, ()=>{
    console.log('Server is up and running on PORT: ' + 3000);
  });
});
