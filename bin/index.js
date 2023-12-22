#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getJobDetails, getAsset, mkDownloadFolder } from './../lib/apiCall.js'
import { REST_API_REGION } from './../lib/endpoints.js'
import * as path from 'node:path'
import * as fs from 'node:fs'


const args = yargs(hideBin(process.argv))
.option('u', {alias: 'user', describe: 'Sauce Labs Username', demandOption: true})
.option('k', {alias: 'key', describe: 'Sauce Labs API Key', demandOption: true})
.option('t', {alias: 'testId', describe: 'Job/Session ID', demandOption: false})
.option('r', {alias: 'region', describe: 'eu | uswest | useast', demandOption: true})
.parse()
if (args.user === undefined || args.key === undefined) {
    console.error('missing user or key')
}

const creds = { 
    username: args.user,
    key: args.key
}
const test = args.testId
let region = undefined
switch (args.region) {
    case 'eu':
        region = REST_API_REGION.EU_CENTRAL_1
        break;
    case 'uswest':
        region = REST_API_REGION.US_WEST_1
        break;
    case 'useast':
        region = REST_API_REGION.US_EAST_4
        break;
    default:
        break;
}


// TODO turn this into a "getEverything" func
const downloadLocation = await mkDownloadFolder(null, test)
const jobInfo = await getJobDetails(test, region, creds)
.log(jobInfo)
const parsedjobInfo = JSON.parse(jobInfo)
var stuffToDownload = []
for (const [k,url] of Object.entries(parsedjobInfo.assets)) {
    if (url != null) {
        stuffToDownload.push(url)
    }
}
stuffToDownload.forEach(async (url) => {
    await getAsset(creds, url)
});
const infoFile = path.join(`${downloadLocation}`, `info_${test}.json`)
await fs.writeFile(infoFile, jobInfo, 'utf8', (writeErr) => {
    if (writeErr) {
      console.error(`Error writing to the file: ${writeErr}`);
      return;
    }
})
