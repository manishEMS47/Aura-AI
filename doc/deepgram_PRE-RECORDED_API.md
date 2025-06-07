# Deepgram Pre-Recorded Speech-to-Text API

## Overview

The Deepgram Pre-Recorded Audio API allows you to transcribe audio files using advanced speech-to-text technology. This endpoint processes uploaded audio files and returns detailed transcription results along with optional features like sentiment analysis, topic detection, and speaker diarization.

## Endpoint

```
POST https://api.deepgram.com/v1/listen
```

## Authentication

All requests require authentication using an API key in the Authorization header:

```
Authorization: Token DEEPGRAM_API_KEY
```

## Quick Start Example

### Python Implementation

```python
import requests

# Define the URL for the Deepgram API endpoint
url = "https://api.deepgram.com/v1/listen"

# Define the headers for the HTTP request
headers = {
    "Authorization": "Token DEEPGRAM_API_KEY",
    "Content-Type": "audio/*"
}

# Get the audio file
with open("/path/to/youraudio.wav", "rb") as audio_file:
    # Make the HTTP request
    response = requests.post(url, headers=headers, data=audio_file)

print(response.json())
```

## Request Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | ✅ | Header authentication of the form `Token <token>` |
| `Content-Type` | string | ✅ | Set to `audio/*` for audio file uploads |

## Query Parameters

### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | string/enum | - | AI model used to process submitted audio |
| `language` | enum | `en` | BCP-47 language tag for the primary spoken language |
| `version` | string/enum | - | Version of an AI model to use |

### Transcription Features

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `punctuate` | boolean | `false` | Add punctuation and capitalization to the transcript |
| `paragraphs` | boolean | `false` | Split audio into paragraphs to improve readability |
| `utterances` | boolean | `false` | Segment speech into meaningful semantic units |
| `diarize` | boolean | `false` | Recognize speaker changes (assigns speaker numbers) |
| `multichannel` | boolean | `false` | Transcribe each audio channel independently |
| `numerals` | boolean | `false` | Convert numbers from written to numerical format |
| `measurements` | boolean | `false` | Convert spoken measurements to abbreviations |
| `dictation` | boolean | `false` | Identify and extract key entities from audio content |

### Content Processing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `smart_format` | boolean | `false` | Apply additional formatting for improved readability |
| `filler_words` | boolean | `false` | Transcribe interruptions like "uh" and "um" |
| `profanity_filter` | boolean | `false` | Remove or replace profanity in transcripts |
| `redact` | string | - | Remove sensitive information from transcripts |
| `replace` | string | - | Search and replace terms/phrases in audio |
| `search` | string | - | Search for specific terms/phrases in audio |

### Enhancement Features

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keywords` | string | - | Boost or suppress specialized terminology and brands |
| `keyterm` | string | - | Key term prompting (Nova-3 compatible only) |
| `encoding` | enum | - | Specify expected encoding of submitted audio |
| `utt_split` | double | `0.8` | Seconds to wait before detecting word pauses |

### Analysis Features

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sentiment` | boolean | `false` | Recognize sentiment throughout transcript |
| `topics` | boolean | `false` | Detect topics throughout transcript |
| `intents` | boolean | `false` | Recognize speaker intent throughout transcript |
| `summarize` | enum | - | Summarize content (`v1` or `v2`) |
| `detect_entities` | boolean | `false` | Identify and extract key entities |
| `detect_language` | boolean | `false` | Identify dominant spoken language |

### Custom Analysis

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `custom_topic` | string | - | Custom topics to detect (up to 100) |
| `custom_topic_mode` | enum | `extended` | How to interpret custom topics (`extended`/`strict`) |
| `custom_intent` | string | - | Custom intents to detect |
| `custom_intent_mode` | enum | `extended` | How to interpret custom intents (`extended`/`strict`) |

### Callback & Metadata

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | string | - | URL for callback request |
| `callback_method` | enum | `POST` | HTTP method for callback (`POST`/`PUT`) |
| `tag` | string | - | Label requests for usage reporting |
| `extra` | string | - | Arbitrary key-value pairs for downstream processing |
| `mip_opt_out` | boolean | `false` | Opt out of Model Improvement Program |

## Request Body

The request body should contain the audio file data. Supported formats include:

- **Object**: Structured audio data
- **Binary String**: Raw audio file data

## Response Format

### Successful Response (200)

```json
{
  "metadata": {
    "request_id": "a847f427-4ad5-4d67-9b95-db801e58251c",
    "sha256": "154e291ecfa8be6ab8343560bcc109008fa7853eb5372533e8efdefc9b504c33",
    "created": "2024-05-12T18:57:13Z",
    "duration": 25.933313,
    "channels": 1,
    "models": ["30089e05-99d1-4376-b32e-c263170674af"],
    "model_info": {
      "30089e05-99d1-4376-b32e-c263170674af": {
        "name": "2-general-nova",
        "version": "2024-01-09.29447",
        "arch": "nova-2"
      }
    },
    "summary_info": {
      "model_uuid": "67875a7f-c9c4-48a0-aa55-5bdb8a91c34a",
      "input_tokens": 95,
      "output_tokens": 63
    },
    "sentiment_info": {
      "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
      "input_tokens": 105,
      "output_tokens": 105
    },
    "topics_info": {
      "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
      "input_tokens": 105,
      "output_tokens": 7
    },
    "intents_info": {
      "model_uuid": "80ab3179-d113-4254-bd6b-4a2f96498695",
      "input_tokens": 105,
      "output_tokens": 4
    },
    "tags": ["test"],
    "transaction_key": "transaction_key"
  },
  "results": {
    "channels": [{}],
    "utterances": [{}],
    "summary": {
      "result": "success",
      "short": "Speaker 0 discusses the significance of the first all-female spacewalk..."
    },
    "sentiments": {
      "segments": [
        {
          "text": "Yeah. As as much as, um, it's worth celebrating...",
          "start_word": 0,
          "end_word": 69,
          "sentiment": "positive",
          "sentiment_score": 0.5810546875
        }
      ],
      "average": {
        "sentiment": "positive",
        "sentiment_score": 0.5810185185185185
      }
    }
  }
}
```

### Response Structure

#### Metadata Object
- `request_id`: Unique identifier for the request
- `sha256`: SHA256 hash of the audio file
- `created`: Timestamp of request creation
- `duration`: Length of audio in seconds
- `channels`: Number of audio channels
- `models`: Array of model IDs used
- `model_info`: Detailed information about models used
- Token usage information for various features
- `tags`: Custom tags applied to the request

#### Results Object
- `channels`: Transcription results per audio channel
- `utterances`: Segmented speech units
- `summary`: Content summary (if enabled)
- `sentiments`: Sentiment analysis results (if enabled)

## Error Responses

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Invalid request parameters |
| `401` | Unauthorized - Invalid or missing API key |
| `402` | Payment Required - Insufficient credits or billing issue |
| `403` | Forbidden - Access denied to requested resource |

## Best Practices

1. **Audio Quality**: Use high-quality audio files for better transcription accuracy
2. **File Formats**: Supported formats include WAV, MP3, FLAC, and others
3. **Language Detection**: Specify the correct language parameter for optimal results
4. **Feature Selection**: Enable only necessary features to optimize processing time and costs
5. **Error Handling**: Implement proper error handling for all possible response codes

## Rate Limits

Refer to your Deepgram account dashboard for current rate limits and usage quotas.

## Support

For additional help and documentation, visit the [Deepgram Documentation](https://developers.deepgram.com/) or contact support through your Deepgram console.