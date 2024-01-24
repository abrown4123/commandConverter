import fetch from 'node-fetch'
import { REST_API_REGION, REST_API } from './endpoints.js'
import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises';
import { automatedDesktop, emusim, isRDC, isVDC, liveDesktopWeb, nonAppInfo, rdcInfo } from './metadata.js'

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
    } else {
        known_url= rdc_url
    }

    const res = await fetch(known_url, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}
    })
    if (!res.ok) {
        console.error(`ERROR: ${url} responded with HTTP status ${res.status}`)
        process.exit(1)
    }
    const blob = await res.json()
    // console.log(blob)

    if (isRDC(blob)) {
        if (blob["application_summary"] !== null) {
            console.log("rdc app test")
            return rdcInfo(blob, region)
        } else {
            console.log("rdc web test")
            return nonAppInfo(blob, region)
        }
    
    }

    if (isVDC(blob)) {
        if (blob["automation_backend"] === 'webdriver') {
            if (blob['app'] === 'safari' || blob['app'] === 'chrome') {
                return automatedDesktop(blob, region, creds.username, jobId)
            }    
        }

        if (blob["manual"] === true) {
            console.log("desktop web test")
            return liveDesktopWeb(blob, region, creds.username, jobId)
        }

        if (jobFlags & (JOB_TYPE.VIRTUAL_DEVICE | JOB_TYPE.WEB) === EMUSIM_WEB) {
            console.log("EMUSIM web test")
            return emusim(blob, region, creds.username, jobId)
        }

        if (blob["automation_backend"] === "espresso" || blob["automation_backend"].includes("xcui")) {
            console.log("EMUSIM app test")
            return emusim(blob, region, creds.username, jobId)
        }
    }

    return "something went wrong. none of the above selected."
}


async function getAsset(sauceCreds, assetUrl, downloadPath = null) {
    try {
        const res = await fetch(assetUrl, {
            method: 'get',
            headers: {'Authorization': 'Basic ' + Buffer.from(`${sauceCreds.username}:${sauceCreds.key}`).toString('base64')}
        })
        if (res.status === 404) {
            console.log(res.status, assetUrl)
            return
        }
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