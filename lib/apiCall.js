import fetch from 'node-fetch'
import { REST_API_REGION } from './endpoints.js'
import { Buffer } from 'node:buffer'
import test from 'node:test';
import assert from 'node:assert';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';


/* 
* Returns username and api key credentials from parsed cli input
* works off of process.argv, no extra libraries so order is critical
*/
function credentialsCLI() {
    var args = process.argv.splice(2);
    console.log('real args', args)
    if (args.length < 2) {
        console.error("Too few args. Need Sauce Labs username and api key")
        process.exit(1)
    }
    let userArg = args[0], keyArg = args[1];
    return { 
        username: userArg,
        key: keyArg
    }
}

/*
* gets job details and grabs important details from returned JSON  
* @param {string} id - test ID used by Sauce Labs
* @param {string} region - data center endpoint, aka Region, used by Sauce Labs
* @param {{username: string, key: string}} creds object holding Sauce Labs credentials
*/
async function getRdcJob(jobId = null, region, creds) {
    if (jobId == null) {
        const rl = readline.createInterface({ input, output });
        const getId = await rl.question('Input Job ID: ');
        rl.close()
        jobId = getId
    }
    const url = `https://${region}/v1/rdc/jobs/${jobId}`
    const response = await fetch(url, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}
    })
    const blob = await response.json()
    console.log(blob)
    return {
        owner: blob.owner_sauce,
        status: blob.status,
        automationType: blob.test_report_type,
        os: `${blob.os} ${blob.os_version}`,
        id: blob.id,
        video: blob.video_url,
        automationLog: blob.framework_log_url,
        commands: blob.requests_url,
        crashLog: blob.crash_log_url,
        networkLog: blob.network_log_url,
        appiumVer: blob.appium_version,
        clientVer: blob.client,
        cachedDevice: blob.used_cached_device,
        tags: blob.tags,
        tunnel: blob.assigned_tunnel_id,
        appName: blob.application_summary.name,
        app: blob.application_summary.filename,
        sauceStorageId: blob.application_summary.appStorageId,
        appName: blob.application_summary.packageName,
        appVersion: blob.application_summary.version,
        appMinMaxVersion: `${blob.application_summary.minOsVersion} - ${blob.application_summary.targetOsVersion}`
    }
}
let creds = credentialsCLI();
let job = await getRdcJob(null, REST_API_REGION.US_WEST_1, creds)
console.log(job);

