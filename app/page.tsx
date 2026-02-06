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

            {/* Setup Guide */}
            <div style={styles.guideBox}>
              <p style={styles.guideMainTitle}>Kurulum Rehberi</p>
              <p style={styles.guideDesc}>
                Bu kurulumu <strong>sadece bir kez</strong> yapmanız yeterli.
                Sonrasında EOIR portalına her girişinizde email ve şifre otomatik doldurulur.
              </p>

              {/* Step 1 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>1</span>
                  <span style={styles.stepTitle}>Tampermonkey Eklentisini Yükleyin</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Aşağıdaki bağlantıya tıklayın. Açılan sayfada mavi <strong>&quot;Chrome&apos;a Ekle&quot;</strong> butonuna tıklayın.
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
                    Açılan pencerede <strong>&quot;Uzantıyı ekle&quot;</strong> (Add extension) butonuna tıklayın.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>2</span>
                  <span style={styles.stepTitle}>Tampermonkey İzinlerini Açın</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Chrome&apos;un sağ üst köşesindeki <strong>puzzle (yapboz) ikonuna</strong> tıklayın.
                  </p>
                  <p style={styles.stepText}>
                    <strong>Tampermonkey</strong> satırının yanındaki <strong>üç nokta (&middot;&middot;&middot;)</strong> menüsüne tıklayın.
                  </p>
                  <p style={styles.stepText}>
                    <strong>&quot;Uzantıyı yönet&quot;</strong> (Manage extension) seçeneğini tıklayın.
                  </p>
                  <p style={styles.stepText}>
                    Açılan sayfada şu ayarları <strong>açık</strong> (mavi) yapın:
                  </p>
                  <div style={styles.settingsList}>
                    <div style={styles.settingItem}>
                      <span style={styles.toggleOn}>●</span>
                      <span>Dosya URL&apos;lerine erişime izin ver</span>
                    </div>
                    <div style={styles.settingItem}>
                      <span style={styles.toggleOn}>●</span>
                      <span>Tüm sitelerde (All sites)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={styles.stepBadge}>3</span>
                  <span style={styles.stepTitle}>Otomatik Giriş Script&apos;ini Yükleyin</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Aşağıdaki butona tıklayın. Tampermonkey otomatik olarak bir kurulum penceresi açacak.
                  </p>
                  <a href={scriptInstallUrl} style={styles.installBtn}>
                    Otomatik Giriş Script&apos;ini Yükle
                  </a>
                  <p style={styles.stepText}>
                    Açılan pencerede <strong>&quot;Install&quot;</strong> (Yükle) butonuna tıklayın.
                  </p>
                  <p style={styles.stepNote}>
                    Eğer kurulum penceresi açılmazsa: Tampermonkey Dashboard&apos;unu açın &rarr; &quot;+&quot; ikonuna tıklayın &rarr;
                    Script alanına{' '}
                    <a href={scriptInstallUrl} target="_blank" rel="noopener noreferrer" style={styles.linkInline}>
                      bu linkteki
                    </a>
                    {' '}kodun tamamını yapıştırıp kaydedin.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div style={styles.stepBox}>
                <div style={styles.stepHeader}>
                  <span style={{ ...styles.stepBadge, background: '#22c55e' }}>✓</span>
                  <span style={styles.stepTitle}>Hazır!</span>
                </div>
                <div style={styles.stepBody}>
                  <p style={styles.stepText}>
                    Artık aşağıdaki butona tıkladığınızda email ve şifre <strong>otomatik doldurulacak</strong>.
                    Sadece <strong>OTP kodunuzu</strong> girmeniz yeterli.
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
              EOIR Portalına Git &rarr;
            </a>

            <p style={styles.otpNote}>
              💡 Email ve şifre otomatik dolar. Sadece telefonunuza gelen OTP kodunu girin.
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
