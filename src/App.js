import './App.css';
import React, { useEffect, useState } from 'react';
import sampleData from './log';
import pythonMappings from './pythonMappings';
import DisplayCode from './components/DisplayCode';

function App() {

  const [code, setCode] = useState([])

  const locatorStrategy = request => {
    if(request.using.includes("css")) {
      return "css"
    }
  }

  const getElementId = result => {
    for(let propName in result) {
      return result[propName];
    }
  }

  const routePath = (path, method, request, result, testCommands, i) => {
    if (method === "POST" && path === "url") {
      return pythonMappings[method][path](request.url) 
    } 
    if (method === "POST" && path === "element") {
      let strategy = locatorStrategy(request)
      testCommands[getElementId(result)] = `elem${i}` 
      return pythonMappings[method][path][strategy](`elem${i}`, request.value)
    }
    if (method === "POST" && path.includes("click")) {
      return pythonMappings[method]["click"](testCommands[request.id])
    }
    if (method === "POST" && path.includes("value")) {
      return pythonMappings[method]["sendKeys"](testCommands[request.id], request.text)
    }
    return pythonMappings[method][path]
  }

  const convertCode = () => {
    let testCommands = [];
    sampleData.forEach((command, i) => {
      try {
        let {path, method, request, result} = command;
        path = path.includes("session") ? "session" : path
        testCommands[i] = {
          id: i, 
          command: routePath(path, method, request, result, testCommands, i)
        }
      } catch(e) {
        console.log(command)
        console.log(e)
      }
    })
    setCode(testCommands)
  }

  useEffect(() => {
    console.log(code);
  }, [code])


  return (
    <div className="App">
      <h1>Code Converter</h1>
      <div>
        <button onClick={convertCode}>
          Convert!
        </button>
      </div>
      <code>
        {code.map(commandObj => 
          <DisplayCode 
            key={commandObj.id}
            command={commandObj.command} 
          />
        )}
      </code>
    </div>
  );
}

export default App;
