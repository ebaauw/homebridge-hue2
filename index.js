// homebridge-hue2/index.js
// Copyright © 2022 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Hue v2.

'use strict'

const Hue2Platform = require('./lib/Hue2Platform')
const packageJson = require('./package.json')

module.exports = function (homebridge) {
  Hue2Platform.loadPlatform(homebridge, packageJson, 'Hue2', Hue2Platform)
}
