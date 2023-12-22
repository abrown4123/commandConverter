function rdcInfo(blob, region) {
   let info = {
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
            package: blob.application_summary.packageName,
            app: blob.application_summary.filename,
            sauceStorageId: blob.application_summary.appStorageId,
            appName: blob.application_summary.packageName,
            appVersion: blob.application_summary.version,
            appMinMaxVersion: `${blob.application_summary.minOsVersion} - ${blob.application_summary.targetOsVersion}`
        }
    }
    return JSON.stringify(info, null, 4)
}

function nonAppInfo(blob, region) {
    let info = {
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
    }
    return JSON.stringify(info, null, 4)
}

function liveDesktopWeb(blob, region, user, jobId) {
    let info = {
        owner: blob.owner,
        status: blob.consolidated_status,
        region: region,
        browser: `${blob.browser} ${blob.browser_version}`,
        os: blob.os,
        automationType: blob.automation_backend,
        manual: blob.manual,
        id: blob.id,
        tags: blob.tags,
        tunnel: blob.assigned_tunnel_id,
        pre_run: blob.pre_run_executable
    }
    if (blob.log_url !== null) {
        let assets = {
            video: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/video.mp4`,
            selenium_log: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/selenium-server.log`,
            sauce_log: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/log.json`
        }
        info = { ...info, assets }
    }
    return JSON.stringify(info, null, 4)
}

function emusim(blob, region, user, jobId) {
    let info = {
        owner: blob.owner,
        status: blob.consolidated_status,
        app: blob.app,
        browser: `${blob.browser} ${blob.browser_version}`,
        os: blob.os,
        automationType: blob.automation_backend,
        manual: blob.manual,
        id: blob.id,
        region: region,
        tags: blob.tags,
        tunnel: blob.assigned_tunnel_id,
    }
    if (blob.log_url !== null) {
        let assets = {
            video: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/video.mp4`,
            selenium_log: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/selenium-server.log`,
            sauce_log: `https://${region}/rest/v1/${user}/jobs/${jobId}/assets/log.json`
        }
        info = { ...info, assets }
    }
    return JSON.stringify(info, null, 4)
}

export { rdcInfo, nonAppInfo, liveDesktopWeb, emusim };