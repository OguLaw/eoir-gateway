// ==UserScript==
// @name         EOIR Auto-Login
// @namespace    eoir-gateway
// @version      1.0
// @description  EOIR portalına otomatik giriş (email + şifre)
// @match        https://doj-login-ext.okta-gov.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *.vercel.app
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(async function () {
  'use strict'

  // Gateway URL — user can change via Tampermonkey menu
  let GATEWAY_URL = GM_getValue('gatewayUrl', '')

  GM_registerMenuCommand('Gateway URL Ayarla', () => {
    const url = prompt('EOIR Gateway URL:', GATEWAY_URL)
    if (url !== null) {
      GM_setValue('gatewayUrl', url.replace(/\/+$/, ''))
      GATEWAY_URL = url.replace(/\/+$/, '')
      alert('Kaydedildi! Sayfayı yenileyin.')
    }
  })

  if (!GATEWAY_URL) {
    const url = prompt(
      'EOIR Auto-Login: İlk kullanım.\nGateway URL\'nizi girin (örn: https://eoir-gateway.vercel.app):'
    )
    if (!url) return
    GM_setValue('gatewayUrl', url.replace(/\/+$/, ''))
    GATEWAY_URL = url.replace(/\/+$/, '')
  }

  // Fetch credentials from gateway API
  function fetchCredentials() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: GATEWAY_URL + '/api/check-ip',
        onload: (res) => {
          try {
            resolve(JSON.parse(res.responseText))
          } catch {
            reject(new Error('JSON parse hatası'))
          }
        },
        onerror: () => reject(new Error('Bağlantı hatası')),
      })
    })
  }

  let result
  try {
    result = await fetchCredentials()
  } catch (e) {
    console.log('EOIR Auto-Login:', e.message)
    return
  }

  if (!result.allowed || !result.credentials) {
    console.log('EOIR Auto-Login: VPN aktif değil.')
    return
  }

  const { email, password } = result.credentials

  // Fill input (works with React/Okta frameworks)
  function fillInput(el, value) {
    el.focus()
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set
    if (setter) setter.call(el, value)
    else el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }

  // Wait for element
  function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector)
      if (el) return resolve(el)
      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector)
        if (found) { observer.disconnect(); resolve(found) }
      })
      observer.observe(document.body, { childList: true, subtree: true })
      setTimeout(() => { observer.disconnect(); reject(new Error('Timeout: ' + selector)) }, timeout)
    })
  }

  function findSubmit() {
    return (
      document.querySelector('input[type="submit"]') ||
      document.querySelector('button[type="submit"]') ||
      document.querySelector('[data-type="save"]')
    )
  }

  const delay = (ms) => new Promise((r) => setTimeout(r, ms))

  // Step 1: Email
  try {
    const emailInput = await waitFor(
      'input[name="identifier"], input[type="email"], input[name="username"]'
    )
    await delay(400)
    fillInput(emailInput, email)
    await delay(300)
    const nextBtn = findSubmit()
    if (nextBtn) nextBtn.click()
  } catch (e) {
    console.log('EOIR Auto-Login: Email alanı bulunamadı', e)
    return
  }

  // Step 2: Password
  try {
    const passInput = await waitFor('input[type="password"]')
    await delay(400)
    fillInput(passInput, password)
    await delay(300)
    const verifyBtn = findSubmit()
    if (verifyBtn) verifyBtn.click()
  } catch (e) {
    console.log('EOIR Auto-Login: Şifre alanı bulunamadı', e)
  }

  // Step 3: OTP left to user
})()
