# Document Processing Microservice - Phase 2 Implementation

## Overview
This document processing microservice provides comprehensive document processing capabilities for the 4G3N7 platform, including extraction, conversion, analysis, and workflow automation.

## Features Implemented

### 2.1 Document Processing Core ✓
- **DOCX Processing** (`docx-processor.service.ts`)
  - Text extraction with metadata
  - HTML and Markdown conversion
  - Image extraction
  - Structured content parsing

- **PDF Processing** (`pdf-processor.service.ts`)
  - Text extraction per page
  - Metadata extraction
  - PDF merging and splitting
  - Watermarking support
  - Page extraction

- **XLSX Processing** (`xlsx-processor.service.ts`)
  - Multi-sheet data extraction
  - CSV conversion
  - JSON conversion
  - Form data extraction
  - Workbook merging
  - Statistics generation

- **OCR Processing** (`ocr-processor.service.ts`)
  - Tesseract.js integration
  - Image preprocessing
  - Language detection
  - Batch recognition
  - Region-specific OCR
  - Confidence analysis

- **Format Conversion** (`format-converter.service.ts`)
  - LibreOffice integration for complex conversions
  - Direct conversions (DOCX→HTML/MD, XLSX→CSV, PDF→TXT)
  - Batch conversion support
  - Supported formats: DOCX, PDF, XLSX, CSV, HTML, TXT, MD, ODT, RTF

- **Metadata Extraction** (`metadata-extractor.service.ts`)
  - Universal metadata extraction
  - File checksum calculation
  - File size and stats
  - Format-specific metadata

- **Document Analysis** (`document-analyzer.service.ts`)
  - Sentiment analysis
  - Language detection
  - Readability scores (Flesch)
  - Keyword extraction (TF-IDF)
  - Topic extraction
  - Document classification

### 2.2 Document Workflow Integration ✓
- **Bull Queue Integration**
  - Redis-backed job queue
  - Workflow orchestration
  - Step-by-step processing
  - Error handling and retry logic

- **Database Schema** (Prisma)
  - `Document` - Main document storage
  - `DocumentVersion` - Version control
  - `DocumentConversion` - Format conversions tracking
  - `DocumentWorkflow` - Workflow execution
  - `DocumentWorkflowStep` - Individual workflow steps
  - `DocumentComparison` - Document diff tracking
  - `DocumentTemplate` - Template management
  - `DocumentIndex` - Search indexing
  - `ProcessingJob` - Job tracking

### 2.3 Desktop Document Integration (Planned)
- LibreOffice headless integration
- Automatic file type detection
- Batch processing support

### 2.4 Enhanced Document Features (Implemented)
- Multi-language support via language detection
- Sentiment analysis
- Document classification
  - Technical
  - Business
  - Legal
  - Medical
  - Financial
- Keyword extraction
- Topic modeling

## Architecture

### Technology Stack
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Bull (Redis)
- **Document Processing**:
  - Mammoth (DOCX)
  - pdf-lib & pdfjs-dist (PDF)
  - xlsx (Spreadsheets)
  - Tesseract.js (OCR)
  - Sharp (Image processing)
  - LibreOffice (Format conversion)
- **NLP**:
  - natural (NLP toolkit)
  - sentiment (Sentiment analysis)
  - franc (Language detection)
- **AI Integration**: OpenAI API for advanced analysis

### Project Structure
```
src/
├── app.module.ts              # Main application module
├── app.controller.ts          # Health check endpoints
├── app.service.ts             # Application service
├── main.ts                    # Application bootstrap
├── prisma/                    # Database layer
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── processing/                # Core processing services
│   ├── docx-processor.service.ts
│   ├── pdf-processor.service.ts
│   ├── xlsx-processor.service.ts
│   ├── ocr-processor.service.ts
│   ├── format-converter.service.ts
│   ├── metadata-extractor.service.ts
│   ├── document-analyzer.service.ts
│   └── processing.module.ts
├── workflow/                  # Workflow orchestration
│   ├── workflow.module.ts
│   ├── workflow.service.ts
│   ├── workflow.controller.ts
│   └── processors/
│       └── document-workflow.processor.ts
└── document/                  # Document management
    ├── document.module.ts
    ├── document.service.ts
    └── document.controller.ts
```

