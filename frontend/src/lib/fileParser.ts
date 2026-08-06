import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface ParsedDocument {
  pages: string[]; // Each string is the text of a page
  isTextFile: boolean;
}

export async function parseFile(file: File): Promise<ParsedDocument> {
  const name = file.name.toLowerCase();
  
  if (name.endsWith('.txt')) {
    const text = await file.text();
    return { pages: [text], isTextFile: true };
  }
  
  if (name.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(' ');
      pages.push(text);
    }
    return { pages, isTextFile: false };
  }
  
  if (name.endsWith('.docx')) {
    const zip = await JSZip.loadAsync(file);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) throw new Error('Invalid docx format');
    
    // Very crude split by page breaks if any, otherwise just chunk by paragraphs
    // A proper page extraction from docx is hard without rendering, 
    // but we can extract paragraphs and chunk them, or look for w:lastRenderedPageBreak
    const pages: string[] = [];
    const pageSplits = docXml.split(/<w:lastRenderedPageBreak\s*\/>|<w:br w:type="page"\s*\/>/);
    
    for (const split of pageSplits) {
      // Strip all XML tags to get text
      const text = split.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text) pages.push(text);
    }
    
    // If it didn't find any page breaks, just chunk by length as fallback so page selection works somewhat
    if (pages.length <= 1 && pages[0]?.length > 2000) {
      const fallbackPages = [];
      const words = pages[0].split(' ');
      let current = [];
      for (let i = 0; i < words.length; i++) {
        current.push(words[i]);
        if (current.length >= 300) { // ~300 words per page
          fallbackPages.push(current.join(' '));
          current = [];
        }
      }
      if (current.length) fallbackPages.push(current.join(' '));
      return { pages: fallbackPages, isTextFile: false };
    }
    
    return { pages, isTextFile: false };
  }
  
  if (name.endsWith('.pptx')) {
    const zip = await JSZip.loadAsync(file);
    const pages: string[] = [];
    let i = 1;
    while (true) {
      const slideXml = await zip.file(`ppt/slides/slide${i}.xml`)?.async('text');
      if (!slideXml) break;
      const text = slideXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text) pages.push(text);
      i++;
    }
    return { pages, isTextFile: false };
  }

  throw new Error('Unsupported file type. Please upload TXT, PDF, DOCX, or PPTX.');
}

export function extractSentences(pages: string[], startPage: number, endPage: number, isTextFile: boolean): string[] {
  let text = '';
  if (isTextFile) {
    text = pages.join(' ');
  } else {
    // 1-indexed pages
    const start = Math.max(1, startPage) - 1;
    const end = Math.min(pages.length, endPage);
    text = pages.slice(start, end).join(' ');
  }

  // Split into sentences (rudimentary)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(s => s.trim().replace(/\s+/g, ' ')).filter(s => s.length > 5);
}
