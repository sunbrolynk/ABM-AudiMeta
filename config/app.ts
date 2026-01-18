import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { defineConfig } from '@adonisjs/core/http'
import { Infer } from '@vinejs/vine/types'
import { regionValidation } from '#validators/common'

/**
 * The app key is used for encrypting cookies, generating signed URLs,
 * and by the "encryption" module.
 *
 * The encryption module will fail to decrypt data if the key is lost or
 * changed. Therefore it is recommended to keep the app key secure.
 */
export const appKey = new Secret(env.get('APP_KEY'))

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,

  /**
   * Enabling async local storage will let you access HTTP context
   * from anywhere inside your application.
   */
  useAsyncLocalStorage: true,

  /**
   * Manage cookies configuration. The settings for the session id cookie are
   * defined inside the "config/session.ts" file.
   */
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})

export const regionMap = {
  us: '.com',
  ca: '.ca',
  uk: '.co.uk',
  au: '.com.au',
  fr: '.fr',
  de: '.de',
  jp: '.co.jp',
  it: '.it',
  in: '.in',
  es: '.es',
  br: '.com.br',
}

export const localRegionMap = {
  us: 'en-US',
  ca: 'en-CA',
  uk: 'en-GB',
  au: 'en-AU',
  fr: 'fr-FR',
  de: 'de-DE',
  jp: 'ja-JP',
  it: 'it-IT',
  in: 'en-IN',
  es: 'es-ES',
  br: 'pt-BR',
}

export const audibleHeaders = {
  'User-Agent': 'Audible/4.15.0 Android/14 Build/SM-S928U',
  'Content-Type': 'application/json',
  'Accept-Encoding': 'gzip',
  'Accept-Charset': 'utf-8',
  'Accept': 'application/json',
}

export function getAudibleExtraHeaders(region?: Infer<typeof regionValidation>) {
  const deviceId = env.get('DEVICE_ID')
  const headers: Record<string, string | number> = {
    'ACCEPTED-LANGUAGE': region ? localRegionMap[region] : 'en-US',
    'accept-language': region ? localRegionMap[region] : 'en-US',
    'X-ADP-SW': Math.floor(Math.random() * 89999999) + 10000000,
    'User-Agent': 'Audible/4.15.0 Android/14 Build/SM-S928U',
  }
  
  // Only include X-Device-Type-Id if it's set and not empty
  if (deviceId && deviceId.trim() !== '') {
    headers['X-Device-Type-Id'] = deviceId
  }
  
  return headers
}