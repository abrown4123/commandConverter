let pythonAppiumMappings = {
  POST: {
    url(website) {return `driver.get("${website}")`}
  }
}

export default pythonAppiumMappings;