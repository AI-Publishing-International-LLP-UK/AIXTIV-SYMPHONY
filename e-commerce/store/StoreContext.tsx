import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  courseId?: string; // For integration with Academy courses
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
  academyAccess?: {
    level: number;
    expiration?: string;
  };
}

export interface StoreState {
  cart: CartItem[];
  user: User | null;
  isCartOpen: boolean;
  checkoutStep: number;
  recentlyViewed: string[];
  wishlist: string[];
  loading: boolean;
  error: string | null;
}

// Action types
type ActionType =
  | { type: 'ADD_TO_CART'; payload: Omit<CartItem, 'id'> }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' }
  | { type: 'SET_CHECKOUT_STEP'; payload: number }
  | { type: 'LOGIN'; payload: Omit<User, 'isAuthenticated'> }
  | { type: 'LOGOUT' }
  | { type: 'ADD_TO_WISHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'ADD_RECENTLY_VIEWED'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'APPLY_DISCOUNT'; payload: string };

// Initial state
const initialState: StoreState = {
  cart: [],
  user: null,
  isCartOpen: false,
  checkoutStep: 0,
  recentlyViewed: [],
  wishlist: [],
  loading: false,
  error: null,
};

// Reducer function
const storeReducer = (state: StoreState, action: ActionType): StoreState => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { productId, quantity, ...rest } = action.payload;
      
      // Check if item already exists in cart
      const existingItemIndex = state.cart.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return { ...state, cart: updatedCart };
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          id: uuidv4(),
          productId,
          quantity,
          ...rest
        };
        return { ...state, cart: [...state.cart, newItem] };
      }
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
      
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      };
    }
    
    case 'CLEAR_CART':
      return { ...state, cart: [] };
      
    case 'TOGGLE_CART':
      return { ...state, isCartOpen: !state.isCartOpen };
      
    case 'SET_CHECKOUT_STEP':
      return { ...state, checkoutStep: action.payload };
      
    case 'LOGIN':
      return {
        ...state,
        user: { ...action.payload, isAuthenticated: true }
      };
      
    case 'LOGOUT':
      return { ...state, user: null };
      
    case 'ADD_TO_WISHLIST':
      if (state.wishlist.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        wishlist: [...state.wishlist, action.payload]
      };
      
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter(id => id !== action.payload)
      };
      
    case 'ADD_RECENTLY_VIEWED': {
      // Remove if exists, then add to beginning
      const filteredViewed = state.recentlyViewed.filter(id => id !== action.payload);
      return {
        ...state,
        recentlyViewed: [action.payload, ...filteredViewed].slice(0, 10) // Limit to 10 items
      };
    }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'APPLY_DISCOUNT':
      // This would need more complex logic depending on your discount system
      console.log(`Discount code applied: ${action.payload}`);
      return state;
      
    default:
      return state;
  }
};

// Create context with an undefined initial value
interface StoreContextValue {
  state: StoreState;
  dispatch: React.Dispatch<ActionType>;
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  login: (userData: Omit<User, 'isAuthenticated'>) => void;
  logout: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

// Context provider component
export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  
  // Load state from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedUser = localStorage.getItem('user');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        parsedCart.forEach((item: Omit<CartItem, 'id'>) => {
          dispatch({ type: 'ADD_TO_CART', payload: item });
        });
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
    
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN', payload: parsedUser });
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        parsedWishlist.forEach((id: string) => {
          dispatch({ type: 'ADD_TO_WISHLIST', payload: id });
        });
      } catch (e) {
        console.error('Failed to parse saved wishlist:', e);
      }
    }
  }, []);
  
  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.cart));
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('user');
    }
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
  }, [state.cart, state.user, state.wishlist]);
  
  // Helper functions for common actions
  const addToCart = (item: Omit<CartItem, 'id'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: item });
  };
  
  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };
  
  const login = (userData: Omit<User, 'isAuthenticated'>) => {
    dispatch({ type: 'LOGIN', payload: userData });
  };
  
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };
  
  const getCartTotal = () => {
    return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  const getCartItemCount = () => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };
  
  const value = {
    state,
    dispatch,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleCart,
    login,
    logout,
    getCartTotal,
    getCartItemCount
  };
  
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// Custom hook to use the store context
export const useStore = (): StoreContextValue => {
  const context = useContext(StoreContext);
  
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  
  return context;
};

// Export a hook for academy integration
export const useAcademyStore = () => {
  const { state, addToCart, getCartTotal } = useStore();
  
  const addCourseToCart = (courseId: string, name: string, price: number, image?: string) => {
    addToCart({
      productId: courseId,
      name,
      price,
      quantity: 1,
      image,
      courseId
    });
  };
  
  const getEnrolledCourses = () => {
    // This would typically come from the user profile or a separate API
    // For now, we just return courses in the cart as a placeholder
    return state.cart
      .filter(item => item.courseId)
      .map(item => ({
        id: item.courseId as string,
        name: item.name,
        price: item.price
      }));
  };
  
  return {
    addCourseToCart,
    getEnrolledCourses,
    getCartTotal
  };
};

