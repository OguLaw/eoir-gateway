// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      1.1
// @description  EOIR portalına otomatik giriş (email + şifre)
// @match        https://doj-login-ext.okta-gov.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      *.vercel.app
// @connect      localhost
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  // Auto-detect gateway URL from where this script was downloaded
  var scriptUrl = (GM_info.script.downloadURL || GM_info.script.updateURL || '').trim()
  var GATEWAY_URL = ''
  if (scriptUrl) {
    try { GATEWAY_URL = new URL(scriptUrl).origin } catch (e) { /* ignore */ }
  }
  if (!GATEWAY_URL) {
    console.log('EOIR Auto-Login: Gateway URL algılanamadı.')
    return
  }

  console.log('EOIR Auto-Login: Gateway =', GATEWAY_URL)

  // Fetch credentials from gateway API
  function fetchCredentials(callback) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: GATEWAY_URL + '/api/check-ip',
      onload: function (res) {
        try {
          var data = JSON.parse(res.responseText)
          callback(null, data)
        } catch (e) {
          callback('JSON parse hatası')
        }
      },
      onerror: function () { callback('Bağlantı hatası') },
    })
  }

  // Fill input — works with React, Angular, Okta widget
  function fillInput(el, value) {
    el.focus()
    // Native setter to bypass framework wrappers
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

  // Wait for any matching element to appear
  function waitFor(selectors, timeout) {
    timeout = timeout || 20000
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

  // Find submit/next button
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
      if (btn) { btn.click(); return true }
    }
    return false
  }

  // Main flow
  fetchCredentials(function (err, result) {
    if (err) {
      console.log('EOIR Auto-Login: Hata -', err)
      return
    }
    if (!result || !result.allowed || !result.credentials) {
      console.log('EOIR Auto-Login: VPN aktif değil veya credentials yok.')
      return
    }

    var email = result.credentials.email
    var password = result.credentials.password

    console.log('EOIR Auto-Login: Credentials alındı, form bekleniyor...')

    // Step 1: Email
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
      console.log('EOIR Auto-Login: Email alanı bulundu:', emailInput.name || emailInput.id)
      setTimeout(function () {
        fillInput(emailInput, email)
        setTimeout(function () {
          console.log('EOIR Auto-Login: Next tıklanıyor...')
          clickSubmit()

          // Step 2: Password — wait for it to appear after email submission
          var passSelectors = [
            'input[type="password"]',
            'input[name="credentials.passcode"]',
            'input[name="passcode"]',
            'input[id*="password"]',
            'input[id*="okta-signin-password"]',
            'input[autocomplete="current-password"]',
          ]

          waitFor(passSelectors, 30000).then(function (passInput) {
            console.log('EOIR Auto-Login: Şifre alanı bulundu:', passInput.name || passInput.id)
            setTimeout(function () {
              fillInput(passInput, password)
              setTimeout(function () {
                console.log('EOIR Auto-Login: Verify tıklanıyor...')
                clickSubmit()
                console.log('EOIR Auto-Login: Tamamlandı — OTP bekleniyor.')
              }, 500)
            }, 600)
          }).catch(function () {
            console.log('EOIR Auto-Login: Şifre alanı bulunamadı.')
          })
        }, 500)
      }, 600)
    }).catch(function () {
      console.log('EOIR Auto-Login: Email alanı bulunamadı.')
    })
  })
})()
