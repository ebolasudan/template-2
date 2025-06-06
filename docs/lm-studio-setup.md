# LM Studio Integration Guide

This guide explains how to set up and use LM Studio with the AI Template for local LLM inference.

## 🚀 What is LM Studio?

LM Studio is a desktop application that allows you to run large language models locally on your machine. This provides:

- **Privacy**: Your data never leaves your machine
- **No API costs**: No per-token charges
- **Offline capability**: Works without internet connection
- **Model flexibility**: Use any compatible local model

## 📋 Prerequisites

- [LM Studio](https://lmstudio.ai/) installed on your machine
- At least 8GB RAM (16GB+ recommended for larger models)
- Compatible GPU (optional but recommended for faster inference)

## 🛠️ Setup Instructions

### 1. Install and Configure LM Studio

1. **Download LM Studio** from [lmstudio.ai](https://lmstudio.ai/)
2. **Install a model**:
   - Open LM Studio
   - Go to the "Discover" tab
   - Search for models (recommended: `microsoft/DialoGPT-medium`, `Meta-Llama-3-8B-Instruct`, or similar)
   - Download your preferred model

3. **Start the Local Server**:
   - Go to the "Local Server" tab
   - Select your downloaded model
   - Click "Start Server"
   - Note the server URL (usually `http://localhost:1234`)

### 2. Configure the Template

1. **Set Environment Variables**:
   ```bash
   # In your .env.local file
   LM_STUDIO_BASE_URL=http://localhost:1234
   LM_STUDIO_API_KEY=  # Leave empty unless LM Studio requires auth
   ```

2. **Verify Connection**:
   ```bash
   npm run check:env
   ```

### 3. Test the Integration

```typescript
import { useChat } from '@/lib/hooks/useChat';

function MyComponent() {
  const { messages, sendMessage } = useChat('lmstudio');
  
  const handleSend = async () => {
    await sendMessage('Hello from local LLM!');
  };
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## 🔧 Configuration Options

### LM Studio Server Settings

In LM Studio's Local Server tab, you can configure:

- **Port**: Default is 1234, change if needed
- **Cross-Origin**: Enable if accessing from web browser
- **API Key**: Optional authentication
- **Model Parameters**: Temperature, max tokens, etc.

### Template Configuration

The template automatically detects LM Studio availability and includes it in the AI router:

```typescript
import { useAIRouter } from '@/lib/ai/router';

function ChatComponent() {
  const { chat, getProviders } = useAIRouter();
  const providers = getProviders();
  
  // providers will include 'lmstudio' if configured
  console.log(providers);
}
```

## 🚀 Advanced Usage

### Custom Model Parameters

LM Studio supports additional parameters for fine-tuning responses:

```typescript
import { apiClient } from '@/lib/api/client';

const response = await apiClient.chatWithLMStudio({
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  repeat_penalty: 1.1,
  stop: ['</s>', '\n\n'],
});
```

### Model Selection

If you have multiple models loaded in LM Studio:

```typescript
const response = await apiClient.chatWithLMStudio({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: 'llama-2-7b-chat', // Specify model name
});
```

### Automatic Fallback

The AI router can automatically fall back to cloud providers if LM Studio is unavailable:

```typescript
import { AIRouter } from '@/lib/ai/router';

const router = new AIRouter({
  defaultProvider: 'lmstudio',
  fallbackEnabled: true, // Falls back to OpenAI/Anthropic if LM Studio fails
});
```

## 🎛️ Recommended Models

### For Chat Applications:
- **Llama 2 Chat (7B/13B)**: Good balance of speed and quality
- **Mistral 7B Instruct**: Fast and efficient
- **CodeLlama**: Excellent for code-related tasks

### For Coding:
- **CodeLlama 7B/13B**: Specialized for code generation
- **WizardCoder**: Strong coding capabilities
- **StarCoder**: Multi-language code model

### Model Size Guidelines:
- **7B models**: 8GB+ RAM, good for most tasks
- **13B models**: 16GB+ RAM, better quality
- **30B+ models**: 32GB+ RAM, best quality but slower

## 🔍 Troubleshooting

### Common Issues

**1. Connection Refused**
```
Error: Cannot connect to LM Studio
```
- Ensure LM Studio server is running
- Check if the port (1234) is correct
- Verify firewall settings

**2. Model Not Loading**
```
Error: No model loaded
```
- Load a model in LM Studio before starting the server
- Check if the model is compatible

**3. Slow Responses**
- Use smaller models (7B instead of 13B+)
- Enable GPU acceleration in LM Studio
- Increase system RAM allocation

**4. Out of Memory**
- Use quantized models (Q4, Q5)
- Reduce context length
- Close other applications

### Performance Optimization

1. **Enable GPU Acceleration**:
   - In LM Studio settings, enable GPU layers
   - Start with 10-20 layers, adjust based on VRAM

2. **Optimize Context Length**:
   ```typescript
   const response = await apiClient.chatWithLMStudio({
     messages: messages.slice(-10), // Keep only last 10 messages
     maxTokens: 512, // Limit response length
   });
   ```

3. **Use Quantized Models**:
   - Q4_K_M: Good balance of size and quality
   - Q5_K_M: Higher quality, larger size
   - Q8_0: Highest quality, largest size

## 🔒 Privacy Benefits

Using LM Studio provides:

- **Complete Data Privacy**: All processing happens locally
- **No Internet Required**: Works offline
- **No API Limits**: No rate limiting or token costs
- **Custom Models**: Use specialized or fine-tuned models

## 📊 Performance Comparison

| Provider | Privacy | Cost | Speed | Quality |
|----------|---------|------|-------|---------|
| OpenAI | ❌ Cloud | 💰 Pay-per-use | ⚡ Fast | 🌟 Excellent |
| Anthropic | ❌ Cloud | 💰 Pay-per-use | ⚡ Fast | 🌟 Excellent |
| LM Studio | ✅ Local | 💸 Free | 🐌 Depends on HW | ⭐ Good |

## 🔄 Integration Examples

### Simple Chat
```typescript
const { messages, sendMessage } = useChat('lmstudio');
```

### With AI Router (Auto-selection)
```typescript
const { chat } = useAIRouter({
  defaultProvider: 'auto', // Will consider LM Studio
  costOptimization: true,  // Prefers free local models
});
```

### Direct API Call
```typescript
const stream = await apiClient.streamChatWithLMStudio({
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
});
```

## 📚 Additional Resources

- [LM Studio Documentation](https://lmstudio.ai/docs)
- [Hugging Face Models](https://huggingface.co/models)
- [GGML Format Guide](https://github.com/ggerganov/ggml)
- [Quantization Explained](https://huggingface.co/blog/quantization)

## 💡 Tips

1. Start with smaller models and scale up based on your hardware
2. Use the AI router for automatic provider selection
3. Monitor RAM usage when running large models
4. Keep LM Studio updated for the latest features
5. Experiment with different models for your specific use case