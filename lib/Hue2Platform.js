// homebridge-hue2/lib/Hue2Platform.js
// Copyright © 2023-2024 Erik Baauw. All rights reserved.
//
// Homebridge plugin for Hue v2.

import { once } from 'node:events'

import { timeout } from 'homebridge-lib'
import { HttpClient } from 'homebridge-lib/HttpClient'
import { OptionParser } from 'homebridge-lib/OptionParser'
import { Platform } from 'homebridge-lib/Platform'

import { HueDiscovery } from 'hb-hue-tools/HueDiscovery'
import { HueClient } from 'hb-hue-tools/HueClient'

// import { Hue2Accessory } from './Hue2Accessory/index.js'
// import './Hue2Accessory/Bridge.js'

class Hue2Platform extends Platform {
  constructor (log, configJson, homebridge, bridge) {
    super(log, configJson, homebridge)
    this.parseConfigJson(configJson)
    this.debug('config: %j', this.config)

    this
      .on('accessoryRestored', this.accessoryRestored)
      .once('heartbeat', this.init)
      .on('heartbeat', this.heartbeat)

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
    const optionParser = new OptionParser(this.config, true)
    optionParser
      .on('userInputError', (message) => {
        this.warn('config.json: %s', message)
      })
      .stringKey('name')
      .stringKey('platform')
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
      this.discovery = new HueDiscovery({
        timeout: this.config.timeout
      })
      this.discovery
        .on('error', (error) => {
          if (error instanceof HttpClient.HttpError) {
            this.log(
              '%s: request %d: %s %s', error.request.name,
              error.request.id, error.request.method, error.request.resource
            )
            this.warn(
              '%s: request %d: %s', error.request.name, error.request.id, error
            )
            return
          }
          this.warn(error)
        })
        .on('request', (request) => {
          this.debug(
            '%s: request %d: %s %s', request.name,
            request.id, request.method, request.resource
          )
        })
        .on('response', (response) => {
          this.debug(
            '%s: request %d: %d %s', response.request.name,
            response.request.id, response.statusCode, response.statusMessage
          )
        })
        .on('found', (name, id, address) => {
          this.debug('%s: found %s at %s', name, id, address)
        })
        .on('searching', (name, host) => {
          this.debug('%s: listening on %s', name, host)
        })
        .on('searchDone', (name) => { this.debug('%s: search done', name) })
    } catch (error) {
      this.fatal(error)
    }
  }

  async foundBridge (host, config) {
  //   const id = config.bridgeid
  //   if (this.bridgeMap[id] == null) {
  //     this.bridgeMap[id] = new Hue2Accessory.Bridge(this, { config, host })
  //   }
  //   await this.bridgeMap[id].found(host, config)
  //   await once(this.bridgeMap[id], 'initialised')
  //   this.emit('found')
  }

  async findHost (host) {
    try {
      const config = await this.discovery.config(host)
      if (HueClient.isHue2Bridge(config)) {
        await this.foundBridge(host, config)
      }
    } catch (error) {
      this.warn('%s: %s - retrying in 60s', host, error)
      await timeout(60000)
      return this.findHost(host)
    }
  }

  async init (beat) {
    try {
      const jobs = []
      if (this.config.hosts.length > 0) {
        for (const host of this.config.hosts) {
          this.debug('job %d: find bridge at %s', jobs.length, host)
          jobs.push(this.findHost(host))
        }
      } else {
        this.debug('job %d: find at least one bridge', jobs.length)
        jobs.push(once(this, 'found'))
        for (const id in this.bridgeMap) {
          const bridge = this.bridgeMap[id]
          const host = bridge.values.host
          this.debug('job %d: find bridge %s', jobs.length, id)
          jobs.push(once(bridge, 'initialised'))
          try {
            const config = await this.discovery.config(host)
            await this.foundBridge(host, config)
          } catch (error) {
            this.warn('%s: %s', id, error)
          }
        }
      }

      this.debug('waiting for %d jobs', jobs.length)
      for (const id in jobs) {
        try {
          await jobs[id]
          this.debug('job %d/%d: done', Number(id) + 1, jobs.length)
        } catch (error) {
          this.warn(error)
        }
      }

      this.log('%d bridges', Object.keys(this.bridgeMap).length)
      this.emit('initialised')
      const dumpInfo = {
        config: this.config,
        bridgeMap: {}
      }
      for (const id in this.bridgeMap) {
        const bridge = this.bridgeMap[id]
        dumpInfo.bridgeMap[id] = Object.assign({}, bridge.context)
        dumpInfo.bridgeMap[id].deviceById = bridge.deviceById
      }
      await this.createDumpFile(dumpInfo)
    } catch (error) { this.error(error) }
  }

  async onUiRequest (method, url, body) {
    const path = url.split('/').slice(1)
    if (path.length < 1) {
      return { status: 403 } // Forbidden
    }
    if (path[0] === 'bridges') {
      if (path.length === 1) {
        if (method === 'GET') {
          const body = {}
          for (const id of Object.keys(this.bridgeMap).sort()) {
            const bridge = this.bridgeMap[id]
            body[bridge.values.host] = {
              config: bridge.context.config,
              host: bridge.values.host,
              id
            }
          }
          return { status: 200, body }
        }
        return { status: 405 } // Method Not Allowed
      }
      const bridge = this.bridgeMap[path[1]]
      if (bridge == null) {
        return { status: 404 } // Not Found
      }
      if (method === 'GET') {
        return bridge.onUiGet(path.slice(2))
      }
      if (method === 'PUT') {
        return bridge.onUiPut(path.slice(2), body)
      }
      return { status: 405 } // Method Not Allowed
    }
    return { status: 403 } // Forbidden
  }

  async heartbeat (beat) {
    try {
      if (beat % 300 === 5 && this.config.hosts.length === 0) {
        const configs = await this.discovery.discover({
          stealth: this.config.stealth
        })
        const jobs = []
        for (const host in configs) {
          jobs.push(this.foundBridge(host, configs[host]))
        }
        for (const job of jobs) {
          try {
            await job
          } catch (error) {
            this.error(error)
          }
        }
      }
    } catch (error) { this.error(error) }
  }

  accessoryRestored (className, version, id, name, context) {
    try {
      // if (className === 'Bridge') {
      //   if (
      //     this.config.hosts.length === 0 ||
      //     this.config.hosts.includes(context.host)
      //   ) {
      //     this.bridgeMap[id] = new Hue2Accessory.Bridge(this, context)
      //   }
      // } else {
      //   const bridge = this.bridgeMap[context.gid]
      //   if (bridge != null) {
      //     bridge.addAccessory(id)
      //   }
      // }
    } catch (error) { this.error(error) }
  }
}

export { Hue2Platform }
