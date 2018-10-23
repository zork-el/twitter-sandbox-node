const express = require('express');
const path = require('path');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const API_KEY = '65a51c4b';
const OMDB_ID = 'tt3896198';
const params = require('./params');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'hbs');

var options = {
    method: 'GET',
    path: '',
    headers: {
        Host: 'www.omdbapi.com'
    }
};

/* app.get('/', (req, res) => {
    const reqObj = {
        name: 'doctor who'
    };
    const reqUrl = encodeURI(`http://www.omdbapi.com/?t=${reqObj.name}&apikey=${API_KEY}`);
    options.protocol = 'http:'
    options.host = 'www.omdbapi.com'
    options.path = encodeURI(`/?t=${reqObj.name}&apikey=${API_KEY}`);
    http.request(options, (responseFromApi) => {
        console.log(responseFromApi.statusCode);
        let completeResponse = '';
        responseFromApi.on('data', (chunk) => {
            completeResponse += chunk;
        });

        responseFromApi.on('end', () => {
            const listData = JSON.parse(completeResponse);
            res.render('home', {
                title: listData.Title,
                year: listData.Released,
                director: listData.Director,
                imgUrl: listData.Poster
            });
        }, (error) => {
            res.status(400).json(error);
        });
    }).end();
}); */

app.get('/twitter', (req, res) => {
    const reqUrl = encodeURI(`https://api.twitter.com/oauth/request_token`);
    options.protocol = 'https:'
    options.host = 'api.twitter.com'
    options.path = '/oauth/request_token';
    options.headers.Host = 'api.twitter.com';
    options.method = 'POST';
    let url = options.protocol + '//' + options.host + options.path;
    url = encodeURIComponent(url);
    const callback = 'https://stormy-lowlands-87826.herokuapp.com/twitter/callback';
    const Params = params(options.method, url, callback);
    var headers = Object.keys(Params)
                    .map((key) => {
                        let encVal = encodeURIComponent(Params[key]);
                        return `${key}="${encVal}"`;
                    })
                    .join(', ');
    headers = 'OAuth ' + headers;
    options.headers.Authorization = headers;
    //options.headers.Accept = '*/*';
    console.log(options);
    https.request(options, (responseFromApi) => {
        let status = responseFromApi.statusCode;
        let respHeaders = responseFromApi.headers;
        let completeResponse = '';
        responseFromApi.on('data', (chunk) => {
            completeResponse += chunk;
        });

        responseFromApi.on('end', () => {
            const listData = JSON.parse(completeResponse);
            console.log(completeResponse);
            res.status(200).json({ data: listData, status: status, headers: respHeaders});
        }, (error) => {
            res.status(404).json({error: error.msg});
        });
    }).end();
});

module.exports = app;