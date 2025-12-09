
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ScrapeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CopyIcon = ({ copied }: { copied: boolean }) => (
  copied ?
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg> :
    <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const presets = [
  { name: 'ジョブメドレー', selector: 'h3 a' },
  { name: 'レバウェル', selector: 'h3 span' },
  { name: 'ナース専科', selector: 'h3' },
  { name: 'ハローワーク', selector: 'td div h2' },
];

const App = () => {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [result, setResult] = useState<string[] | string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyText, setCopyText] = useState('コピー');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [useProxy, setUseProxy] = useState(true);

  const handleScrape = async () => {
    if (!url || !selector) {
      setError('URLとCSSセレクターの両方を入力してください。');
      return;
    }

    setLoading(true);
    setResult('');
    setError('');
    setCopyText('コピー');

    const effectiveUrl = useProxy ? `https://corsproxy.io/?${encodeURIComponent(url)}` : url;

    try {
      const response = await fetch(effectiveUrl);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(`403エラー（アクセス拒否）が発生しました。サイトがリクエストをブロックしている可能性があります${useProxy ? '（プロキシ経由）' : ''}。`);
        }
        throw new Error(`ステータス ${response.status} エラーが発生しました`);
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const elements = doc.querySelectorAll(selector);
      const texts = Array.from(elements).map(el => el.textContent?.trim() || '').filter(text => text);

      if (texts.length === 0) {
        setResult('指定されたセレクターに一致する要素が見つかりませんでした。');
      } else {
        setResult(texts);
      }
    } catch (e) {
      console.error('Error:', e);
      let errorMessage = `失敗: ${(e as Error).message}`;
      if (e instanceof TypeError && (e as Error).message.toLowerCase().includes('failed to fetch')) {
        errorMessage = `ページの取得に失敗しました。\nブラウザのセキュリティ制限（CORSポリシー）が原因の可能性があります。`;
        if (!useProxy) {
          errorMessage += `\n\n💡 ヒント: 「CORSプロキシを使用」オプションを有効にしてみてください。`;
        } else {
          errorMessage += `\n\nCORSプロキシが利用できないか、対象サイトがブロックしている可能性があります。このサイトではプロキシを無効にしてみてください。`;
        }
      }
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setUrl('');
    setSelector('');
    setResult('');
    setError('');
    setCopyText('コピー');
    setSelectedPreset(null);
  };

  const handleCopy = () => {
    if (Array.isArray(result)) {
      const textToCopy = result.join('\n');
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopyText('コピー完了！');
        setTimeout(() => setCopyText('コピー'), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        setCopyText('失敗');
        setTimeout(() => setCopyText('コピー'), 2000);
      });
    }
  };

  const handlePresetChange = (presetName: string) => {
    if (selectedPreset === presetName) {
      setSelectedPreset(null);
      setSelector('');
    } else {
      const preset = presets.find(p => p.name === presetName);
      if (preset) {
        setSelectedPreset(preset.name);
        setSelector(preset.selector);
      }
    }
  };

  return (
    <div className="container">
      <h1>他社スクレイピング</h1>

      <div className="form-group">
        <label htmlFor="url-input">URL</label>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="例: https://example.com/page"
          aria-label="スクレイピング対象のURL"
          disabled={loading}
        />
        <div className="proxy-toggle">
          <input
            type="checkbox"
            id="proxy-checkbox"
            checked={useProxy}
            onChange={(e) => setUseProxy(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="proxy-checkbox">CORSプロキシを使用してブラウザエラーを防ぐ</label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="selector-input">CSSセレクター（抽出対象）</label>
        <input
          id="selector-input"
          type="text"
          value={selector}
          onChange={(e) => setSelector(e.target.value)}
          placeholder="例: .title, h3 a span"
          aria-label="使用するCSSセレクター"
          disabled={loading || !!selectedPreset}
        />
      </div>

      <div className="preset-group">
        {presets.map((preset) => (
          <button
            key={preset.name}
            className={`preset-item ${selectedPreset === preset.name ? 'active' : ''}`}
            onClick={() => handlePresetChange(preset.name)}
            disabled={loading}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="actions-container">
        <button onClick={handleClear} className="btn-secondary" disabled={loading}>
          <ClearIcon />
          クリア
        </button>
        <button onClick={handleScrape} className="btn-primary" disabled={loading}>
          <ScrapeIcon />
          {loading ? 'スクレイピング中...' : 'スクレイピング開始'}
        </button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      {loading && (
        <div className="loader" aria-live="polite" aria-label="結果を読み込み中">
          <div className="spinner"></div>
        </div>
      )}

      {result && (
        <div className="result-wrapper">
          <div className="result-header">
            <h2>スクレイピング結果</h2>
            {Array.isArray(result) && result.length > 0 && (
              <button onClick={handleCopy} className="btn-secondary">
                <CopyIcon copied={copyText === 'コピー完了！'} />
                {copyText}
              </button>
            )}
          </div>
          {Array.isArray(result) ? (
            result.length > 0 ? (
              <div className="table-container">
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>抽出されたテキスト</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((text, index) => (
                      <tr key={index}>
                        <td>{text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !loading && <p className="info">指定されたセレクターに一致する要素が見つかりませんでした。</p>
            )
          ) : (
            <p className="info">{result}</p>
          )}
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
