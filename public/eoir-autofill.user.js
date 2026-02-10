// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      2.0
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

  console.log('EOIR Auto-Login: Starting, Gateway =', GATEWAY_URL)

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

  function fetchCredentials(callback) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: GATEWAY_URL + '/api/check-ip',
      onload: function (res) {
        try {
          var data = JSON.parse(res.responseText)
          console.log('EOIR Auto-Login: API response -', data.allowed ? 'VPN active' : 'VPN not active')
          callback(null, data)
        } catch (e) {
          console.log('EOIR Auto-Login: JSON parse error')
          callback('JSON parse error')
        }
      },
      onerror: function (e) {
        console.log('EOIR Auto-Login: Connection error', e)
        callback('Connection error')
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

  function waitFor(selectors, timeout, excludeElement) {
    timeout = timeout || 30000
    return new Promise(function (resolve, reject) {
      function check() {
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i])
          if (el && el !== excludeElement) return el
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

  function waitForGone(element, timeout) {
    timeout = timeout || 15000
    return new Promise(function (resolve) {
      if (!document.contains(element)) return resolve()
      var observer = new MutationObserver(function () {
        if (!document.contains(element)) { observer.disconnect(); resolve() }
      })
      observer.observe(document.documentElement, { childList: true, subtree: true })
      setTimeout(function () { observer.disconnect(); resolve() }, timeout)
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
        console.log('EOIR Auto-Login: Button clicked -', selectors[i])
        btn.click()
        return true
      }
    }
    console.log('EOIR Auto-Login: Submit button not found')
    return false
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

  fetchCredentials(function (err, result) {
    if (err) {
      console.log('EOIR Auto-Login: Error -', err)
      return
    }
    if (!result || !result.allowed || !result.credentials) {
      console.log('EOIR Auto-Login: VPN not active or credentials missing.')
      return
    }

    var email = result.credentials.email
    var password = result.credentials.password
    console.log('EOIR Auto-Login: Credentials received, waiting for form...')

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
      console.log('EOIR Auto-Login: Email field found -', emailInput.name || emailInput.id || emailInput.type)
      setTimeout(function () {
        fillInput(emailInput, email)
        console.log('EOIR Auto-Login: Email filled')
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
            console.log('EOIR Auto-Login: Password field found -', passInput.name || passInput.id || passInput.type)
            setTimeout(function () {
              fillInput(passInput, password)
              console.log('EOIR Auto-Login: Password filled')
              setTimeout(function () {
                clickSubmit()
                console.log('EOIR Auto-Login: Password submitted, waiting for page transition...')

                // --- OTP Phase ---
                // Wait for password field to leave DOM before looking for OTP
                waitForGone(passInput, 15000).then(function () {
                  console.log('EOIR Auto-Login: Page transitioned, looking for OTP field...')

                  var otpSelectors = [
                    'input[name="credentials.passcode"]',
                    'input[name="answer"]',
                    'input[type="tel"]',
                    'input[data-se="input-credentials.passcode"]',
                  ]

                  return waitFor(otpSelectors, 30000, passInput)
                }).then(function (otpInput) {
                  console.log('EOIR Auto-Login: OTP field found -', otpInput.name || otpInput.id || otpInput.type)
                  fetchOtpCode(1, 3, function (otpErr, otpCode) {
                    if (otpErr) {
                      console.log('EOIR Auto-Login: OTP error -', otpErr)
                      return
                    }
                    setTimeout(function () {
                      fillInput(otpInput, otpCode)
                      console.log('EOIR Auto-Login: OTP filled')
                      setTimeout(function () {
                        clickSubmit()
                        console.log('EOIR Auto-Login: OTP submitted. Login complete.')
                      }, 500)
                    }, 600)
                  })
                }).catch(function () {
                  console.log('EOIR Auto-Login: OTP field not found (timeout)')
                })
              }, 500)
            }, 600)
          }).catch(function () {
            console.log('EOIR Auto-Login: Password field not found (timeout)')
          })
        }, 500)
      }, 600)
    }).catch(function () {
      console.log('EOIR Auto-Login: Email field not found (timeout)')
    })
  })
})()
