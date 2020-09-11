// Import packages
const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');

const {
	getAllPosts,
	createPost,
	getPost,
	postComment,
	likePost,
	unlikePost,
	deletePost,
} = require('./handlers/posts');
const {
	userSignUp,
	userLogin,
	uploadImage,
	updateDetails,
	getAuthenticatedUser,
	getUserDetails,
	markNotificationsRead,
} = require('./handlers/users');

const { FBAuth } = require('./util/FBAuth');

//////////////////////////////////////////////////////////////////
// Posts Routes
//////////////////////////////////////////////////////////////////

// Get all Posts
app.get('/posts', getAllPosts);
// Create a Post
app.post('/post', FBAuth, createPost);
// Get a specific Post
app.get('/post/:postId', getPost);
// Delete a Post
app.delete('/post/:postId', FBAuth, deletePost);
// Like a Post
app.get('/post/:postId/like', FBAuth, likePost);
// Unlike a post
app.get('/post/:postId/unlike', FBAuth, unlikePost);
// Comment on a Post
app.post('/post/:postId/comment', FBAuth, postComment);

//////////////////////////////////////////////////////////////////
// User Routes
//////////////////////////////////////////////////////////////////

// Signup
app.post('/signup', userSignUp);
// Login
app.post('/login', userLogin);
// Upload image
app.post('/user/image', FBAuth, uploadImage);
// Update details
app.post('/user', FBAuth, updateDetails);
// Get your wwn details
app.get('/user', FBAuth, getAuthenticatedUser);
// Get a specific user's details
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.https.onRequest(app);

//////////////////////////////////////////////////////////////////
// Cloud Firestore Triggers
//////////////////////////////////////////////////////////////////

// Create notification when a post is liked
exports.createNotificationOnLike = functions.firestore
	.document('likes/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/posts/${snapshot.data().postId}`)
			.get()
			.then((doc) => {
				if (doc.exists) {
					return db.doc(`/notification/${snapshot.id}`).set({
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						read: false,
						postId: doc.id,
						type: 'like',
						createdAt: new Date().toISOString(),
					});
				}
			})
			.then(() => {
				return;
			})
			.catch((err) => {
				console.error(err);
				return;
			});
	});

// Delete notification when a post is unliked
exports.deleteNotificationOnUnlike = functions.firestore
	.document('likes/{id}')
	.onDelete((snapshot) => {
		return db
			.doc(`/notification/${snapshot.id}`)
			.delete()
			.then(() => {
				return;
			})
			.catch((err) => {
				console.error(err);
				return;
			});
	});

// Create notification when a post is commented on
exports.createNotificationOnComment = functions.firestore
	.document('comments/{id}')
	.onCreate((snapshot) => {
		return db
			.doc(`/posts/${snapshot.data().postId}`)
			.get()
			.then((doc) => {
				if (doc.exists) {
					return db.doc(`/notification/${snapshot.id}`).set({
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						read: false,
						postId: doc.id,
						type: 'comment',
						createdAt: new Date().toISOString(),
					});
				}
			})
			.then(() => {
				return;
			})
			.catch((err) => {
				console.error(err);
				return;
			});
	});
