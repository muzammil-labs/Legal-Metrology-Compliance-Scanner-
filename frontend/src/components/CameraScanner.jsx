import { Upload, FileScan } from 'lucide-react';
import { useEffect } from 'react';

export default function CameraScanner({ mode, file, setFile, setMode, loading, message, runScan, modes }) {

  // Haptic feedback hook on demo fixture switch
  useEffect(() => {
    if (mode && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [mode]);

  return (
    <div className="capture-panel">
      <div className="panel-head">
        <span>01 / CAPTURE SURFACE</span>
        <span className="mono">{message}</span>
      </div>
      <div className="viewport">
        <div className="grid-lines" />
        {loading && <div className="scanline" />}
        {mode && (
          <div className="fixture-label">
            {modes.find(item => item.key === mode)?.label}
          </div>
        )}
        <div className="viewport-center">
          <Upload size={28} />
          <p>{file ? file.name : 'Upload a package label'}</p>
          <small>Camera input or image file</small>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={event => {
            setFile(event.target.files?.[0] ?? null);
            setMode(null);
          }}
        />
      </div>
      <button
        className="scan-button"
        disabled={loading || (!file && !mode)}
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(50);
          runScan();
        }}
      >
        <FileScan size={18} /> {loading ? 'SCANNING' : 'RUN COMPLIANCE SCAN'}
      </button>
    </div>
  );
}
