// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      2.6
// @description  EOIR portal auto-login (email + password + OTP). v2.4: /api/code endpoint.
// @match        https://doj-login-ext.okta-gov.com/*
// @match        https://portal.eoir.justice.gov/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      eoir-gateway.vercel.app
// @connect      *.ngrok-free.app
// @connect      ngrok-free.app
// @connect      *.ngrok-free.dev
// @connect      ngrok-free.dev
// @downloadURL  https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @updateURL    https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  // ============================================================
  // CONFIG - ngrok URL'i degisirse SADECE BURAYI guncelle
  // ============================================================
  var GATEWAY_URL = 'https://eoir-gateway.vercel.app'
  var NGROK_BASE = 'https://stimulant-degrading-boogieman.ngrok-free.dev/'   // <-- ngrok URL'i (sadece baz, /api/code endpoint'i otomatik eklenecek)
  var OTP_URL = NGROK_BASE + '/api/code'                         // yeni sade endpoint

  console.log('EOIR Auto-Login v2.4: Gateway =', GATEWAY_URL, ', OTP =', OTP_URL)

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

  function humanDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // ============================================================
  // OTP CODE FETCH - yeni /api/code endpoint
  // Cevap formati: {"code": "717641"} veya {"code": null, "error": "..."}
  // ============================================================
  function fetchOtpCode(attempt, maxAttempts, callback) {
    attempt = attempt || 1
    maxAttempts = maxAttempts || 3
    console.log('EOIR Auto-Login: OTP kodu aliniyor (deneme ' + attempt + '/' + maxAttempts + ')')

    GM_xmlhttpRequest({
      method: 'GET',
      url: OTP_URL,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      onload: function (res) {
        var code = ''
        try {
          var json = JSON.parse(res.responseText || '{}')
          code = (json.code || '').toString().trim()
        } catch (e) {
          console.log('EOIR Auto-Login: JSON parse hatasi, raw:', res.responseText)
          code = ''
        }

        if (code && /^\d{6}$/.test(code)) {
          console.log('EOIR Auto-Login: OTP kodu alindi (6 hane dogrulandi)')
          callback(null, code)
        } else if (attempt < maxAttempts) {
          console.log('EOIR Auto-Login: Bos/gecersiz OTP, 3sn sonra tekrar...')
          setTimeout(function () { fetchOtpCode(attempt + 1, maxAttempts, callback) }, 3000)
        } else {
          callback('OTP alinamadi - sunucu cevap vermedi veya kod gecersiz')
        }
      },
      onerror: function (e) {
        console.log('EOIR Auto-Login: OTP baglanti hatasi:', e)
        if (attempt < maxAttempts) {
          setTimeout(function () { fetchOtpCode(attempt + 1, maxAttempts, callback) }, 3000)
        } else {
          callback('OTP baglanti hatasi (ngrok offline olabilir)')
        }
      },
      ontimeout: function () {
        if (attempt < maxAttempts) {
          setTimeout(function () { fetchOtpCode(attempt + 1, maxAttempts, callback) }, 3000)
        } else {
          callback('OTP timeout')
        }
      },
      timeout: 15000,
    })
  }

  // ============================================================
  // CREDENTIALS FETCH (degismedi)
  // ============================================================
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
          callback('JSON parse hatasi')
        }
      },
      onerror: function (e) {
        callback('Baglanti hatasi')
      },
    })
  }

  // ============================================================
  // FORM HELPERS (degismedi)
  // ============================================================
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
    return false
  }

  // ============================================================
  // OTP HANDLING
  // ============================================================
  function handleOtp() {
    var otpSelectors = [
      'input[name="credentials.totp"]',
      'input[name="answer"]',
      'input[data-se="input-credentials.totp"]',
    ]

    waitFor(otpSelectors, 30000).then(function (otpInput) {
      console.log('EOIR Auto-Login: OTP alani bulundu -', otpInput.name || otpInput.id)
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
            console.log('EOIR Auto-Login: OTP gonderildi.')
          }, humanDelay(1000, 2500))
        }, humanDelay(1500, 3000))
      })
    }).catch(function () {
      console.log('EOIR Auto-Login: OTP alani bulunamadi (timeout)')
    })
  }

  // ============================================================
  // MAIN FLOW
  // ============================================================
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
      setTimeout(function () {
        fillInput(emailInput, email)
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
            setTimeout(function () {
              fillInput(passInput, password)
              setTimeout(function () {
                clickSubmit()
                handleOtp()
              }, humanDelay(1000, 2500))
            }, humanDelay(1500, 3000))
          }).catch(function () {
            console.log('EOIR Auto-Login: Sifre alani bulunamadi (timeout)')
          })
        }, humanDelay(1000, 2500))
      }, humanDelay(1500, 3000))
    }).catch(function () {
      console.log('EOIR Auto-Login: Email alani yok, OTP sayfasi mi kontrol ediliyor...')
      handleOtp()
    })
  })
})()
