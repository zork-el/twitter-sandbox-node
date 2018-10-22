const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');

const app = express();


console.log(path.join(__dirname, '/public'));

app.engine('hbs', hbs({extname:'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'hbs');

app.get('/', (req, res) => {
    res.render('home');
});

module.exports = app;