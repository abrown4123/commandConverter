import pythonSeleniumMappings from "./pythonSeleniumMappings";

const locatorStrategy = request => {
  if(request.using.includes("css")) return "css"
  if(request.using.includes("xpath")) return "xpath"
}

const getTextValue = request => {
  if (request.text !== undefined) return request.text;
  return request.value.join('');
}

const getIdFromPath = path => path.split("/")[1]

const getElementId = result => {
  for(let propName in result) {
    return result[propName];
  }
}

const findElementsResults = (testCommands, result, i) => {
  result.forEach((value, iterator) => testCommands[Object.values(value)[0]] = `elements${i}[${iterator}]`);
  return '';
}

const findElementResults = (testCommands, result, i) => {
  if(result.length === 0) return '';
  if(result.error !== undefined) return ` # command returned ${result.error}`;
  if(result.message !== undefined) return ` # command returned ${result.message}`;
  testCommands[getElementId(result)] = `elem${i}`;
  return '';
}

const seleniumRoutePath = (command, testCommands, i) => {
  let {path, method, request, result} = command;
  let splitPath = path.split("/")
  let route = splitPath[splitPath.length-1]
  path = path.includes("session") ? "session" : path //post and delete sessions are assigned here
  
  if (method === "POST" && path === "url") return pythonSeleniumMappings[method][path](request.url) //This path is driver.get
  
  if (method === "POST" && path.includes("click")) {
    return pythonSeleniumMappings[method]["click"](testCommands[getIdFromPath(path)]) //this is click
  }

  if (method === "POST" && path === "execute") return pythonSeleniumMappings[method][path](request.script)

  if (method === "GET" && path.includes("text")) {
    return pythonSeleniumMappings[method]["text"](testCommands[getIdFromPath(path)])
  }

  if (method === "POST" && path.includes("value")) return pythonSeleniumMappings[method]["sendKeys"](testCommands[getIdFromPath(path)], getTextValue(request)) //this is sendKeys
  
  if (method === "POST" && (route === "element" || route === "elements")) { //This path is findElem
    let strategy = locatorStrategy(request)
    if(route === "element") return `${pythonSeleniumMappings[method][route][strategy](`elem${i}`, request.value)}${findElementResults(testCommands, result, i)}`
    if(route === "elements") return `${pythonSeleniumMappings[method][route][strategy](`elements${i}`, request.value)}${findElementsResults(testCommands, result, i)}`
  }

  if (pythonSeleniumMappings[method][path] !== undefined) return pythonSeleniumMappings[method][path] //for get methods that do not need an argument

  return `This command is not yet supported. ${method}: ${path}`
}

export default seleniumRoutePath;