import { useMemo, useState } from 'react';
import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { AlgoFlow, CryptoAction, OverviewItem } from '../types/crypto';
import { textToBytes } from '../utils/cryptoHelpers';

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

function toBits32(value: number): string {
  return (value >>> 0).toString(2).padStart(32, '0');
}

function parseBytePreview(value: string): number[] {
  const bytes: number[] = [];
  const regex = /b\d+:\s*(\d+)/g;
  let match = regex.exec(value);

  while (match) {
    bytes.push(Number(match[1]));
    if (bytes.length >= 8) {
      break;
    }
    match = regex.exec(value);
  }

  return bytes;
}

function normalizeDesBlock(bytes: number[]): number[] {
  const block = [...bytes.slice(0, 8)];
  while (block.length < 8) {
    block.push(0);
  }
  return block;
}

function blockToHalves(block: number[]): { left: number; right: number } {
  let left = 0;
  let right = 0;

  for (let i = 0; i < 4; i += 1) {
    left = ((left << 8) | block[i]) >>> 0;
    right = ((right << 8) | block[i + 4]) >>> 0;
  }

  return { left, right };
}

function deriveInitialHalves(flow: AlgoFlow | null, inputValue: string, result: string): { left: number; right: number } {
  const splitStep = flow?.steps.find((step) => step.title.toLowerCase().includes('split'));
  if (splitStep?.value) {
    const leftMatch = splitStep.value.match(/L0:\s*([01]{32})/);
    const rightMatch = splitStep.value.match(/R0:\s*([01]{32})/);

    if (leftMatch && rightMatch) {
      return {
        left: Number.parseInt(leftMatch[1], 2) >>> 0,
        right: Number.parseInt(rightMatch[1], 2) >>> 0,
      };
    }
  }

  if (flow) {
    for (const step of flow.steps) {
      if (!step.value) {
        continue;
      }
      const previewBytes = parseBytePreview(step.value);
      if (previewBytes.length > 0) {
        return blockToHalves(normalizeDesBlock(previewBytes));
      }
    }
  }

  const fallbackBytes = inputValue.trim() ? textToBytes(inputValue) : textToBytes(result);
  return blockToHalves(normalizeDesBlock(fallbackBytes));
}

