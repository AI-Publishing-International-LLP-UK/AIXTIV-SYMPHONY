/**
 * Example usage of the SallyPort security layer in an Express.js application.
 */

import express from 'express';
import { protect, hasClaim, getSubscriptionLevel } from '../sallyport'; // Assuming sallyport.ts is in the parent directory
import { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Public route
app.get('/', (req, res) => {
  res.send('Welcome to the public area!');
});

// Protected route for visionaries
app.get('/visionary-dashboard', protect({ any: ['vision_access'] }), (req, res) => {
  res.send(`Welcome to the visionary dashboard, ${req.user?.email}`!);
});

// Protected route for co-pilot admins
app.post('/copilot/config', protect({ any: ['copilot_admin'] }), (req, res) => {
  if (hasClaim(req, 'copilot_admin')) {
    res.send('Co-pilot configuration updated successfully.');
  } else {
    res.status(403).send('Forbidden: Insufficient permissions for co-pilot admin.');
  }
});

// Protected route for delegated operations
app.post('/delegate/task', protect({ any: ['delegate'] }), (req, res) => {
  res.send('Task delegated successfully.');
});

// Protected route requiring a specific subscription level
app.get('/premium-content', protect({ any: ['subscription_access'] }), (req: Request, res: Response) => {
  const subscriptionLevel = getSubscriptionLevel(req);

  if (subscriptionLevel === 'premium' || subscriptionLevel === 'enterprise') {
    res.send('Welcome to the premium content area!');
  } else {
    res.status(403).send('Forbidden: Premium subscription required.');
  }
});

// Example of a route that combines multiple permissions
app.post(
  '/admin/delegate-vision-task',
  protect({ all: ['delegate', 'vision_access', 'copilot_admin'] }),
  (req, res) => {
    res.send('Admin task to delegate vision-related operations completed.');
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

