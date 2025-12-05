# 4G3N7 AI Providers Configuration Guide

Complete guide to configuring all supported AI providers in 4G3N7, including the latest December 2025 models.

---

## 🚀 **Supported AI Providers**

### **1. Anthropic Claude** ✅ **Recommended**
**Latest Model**: Claude 4.5 Sonnet (October 2025)

**Environment Variables:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxx
```

**Available Models:**
- `claude-4-5-sonnet-20241022` (Latest) - 200K context
- `claude-opus-4-1-20250805` - High performance
- `claude-sonnet-4-20250514` - Previous version

**Best For:** Complex reasoning, coding, analysis

---

### **2. OpenRouter** ✅ **Multi-Provider Hub**
**Latest Models**: GPT-5.1, Claude 4.5, Gemini 2.0

**Environment Variables:**
```bash
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://your-site.com
OPENROUTER_APP_NAME=4G3N7
```

**Premium Models (Latest December 2025):**
- `anthropic/claude-4.5-sonnet` - Claude 4.5 (200K context)
- `openai/gpt-5.1` - GPT-5.1 (256K context)
- `google/gemini-2.0-pro` - Gemini 2.0 (1M context!)

**Standard Models (Cost-Effective):**
- `anthropic/claude-3.5-sonnet` - Claude 3.5
- `openai/gpt-4o` - GPT-4o
- `meta-llama/llama-4-405b-instruct` - Llama 4

**Best For:** Model flexibility, cost optimization, accessing multiple providers

---

### **3. OpenAI** ✅ **Official**
**Latest Model**: GPT-5.1 (December 2025)

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-proj-xxx
```

**Available Models:**
- `gpt-5.1` (Latest) - 256K context
- `gpt-4o` - 128K context
- `gpt-4-turbo` - Legacy support

**Best For:** Official OpenAI models, highest reliability

---

### **4. Google Gemini** ✅ **Official**
**Latest Model**: Gemini 2.0 Pro (November 2025)

**Environment Variables:**
```bash
GEMINI_API_KEY=xxx
```

**Available Models:**
- `gemini-2.0-pro` - 1M context window
- `gemini-1.5-pro` - Previous version
- `gemini-1.5-flash` - Fast responses

**Best For:** Large context windows, multimodal tasks

---

### **5. Qwen (Alibaba)** ✅ **Cost-Effective**
**Latest Model**: Qwen 3.0 (December 2025)

**Environment Variables:**
```bash
QWEN_API_KEY=sk-xxx
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
```

**Latest Models:**
- `qwen/qwen3.0-72b-instruct` (Latest) - 327K context
- `qwen/qwen3.0-vl-72b` - Latest vision model
- `qwen/qwen2.5-vl-72b-instruct` - Proven vision model
- `qwen/qwen2.5-72b-instruct` - Text-only
- `qwen/qwen2.5-32b-instruct` - Cost-effective
- `qwen/qwen2.5-14b-instruct` - Budget option

**Best For:** Vision-language tasks, cost-effective alternatives

---

## ⚙️ **Configuration for Railway**

### **Step 1: Choose Your Primary Provider**
Select one primary provider for your main AI tasks.

**Recommended for Production:**
- **Anthropic Claude** (best reasoning, recent Sonnet fix)
- **OpenRouter** (model flexibility, cost control)

### **Step 2: Set Environment Variables in Railway**
In your Railway project dashboard:

**Required (Choose at least one):**
```bash
# For Anthropic (Recommended)
ANTHROPIC_API_KEY=your_key_here

# For OpenRouter (Multi-provider)
OPENROUTER_API_KEY=your_key_here

# For Direct OpenAI
OPENAI_API_KEY=your_key_here

# For Google Gemini
GEMINI_API_KEY=your_key_here

# For Qwen (Alibaba)
QWEN_API_KEY=your_key_here
```

**Optional Provider Configuration:**
```bash
# OpenRouter Settings
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=https://your-domain.com
OPENROUTER_APP_NAME=4G3N7

# Qwen Settings
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
```

### **Step 3: Deploy and Test**
1. Deploy with Railway
2. Test with your chosen provider
3. Monitor performance and costs

---

## 💰 **Cost Comparison (December 2025)**

| Provider | Model | Input (1M tokens) | Output (1M tokens) | Best For |
|----------|-------|------------------|-------------------|----------|
| Anthropic | Claude 4.5 | $15.00 | $75.00 | Complex reasoning |
| OpenRouter | Claude 4.5 | $18.00 | $90.00 | Multi-provider hub |
| OpenAI | GPT-5.1 | $20.00 | $100.00 | Latest GPT |
| Google | Gemini 2.0 | $7.00 | $21.00 | Large context |
| Qwen | Qwen 3.0 | $5.00 | $15.00 | Vision-language |

---

## 🔧 **Provider Selection Guidelines**

### **Choose Anthropic Claude if:**
- You need the best reasoning capabilities
- You experienced Sonnet compatibility issues (fixed with 4.5)
- Budget allows premium pricing

### **Choose OpenRouter if:**
- You want access to all latest models (GPT-5.1, Claude 4.5, Gemini 2.0)
- You need model flexibility and fallbacks
- You want cost optimization across providers

### **Choose Qwen if:**
- You need vision-language capabilities
- You want cost-effective alternatives
- You're comfortable with Alibaba Cloud

### **Choose OpenAI if:**
- You need official OpenAI models
- You require maximum reliability
- You have existing OpenAI integrations

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **API Key Errors**
```bash
# Verify API key format
ANTHROPIC_API_KEY=sk-ant-api03-xxxx  # Correct
OPENROUTER_API_KEY=sk-or-v1-xxxx     # Correct
```

#### **Model Not Available**
```bash
# Check if model name is correct
# OpenRouter models use prefix: anthropic/claude-4.5-sonnet
# Direct API uses: claude-4-5-sonnet-20241022
```

#### **Rate Limiting**
```bash
# Implement request queuing
# Monitor usage in provider dashboard
# Consider provider switching for high volume
```

#### **Provider Fallbacks**
```bash
# System will automatically try other providers
# Configure multiple provider keys for reliability
# Monitor which provider performs best for your use case
```

---

## 🎯 **Recommended Setup for Production**

```bash
# Primary Provider (Best Reasoning)
ANTHROPIC_API_KEY=your_key

# Backup Provider (Cost Optimization)
OPENROUTER_API_KEY=your_key

# Alternative (Vision-Language)
QWEN_API_KEY=your_key

# Configuration
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=4G3N7
QWEN_API_BASE=https://dashscope.aliyuncs.com/compatible-mode/v1
```

This setup gives you:
✅ Primary reasoning capability with Claude 4.5
✅ Cost optimization with OpenRouter
✅ Vision-language support with Qwen
✅ Built-in fallbacks and redundancy

---

## 📈 **Performance Tips**

1. **Start with Anthropic Claude 4.5** (fixed your Sonnet issues)
2. **Add OpenRouter** for model flexibility and cost control
3. **Use Qwen** for vision tasks or budget constraints
4. **Monitor usage** to optimize costs
5. **Test multiple models** for your specific use case

**Your 4G3N7 system now supports the latest December 2025 AI models with enterprise-grade reliability!** 🎉