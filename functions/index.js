// Import packages
const functions = require('firebase-functions');
const app = require('express')();

const {
	getAllPosts,
	createPost,
	getPost,
	postComment,
} = require('./handlers/posts');
const {
	userSignUp,
	userLogin,
	uploadImage,
	updateDetails,
	getAuthenticatedUser,
} = require('./handlers/users');

const { FBAuth } = require('./util/FBAuth');

// Posts Routes
app.get('/posts', getAllPosts);
app.post('/post', FBAuth, createPost);
app.get('/post/:postId', getPost);
// Delete post
// Like a post
// Unlike a post
app.post('/post/:postId/comment', FBAuth, postComment);

// Users Routes
app.post('/signup', userSignUp);
app.post('/login', userLogin);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, updateDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
