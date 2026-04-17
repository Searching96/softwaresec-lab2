import type { Algorithm, ApiResponse, CryptoAction } from '../types/crypto';

export async function callCryptoApi(
  action: CryptoAction,
  text: string,
  algorithm: Algorithm
): Promise<string> {
  const response = await fetch(`http://localhost:8080/api/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, algorithm }),
  });

  const data = (await response.json()) as ApiResponse;

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  if (typeof data.result !== 'string') {
    throw new Error('Invalid server response.');
  }

  return data.result;
}
