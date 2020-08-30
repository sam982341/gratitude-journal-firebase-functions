// Import packages
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
const firebase = require('firebase');

// Web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyA9uRQn3A503LxgPlwGiVeJP54QTvUUZ9s',
	authDomain: 'gratitudejournal-a722b.firebaseapp.com',
	databaseURL: 'https://gratitudejournal-a722b.firebaseio.com',
	projectId: 'gratitudejournal-a722b',
	storageBucket: 'gratitudejournal-a722b.appspot.com',
	messagingSenderId: '107394676945',
	appId: '1:107394676945:web:8ee797616456be3d4b2df0',
	measurementId: 'G-S6Z4474CFX',
};

// Initialize firebase app and express
firebase.initializeApp(firebaseConfig);
admin.initializeApp();

// Get all posts
app.get('/posts', (req, res) => {
	admin
		.firestore()
		.collection('posts')
		.orderBy('createdAt', 'desc')
		.get()
		.then((data) => {
			let posts = [];
			data.forEach((doc) => {
				posts.push({
					postId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt,
				});
			});
			return res.json(posts);
		})
		.catch((err) => console.error(err));
});

// Create new post
app.post('/post', (req, res) => {
	const newPost = {
		body: req.body.body,
		userHandle: req.body.userHandle,
		createdAt: new Date().toISOString(),
	};

	admin
		.firestore()
		.collection('posts')
		.add(newPost)
		.then((doc) => {
			res.json({ message: `document ${doc.id} created successfully` });
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
});

// Sign up for account
app.post('/signup', (req, res) => {
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle,
	};

	//TODO sign up data

	firebase
		.auth()
		.createUserWithEmailAndPassword(newUser.email, newUser.password)
		.then((data) => {
			return res
				.status(201)
				.json({ message: `user ${data.user.uid} signed up successfully` });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
});

exports.api = functions.https.onRequest(app);
