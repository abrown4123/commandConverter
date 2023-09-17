let pythonMappings = {
    GET: {
      url: "driver.title"
    },
    POST: {
      url(website) {return `driver.get("${website}")`},
      session: "Sesssion Created!"
    },
    DELETE: {
      session: "driver.quit()"
    }
}

export default pythonMappings;