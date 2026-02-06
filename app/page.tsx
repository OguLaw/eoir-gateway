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
      setResult({ allowed: false, ip: 'error', message: 'Bağlantı hatası. Tekrar deneyin.' })
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
          <p style={styles.subtitle}>Güvenli Erişim Portalı</p>
        </div>

        {loading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>IP kontrol ediliyor...</p>
          </div>
        ) : result?.allowed ? (
          <div style={styles.content}>
            <div style={{ ...styles.status, ...styles.statusOk }}>
              <span style={styles.statusDot}>●</span>
              VPN Aktif — IP: {result.ip}
            </div>

            {/* How it works */}
            <div style={styles.infoBox}>
              <p style={styles.infoTitle}>Otomatik Giriş</p>
              <p style={styles.infoText}>
                Aşağıdaki kurulumu yaptıktan sonra EOIR portalına gittiğinizde
                email ve şifre <strong>otomatik doldurulur</strong>. Sadece OTP kodunu girmeniz yeterli.
              </p>
            </div>

            {/* Setup steps */}
            <div style={styles.setupBox}>
              <p style={styles.setupTitle}>Kurulum (tek seferlik)</p>
              <div style={styles.setupSteps}>
                <p style={styles.setupStep}>
                  <strong>1.</strong> Chrome'a{' '}
                  <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo" target="_blank" rel="noopener noreferrer" style={styles.link}>
                    Tampermonkey
                  </a>
                  {' '}eklentisini yükleyin
                </p>
                <p style={styles.setupStep}>
                  <strong>2.</strong> Aşağıdaki butona tıklayın — script otomatik yüklenir
                </p>
              </div>
              <a href={scriptInstallUrl} style={styles.installBtn}>
                Otomatik Giriş Script'ini Yükle
              </a>
              <p style={styles.setupHint}>
                Gateway URL otomatik algılanır, ekstra ayar gerekmez.
              </p>
            </div>

            {/* Launch */}
            <a
              href={result.eoir_url || 'https://portal.eoir.justice.gov/'}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.launchBtn}
            >
              EOIR Portalına Git →
            </a>

            <p style={styles.otpNote}>
              💡 Email + şifre otomatik dolar. Sadece OTP kodunu girin.
            </p>
          </div>
        ) : (
          <div style={styles.content}>
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
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '20px',
  },
  card: {
    background: '#ffffff', borderRadius: '16px',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    width: '100%', maxWidth: '440px', overflow: 'hidden',
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
  infoBox: {
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: '10px', padding: '14px', marginBottom: '14px',
  },
  infoTitle: { fontSize: '14px', fontWeight: 600, color: '#1e40af', margin: '0 0 6px 0' },
  infoText: { fontSize: '13px', color: '#1e3a5f', margin: 0, lineHeight: 1.5 },
  setupBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '10px', padding: '14px', marginBottom: '16px',
  },
  setupTitle: { fontSize: '13px', fontWeight: 600, color: '#475569', margin: '0 0 10px 0' },
  setupSteps: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '12px' },
  setupStep: { fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 },
  link: { color: '#2563eb', textDecoration: 'underline' },
  installBtn: {
    display: 'block', width: '100%', padding: '12px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '14px', fontWeight: 600, textAlign: 'center' as const,
    textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
  },
  setupHint: { fontSize: '11px', color: '#94a3b8', margin: '8px 0 0 0', textAlign: 'center' as const },
  launchBtn: {
    display: 'block', width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '17px', fontWeight: 700, textAlign: 'center' as const,
    textDecoration: 'none', cursor: 'pointer', boxSizing: 'border-box' as const,
  },
  otpNote: {
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: '8px', padding: '12px', fontSize: '13px',
    color: '#92400e', marginTop: '14px', textAlign: 'center' as const,
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
