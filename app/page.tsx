'use client'

import { useState, useEffect } from 'react'

interface CheckResult {
  allowed: boolean
  ip: string
  credentials?: { email: string; password: string }
  eoir_url?: string
  message?: string
}

type Step = 'ready' | 'email_copied' | 'password_copied' | 'done'

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('ready')

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

  const handleStart = () => {
    navigator.clipboard.writeText(result?.credentials?.email || '')
    setStep('email_copied')
    window.open(result?.eoir_url || 'https://portal.eoir.justice.gov/', '_blank')
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(result?.credentials?.password || '')
    setStep('password_copied')
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

            {step === 'ready' ? (
              <>
                <p style={styles.readyDesc}>
                  Butona tıklayınca email otomatik kopyalanır ve EOIR giriş sayfası açılır.
                </p>
                <button style={styles.launchBtn} onClick={handleStart}>
                  Giriş Yap →
                </button>
              </>
            ) : (
              <div style={styles.steps}>
                {/* Step 1 */}
                <div style={{
                  ...styles.stepBox,
                  ...(step === 'email_copied' ? styles.stepActive : styles.stepDone),
                }}>
                  <div style={styles.stepHeader}>
                    <span style={{
                      ...styles.stepBadge,
                      background: step === 'email_copied' ? '#3b82f6' : '#22c55e',
                    }}>
                      {step === 'email_copied' ? '1' : '✓'}
                    </span>
                    <span style={styles.stepTitle}>
                      {step === 'email_copied' ? 'Email Kopyalandı' : 'Email Yapıştırıldı'}
                    </span>
                  </div>
                  {step === 'email_copied' && (
                    <div style={styles.stepInstructions}>
                      <p style={styles.instructionText}>Okta sayfasında:</p>
                      <p style={styles.instructionItem}>1. Email alanına yapıştırın (Ctrl+V)</p>
                      <p style={styles.instructionItem}>2. <strong>Next</strong> butonuna tıklayın</p>
                      <p style={styles.instructionItem}>3. Şifre sayfası açılınca buraya geri dönün ↓</p>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div style={{
                  ...styles.stepBox,
                  ...(step === 'password_copied' ? styles.stepDone
                    : step === 'email_copied' ? styles.stepWaiting
                    : styles.stepDone),
                }}>
                  <div style={styles.stepHeader}>
                    <span style={{
                      ...styles.stepBadge,
                      background: step === 'password_copied' || step === 'done' ? '#22c55e' : '#94a3b8',
                    }}>
                      {step === 'password_copied' || step === 'done' ? '✓' : '2'}
                    </span>
                    <span style={styles.stepTitle}>
                      {step === 'password_copied' || step === 'done' ? 'Şifre Kopyalandı' : 'Şifreyi Kopyala'}
                    </span>
                  </div>
                  {step === 'email_copied' && (
                    <button style={styles.copyPasswordBtn} onClick={handleCopyPassword}>
                      Şifreyi Kopyala
                    </button>
                  )}
                  {step === 'password_copied' && (
                    <div style={styles.stepInstructions}>
                      <p style={styles.instructionText}>Okta sayfasında:</p>
                      <p style={styles.instructionItem}>1. Şifre alanına yapıştırın (Ctrl+V)</p>
                      <p style={styles.instructionItem}>2. <strong>Verify</strong> butonuna tıklayın</p>
                    </div>
                  )}
                </div>

                {/* Step 3 */}
                <div style={{
                  ...styles.stepBox,
                  ...(step === 'password_copied' ? styles.stepWaiting : styles.stepWaiting),
                }}>
                  <div style={styles.stepHeader}>
                    <span style={{ ...styles.stepBadge, background: '#94a3b8' }}>3</span>
                    <span style={styles.stepTitle}>OTP Kodunu Girin</span>
                  </div>
                  {step === 'password_copied' && (
                    <p style={{ ...styles.instructionText, margin: '8px 0 0 36px' }}>
                      Telefonunuza gelen OTP kodunu girin.
                    </p>
                  )}
                </div>

                <button style={styles.resetBtn} onClick={() => setStep('ready')}>
                  Baştan Başla
                </button>
              </div>
            )}
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
  readyDesc: {
    fontSize: '14px', color: '#475569', lineHeight: 1.5,
    margin: '0 0 16px 0', textAlign: 'center' as const,
  },
  launchBtn: {
    display: 'block', width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '17px', fontWeight: 700,
    textAlign: 'center' as const, cursor: 'pointer',
  },
  steps: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  stepBox: {
    borderRadius: '10px', padding: '14px',
    transition: 'all 0.2s',
  },
  stepActive: { background: '#eff6ff', border: '2px solid #3b82f6' },
  stepDone: { background: '#f0fdf4', border: '2px solid #86efac' },
  stepWaiting: { background: '#f8fafc', border: '2px solid #e2e8f0' },
  stepHeader: { display: 'flex', alignItems: 'center', gap: '12px' },
  stepBadge: {
    width: '24px', height: '24px', borderRadius: '50%',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '12px', fontWeight: 700,
    flexShrink: 0,
  },
  stepTitle: { fontSize: '15px', fontWeight: 600, color: '#1e293b' },
  stepInstructions: { margin: '10px 0 0 36px' },
  instructionText: { fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' },
  instructionItem: { fontSize: '13px', color: '#475569', margin: '2px 0', lineHeight: 1.4 },
  copyPasswordBtn: {
    margin: '10px 0 0 36px', padding: '12px 20px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
    width: 'calc(100% - 36px)',
  },
  resetBtn: {
    padding: '10px', background: 'none',
    border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '13px', color: '#64748b', cursor: 'pointer',
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
