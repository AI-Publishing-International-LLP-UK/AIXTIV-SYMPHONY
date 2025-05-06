const functions = require('firebase-functions');
const textToSpeech = require('@google-cloud/text-to-speech'); // Ensure this is installed
const client = new textToSpeech.TextToSpeechClient();

exports.textToSpeech = async (data, context) => {
  try {
    const { text } = data;

    if (!text) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameter: text'
      );
    }

    // Force select the African male Spanish-speaking voice
    const selectedVoice = 'es-US-Wavenet-D'; // Change to your exact voice

    const request = {
      input: { text },
      voice: { languageCode: 'es-US', name: selectedVoice },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);

    return { audioContent: response.audioContent };
  } catch (error) {
    console.error('TTS Error:', error); // Logs error for debugging
    throw new functions.https.HttpsError('internal', error.message);
  }
};
