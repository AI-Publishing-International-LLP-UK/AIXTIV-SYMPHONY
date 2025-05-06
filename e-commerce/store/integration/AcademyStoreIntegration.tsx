import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

// Types for our integration
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isFeatured?: boolean;
};

type User = {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  academyAccess: boolean;
};

type AcademyStoreProps = {
  showFeaturedOnly?: boolean;
  maxProducts?: number;
  onProductClick?: (product: Product) => void;
  currentUser?: User | null;
  onAuthRequired?: () => void;
};

// Sample product data - in a real implementation this would come from an API
const sampleProducts: Product[] = [
  {
    id: 'course-001',
    name: 'Advanced Machine Learning',
    description:
      'Master the fundamentals of machine learning algorithms and their applications',
    price: 129.99,
    imageUrl: '/assets/course-ml.jpg',
    category: 'courses',
    isFeatured: true,
  },
  {
    id: 'course-002',
    name: 'Blockchain Fundamentals',
    description:
      'Learn the principles behind blockchain technology and cryptocurrencies',
    price: 89.99,
    imageUrl: '/assets/course-blockchain.jpg',
    category: 'courses',
    isFeatured: true,
  },
  {
    id: 'book-001',
    name: 'The Future of AI Ethics',
    description:
      'An in-depth exploration of ethical considerations in artificial intelligence',
    price: 34.99,
    imageUrl: '/assets/book-ai-ethics.jpg',
    category: 'books',
    isFeatured: false,
  },
  {
    id: 'tool-001',
    name: 'Neural Network Visualization Kit',
    description:
      'Interactive tools to visualize and understand neural networks',
    price: 49.99,
    imageUrl: '/assets/tool-nn-viz.jpg',
    category: 'tools',
    isFeatured: true,
  },
];

/**
 * AcademyStoreIntegration component
 *
 * This component serves as the bridge between the e-commerce store and the Academy module.
 * It displays product information within the Academy interface and handles authentication
 * between the two modules.
 */
export const AcademyStoreIntegration: React.FC<AcademyStoreProps> = ({
  showFeaturedOnly = false,
  maxProducts = 4,
  onProductClick,
  currentUser,
  onAuthRequired,
}) => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading products from an API
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, this would be an API call
        // const response = await fetch('/api/store/products');
        // const data = await response.json();

        // Using sample data for now
        const filteredProducts = showFeaturedOnly
          ? sampleProducts.filter(p => p.isFeatured)
          : sampleProducts;

        setProducts(filteredProducts.slice(0, maxProducts));
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load products');
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [showFeaturedOnly, maxProducts]);

  const handleProductClick = (product: Product) => {
    // Check if user is authenticated before allowing product interaction
    if (!currentUser?.isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        // Default auth behavior - redirect to login page
        router.push('/login?returnUrl=/store/product/' + product.id);
      }
      return;
    }

    // If custom handler provided, use it
    if (onProductClick) {
      onProductClick(product);
    } else {
      // Default behavior - navigate to product page
      router.push(`/store/product/${product.id}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Prevent product click event

    // Check if user is authenticated before allowing add to cart
    if (!currentUser?.isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        // Default auth behavior
        router.push('/login?returnUrl=/store');
      }
      return;
    }

    // In a real implementation, this would dispatch to a cart context or API
    console.log(`Added ${product.name} to cart`);

    // Example of how to call an API endpoint to add to cart
    // fetch('/api/cart/add', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ productId: product.id, quantity: 1 }),
    // });
  };

  if (isLoading) {
    return <div className="store-integration-loading">Loading products...</div>;
  }

  if (error) {
    return <div className="store-integration-error">{error}</div>;
  }

  return (
    <div className="academy-store-integration">
      <div className="store-integration-header">
        <h2>Academy Gift Shop</h2>
        {currentUser?.isAuthenticated ? (
          <div className="user-welcome">Welcome, {currentUser.name}</div>
        ) : (
          <button
            className="auth-button"
            onClick={() =>
              onAuthRequired ? onAuthRequired() : router.push('/login')
            }
          >
            Sign in to shop
          </button>
        )}
      </div>

      <div className="product-grid">
        {products.map(product => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => handleProductClick(product)}
          >
            <div className="product-image">
              {/* Placeholder for product image */}
              <div className="image-placeholder">{product.name[0]}</div>
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="product-price">${product.price.toFixed(2)}</div>
              <button
                className="add-to-cart-button"
                onClick={e => handleAddToCart(e, product)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="store-integration-footer">
        <Link href="/store">
          <a className="view-all-link">View all products</a>
        </Link>
      </div>

      <style jsx>{`
        .academy-store-integration {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin: 2rem 0;
        }

        .store-integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f0f0f0;
        }

        .store-integration-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #333;
        }

        .user-welcome {
          font-size: 0.9rem;
          color: #666;
        }

        .auth-button {
          background-color: #4a6cf7;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .auth-button:hover {
          background-color: #3a5ce5;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .product-card {
          border: 1px solid #f0f0f0;
          border-radius: 6px;
          overflow: hidden;
          transition:
            transform 0.2s,
            box-shadow 0.2s;
          cursor: pointer;
          background: white;
        }

        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .product-image {
          height: 160px;
          background-color: #f7f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .image-placeholder {
          width: 60px;
          height: 60px;
          background-color: #e0e7ff;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: #4a6cf7;
        }

        .product-info {
          padding: 1rem;
        }

        .product-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          color: #333;
        }

        .product-description {
          font-size: 0.85rem;
          color: #666;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.5rem;
        }

        .product-price {
          font-weight: bold;
          color: #4a6cf7;
          margin-bottom: 0.75rem;
        }

        .add-to-cart-button {
          width: 100%;
          background-color: #4a6cf7;
          color: white;
          border: none;
          padding: 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .add-to-cart-button:hover {
          background-color: #3a5ce5;
        }

        .store-integration-footer {
          text-align: center;
          padding-top: 0.75rem;
          border-top: 1px solid #f0f0f0;
        }

        .view-all-link {
          color: #4a6cf7;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .store-integration-loading,
        .store-integration-error {
          padding: 2rem;
          text-align: center;
          color: #666;
        }

        .store-integration-error {
          color: #e53e3e;
        }
      `}</style>
    </div>
  );
};

/**
 * This hook provides access to the e-commerce functionality
 * for use throughout the Academy module
 */
export const useAcademyStore = () => {
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>(
    []
  );
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Add to cart functionality
  const addToCart = (productId: string, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === productId);

      if (existingItem) {
        return prevCart.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { productId, quantity }];
      }
    });
  };

  // Remove from cart functionality
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  // Toggle wishlist functionality
  const toggleWishlist = (productId: string) => {
    setWishlist(prevWishlist => {
      if (prevWishlist.includes(productId)) {
        return prevWishlist.filter(id => id !== productId);
      } else {
        return [...prevWishlist, productId];
      }
    });
  };

  // Get product details
  const getProduct = (productId: string): Product | undefined => {
    return sampleProducts.find(product => product.id === productId);
  };

  // Get cart total
  const getCartTotal = (): number => {
    return cart.reduce((total, item) => {
      const product = getProduct(item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  return {
    products: sampleProducts,
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    toggleWishlist,
    getProduct,
    getCartTotal,
  };
};

export default AcademyStoreIntegration;
