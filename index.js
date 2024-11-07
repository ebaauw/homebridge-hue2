// homebridge-hue2/index.js
// Copyright © 2023-2024 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Hue v2.

import { createRequire } from 'node:module'

import { Hue2Platform } from './lib/Hue2Platform.js'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

function main (homebridge) {
  Hue2Platform.loadPlatform(homebridge, packageJson, 'Hue2', Hue2Platform)
}

export { main as default }
