import React, { useState } from 'react';

export default function DiagnosticsView({ user }) {
  const [hostInput, setHostInput] = useState('127.0.0.1');
  const [pingOutput, setPingOutput] = useState('');
  const [pingLoading, setPingLoading] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState('telemetry');
  const [archiveStatus, setArchiveStatus] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveDuration, setArchiveDuration] = useState(null);

  const handleRunPing = async (e) => {
    e.preventDefault();
    setPingLoading(true);
    setPingOutput('Executing secure diagnostic ping...');

    try {
      const res = await fetch('/api/diagnostics/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: hostInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setPingOutput('Error (' + res.status + '): ' + (data.error || 'Request rejected by perimeter defenses.'));
      } else {
        setPingOutput(data.output || 'Ping completed successfully.');
      }
    } catch (err) {
      setPingOutput('Diagnostic ping request failed: ' + err.message);
    } finally {
      setPingLoading(false);
    }
  };

  const handleRunArchive = async (e) => {
    e.preventDefault();
    setArchiveLoading(true);
    setArchiveStatus('Submitting secure diagnostics task...');
    const startTime = Date.now();

    try {
      const res = await fetch('/api/diagnostics/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: archiveTarget })
      });
      const data = await res.json();
      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
      setArchiveDuration(elapsedSeconds);
      if (!res.ok) {
        setArchiveStatus('Error (' + res.status + '): ' + (data.error || 'Task rejected by validation policy.'));
      } else {
        setArchiveStatus(data.status || 'Task completed successfully.');
      }
    } catch (err) {
      const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
      setArchiveDuration(elapsedSeconds);
      setArchiveStatus('Diagnostics task failed: ' + err.message);
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <div>
      <div className="card card-accent-blue" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Secured Campus Server Diagnostics Portal</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          This hardened diagnostic portal validates all incoming network targets with strict regular expressions and executes diagnostics via parameterized argument vectors without invoking a command shell.
        </p>

        <form onSubmit={handleRunPing} style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Destination Node or Hostname</label>
            <input
              type="text"
              className="form-input"
              value={hostInput}
              onChange={(e) => setHostInput(e.target.value)}
              placeholder="e.g. 127.0.0.1 or node.iiita.ac.in"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pingLoading}>
            {pingLoading ? 'Testing Connectivity...' : 'Execute Node Ping'}
          </button>
        </form>

        {pingOutput && (
          <div style={{ marginTop: '16px' }}>
            <label className="form-label">Diagnostic Console Output</label>
            <pre style={{
              background: '#0f172a',
              color: pingOutput.includes('Error') ? '#f87171' : '#38bdf8',
              padding: '16px',
              borderRadius: '8px',
              overflowX: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.88rem',
              whiteSpace: 'pre-wrap'
            }}>
              {pingOutput}
            </pre>
          </div>
        )}
      </div>

      <div className="card card-accent-green">
        <div className="card-header">
          <h3 className="card-title">Protected Background System Archiver</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Execute scheduled telemetry dumps with strict target allow list enforcement and zero shell execution.
        </p>

        <form onSubmit={handleRunArchive}>
          <div className="form-group">
            <label className="form-label">Diagnostics Target Identifier</label>
            <input
              type="text"
              className="form-input"
              value={archiveTarget}
              onChange={(e) => setArchiveTarget(e.target.value)}
              placeholder="e.g. telemetry, logs, database_snapshot"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={archiveLoading}>
            {archiveLoading ? 'Processing Background Task...' : 'Schedule Diagnostics Task'}
          </button>
        </form>

        {archiveStatus && (
          <div style={{ marginTop: '16px' }}>
            <div className="notice-banner" style={{
              background: archiveStatus.includes('Error') ? '#fef2f2' : '#f0fdf4',
              border: archiveStatus.includes('Error') ? '1px solid #fecaca' : '1px solid #bbf7d0',
              color: archiveStatus.includes('Error') ? '#b91c1c' : '#166534'
            }}>
              <strong>Execution Response:</strong> {archiveStatus}
              {archiveDuration !== null && (
                <div style={{ marginTop: '6px', color: '#64748b' }}>
                  Total Server Roundtrip Duration: {archiveDuration} seconds.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
