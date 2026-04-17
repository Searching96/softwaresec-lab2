import { useMemo, useState } from 'react';
import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { AlgoFlow, CryptoAction, OverviewItem } from '../types/crypto';

type AesVisualizationTabProps = {
  inputValue: string;
  onInputChange: (value: string) => void;
  result: string;
  error: string;
  activeAction: CryptoAction | null;
  onAction: (action: CryptoAction) => void;
  overviewItems: OverviewItem[];
  flow: AlgoFlow | null;
  stepIndex: number;
  onStepChange: (nextIndex: number) => void;
};

function defaultMatrix(): string[][] {
  return [
    ['--', '--', '--', '--'],
    ['--', '--', '--', '--'],
    ['--', '--', '--', '--'],
    ['--', '--', '--', '--'],
  ];
}

function AesVisualizationTab({
  inputValue,
  onInputChange,
  result,
  error,
  activeAction,
  onAction,
  overviewItems,
  flow,
  stepIndex,
  onStepChange,
}: AesVisualizationTabProps) {
  const [roundFocus, setRoundFocus] = useState(1);

  const activeStage = flow ? Math.min(stepIndex, 3) : -1;

  const stateMatrix = useMemo(() => {
    const stateStep = flow?.steps.find((step) => step.title.toLowerCase().includes('state'));
    const value = stateStep?.value ?? '';
    const rows = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 4)
      .map((line) => line.split(/\s+/).slice(0, 4));

    if (rows.length !== 4 || rows.some((row) => row.length !== 4)) {
      return defaultMatrix();
    }

    return rows;
  }, [flow]);

  const isDecrypt = flow?.mode === 'decrypt';
  const isFinalRound = roundFocus === 10;

  const roundStages = isDecrypt
    ? ['InvShiftRows', 'InvSubBytes', 'AddRoundKey', isFinalRound ? 'Skip InvMixColumns' : 'InvMixColumns']
    : ['SubBytes', 'ShiftRows', isFinalRound ? 'Skip MixColumns' : 'MixColumns', 'AddRoundKey'];

  return (
    <div className="rsa-layout">
      <section className="panel control-panel">
        <h2>AES Visualization</h2>
        <p className="subtext">
          Run AES action and inspect state-matrix layout and round transformation flow.
        </p>

        <label htmlFor="aesInput">AES Input</label>
        <textarea
          id="aesInput"
          rows={4}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Encrypt: enter plaintext. Decrypt: enter AES ciphertext from this app."
        />

        <div className="button-row">
          <button
            type="button"
            onClick={() => onAction('encrypt')}
            disabled={!inputValue.trim() || activeAction !== null}
          >
            {activeAction === 'encrypt' ? 'Encrypting...' : 'Encrypt'}
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => onAction('decrypt')}
            disabled={!inputValue.trim() || activeAction !== null}
          >
            {activeAction === 'decrypt' ? 'Decrypting...' : 'Decrypt'}
          </button>
        </div>

        {error && (
          <div className="status error" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="result-box">
            <h3>Backend Output</h3>
            <textarea readOnly rows={4} value={result} />
          </div>
        )}
      </section>

      <section className="panel learning-panel">
        <h2>AES Learning View</h2>
        <OverviewGrid items={overviewItems} />

        <article className="aes-diagram-wrap">
          <h3>Hybrid Diagram: AES Flow</h3>
          <p className="subtext aes-caption">
            Track how one 16-byte block moves through matrix-based rounds.
          </p>

          <div className="aes-pipeline-map" aria-label="AES pipeline map">
            <div className={activeStage === 0 ? 'aes-node active' : 'aes-node'}>Input 16-byte block</div>
            <div className="aes-arrow">-&gt;</div>
            <div className={activeStage === 1 ? 'aes-node active' : 'aes-node'}>4x4 state matrix</div>
            <div className="aes-arrow">-&gt;</div>
            <div className={activeStage === 2 ? 'aes-node active' : 'aes-node'}>Round transforms</div>
            <div className="aes-arrow">-&gt;</div>
            <div className={activeStage === 3 ? 'aes-node active' : 'aes-node'}>Output block</div>
          </div>

          <div className="aes-matrix-board" aria-label="AES state matrix board">
            <h4>First Block State (Hex)</h4>
            <div className="aes-matrix-grid">
              {stateMatrix.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div key={`${rowIndex}-${colIndex}`} className="aes-cell">
                    {cell}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="aes-round-control">
            <label htmlFor="aesRoundFocus">Round Focus: {roundFocus}</label>
            <input
              id="aesRoundFocus"
              type="range"
              min={1}
              max={10}
              value={roundFocus}
              onChange={(e) => setRoundFocus(Number(e.target.value))}
            />
            <p>
              {isDecrypt
                ? `Decrypt round ${roundFocus} uses key K${11 - roundFocus} in reverse order.`
                : `Encrypt round ${roundFocus} uses key K${roundFocus}.`}
            </p>
          </div>

          <div className="aes-round-lane" aria-label="AES round operations lane">
            {roundStages.map((stage) => (
              <div key={stage} className="aes-stage-chip">
                {stage}
              </div>
            ))}
          </div>
        </article>

        <FlowViewer
          flow={flow}
          stepIndex={stepIndex}
          onStepChange={onStepChange}
          placeholderText="Run AES encrypt/decrypt to generate a step-by-step visualization."
          timelineAriaLabel="AES step timeline"
        />
      </section>
    </div>
  );
}

export default AesVisualizationTab;
