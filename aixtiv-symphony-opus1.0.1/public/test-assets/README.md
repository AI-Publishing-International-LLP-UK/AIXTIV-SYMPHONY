# Deepgram Speech Recognition Test Assets

This directory is intended for storing test audio files for use with the Deepgram Speech Recognition component in Aixtiv Symphony.

## Using the Deepgram Transcriber

The Deepgram Transcriber component provides two main ways to use speech recognition:

1. **Record audio** directly from your microphone
2. **Upload audio files** from your device

### Audio File Requirements

When uploading audio files, please note the following:

- **Supported formats**: WAV, MP3, OGG, WEBM, FLAC
- **Maximum file size**: 100MB
- **Recommended audio**: Clear speech with minimal background noise
- **Sample rate**: 16kHz or higher recommended for best results

## Testing Tips

For best results when testing the Deepgram API:

1. **Use high-quality audio** - Clear speech with minimal background noise will yield the best transcription results
2. **Test different models** - Try both Nova-3 (faster) and Whisper (more accurate) to see which works best for your content
3. **Compare model performance** - Use the "Compare both models" option to see detailed performance metrics
4. **Experiment with options** - Try different language settings and features like smart formatting or diarization

## Setting Up Your Deepgram API Key

Before using the transcription feature, make sure to:

1. Create a Deepgram account at [deepgram.com](https://deepgram.com)
2. Generate an API key with appropriate permissions
3. Add your API key to the `.env` file in the project root:
   ```
   REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

## Sample Audio Sources

If you need test audio files, consider these resources:

- [Common Voice by Mozilla](https://commonvoice.mozilla.org/en/datasets) - Open-source voice dataset
- [LibriVox](https://librivox.org/) - Public domain audiobooks
- [Free Sound](https://freesound.org/) - Creative Commons licensed audio clips

You can save audio files in this directory for easy access during development and testing.

