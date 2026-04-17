import { useMemo, useState } from 'react';
import FlowViewer from './FlowViewer';
import OverviewGrid from './OverviewGrid';
import type { AlgoFlow, CryptoAction, OverviewItem } from '../types/crypto';
import { textToBytes, toHexByte } from '../utils/cryptoHelpers';

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

function normalizeAesBlock(bytes: number[]): number[] {
  const block = [...bytes.slice(0, 16)];
  while (block.length < 16) {
    block.push(0);
  }
  return block;
}

function parseBytePreview(value: string): number[] {
  const bytes: number[] = [];
  const regex = /b\d+:\s*(\d+)/g;
  let match = regex.exec(value);

  while (match) {
    bytes.push(Number(match[1]));
    if (bytes.length >= 16) {
      break;
    }
    match = regex.exec(value);
  }

  return bytes;
}

function parseMatrixBlock(value: string): number[] | null {
  const rows = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => line.split(/\s+/).slice(0, 4));

  if (rows.length !== 4 || rows.some((row) => row.length !== 4)) {
    return null;
  }

  const block = new Array<number>(16).fill(0);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const parsed = Number.parseInt(rows[row][col], 16);
      if (Number.isNaN(parsed)) {
        return null;
      }
      block[col * 4 + row] = parsed;
    }
  }

  return block;
}

function bytesToMatrix(bytes: number[]): string[][] {
  const block = normalizeAesBlock(bytes);
  return [0, 1, 2, 3].map((row) => [0, 1, 2, 3].map((col) => toHexByte(block[col * 4 + row])));
}

function matrixToLines(matrix: string[][]): string {
  return matrix.map((row) => row.join(' ')).join('\n');
}

function shiftRows(state: number[]): number[] {
  const out = [...state];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] = state[((col + row) % 4) * 4 + row];
    }
  }
  return out;
}

function invShiftRows(state: number[]): number[] {
  const out = [...state];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      out[col * 4 + row] = state[((col - row + 4) % 4) * 4 + row];
    }
  }
  return out;
}

function xorMask(state: number[], seed: number): number[] {
  return state.map((value, index) => (value ^ ((seed * 31 + index * 17 + (index % 4) * 13) & 0xff)) & 0xff);
}

function mixColumnsApprox(state: number[], seed: number): number[] {
  const out = [...state];
  for (let col = 0; col < 4; col += 1) {
    const i = col * 4;
    const a = state[i];
    const b = state[i + 1];
    const c = state[i + 2];
    const d = state[i + 3];

    out[i] = (a ^ b ^ ((seed + col * 3) & 0xff)) & 0xff;
    out[i + 1] = (b ^ c ^ ((seed + col * 5 + 17) & 0xff)) & 0xff;
    out[i + 2] = (c ^ d ^ ((seed + col * 7 + 29) & 0xff)) & 0xff;
    out[i + 3] = (d ^ a ^ ((seed + col * 11 + 43) & 0xff)) & 0xff;
  }
  return out;
}

function invMixColumnsApprox(state: number[], seed: number): number[] {
  const out = [...state];
  for (let col = 0; col < 4; col += 1) {
    const i = col * 4;
    const a = state[i];
    const b = state[i + 1];
    const c = state[i + 2];
    const d = state[i + 3];

    out[i] = (a ^ d ^ ((seed + col * 2 + 9) & 0xff)) & 0xff;
    out[i + 1] = (a ^ b ^ ((seed + col * 4 + 21) & 0xff)) & 0xff;
    out[i + 2] = (b ^ c ^ ((seed + col * 6 + 33) & 0xff)) & 0xff;
    out[i + 3] = (c ^ d ^ ((seed + col * 8 + 45) & 0xff)) & 0xff;
  }
  return out;
}

function deriveBaseAesBlock(flow: AlgoFlow | null, inputValue: string, result: string): number[] {
  const stateValue = flow?.steps.find((step) => step.title.toLowerCase().includes('state'))?.value;
  if (stateValue) {
    const parsedState = parseMatrixBlock(stateValue);
    if (parsedState) {
      return normalizeAesBlock(parsedState);
    }
  }

  if (flow) {
    for (const step of flow.steps) {
      if (!step.value) {
        continue;
      }
      const previewBytes = parseBytePreview(step.value);
      if (previewBytes.length > 0) {
        return normalizeAesBlock(previewBytes);
      }
    }
  }

  const fallback = inputValue.trim() ? textToBytes(inputValue) : textToBytes(result);
  return normalizeAesBlock(fallback);
}

type AesRoundTrace = {
  roundState: number[];
  stageStates: number[][];
};

