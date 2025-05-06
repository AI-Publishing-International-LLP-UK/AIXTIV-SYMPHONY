import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Divider,
  TextField,
  Grid,
  Stack,
  Paper,
  Tooltip,
  Badge,
  Avatar,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

// Types for cart items
export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartComponentProps {
  initialItems?: CartItem[];
  onCheckout?: (items: CartItem[]) => void;
  onUpdateCart?: (items: CartItem[]) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-5px)',
  },
}));

const CartHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contralateral,
}));

const EmptyCartContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  textAlign: 'center',
}));

const QuantityControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: theme.spacing(1, 0),
}));

const CartComponent: React.FC<CartComponentProps> = ({
  initialItems = [],
  onCheckout,
  onUpdateCart,
}) => {
  const theme = useTheme();
  const [cartItems, setCartItems] = useState<CartItem[]>(initialItems);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    // Sync with initialItems when they change
    if (initialItems.length > 0) {
      setCartItems(initialItems);
    }
  }, [initialItems]);

  // Calculate cart total
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate total items in cart
  const totalItems = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // Update cart item quantity
  const updateQuantity = useCallback(
    (id: string, newQuantity: number) => {
      if (newQuantity < 1) return;

      const updatedItems = cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );

      setCartItems(updatedItems);

      if (onUpdateCart) {
        onUpdateCart(updatedItems);
      }
    },
    [cartItems, onUpdateCart]
  );

  // Remove item from cart
  const removeItem = useCallback(
    (id: string) => {
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);

      if (onUpdateCart) {
        onUpdateCart(updatedItems);
      }
    },
    [cartItems, onUpdateCart]
  );

  // Handle checkout
  const handleCheckout = useCallback(() => {
    if (onCheckout) {
      onCheckout(cartItems);
    }
    // Clear cart after checkout if needed
    // setCartItems([]);
  }, [cartItems, onCheckout]);

  // Toggle cart visibility
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  return (
    <>
      {/* Cart toggle button */}
      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title={cartOpen ? 'Close Cart' : 'Open Cart'}>
          <IconButton
            color="primary"
            onClick={toggleCart}
            size="large"
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                backgroundColor: theme.palette.primary.light,
              },
            }}
          >
            <Badge badgeContent={totalItems} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cart drawer */}
      <Paper
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: { xs: '100%', sm: '400px' },
          zIndex: 999,
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.1)',
        }}
      >
        <CartHeader>
          <Typography variant="h6" component="h2">
            Shopping Cart
            <Typography component="span" variant="caption" sx={{ ml: 1 }}>
              ({totalItems} items)
            </Typography>
          </Typography>
          <IconButton onClick={toggleCart} sx={{ color: 'inherit' }}>
            <DeleteOutlineIcon />
          </IconButton>
        </CartHeader>

        <Box sx={{ overflow: 'auto', flexGrow: 1, p: 2 }}>
          {cartItems.length === 0 ? (
            <EmptyCartContainer>
              <ShoppingCartIcon
                sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Your cart is empty
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Add items from the store to get started
              </Typography>
            </EmptyCartContainer>
          ) : (
            cartItems.map(item => (
              <StyledCard key={item.id}>
                <CardContent sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={3}>
                      <Avatar
                        src={item.image}
                        alt={item.name}
                        variant="rounded"
                        sx={{ width: 60, height: 60 }}
                      />
                    </Grid>
                    <Grid item xs={9}>
                      <Typography variant="subtitle1" component="h3" noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        ${item.price.toFixed(2)}
                      </Typography>

                      <QuantityControl>
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>

                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={e => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              updateQuantity(item.id, val);
                            }
                          }}
                          inputProps={{
                            min: 1,
                            style: {
                              textAlign: 'center',
                              width: '40px',
                              padding: '4px',
                            },
                          }}
                        />

                        <IconButton
                          size="small"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>

                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeItem(item.id)}
                          sx={{ ml: 'auto' }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </QuantityControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </StyledCard>
            ))
          )}
        </Box>

        <Box sx={{ p: 2 }}>
          <Divider sx={{ my: 2 }} />

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Subtotal:</Typography>
            <Typography variant="subtitle1">${cartTotal.toFixed(2)}</Typography>
          </Stack>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={cartItems.length === 0}
            onClick={handleCheckout}
            sx={{
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            Checkout
          </Button>

          <Button
            variant="text"
            color="primary"
            fullWidth
            onClick={toggleCart}
            sx={{ mt: 1 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Paper>
    </>
  );
};

export default CartComponent;
