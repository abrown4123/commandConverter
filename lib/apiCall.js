import fetch from 'node-fetch'
import { REST_API_REGION } from './endpoints.js'
import { Buffer } from 'node:buffer'
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';


/* 
* Returns username and api key credentials from parsed cli input
* works off of process.argv, no extra libraries so order is critical
*/
// TODO real user/creds object or class 
function credentialsCLI() {
    var args = process.argv.splice(2);
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
    // TODO catch 404 or not found exceptions and redirect to the proper API or just err out
    const blob = await response.json()
    /* TODO turn this into a class/object. 
    * vdc:selenium 
    * vdc:appium
    * rdc:appium.
    * rdc:espresso/xcui
    * non-selenium frameworks
    */
    return {
        owner: blob.owner_sauce,
        status: blob.status,
        region: region,
        automationType: blob.test_report_type,
        device: blob.device_type,
        os: `${blob.os} ${blob.os_version}`,
        id: blob.id,
        assets: {
            video: blob.video_url,
            automationLog: blob.framework_log_url,
            commands: blob.requests_url,
            crashLog: blob.crash_log_url,
            networkLog: blob.network_log_url,
            deviceLog: blob.device_log_url
        },
        appiumVer: blob.appium_version,
        clientVer: blob.client,
        cachedDevice: blob.used_cached_device,
        tags: blob.tags,
        tunnel: blob.assigned_tunnel_id,
        app: {
            appName: blob.application_summary.name,
            app: blob.application_summary.filename,
            sauceStorageId: blob.application_summary.appStorageId,
            appName: blob.application_summary.packageName,
            appVersion: blob.application_summary.version,
            appMinMaxVersion: `${blob.application_summary.minOsVersion} - ${blob.application_summary.targetOsVersion}`
        }
    }
}


// TODO get jobId from url eventually
async function getAsset(sauceCreds, assetUrl, jobId = null, downloadPath = null) {
    if (jobId == null) {
        const rl = readline.createInterface({ input, output });
        const getId = await rl.question('Input Job ID: ');
        rl.close()
        jobId = getId
    }

    console.log(assetUrl)
    const asset = assetUrl.split('/').at(-1)
    const downloadLocation = await mkDownloadFolder(downloadPath, jobId)
    const res = await fetch(assetUrl, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${sauceCreds.username}:${sauceCreds.key}`).toString('base64')}
    })
    const filePath = path.join(`${downloadLocation}`, `${asset}_${jobId}.mp4`);
    await pipeline(res.body,fs.createWriteStream(filePath));
}

async function mkDownloadFolder(folderPath = null, jobId) {
    if (jobId == null) {
        console.error(`need a jobId, not ${jobId}`)
        return 1
    }
    if (folderPath != null) {
        const folder = path.join(os.homedir(), folderPath, jobId)
        if (fs.existsSync(folder)) {
            return folder
        }
        try {
            await fs.mkdir()
            return folder
        } catch (e) {
            console.error(e)
        }
    }
    const folder = path.join(os.homedir(), 'Downloads', jobId)
    if (fs.existsSync(folder)) {
        return folder
    }
    await fs.mkdir(folder, (err) => {
        if (err) throw err;
    });
    return folder
}

function tarItUp(assets, output) {}

function createJobDir(jobId, path) {}

// placeholder usage and testing
const creds = credentialsCLI();
const job = await getRdcJob('9a9b3171c3a846ed88df50e3aa0345f8', REST_API_REGION.US_WEST_1, creds)
await getAsset(creds, job.assets.video,'9a9b3171c3a846ed88df50e3aa0345f8')
console.log(job);

