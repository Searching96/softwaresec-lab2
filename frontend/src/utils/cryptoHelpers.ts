import type { ToyKeyPair } from '../types/crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const TOY_PRIMES = [
  101n,
  103n,
  107n,
  109n,
  113n,
  127n,
  131n,
  137n,
  139n,
  149n,
  151n,
  157n,
  163n,
  167n,
  173n,
  179n,
  181n,
  191n,
  193n,
  197n,
  199n,
] as const;

const CANDIDATE_EXPONENTS = [17n, 257n, 65537n, 5n, 3n] as const;

export function textToBytes(input: string): number[] {
  return Array.from(encoder.encode(input));
}

export function textToBigInt(input: string): bigint {
  const bytes = textToBytes(input);
  if (bytes.length === 0) {
    return 0n;
  }

  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return BigInt(`0x${hex}`);
}

export function bigintToBytes(value: bigint): number[] {
  if (value === 0n) {
    return [0];
  }

  let hex = value.toString(16);
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }

  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

export function shorten(value: string, max = 90): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

export function toHexByte(value: number): string {
  return value.toString(16).padStart(2, '0').toUpperCase();
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const temp = x % y;
    x = y;
    y = temp;
  }
  return x;
}

function extendedGcd(a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } {
  if (b === 0n) {
    return { gcd: a, x: 1n, y: 0n };
  }

  const next = extendedGcd(b, a % b);
  return {
    gcd: next.gcd,
    x: next.y,
    y: next.x - (a / b) * next.y,
  };
}

function modInverse(a: bigint, m: bigint): bigint | null {
  const result = extendedGcd(a, m);
  if (result.gcd !== 1n) {
    return null;
  }

  const x = result.x % m;
  return x >= 0n ? x : x + m;
}

export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) {
    return 0n;
  }

  let result = 1n;
  let b = base % modulus;
  let e = exponent;

  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % modulus;
    }
    e /= 2n;
    b = (b * b) % modulus;
  }

  return result;
}

function pickRandomPrime(exclude?: bigint): bigint {
  while (true) {
    const index = Math.floor(Math.random() * TOY_PRIMES.length);
    const candidate = TOY_PRIMES[index];
    if (!exclude || candidate !== exclude) {
      return candidate;
    }
  }
}

export function generateToyKeyPair(): ToyKeyPair {
  const p = pickRandomPrime();
  const q = pickRandomPrime(p);
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);

  let e = 17n;
  for (const candidate of CANDIDATE_EXPONENTS) {
    if (candidate < phi && gcd(candidate, phi) === 1n) {
      e = candidate;
      break;
    }
  }

  const d = modInverse(e, phi);
  if (d === null) {
    throw new Error('Unable to build toy RSA key pair.');
  }

  return { p, q, n, phi, e, d };
}

export function parseToyCipher(input: string): bigint[] {
  const parts = input
    .split(/[\s,]+/)
    .map((piece) => piece.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error('Enter ciphertext numbers separated by spaces or commas.');
  }

  return parts.map((piece) => BigInt(piece));
}

export function mapPreview<T>(
  items: T[],
  renderer: (item: T, index: number) => string,
  limit = 8
): string {
  const selected = items.slice(0, limit).map(renderer);
  if (items.length > limit) {
    selected.push(`...and ${items.length - limit} more`);
  }
  return selected.join('\n');
}

export function formatAesState(block: number[]): string {
  const padded = [...block];
  while (padded.length < 16) {
    padded.push(0);
  }

  const lines = [0, 1, 2, 3].map((row) => {
    const rowValues = [0, 1, 2, 3].map((col) => toHexByte(padded[col * 4 + row]));
    return rowValues.join(' ');
  });

  return lines.join('\n');
}

export function formatDesBlockBits(block: number[]): string {
  return block.map((b) => b.toString(2).padStart(8, '0')).join(' ');
}

export function formatFeistelSplit(block: number[]): { left: string; right: string } {
  const bits = block.map((b) => b.toString(2).padStart(8, '0')).join('');
  return {
    left: bits.slice(0, 32),
    right: bits.slice(32),
  };
}

export function decodeBytes(bytes: number[]): string {
  return decoder.decode(Uint8Array.from(bytes));
}