function buildAesRoundTrace(baseState: number[], roundFocus: number, isDecrypt: boolean): AesRoundTrace {
  let state = [...baseState];
  let stageStates: number[][] = [state, state, state, state];

  for (let round = 1; round <= roundFocus; round += 1) {
    const seed = isDecrypt ? 11 - round : round;

    if (isDecrypt) {
      const stage1 = invShiftRows(state);
      const stage2 = xorMask(stage1, seed * 19 + 7);
      const stage3 = xorMask(stage2, seed * 23 + 11);
      const stage4 = round === 10 ? stage3 : invMixColumnsApprox(stage3, seed * 13 + 5);

      if (round === roundFocus) {
        stageStates = [stage1, stage2, stage3, stage4];
      }

      state = stage4;
      continue;
    }

    const stage1 = xorMask(state, seed * 19 + 7);
    const stage2 = shiftRows(stage1);
    const stage3 = round === 10 ? stage2 : mixColumnsApprox(stage2, seed * 13 + 5);
    const stage4 = xorMask(stage3, seed * 23 + 11);

    if (round === roundFocus) {
      stageStates = [stage1, stage2, stage3, stage4];
    }

    state = stage4;
  }

  return {
    roundState: state,
    stageStates,
  };
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
  const isDecrypt = flow?.mode === 'decrypt';

  const activeStage = flow ? Math.min(stepIndex, 3) : -1;

  const baseState = useMemo(() => deriveBaseAesBlock(flow, inputValue, result), [flow, inputValue, result]);
  const stateMatrix = useMemo(() => bytesToMatrix(baseState), [baseState]);
  const roundTrace = useMemo(() => buildAesRoundTrace(baseState, roundFocus, isDecrypt), [baseState, roundFocus, isDecrypt]);
  const roundStateMatrix = useMemo(() => bytesToMatrix(roundTrace.roundState), [roundTrace.roundState]);
  const stageMatrices = useMemo(() => roundTrace.stageStates.map(bytesToMatrix), [roundTrace.stageStates]);
  const roundStepIndex = useMemo(() => {
    if (!flow) {
      return -1;
    }
    return flow.steps.findIndex((step) => step.title.toLowerCase().includes('round'));
  }, [flow]);

  const isFinalRound = roundFocus === 10;

  const roundStages = isDecrypt
    ? ['InvShiftRows', 'InvSubBytes', 'AddRoundKey', isFinalRound ? 'Skip InvMixColumns' : 'InvMixColumns']
    : ['SubBytes', 'ShiftRows', isFinalRound ? 'Skip MixColumns' : 'MixColumns', 'AddRoundKey'];

  const roundOutputLines = useMemo(() => matrixToLines(roundStateMatrix), [roundStateMatrix]);

  const stageLines = useMemo(
    () => roundStages.map((stage, index) => `${stage}:\n${matrixToLines(stageMatrices[index] ?? bytesToMatrix(baseState))}`),
    [roundStages, stageMatrices, baseState]
  );

  const viewerFlow = useMemo<AlgoFlow | null>(() => {
    if (!flow || roundStepIndex < 0) {
      return flow;
    }

    const keyIndex = isDecrypt ? 11 - roundFocus : roundFocus;
    const steps = flow.steps.map((step) => ({ ...step }));

    steps[roundStepIndex] = {
      ...steps[roundStepIndex],
      detail: `${isDecrypt ? 'Inverse' : 'Forward'} round ${roundFocus} selected. Move the round slider to inspect another snapshot.`,
      equation: isDecrypt
        ? `Round ${roundFocus}: InvShiftRows -> InvSubBytes -> AddRoundKey(K${keyIndex})${isFinalRound ? '' : ' -> InvMixColumns'}`
        : `Round ${roundFocus}: SubBytes -> ShiftRows${isFinalRound ? '' : ' -> MixColumns'} -> AddRoundKey(K${keyIndex})`,
      value: `Round ${roundFocus} output state (hex):\n${roundOutputLines}\n\nStage outputs:\n${stageLines.join('\n\n')}`,
    };

    return {
      ...flow,
      steps,
    };
  }, [flow, roundStepIndex, isDecrypt, roundFocus, isFinalRound, roundOutputLines, stageLines]);

  const handleRoundFocusChange = (nextRound: number) => {
    setRoundFocus(nextRound);
    if (roundStepIndex >= 0) {
      onStepChange(roundStepIndex);
    }
  };

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
            <h4>Round 0 State (Hex)</h4>
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

          <div className="aes-matrix-board" aria-label="AES selected round output matrix">
            <h4>Round {roundFocus} Output State (Hex)</h4>
            <div className="aes-matrix-grid">
              {roundStateMatrix.flatMap((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div key={`out-${rowIndex}-${colIndex}`} className="aes-cell">
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
              onChange={(e) => handleRoundFocusChange(Number(e.target.value))}
            />
            <p>
              {isDecrypt
                ? `Decrypt round ${roundFocus} uses key K${11 - roundFocus} in reverse order.`
                : `Encrypt round ${roundFocus} uses key K${roundFocus}.`}
            </p>
          </div>

          <div className="aes-round-lane" aria-label="AES round operations lane">
            {roundStages.map((stage, index) => (
              <div key={`${stage}-${index}`} className="aes-stage-chip">
                <strong>{stage}</strong>
                <div className="aes-stage-mini-grid">
                  {stageMatrices[index]?.flatMap((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div key={`${stage}-${rowIndex}-${colIndex}`} className="aes-stage-cell">
                        {cell}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="aes-stage-note">Round slider now updates stage outputs and the selected-round state matrix.</p>
        </article>

        <FlowViewer
          flow={viewerFlow}
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
