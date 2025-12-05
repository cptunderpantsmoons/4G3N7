import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get()
  async getDocuments(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.documentService.getDocuments(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 10,
    );
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentService.getDocument(id);
  }

  @Post(':id/process')
  async processDocument(
    @Param('id') id: string,
    @Body() body: { filePath: string; mimeType: string },
  ) {
    return this.documentService.processDocument(id, body.filePath, body.mimeType);
  }

  @Post('compare')
  async compareDocuments(
    @Body() body: { sourceId: string; targetId: string },
  ) {
    return this.documentService.compareDocuments(body.sourceId, body.targetId);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    await this.documentService.deleteDocument(id);
    return { message: 'Document deleted' };
  }
}
