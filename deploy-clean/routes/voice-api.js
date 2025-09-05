const express = require('express');
const { sallyportAuthentication } = require('../middleware/sallyport-auth');
const { sensitiveApiRateLimiter } = require('../middleware/rate-limiter');

const router = express.Router();

// Apply authentication and rate limiting to all voice routes
router.use(sallyportAuthentication);
router.use(sensitiveApiRateLimiter);

/**
 * Voice Assignment Endpoint
 * POST /api/voice/assign
 * Assigns voice profiles to pilots with proper authentication
 */
router.post('/assign', async (req, res) => {
    try {
        const { pilotId, voiceProfile, priority = 'normal' } = req.body;
        
        if (!pilotId || !voiceProfile) {
            return res.status(400).json({
                error: 'Missing required parameters: pilotId and voiceProfile are required',
                code: 'VOICE_MISSING_PARAMS'
            });
        }

        // Validate user permissions
        if (!req.user.permissions.includes('voice:assign') && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions for voice assignment',
                code: 'VOICE_PERMISSION_DENIED'
            });
        }

        // Voice assignment logic
        const assignment = {
            id: generateAssignmentId(),
            pilotId,
            voiceProfile,
            priority,
            assignedBy: req.user.uid,
            assignedAt: new Date().toISOString(),
            status: 'active',
            cloudflare: req.cloudflare
        };

        // Store assignment in database (implement your database logic here)
        // await saveVoiceAssignment(assignment);

        res.json({
            success: true,
            assignment,
            message: 'Voice profile assigned successfully'
        });

    } catch (error) {
        console.error('Voice assignment error:', error);
        res.status(500).json({
            error: 'Failed to assign voice profile',
            code: 'VOICE_ASSIGNMENT_ERROR'
        });
    }
});

/**
 * Voice Synthesis Endpoint
 * POST /api/voice/synthesize
 * Synthesizes text to speech with authentication
 */
router.post('/synthesize', async (req, res) => {
    try {
        const { text, voiceProfile = 'dana', quality = 'high' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                error: 'Missing required parameter: text',
                code: 'VOICE_TEXT_MISSING'
            });
        }

        // Validate user permissions
        if (!req.user.permissions.includes('voice:synthesize') && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions for voice synthesis',
                code: 'VOICE_SYNTHESIS_DENIED'
            });
        }

        // Voice synthesis logic (integrate with your TTS service)
        const synthesis = {
            id: generateSynthesisId(),
            text,
            voiceProfile,
            quality,
            requestedBy: req.user.uid,
            requestedAt: new Date().toISOString(),
            status: 'processing'
        };

        res.json({
            success: true,
            synthesis,
            message: 'Voice synthesis initiated'
        });

    } catch (error) {
        console.error('Voice synthesis error:', error);
        res.status(500).json({
            error: 'Failed to synthesize voice',
            code: 'VOICE_SYNTHESIS_ERROR'
        });
    }
});

/**
 * Voice Profile Management
 * GET /api/voice/profiles
 * Lists available voice profiles
 */
router.get('/profiles', async (req, res) => {
    try {
        // Validate user permissions
        if (!req.user.permissions.includes('voice:read') && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions to view voice profiles',
                code: 'VOICE_READ_DENIED'
            });
        }

        const profiles = [
            {
                id: 'dana',
                name: 'Dana',
                provider: 'openai',
                model: 'tts-hd',
                language: 'en-US',
                quality: 'enterprise',
                latency: 'ultra-low'
            },
            {
                id: 'claude-voice',
                name: 'Claude Voice',
                provider: 'anthropic',
                model: 'claude-voice-3',
                language: 'en-US',
                quality: 'premium',
                latency: 'low'
            }
        ];

        res.json({
            success: true,
            profiles,
            count: profiles.length
        });

    } catch (error) {
        console.error('Voice profiles error:', error);
        res.status(500).json({
            error: 'Failed to retrieve voice profiles',
            code: 'VOICE_PROFILES_ERROR'
        });
    }
});

/**
 * Pilot Voice Assignment Status
 * GET /api/voice/pilot/:pilotId/status
 * Gets voice assignment status for a specific pilot
 */
router.get('/pilot/:pilotId/status', async (req, res) => {
    try {
        const { pilotId } = req.params;

        // Validate user permissions
        if (!req.user.permissions.includes('voice:read') && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions to view pilot voice status',
                code: 'VOICE_STATUS_DENIED'
            });
        }

        // Retrieve pilot voice status (implement your database logic here)
        const status = {
            pilotId,
            voiceProfile: 'dana',
            status: 'active',
            assignedAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            usageCount: 42
        };

        res.json({
            success: true,
            status
        });

    } catch (error) {
        console.error('Voice status error:', error);
        res.status(500).json({
            error: 'Failed to retrieve voice status',
            code: 'VOICE_STATUS_ERROR'
        });
    }
});

/**
 * Batch Voice Assignment
 * POST /api/voice/batch-assign
 * Assigns voice profiles to multiple pilots in batch
 */
router.post('/batch-assign', async (req, res) => {
    try {
        const { assignments } = req.body;
        
        if (!assignments || !Array.isArray(assignments)) {
            return res.status(400).json({
                error: 'Missing or invalid assignments array',
                code: 'VOICE_BATCH_MISSING'
            });
        }

        // Validate user permissions
        if (!req.user.permissions.includes('voice:batch') && req.user.role !== 'admin') {
            return res.status(403).json({
                error: 'Insufficient permissions for batch voice assignment',
                code: 'VOICE_BATCH_DENIED'
            });
        }

        // Process batch assignments
        const results = [];
        for (const assignment of assignments) {
            try {
                const result = {
                    pilotId: assignment.pilotId,
                    voiceProfile: assignment.voiceProfile,
                    status: 'success',
                    assignedAt: new Date().toISOString()
                };
                results.push(result);
            } catch (error) {
                results.push({
                    pilotId: assignment.pilotId,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            results,
            processed: results.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length
        });

    } catch (error) {
        console.error('Batch voice assignment error:', error);
        res.status(500).json({
            error: 'Failed to process batch voice assignment',
            code: 'VOICE_BATCH_ERROR'
        });
    }
});

// Helper functions
function generateAssignmentId() {
    return `voice_assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSynthesisId() {
    return `voice_synth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = router;
