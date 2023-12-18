#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { getJobDetails, getAsset } from './../lib/apiCall.js'
import { REST_API_REGION } from './../lib/endpoints.js'

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

const jobInfo = await getJobDetails(test, region, creds)
var stuffToDownload = []
for (const [k,v] of Object.entries(jobInfo.assets)) {
    if (v != null) {
        stuffToDownload.push(v)
    }
}
console.log(jobInfo)

stuffToDownload.forEach(async (url) => {
    await getAsset(creds, url)
});