function rotateLeft32(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function deriveRoundKey(keyIndex: number): number {
  return ((keyIndex * 0x1f1f1f1f) ^ 0x0f0f0f0f) >>> 0;
}

function feistelFunction(right: number, key: number, round: number): number {
  const expanded = (rotateLeft32(right, 1) ^ rotateLeft32(right, 8) ^ key ^ ((round * 0x01010101) >>> 0)) >>> 0;
  return (rotateLeft32(expanded, 3) ^ ((expanded * 0x45d9f3b) >>> 0)) >>> 0;
}

type DesRoundTrace = {
  keyIndex: number;
  prevLeft: number;
  prevRight: number;
  fOutput: number;
  nextLeft: number;
  nextRight: number;
};

function buildDesRoundTrace(initialLeft: number, initialRight: number, roundFocus: number, isDecrypt: boolean): DesRoundTrace {
  let left = initialLeft >>> 0;
  let right = initialRight >>> 0;

  let trace: DesRoundTrace = {
    keyIndex: isDecrypt ? 16 : 1,
    prevLeft: left,
    prevRight: right,
    fOutput: 0,
    nextLeft: right,
    nextRight: left,
  };

  for (let round = 1; round <= roundFocus; round += 1) {
    const keyIndex = isDecrypt ? 17 - round : round;
    const roundKey = deriveRoundKey(keyIndex);
    const fOutput = feistelFunction(right, roundKey, round);
    const nextLeft = right;
    const nextRight = (left ^ fOutput) >>> 0;

    if (round === roundFocus) {
      trace = {
        keyIndex,
        prevLeft: left,
        prevRight: right,
        fOutput,
        nextLeft,
        nextRight,
      };
    }

    left = nextLeft;
    right = nextRight;
  }

  return trace;
}

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
  const isDecrypt = flow?.mode === 'decrypt';

  const activeStage = flow ? Math.min(stepIndex, 3) : -1;

  const initialHalves = useMemo(() => deriveInitialHalves(flow, inputValue, result), [flow, inputValue, result]);
  const roundTrace = useMemo(
    () => buildDesRoundTrace(initialHalves.left, initialHalves.right, roundFocus, isDecrypt),
    [initialHalves.left, initialHalves.right, roundFocus, isDecrypt]
  );

  const roundStepIndex = useMemo(() => {
    if (!flow) {
      return -1;
    }
    return flow.steps.findIndex((step) => step.title.toLowerCase().includes('round'));
  }, [flow]);

  const viewerFlow = useMemo<AlgoFlow | null>(() => {
    if (!flow || roundStepIndex < 0) {
      return flow;
    }

    const steps = flow.steps.map((step) => ({ ...step }));
    const equation = `L${roundFocus} = R${roundFocus - 1}, R${roundFocus} = L${roundFocus - 1} XOR F(R${roundFocus - 1}, K${roundTrace.keyIndex})`;
    const value = [
      `L${roundFocus - 1}: ${toBits32(roundTrace.prevLeft)}`,
      `R${roundFocus - 1}: ${toBits32(roundTrace.prevRight)}`,
      `F(R${roundFocus - 1}, K${roundTrace.keyIndex}): ${toBits32(roundTrace.fOutput)}`,
      `L${roundFocus}: ${toBits32(roundTrace.nextLeft)}`,
      `R${roundFocus}: ${toBits32(roundTrace.nextRight)}`,
      `Round ${roundFocus} output: ${toBits32(roundTrace.nextLeft)} ${toBits32(roundTrace.nextRight)}`,
    ].join('\n');

    steps[roundStepIndex] = {
      ...steps[roundStepIndex],
      detail: `${isDecrypt ? 'Decrypt' : 'Encrypt'} round ${roundFocus} selected. Move the round slider to inspect another Feistel snapshot.`,
      equation,
      value,
    };

    return {
      ...flow,
      steps,
    };
  }, [flow, roundStepIndex, roundFocus, roundTrace, isDecrypt]);

  const handleRoundFocusChange = (nextRound: number) => {
    setRoundFocus(nextRound);
    if (roundStepIndex >= 0) {
      onStepChange(roundStepIndex);
    }
  };

  const keyIndex = roundTrace.keyIndex;

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
              onChange={(e) => handleRoundFocusChange(Number(e.target.value))}
            />
            <p>
              Round {roundFocus}: L{roundFocus} = R{roundFocus - 1}, R{roundFocus} = L{roundFocus - 1} XOR F(R{roundFocus - 1}, K{keyIndex})
            </p>
          </div>

          <div className="des-feistel-board" aria-label="DES Feistel round board">
            <div className="des-column">
              <div className="des-half-card">
                <h4>L{roundFocus - 1}</h4>
                <code>{toBits32(roundTrace.prevLeft)}</code>
              </div>
              <div className="des-half-card">
                <h4>R{roundFocus - 1}</h4>
                <code>{toBits32(roundTrace.prevRight)}</code>
              </div>
            </div>

            <div className="des-column des-center-flow">
              <div className="des-f-box">
                F(R{roundFocus - 1}, K{keyIndex})
                <code>{toBits32(roundTrace.fOutput)}</code>
              </div>
              <div className="des-xor-box">
                XOR with L{roundFocus - 1}
                <code>{toBits32(roundTrace.prevLeft)}</code>
              </div>
            </div>

            <div className="des-column">
              <div className="des-half-card active">
                <h4>L{roundFocus}</h4>
                <code>{toBits32(roundTrace.nextLeft)}</code>
              </div>
              <div className="des-half-card active">
                <h4>R{roundFocus}</h4>
                <code>{toBits32(roundTrace.nextRight)}</code>
              </div>
            </div>
          </div>

          <div className="des-round-result">
            <h4>Round {roundFocus} Output Block</h4>
            <code>
              {toBits32(roundTrace.nextLeft)} {toBits32(roundTrace.nextRight)}
            </code>
          </div>
        </article>

        <FlowViewer
          flow={viewerFlow}
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
