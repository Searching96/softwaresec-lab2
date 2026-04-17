import type { Algorithm, CryptoAction } from '../types/crypto';

type MainTabProps = {
  algorithm: Algorithm;
  onAlgorithmChange: (algorithm: Algorithm) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  result: string;
  error: string;
  activeAction: CryptoAction | null;
  onAction: (action: CryptoAction) => void;
};

function MainTab({
  algorithm,
  onAlgorithmChange,
  inputValue,
  onInputChange,
  result,
  error,
  activeAction,
  onAction,
}: MainTabProps) {
  return (
    <section className="panel single-panel">
      <h2>Main Encrypt / Decrypt</h2>
      <p className="subtext">Run any algorithm here. This tab only shows final output.</p>

      <label htmlFor="mainAlgorithm">Algorithm</label>
      <select
        id="mainAlgorithm"
        value={algorithm}
        onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)}
      >
        <option value="RSA">RSA</option>
        <option value="AES">AES</option>
        <option value="DES">DES</option>
      </select>

      <label htmlFor="mainInput">Input</label>
      <textarea
        id="mainInput"
        rows={4}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Enter plaintext or ciphertext based on the action you choose."
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
          <h3>Result</h3>
          <textarea readOnly rows={4} value={result} />
        </div>
      )}
    </section>
  );
}

export default MainTab;
