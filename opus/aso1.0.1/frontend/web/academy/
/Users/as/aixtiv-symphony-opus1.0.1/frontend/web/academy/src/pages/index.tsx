const HomePage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { state, login, logout } = useStore();
  const { addCourseToCart } = useAcademyStore();
  
  // Check if user is authenticated from the store context
  useEffect(() => {
    if (state.user?.isAuthenticated) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [state.user]);

  // Mock authentication function (would be replaced with actual OAuth)
  const handleAuthLogin = (provider: string) => {
    // In a real implementation, this would redirect to OAuth provider
    console.log(`Authenticating with ${provider}`);
    
    // For demo purposes, simulate successful authentication
    // Generate a random user ID and create a mock user
    const userId = Math.random().toString(36).substring(2, 15);
    login({
      id: userId,
      name: `User ${userId.substring(0, 5)}`,
      email: `user${userId.substring(0, 5)}@example.com`,
      academyAccess: {
        level: 1,
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      }
    });
    
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };
  
  // Handle adding a course to cart
  const handleEnrollCourse = (courseId: string, name: string, price: number) => {
    addCourseToCart(courseId, name, price);
    alert(`Course "${name}" added to your cart!`);
  };
          <div style={{ marginTop: '20px' }}>
            <h3>Available Courses</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              <li style={{ 
                padding: '15px', 
                marginBottom: '10px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #ddd' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>Introduction to AIXTIV Symphony</h4>
                    <p style={{ margin: '0 0 10px 0' }}>Learn the basics of the AIXTIV Symphony platform and its capabilities.</p>
                    <span style={{ fontWeight: 'bold', color: '#4a6cf7' }}>$99.00</span>
                  </div>
                  <button 
                    onClick={() => handleEnrollCourse('course-intro', 'Introduction to AIXTIV Symphony', 99)}
                    style={{ 
                      backgroundColor: '#4a6cf7', 
                      color: 'white', 
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Enroll Now
                  </button>
                </div>
              </li>
              <li style={{ 
                padding: '15px', 
                marginBottom: '10px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #ddd' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>Advanced Visualization Techniques</h4>
                    <p style={{ margin: '0 0 10px 0' }}>Master the visualization center and create immersive experiences.</p>
                    <span style={{ fontWeight: 'bold', color: '#4a6cf7' }}>$149.00</span>
                  </div>
                  <button 
                    onClick={() => handleEnrollCourse('course-viz', 'Advanced Visualization Techniques', 149)}
                    style={{ 
                      backgroundColor: '#4a6cf7', 
                      color: 'white', 
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Enroll Now
                  </button>
                </div>
              </li>
              <li style={{ 
                padding: '15px', 
                marginBottom: '10px', 
                backgroundColor: 'white', 
                borderRadius: '4px',
                border: '1px solid #ddd' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0' }}>Dr. Memoria Anthology Integration</h4>
                    <p style={{ margin: '0 0 10px 0' }}>Connect your learning journey with the Dr. Memoria Anthology system.</p>
                    <span style={{ fontWeight: 'bold', color: '#4a6cf7' }}>$129.00</span>
                  </div>
                  <button 
                    onClick={() => handleEnrollCourse('course-drm', 'Dr. Memoria Anthology Integration', 129)}
                    style={{ 
                      backgroundColor: '#4a6cf7', 
                      color: 'white', 
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Enroll Now
                  </button>
                </div>
              </li>
            </ul>
          </div>
          
          {/* E-commerce Integration - Cart Summary */}
          <div style={{ 
            marginTop: '30px',
            backgroundColor: '#f0f4ff',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #d0d8ff'
          }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Your Shopping Cart</h3>
            {state.cart.length > 0 ? (
              <>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {state.cart.map(item => (
                    <li key={item.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #d0d8ff'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>Quantity: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#4a6cf7' }}>${(item.price * item.quantity).toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '15px',
                  padding: '10px 0',
                  borderTop: '1px solid #d0d8ff',
                  fontWeight: 'bold'
                }}>
                  <span>Total:</span>
                  <span>${state.cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>
                <button 
                  style={{ 
                    backgroundColor: '#4a6cf7', 
                    color: 'white', 
                    border: 'none',
                    padding: '10px 15px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '15px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => alert('Proceeding to checkout...')}
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>Your cart is empty. Enroll in a course to get started!</p>
            )}
          </div>
