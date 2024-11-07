#!/usr/bin/env node

// homebridge-hue2/cli/ph.js
//
// Homebridge plug-in for Hue v2.
// Copyright © 2018-2024 Erik Baauw. All rights reserved.
//
// Command line interface to Philips Hue API.

import { createRequire } from 'node:module'

import { PhTool } from 'hb-hue-tools/PhTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new PhTool(packageJson).main()
