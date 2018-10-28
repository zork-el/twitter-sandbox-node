const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const oauth = require('oauth');
const mongoose = require('mongoose');
const Users = require('./schema');

const mongoUrl = "mongodb://poseidon:prithul1996@ds145329.mlab.com:45329/twitter-sandbox";

consumer_key = '0yUiaDnzWdkPGYYSTydn1o1n2';
consumer_secret = 'ZANua1QbkqqtmGbgdJ4nKbp7kJQx4borqJecI2vDgbMGqckqij';
reqUrl = "https://api.twitter.com/oauth/request_token";
accessUrl = "https://api.twitter.com/oauth/access_token";
cbUrl = "https://stormy-lowlands-87826.herokuapp.com/twitter/cb";
//cbUrl = "http://127.0.0.1:3000/twitter/cb";
credentialUrl = "https://api.twitter.com/1.1/account/verify_credentials.json";
var oauth_token;
var oauth_token_secret;
var access_token;
var access_token_secret;
var UserData;

var cursor = -1;
var followerIds = [];
var newFollowerIds = [];
var unfollowersData = [];
var newfollowersData = [];

var consumer = new oauth.OAuth(reqUrl, accessUrl, consumer_key, consumer_secret, '1.0A', cbUrl, "HMAC-SHA1");

mongoose.connect(mongoUrl, { useNewUrlParser: true});
const connection = mongoose.connection;

connection.on('connected', () => {
    console.log("Connected to Twitter Database!");
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/'
}));
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, '/public')));
app.set('view engine', 'hbs');

const unfollowers = (arr, set) => {
    arr.forEach(val => {
        if (!set.has(val)) unfollowersData.push(val);
    });
    console.log("Unfollowers No.: " + unfollowersData.length);
    return unfollowersData;
};

const newfollowers = (arr, set) => {
    arr.forEach(val => {
        if (!set.has(val)) newfollowersData.push(val);
    });
    console.log("New Followers No.: " + newfollowersData.length);
    return newfollowersData;
};

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
                screenName = JSON.parse(data).screen_name;
                Users.findOne({screen_name: screenName}).exec()
                    .then((User) => {
                        if (!User) {
                            Users.create({screen_name: screenName})
                                .then((createdUser) => {
                                    UserData = createdUser;
                                    console.log(UserData);
                                    res.render('home', {
                                        msg: "First Login! Click Here to Sync Followers!",
                                        link: "/followers",
                                        logged: true
                                    });
                                })
                                .catch(err => res.status(400).json(err));
                        } else {
                            console.log(UserData);
                            if (User.followers.length === 0) {
                                UserData = User;
                                res.render('home', {
                                    msg: "Not Synced! Click Here to Sync Followers!",
                                    link: "/followers",
                                    logged: true
                                });
                            } else {
                                UserData = User;
                                res.render('home', {
                                    msg: "Get Link for New Followers and Unfollowers",
                                    link: "/followers",
                                    logged: true
                                });
                            }
                        }
                    })
                    .catch(err => res.status(400).json(err));
            }
        });
    } else res.render('home', {
        msg: "Log In to Twitter",
        link: "/twitter"
    });
});

/* app.get('/followers', (req, res) => {
    if (access_token) {
        let followersUrl = `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor}&screen_name=${UserData.screen_name}&skip_status=true&include_user_entities=false`;
        consumer.get(followersUrl, access_token, access_token_secret, (err, data, response) => {
            if (err) {
                res.status(err.statusCode).json(err.data);
            } else {
                cursor = JSON.parse(data).next_cursor;
                followerIds = followerIds.concat(
                    JSON.parse(data).users
                        .map((user) => {
                            return {
                                screen_name: user.screen_name,
                                profile_image_url: user.profile_image_url,
                                followers_count: user.followers_count,
                                name: user.name
                            };
                        })
                );
                console.log(followerIds.length);
                res.render('home', {
                    followers: true,
                    list: followerIds,
                    logged: true
                });
                //res.status(200).json(followerIds);
            }
        });
    } else res.redirect('/');
}); */

app.get('/followers', (req, res) => {
    if (access_token) {
        followerIds = UserData.followers;
        if (cursor !== "0") {
            let followersUrl = `https://api.twitter.com/1.1/followers/ids.json?cursor=${cursor}&screen_name=${UserData.screen_name}&stringify_ids=true`;
            consumer.get(followersUrl, access_token, access_token_secret, (err, data, response) => {
                if (err) {
                    res.status(err.statusCode).json(err.data);
                } else {
                    cursor = JSON.parse(data).next_cursor_str;
                    newFollowerIds = newFollowerIds.concat(JSON.parse(data).ids);
                    res.redirect('/followers');
                    /* console.log(data);
                    res.status(200).json(JSON.parse(data)); */
                }
            });
        } else {
            cursor = -1;
            if (followerIds.length === 0) {
                followerIds = newFollowerIds;
                UserData.followers = newFollowerIds;
                newFollowerIds = [];
                UserData.save()
                    .then((updatedUser) => {
                        res.render('home', {message: "First Time Syncing", unfollowers: "0", newfollowers: "0", followersNumber: updatedUser.followers.length, logged: true});
                    })
                    .catch(err => res.status(400).json(err));
            } else {
                const followersSet = new Set(followerIds);
                const newFollowersSet = new Set(newFollowerIds);
                unfollowersData = [];
                newfollowersData = [];
                console.log(followerIds.length);
                console.log(newFollowerIds.length);
                unfollowersData = unfollowers(followerIds, newFollowersSet);
                newfollowersData = newfollowers(newFollowerIds, followersSet);
                followerIds = newFollowerIds;
                UserData.followers = newFollowerIds;
                newFollowerIds = [];
                UserData.save()
                    .then((updatedUser) => {
                        res.render('home', {
                            unfollowers: unfollowersData.join(','), 
                            unfollowLength: unfollowersData.length,
                            newfollowers: newfollowersData.join(','), 
                            newfollowsLength: newfollowersData.length,
                            followersNumber: updatedUser.followers.length, 
                            logged: true});
                    })
                    .catch(err => res.status(400).json());
            }
        }
    } else res.redirect('/');
});

app.get('/twitterUser/:twitterId', (req, res) => {
    console.log(req.params.twitterId);
    let params = req.params.twitterId;
    console.log(params);
    let idUrl = "https://api.twitter.com/1.1/users/lookup.json?user_id="+params+"&include_entities=false";
    consumer.get(idUrl, access_token, access_token_secret, (err, data, results) => {
        if (err) {
            res.status(err.statusCode).json(err.data);
        } else {
            var parsedData = JSON.parse(data)
                .map((user) => {
                    return {
                        screen_name: user.screen_name,
                        profile_image_url: user.profile_image_url,
                        followers_count: user.followers_count,
                        name: user.name
                    }
                });
            res.render('list', { type: req.query.type, users: parsedData});
        }
    });
});

app.get('/twitterUser//', (req, res) => {
    msg = "No Users Here!!";
    res.status(404).json(msg);
});

app.get('/unfollow/:screenName', (req, res) => {
    let params = req.params.screenName;
    let unfollowUrl = "https://api.twitter.com/1.1/friendships/destroy.json?screen_name="+params; 
    consumer.post(unfollowUrl, access_token, access_token_secret, null, null, (err, data, results) => {
        if (err) {
            res.status(err.statusCode).json(err.data);
        } else {
            res.status(200).json("Unfollowed: @" + params);
        }
    });
});

app.get('/logout', (req, res) => {
    access_token = null;
    cursor = -1;
    followerIds = [];
    res.redirect('/');
})

module.exports = app;