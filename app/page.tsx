'use client'

import { useState, useEffect, useMemo } from 'react'

interface CheckResult {
  allowed: boolean
  ip: string
  credentials?: { email: string; password: string }
  eoir_url?: string
  message?: string
}

type LaunchStep = null | 'email_copied' | 'password_copied'

export default function Home() {
  const [result, setResult] = useState<CheckResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [launchStep, setLaunchStep] = useState<LaunchStep>(null)

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

  // Smart launch: copy email, open portal, show step guide
  const handleSmartLaunch = () => {
    const email = result?.credentials?.email || ''
    navigator.clipboard.writeText(email)
    setLaunchStep('email_copied')
    window.open(result?.eoir_url || 'https://portal.eoir.justice.gov/', '_blank')
  }

  const handleCopyPassword = () => {
    const password = result?.credentials?.password || ''
    navigator.clipboard.writeText(password)
    setLaunchStep('password_copied')
  }

  // Generate bookmarklet JavaScript
  const bookmarkletHref = useMemo(() => {
    if (!result?.credentials) return ''
    const email = result.credentials.email.replace(/'/g, "\\'")
    const password = result.credentials.password.replace(/'/g, "\\'")
    const code = `javascript:void(function(){var e='${email}',p='${password}';function f(s){return document.querySelector('input[type=\"'+s+'\"]')}function q(s){return document.querySelector(s)}var ef=f('email')||q('input[name*=\"email\"]')||q('input[name*=\"user\"]')||q('input[name*=\"Email\"]')||q('input[name*=\"User\"]')||q('input[id*=\"email\"]')||q('input[id*=\"user\"]')||q('input[id*=\"loginfmt\"]');var pf=f('password');function fill(el,v){if(!el)return;var ns=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');if(ns&&ns.set){ns.set.call(el,v)}else{el.value=v}el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('blur',{bubbles:true}))}if(ef||pf){fill(ef,e);fill(pf,p);alert('Bilgiler dolduruldu!')}else{alert('Giris formu bulunamadi. Sayfanin yuklenmesini bekleyin.')}}())`
    return code
  }, [result?.credentials])

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

            {/* Bookmarklet Section */}
            <div style={styles.bookmarkletSection}>
              <label style={styles.label}>Otomatik Doldurma (Bookmarklet)</label>
              <p style={styles.bookmarkletDesc}>
                Aşağıdaki butonu bookmark çubuğunuza sürükleyin. EOIR giriş sayfasında tıklayınca email ve şifre otomatik dolar.
              </p>
              <div style={styles.bookmarkletRow}>
                <a
                  href={bookmarkletHref}
                  onClick={(e) => e.preventDefault()}
                  style={styles.bookmarkletLink}
                  title="Bu linki bookmark çubuğunuza sürükleyin"
                >
                  ⚡ EOIR Auto-Fill
                </a>
                <span style={styles.bookmarkletHint}>← Sürükle & Bırak</span>
              </div>
            </div>

            {/* Smart Launch Section */}
            {!launchStep ? (
              <button style={styles.launchBtn} onClick={handleSmartLaunch}>
                EOIR Portalına Git (Email Kopyala + Aç) →
              </button>
            ) : (
              <div style={styles.stepGuide}>
                {/* Step 1: Email */}
                <div style={{
                  ...styles.stepItem,
                  ...(launchStep === 'email_copied' ? styles.stepActive : styles.stepDone),
                }}>
                  <span style={styles.stepNumber}>
                    {launchStep === 'email_copied' ? '1' : '✓'}
                  </span>
                  <span style={styles.stepText}>
                    Email kopyalandı — EOIR sayfasında yapıştırın
                  </span>
                </div>

                {/* Step 2: Password */}
                <div style={{
                  ...styles.stepItem,
                  ...(launchStep === 'password_copied' ? styles.stepDone : styles.stepPending),
                }}>
                  <span style={styles.stepNumber}>
                    {launchStep === 'password_copied' ? '✓' : '2'}
                  </span>
                  {launchStep === 'password_copied' ? (
                    <span style={styles.stepText}>
                      Şifre kopyalandı — EOIR sayfasında yapıştırın
                    </span>
                  ) : (
                    <button style={styles.stepCopyBtn} onClick={handleCopyPassword}>
                      Şifreyi Kopyala
                    </button>
                  )}
                </div>

                {/* Step 3: OTP reminder */}
                <div style={{ ...styles.stepItem, ...styles.stepPending }}>
                  <span style={styles.stepNumber}>3</span>
                  <span style={styles.stepText}>OTP kodunu girin</span>
                </div>

                <button
                  style={styles.resetBtn}
                  onClick={() => setLaunchStep(null)}
                >
                  Başa Dön
                </button>
              </div>
            )}
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
  // Bookmarklet styles
  bookmarkletSection: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '10px',
    padding: '14px',
    marginBottom: '16px',
  },
  bookmarkletDesc: {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  bookmarkletRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  bookmarkletLink: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'grab',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  },
  bookmarkletHint: {
    fontSize: '12px',
    color: '#7c3aed',
    fontWeight: 500,
  },
  // Launch button
  launchBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    textAlign: 'center' as const,
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  // Step guide styles
  stepGuide: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  stepActive: {
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    color: '#1e40af',
  },
  stepDone: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    color: '#166534',
  },
  stepPending: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#64748b',
  },
  stepNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'currentColor',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontWeight: 500,
  },
  stepCopyBtn: {
    flex: 1,
    padding: '8px 12px',
    background: '#1e40af',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  resetBtn: {
    padding: '10px',
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    marginTop: '4px',
  },
  // Error styles
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
