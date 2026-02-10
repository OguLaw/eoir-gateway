'use client'

import { useState, useEffect } from 'react'

interface CheckResult {
  allowed: boolean
  ip: string
  credentials?: { email: string; password: string }
  eoir_url?: string
  message?: string
}

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(true)

  const checkIp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/check-ip', { cache: 'no-store' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ allowed: false, ip: 'error', message: 'Connection error. Please try again.' })
    }
    setLoading(false)
  }

  useEffect(() => { checkIp() }, [])

  const scriptInstallUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/eoir-autofill.user.js`
    : '/eoir-autofill.user.js'

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>⚖️</div>
          <h1 style={styles.title}>EOIR Gateway</h1>
          <p style={styles.subtitle}>Secure Access Portal</p>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Checking IP address...</p>
          </div>
        ) : result?.allowed ? (
          <div style={styles.content}>
            <div style={{ ...styles.status, ...styles.statusOk }}>
              <span style={styles.statusDot}>●</span>
              VPN Active — IP: {result.ip}
            </div>

            {/* Setup Guide */}
            <div style={styles.guideBox}>
              <p style={styles.guideMainTitle}>Setup Guide</p>
              <p style={styles.guideDesc}>
                You only need to complete this setup <strong>once</strong>.
                After that, email, password, and OTP will be filled automatically every time you access the EOIR portal.
              </p>

              {/* Step 1 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>1</span>
                  <span style={styles.stepTitle}>Install the Tampermonkey Extension</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Click the link below. On the page that opens, click the blue <strong>&quot;Add to Chrome&quot;</strong> button.
                  </p>
                  <a
                    href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.stepBtn}
                  >
                    Chrome Web Store &rarr; Tampermonkey
                  </a>
                  <p style={styles.stepText}>
                    In the popup window, click <strong>&quot;Add extension&quot;</strong>.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>2</span>
                  <span style={styles.stepTitle}>Enable Tampermonkey Permissions</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Click the <strong>puzzle (jigsaw) icon</strong> in the top-right corner of Chrome.
                  </p>
                  <p style={styles.stepText}>
                    Click the <strong>three dots (&middot;&middot;&middot;)</strong> menu next to <strong>Tampermonkey</strong>.
                  </p>
                  <p style={styles.stepText}>
                    Select <strong>&quot;Manage extension&quot;</strong>.
                  </p>
                  <p style={styles.stepText}>
                    On the extension page, make sure the following settings are <strong>enabled</strong> (blue):
                  </p>
                  <div style={styles.settingsList}>
                    <div style={styles.settingItem}>
                      <span style={styles.toggleOn}>●</span>
                      <span>Allow access to file URLs</span>
                    </div>
                    <div style={styles.settingItem}>
                      <span style={styles.toggleOn}>●</span>
                      <span>On all sites</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 - Allow User Scripts */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>3</span>
                  <span style={styles.stepTitle}>Allow User Scripts in Chrome</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Open Chrome and go to <strong>chrome://settings/content/javascript</strong> in the address bar.
                  </p>
                  <p style={styles.stepText}>
                    Alternatively: Chrome Settings &rarr; Privacy &amp; Security &rarr; Site Settings &rarr; JavaScript.
                  </p>
                  <p style={styles.stepText}>
                    Find and enable the <strong>&quot;Allow sites to use JavaScript with User Scripts&quot;</strong> toggle.
                  </p>
                  <p style={styles.stepNote}>
                    This setting is required for Tampermonkey to run user scripts on websites.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>4</span>
                  <span style={styles.stepTitle}>Install the Auto-Login Script</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Click the button below. Tampermonkey will automatically open an installation window.
                  </p>
                  <a href={scriptInstallUrl} style={styles.installBtn}>
                    Install Auto-Login Script
                  </a>
                  <p style={styles.stepText}>
                    In the window that opens, click the <strong>&quot;Install&quot;</strong> button.
                  </p>
                  <p style={styles.stepNote}>
                    If the installation window doesn&apos;t open: Open Tampermonkey Dashboard &rarr; Click the &quot;+&quot; icon &rarr;
                    Paste the entire code from{' '}
                    <a href={scriptInstallUrl} target="_blank" rel="noopener noreferrer" style={styles.linkInline}>
                      this link
                    </a>
                    {' '}and save it.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={{ ...styles.stepBadge, background: '#22c55e' }}>✓</span>
                  <span style={styles.stepTitle}>Ready!</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Now when you click the button below, email, password, and OTP will be <strong>filled automatically</strong>.
                    The entire login process is fully automated.
                  </p>
                </div>
              </div>
            </div>

            {/* Launch */}
            <a
              href={result.eoir_url || 'https://portal.eoir.justice.gov/'}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.launchBtn}
            >
              Go to EOIR Portal &rarr;
            </a>

            <p style={styles.otpNote}>
              Email, password, and OTP are all filled automatically. No manual entry needed.
            </p>
          </div>
        ) : (
          <div style={styles.content}>
            <div style={{ ...styles.status, ...styles.statusError }}>
              <span style={styles.statusDot}>●</span>
              VPN Connection Not Found
            </div>
            <div style={styles.errorBox}>
              <p style={styles.errorText}>{result?.message}</p>
              <p style={styles.ipText}>Detected IP: {result?.ip}</p>
            </div>
            <button style={styles.retryBtn} onClick={checkIp}>
              Check Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
  },
  card: {
    background: '#ffffff', borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    width: '100%', maxWidth: '480px', overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    padding: '32px 24px', textAlign: 'center' as const, color: '#fff',
  },
  icon: { fontSize: '40px', marginBottom: '8px' },
  title: { margin: '0 0 4px 0', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', opacity: 0.8 },
  loading: { padding: '48px 24px', textAlign: 'center' as const },
  spinner: {
    width: '32px', height: '32px',
    border: '3px solid #e2e8f0', borderTopColor: '#3b82f6',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  loadingText: { color: '#64748b', fontSize: '14px', margin: 0 },
  content: { padding: '24px' },
  status: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600, marginBottom: '20px',
  },
  statusOk: { background: '#f0fdf4', color: '#166534' },
  statusError: { background: '#fef2f2', color: '#991b1b' },
  statusDot: { fontSize: '10px' },

  // Guide
  guideBox: { marginBottom: '20px' },
  guideMainTitle: {
    fontSize: '18px', fontWeight: 700, color: '#1e293b',
    margin: '0 0 6px 0',
  },
  guideDesc: {
    fontSize: '13px', color: '#64748b', lineHeight: 1.5,
    margin: '0 0 16px 0',
  },

  // Steps
  stepBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '10px', padding: '14px', marginBottom: '12px',
  },
  stepHeader: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
  },
  stepBadge: {
    width: '26px', height: '26px', borderRadius: '50%',
    background: '#3b82f6', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '13px', fontWeight: 700, flexShrink: 0,
  },
  stepTitle: { fontSize: '14px', fontWeight: 600, color: '#1e293b' },
  stepBody: { marginLeft: '36px' },
  stepText: {
    fontSize: '13px', color: '#475569', lineHeight: 1.6,
    margin: '0 0 8px 0',
  },
  stepNote: {
    fontSize: '11px', color: '#94a3b8', lineHeight: 1.5,
    margin: '10px 0 0 0', fontStyle: 'italic' as const,
  },
  stepBtn: {
    display: 'block', padding: '10px 14px', marginBottom: '10px',
    background: '#1e293b', color: '#fff', borderRadius: '8px',
    fontSize: '13px', fontWeight: 600, textDecoration: 'none',
    textAlign: 'center' as const,
  },

  // Settings list
  settingsList: {
    display: 'flex', flexDirection: 'column' as const, gap: '6px',
    margin: '8px 0 0 0',
  },
  settingItem: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px', color: '#334155',
  },
  toggleOn: { color: '#3b82f6', fontSize: '18px', lineHeight: 1 },

  // Install button
  installBtn: {
    display: 'block', width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600, textAlign: 'center' as const,
    textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
    marginBottom: '10px',
  },
  linkInline: { color: '#7c3aed', textDecoration: 'underline' },

  // Launch
  launchBtn: {
    display: 'block', width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '17px', fontWeight: 700, textAlign: 'center' as const,
    textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
  },
  otpNote: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: '8px', padding: '12px', fontSize: '13px',
    color: '#166534', marginTop: '14px', textAlign: 'center' as const,
  },
  errorBox: { textAlign: 'center' as const, padding: '20px 0' },
  errorText: { fontSize: '15px', color: '#475569', margin: '0 0 8px 0' },
  ipText: { fontSize: '13px', color: '#94a3b8', margin: 0, fontFamily: 'monospace' },
  retryBtn: {
    display: 'block', width: '100%', padding: '14px',
    background: '#1e293b', color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
  },
}
