<div align="center">

<img src="docs/images/4g3n7-logo.png" width="500" alt="4G3N7 Logo">

# 4G3N7: Open-Source AI Desktop Agent

**An AI that has its own computer to complete tasks for you**

[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://github.com/4g3n7/4g3n7/tree/main/docker)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

[🌐 Website](https://www.4g3n7.io) • [📚 Documentation](https://docs.4g3n7.io) • [📖 Product Manuals](./PRODUCT_MANUALS/)

</div>

---

## What is a Desktop Agent?

A desktop agent is an AI that has its own computer. Unlike browser-only agents or traditional RPA tools, 4G3N7 comes with a full virtual desktop where it can:

- Use any application (browsers, email clients, office tools, IDEs)
- Download and organize files with its own file system
- Log into websites and applications using password managers
- Read and process documents, PDFs, and spreadsheets
- Complete complex multi-step workflows across different programs

Think of it as a virtual employee with their own computer who can see the screen, move the mouse, type on the keyboard, and complete tasks just like a human would.

## 🚀 What's New: Goose Bridge Integration

4G3N7 now features the **Goose Bridge Integration**, a powerful extension system that enhances automation capabilities:

### Key Features of Goose Bridge:
- **Extension Management**: Install, configure, and manage specialized automation extensions
- **Workflow Orchestration**: Create complex multi-step workflows with conditional logic
- **Real-time Monitoring**: Track task progress and system health in real-time
- **Advanced Task Processing**: Enhanced document processing and data extraction
- **Marketplace Integration**: Access to a growing library of pre-built extensions

### Supported Extensions:
- **Web Scraper**: Extract data from websites with advanced selectors
- **API Client**: Connect to external APIs and process responses
- **Document Processor**: Handle PDFs, DOCX, XLSX with OCR capabilities
- **Browser Automation**: Advanced browser control and interaction
- **Office Automation**: Process Microsoft Office documents
- **IDE Automation**: Control development environments
- **Communication Tools**: Email and messaging automation

[📖 Learn more about Goose Bridge Integration](./PRODUCT_MANUALS/Integration_Guide/Goose_Bridge_Integration.md)

## Why Give AI Its Own Computer?

When AI has access to a complete desktop environment, it unlocks capabilities that aren't possible with browser-only agents or API integrations:

### Complete Task Autonomy

Give 4G3N7 a task like "Download all invoices from our vendor portals and organize them into a folder" and it will:

- Open the browser
- Navigate to each portal
- Handle authentication (including 2FA via password managers)
- Download the files to its local file system
- Organize them into a folder

### Process Documents

Upload files directly to 4G3N7's desktop and it can:

- Read entire PDFs into its context
- Extract data from complex documents
- Cross-reference information across multiple files
- Create new documents based on analysis
- Handle formats that APIs can't access

### Use Real Applications

4G3N7 isn't limited to web interfaces. It can:

- Use desktop applications like text editors, VS Code, or email clients
- Run scripts and command-line tools
- Install new software as needed
- Configure applications for specific workflows

## Quick Start

### Deploy in 2 Minutes

**Docker Compose**
```bash
git clone https://github.com/4g3n7/4g3n7.git
cd 4g3n7

# Add your AI provider key (choose one)
echo "ANTHROPIC_API_KEY=sk-ant-..." > docker/.env
# Or: echo "OPENAI_API_KEY=sk-..." > docker/.env
# Or: echo "GEMINI_API_KEY=..." > docker/.env

docker-compose -f docker/docker-compose.yml up -d

# Open http://localhost:9992
```

[Full deployment guide →](https://docs.4g3n7.io/quickstart)

## How It Works

4G3N7 consists of four integrated components:

1. **Virtual Desktop**: A complete Ubuntu Linux environment with pre-installed applications
2. **AI Agent**: Understands your tasks and controls the desktop to complete them
3. **Task Interface**: Web UI where you create tasks and watch 4G3N7 work
4. **APIs**: REST endpoints for programmatic task creation and desktop control

### Key Features

- **Natural Language Tasks**: Just describe what you need done
- **File Uploads**: Drop files onto tasks for 4G3N7 to process
- **Live Desktop View**: Watch 4G3N7 work in real-time
- **Takeover Mode**: Take control when you need to help or configure something
- **Password Manager Support**: Install 1Password, Bitwarden, etc. for automatic authentication
- **Persistent Environment**: Install programs and they stay available for future tasks
- **Goose Bridge Extensions**: Enhanced automation with specialized extensions

## Example Tasks

### Basic Examples
```
"Go to Wikipedia and create a summary of quantum computing"
"Research flights from NYC to London and create a comparison document"
"Take screenshots of the top 5 news websites"
```

### Document Processing
```
"Read the uploaded contracts.pdf and extract all payment terms and deadlines"
"Process these 5 invoice PDFs and create a summary report"
"Download and analyze the latest financial report and answer: What were the key risks mentioned?"
```

### Multi-Application Workflows
```
"Download last month's bank statements from our three banks and consolidate them"
"Check all our vendor portals for new invoices and create a summary report"
"Log into our CRM, export the customer list, and update records in the ERP system"
```

### Goose Bridge Extensions
```
"Use the web scraper to extract product data from 10 e-commerce sites"
"Process these documents using OCR and extract all contact information"
"Automate our monthly reporting workflow using the document processor extension"
```

## Programmatic Control

### Create Tasks via API
```python
import requests

# Simple task
response = requests.post('http://localhost:9991/tasks', json={
    'description': 'Download the latest sales report and create a summary'
})

# Task with file upload
files = {'files': open('contracts.pdf', 'rb')}
response = requests.post('http://localhost:9991/tasks',
    data={'description': 'Review these contracts for important dates'},
    files=files
)

# Goose Bridge task
response = requests.post('http://localhost:9992/api/v1/goose/tasks', json={
    'type': 'web-scrape',
    'payload': {
        'url': 'https://example.com',
        'selectors': ['h1', 'p', '.content']
    }
})
```

### Direct Desktop Control
```bash
# Take a screenshot
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "screenshot"}'

# Click at specific coordinates
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "click_mouse", "coordinate": [500, 300]}'
```

[Full API documentation →](https://docs.4g3n7.io/api-reference/introduction)

## Setting Up Your Desktop Agent

### 1. Deploy 4G3N7
Use one of the deployment methods above to get 4G3N7 running.

### 2. Configure the Desktop
Use the Desktop tab in the UI to:
- Install additional programs you need
- Set up password managers for authentication
- Configure applications with your preferences
- Log into websites you want 4G3N7 to access

### 3. Set Up Goose Bridge Extensions
- Browse the extension marketplace
- Install extensions for your specific needs
- Configure extension settings
- Create workflows using the task wizard

### 4. Start Giving Tasks
Create tasks in natural language and watch 4G3N7 complete them using the configured desktop.

## Use Cases

### Business Process Automation
- Invoice processing and data extraction
- Multi-system data synchronization
- Report generation from multiple sources
- Compliance checking across platforms

### Development & Testing
- Automated UI testing
- Cross-browser compatibility checks
- Documentation generation with screenshots
- Code deployment verification

### Research & Analysis
- Competitive analysis across websites
- Data gathering from multiple sources
- Document analysis and summarization
- Market research compilation

### Enterprise Integration
- ERP system automation
- CRM data management
- Email and communication automation
- Document workflow automation

## Architecture

4G3N7 is built with:

- **Desktop**: Ubuntu 22.04 with XFCE, Firefox, VS Code, and other tools
- **Agent**: NestJS service that coordinates AI and desktop actions
- **UI**: Next.js application for task management
- **AI Support**: Works with Anthropic Claude, OpenAI GPT, Google Gemini
- **Goose Bridge**: Extension system for enhanced automation
- **Deployment**: Docker containers for easy self-hosting

### System Components
```
┌─────────────────────────────────────────────────────────┐
│                    4G3N7 UI (Next.js)                   │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │   Task Manager  │  │   Goose Bridge Integration    │ │
│  └─────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────┐
│                4G3N7 Agent (NestJS)                     │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  Task Manager   │  │   Goose Bridge Service        │ │
│  └─────────────────┘  └───────────────────────────────┘ │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  AI Providers   │  │   File Storage Service        │ │
│  └─────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │ gRPC/HTTP
                              ▼
┌─────────────────────────────────────────────────────────┐
│              4G3N7 Desktop Daemon                       │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  VNC Server     │  │   Computer Use Service        │ │
│  └─────────────────┘  └───────────────────────────────┘ │
│  ┌─────────────────┐  ┌───────────────────────────────┐ │
│  │  Desktop Env.   │  │   Input Tracking              │ │
│  └─────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Why Self-Host?

- **Data Privacy**: Everything runs on your infrastructure
- **Full Control**: Customize the desktop environment as needed
- **No Limits**: Use your own AI API keys without platform restrictions
- **Flexibility**: Install any software, access any systems
- **Enterprise Ready**: Scale to meet your organization's needs

## Advanced Features

### Multiple AI Providers
Use any AI provider through our [LiteLLM integration](https://docs.4g3n7.io/deployment/litellm):

- Azure OpenAI
- AWS Bedrock
- Local models via Ollama
- 100+ other providers

### Goose Bridge Extensions
Enhance 4G3N7 with specialized extensions:

- **Web Automation**: Advanced web scraping and browser control
- **Document Processing**: PDF, DOCX, XLSX with OCR capabilities
- **API Integration**: Connect to external services and APIs
- **Data Analysis**: Extract insights from complex datasets
- **Communication**: Email, messaging, and notification automation

### Enterprise Deployment
Deploy on Kubernetes with Helm:
```bash
# Clone the repository
git clone https://github.com/4g3n7/4g3n7.git
cd 4g3n7

# Install with Helm
helm install 4g3n7 ./helm \
  --set agent.env.ANTHROPIC_API_KEY=sk-ant-...
```

[Enterprise deployment guide →](https://docs.4g3n7.io/deployment/helm)

## Documentation

### Product Manuals
Comprehensive documentation is available in the [PRODUCT_MANUALS](./PRODUCT_MANUALS/) directory:

- [📖 User Guide](./PRODUCT_MANUALS/User_Guide/README.md) - For end-users
- [🔧 Administrator Guide](./PRODUCT_MANUALS/Administrator_Guide/README.md) - For system administrators
- [💻 Developer Guide](./PRODUCT_MANUALS/Developer_Guide/README.md) - For developers
- [📚 API Reference](./PRODUCT_MANUALS/API_Reference/README.md) - Complete API documentation
- [🔗 Integration Guide](./PRODUCT_MANUALS/Integration_Guide/README.md) - Integration documentation

### Online Documentation
- **Documentation**: Comprehensive guides at [docs.4g3n7.io](https://docs.4g3n7.io)
- **API Reference**: Complete API documentation and examples
- **Deployment Guides**: Docker, Kubernetes, and cloud deployment
- **Integration Guides**: Goose Bridge and third-party integrations

## Community & Support

- **Documentation**: Comprehensive guides at [docs.4g3n7.io](https://docs.4g3n7.io)
- **GitHub Issues**: Report bugs and request features
- **Product Manuals**: Detailed documentation in [PRODUCT_MANUALS](./PRODUCT_MANUALS/)

## Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📚 Documentation improvements
- 🌐 Translations

Please:

1. Check existing [issues](https://github.com/4g3n7/app/issues) first
2. Open an issue to discuss major changes
3. Submit PRs with clear descriptions

## License

4G3N7 is open source under the Apache 2.0 license.

---

<div align="center">

**Give your AI its own computer. See what it can do.**

<sub>Built by 4G3N7 Industries and the open source community</sub>

</div>
