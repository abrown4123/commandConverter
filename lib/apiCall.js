import fetch from 'node-fetch'
import { REST_API_REGION, REST_API } from './endpoints.js'
import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises';
import { liveDesktopWeb, nonAppInfo, rdcInfo } from './metadata.js'

const jobType = {
    DESKTOP: 1,
    REAL_DEVICE: 2,
    VIRTUAL_DEVICE: 4,
    LIVE: 8,
    AUTOMATED: 16,
    WEB: 32,
    APP: 64
}


/*
* check if a job id exists in the Region/API/Platform/etc. Return BOOLEAN
* AKA does not 404 
* @param {string} id - test ID used by Sauce Labs
* @param {string} region - data center endpoint, aka Region, used by Sauce Labs
* @param {string} api - path/api to use. Platform dependent RDC vs VDC. v1 vs v1.1 vs v2
* @param {{username: string, key: string}} creds object holding Sauce Labs credentials
*/
async function exists(url, creds) {
    const res = await fetch(url, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}
    })
    if (res.status == 404) {
        return false
    }
    return true
}

/*
* gets job details and grabs important details from returned JSON  
* @param {string} id - test ID used by Sauce Labs
* @param {string} region - data center endpoint, aka Region, used by Sauce Labs
* @param {{username: string, key: string}} creds object holding Sauce Labs credentials
*/
async function getJobDetails(jobId = null, region, creds) {
    const rdc_url = `https://${region}/v1/rdc/jobs/${jobId}`
    const wacky_vdc_url = `https://${region}/${REST_API.ONE_DOT_ONE}/${jobId}`
    let known_url = ""
    let jobFlags = 0
    // check if it exists anywhere
    if(!await exists(wacky_vdc_url, creds=creds) && !await exists(rdc_url, creds=creds)) {
        console.error(`ERROR: Could not find this JOB_ID anywhere. Checked ${wacky_vdc_url} & ${rdc_url}`)
        process.exit(1)
    }
    if (await exists(wacky_vdc_url, creds=creds)) {
        known_url = wacky_vdc_url
        jobFlags = jobType.DESKTOP | jobType.VIRTUAL_DEVICE
    } else {
        known_url= rdc_url
        jobFlags = jobType.REAL_DEVICE
    }
    console.log("bitflags after checking platform URL", jobFlags.toString(2))

    const res = await fetch(known_url, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}
    })
    if (!res.ok) {
        console.error(`ERROR: ${url} responded with HTTP status ${res.status}`)
        process.exit(1)
    }
    const blob = await res.json()

    // TODO extract this out to a flag IF chain
    if (blob["automation_backend"] === 'webdriver') {
        jobFlags &= ~jobType.VIRTUAL_DEVICE
        jobFlags |= jobType.WEB
    }
    if (blob.hasOwnProperty('browserName') && blob['browserName'] !== null) {
        jobFlags |= jobType.WEB
    }
    if (blob['app'] === 'safari' || blob['app'] === 'chrome') {
        jobFlags |= jobType.WEB
    }
    if (blob['browser'].toLowerCase() === 'ios'
    || blob['browser'].toLowerCase() === 'android' 
    || blob['browser'].toLowerCase() === 'iphone') {
        jobFlags &= ~jobType.DESKTOP
    }
    console.log("bitflags after live + webdriver checks", jobFlags.toString(2))
    if (blob["application_summary"] !== null && blob.hasOwnProperty("application_summary")) {
        jobFlags |= jobType.APP
    }
    if ((jobFlags & jobType.REAL_DEVICE) && blob["application_summary"] === null && (!jobFlags & jobType.APP)) {
        console.log("marking as a web test", jobFlags.toString(2))
        jobFlags |= jobType.WEB
    }
    if (blob["manual"] === false) {
        jobFlags |= jobType.AUTOMATED
    } else if (blob["manual"] === true) {
        jobFlags |= jobType.LIVE
    }

    console.log("final checks complete. cur_bitflag: ", jobFlags.toString(2))
    // Emergency check. Conflict WEB & APP
    if (jobFlags & (jobType.WEB & jobType.APP)) {
        console.error("something went wrong. Impossible flags WEB & APP: ", jobFlags.toString(2))
        process.exit(1)
    }
    if (jobFlags & (jobType.AUTOMATED & jobType.LIVE)) {
        console.error("something went wrong. Conflicting flags LIVE & AUTOMATED: ", jobFlags.toString(2))
        process.exit(1)
    }
    if (jobFlags & (jobType.DESKTOP & jobType.VIRTUAL_DEVICE & jobType.REAL_DEVICE)) {
        console.error("something went wrong. Conflicting flags DESKTOP || VIRTUAL_DEVICE || REAL_DEVICE: ", jobFlags.toString(2))
        process.exit(1)
    }

    if (jobFlags & (jobType.APP & jobType.REAL_DEVICE & jobType.AUTOMATED)) {
        console.log("rdc app test", jobFlags.toString(2))
        return rdcInfo(blob, region)
    }
    if (jobFlags & (jobType.WEB & jobType.REAL_DEVICE)) {
        console.log("rdc web test", jobFlags.toString(2))
        return nonAppInfo(blob, region)
    }
    if (jobFlags & (jobType.DESKTOP & jobType.LIVE)) {
        console.log("desktop web test", jobFlags.toString(2))
        return liveDesktopWeb(blob, region, creds.username, jobId)
    }
    if (jobFlags & (jobType.VIRTUAL_DEVICE | jobType.WEB)) {
        console.log("EMUSIM web test", jobFlags.toString(2))
        return liveDesktopWeb(blob, region, creds.username, jobId)
    }
    if (jobFlags & (jobType.VIRTUAL_DEVICE & jobType.APP)) {
        console.log("EMUSIM app test", jobFlags.toString(2))
        return liveDesktopWeb(blob, region, creds.username, jobId)
    }
}