## Installation

```bash
# Install dependencies
cd packages/4g3n7-document-processor
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/document_processor"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=9993
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Object Storage (S3/MinIO)
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=documents

# OpenAI (for advanced analysis)
OPENAI_API_KEY=
```

## Running the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# With Docker
docker build -t 4g3n7-document-processor .
docker run -p 9993:9993 4g3n7-document-processor
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /status` - Service status

### Documents (Planned)
- `POST /documents/upload` - Upload document
- `GET /documents/:id` - Get document
- `POST /documents/:id/process` - Process document
- `POST /documents/:id/convert` - Convert format
- `GET /documents/:id/metadata` - Get metadata
- `POST /documents/:id/analyze` - Analyze document
- `POST /documents/compare` - Compare documents

### Workflows (Planned)
- `POST /workflows` - Create workflow
- `GET /workflows/:id` - Get workflow status
- `POST /workflows/:id/execute` - Execute workflow
- `GET /workflows/:id/steps` - Get workflow steps

## Database Schema

### Key Models
- **Document**: Main document entity with metadata and content
- **DocumentVersion**: Version history
- **DocumentWorkflow**: Workflow definitions and execution
- **DocumentWorkflowStep**: Individual processing steps
- **DocumentComparison**: Document diff results
- **DocumentTemplate**: Reusable templates
- **DocumentIndex**: Full-text search index
- **ProcessingJob**: Async job tracking

## Processing Capabilities

### Supported Input Formats
- DOCX (Microsoft Word)
- PDF
- XLSX (Excel)
- CSV
- Images (for OCR)
- HTML
- TXT
- ODT (OpenDocument)
- RTF

### Output Formats
- PDF
- DOCX
- XLSX
- CSV
- HTML
- Markdown
- Plain Text
- JSON

### Analysis Features
- **Text Analysis**
  - Word count, character count
  - Sentence and paragraph count
  - Reading level (Flesch score)
  
- **Sentiment Analysis**
  - Overall sentiment score
  - Positive/negative word identification
  
- **Language Processing**
  - Automatic language detection
  - Keyword extraction
  - Topic modeling
  
- **Classification**
  - Document type classification
  - Content categorization

### Workflow Capabilities
- Multi-step document processing
- Batch processing
- Error recovery
- Progress tracking
- Template-based workflows
- Conditional logic
- Parallel processing

## Integration with 4G3N7 Platform

### File Storage
- Integration with existing S3/MinIO object storage
- Presigned URL support for uploads/downloads
- Version control and backup

### Authentication
- Compatible with 4G3N7 auth system
- Role-based access control (RBAC)

### Microservice Communication
- RESTful API
- Event-driven architecture
- Bull queues for async processing

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Next Steps

To complete the implementation:

1. **Install Dependencies**
   ```bash
   cd packages/4g3n7-document-processor
   npm install
   ```

2. **Create Missing Controllers and Services**
   - Document controller and service
   - Workflow controller and service
   - Workflow processors

3. **Set up Redis**
   - Install Redis locally or use Docker
   - Configure connection in environment

4. **Install LibreOffice**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libreoffice
   
   # macOS
   brew install libreoffice
   ```

5. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Create Dockerfile**
   - Base image with Node.js
   - Install LibreOffice
   - Copy source and dependencies
   - Configure entry point

7. **Add to Docker Compose**
   - Add service definition
   - Link to PostgreSQL and Redis
   - Configure environment variables

8. **Implement Remaining Features**
   - Document comparison
   - Advanced NER (Named Entity Recognition)
   - Document summarization with AI
   - Translation capabilities
   - Security and redaction features

## Security Considerations

- File upload size limits
- Virus scanning integration
- Content sanitization
- Access control
- Audit logging
- Encryption at rest
- Secure document disposal

## Performance Optimization

- Caching frequently accessed documents
- Lazy loading for large documents
- Streaming for large file transfers
- Background processing for heavy operations
- Connection pooling
- Query optimization with indexes

## Monitoring and Logging

- Structured logging
- Performance metrics
- Error tracking
- Queue monitoring
- Resource usage tracking

## Documentation

- API documentation (Swagger/OpenAPI)
- Code documentation (JSDoc)
- Usage examples
- Integration guides

## License

Same as 4G3N7 platform
