# OpenAI Whisper Integration Setup Guide

## Overview
This application now uses **OpenAI Whisper API** for speech-to-text functionality with automatic API key rotation to handle quota limits. The system maintains **Gemini API** for text translation and text-to-speech features.

## Architecture
- **Speech-to-Text**: OpenAI Whisper API (4 API keys with rotation)
- **Text Translation**: Google Gemini API (existing system)
- **Text-to-Speech**: Google Gemini API (existing system)

## Setup Instructions

### 1. Get OpenAI API Keys
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate **4 API keys** for rotation system
4. Each free trial account gets $5 credit for 3 months

### 2. Environment Configuration
1. Copy `.env.example` to `.env`
2. Add your 4 OpenAI API keys:
```env
WHISPER_API_KEY_1=sk-your-first-openai-api-key-here
WHISPER_API_KEY_2=sk-your-second-openai-api-key-here
WHISPER_API_KEY_3=sk-your-third-openai-api-key-here
WHISPER_API_KEY_4=sk-your-fourth-openai-api-key-here
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm run dev
```

## Key Features

### Automatic API Key Rotation
- System automatically switches to next API key when quota is exceeded
- Supports up to 4 OpenAI API keys for extended usage
- Robust error handling with graceful fallbacks

### Language Support
The Whisper integration supports 12+ Indian languages:
- Hindi (hi)
- Bengali (bn)
- Telugu (te)
- Marathi (mr)
- Tamil (ta)
- Gujarati (gu)
- Urdu (ur)
- Kannada (kn)
- Odia (or)
- Malayalam (ml)
- Punjabi (pa)
- Assamese (as)

### Audio Quality
- High-quality transcription with Whisper-1 model
- Supports various audio formats (webm, wav, mp3)
- Enhanced audio processing with gain boost for low-volume speech

## API Usage & Quotas

### OpenAI Whisper (Free Trial)
- **Free Credit**: $5 per account (3 months)
- **Cost**: ~$0.006 per minute of audio
- **Quota**: Approximately 800+ minutes per free account
- **Rate Limits**: 3 RPM (requests per minute) for free tier

### Gemini API (Existing)
- **Free Tier**: 15 requests per minute
- **Used for**: Text translation and text-to-speech only
- **Quota**: Maintained as before

## Troubleshooting

### Common Issues

1. **"Cannot find module 'openai'"**
   - Run `npm install` to install dependencies

2. **"No Whisper API keys found"**
   - Check your `.env` file has all 4 WHISPER_API_KEY_* variables
   - Ensure API keys start with "sk-"

3. **"All API keys quota exhausted"**
   - Wait for quota reset (monthly)
   - Add more API keys from different OpenAI accounts
   - Consider upgrading to paid plan

4. **Audio transcription fails**
   - Check microphone permissions
   - Ensure audio format is supported
   - Check network connectivity

### Monitoring Usage
- Check OpenAI dashboard for usage statistics
- Monitor console logs for key rotation events
- Set up alerts for quota warnings

## Migration Notes

### What Changed
- ✅ Removed Web Speech API (browser-based STT)
- ✅ Removed Gemini STT functionality
- ✅ Added OpenAI Whisper service with key rotation
- ✅ Updated client to use server-side transcription only
- ✅ Maintained all existing Gemini translation/TTS features

### What Stayed the Same
- ✅ Text translation functionality (Gemini)
- ✅ Text-to-speech functionality (Gemini)
- ✅ User interface and chat features
- ✅ Authentication and room management
- ✅ Real-time messaging with Socket.IO

## Performance Benefits
- **Higher Accuracy**: Whisper provides superior transcription quality
- **Better Language Support**: Native support for Indian languages
- **Reliability**: Server-side processing eliminates browser compatibility issues
- **Scalability**: API key rotation extends usage limits

## Cost Optimization Tips
1. Use multiple free OpenAI accounts for more API keys
2. Monitor usage through OpenAI dashboard
3. Consider upgrading to paid plan for heavy usage
4. Implement audio compression to reduce costs

## Support
For issues or questions:
1. Check the troubleshooting section above
2. Review OpenAI documentation: https://platform.openai.com/docs
3. Check application logs for detailed error messages
