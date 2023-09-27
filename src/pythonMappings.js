let pythonMappings = {
    GET: {
      url: "driver.title",
      text(elementId, value) {return `${elementId}.text`}
    },
    POST: {
      url(website) {return `driver.get("${website}")`},
      session: "Sesssion Created!",
      element: {
        css(variable, selector) {return `let ${variable} = driver.find_element(By.CSS, "${selector}")`},
        xpath(variable, selector) {return `let ${variable} = driver.find_element(By.XPATH, "${selector}")`}
      },
      elements: {
        css(variable, selector) {return `let ${variable} = driver.find_elements(By.CSS, "${selector}")`},
        xpath(variable, selector) {return `let ${variable} = driver.find_elements(By.XPATH, "${selector}")`}
      },
      click(elementId){return `${elementId}.click()`},
      sendKeys(elementId, value) {return `${elementId}.send_keys("${value}")`},
      execute(script){return `driver.execute_script("${script}")`}
    },
    DELETE: {
      session: "driver.quit()"
    }
}

export default pythonMappings;