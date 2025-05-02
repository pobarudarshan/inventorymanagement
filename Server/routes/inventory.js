const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

// Cache implementation with in-memory store (simple version for intern level)
// In a production system, use Redis or another caching solution
const cache = {
  data: {},
  timeout: {},
  set: function(key, value, ttl = 60000) { // ttl in milliseconds, default 1 minute
    this.data[key] = value;
    clearTimeout(this.timeout[key]);
    this.timeout[key] = setTimeout(() => delete this.data[key], ttl);
  },
  get: function(key) {
    return this.data[key];
  },
  invalidate: function(pattern) {
    Object.keys(this.data).forEach(key => {
      if (key.includes(pattern)) {
        delete this.data[key];
        clearTimeout(this.timeout[key]);
      }
    });
  }
};

// @route   POST api/inventory
// @desc    Create an inventory item
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('price', 'Price must be a positive number').isFloat({ min: 0 }),
      check('quantity', 'Quantity must be a positive number').isInt({ min: 0 }),
      check('description', 'Description is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, category, price, quantity, description, tags } = req.body;

      const newItem = new Inventory({
        name,
        category,
        price,
        quantity,
        description,
        tags: tags || [],
        user: req.user.id
      });

      const item = await newItem.save();
      
      // Invalidate cache after creating new item
      cache.invalidate('inventory');
      
      res.json(item);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/inventory
// @desc    Get all inventory items with optional filtering
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort } = req.query;
    
    // Build cache key based on query parameters
    const cacheKey = `inventory:${req.user.id}:${JSON.stringify(req.query)}`;
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Build query
    let query = { user: req.user.id };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }
    
    // Build sort options
    let sortOption = {};
    if (sort) {
      const [field, order] = sort.split(':');
      sortOption[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOption = { createdAt: -1 }; // Default sort by newest
    }
    
    const items = await Inventory.find(query).sort(sortOption);
    
    // Cache results
    cache.set(cacheKey, items);
    
    res.json(items);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/:id
// @desc    Get inventory item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const cacheKey = `inventory:item:${req.params.id}`;
    
    // Check cache
    const cachedItem = cache.get(cacheKey);
    if (cachedItem) {
      return res.json(cachedItem);
    }
    
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    
    // Check user authorization
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Cache item
    cache.set(cacheKey, item);
    
    res.json(item);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/inventory/:id
// @desc    Update an inventory item
// @access  Private
router.put('/:id', [auth, [
  check('name', 'Name is required').optional().not().isEmpty(),
  check('price', 'Price must be a positive number').optional().isFloat({ min: 0 }),
  check('quantity', 'Quantity must be a positive number').optional().isInt({ min: 0 })
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    
    // Check user authorization
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Update fields
    const updateFields = {};
    const { name, category, price, quantity, description, tags } = req.body;
    
    if (name) updateFields.name = name;
    if (category) updateFields.category = category;
    if (price !== undefined) updateFields.price = price;
    if (quantity !== undefined) updateFields.quantity = quantity;
    if (description) updateFields.description = description;
    if (tags) updateFields.tags = tags;
    
    // Update timestamp
    updateFields.updatedAt = Date.now();
    
    // Update item
    item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );
    
    // Invalidate cache
    cache.invalidate('inventory');
    cache.invalidate(`inventory:item:${req.params.id}`);
    
    res.json(item);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/inventory/:id
// @desc    Delete an inventory item
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ msg: 'Item not found' });
    }
    
    // Check user authorization
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await item.remove();
    
    // Invalidate cache
    cache.invalidate('inventory');
    cache.invalidate(`inventory:item:${req.params.id}`);
    
    res.json({ msg: 'Item removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Item not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/inventory/categories
// @desc    Get all unique categories
// @access  Private
router.get('/categories/all', auth, async (req, res) => {
  try {
    const cacheKey = `inventory:categories:${req.user.id}`;
    
    // Check cache
    const cachedCategories = cache.get(cacheKey);
    if (cachedCategories) {
      return res.json(cachedCategories);
    }
    
    const categories = await Inventory.distinct('category', { user: req.user.id });
    
    // Cache categories
    cache.set(cacheKey, categories);
    
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;