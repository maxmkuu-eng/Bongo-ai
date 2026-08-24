import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractDocument(buffer, mime, name='file') {
  const lower=name.toLowerCase();
  if (mime==='text/plain' || lower.endsWith('.txt')) return buffer.toString('utf8');
  if (mime==='application/pdf' || lower.endsWith('.pdf')) return (await pdfParse(buffer)).text;
  if (mime.includes('wordprocessingml') || lower.endsWith('.docx')) return (await mammoth.extractRawText({buffer})).value;
  throw new Error('Unsupported file type. Use PDF, DOCX or TXT.');
}

export async function readDocumentRequest(req, maxBytes=25*1024*1024) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if(size>maxBytes) throw new Error('File is too large. Maximum is 25 MB.'); chunks.push(chunk); }
  return Buffer.concat(chunks);
}
