export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedFileName?: string;
  isSpoken?: boolean;
}

export interface AttachedFilePayload {
  name: string;
  type: string;
  size: number;
  content: string; // text or base64
  isBase64?: boolean;
}

export interface TutorResponse {
  reply: string;
  suggestions?: string[];
  challengeConcept?: string;
}

export async function sendTutorMessage(
  messages: { role: 'user' | 'assistant'; content: string }[],
  attachedFile?: AttachedFilePayload | null,
  conceptContext?: string | null
): Promise<TutorResponse> {
  const res = await fetch('/api/tutor/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      attachedFile,
      conceptContext,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Tutor request failed with status ${res.status}`);
  }

  const data = await res.json();
  return {
    reply: data.reply || "Let's explore this together. What part of the intuition feels fuzzy?",
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    challengeConcept: data.challengeConcept || undefined,
  };
}

/**
 * Extracts text or base64 representation from a user-uploaded file
 */
export async function extractFileContent(file: File): Promise<AttachedFilePayload> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const textExtensions = ['txt', 'md', 'markdown', 'json', 'csv', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css'];

  if (textExtensions.includes(ext) || file.type.startsWith('text/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        resolve({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: text.slice(0, 50000), // Protect against massive files
          isBase64: false,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read text file.'));
      reader.readAsText(file);
    });
  }

  // For PDF or images, read as base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        content: base64,
        isBase64: true,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
