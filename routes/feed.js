const express = require('express');
const router = express.Router();
const passport = require('passport');

const Post = require('../models/Post');
require('../middleware/auth');
// Configure Cloudinary

// Middleware to protect routes
const auth = passport.authenticate('jwt', { session: false });

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { caption,imageUrl } = req.body;
    console.log(caption+" "+imageUrl+" "+req.user.id);
    const post = await Post.create({
      caption,
      imageUrl,
      user: req.user.id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find({user: req.user._id});
    //console.log(posts.length);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

module.exports = router;
