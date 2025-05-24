/**
 * Product API Routes
 * Provides authenticated endpoints for product catalog management
 */

import express from 'express';
import { 
  loadProductCatalog, 
  getProductsByCategory, 
  searchProducts,
  Product
} from './load-catalog';
import { 
  authenticateRequest, 
  requirePermissions 
} from '../auth/oauth2-middleware';

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const products = await loadProductCatalog();
    res.json(products);
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const products = await getProductsByCategory(category);
    res.json(products);
  } catch (error) {
    console.error('Error loading products by category:', error);
    res.status(500).json({ error: 'Failed to load products by category' });
  }
});

/**
 * @route   GET /api/products/search
 * @desc    Search products by keyword
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const keyword = req.query.q as string;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }
    
    const products = await searchProducts(keyword);
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Add a new product (protected)
 * @access  Private (requires api.products.write scope)
 */
router.post('/', requirePermissions.products.write, async (req, res) => {
  try {
    // In a real implementation, this would add a product to the database
    // For now, we'll just return a success message
    const newProduct = req.body as Product;
    
    // Validate required fields
    if (!newProduct.id || !newProduct.name || !newProduct.price || !newProduct.category) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['id', 'name', 'price', 'category']
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product (protected)
 * @access  Private (requires api.products.write scope)
 */
router.put('/:id', requirePermissions.products.write, async (req, res) => {
  try {
    const productId = req.params.id;
    const productUpdate = req.body;
    
    // In a real implementation, this would update a product in the database
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: `Product ${productId} updated successfully`,
      product: {
        id: productId,
        ...productUpdate
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (protected)
 * @access  Private (requires api.products.write scope)
 */
router.delete('/:id', requirePermissions.products.write, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // In a real implementation, this would delete a product from the database
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: `Product ${productId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;