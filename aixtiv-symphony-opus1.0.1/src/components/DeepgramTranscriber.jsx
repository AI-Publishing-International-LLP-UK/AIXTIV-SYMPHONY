import React, { useState, useRef, useEffect } from 'react';
import deepgramService from '../services/deepgramService';

/**
 * DeepgramTranscriber Component
 * 
 * Provides interface for recording, uploading, and transcribing audio using the Deepgram API.
 * Features include:
 * - Audio recording via browser's MediaRecorder API
 * - Audio file upload
 * - Transcription model selection
 * - Transcription configuration options
 * - Results display with model comparison
 */
const DeepgramTranscriber = () => {
  // State for audio recording and processing
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioSource, setAudioSource] = useState(null);
  
  // State for transcription settings
  const [selectedModel, setSelectedModel] = useState(process.env.REACT_APP_DEFAULT_MODEL || 'nova-3');
  const [language, setLanguage] = useState(process.env.REACT_APP_DEFAULT_LANGUAGE || 'en-US');
  const [smartFormat, setSmartFormat] = useState(true);
  const [punctuate, setPunctuate] = useState(true);
  const [diarize, setDiarize] = useState(false);
  
  // State for transcription process
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [transcriptionError, setTranscriptionError] = useState(null);
  const [compareModels, setCompareModels] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  
  // Refs for audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Audio recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isRecording]);
  
  // Format recording time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Handle start recording
  const startRecording = async () => {
    try {
      setTranscriptionResult(null);
      setTranscriptionError(null);
      setComparisonResult(null);
      
      // Reset recording timer and audio chunks
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data available event
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop event
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioSource(audioUrl);
        setAudioFile(null);
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setTranscriptionError(`Could not access microphone: ${error.message}`);
    }
  };
  
  // Handle stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Reset previous transcription data
      setTranscriptionResult(null);
      setTranscriptionError(null);
      setComparisonResult(null);
      
      // Check file type
      const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/flac'];
      if (!validTypes.includes(file.type)) {
        setTranscriptionError(`Unsupported file type: ${file.type}. Please upload WAV, MP3, OGG, WEBM, or FLAC files.`);
        return;
      }
      
      // Check file size (limit to 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setTranscriptionError('File size too large. Please upload files under 100MB.');
        return;
      }
      
      const audioUrl = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioSource(audioUrl);
      setAudioBlob(null);
    }
  };
  
  // Clear audio
  const clearAudio = () => {
    if (audioSource) {
      URL.revokeObjectURL(audioSource);
    }
    
    setAudioSource(null);
    setAudioBlob(null);
    setAudioFile(null);
    setTranscriptionResult(null);
    setTranscriptionError(null);
    setComparisonResult(null);
  };
  
  // Handle transcription
  const handleTranscribe = async () => {
    try {
      // Validate we have audio to transcribe
      if (!audioBlob && !audioFile) {
        setTranscriptionError('No audio available to transcribe. Please record or upload audio first.');
        return;
      }
      
      // Reset previous results
      setTranscriptionResult(null);
      setTranscriptionError(null);
      setComparisonResult(null);
      setIsTranscribing(true);
      
      // Prepare audio data
      const audioData = audioBlob || audioFile;
      
      // Prepare transcription options
      const options = {
        model: selectedModel,
        language: language,
        smartFormat: smartFormat,
        punctuate: punctuate,
        diarize: diarize
      };
      
      // Compare models if requested
      if (compareModels) {
        const result = await deepgramService.compareModels(audioData);
        setComparisonResult(result);
        
        // Extract result from best model for display
        const bestModel = result.summary.highestConfidenceModel.model;
        setTranscriptionResult({
          transcript: result.models[bestModel].transcript,
          confidence: result.models[bestModel].confidence,
          model: bestModel
        });
      } else {
        // Single model transcription
        const result = await deepgramService.transcribeAudio(audioData, options);
        setTranscriptionResult({
          transcript: result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '',
          confidence: result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
          model: selectedModel
        });
      }
    } catch (error) {
      setTranscriptionError(`Transcription failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };
  
  // Get confidence level class
  const getConfidenceClass = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="deepgram-transcriber">
      {/* Main Card */}
      <div className="card mb-8">
        <div className="card-header bg-gray-50">
          <h3 className="text-xl font-semibold">Deepgram Speech Recognition</h3>
          <p className="text-sm text-gray-600">Record, upload, and transcribe audio using Deepgram's AI models</p>
        </div>
        
        <div className="card-body">
          {/* Audio Source Section */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Audio Source</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recording Controls */}
              <div className="card bg-gray-50">
                <div className="card-body">
                  <h5 className="font-semibold mb-2">Record Audio</h5>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {!isRecording ? (
                      <button
                        className="btn btn-primary"
                        onClick={startRecording}
                        disabled={isTranscribing}
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </button>
                    )}
                    
                    {isRecording && (
                      <div className="flex items-center">
                        <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        <span className="text-sm">{formatTime(recordingTime)}</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Record audio directly from your microphone. Recordings are stored locally and not saved permanently.
                  </p>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="card bg-gray-50">
                <div className="card-body">
                  <h5 className="font-semibold mb-2">Upload Audio File</h5>
                  
                  <div className="mb-4">
                    <input
                      type="file"
                      accept="audio/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark"
                      onChange={handleFileUpload}
                      disabled={isRecording || isTranscribing}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Upload audio files (WAV, MP3, OGG, WEBM, FLAC) up to 100MB in size.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Audio Preview */}
            {audioSource && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="font-semibold">Audio Preview</h5>
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={clearAudio}
                    disabled={isTranscribing}
                  >
                    Clear Audio
                  </button>
                </div>
                
                <div className="card bg-gray-50 p-4">
                  <audio controls src={audioSource} className="w-full" />
                  <p className="text-sm text-gray-600 mt-2">
                    {audioFile ? `File: ${audioFile.name} (${(audioFile.size / 1024).toFixed(2)} KB)` : 'Recorded audio'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Transcription Settings */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4">Transcription Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Model Selection */}
              <div className="card bg-gray-50">
                <div className="card-body">
                  <h5 className="font-semibold mb-2">Model Selection</h5>
                  
                  <div className="flex flex-col gap-2 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="model"
                        value="nova-3"
                        checked={selectedModel === 'nova-3'}
                        onChange={() => setSelectedModel('nova-3')}
                        disabled={isTranscribing}
                        className="mr-2"
                      />
                      <span>Nova-3 (Fastest, optimized for real-time)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="model"
                        value="whisper"
                        checked={selectedModel === 'whisper'}
                        onChange={() => setSelectedModel('whisper')}
                        disabled={isTranscribing}
                        className="mr-2"
                      />
                      <span>Whisper (High accuracy, slower processing)</span>
                    </label>
                    
                    <div className="mt-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={compareModels}
                          onChange={() => setCompareModels(!compareModels)}
                          disabled={isTranscribing}
                          className="mr-2"
                        />
                        <span>Compare both models (takes longer)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Language and Options */}
              <div className="card bg-gray-50">
                <div className="card-body">
                  <h5 className="font-semibold mb-2">Language & Options</h5>
                  
                  {/* Language Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isTranscribing}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                      <option value="ko">Korean</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                    </select>
                  </div>
                  
                  {/* Additional Options */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={smartFormat}
                        onChange={() => setSmartFormat(!smartFormat)}
                        disabled={isTranscribing}
                        className="mr-2"
                      />
                      <span>Smart formatting (numbers, currencies, dates)</span>
                    </label>
                    
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={punctuate}
                        onChange={() => setPunctuate(!punctuate)}
                        disabled={isTranscribing}
                        className="mr-2"
                      />
                      <span>Add punctuation</span>
                    </label>
                    
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={diarize}
                        onChange={() => setDiarize(!diarize)}
                        disabled={isTranscribing}
                        className="mr-2"
                      />
                      <span>Diarization (speaker detection)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transcription Action */}
          <div className="mb-8">
            <div className="flex justify-center">
              <button
                className="btn btn-lg btn-primary"
                onClick={handleTranscribe}
                disabled={(!audioBlob && !audioFile) || isTranscribing}
              >
                {isTranscribing ? (
                  <span className="flex items-center">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mr-2"></span>
                    Transcribing...
                  </span>
                ) : (
                  'Transcribe Audio'
                )}
              </button>
            </div>
          </div>
          
          {/* Results Display */}
          {(transcriptionResult || transcriptionError || isTranscribing) && (
            <div className="results-section">
              <h4 className="text-lg font-semibold mb-4">Transcription Results</h4>
              
              {/* Loading State */}
              {isTranscribing && (
                <div className="flex justify-center items-center p-10">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-gray-600">Processing your audio with {compareModels ? 'multiple models' : selectedModel}...</p>
                  </div>
                </div>
              )}
              
              {/* Error State */}
              {transcriptionError && (
                <div className="alert alert-danger p-4 bg-red-100 text-red-800 rounded-md">
                  <h5 className="font-semibold mb-2">Transcription Error</h5>
                  <p>{transcriptionError}</p>
                </div>
              )}
              
              {/* Results */}
              {transcriptionResult && !isTranscribing && (
                <div className="result-content mb-8">
                  <div className="card mb-4">
                    <div className="card-header bg-gray-50 flex justify-between items-center">
                      <h5 className="font-semibold">Transcript</h5>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Model: {transcriptionResult.model}</span>
                        <span className="text-sm">
                          Confidence: 
                          <span className={getConfidenceClass(transcriptionResult.confidence)}>
                            {" "}{(transcriptionResult.confidence * 100).toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="transcript-text p-4 bg-white border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                        {transcriptionResult.transcript || <em className="text-gray-500">No transcription available</em>}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            navigator.clipboard.writeText(transcriptionResult.transcript);
                          }}
                        >
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Model Comparison Results */}
                  {comparisonResult && (
                    <div className="card">
                      <div className="card-header bg-gray-50">
                        <h5 className="font-semibold">Model Comparison</h5>
                      </div>
                      <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {Object.entries(comparisonResult.models).map(([model, data]) => (
                            <div key={model} className="card bg-gray-50">
                              <div className="card-body p-4">
                                <h6 className="font-semibold mb-2">{model}</h6>
                                <div className="text-sm space-y-2">
                                  <div className="flex justify-between">
                                    <span>Confidence:</span>
                                    <span className={getConfidenceClass(data.confidence)}>
                                      {(data.confidence * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Processing Time:</span>
                                    <span>{data.processingTime.toFixed(0)} ms</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Word Count:</span>
                                    <span>{data.wordCount}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="comparison-summary card bg-gray-50 p-4">
                          <h6 className="font-semibold mb-2">Summary</h6>
                          <div className="text-sm space-y-2">
                            <p>
                              <span className="font-medium">Fastest Model:</span> {comparisonResult.summary.fastestModel.model} 
                              ({comparisonResult.summary.fastestModel.processingTime.toFixed(0)} ms)
                            </p>
                            <p>
                              <span className="font-medium">Highest Confidence Model:</span> {comparisonResult.summary.highestConfidenceModel.model} 
                              ({(comparisonResult.summary.highestConfidenceModel.confidence * 100).toFixed(1)}%)
                            </p>
                            
                            {comparisonResult.summary.differences && Object.entries(comparisonResult.summary.differences).map(([comparison, data]) => (
                              <p key={comparison}>
                                <span className="font-medium">{comparison} Difference:</span> {data.differentWords} words 
                                ({data.percentageDifference.toFixed(1)}%)
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeepgramTranscriber;

