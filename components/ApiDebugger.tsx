"use client";
import React, { useState } from 'react';
import apiClient from '@/services/api-client';

export default function ApiDebugger() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [useProxy, setUseProxy] = useState(false);

  const testDirectApi = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://193.188.23.43/imageni_clean/api_log.php?em=user@user.com&pass=123123123');
      const text = await response.text();
      setResult(`Status: ${response.status}\nResponse: ${text}`);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testProxyApi = async () => {
    setLoading(true);
    try {
      apiClient.enableProxy(useProxy);
      const response = await apiClient.login('user@user.com', '123123123');
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#151515] rounded-lg">
      <h3 className="text-xl font-bold mb-4">API Debugger</h3>
      
      <div className="flex gap-4 mb-4">
        <button 
          onClick={testDirectApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Direct API
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={testProxyApi}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Client API
          </button>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
            />
            Use Proxy
          </label>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-lg font-semibold mb-2">Result:</h4>
        <pre className="bg-black rounded p-3 overflow-auto max-h-60 text-sm">
          {loading ? 'Loading...' : result || 'No result yet'}
        </pre>
      </div>
    </div>
  );
}
