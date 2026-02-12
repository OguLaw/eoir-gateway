// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      2.4
// @description  EOIR portal auto-login (email + password + OTP)
// @match        https://doj-login-ext.okta-gov.com/*
// @match        https://portal.eoir.justice.gov/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      eoir-gateway.vercel.app
// @connect      0db2-20-161-86-93.ngrok-free.app
// @downloadURL  https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @updateURL    https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  var GATEWAY_URL = 'https://eoir-gateway.vercel.app'
  var OTP_WEBHOOK_URL = 'https://0db2-20-161-86-93.ngrok-free.app/slack/code'

  console.log('EOIR Auto-Login: Baslatiliyor, Gateway =', GATEWAY_URL)

  // --- EOIR portal: clear cookies only ---
  if (window.location.hostname !== 'doj-login-ext.okta-gov.com') {
    var cookies = document.cookie.split(';')
    for (var i = 0; i < cookies.length; i++) {
      var c = cookies[i].trim()
      var name = c.split('=')[0]
      if (name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';'
      }
    }
    console.log('EOIR Auto-Login: EOIR portal cookies temizlendi')
    return
  }

  // Random delay between min-max ms to look human
  function humanDelay(min, max) {
    var ms = Math.floor(Math.random() * (max - min + 1)) + min
    return ms
  }

  // --- Everything below is the ORIGINAL v1.3 flow + OTP addition ---

  function fetchCredentials(callback) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: GATEWAY_URL + '/api/check-ip',
      onload: function (res) {
        try {
          var data = JSON.parse(res.responseText)
          console.log('EOIR Auto-Login: API yaniti -', data.allowed ? 'VPN aktif' : 'VPN aktif degil')
          callback(null, data)
        } catch (e) {
          console.log('EOIR Auto-Login: JSON parse hatasi')
          callback('JSON parse hatasi')
        }
      },
      onerror: function (e) {
        console.log('EOIR Auto-Login: Baglanti hatasi', e)
        callback('Baglanti hatasi')
      },
    })
  }

  function fillInput(el, value) {
    el.focus()
    var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
    if (descriptor && descriptor.set) {
      descriptor.set.call(el, value)
    } else {
      el.value = value
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
  }

  function waitFor(selectors, timeout) {
    timeout = timeout || 30000
    return new Promise(function (resolve, reject) {
      function check() {
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i])
          if (el) return el
        }
        return null
      }
      var found = check()
      if (found) return resolve(found)

      var observer = new MutationObserver(function () {
        var el = check()
        if (el) { observer.disconnect(); resolve(el) }
      })
      observer.observe(document.documentElement, { childList: true, subtree: true })
      setTimeout(function () { observer.disconnect(); reject('Timeout') }, timeout)
    })
  }

  function clickSubmit() {
    var selectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      '[data-type="save"]',
      'a[data-type="save"]',
      '.button-primary',
      '.o-form-button-bar input',
    ]
    for (var i = 0; i < selectors.length; i++) {
      var btn = document.querySelector(selectors[i])
      if (btn) {
        console.log('EOIR Auto-Login: Buton tiklandi -', selectors[i])
        btn.click()
        return true
      }
    }
    console.log('EOIR Auto-Login: Submit butonu bulunamadi')
    return false
  }

  function fetchOtpCode(attempt, maxAttempts, callback) {
    attempt = attempt || 1
    maxAttempts = maxAttempts || 3
    console.log('EOIR Auto-Login: OTP kodu aliniyor (deneme ' + attempt + '/' + maxAttempts + ')')
    GM_xmlhttpRequest({
      method: 'POST',
      url: OTP_WEBHOOK_URL,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: 'token=7pWl0xuV0oE7y952te4xS8pr&command=%2Fcode&text=',
      onload: function (res) {
        var raw = (res.responseText || '').trim()
        var code = ''
        try {
          var json = JSON.parse(raw)
          code = (json.text || '').trim()
        } catch (e) {
          code = raw
        }
        if (code && /^\d+$/.test(code)) {
          console.log('EOIR Auto-Login: OTP kodu alindi')
          callback(null, code)
        } else if (attempt < maxAttempts) {
          console.log('EOIR Auto-Login: Bos OTP yaniti, 3sn sonra tekrar...')
          setTimeout(function () { fetchOtpCode(attempt + 1, maxAttempts, callback) }, 3000)
        } else {
          callback('OTP alinamadi')
        }
      },
      onerror: function (e) {
        if (attempt < maxAttempts) {
          console.log('EOIR Auto-Login: OTP hata, 3sn sonra tekrar...', e)
          setTimeout(function () { fetchOtpCode(attempt + 1, maxAttempts, callback) }, 3000)
        } else {
          callback('OTP baglanti hatasi')
        }
      },
    })
  }

  // --- OTP handling (works for both SPA transition and full page reload) ---

  // Check if authenticator selection menu is present and click "Enter a code" (Okta Verify TOTP)
  function handleAuthenticatorSelection() {
    var mfaSelectors = [
      'div[data-se="okta_verify-totp"] a.select-factor',
      'div[data-se="okta_verify-totp"] a[data-se="button"]',
      'a[aria-label*="enter a code"]',
    ]
    return new Promise(function (resolve) {
      // Check both OTP input and authenticator menu simultaneously
      var otpSelectors = [
        'input[name="credentials.totp"]',
        'input[name="answer"]',
        'input[data-se="input-credentials.totp"]',
      ]

      var checkBoth = function () {
        // First check if OTP input is already there (no selection needed)
        for (var i = 0; i < otpSelectors.length; i++) {
          var otpEl = document.querySelector(otpSelectors[i])
          if (otpEl) return { type: 'otp', element: otpEl }
        }
        // Then check if authenticator selection menu is present
        for (var j = 0; j < mfaSelectors.length; j++) {
          var mfaEl = document.querySelector(mfaSelectors[j])
          if (mfaEl) return { type: 'mfa', element: mfaEl }
        }
        return null
      }

      var found = checkBoth()
      if (found) return resolve(found)

      var observer = new MutationObserver(function () {
        var result = checkBoth()
        if (result) { observer.disconnect(); resolve(result) }
      })
      observer.observe(document.documentElement, { childList: true, subtree: true })
      setTimeout(function () { observer.disconnect(); resolve(null) }, 30000)
    })
  }

  function fillAndSubmitOtp(otpInput) {
    fetchOtpCode(1, 3, function (err, code) {
      if (err) {
        console.log('EOIR Auto-Login: OTP hatasi -', err)
        return
      }
      setTimeout(function () {
        fillInput(otpInput, code)
        console.log('EOIR Auto-Login: OTP dolduruldu')
        setTimeout(function () {
          clickSubmit()
          console.log('EOIR Auto-Login: OTP gonderildi. Giris tamamlandi.')
        }, humanDelay(1000, 2500))
      }, humanDelay(1500, 3000))
    })
  }

  function handleOtp() {
    handleAuthenticatorSelection().then(function (result) {
      if (!result) {
        console.log('EOIR Auto-Login: OTP alani veya MFA secim menusu bulunamadi (timeout)')
        return
      }

      if (result.type === 'otp') {
        // OTP input is already visible, fill it directly
        console.log('EOIR Auto-Login: OTP alani bulundu -', result.element.name || result.element.id)
        fillAndSubmitOtp(result.element)
      } else if (result.type === 'mfa') {
        // Authenticator selection menu found, click "Enter a code"
        console.log('EOIR Auto-Login: MFA secim menusu bulundu, "Enter a code" seciliyor...')
        setTimeout(function () {
          result.element.click()
          console.log('EOIR Auto-Login: "Enter a code" secildi, OTP alani bekleniyor...')

          // Now wait for the OTP input field to appear
          var otpSelectors = [
            'input[name="credentials.totp"]',
            'input[name="answer"]',
            'input[data-se="input-credentials.totp"]',
          ]
          waitFor(otpSelectors, 30000).then(function (otpInput) {
            console.log('EOIR Auto-Login: OTP alani bulundu -', otpInput.name || otpInput.id)
            fillAndSubmitOtp(otpInput)
          }).catch(function () {
            console.log('EOIR Auto-Login: OTP alani bulunamadi (MFA secimi sonrasi timeout)')
          })
        }, humanDelay(1000, 2500))
      }
    })
  }

  // --- ORIGINAL v1.3 main flow (untouched) ---

  fetchCredentials(function (err, result) {
    if (err) {
      console.log('EOIR Auto-Login: Hata -', err)
      return
    }
    if (!result || !result.allowed || !result.credentials) {
      console.log('EOIR Auto-Login: VPN aktif degil veya credentials yok.')
      return
    }

    var email = result.credentials.email
    var password = result.credentials.password
    console.log('EOIR Auto-Login: Credentials alindi, form bekleniyor...')

    var emailSelectors = [
      'input[name="identifier"]',
      'input[name="username"]',
      'input[type="email"]',
      'input[id*="identifier"]',
      'input[id*="username"]',
      'input[id*="okta-signin-username"]',
      'input[autocomplete="username"]',
    ]

    waitFor(emailSelectors, 30000).then(function (emailInput) {
      console.log('EOIR Auto-Login: Email alani bulundu -', emailInput.name || emailInput.id || emailInput.type)
      setTimeout(function () {
        fillInput(emailInput, email)
        console.log('EOIR Auto-Login: Email dolduruldu')
        setTimeout(function () {
          clickSubmit()

          var passSelectors = [
            'input[type="password"]',
            'input[name="credentials.passcode"]',
            'input[name="passcode"]',
            'input[id*="password"]',
            'input[id*="okta-signin-password"]',
            'input[autocomplete="current-password"]',
          ]

          waitFor(passSelectors, 30000).then(function (passInput) {
            console.log('EOIR Auto-Login: Sifre alani bulundu -', passInput.name || passInput.id || passInput.type)
            setTimeout(function () {
              fillInput(passInput, password)
              console.log('EOIR Auto-Login: Sifre dolduruldu')
              setTimeout(function () {
                clickSubmit()
                console.log('EOIR Auto-Login: Sifre gonderildi, OTP bekleniyor...')
                handleOtp()
              }, humanDelay(1000, 2500))
            }, humanDelay(1500, 3000))
          }).catch(function () {
            console.log('EOIR Auto-Login: Sifre alani bulunamadi (timeout)')
          })
        }, humanDelay(1000, 2500))
      }, humanDelay(1500, 3000))
    }).catch(function () {
      // No email field — maybe we're already on OTP page (full reload after password)
      console.log('EOIR Auto-Login: Email alani bulunamadi, OTP sayfasi mi kontrol ediliyor...')
      handleOtp()
    })
  })
})()
