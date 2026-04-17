import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { AlgoFlow, CryptoAction, OverviewItem } from '../types/crypto';

type SymmetricVisualizationTabProps = {
  title: string;
  description: string;
  inputId: string;
  inputLabel: string;
  inputPlaceholder: string;
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
  placeholderText: string;
  timelineAriaLabel: string;
};

function SymmetricVisualizationTab({
  title,
  description,
  inputId,
  inputLabel,
  inputPlaceholder,
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
  placeholderText,
  timelineAriaLabel,
}: SymmetricVisualizationTabProps) {
  return (
    <div className="rsa-layout">
      <section className="panel control-panel">
        <h2>{title}</h2>
        <p className="subtext">{description}</p>

        <label htmlFor={inputId}>{inputLabel}</label>
        <textarea
          id={inputId}
          rows={4}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
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
        <h2>{title.replace('Visualization', 'Learning View')}</h2>
        <OverviewGrid items={overviewItems} />
        <FlowViewer
          flow={flow}
          stepIndex={stepIndex}
          onStepChange={onStepChange}
          placeholderText={placeholderText}
          timelineAriaLabel={timelineAriaLabel}
        />
      </section>
    </div>
  );
}

export default SymmetricVisualizationTab;
