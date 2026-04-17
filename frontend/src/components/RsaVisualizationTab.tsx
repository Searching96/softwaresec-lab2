import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { CryptoAction, OverviewItem, RsaFlow, RsaTrack, ToyKeyPair } from '../types/crypto';

type RsaVisualizationTabProps = {
  track: RsaTrack;
  onTrackChange: (track: RsaTrack) => void;
  toyKeys: ToyKeyPair;
  onRegenerateToyKeys: () => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  result: string;
  error: string;
  activeAction: CryptoAction | null;
  onAction: (action: CryptoAction) => void;
  overviewItems: OverviewItem[];
  flow: RsaFlow | null;
  stepIndex: number;
  onStepChange: (nextIndex: number) => void;
};

function shortenText(value: string, max = 90): string {
  if (!value) {
    return '(empty)';
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

function RsaVisualizationTab({
  track,
  onTrackChange,
  toyKeys,
  onRegenerateToyKeys,
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
}: RsaVisualizationTabProps) {
  const placeholderText =
    track === 'backend'
      ? 'Run backend RSA encrypt/decrypt to generate visualization.'
      : 'Run toy RSA to inspect tiny key math and per-byte operations.';

  const mode = flow?.mode ?? 'encrypt';
  const activeStage = flow ? Math.min(stepIndex, 3) : -1;

  const pipelineLabels =
    mode === 'encrypt'
      ? ['Plaintext', 'Bytes to integer m', 'Modular exponentiation', 'Ciphertext']
      : ['Ciphertext', 'Parse integer c', 'Modular exponentiation', 'Plaintext'];

  const equationText = mode === 'encrypt' ? 'c = m^e mod n' : 'm = c^d mod n';

  const intermediateValue = flow?.steps[1]?.value ?? '';
  const operationValue = flow?.steps[2]?.value ?? '';

  const mappingStep = flow?.steps.find(
    (step) =>
      step.title.toLowerCase().includes('each byte') || step.title.toLowerCase().includes('each block')
  );

  const mappingLines = mappingStep?.value
    ? mappingStep.value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .filter((line) => !line.toLowerCase().startsWith('...and'))
        .slice(0, 3)
    : [];

  return (
    <div className="rsa-layout">
      <section className="panel control-panel">
        <h2>RSA Visualization</h2>
        <p className="subtext">
          Explore real backend RSA flow or a toy local sandbox where keys are fully visible.
        </p>

        <label htmlFor="rsaTrack">RSA Track</label>
        <select
          id="rsaTrack"
          value={track}
          onChange={(e) => onTrackChange(e.target.value as RsaTrack)}
        >
          <option value="backend">Backend RSA (real API)</option>
          <option value="toy">Toy RSA Sandbox (local keys)</option>
        </select>

        {track === 'toy' && (
          <button type="button" className="ghost regen-button" onClick={onRegenerateToyKeys}>
            Regenerate Toy Keys
          </button>
        )}

        <label htmlFor="rsaInput">RSA Input</label>
        <textarea
          id="rsaInput"
          rows={4}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={
            track === 'backend'
              ? 'Backend mode: encrypt text or decrypt one RSA ciphertext integer.'
              : 'Toy mode: encrypt text or decrypt toy ciphertext blocks (space/comma separated).'
          }
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
            <h3>{track === 'toy' ? 'Toy Output' : 'Backend Output'}</h3>
            <textarea readOnly rows={4} value={result} />
          </div>
        )}
      </section>

      <section className="panel learning-panel">
        <h2>RSA Learning View</h2>
        <OverviewGrid items={overviewItems} />

        <article className="rsa-diagram-wrap">
          <h3>Hybrid Diagram: RSA Flow</h3>
          <p className="subtext rsa-caption">
            Follow the data path and key usage from input to output.
          </p>

          <div className="rsa-pipeline-map" aria-label="RSA pipeline map">
            <div className={activeStage === 0 ? 'rsa-node active' : 'rsa-node'}>{pipelineLabels[0]}</div>
            <div className="rsa-arrow">-&gt;</div>
            <div className={activeStage === 1 ? 'rsa-node active' : 'rsa-node'}>{pipelineLabels[1]}</div>
            <div className="rsa-arrow">-&gt;</div>
            <div className={activeStage === 2 ? 'rsa-node active' : 'rsa-node'}>{pipelineLabels[2]}</div>
            <div className="rsa-arrow">-&gt;</div>
            <div className={activeStage === 3 ? 'rsa-node active' : 'rsa-node'}>{pipelineLabels[3]}</div>
          </div>

          <div className="rsa-key-strip" aria-label="RSA key usage map">
            <div className="rsa-key-card">
              <h4>Public Key</h4>
              {track === 'toy' ? (
                <p>
                  e={toyKeys.e.toString()}, n={toyKeys.n.toString()}
                </p>
              ) : (
                <p>Used on backend for encryption; only public part is exposed conceptually.</p>
              )}
            </div>

            <div className="rsa-eq-card">
              <h4>Core Operation</h4>
              <code>{equationText}</code>
              <p>{mode === 'encrypt' ? 'Forward transform to ciphertext' : 'Reverse transform to plaintext'}</p>
            </div>

            <div className="rsa-key-card">
              <h4>Private Key</h4>
              {track === 'toy' ? (
                <>
                  <p>
                    d={toyKeys.d.toString()}, n={toyKeys.n.toString()}
                  </p>
                  <p className="rsa-key-meta">
                    p={toyKeys.p.toString()}, q={toyKeys.q.toString()}, phi={toyKeys.phi.toString()}
                  </p>
                </>
              ) : (
                <p>Kept on backend and used only for decryption.</p>
              )}
            </div>
          </div>

          <div className="rsa-data-board" aria-label="RSA data transformation board">
            <div className={activeStage === 0 ? 'rsa-data-card active' : 'rsa-data-card'}>
              <h4>Input</h4>
              <code>{shortenText(inputValue, 120)}</code>
            </div>
            <div className={activeStage === 1 ? 'rsa-data-card active' : 'rsa-data-card'}>
              <h4>Integer Stage</h4>
              <code>{shortenText(intermediateValue, 120)}</code>
            </div>
            <div className={activeStage === 2 ? 'rsa-data-card active' : 'rsa-data-card'}>
              <h4>Math Stage</h4>
              <code>{shortenText(operationValue || equationText, 120)}</code>
            </div>
            <div className={activeStage === 3 ? 'rsa-data-card active' : 'rsa-data-card'}>
              <h4>Output</h4>
              <code>{shortenText(result, 120)}</code>
            </div>
          </div>

          {track === 'toy' && mappingLines.length > 0 && (
            <div className="rsa-mapping-board" aria-label="Toy RSA block mapping preview">
              <h4>Toy Block Math Preview</h4>
              <div className="rsa-map-grid">
                {mappingLines.map((line, index) => (
                  <div key={`${line}-${index}`} className="rsa-map-row">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <FlowViewer
          flow={flow}
          stepIndex={stepIndex}
          onStepChange={onStepChange}
          placeholderText={placeholderText}
          timelineAriaLabel="RSA step timeline"
          headerItems={
            flow
              ? [
                  {
                    label: 'Track',
                    value: flow.source === 'backend' ? 'Backend RSA' : 'Toy RSA Sandbox',
                  },
                ]
              : undefined
          }
        />
      </section>
    </div>
  );
}

export default RsaVisualizationTab;
