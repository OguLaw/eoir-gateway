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
  const [copied, setCopied] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const checkIp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/check-ip', { cache: 'no-store' })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ allowed: false, ip: 'error', message: 'Bağlantı hatası. Tekrar deneyin.' })
    }
    setLoading(false)
  }

  useEffect(() => { checkIp() }, [])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>⚖️</div>
          <h1 style={styles.title}>EOIR Gateway</h1>
          <p style={styles.subtitle}>Güvenli Erişim Portalı</p>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>IP kontrol ediliyor...</p>
          </div>
        ) : result?.allowed ? (
          <div style={styles.content}>
            {/* Status */}
            <div style={{ ...styles.status, ...styles.statusOk }}>
              <span style={styles.statusDot}>●</span>
              VPN Aktif — IP: {result.ip}
            </div>

            {/* Credentials */}
            <div style={styles.credentialBox}>
              <label style={styles.label}>Email</label>
              <div style={styles.fieldRow}>
                <span style={styles.fieldValue}>{result.credentials?.email}</span>
                <button
                  style={styles.copyBtn}
                  onClick={() => copyToClipboard(result.credentials?.email || '', 'email')}
                >
                  {copied === 'email' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div style={styles.credentialBox}>
              <label style={styles.label}>Şifre</label>
              <div style={styles.fieldRow}>
                <span style={styles.fieldValue}>
                  {showPassword ? result.credentials?.password : '••••••••••••'}
                </span>
                <button
                  style={styles.copyBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                <button
                  style={styles.copyBtn}
                  onClick={() => copyToClipboard(result.credentials?.password || '', 'password')}
                >
                  {copied === 'password' ? '✓' : '📋'}
                </button>
              </div>
            </div>

            <div style={styles.otpNote}>
              💡 OTP kodunu her zamanki gibi alın ve giriş ekranında girin.
            </div>

            {/* Launch Button */}
            <a
              href={result.eoir_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.launchBtn}
            >
              EOIR Portalına Git →
            </a>
          </div>
        ) : (
          <div style={styles.content}>
            {/* Status */}
            <div style={{ ...styles.status, ...styles.statusError }}>
              <span style={styles.statusDot}>●</span>
              VPN Bağlantısı Bulunamadı
            </div>

            <div style={styles.errorBox}>
              <p style={styles.errorText}>{result?.message}</p>
              <p style={styles.ipText}>Algılanan IP: {result?.ip}</p>
            </div>

            <button style={styles.retryBtn} onClick={checkIp}>
              Tekrar Kontrol Et
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    padding: '32px 24px',
    textAlign: 'center' as const,
    color: '#fff',
  },
  icon: {
    fontSize: '40px',
    marginBottom: '8px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.8,
  },
  loading: {
    padding: '48px 24px',
    textAlign: 'center' as const,
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 12px',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0,
  },
  content: {
    padding: '24px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '20px',
  },
  statusOk: {
    background: '#f0fdf4',
    color: '#166534',
  },
  statusError: {
    background: '#fef2f2',
    color: '#991b1b',
  },
  statusDot: {
    fontSize: '10px',
  },
  credentialBox: {
    marginBottom: '14px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 12px',
    gap: '8px',
  },
  fieldValue: {
    flex: 1,
    fontSize: '15px',
    color: '#1e293b',
    fontFamily: 'monospace',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    borderRadius: '4px',
    lineHeight: 1,
  },
  otpNote: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '13px',
    color: '#92400e',
    marginBottom: '20px',
    marginTop: '6px',
  },
  launchBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    textAlign: 'center' as const,
    textDecoration: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  errorBox: {
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  errorText: {
    fontSize: '15px',
    color: '#475569',
    margin: '0 0 8px 0',
  },
  ipText: {
    fontSize: '13px',
    color: '#94a3b8',
    margin: 0,
    fontFamily: 'monospace',
  },
  retryBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    background: '#1e293b',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
