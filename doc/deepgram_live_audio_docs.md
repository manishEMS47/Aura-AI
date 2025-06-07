# Deepgram Speech-to-Text Live Audio API

## Overview

The Deepgram Live Audio API provides real-time speech-to-text transcription using WebSocket connections. This allows you to stream audio data and receive transcription results in real-time.

## WebSocket Endpoint

```
wss://api.deepgram.com/v1/listen
```

**Method:** `GET` (WebSocket handshake)  
**Status:** `101 Switching Protocols`

## Authentication

### Headers

| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Authorization` | string | Yes | API key for authentication. Format: `token <DEEPGRAM_API_KEY>` or `Bearer <JWT_TOKEN>` |

## Query Parameters

### Basic Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `channels` | string | `1` | Number of channels in the submitted audio |
| `encoding` | enum | - | Expected encoding of submitted audio (see encoding values below) |
| `sample_rate` | string | - | Sample rate of submitted audio (required when encoding is provided) |
| `language` | enum | `en` | BCP-47 language tag for primary spoken language |
| `model` | enum | - | AI model to use for transcription |
| `version` | string | `latest` | Version of AI model to use |

### Transcription Features

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `punctuate` | boolean | `false` | Add punctuation and capitalization to transcript |
| `smart_format` | boolean | `false` | Apply additional formatting for improved readability |
| `numerals` | boolean | `false` | Convert written numbers to numerical format |
| `profanity_filter` | boolean | `false` | Filter or replace profanity in transcripts |
| `filler_words` | boolean | `false` | Include filler words like "uh" and "um" |
| `diarize` | boolean | `false` | Recognize speaker changes (assigns speaker numbers) |
| `multichannel` | boolean | `false` | Transcribe each audio channel independently |

### Real-time Control

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `interim_results` | boolean | `false` | Receive ongoing transcription updates as audio is processed |
| `endpointing` | string | `10` | Time (seconds) to wait before finalizing transcription, or `false` to disable |
| `utterance_end` | string | - | Time to wait before sending UtteranceEnd message (use with interim_results) |
| `vad_events` | boolean | `false` | Receive Speech Started messages when speech begins |

### Content Processing

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keywords` | string | - | Boost or suppress specialized terminology and brands |
| `keyterm` | array | - | Key term prompting (Nova-3 compatible only) |
| `search` | string | - | Search for specific terms or phrases in audio |
| `replace` | string | - | Replace specific terms or phrases in transcripts |
| `redact` | enum | `false` | Remove sensitive information from transcripts |
| `dictation` | boolean | `false` | Identify and extract key entities from audio content |

### Callback & Metadata

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | string | - | URL for callback requests |
| `callback_method` | enum | `POST` | HTTP method for callbacks (`POST`, `GET`, `PUT`, `DELETE`) |
| `tag` | string | - | Label requests for usage reporting identification |
| `extra` | string | - | Arbitrary key-value pairs attached to API response |
| `mip_opt_out` | string | `false` | Opt out of Deepgram Model Improvement Program |

### Encoding Values

```
linear16, flac, mulaw, alaw, mp3, opus, ogg_opus, ogg_vorbis, webm_opus
```

## Message Types

### Sending Messages

#### Audio Data
Send raw audio data as binary WebSocket messages or base64-encoded strings.

#### Control Messages

**Finalize Message**
```json
{
  "type": "Finalize"
}
```

**Close Stream Message**
```json
{
  "type": "CloseStream"
}
```

**Keep Alive Message**
```json
{
  "type": "KeepAlive"
}
```

### Receiving Messages

#### Transcription Response
```json
{
  "channel": {
    "alternatives": [
      {
        "transcript": "Hello, world! Welcome to Deepgram!",
        "confidence": 0.98,
        "words": [
          {
            "word": "hello",
            "start": 0.1,
            "end": 0.5,
            "confidence": 0.99,
            "punctuated_word": "Hello,"
          },
          {
            "word": "world",
            "start": 0.6,
            "end": 0.8,
            "confidence": 0.98,
            "punctuated_word": "world!"
          }
        ]
      }
    ]
  },
  "metadata": {
    "model_info": {
      "name": "nova-2",
      "version": "1.0.0",
      "arch": "transformer"
    },
    "request_id": "987fcdeb-51a2-43b7-91e4-c95bafcda21a",
    "model_uuid": "123e4567-e89b-12d3-a456-426614174000"
  },
  "type": "Results",
  "duration": 2,
  "start": 0,
  "is_final": true,
  "speech_final": true
}
```

#### Metadata Response
```json
{
  "type": "Metadata",
  "request_id": "uuid",
  "sha256": "hash",
  "created": "timestamp",
  "duration": 0.0,
  "channels": 1
}
```

#### Finalize Response
```json
{
  "type": "Finalize",
  "channel": 0
}
```

#### Close Stream Response
```json
{
  "type": "CloseStream",
  "request_id": "uuid",
  "sha256": "hash",
  "created": "timestamp",
  "duration": 0.0,
  "channels": 1
}
```

#### Close Frame (Error)
```json
{
  "code": 1000,
  "payload": "None"
}
```

**Error Codes:**
- `None` - Normal closure
- `DATA-0000` - Data error
- `NET-0000` - Network error
- `NET-0001` - Network timeout

## Response Fields

### Transcription Results

| Field | Type | Description |
|-------|------|-------------|
| `transcript` | string | The transcribed text |
| `confidence` | number | Confidence score (0-1) |
| `words` | array | Individual word details with timing and confidence |
| `is_final` | boolean | Whether this is the final result for this audio segment |
| `speech_final` | boolean | Whether speech has ended for this segment |
| `from_finalize` | boolean | Whether result came from a finalize message |
| `duration` | number | Duration of the audio segment in seconds |
| `start` | number | Start time of the audio segment |
| `channel_index` | array | Channel indices for multichannel audio |

### Word Details

| Field | Type | Description |
|-------|------|-------------|
| `word` | string | The recognized word |
| `start` | number | Start time in seconds |
| `end` | number | End time in seconds |
| `confidence` | number | Confidence score for this word |
| `punctuated_word` | string | Word with punctuation applied |

## Usage Examples

### Basic Connection
```javascript
const socket = new WebSocket('wss://api.deepgram.com/v1/listen?punctuate=true&interim_results=true', [], {
  headers: {
    'Authorization': 'token YOUR_DEEPGRAM_API_KEY'
  }
});
```

### With Multiple Parameters
```javascript
const params = new URLSearchParams({
  'punctuate': 'true',
  'smart_format': 'true',
  'interim_results': 'true',
  'endpointing': '300',
  'language': 'en-US',
  'model': 'nova-2'
});

const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`);
```

## Best Practices

1. **Enable interim results** for real-time feedback
2. **Use appropriate endpointing** values based on your use case
3. **Handle connection errors** gracefully with reconnection logic
4. **Send keep-alive messages** for long-lived connections
5. **Process final results** separately from interim results
6. **Monitor confidence scores** to gauge transcription quality