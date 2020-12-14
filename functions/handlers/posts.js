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
					commentCount: doc.data().commentCount,
					likeCount: doc.data().likeCount,
					createdAt: doc.data().createdAt,
					userImage: doc.data().userImage,
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
				.orderBy('createdAt', 'asc')
				.where('postId', '==', req.params.postId)
				.get();
		})
		.then((data) => {
			postData.comments = [];
			data.forEach((doc) => {
				let commentData = doc.data();
				commentData.commentId = doc.id;
				postData.comments.push(commentData);
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
	if (req.body.body.trim() === '') {
		return res.status(400).json({ body: 'Body must not be empty' });
	}

	console.log(req.user);

	const newPost = {
		body: req.body.body,
		userHandle: req.user.handle,
		createdAt: new Date().toISOString(),
		userImage: req.user.imageUrl,
		likeCount: 0,
		commentCount: 0,
		dailyStreak: req.user.dailyStreak,
	};

	db.collection('posts')
		.add(newPost)
		.then((doc) => {
			const resPost = newPost;
			resPost.postId = doc.id;
			res.json(resPost);
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
};

// Get all posts from a specific user
exports.getUsersPosts = (req, res) => {
	db.doc(`/users/${req.params.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				const posts = db.collection('posts');
				const usersPosts = posts.where('userHandle', '==', req.params.handle);

				usersPosts
					.orderBy('createdAt', 'desc')
					.limit(10)
					.get()
					.then((data) => {
						let posts = [];
						data.forEach((doc) => {
							posts.push({
								postId: doc.id,
								body: doc.data().body,
								userHandle: doc.data().userHandle,
								commentCount: doc.data().commentCount,
								likeCount: doc.data().likeCount,
								createdAt: doc.data().createdAt,
								userImage: doc.data().userImage,
								dailyStreak: doc.data().dailyStreak,
							});
						});
						return res.json(posts);
					})
					.catch((err) => {
						console.error(err);
						return res.json({ error: err.code });
					});
			} else {
				return res.status(404).json({ error: 'User not found' });
			}
		});
};

exports.getUsersPostsNext = (req, res) => {
	db.doc(`/users/${req.params.handle}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				const posts = db.collection('posts');
				const usersPosts = posts.where('userHandle', '==', req.params.handle);

				usersPosts
					.orderBy('createdAt', 'desc')
					.limit(10)
					.startAfter(req.body.lastVisible)
					.get()
					.then((data) => {
						let posts = [];
						data.forEach((doc) => {
							posts.push({
								postId: doc.id,
								body: doc.data().body,
								userHandle: doc.data().userHandle,
								commentCount: doc.data().commentCount,
								likeCount: doc.data().likeCount,
								createdAt: doc.data().createdAt,
								userImage: doc.data().userImage,
								dailyStreak: doc.data().dailyStreak,
							});
						});
						return res.json(posts);
					})
					.catch((err) => {
						console.error(err);
						return res.json({ error: err.code });
					});
			} else {
				return res.status(404).json({ error: 'User not found' });
			}
		});
};

// Comment on a post
exports.postComment = (req, res) => {
	if (req.body.body.trim() === '') {
		return res.status(400).json({ comment: 'Must not be empty' });
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
			return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
		})
		.then(() => {
			return db.collection('comments').add(newComment);
		})
		.then(() => {
			res.json(newComment);
		})
		.catch((err) => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
};

// Get all posts infinite scroll
exports.getAllPostsInfinite = (req, res) => {
	db.collection('posts')
		.orderBy('createdAt', 'desc')
		.limit(10)
		.get()
		.then((data) => {
			let posts = [];
			data.forEach((doc) => {
				posts.push({
					postId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					commentCount: doc.data().commentCount,
					likeCount: doc.data().likeCount,
					createdAt: doc.data().createdAt,
					userImage: doc.data().userImage,
					dailyStreak: doc.data().dailyStreak,
				});
			});
			return res.json(posts);
		})
		.catch((err) => console.error(err));
};

exports.getAllPostsInfiniteNext = (req, res) => {
	db.collection('posts')
		.orderBy('createdAt', 'desc')
		.startAfter(req.body.lastVisible)
		.limit(10)
		.get()
		.then((data) => {
			let posts = [];
			data.forEach((doc) => {
				posts.push({
					postId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					commentCount: doc.data().commentCount,
					likeCount: doc.data().likeCount,
					createdAt: doc.data().createdAt,
					userImage: doc.data().userImage,
					dailyStreak: doc.data().dailyStreak,
				});
			});
			return res.json(posts);
		})
		.catch((err) => console.error(err));
};

// Like a post
exports.likePost = (req, res) => {
	const likeDocument = db
		.collection('likes')
		.where('userHandle', '==', req.user.handle)
		.where('postId', '==', req.params.postId)
		.limit(1);

	const postDocument = db.doc(`/posts/${req.params.postId}`);

	let postData = {};

	postDocument
		.get()
		.then((doc) => {
			if (doc.exists) {
				postData = doc.data();
				postData.postId = req.params.postId;
				return likeDocument.get();
			} else {
				return res.status(400).json({ error: 'Post not found' });
			}
		})
		.then((data) => {
			if (data.empty) {
				return db
					.collection('likes')
					.add({
						postId: req.params.postId,
						userHandle: req.user.handle,
					})
					.then(() => {
						postData.likeCount++;
						return postDocument.update({ likeCount: postData.likeCount });
					})
					.then(() => {
						return res.json(postData);
					});
			} else {
				return res.status(400).json({ error: 'Post already liked' });
			}
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.unlikePost = (req, res) => {
	const likeDocument = db
		.collection('likes')
		.where('userHandle', '==', req.user.handle)
		.where('postId', '==', req.params.postId)
		.limit(1);

	const postDocument = db.doc(`/posts/${req.params.postId}`);

	let postData = {};

	postDocument
		.get()
		.then((doc) => {
			if (doc.exists) {
				postData = doc.data();
				postData.postId = req.params.postId;
				return likeDocument.get();
			} else {
				return res.status(400).json({ error: 'Post not found' });
			}
		})
		.then((data) => {
			if (data.empty) {
				return res.status(400).json({ error: 'Post not liked' });
			} else {
				return db
					.doc(`/likes/${data.docs[0].id}`)
					.delete()
					.then(() => {
						postData.likeCount--;
						return postDocument.update({ likeCount: postData.likeCount });
					})
					.then(() => {
						res.json(postData);
					});
			}
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

// Delete a post
exports.deletePost = (req, res) => {
	const document = db.doc(`posts/${req.params.postId}`);

	document
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: 'Post not found' });
			} else if (doc.data().handle !== req.user.userHandle) {
				return res.status(403).json({ error: 'Unauthorized' });
			} else {
				return document.delete();
			}
		})
		.then(() => {
			res.json({ message: 'Document deleted successfully' });
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

// Delete a comment
exports.deleteComment = (req, res) => {
	const document = db.doc(`/comments/${req.params.commentId}`);

	document
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: 'Comment not found' });
			} else if (doc.data().handle !== req.user.userHandle) {
				return res.status(403).json({ error: 'Unauthorized' });
			} else {
				return document.delete();
			}
		})
		.then(() => {
			res.json({ message: 'Document deleted successfully' });
		})
		.catch((err) => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};
