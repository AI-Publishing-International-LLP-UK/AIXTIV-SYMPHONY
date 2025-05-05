import React, { useState } from 'react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: 'course' | 'material' | 'resource';
  level: 'beginner' | 'intermediate' | 'advanced';
  featured?: boolean;
}

const sampleProducts: Product[] = [
  {
    id: '1',
    title: 'Introduction to AI Systems',
    description: 'Learn the fundamentals of artificial intelligence systems and how they shape our world.',
    price: 199.99,
    imageUrl: '/images/courses/ai-intro.jpg',
    category: 'course',
    level: 'beginner',
    featured: true
  },
  {
    id: '2',
    title: 'Advanced Machine Learning Techniques',
    description: 'Deep dive into cutting-edge machine learning algorithms and methodologies.',
    price: 299.99,
    imageUrl: '/images/courses/ml-advanced.jpg',
    category: 'course',
    level: 'advanced'
  },
  {
    id: '3',
    title: 'Data Visualization Workbook',
    description: 'A comprehensive workbook for mastering data visualization principles and tools.',
    price: 49.99,
    imageUrl: '/images/materials/data-viz-workbook.jpg',
    category: 'material',
    level: 'intermediate'
  },
  {
    id: '4',
    title: 'Neural Networks Study Guide',
    description: 'Essential reference material for understanding and building neural networks.',
    price: 39.99,
    imageUrl: '/images/materials/neural-networks-guide.jpg',
    category: 'material',
    level: 'intermediate'
  },
  {
    id: '5',
    title: 'AI Ethics and Society',
    description: 'Explore the ethical implications of AI and how to build responsible systems.',
    price: 149.99,
    imageUrl: '/images/courses/ai-ethics.jpg',
    category: 'course',
    level: 'beginner'
  },
  {
    id: '6',
    title: 'Python for Data Science Toolkit',
    description: 'A complete toolkit for data science practitioners using Python.',
    price: 79.99,
    imageUrl: '/images/resources/python-toolkit.jpg',
    category: 'resource',
    level: 'beginner',
    featured: true
  }
];

// Filter options for the catalog
interface FilterOptions {
  category: string;
  level: string;
  priceRange: [number, number];
}

export const StoreComponent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    level: 'all',
    priceRange: [0, 500]
  });

  // Filter products based on selected filters
  const filteredProducts = products.filter(product => {
    const categoryMatch = filters.category === 'all' || product.category === filters.category;
    const levelMatch = filters.level === 'all' || product.level === filters.level;
    const priceMatch = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
    return categoryMatch && levelMatch && priceMatch;
  });

  // Handle filter changes
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, category: e.target.value });
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, level: e.target.value });
  };

  return (
    <div className="store-container">
      <header className="store-header">
        <h1>Academy Gift Shop</h1>
        <p>Discover courses, materials, and resources to enhance your learning journey</p>
      </header>

      <div className="store-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">Category:</label>
          <select 
            id="category-filter" 
            value={filters.category}
            onChange={handleCategoryChange}
          >
            <option value="all">All Categories</option>
            <option value="course">Courses</option>
            <option value="material">Materials</option>
            <option value="resource">Resources</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="level-filter">Level:</label>
          <select 
            id="level-filter" 
            value={filters.level}
            onChange={handleLevelChange}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="featured-products">
        {filteredProducts.some(p => p.featured) && (
          <>
            <h2>Featured Items</h2>
            <div className="products-grid">
              {filteredProducts
                .filter(p => p.featured)
                .map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onClick={() => setSelectedProduct(product)} 
                  />
                ))}
            </div>
          </>
        )}
      </div>

      <div className="all-products">
        <h2>All Products</h2>
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onClick={() => setSelectedProduct(product)} 
              />
            ))}
          </div>
        ) : (
          <div className="no-products">
            <p>No products match your current filters. Try adjusting your selection.</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      <style jsx>{`
        .store-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
          background-color: white;
          color: #333;
        }
        
        .store-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .store-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #1a1a1a;
        }
        
        .store-header p {
          font-size: 1.1rem;
          color: #666;
        }
        
        .store-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background-color: #f7f7f7;
          border-radius: 8px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-group label {
          font-weight: 500;
          color: #555;
        }
        
        .filter-group select {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          color: #333;
          font-size: 0.9rem;
          cursor: pointer;
        }
        
        .featured-products, .all-products {
          margin-bottom: 3rem;
        }
        
        .featured-products h2, .all-products h2 {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          color: #1a1a1a;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 0.75rem;
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .no-products {
          padding: 3rem;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 8px;
          color: #777;
        }
      `}</style>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-image">
        <div className="product-placeholder">
          {product.category === 'course' && '📚'}
          {product.category === 'material' && '📋'}
          {product.category === 'resource' && '🧰'}
        </div>
      </div>
      <div className="product-info">
        <h3>{product.title}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-details">
          <span className="product-category">{product.category}</span>
          <span className="product-level">{product.level}</span>
        </div>
        <div className="product-price">${product.price.toFixed(2)}</div>
        <button className="view-details-btn">View Details</button>
      </div>

      <style jsx>{`
        .product-card {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
        }
        
        .product-image {
          width: 100%;
          height: 180px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .product-placeholder {
          font-size: 4rem;
        }
        
        .product-info {
          padding: 1.5rem;
        }
        
        .product-info h3 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
          color: #1a1a1a;
          line-height: 1.4;
        }
        
        .product-description {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
          line-height: 1.5;
        }
        
        .product-details {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .product-category, .product-level {
          font-size: 0.8rem;
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          text-transform: capitalize;
        }
        
        .product-category {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        .product-level {
          background-color: #fff8e1;
          color: #ff8f00;
        }
        
        .product-price {
          font-size: 1.25rem;
          font-weight: 700;
          color: #2e7d32;
          margin-bottom: 1rem;
        }
        
        .view-details-btn {
          width: 100%;
          padding: 0.75rem;
          background-color: #3f51b5;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .view-details-btn:hover {
          background-color: #303f9f;
        }
      `}</style>
    </div>
  );
};

interface ProductModalProps {
  product: Product;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="modal-product-image">
          <div className="product-placeholder">
            {product.category === 'course' && '📚'}
            {product.category === 'material' && '📋'}
            {product.category === 'resource' && '🧰'}
          </div>
        </div>
        
        <div className="modal-product-info">
          <h2>{product.title}</h2>
          
          <div className="product-badges">
            <span className="product-category">{product.category}</span>
            <span className="product-level">{product.level}</span>
            {product.featured && <span className="product-featured">Featured</span>}
          </div>
          
          <p className="product-description">{product.description}</p>
          
          <div className="product-price">${product.price.toFixed(2)}</div>
          
          <div className="product-actions">
            <button className="add-to-cart-btn">Add to Cart</button>
            <button className="buy-now-btn">Buy Now</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;

