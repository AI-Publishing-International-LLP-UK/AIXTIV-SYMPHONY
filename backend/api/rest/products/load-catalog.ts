/**
 * Product catalog loader for AIXTIV Symphony Gift Shop
 * Returns a promise that resolves to an array of product objects
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating?: number;
  tags?: string[];
}

/**
 * Loads the product catalog for the AIXTIV Symphony Gift Shop
 * @returns Promise<Product[]> - Promise resolving to an array of product objects
 */
export async function loadProductCatalog(): Promise<Product[]> {
  // In a production environment, this would fetch from a database or external API
  // For now, return a static catalog of sample products

  return Promise.resolve([
    {
      id: 'wing-pilot-1',
      name: 'Wing Pilot Basic Package',
      description:
        'Start your journey with essential AI agent training materials',
      price: 29.99,
      imageUrl: '/assets/images/products/wing-pilot-basic.jpg',
      category: 'learning',
      inStock: true,
      rating: 4.7,
      tags: ['beginner', 'training', 'ai-agents'],
    },
    {
      id: 'memory-toolkit-1',
      name: 'Flight Memory System Toolkit',
      description:
        'Advanced tools for implementing memory systems in your AI projects',
      price: 49.99,
      imageUrl: '/assets/images/products/memory-toolkit.jpg',
      category: 'tools',
      inStock: true,
      rating: 4.9,
      tags: ['advanced', 'memory-systems', 'flight-memory'],
    },
    {
      id: 'dream-commander-course',
      name: 'Dream Commander Learning Path',
      description:
        "Master strategic intelligence with Dr. Sabina's comprehensive course",
      price: 79.99,
      imageUrl: '/assets/images/products/dream-commander.jpg',
      category: 'courses',
      inStock: true,
      tags: ['strategic-intelligence', 'premium'],
    },
    {
      id: 'academy-bundle-1',
      name: 'Academy Complete Bundle',
      description:
        'Get access to all academy courses with this comprehensive bundle',
      price: 199.99,
      imageUrl: '/assets/images/products/academy-bundle.jpg',
      category: 'bundles',
      inStock: true,
      rating: 5.0,
      tags: ['complete', 'all-access', 'best-value'],
    },
    {
      id: 'nft-token-genesis',
      name: 'Genesis Achievement Token',
      description:
        'Limited edition NFT recognizing early adopters of the Symphony ecosystem',
      price: 99.99,
      imageUrl: '/assets/images/products/nft-genesis.jpg',
      category: 'blockchain',
      inStock: false,
      tags: ['limited-edition', 'collectors', 'nft'],
    },
    {
      id: 'dr-lucy-guide',
      name: "Dr. Lucy's Flight Memory Guide",
      description: 'Comprehensive guide to memory systems by Dr. Lucy',
      price: 24.99,
      imageUrl: '/assets/images/products/lucy-guide.jpg',
      category: 'books',
      inStock: true,
      rating: 4.8,
      tags: ['guide', 'memory-systems', 'bestseller'],
    },
  ]);
}

/**
 * Fetches products by category
 * @param category - The category to filter by
 * @returns Promise<Product[]> - Promise resolving to filtered products
 */
export async function getProductsByCategory(
  category: string
): Promise<Product[]> {
  const allProducts = await loadProductCatalog();
  return allProducts.filter(product => product.category === category);
}

/**
 * Searches products by keyword in name or description
 * @param keyword - The search term
 * @returns Promise<Product[]> - Promise resolving to matched products
 */
export async function searchProducts(keyword: string): Promise<Product[]> {
  const allProducts = await loadProductCatalog();
  const lowercaseKeyword = keyword.toLowerCase();

  return allProducts.filter(
    product =>
      product.name.toLowerCase().includes(lowercaseKeyword) ||
      product.description.toLowerCase().includes(lowercaseKeyword) ||
      (product.tags &&
        product.tags.some(tag => tag.toLowerCase().includes(lowercaseKeyword)))
  );
}
