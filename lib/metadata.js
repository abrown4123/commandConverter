

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

export { rdcInfo };