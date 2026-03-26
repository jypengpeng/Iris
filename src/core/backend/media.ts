/**
 * 用户消息中图片/文档的解析与预处理
 */

import type { LLMConfig } from '../../config/types';
import { supportsVision as llmSupportsVision, isDocumentMimeType, supportsNativePDF, supportsNativeOffice } from '../../llm/vision';
import type { OCRProvider } from '../../ocr';
import { createOCRTextPart } from '../../ocr';
import type { Part } from '../../types';
import { resizeImage, formatDimensionNote } from '../../media/image-resize.js';
import { extractDocument } from '../../media/document-extract.js';
import type { DocumentInput } from '../../media/document-extract.js';
import { convertToPDF } from '../../media/office-to-pdf.js';
import type { ImageInput } from './types';
import { createLogger } from '../../logger';

const logger = createLogger('Backend');

/** 媒体处理所需的配置 */
export interface MediaProcessorOptions {
  currentLLMConfig?: LLMConfig;
  ocrService?: OCRProvider;
}

/**
 * 将用户输入的文本、图片、文档转换为存储用的 Part 数组。
 * 包含图片缩放、OCR 回退、文档解析/直传等完整处理流程。
 */
export async function buildStoredUserParts(
  text: string,
  images: ImageInput[] | undefined,
  documents: DocumentInput[] | undefined,
  options: MediaProcessorOptions,
): Promise<Part[]> {
  const parts: Part[] = [];
  const hasText = text.trim().length > 0;
  const hasImages = Array.isArray(images) && images.length > 0;
  const hasDocuments = Array.isArray(documents) && documents.length > 0;
  const visionEnabled = llmSupportsVision(options.currentLLMConfig);

  // ---- 图片处理（含自动缩放） ----
  if (hasImages) {
    if (visionEnabled || !options.ocrService) {
      for (const image of images!) {
        // 自动缩放
        const resized = await resizeImage(image.mimeType, image.data);
        parts.push({ inlineData: { mimeType: resized.mimeType, data: resized.data } });

        // 仅在 vision 启用时添加坐标映射说明（非 vision 模型会剥离图片，dimension note 无意义）
        if (visionEnabled) {
          const dimNote = formatDimensionNote(resized);
          if (dimNote) {
            parts.push({ text: dimNote });
          }
        }
      }
    } else if (options.ocrService) {
      // OCR 模式：先缩放再 OCR
      const resizedImages = await Promise.all(images!.map(async (image) => {
        return await resizeImage(image.mimeType, image.data);
      }));

      const ocrTexts = await Promise.all(resizedImages.map(async (resized, index) => {
        try {
          return await options.ocrService!.extractText(resized.mimeType, resized.data);
        } catch (err) {
          const detail = err instanceof Error ? err.message : String(err);
          throw new Error(`OCR 处理第 ${index + 1} 张图片失败: ${detail}`);
        }
      }));

      for (let index = 0; index < resizedImages.length; index++) {
        const resized = resizedImages[index];
        parts.push({ inlineData: { mimeType: resized.mimeType, data: resized.data } });
        parts.push(createOCRTextPart(index + 1, ocrTexts[index]));
      }
    }
  }

  // ---- 文档处理（按端点能力分级） ----
  if (hasDocuments) {
    const nativePdf = supportsNativePDF(options.currentLLMConfig);
    const nativeOffice = supportsNativeOffice(options.currentLLMConfig);

    const EXTENSION_TO_MIME: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
    };

    for (const doc of documents!) {
      // 解析有效 MIME
      let effectiveMime = doc.mimeType;
      const ext = doc.fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
      if (!isDocumentMimeType(effectiveMime) && ext in EXTENSION_TO_MIME) {
        effectiveMime = EXTENSION_TO_MIME[ext];
      }

      const isPdf = effectiveMime === 'application/pdf';
      const isOffice = isDocumentMimeType(effectiveMime) && !isPdf;

      if (isPdf && nativePdf) {
        // ① PDF 直传（Gemini / Claude / OpenAI Responses）
        parts.push({ inlineData: { mimeType: 'application/pdf', data: doc.data } });
        parts.push({ text: `[Document: ${doc.fileName}]` });
      } else if (isOffice && nativePdf) {
        // ② Office 优先转 PDF 直传（Gemini / Claude / OpenAI Responses）
        const pdfBuffer = await convertToPDF(Buffer.from(doc.data, 'base64'), ext);
        if (pdfBuffer) {
          parts.push({ inlineData: { mimeType: 'application/pdf', data: pdfBuffer.toString('base64') } });
          parts.push({ text: `[Document: ${doc.fileName}]` });
        } else if (nativeOffice) {
          // 转换失败，但端点支持 Office 原生直传（OpenAI Responses）
          parts.push({ inlineData: { mimeType: effectiveMime, data: doc.data } });
          parts.push({ text: `[Document: ${doc.fileName}]` });
        } else {
          // 转换失败，回退文本提取
          await extractDocumentFallback(doc, parts);
        }
      } else if (isOffice && nativeOffice) {
        // ③ 端点支持 Office 但不支持 PDF（当前无此情况，留作扩展）
        parts.push({ inlineData: { mimeType: effectiveMime, data: doc.data } });
        parts.push({ text: `[Document: ${doc.fileName}]` });
      } else {
        // ④ 文本提取（OpenAI Compatible 或不支持原生的情况）
        await extractDocumentFallback(doc, parts);
      }
    }
  }

  if (hasText) {
    parts.push({ text });
  }

  if (parts.length === 0) {
    parts.push({ text: '' });
  }

  return parts;
}

/** 文档回退文本提取（复用原有 extractDocument 逻辑） */
export async function extractDocumentFallback(doc: DocumentInput, parts: Part[]): Promise<void> {
  try {
    const result = await extractDocument(doc);
    if (result.success) {
      parts.push({ text: `[Document: ${doc.fileName}]\n${result.text}` });
    } else {
      logger.warn(`文档提取失败 (${doc.fileName}): ${result.error}`);
      parts.push({ text: `[Document: ${doc.fileName}] 提取失败: ${result.error}` });
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    logger.warn(`文档处理异常 (${doc.fileName}): ${detail}`);
    parts.push({ text: `[Document: ${doc.fileName}] 处理异常: ${detail}` });
  }
}
