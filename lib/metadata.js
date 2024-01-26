function isRDC(blob) {
    if (blob.hasOwnProperty('application_summary')) {
        return true
    }

    if (blob.hasOwnProperty('test_report_type') && blob.hasOwnProperty('device_type')) {
        if (blob['test_report_type'] === "LIVE" && blob['device_type'] === 'real_device') {
            return true
        }
    }

    if (blob.hasOwnProperty('browser')) {
        if (blob['browser'].toLowerCase() === 'ios'
        || blob['browser'].toLowerCase() === 'android' 
        || blob['browser'].toLowerCase() === 'iphone') {
            return true
        }
    }
}

function isVDC(blob) {
    if (blob.hasOwnProperty('browserName') && blob['browserName'] !== null) {
        return true
    }

    if (blob.hasOwnProperty('automation_backend') && blob['automation_backend'] !== null) {
        if (blob["automation_backend"] === "espresso" || blob["automation_backend"].includes("xcui")) {
            return true
        }
    }
}

function rdcInfo(blob, region) {
   let info = {
        owner: blob.owner_sauce,
        status: blob.status,
        region: region,
        automationType: blob.test_report_type,
        device: blob.device_descriptor.id,
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

function automatedDesktop(blob, region, user, jobId) {
    let info = {
        owner: blob.owner,
        status: blob.consolidated_status,
        region: region,
        browser: `${blob.browser} ${blob.browser_version}`,
        os: blob.os,
        automationType: `selenium v${blob.selenium_version}, ${blob.automation_backend}`,
        webdriver_protocol: blob.webdriver_protocol,
        manual: blob.manual,
        id: blob.id,
        name: blob.name,
        tags: blob.tags,
        build: blob.build,
        tunnel_id: blob.assigned_tunnel_id,
        tunnel_name: blob.base_config.tunnelIdentifier,
        pre_run: blob.pre_run_executable,
        creation_time: blob.creation_time,
        start_time: blob.start_time,
        creation_start_delta: blob.start_time - blob.creation_time
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
        error: blob.error,
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

export { rdcInfo, nonAppInfo, liveDesktopWeb, automatedDesktop, emusim, isRDC, isVDC };