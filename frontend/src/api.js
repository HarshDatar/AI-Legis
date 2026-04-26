const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

const withUser = (path, userId) =>
  userId ? `${path}${path.includes('?') ? '&' : '?'}user_id=${encodeURIComponent(userId)}` : path;

// ─── Cases ───
export const getCases = (user_id = null) => {
  const url = user_id ? `/cases/?user_id=${user_id}` : '/cases/';
  return request(url);
};

export const getCase = (id, user_id = null) => {
  const url = user_id ? `/cases/${id}?user_id=${user_id}` : `/cases/${id}`;
  return request(url);
};

export const createCase = (data, user_id = 'lawyer1') => {
  const url = `/cases/?user_id=${user_id}`;
  return request(url, { method: 'POST', body: JSON.stringify(data) });
};

export const deleteCase = (id, user_id = null) => {
  const url = user_id ? `/cases/${id}?user_id=${user_id}` : `/cases/${id}`;
  return request(url, { method: 'DELETE' });
};

// ─── Documents ───
export const getCaseDocuments = (caseId, userId = null) => request(withUser(`/documents/${caseId}`, userId));
export const getDocumentText = (caseId, docName, userId = null) =>
  request(withUser(`/documents/${caseId}/${docName}/text`, userId));
export const uploadDocument = async (caseId, file, docType = 'general', userId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('doc_type', docType);
  const res = await fetch(`${API_BASE}${withUser(`/documents/upload/${caseId}`, userId)}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
};

// ─── Chat (Agent) ───
export const streamMessage = async (message, chatHistory, caseId, userId, onChunk) => {
  const url = `${API_BASE}/chat/`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, chat_history: chatHistory, case_id: caseId, user_id: userId }),
  });

  if (!res.ok) throw new Error('Stream failed');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunk = decoder.decode(value, { stream: true });
    
    // Parse SSE format (data: {...}\n\n)
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') break;
        try {
          const data = JSON.parse(dataStr);
          if (data.text) onChunk(data.text);
          if (data.error) throw new Error(data.error);
        } catch (e) {
          // Ignore partial JSON
        }
      }
    }
  }
};

export const sendMessage = (message, chatHistory = [], caseId = null, userId = null) =>
  request('/chat/', {
    method: 'POST',
    body: JSON.stringify({ message, chat_history: chatHistory, case_id: caseId, user_id: userId }),
  });

export const getChatHistory = (userId, caseId = null) => {
  const url = caseId ? `/chat/history?user_id=${userId}&case_id=${caseId}` : `/chat/history?user_id=${userId}`;
  return request(url);
};

export const clearChatHistory = (userId, caseId = null) => {
  const url = caseId ? `/chat/history?user_id=${userId}&case_id=${caseId}` : `/chat/history?user_id=${userId}`;
  return request(url, { method: 'DELETE' });
};

// ─── Analysis ───
export const getContradictions = (caseId, userId = null) => request(withUser(`/analysis/contradictions/${caseId}`, userId));
export const getSummary = (caseId, userId = null) => request(withUser(`/analysis/summary/${caseId}`, userId));
