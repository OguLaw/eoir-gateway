// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      2.1
// @description  EOIR portal auto-login (email + password + OTP)
// @match        https://doj-login-ext.okta-gov.com/*
// @match        https://portal.eoir.justice.gov/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      eoir-gateway.vercel.app
// @connect      7da5b9f7a119.ngrok-free.app
// @downloadURL  https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @updateURL    https://eoir-gateway.vercel.app/eoir-autofill.user.js
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  var GATEWAY_URL = 'https://eoir-gateway.vercel.app'
  var OTP_WEBHOOK_URL = 'https://7da5b9f7a119.ngrok-free.app/slack/code'

  console.log('EOIR Auto-Login v2.1: Starting, Gateway =', GATEWAY_URL)

  // --- Clear cookies for the current domain ---
  function clearCookies() {
    var cookies = document.cookie.split(';')
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim()
      var name = cookie.split('=')[0]
      if (name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';'
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname + ';'
      }
    }
    console.log('EOIR Auto-Login: Cookies cleared for', window.location.hostname)
  }

  clearCookies()

  // Only run login automation on Okta domain
  if (window.location.hostname !== 'doj-login-ext.okta-gov.com') {
    console.log('EOIR Auto-Login: Not on Okta domain, skipping login automation')
    return
  }

  // --- Utility functions ---

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
        console.log('EOIR Auto-Login: Button clicked -', selectors[i])
        btn.click()
        return true
      }
    }
    console.log('EOIR Auto-Login: Submit button not found')
    return false
  }

  function findElement(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i])
      if (el) return el
    }
    return null
  }

  function fetchOtpCode(attempt, maxAttempts, callback) {
    attempt = attempt || 1
    maxAttempts = maxAttempts || 3
    console.log('EOIR Auto-Login: Fetching OTP code (attempt ' + attempt + '/' + maxAttempts + ')')
    GM_xmlhttpRequest({
      method: 'GET',
      url: OTP_WEBHOOK_URL,
      onload: function (res) {
        var code = (res.responseText || '').trim()
        if (code) {
          console.log('EOIR Auto-Login: OTP code received')
          callback(null, code)
        } else if (attempt < maxAttempts) {
          console.log('EOIR Auto-Login: Empty OTP response, retrying in 3s...')
          setTimeout(function () {
            fetchOtpCode(attempt + 1, maxAttempts, callback)
          }, 3000)
        } else {
          console.log('EOIR Auto-Login: Failed to get OTP after ' + maxAttempts + ' attempts')
          callback('OTP fetch failed after ' + maxAttempts + ' attempts')
        }
      },
      onerror: function (e) {
        if (attempt < maxAttempts) {
          console.log('EOIR Auto-Login: OTP fetch error, retrying in 3s...', e)
          setTimeout(function () {
            fetchOtpCode(attempt + 1, maxAttempts, callback)
          }, 3000)
        } else {
          console.log('EOIR Auto-Login: OTP fetch failed after ' + maxAttempts + ' attempts', e)
          callback('OTP fetch error')
        }
      },
    })
  }

  // --- Phase detection and handling ---

  var otpSelectors = [
    'input[name="credentials.totp"]',
    'input[name="answer"]',
    'input[data-se="input-credentials.totp"]',
  ]

  var passwordSelectors = [
    'input[type="password"]',
    'input[autocomplete="current-password"]',
  ]

  var emailSelectors = [
    'input[name="identifier"]',
    'input[name="username"]',
    'input[type="email"]',
    'input[id*="identifier"]',
    'input[id*="username"]',
    'input[id*="okta-signin-username"]',
    'input[autocomplete="username"]',
  ]

  function detectAndHandle(email, password) {
    // Check OTP first (most specific)
    var otpEl = findElement(otpSelectors)
    if (otpEl) {
      console.log('EOIR Auto-Login: [Phase: OTP] Field found -', otpEl.name || otpEl.id)
      handleOtp(otpEl)
      return true
    }

    // Check password
    var passEl = findElement(passwordSelectors)
    if (passEl) {
      console.log('EOIR Auto-Login: [Phase: Password] Field found -', passEl.name || passEl.id || passEl.type)
      handlePassword(passEl, password)
      return true
    }

    // Check email
    var emailEl = findElement(emailSelectors)
    if (emailEl) {
      console.log('EOIR Auto-Login: [Phase: Email] Field found -', emailEl.name || emailEl.id || emailEl.type)
      handleEmail(emailEl, email)
      return true
    }

    return false
  }

  function handleEmail(el, email) {
    setTimeout(function () {
      fillInput(el, email)
      console.log('EOIR Auto-Login: Email filled')
      setTimeout(function () { clickSubmit() }, 500)
    }, 600)
  }

  function handlePassword(el, password) {
    setTimeout(function () {
      fillInput(el, password)
      console.log('EOIR Auto-Login: Password filled')
      setTimeout(function () { clickSubmit() }, 500)
    }, 600)
  }

  function handleOtp(el) {
    fetchOtpCode(1, 3, function (err, code) {
      if (err) {
        console.log('EOIR Auto-Login: OTP error -', err)
        return
      }
      setTimeout(function () {
        fillInput(el, code)
        console.log('EOIR Auto-Login: OTP filled')
        setTimeout(function () {
          clickSubmit()
          console.log('EOIR Auto-Login: OTP submitted. Login complete.')
        }, 500)
      }, 600)
    })
  }

  // --- Main logic ---

  GM_xmlhttpRequest({
    method: 'GET',
    url: GATEWAY_URL + '/api/check-ip',
    onload: function (res) {
      try {
        var data = JSON.parse(res.responseText)
        console.log('EOIR Auto-Login: API response -', data.allowed ? 'VPN active' : 'VPN not active')
      } catch (e) {
        console.log('EOIR Auto-Login: JSON parse error')
        return
      }

      if (!data || !data.allowed || !data.credentials) {
        console.log('EOIR Auto-Login: VPN not active or credentials missing.')
        return
      }

      var email = data.credentials.email
      var password = data.credentials.password
      console.log('EOIR Auto-Login: Credentials received, detecting phase...')

      // Try immediately
      var handled = detectAndHandle(email, password)

      if (!handled) {
        console.log('EOIR Auto-Login: No form found yet, observing DOM...')
        var observer = new MutationObserver(function () {
          if (detectAndHandle(email, password)) {
            observer.disconnect()
          }
        })
        observer.observe(document.documentElement, { childList: true, subtree: true })
        setTimeout(function () {
          observer.disconnect()
          console.log('EOIR Auto-Login: Timeout - no form detected')
        }, 30000)
      }
    },
    onerror: function (e) {
      console.log('EOIR Auto-Login: Connection error', e)
    },
  })
})()
