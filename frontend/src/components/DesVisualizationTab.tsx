import { useMemo, useState } from 'react';
import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { AlgoFlow, CryptoAction, OverviewItem } from '../types/crypto';

type DesVisualizationTabProps = {
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

function DesVisualizationTab({
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
}: DesVisualizationTabProps) {
  const [roundFocus, setRoundFocus] = useState(1);

  const activeStage = flow ? Math.min(stepIndex, 3) : -1;

  const splitPreview = useMemo(() => {
    const splitStep = flow?.steps.find((step) => step.title.toLowerCase().includes('split'));
    const source = splitStep?.value ?? '';

    const leftMatch = source.match(/L0:\s*([01]+)/);
    const rightMatch = source.match(/R0:\s*([01]+)/);

    return {
      left: leftMatch ? leftMatch[1] : 'left 32-bit half',
      right: rightMatch ? rightMatch[1] : 'right 32-bit half',
    };
  }, [flow]);

  const keyIndex = flow?.mode === 'decrypt' ? 17 - roundFocus : roundFocus;

  return (
    <div className="rsa-layout">
      <section className="panel control-panel">
        <h2>DES Visualization</h2>
        <p className="subtext">
          Run DES action and inspect a diagram of block splitting and Feistel round behavior.
        </p>

        <label htmlFor="desInput">DES Input</label>
        <textarea
          id="desInput"
          rows={4}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Encrypt: enter plaintext. Decrypt: enter DES ciphertext from this app."
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
        <h2>DES Learning View</h2>
        <OverviewGrid items={overviewItems} />

        <article className="des-diagram-wrap">
          <h3>Hybrid Diagram: DES Flow</h3>
          <p className="subtext des-caption">
            Follow the full block journey and inspect one Feistel round in detail.
          </p>

          <div className="des-pipeline-map" aria-label="DES pipeline map">
            <div className={activeStage === 0 ? 'des-node active' : 'des-node'}>Input 64-bit block</div>
            <div className="des-arrow">-&gt;</div>
            <div className={activeStage === 1 ? 'des-node active' : 'des-node'}>IP + split L0/R0</div>
            <div className="des-arrow">-&gt;</div>
            <div className={activeStage === 2 ? 'des-node active' : 'des-node'}>16 Feistel rounds</div>
            <div className="des-arrow">-&gt;</div>
            <div className={activeStage === 3 ? 'des-node active' : 'des-node'}>Swap + FP output</div>
          </div>

          <div className="des-round-control">
            <label htmlFor="desRoundFocus">Round Focus: {roundFocus}</label>
            <input
              id="desRoundFocus"
              type="range"
              min={1}
              max={16}
              value={roundFocus}
              onChange={(e) => setRoundFocus(Number(e.target.value))}
            />
            <p>
              Round {roundFocus}: L{roundFocus} = R{roundFocus - 1}, R{roundFocus} = L{roundFocus - 1} XOR F(R{roundFocus - 1}, K{keyIndex})
            </p>
          </div>

          <div className="des-feistel-board" aria-label="DES Feistel round board">
            <div className="des-column">
              <div className="des-half-card">
                <h4>L{roundFocus - 1}</h4>
                <code>{splitPreview.left}</code>
              </div>
              <div className="des-half-card">
                <h4>R{roundFocus - 1}</h4>
                <code>{splitPreview.right}</code>
              </div>
            </div>

            <div className="des-column des-center-flow">
              <div className="des-f-box">F(R{roundFocus - 1}, K{keyIndex})</div>
              <div className="des-xor-box">XOR with L{roundFocus - 1}</div>
            </div>

            <div className="des-column">
              <div className="des-half-card active">
                <h4>L{roundFocus}</h4>
                <code>R{roundFocus - 1}</code>
              </div>
              <div className="des-half-card active">
                <h4>R{roundFocus}</h4>
                <code>L{roundFocus - 1} XOR F(...)</code>
              </div>
            </div>
          </div>
        </article>

        <FlowViewer
          flow={flow}
          stepIndex={stepIndex}
          onStepChange={onStepChange}
          placeholderText="Run DES encrypt/decrypt to generate a step-by-step visualization."
          timelineAriaLabel="DES step timeline"
        />
      </section>
    </div>
  );
}

export default DesVisualizationTab;
