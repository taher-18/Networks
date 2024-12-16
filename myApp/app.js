var express = require('express');
var path = require('path');
var app = express();
var MongoClient = require('mongodb').MongoClient; 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const session = require('express-session');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));


var dbClient;
MongoClient.connect('mongodb://127.0.0.1:27017')
  .then(client => {
    dbClient = client;
  })
  .catch(error => {
    console.error('Error connecting to MongoDB:', error);
  });


  app.post('/', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
  
    const db = dbClient.db('myDB');
    const collection = db.collection('myCollection');
  
    collection.findOne({ username: username })
      .then(user => {
        if (user && user.password === password) {
          req.session.username = username; 
          if (!user.destinations || user.destinations.length === 0) {
            const dDestinations = ["Paris", "Rome", "Bali", "Santorini", "Inca", "Annapurna"];
  
            collection.updateOne(
              { username: username },
              { $set: { destinations: dDestinations } }
            )
          }
  
          res.redirect('/home'); 
        } else {
          res.send('Invalid credentials. Please try again.');
        }
      })
      .catch(error => {
        res.send('There was an error logging you in.');
      });
  });
  


  app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
  
    if (!username || !password) {
      return res.send('Both username and password are required.');
    }
  
    const db = dbClient.db('myDB');
    const collection = db.collection('myCollection');
  
    collection.findOne({ username: username })
      .then(existingUser => {
        if (existingUser) {
          return res.send('Username is taken.');
        }
  
        collection.insertOne({ username: username, password: password })
          .then(result => {
            req.session.successMessage = 'Registration was successful';
            res.redirect('/'); 
          })
          .catch(error => {
            res.send('There was an error registering your account.');
          });
      })
      .catch(error => {
        res.send('There was an error processing your registration.');
      });
  });
  

  app.post('/wanttogo', (req, res) => {
    const username = req.session.username;
    const destinationName = req.body.destinationName;
  
    if (!username) {
      return res.redirect('/');
    }
  
    const db = dbClient.db('myDB');
    const collection = db.collection('myCollection');
  
    collection.findOne({ username: username })
      .then(user => {
        if (user) {
          if (user.wanttogo && user.wanttogo.includes(destinationName)) {
            return res.render(destinationName.toLowerCase(), { 
              wanttogo: user.wanttogo, 
              errorMessage: 'The destination is already in your Want-to-Go List.' 
            });
          }
  
          collection.updateOne(
            { username: username },
            { $push: { wanttogo: destinationName } }
          )
            .then(() => res.redirect('/wanttogo'))
            .catch(error => res.send('Error adding destination: ' + error.message));
        } else {
          res.send('User not found');
        }
      })
      .catch(error => res.send('Error checking destination: ' + error.message));
  });
  

  app.post('/search', (req, res) => {
    const searchKeyword = req.body.Search.trim().toLowerCase();
    const username = req.session.username;
  
    if (!searchKeyword) {
      return res.redirect('/home');
    }
  
    const db = dbClient.db('myDB');
    const collection = db.collection('myCollection');
  
    collection.findOne({ username: username })
      .then(user => {
        if (!user || !user.destinations) {
          return res.render('searchresults', { errorMessage: 'Destination not Found', destinations: [] });
        }
  
        const matchedDestinations = user.destinations
          .filter(dest => dest.toLowerCase().includes(searchKeyword))
          .map(dest => ({ destination: dest })); 
  
        res.render('searchresults', { errorMessage: '', destinations: matchedDestinations });
      })
      .catch(error => {
        res.send('Error during search: ' + error.message);
      });
  });
  
    

app.get('/', function (req, res) {
  const successMessage = req.session.successMessage;
  delete req.session.successMessage;

  res.render('login', { successMessage: successMessage });
});

app.get('/registration', function (req, res) {
  res.render('registration');
});
app.get('/wanttogo', (req, res) => {
  const username = req.session.username;

  if (!username) {
    return res.redirect('/');
  }

  const db = dbClient.db('myDB');
  const collection = db.collection('myCollection');

  collection.findOne({ username: username })
    .then(user => {
      if (user) {
        res.render('wanttogo', { wanttogo: user.wanttogo || [], errorMessage: '' });
      } else {
        res.send('User not found.');
      }
    })
    .catch(error => res.send('Error retrieving destinations: ' + error.message));
});


app.get('/home', function (req, res) {
  res.render('home');
});
app.get('/hiking', function (req, res) {
  res.render('hiking'); 
});

app.get('/inca', function (req, res) {
  res.render('inca', { errorMessage: '' });  
});

app.get('/annapurna', function (req, res) {
  res.render('annapurna', { errorMessage: '' });  
});

app.get('/bali', function (req, res) {
  res.render('bali', { errorMessage: '' });  
});

app.get('/cities', function (req, res) {
  res.render('cities');  
});

app.get('/islands', function (req, res) {
  res.render('islands');  
});

app.get('/paris', function (req, res) {
  res.render('paris', { errorMessage: '' }); 
});


app.get('/rome', function (req, res) {
  res.render('rome', { errorMessage: '' });  
});


app.get('/santorini', function (req, res) {
  res.render('santorini', { errorMessage: '' });  
});


app.get('/searchresults', function (req, res) {
  res.render('searchresults', { destinations: [] }); 
});


app.listen(3000);
