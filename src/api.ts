export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T = any>(path: string, method = 'GET', body?: unknown, key?: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? 'Сервер недоступен');
  return data;
}

export async function uploadFile(file: File) {
  const body=new FormData();body.append('file',file);
  const response=await fetch('/api/files',{method:'POST',credentials:'same-origin',body});
  const result=await response.json();
  if(!response.ok) throw new ApiError(response.status,result.error??'Не удалось загрузить файл');
  return result;
}