async function getAsset(sauceCreds, assetUrl, downloadPath = null) {
    try {
        const res = await fetch(assetUrl, {
            method: 'get',
            headers: {'Authorization': 'Basic ' + Buffer.from(`${sauceCreds.username}:${sauceCreds.key}`).toString('base64')}
        })
        let jobId = assetUrl.split('/').at(-2)
        if (jobId.length <= 8) {
            // hack to see if this is a VDC api :(
            jobId = assetUrl.split('/').at(-3)
        }
        const downloadLocation = await mkDownloadFolder(downloadPath, jobId)
        var asset = assetUrl.split('/').at(-1)
        // tired of just files without file extenions
        if (!asset.includes('.json')) {
            asset = asset === 'video.mp4' || asset.includes('.log') ? asset : asset + '.json'
        }
        const filePath = path.join(`${downloadLocation}`, `${jobId}_${asset}`);
        try {
            await pipeline(res.body,fs.createWriteStream(filePath, { flags: 'w+'}));
        } catch (error) {
            console.error(error)
        }
        if (asset !== 'video.mp4' && !asset.includes('.log')) {
            fs.readFile(filePath, 'utf-8', (err, contents) => {
                if (err) {
                    console.error(err)
                    return 1;
                }

                // add indents Sauce API throws back unformatted files :(
                const jsonContent = JSON.parse(contents)
                const formattedJsonConent = JSON.stringify(jsonContent, null, 4)
                fs.writeFile(filePath, formattedJsonConent, 'utf8', (writeErr) => {
                    if (writeErr) {
                      console.error(`Error writing to the file: ${writeErr}`);
                      return;
                    }
                })
            })
        }
    } catch (e) {
        console.error(e, `Error trying to retrieve ${assetUrl}`)
    }
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
            fs.mkdir(folder, {recursive: true})
            return folder
        } catch (e) {
            console.error(e)
        }
    }
    const folder = path.join(os.homedir(), 'Downloads', jobId)
    if (fs.existsSync(folder)) {
        return folder
    }
    fs.mkdir(folder, {recursive: true }, (err) => {
        if (err) throw err;
    })
    return folder
}


// placeholder usage and testing
// const creds = credentialsCLI();
// const job = await getRdcJob('26b50181469c4ba287f551e18a06a493', REST_API_REGION.US_WEST_1, creds)
// // await getAsset(creds, job.assets.video)
// var stuffToDownload = []
// for (const [k,v] of Object.entries(job.assets)) {
//     console.log(k,v)
//     if (v != null) {
//         stuffToDownload.push(v)
//     }
// }
// console.log(job);

// stuffToDownload.forEach(async (url) => {
//     await getAsset(creds, url)
// });

export { getAsset, getJobDetails, mkDownloadFolder };