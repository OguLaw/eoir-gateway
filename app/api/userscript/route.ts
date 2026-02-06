import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const gatewayUrl = `${proto}://${host}`

  const script = `// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      1.2
// @description  EOIR portalina otomatik giris (email + sifre)
// @match        https://doj-login-ext.okta-gov.com/*
// @grant        GM_xmlhttpRequest
// @connect      ${host}
// @downloadURL  ${gatewayUrl}/api/userscript
// @updateURL    ${gatewayUrl}/api/userscript
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict'

  var GATEWAY_URL = '${gatewayUrl}'

  console.log('EOIR Auto-Login: Baslatiliyor, Gateway =', GATEWAY_URL)

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
                console.log('EOIR Auto-Login: Tamamlandi - OTP bekleniyor.')
              }, 500)
            }, 600)
          }).catch(function () {
            console.log('EOIR Auto-Login: Sifre alani bulunamadi (timeout)')
          })
        }, 500)
      }, 600)
    }).catch(function () {
      console.log('EOIR Auto-Login: Email alani bulunamadi (timeout)')
    })
  })
})()
`

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Content-Disposition': 'inline; filename="eoir-autofill.user.js"',
    },
  })
}
