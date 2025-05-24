/**
 * Video API Routes
 * Provides authenticated endpoints for video room management
 */

import express from 'express';
import { createDailyRoom, validateRoom } from './create-room';
import { 
  authenticateRequest, 
  requirePermissions 
} from '../auth/oauth2-middleware';

const router = express.Router();

/**
 * @route   POST /api/video/rooms
 * @desc    Create a new video room
 * @access  Private (requires api.video.write scope)
 */
router.post('/rooms', requirePermissions.video.write, async (req, res) => {
  try {
    const { userId, context } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const room = await createDailyRoom(userId, context || {});
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating video room:', error);
    res.status(500).json({ error: 'Failed to create video room' });
  }
});

/**
 * @route   GET /api/video/rooms/:roomId
 * @desc    Validate a video room
 * @access  Private (requires api.video.read scope)
 */
router.get('/rooms/:roomId', requirePermissions.video.read, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const isValid = await validateRoom(roomId);
    
    if (isValid) {
      res.json({ valid: true, roomId });
    } else {
      res.status(404).json({ valid: false, error: 'Room not found or expired' });
    }
  } catch (error) {
    console.error('Error validating video room:', error);
    res.status(500).json({ error: 'Failed to validate video room' });
  }
});

/**
 * @route   DELETE /api/video/rooms/:roomId
 * @desc    Delete a video room
 * @access  Private (requires api.video.write scope)
 */
router.delete('/rooms/:roomId', requirePermissions.video.write, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    
    // In a real implementation, this would call the Daily.co API to delete the room
    // For now, we'll just return a success message
    res.json({
      success: true,
      message: `Room ${roomId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting video room:', error);
    res.status(500).json({ error: 'Failed to delete video room' });
  }
});

export default router;