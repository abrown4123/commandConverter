let pythonMappings = {
    GET: {
      url: "driver.title"
    },
    POST: {
      url(website) {return `driver.get("${website}")`},
      session: "Sesssion Created!",
      element: {
        css(variable, selector) {return `let ${variable} = driver.find_element(By.CSS, ${selector})`}
      },
      click(elementId) {return `${elementId}.click()`},
      sendKeys(elementId, value) {return `${elementId}.send_keys(${value})`}
    },
    DELETE: {
      session: "driver.quit()"
    }
}

export default pythonMappings;