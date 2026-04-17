import type { AlgoFlow, CryptoAction, RsaFlow, ToyKeyPair } from '../types/crypto';
import {
  bigintToBytes,
  decodeBytes,
  formatAesState,
  formatDesBlockBits,
  formatFeistelSplit,
  mapPreview,
  modPow,
  parseToyCipher,
  shorten,
  textToBigInt,
  textToBytes,
  toHexByte,
} from './cryptoHelpers';

export function buildBackendRsaFlow(
  action: CryptoAction,
  inputText: string,
  outputText: string
): RsaFlow {
  if (action === 'encrypt') {
    const inputBytes = textToBytes(inputText);
    const messageInt = textToBigInt(inputText);

    return {
      mode: 'encrypt',
      source: 'backend',
      steps: [
        {
          title: 'Plaintext to bytes',
          detail: 'Input text is converted to UTF-8 bytes.',
          value: inputBytes.length > 0 ? inputBytes.join(', ') : '(empty input)',
        },
        {
          title: 'Bytes to integer m',
          detail: 'RSA math runs on big integers, so bytes become integer m.',
          value: messageInt.toString(10),
        },
        {
          title: 'Encrypt with public key',
          detail: 'Backend computes modular exponentiation with (e, n).',
          equation: 'c = m^e mod n',
          value: 'c is the encrypted integer.',
        },
        {
          title: 'Return ciphertext',
          detail: 'API returns ciphertext as a decimal integer string.',
          value: outputText,
        },
      ],
    };
  }

  const ciphertextInt = BigInt(inputText);
  const recoveredInt = textToBigInt(outputText);
  const recoveredBytes = bigintToBytes(recoveredInt);

  return {
    mode: 'decrypt',
    source: 'backend',
    steps: [
      {
        title: 'Ciphertext to integer c',
        detail: 'Ciphertext is parsed as a large decimal integer.',
        value: ciphertextInt.toString(10),
      },
      {
        title: 'Decrypt with private key',
        detail: 'Backend computes modular exponentiation with (d, n).',
        equation: 'm = c^d mod n',
        value: 'm is the recovered message integer.',
      },
      {
        title: 'Integer m to bytes',
        detail: 'Recovered integer is translated back into bytes.',
        value: recoveredBytes.join(', '),
      },
      {
        title: 'Bytes to plaintext',
        detail: 'Bytes are decoded as UTF-8 text.',
        value: outputText,
      },
    ],
  };
}

export function buildToyRsaFlow(
  action: CryptoAction,
  inputText: string,
  outputText: string,
  keys: ToyKeyPair
): RsaFlow {
  if (action === 'encrypt') {
    const bytes = textToBytes(inputText);
    const cipherBlocks = outputText.split(' ').map((piece) => BigInt(piece));
    const preview = mapPreview(
      bytes,
      (value, index) => `${value}^${keys.e.toString()} mod ${keys.n.toString()} = ${cipherBlocks[index].toString()}`
    );

    return {
      mode: 'encrypt',
      source: 'toy',
      steps: [
        {
          title: 'Tiny keypair generated',
          detail: 'Toy mode uses small keys so each calculation can be traced.',
          value: `p=${keys.p}, q=${keys.q}, n=${keys.n}, phi=${keys.phi}, e=${keys.e}, d=${keys.d}`,
        },
        {
          title: 'Plaintext to byte blocks',
          detail: 'Each UTF-8 byte becomes a toy RSA message block.',
          value: bytes.join(', '),
        },
        {
          title: 'Encrypt each byte',
          detail: 'Public-key equation is applied to each byte block.',
          equation: 'c = m^e mod n',
          value: preview,
        },
        {
          title: 'Cipher blocks output',
          detail: 'Ciphertext is shown as decimal blocks.',
          value: outputText,
        },
      ],
    };
  }

  const cipherBlocks = parseToyCipher(inputText);
  const recoveredBytes = cipherBlocks.map((block) => Number(modPow(block, keys.d, keys.n)));
  const preview = mapPreview(
    cipherBlocks,
    (value, index) => `${value.toString()}^${keys.d.toString()} mod ${keys.n.toString()} = ${recoveredBytes[index]}`
  );

  return {
    mode: 'decrypt',
    source: 'toy',
    steps: [
      {
        title: 'Parse cipher blocks',
        detail: 'Input is split into numeric ciphertext blocks.',
        value: cipherBlocks.map((num) => num.toString()).join(', '),
      },
      {
        title: 'Decrypt each block',
        detail: 'Private-key equation is applied to recover bytes.',
        equation: 'm = c^d mod n',
        value: preview,
      },
      {
        title: 'Decode bytes to text',
        detail: 'Recovered byte sequence is decoded into plaintext.',
        value: outputText,
      },
    ],
  };
}

