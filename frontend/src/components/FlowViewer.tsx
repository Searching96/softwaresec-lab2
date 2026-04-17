import type { AlgoFlow, RsaFlow } from '../types/crypto';
import { shorten } from '../utils/cryptoHelpers';

type HeaderItem = {
  label: string;
  value: string;
};

type FlowViewerProps = {
  flow: AlgoFlow | RsaFlow | null;
  stepIndex: number;
  onStepChange: (nextIndex: number) => void;
  placeholderText: string;
  timelineAriaLabel: string;
  headerItems?: HeaderItem[];
};

function FlowViewer({
  flow,
  stepIndex,
  onStepChange,
  placeholderText,
  timelineAriaLabel,
  headerItems = [],
}: FlowViewerProps) {
  if (!flow) {
    return <div className="placeholder-note">{placeholderText}</div>;
  }

  const activeStep = flow.steps[stepIndex];
  const modeText = flow.mode === 'encrypt' ? 'Encryption' : 'Decryption';

  return (
    <>
      <div className="flow-header">
        {headerItems.map((item) => (
          <p key={item.label}>
            {item.label}: <strong>{item.value}</strong>
          </p>
        ))}
        <p>
          Mode: <strong>{modeText}</strong>
        </p>
        <p>
          Step {stepIndex + 1} of {flow.steps.length}
        </p>
      </div>

      <div className="timeline" aria-label={timelineAriaLabel}>
        {flow.steps.map((step, index) => (
          <button
            key={`${step.title}-${index}`}
            type="button"
            className={index === stepIndex ? 'timeline-step active' : 'timeline-step'}
            onClick={() => onStepChange(index)}
          >
            <span>{index + 1}</span>
            <small>{shorten(step.title, 28)}</small>
          </button>
        ))}
      </div>

      {activeStep && (
        <article className="step-detail">
          <h3>{activeStep.title}</h3>
          <p>{activeStep.detail}</p>
          {activeStep.equation && <pre className="equation">{activeStep.equation}</pre>}
          {activeStep.value && <pre className="value-box">{activeStep.value}</pre>}
        </article>
      )}

      <div className="step-nav">
        <button
          type="button"
          onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
          disabled={stepIndex === 0}
        >
          Previous Step
        </button>
        <button
          type="button"
          onClick={() => onStepChange(Math.min(flow.steps.length - 1, stepIndex + 1))}
          disabled={stepIndex === flow.steps.length - 1}
        >
          Next Step
        </button>
      </div>
    </>
  );
}

export default FlowViewer;
