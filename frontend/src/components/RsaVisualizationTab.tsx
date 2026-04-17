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

        {track === 'toy' && (
          <article className="toy-key-card">
            <h3>Toy Keypair</h3>
            <p>
              Public key: (e={toyKeys.e.toString()}, n={toyKeys.n.toString()})
            </p>
            <p>
              Private key: (d={toyKeys.d.toString()}, n={toyKeys.n.toString()})
            </p>
            <p>
              Internals: p={toyKeys.p.toString()}, q={toyKeys.q.toString()}, phi={toyKeys.phi.toString()}
            </p>
          </article>
        )}

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
