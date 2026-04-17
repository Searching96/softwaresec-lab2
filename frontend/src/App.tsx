import { useMemo, useState } from 'react';
import './App.css';
import MainTab from './components/MainTab';
import MenuBar from './components/MenuBar';
import RsaVisualizationTab from './components/RsaVisualizationTab';
import SymmetricVisualizationTab from './components/SymmetricVisualizationTab';
import type {
  AlgoFlow,
  Algorithm,
  CryptoAction,
  MenuTab,
  OverviewItem,
  RsaFlow,
  RsaTrack,
  ToyKeyPair,
} from './types/crypto';
import { callCryptoApi } from './utils/api';
import { generateToyKeyPair } from './utils/cryptoHelpers';
import {
  buildAesFlow,
  buildBackendRsaFlow,
  buildDesFlow,
  buildToyRsaFlow,
  runToyRsaAction,
} from './utils/flowBuilders';

const MENU_TABS: Array<{ id: MenuTab; label: string }> = [
  { id: 'main', label: 'Main Encrypt/Decrypt' },
  { id: 'rsa', label: 'RSA Visualization' },
  { id: 'aes', label: 'AES Visualization' },
  { id: 'des', label: 'DES Visualization' },
];

function App() {
  const [menuTab, setMenuTab] = useState<MenuTab>('main');

  const [mainAlgorithm, setMainAlgorithm] = useState<Algorithm>('RSA');
  const [mainInput, setMainInput] = useState('');
  const [mainResult, setMainResult] = useState('');
  const [mainError, setMainError] = useState('');
  const [mainAction, setMainAction] = useState<CryptoAction | null>(null);

  const [rsaTrack, setRsaTrack] = useState<RsaTrack>('backend');
  const [rsaInput, setRsaInput] = useState('');
  const [rsaResult, setRsaResult] = useState('');
  const [rsaError, setRsaError] = useState('');
  const [rsaAction, setRsaAction] = useState<CryptoAction | null>(null);
  const [toyKeys, setToyKeys] = useState<ToyKeyPair>(() => generateToyKeyPair());
  const [rsaFlow, setRsaFlow] = useState<RsaFlow | null>(null);
  const [rsaStepIndex, setRsaStepIndex] = useState(0);

  const [aesInput, setAesInput] = useState('');
  const [aesResult, setAesResult] = useState('');
  const [aesError, setAesError] = useState('');
  const [aesAction, setAesAction] = useState<CryptoAction | null>(null);
  const [aesFlow, setAesFlow] = useState<AlgoFlow | null>(null);
  const [aesStepIndex, setAesStepIndex] = useState(0);

  const [desInput, setDesInput] = useState('');
  const [desResult, setDesResult] = useState('');
  const [desError, setDesError] = useState('');
  const [desAction, setDesAction] = useState<CryptoAction | null>(null);
  const [desFlow, setDesFlow] = useState<AlgoFlow | null>(null);
  const [desStepIndex, setDesStepIndex] = useState(0);

  const rsaOverview = useMemo<OverviewItem[]>(
    () => [
      {
        label: 'Public key',
        info: 'Used for encryption: (e, n). Backend track uses server-generated keys.',
      },
      {
        label: 'Private key',
        info: 'Used for decryption: (d, n). Real private keys remain on backend.',
      },
      {
        label: 'Core formula',
        info: 'Encrypt c = m^e mod n. Decrypt m = c^d mod n.',
      },
      {
        label: 'Two modes',
        info: 'Backend mode shows real flow. Toy mode exposes tiny keys for tracing.',
      },
    ],
    []
  );

  const aesOverview = useMemo<OverviewItem[]>(
    () => [
      {
        label: 'Block size',
        info: 'AES operates on 128-bit blocks (16 bytes).',
      },
      {
        label: 'State matrix',
        info: 'Each block is arranged into a 4x4 byte state for round processing.',
      },
      {
        label: 'Round pipeline',
        info: 'SubBytes, ShiftRows, MixColumns, AddRoundKey (with final-round variation).',
      },
      {
        label: 'Reverse for decrypt',
        info: 'Decryption applies inverse round transformations in reverse order.',
      },
    ],
    []
  );

  const desOverview = useMemo<OverviewItem[]>(
    () => [
      {
        label: 'Block size',
        info: 'DES works on 64-bit blocks (8 bytes).',
      },
      {
        label: 'Feistel split',
        info: 'Each block splits into left and right 32-bit halves.',
      },
      {
        label: '16 rounds',
        info: 'Rounds repeatedly apply the Feistel function with round subkeys.',
      },
      {
        label: 'Decrypt strategy',
        info: 'Same round structure as encrypt, but subkeys are applied in reverse.',
      },
    ],
    []
  );

  const handleMainAction = async (action: CryptoAction) => {
    setMainResult('');
    setMainError('');
    setMainAction(action);

    try {
      const output = await callCryptoApi(action, mainInput, mainAlgorithm);
      setMainResult(output);
    } catch (err: unknown) {
      setMainError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMainAction(null);
    }
  };

  const handleRsaAction = async (action: CryptoAction) => {
    setRsaResult('');
    setRsaError('');
    setRsaAction(action);

    try {
      if (rsaTrack === 'toy') {
        const toyResult = runToyRsaAction(action, rsaInput, toyKeys);
        const flow = buildToyRsaFlow(action, rsaInput, toyResult, toyKeys);
        setRsaResult(toyResult);
        setRsaFlow(flow);
        setRsaStepIndex(0);
        return;
      }

      const output = await callCryptoApi(action, rsaInput, 'RSA');
      const flow = buildBackendRsaFlow(action, rsaInput, output);
      setRsaResult(output);
      setRsaFlow(flow);
      setRsaStepIndex(0);
    } catch (err: unknown) {
      setRsaError(err instanceof Error ? err.message : 'Unknown error');
      setRsaFlow(null);
    } finally {
      setRsaAction(null);
    }
  };

  const handleAesAction = async (action: CryptoAction) => {
    setAesResult('');
    setAesError('');
    setAesAction(action);

    try {
      const output = await callCryptoApi(action, aesInput, 'AES');
      const flow = buildAesFlow(action, aesInput, output);
      setAesResult(output);
      setAesFlow(flow);
      setAesStepIndex(0);
    } catch (err: unknown) {
      setAesError(err instanceof Error ? err.message : 'Unknown error');
      setAesFlow(null);
    } finally {
      setAesAction(null);
    }
  };

  const handleDesAction = async (action: CryptoAction) => {
    setDesResult('');
    setDesError('');
    setDesAction(action);

    try {
      const output = await callCryptoApi(action, desInput, 'DES');
      const flow = buildDesFlow(action, desInput, output);
      setDesResult(output);
      setDesFlow(flow);
      setDesStepIndex(0);
    } catch (err: unknown) {
      setDesError(err instanceof Error ? err.message : 'Unknown error');
      setDesFlow(null);
    } finally {
      setDesAction(null);
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-grid" />

      <main className="container">
        <header className="hero-header">
          <h1 className="eyebrow w-full h-full text-4xl">Interactive Crypto Lab</h1>
        </header>

        <MenuBar tabs={MENU_TABS} activeTab={menuTab} onSelectTab={setMenuTab} />

        {menuTab === 'main' && (
          <MainTab
            algorithm={mainAlgorithm}
            onAlgorithmChange={(algorithm) => {
              setMainAlgorithm(algorithm);
              setMainResult('');
              setMainError('');
            }}
            inputValue={mainInput}
            onInputChange={setMainInput}
            result={mainResult}
            error={mainError}
            activeAction={mainAction}
            onAction={handleMainAction}
          />
        )}

        {menuTab === 'rsa' && (
          <RsaVisualizationTab
            track={rsaTrack}
            onTrackChange={(track) => {
              setRsaTrack(track);
              setRsaInput('');
              setRsaResult('');
              setRsaError('');
              setRsaFlow(null);
              setRsaStepIndex(0);
            }}
            toyKeys={toyKeys}
            onRegenerateToyKeys={() => {
              setToyKeys(generateToyKeyPair());
              setRsaResult('');
              setRsaError('');
              setRsaFlow(null);
              setRsaStepIndex(0);
            }}
            inputValue={rsaInput}
            onInputChange={setRsaInput}
            result={rsaResult}
            error={rsaError}
            activeAction={rsaAction}
            onAction={handleRsaAction}
            overviewItems={rsaOverview}
            flow={rsaFlow}
            stepIndex={rsaStepIndex}
            onStepChange={setRsaStepIndex}
          />
        )}

        {menuTab === 'aes' && (
          <SymmetricVisualizationTab
            title="AES Visualization"
            description="Run AES action and inspect how data maps into state blocks and round flow."
            inputId="aesInput"
            inputLabel="AES Input"
            inputPlaceholder="Encrypt: enter plaintext. Decrypt: enter AES ciphertext from this app."
            inputValue={aesInput}
            onInputChange={setAesInput}
            result={aesResult}
            error={aesError}
            activeAction={aesAction}
            onAction={handleAesAction}
            overviewItems={aesOverview}
            flow={aesFlow}
            stepIndex={aesStepIndex}
            onStepChange={setAesStepIndex}
            placeholderText="Run AES encrypt/decrypt to generate a step-by-step visualization."
            timelineAriaLabel="AES step timeline"
          />
        )}

        {menuTab === 'des' && (
          <SymmetricVisualizationTab
            title="DES Visualization"
            description="Run DES action and inspect the Feistel split and round narrative."
            inputId="desInput"
            inputLabel="DES Input"
            inputPlaceholder="Encrypt: enter plaintext. Decrypt: enter DES ciphertext from this app."
            inputValue={desInput}
            onInputChange={setDesInput}
            result={desResult}
            error={desError}
            activeAction={desAction}
            onAction={handleDesAction}
            overviewItems={desOverview}
            flow={desFlow}
            stepIndex={desStepIndex}
            onStepChange={setDesStepIndex}
            placeholderText="Run DES encrypt/decrypt to generate a step-by-step visualization."
            timelineAriaLabel="DES step timeline"
          />
        )}
      </main>
    </div>
  );
}

export default App;
