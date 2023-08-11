// homebridge-deconz/lib/Hue2Platform.js
// Copyright © 2023 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Hue v2.

'use strict'

const homebridgeLib = require('homebridge-lib')

class Hue2Platform extends homebridgeLib.Platform {
  constructor (log, configJson, homebridge, bridge) {
    super(log, configJson, homebridge)
    this.parseConfigJson(configJson)
    this.debug('config: %j', this.config)

    this
      .on('accessoryRestored', this.accessoryRestored)
      .once('heartbeat', this.init)

    this.warn('This plugin is work in progress')
  }

  parseConfigJson (configJson) {
    this.config = {
      hosts: [],
      noResponse: false,
      parallelRequests: 10,
      stealth: false,
      timeout: 5,
      waitTimePut: 50,
      waitTimePutGroup: 1000,
      waitTimeResend: 300,
      waitTimeReset: 500,
      waitTimeUpdate: 100
    }
    const optionParser = new homebridgeLib.OptionParser(this.config, true)
    optionParser
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message)
      })
      .stringKey('name')
      .stringKey('platform')
      .stringKey('host')
      .arrayKey('hosts')
      .boolKey('noResponse')
      .intKey('parallelRequests', 1, 30)
      .boolKey('stealth')
      .intKey('timeout', 5, 30)
      .intKey('waitTimePut', 0, 50)
      .intKey('waitTimePutGroup', 0, 1000)
      .intKey('waitTimeResend', 100, 1000)
      .boolKey('waitTimeReset', 10, 2000)
      .intKey('waitTimeUpdate', 0, 500)

    this.bridgeMap = {}

    try {
      optionParser.parse(configJson)
      if (this.config.host != null) {
        this.config.hosts.push(this.config.host)
      }
      // ...
    } catch (error) {
      this.fatal(error)
    }
  }

  async init (beat) {
    const jobs = []
    for (const job of jobs) {
      await job
    }
    this.debug('initialised')
    this.emit('initialised')
  }

  accessoryRestored (className, version, id, name, context) {
    try {
      // Todo
    } catch (error) { this.error(error) }
  }
}

module.exports = Hue2Platform
