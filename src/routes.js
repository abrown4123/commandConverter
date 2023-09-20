import pythonMappings from "./pythonMappings";

const locatorStrategy = request => {
  if(request.using.includes("css")) return "css"
  if(request.using.includes("xpath")) return "xpath"
}

const getIdFromPath = path => path.split("/")[1]

const getElementId = result => {
  for(let propName in result) {
    return result[propName];
  }
}

const routePath = (path, method, request, result, testCommands, i) => {
  if (method === "POST" && path === "url") return pythonMappings[method][path](request.url) //This path is driver.get

  if (method === "POST" && path.includes("element")) { //This path is findElem
    let strategy = locatorStrategy(request)
    testCommands[getElementId(result)] = `elem${i}` 
    return pythonMappings[method][path][strategy](`elem${i}`, request.value)
  }

  if (method === "POST" && path.includes("click")) {
    return pythonMappings[method]["click"](testCommands[getIdFromPath(path)]) //this is click
  }

  if (method === "POST" && path.includes("value")) return pythonMappings[method]["sendKeys"](testCommands[getIdFromPath(path)], request.text) //this is sendKeys

  if (pythonMappings[method][path] !== undefined) return pythonMappings[method][path] //for get methods that do not need an argument

  return `This command is not yet supported. ${method}: ${path}`
}

export default routePath;