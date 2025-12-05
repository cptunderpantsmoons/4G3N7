import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QwenService } from './qwen.service';

@Module({
  imports: [ConfigModule],
  providers: [QwenService],
  exports: [QwenService],
})
export class QwenModule {}
