// Import packages
const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');

const cors = require('cors');
app.use(cors());

const {
	getAllPosts,
	createPost,
	getPost,
	postComment,
	likePost,
	unlikePost,
	deletePost,
	getUsersPosts,
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

// Get all posts
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
// Get All User Posts
app.get('/users/:handle/posts', getUsersPosts);

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
				if (
					doc.exists &&
					doc.data().userHandle !== snapshot.data().userHandle
				) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						read: false,
						postId: doc.id,
						type: 'like',
						createdAt: new Date().toISOString(),
					});
				}
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
			.doc(`/notifications/${snapshot.id}`)
			.delete()
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
				if (
					doc.exists &&
					doc.data().userHandle !== snapshot.data().userHandle
				) {
					return db.doc(`/notifications/${snapshot.id}`).set({
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						read: false,
						postId: doc.id,
						type: 'comment',
						createdAt: new Date().toISOString(),
					});
				}
			})
			.catch((err) => {
				console.error(err);
				return;
			});
	});

exports.onUserImageChange = functions.firestore
	.document('/users/{userId}')
	.onUpdate((change) => {
		console.log(change.before.data());
		console.log(change.after.data());

		if (change.before.data().imageUrl !== change.after.data().imageUrl) {
			console.log('image has changed');
			let batch = db.batch();
			return db
				.collection('posts')
				.where('userHandle', '==', change.before.data().handle)
				.get()
				.then((data) => {
					data.forEach((doc) => {
						const post = db.doc(`/posts/${doc.id}`);
						batch.update(post, { userImage: change.after.data().imageUrl });
					});
					return batch.commit();
				});
		} else return true;
	});

exports.onPostDelete = functions.firestore
	.document('/posts/{postId}')
	.onDelete((snapshot, context) => {
		const postId = context.params.postId;
		const batch = db.batch();
		return db
			.collection('comments')
			.where('postId', '==', postId)
			.get()
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/comments/${doc.id}`));
				});
				return db.collection('likes').where('postId', '==', postId).get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/likes/${doc.id}`));
				});
				return db
					.collection('notifications')
					.where('postId', '==', postId)
					.get();
			})
			.then((data) => {
				data.forEach((doc) => {
					batch.delete(db.doc(`/notifications/${doc.id}`));
				});
				return batch.commit();
			})
			.catch((err) => console.error(err));
	});
