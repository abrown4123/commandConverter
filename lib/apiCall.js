import fetch from 'node-fetch'
import { REST_API_REGION, REST_API } from './endpoints.js'
import { Buffer } from 'node:buffer'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { pipeline } from 'node:stream/promises';
import { rdcInfo } from './metadata.js'


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
    let main_url = ""
    // check if it exists anywhere
    if(!await exists(wacky_vdc_url, creds=creds) && !await exists(rdc_url, creds=creds)) {
        console.error(`ERROR: Could not find this JOB_ID anywhere. Checked ${wacky_vdc_url} & ${rdc_url}`)
        process.exit(1)
    }
    if (await exists(wacky_vdc_url, creds=creds)) {
        main_url = wacky_vdc_url
    } else {
        main_url= rdc_url
    }

    const res = await fetch(main_url, {
        method: 'get',
        headers: {'Authorization': 'Basic ' + Buffer.from(`${creds.username}:${creds.key}`).toString('base64')}
    })
    if (!res.ok) {
        console.error(`ERROR: ${url} responded with HTTP status ${res.status}`)
        process.exit(1)
    }
    // TODO catch 404 or not found exceptions and redirect to the proper API or just err out
    // maybe do this earlier in the process, have a "check api" function. or turn this into a generic "getJobs"
    // TODO print app details?
    const blob = await res.json()
    /* TODO turn this into a class/object. 
    * vdc:selenium 
    * vdc:appium
    * rdc:appium.
    * rdc:espresso/xcui
    * non-selenium frameworks
    */

    // TODO cleanup.
    // Check if this has app information or not
    if (blob["application_summary"] !== null && blob.hasOwnProperty("application_summary")) {
        return rdcInfo(blob, region);
    }
    // return {
    //     owner: blob.owner_sauce,
    //     status: blob.status,
    //     region: region,
    //     automationType: blob.test_report_type,
    //     device: blob.device_type,
    //     os: `${blob.os} ${blob.os_version}`,
    //     id: blob.id,
    //     assets: {
    //         video: blob.video_url,
    //         automationLog: blob.framework_log_url,
    //         commands: blob.requests_url,
    //         crashLog: blob.crash_log_url,
    //         networkLog: blob.network_log_url,
    //         deviceLog: blob.device_log_url
    //     },
    //     appiumVer: blob.appium_version,
    //     clientVer: blob.client,
    //     cachedDevice: blob.used_cached_device,
    //     tags: blob.tags,
    //     tunnel: blob.assigned_tunnel_id,
    // }
}


async function getAsset(sauceCreds, assetUrl, downloadPath = null) {
    try {
        const res = await fetch(assetUrl, {
            method: 'get',
            headers: {'Authorization': 'Basic ' + Buffer.from(`${sauceCreds.username}:${sauceCreds.key}`).toString('base64')}
        })
        const jobId = assetUrl.split('/').at(-2)
        const downloadLocation = mkDownloadFolder(downloadPath, jobId)
        var asset = assetUrl.split('/').at(-1)
        // tired of just files without file extenions
        if (!asset.includes('.json')) {
            asset = asset === 'video.mp4' ? asset : asset + '.json'
        }
        const filePath = path.join(`${downloadLocation}`, `${jobId}_${asset}`);
        try {
            await pipeline(res.body,fs.createWriteStream(filePath, { flags: 'w+'}));
        } catch (error) {
            console.error(error)
        }
        if (asset !== 'video.mp4') {
            fs.readFile(filePath, 'utf-8', (err, contents) => {
                if (err) {
                    console.error(err)
                    return 1;
                }
                // TODO getting SyntaxError: Unexpected end of JSON input
                // at JSON.parse (<anonymous>)
                // at file:///Users/mdobeck/commandConverter/lib/apiCall.js:131:42
                // at FSReqCallback.readFileAfterClose [as oncomplete] (node:internal/fs/read/context:68:3)
                // NOTE ^ the above means that while the asset is listed the contents are gone.
                // So there's just a bunch of zero byte files or files that have "[]" in them.
                // Need to test for this during download of each asset

                // do this because sauce throws bag unformatted files :(
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


function mkDownloadFolder(folderPath = null, jobId) {
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