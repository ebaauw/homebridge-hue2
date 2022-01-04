// homebridge-deconz/lib/Hue2Platform.js
// Copyright © 2022 Erik Baauw. All rights reserved.
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
      hosts: []
    }
    const optionParser = new homebridgeLib.OptionParser(this.config, true)
    optionParser
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message)
      })
      .stringKey('name')
      .stringKey('platform')
      .arrayKey('hosts')
    try {
      optionParser.parse(configJson)
      if (this.config.hosts.length === 0) {
        this.log('no bridges found')
      }
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
