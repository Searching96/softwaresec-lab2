import { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [algorithm, setAlgorithm] = useState('RSA');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleAction = async (action: 'encrypt' | 'decrypt') => {
    setResult('');
    setError('');

    try {
      const response = await fetch(`http://localhost:8080/api/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, algorithm }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message)
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Crypto App</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Input Text</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 bg-white"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="RSA">RSA</option>
              <option value="AES">AES</option>
              <option value="DES">DES</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-2">
            <button
              onClick={() => handleAction('encrypt')}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Encrypt
            </button>
            <button
              onClick={() => handleAction('decrypt')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
            >
              Decrypt
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
              <textarea
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 bg-gray-50"
                rows={3}
                value={result}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;