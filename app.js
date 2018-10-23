const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const oauth = require('oauth');

consumer_key = '0yUiaDnzWdkPGYYSTydn1o1n2';
consumer_secret = 'ZANua1QbkqqtmGbgdJ4nKbp7kJQx4borqJecI2vDgbMGqckqij';
reqUrl = "https://api.twitter.com/oauth/request_token";
accessUrl = "https://api.twitter.com/oauth/access_token";
cbUrl = "https://stormy-lowlands-87826.herokuapp.com/twitter/cb";
credentialUrl = "https://api.twitter.com/1.1/account/verify_credentials.json"
var oauth_token;
var oauth_token_secret;
var access_token;
var access_token_secret;
var UserData;

var consumer = new oauth.OAuth(reqUrl, accessUrl, consumer_key, consumer_secret, '1.0A', cbUrl, "HMAC-SHA1");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'hbs');

app.get('/twitter', (req, res) => {
    consumer.getOAuthRequestToken((err, oauthToken, oauthTokenSecret, results) => {
        if (err) res.status(401).json(err);
        else {
            oauth_token = oauthToken;
            oauth_token_secret = oauthTokenSecret;
            res.redirect("https://api.twitter.com/oauth/authorize?oauth_token=" + oauth_token);
        }
    });
});

app.get('/twitter/cb', (req, res) => {
    if (req.query.oauth_token == oauth_token) {
        consumer.getOAuthAccessToken(oauth_token, oauth_token_secret, req.query.oauth_verifier, (err, accessToken, accessTokenSecret, results) => {
            if (err) res.status(401).json(err);
            else {
                access_token = accessToken;
                access_token_secret = accessTokenSecret;
                res.redirect('/');
            }
        });
    } else res.send(401).json('something went wrong!!');
});

app.get('/', (req, res) => {
    if (access_token) {
        consumer.get(credentialUrl, access_token, access_token_secret, (err, data, response) => {
            if (err) {
                res.status(err.statusCode).json(err.data);
            } else {
                UserData = JSON.parse(data);
                res.render('home', { msg: "See Followers List", link: "/followers", logged: true });
            }
        });
    } else res.render('home', { msg: "Log In to Twitter", link: "/twitter" });
});

app.get('/followers', (req, res) => {
    if (access_token) {
        let followersUrl = `https://api.twitter.com/1.1/followers/list.json?cursor=-1&screen_name=${UserData.screen_name}&skip_status=true&include_user_entities=false`;
        consumer.get(followersUrl, access_token, access_token_secret, (err, data, response) => {
            if (err) {
                res.status(err.statusCode).json(err.data);
            } else {
                let followersData = JSON.parse(data);
                res.render('home', { followers: true, list: followersData.users, logged: true });
            }
        });
    } else res.redirect('/');
});

app.get('logout', (req, res) => {
    access_token = null;
    res.redirect('/');
})

module.exports = app;