// Import packages
const functions = require('firebase-functions');
const app = require('express')();
const { db } = require('./util/admin');
const dayjs = require('dayjs');

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
	getAllPostsInfinite,
	getAllPostsInfiniteNext,
	getUsersPostsNext,
} = require('./handlers/posts');
const {
	userSignUp,
	userLogin,
	uploadImage,
	updateDetails,
	getAuthenticatedUser,
	getUserDetails,
	markNotificationsRead,
	getUserProfile,
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
// Get First 10 User Posts
app.get('/users/:handle/posts', getUsersPosts);
// Get User Posts Next
app.post('/users/:handle/posts/next', getUsersPostsNext);
// Get All Posts Infinite Scroll
app.get('/posts/infinite', getAllPostsInfinite);
// Get All Posts Infinite Scroll Next Set
app.post('/posts/infinite/next', getAllPostsInfiniteNext);

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
// Get your own details
app.get('/user', FBAuth, getAuthenticatedUser);
// Get a specific user's details
app.get('/user/:handle', getUserDetails);
// Mark notifications as read
app.post('/notifications', FBAuth, markNotificationsRead);
// Get a specific user's profile details
app.get('/user/:handle/profile', getUserProfile);

exports.api = functions.https.onRequest(app);

//////////////////////////////////////////////////////////////////
// Sendgrid API Test
//////////////////////////////////////////////////////////////////

const sgMail = require('@sendgrid/mail');
const { sendgridApiKey } = require('./util/firebaseConfig');
sgMail.setApiKey(sendgridApiKey);
sgMail.setSubstitutionWrappers('{{', '}}');

// Send an email when a new person signs up
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
	const email = user.email;
	const msg = {
		to: email,
		from: 'hello@grtfl.io',
		subject: 'Sending with SendGrid is Fun',
		templateId: 'd-f168ee6fe0b44424b780027b60bf90c4',
	};

	sgMail
		.send(msg)
		.then(() => console.log('message sent'))
		.catch((err) => console.error(err));
});

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

// Delete notifications and comments when a post is deleted
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

// firebase deploy --only "functions:incrementDailyStreakOnPost"
// Increment daily streak when someone creates a post
exports.incrementDailyStreakOnPost = functions.firestore
	.document('/posts/{postId}')
	.onCreate((snapshot) => {
		return db
			.doc(`/users/${snapshot.data().userHandle}`)
			.get()
			.then((doc) => {
				if (doc.exists) {
					if (!doc.data().postedToday) {
						return doc.ref.update({
							dailyStreak: doc.data().dailyStreak + 1,
							postedToday: true,
						});
					}
				}
			})
			.catch((err) => console.log(err));
	});

// firebase deploy --only "functions:scheduledFunction"
// Reset the postedToday bool for all users at 4am EST
exports.scheduledFunction = functions.pubsub
	.schedule('every day 04:00')
	.timeZone('America/New_York')
	.onRun((context) => {
		let batch = db.batch();
		return db
			.collection('users')
			.where('postedToday', '==', true)
			.get()
			.then((data) => {
				data.forEach((doc) => {
					batch.update(doc.ref, { postedToday: false });
				});
				return batch.commit();
			})
			.catch((err) => console.log(err));
	});

// firebase deploy --only "functions:resetDailyPostStreak"
// Reset the daily streak to 0 if someone has not posted
exports.resetDailyPostStreak = functions.pubsub
	.schedule('every day 03:55')
	.timeZone('America/New_York')
	.onRun((context) => {
		let batch = db.batch();
		return db
			.collection('users')
			.where('postedToday', '==', false)
			.get()
			.then((data) => {
				data.forEach((doc) => {
					batch.update(doc.ref, { dailyStreak: 0 });
				});
				return batch.commit();
			})
			.catch((err) => console.log(err));
	});
