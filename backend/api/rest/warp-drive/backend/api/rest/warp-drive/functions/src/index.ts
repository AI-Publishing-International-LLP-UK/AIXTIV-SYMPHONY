import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

// Interface for message payload
interface Message {
  role: string;
  content?: string;
}

// Interface for chat payload
interface ChatPayload {
  messages: Message[];
}

/**
 * Validates the chat payload:
 * - Checks that the payload has a "messages" property
 * - Checks that the last message in the messages array has a "role" property equal to "user"
 *
 * @param payload - The payload to validate
 * @throws Error if validation fails
 */
function validatePayload(payload: any): asserts payload is ChatPayload {
  if (!payload.messages) {
    throw new Error('Payload must contain a "messages" property');
  }

  if (!Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  const lastMessage = payload.messages[payload.messages.length - 1];

  if (!lastMessage.role || lastMessage.role !== 'user') {
    throw new Error('The last message must have a role of "user"');
  }
}

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

// Example endpoint
app.get('/hello', (req, res) => {
  res.status(200).send({ message: 'Hello from Warp Drive API!' });
});

// Chat endpoint
app.post('/chat', (req, res) => {
  try {
    // Validate the request payload
    validatePayload(req.body);

    // If validation passes, return success response
    res.status(200).send({
      success: true,
      message: 'Payload validation successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // If validation fails, return error response
    res.status(400).send({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
