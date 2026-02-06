(async function () {
  // 1. Get credentials from background service worker → our API
  let credentials
  try {
    const result = await chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' })
    if (!result || result.error) {
      console.log('EOIR Auto-Login:', result?.error || 'Bilinmeyen hata')
      return
    }
    if (!result.allowed) {
      console.log('EOIR Auto-Login: VPN aktif değil, otomatik giriş yapılamıyor.')
      return
    }
    credentials = result.credentials
  } catch (e) {
    console.log('EOIR Auto-Login: Credentials alınamadı', e)
    return
  }

  const { email, password } = credentials

  // Helper: set input value (works with React/Okta's framework)
  function fillInput(el, value) {
    el.focus()
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set
    if (setter) {
      setter.call(el, value)
    } else {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  // Helper: wait for an element to appear in DOM
  function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector)
      if (el) return resolve(el)

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector)
        if (el) {
          observer.disconnect()
          resolve(el)
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      setTimeout(() => {
        observer.disconnect()
        reject(new Error('Element bulunamadı: ' + selector))
      }, timeout)
    })
  }

  function findSubmitButton() {
    return (
      document.querySelector('input[type="submit"]') ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('[data-type="save"]')
    )
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms))

  // Step 1: Fill email
  try {
    const emailInput = await waitFor(
      'input[name="identifier"], input[type="email"], input[name="username"]'
    )
    await delay(400)
    fillInput(emailInput, email)

    await delay(300)
    const nextBtn = findSubmitButton()
    if (nextBtn) nextBtn.click()
  } catch (e) {
    console.log('EOIR Auto-Login: Email alanı bulunamadı', e)
    return
  }

  // Step 2: Fill password (Okta loads password step after verifying email)
  try {
    const passInput = await waitFor('input[type="password"]')
    await delay(400)
    fillInput(passInput, password)

    await delay(300)
    const verifyBtn = findSubmitButton()
    if (verifyBtn) verifyBtn.click()
  } catch (e) {
    console.log('EOIR Auto-Login: Şifre alanı bulunamadı', e)
  }

  // Step 3: OTP is left to the user
})()
