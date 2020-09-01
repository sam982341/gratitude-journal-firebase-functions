// Import packages
const functions = require('firebase-functions');
const app = require('express')();

const { getAllPosts, createPost } = require('./handlers/posts');
const { userSignUp, userLogin, uploadImage } = require('./handlers/users');

const { FBAuth } = require('./util/FBAuth');

// Posts Routes
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, createPost);

// Users Routes
app.post('/signup', userSignUp);
app.post('/login', userLogin);
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);