export function runToyRsaAction(action: CryptoAction, inputText: string, keys: ToyKeyPair): string {
  if (action === 'encrypt') {
    const bytes = textToBytes(inputText);
    const encrypted = bytes.map((value) => modPow(BigInt(value), keys.e, keys.n).toString());
    return encrypted.join(' ');
  }

  const blocks = parseToyCipher(inputText);
  const decryptedBytes = blocks.map((block) => {
    const value = modPow(block, keys.d, keys.n);
    const asNumber = Number(value);
    if (!Number.isInteger(asNumber) || asNumber < 0 || asNumber > 255) {
      throw new Error('Toy RSA decryption produced an invalid byte. Regenerate toy keys and try again.');
    }
    return asNumber;
  });

  return decodeBytes(decryptedBytes);
}

export function buildAesFlow(action: CryptoAction, inputText: string, outputText: string): AlgoFlow {
  if (action === 'encrypt') {
    const bytes = textToBytes(inputText);
    const blockCount = Math.ceil(bytes.length / 16);
    const bytePreview = mapPreview(bytes, (value, index) => `b${index}: ${value} (0x${toHexByte(value)})`, 12);

    return {
      mode: 'encrypt',
      steps: [
        {
          title: 'Plaintext to 16-byte blocks',
          detail: 'AES consumes data in 128-bit blocks.',
          value: `Total bytes: ${bytes.length}\nBlock count: ${blockCount}\n${bytePreview}`,
        },
        {
          title: 'Arrange first block as state',
          detail: 'First block is shown as a 4x4 AES state matrix (hex).',
          value: formatAesState(bytes.slice(0, 16)),
        },
        {
          title: 'Run AES rounds',
          detail: 'Round keys and substitution/permutation steps transform the state.',
          equation: 'AddRoundKey -> (SubBytes -> ShiftRows -> MixColumns -> AddRoundKey) x9 -> Final round',
          value: 'AES-128 uses 10 rounds total.',
        },
        {
          title: 'Return ciphertext',
          detail: 'Backend returns encrypted output.',
          value: outputText,
        },
      ],
    };
  }

  const plainBytes = textToBytes(outputText);
  const preview = mapPreview(plainBytes, (value, index) => `b${index}: ${value} (0x${toHexByte(value)})`, 12);

  return {
    mode: 'decrypt',
    steps: [
      {
        title: 'Ciphertext input',
        detail: 'Ciphertext is provided as encoded text from backend format.',
        value: shorten(inputText, 240),
      },
      {
        title: 'Apply inverse rounds',
        detail: 'AES decryption reverses the encryption path.',
        equation:
          'Initial AddRoundKey -> (InvShiftRows -> InvSubBytes -> AddRoundKey -> InvMixColumns) x9 -> Final inverse round',
        value: 'Round keys are applied in reverse order.',
      },
      {
        title: 'Recovered plaintext bytes',
        detail: 'Decrypted bytes are reconstructed before decoding.',
        value: preview,
      },
      {
        title: 'Return plaintext',
        detail: 'Recovered bytes are decoded and returned as text.',
        value: outputText,
      },
    ],
  };
}

export function buildDesFlow(action: CryptoAction, inputText: string, outputText: string): AlgoFlow {
  if (action === 'encrypt') {
    const bytes = textToBytes(inputText);
    const blockCount = Math.ceil(bytes.length / 8);
    const firstBlock = [...bytes.slice(0, 8)];
    while (firstBlock.length < 8) {
      firstBlock.push(0);
    }
    const split = formatFeistelSplit(firstBlock);

    return {
      mode: 'encrypt',
      steps: [
        {
          title: 'Plaintext to 64-bit blocks',
          detail: 'DES consumes data in 8-byte (64-bit) blocks.',
          value: `Total bytes: ${bytes.length}\nBlock count: ${blockCount}\nFirst block bits:\n${formatDesBlockBits(firstBlock)}`,
        },
        {
          title: 'Initial permutation and split',
          detail: 'Block is permuted, then divided into L0 and R0 halves.',
          value: `L0: ${split.left}\nR0: ${split.right}`,
        },
        {
          title: 'Run 16 Feistel rounds',
          detail: 'Each round swaps halves and applies F-function with subkey Ki.',
          equation: 'L_i = R_(i-1),  R_i = L_(i-1) XOR F(R_(i-1), K_i)',
          value: 'DES uses 16 rounds before final swap and permutation.',
        },
        {
          title: 'Final permutation output',
          detail: 'After rounds, halves are combined and final permutation is applied.',
          value: outputText,
        },
      ],
    };
  }

  const plainBytes = textToBytes(outputText);
  const preview = mapPreview(plainBytes, (value, index) => `b${index}: ${value} (0x${toHexByte(value)})`, 12);

  return {
    mode: 'decrypt',
    steps: [
      {
        title: 'Ciphertext block input',
        detail: 'Ciphertext is parsed according to backend DES format.',
        value: shorten(inputText, 240),
      },
      {
        title: 'Reverse Feistel key order',
        detail: 'DES decrypt uses same rounds but applies subkeys in reverse.',
        equation: 'Same Feistel round, keys K16 ... K1',
        value: 'Structure stays identical to encrypt because Feistel is symmetric.',
      },
      {
        title: 'Recovered plaintext bytes',
        detail: 'Decrypted block bytes are reconstructed.',
        value: preview,
      },
      {
        title: 'Return plaintext',
        detail: 'Recovered bytes are decoded back to text.',
        value: outputText,
      },
    ],
  };
}
