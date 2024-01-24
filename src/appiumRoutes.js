import pythonAppiumMappings from "./pythonAppiumMappings";

const appiumRoutePath = (command, testCommands, i) => {
    let {httpMethod, httpPathInfo, requestBody, responseBody} = command
    let request = JSON.parse(requestBody)
    
    if (httpMethod === "POST" && httpPathInfo === "/url") return pythonAppiumMappings[httpMethod]["url"](request.url); //This path is driver.get
    console.log("appium logs reached");
}

export default appiumRoutePath;
