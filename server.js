const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

// Middleware for fetching blog data
app.use('/api/blog-stats', async (req, res, next) => {
  try {
    // Use Axios to fetch data from the third-party blog API
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to fetch blog data');
    }

    const blogData = response.data;

    // Check if blogData is an array of objects with 'title' property
    if (!Array.isArray(blogData) || blogData.length === 0 || !blogData[0].title) {
      console.error('Invalid blog data structure. Received data:', blogData);
      throw new Error('Invalid blog data structure');
    }

    // Perform data analysis
    const totalBlogs = blogData.length;
    const longestBlog = _.maxBy(blogData, (blog) => blog.title.length);
    const blogsWithPrivacy = _.filter(blogData, (blog) =>
      blog.title.toLowerCase().includes('privacy')
    );
    const uniqueBlogTitles = _.uniqBy(blogData, 'title');

    // Store the analysis results in the request object
    req.blogStats = {
      totalBlogs,
      longestBlog: longestBlog.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
    };

    next(); // Continue to the next middleware/route
  } catch (error) {
    // Handle errors and send an appropriate response
    console.error('Error fetching or analyzing blog data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



// Route for retrieving blog statistics
app.get('/api/blog-stats', (req, res) => {
  // Retrieve the analysis results from the request object
  const blogStats = req.blogStats;
  res.json(blogStats);
});

// Route for searching blogs
app.get('/api/blog-search', (req, res) => {
  const query = req.query.query.toLowerCase();

  // Filter blogs based on the provided query
  const matchingBlogs = _.filter(req.blogStats.uniqueBlogTitles, (title) =>
    title.toLowerCase().includes(query)
  );

  res.json(matchingBlogs);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
