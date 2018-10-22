const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const API_KEY = '65a51c4b';
const OMDB_ID = 'tt3896198';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'hbs');

var options = {
    host: '172.16.2.30',
    port: 8080,
    path: '',
    headers: {
        Host: 'www.omdbapi.com'
    }
};

app.get('/', (req, res) => {
    const reqObj = {
        name: 'The Godfather'
    };
    const reqUrl = encodeURI(`http://www.omdbapi.com/?t=${reqObj.name}&apikey=${API_KEY}`);
    options.path = reqUrl;
    http.get(options, (responseFromApi) => {
        let completeResponse = '';
        responseFromApi.on('data', (chunk) => {
            completeResponse += chunk;
        });

        responseFromApi.on('end', () => {
            const listData = JSON.parse(completeResponse);
            console.log(completeResponse);
            res.render('home', {
                title: listData.Title,
                year: listData.Released,
                director: listData.Director,
                imgUrl: listData.Poster
            });
        }, (error) => {
            console.log(error);
        });
    });

});

module.exports = app;