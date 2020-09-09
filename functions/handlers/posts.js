const { db } = require('../util/admin');

// Get all posts
exports.getAllPosts = (req, res) => {
	db.collection('posts')
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
};

// Get one post
exports.getPost = (req, res) => {
	let postData = {};
	db.doc(`posts/${req.params.postId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				res.status(404).json({ error: 'Post not found' });
			}
			postData = doc.data();
			postData.postId = doc.id;
			return db
				.collection('comments')
				.orderBy('createdAt', 'desc')
				.where('postId', '==', req.params.postId)
				.get();
		})
		.then((data) => {
			postData.comments = [];
			data.forEach((doc) => {
				postData.comments.push(doc.data());
			});
			return res.json(postData);
		})
		.catch((err) => {
			console.error(err);
			return res.json({ error: err.code });
		});
};

// Create a post
exports.createPost = (req, res) => {
	const newPost = {
		body: req.body.body,
		userHandle: req.user.handle,
		createdAt: new Date().toISOString(),
	};

	db.collection('posts')
		.add(newPost)
		.then((doc) => {
			res.json({ message: `document ${doc.id} created successfully` });
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
};

// Comment on a post
exports.postComment = (req, res) => {
	if (req.body.body.trim() === '') {
		return res.status(400).json({ error: 'Comment must not be empty' });
	}

	const newComment = {
		body: req.body.body,
		userHandle: req.user.handle,
		createdAt: new Date().toISOString(),
		postId: req.params.postId,
		userImage: req.user.imageUrl,
	};

	db.doc(`/posts/${req.params.postId}`)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: 'Post not found' });
			}
			db.collection('comments').add(newComment);
		})
		.then((doc) => {
			res.json(newComment);
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
};
