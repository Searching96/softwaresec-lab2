export type CryptoAction = 'encrypt' | 'decrypt';
export type Algorithm = 'RSA' | 'AES' | 'DES';
export type MenuTab = 'main' | 'rsa' | 'aes' | 'des';
export type RsaTrack = 'backend' | 'toy';

export type StepItem = {
  title: string;
  detail: string;
  value?: string;
  equation?: string;
};

export type RsaFlow = {
  mode: CryptoAction;
  source: RsaTrack;
  steps: StepItem[];
};

export type AlgoFlow = {
  mode: CryptoAction;
  steps: StepItem[];
};

export type ToyKeyPair = {
  p: bigint;
  q: bigint;
  n: bigint;
  phi: bigint;
  e: bigint;
  d: bigint;
};

export type ApiResponse = {
  result?: string;
  error?: string;
};

export type OverviewItem = {
  label: string;
  info: string;
};
