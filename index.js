#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require("path");
const readline = require('readline');
let config = {};

const badKeyRegex = /(['"])\W?\+[^+]+\+\W?\1/g;
const problemTypeNoTranslation = 'Needs translation';
const problemTypeNotInSource = 'key not found in source files';
const problemTypeOk = 'OK';
const problemTypeBadTranslation = 'Bad translation / value does not match convention';
const problemTypeAsDefault = 'May not have been translated';


let isAll = false;
let isOverride = false;

let targetFolders = [];
let allI18NFiles = [];
let allSrcKeys = [];
let reports = [];
let buffer = '';

////////////////////////////////////////////////////

if (process.argv.length <= 2) {
    console.log(`
Usage: node i18n-helper\index.js [-a -o] -c <config_file.js>
options:
  -a --All : Check all i18n Languages
  -c --Config : config file to use.
  -o --Override : Override all keys
`);
    process.exit(-1);
}

isAll = process.argv.filter(a => a.toLowerCase() === '-a' || a.toLowerCase() === '--all').length > 0
isOverride = process.argv.filter(a => a.toLowerCase() === '-c' || a.toLowerCase() === '--config').length > 0

let configFile = {};
process.argv.forEach(function (val, index, array) {
  if(val.toLowerCase() === '-c' || val.toLowerCase() === '--Config') {
    configFile = array[index + 1];
  }
});

if ('string' === typeof configFile && fs.statSync(configFile).isFile()) {
  config = require(configFile);
  main();
} else {
  console.log('could not find configuration file');
  process.exit(-2);
}

////////////////////////////////////////////////////

function main(options) {
  loadConfiguration();
  laodLangFiles();
  lookupKeys();
  handleOutput();
}

function loadConfiguration() {
  let configurations = config.configurations;
  for (let i = 0; i < configurations.length; i++) {
    let configuration = configurations[i];
    targetFolders[configuration.srcDir] = targetFolders[configuration.srcDir] ? configuration.srcFiles.concat(targetFolders[configuration.srcDir]) : configuration.srcFiles;
    configuration.srcDir
  }
}

function laodLangFiles() {
  const location = config.pathToLocaleDir;
  const the2StarsLang = config.the2StarsLang;
  const inputFile = config.inputFile;
  if (isAll) {
    let filenames = fs.readdirSync(location);
    filenames.forEach(function (filename) {
      let fullfileName = path.join(location, filename, inputFile);
      if (fs.statSync(path.join(location, filename)).isDirectory() && !(filename === 'zh-tw')) {
        allI18NFiles[filename] = JSON.parse(fs.readFileSync(fullfileName, 'utf8'))
      }
    });
  } else {
    allI18NFiles[the2StarsLang] = JSON.parse(fs.readFileSync(path.join(location, the2StarsLang, inputFile), 'utf8'));
  }
}

/////////////////////////////////////////////////////////////////////
// what does what
// file - this is the file the key comes from
// langFiles - all the locales in memory
// match - the key in the code
// lang - the locale
// langMappings[match] - the value for the key in the current locale
/////////////////////////////////////////////////////////////////////

function lookupKeys() {
  for (let target in targetFolders) {
    parseDir(target , targetFolders[target]);
    let dirs = fs.readdirSync(target);
  }
}

function parseDir(target, patterns) {
  fs.readdirSync(target).forEach(function (fileName) {
    let file = path.join(target, fileName);
    if (fs.statSync(file).isDirectory()) {
      parseDir(file, patterns);
    } else if (fs.statSync(file).isFile()) {
      let buffer = '';
      for (let i = 0; i < patterns.length; i++) {
        if (file.match(patterns[i].files)) {
          let data = fs.readFileSync(file, 'utf8');
          for (let j = 0; j < patterns[i].patterns.length; j++) {
            let results = [];
            let regex = new RegExp(patterns[i].patterns[j].pattern);
            let group = patterns[i].patterns[j].group;
            while ((results = regex.exec(data)) !== null) {
              let key = results[group];
              buffer += `${file} + ${patterns[i].patterns[j].pattern} -> ${key}\n`;
              console.log(`${file} + ${patterns[i].patterns[j].pattern} -> ${key}`);
              if (badKeyRegex.match(key)) {
                let msg = `${file} -> ${key} is a concatenation of Strings and values and can not be handled\n`;
                buffer += msg + '\n';
                console.log(msg);
              } else if (key.startsWith('"') || key.startsWith("'")) {
                allSrcKeys.push(key.substring(1, key.length - 1));
              } else {
                let msg = `${file} -> ${key} is not a string and can not be handled\n`;
                buffer += msg + '\n';
                console.log(msg);
              }
            }
          }
        }
      }
      fs.appendFileSync(`translate.log`, buffer);
    }
  });
}

function handleOutput() { 
  buildMsgTree();
  printReport();
  saveLangFile();
}

function buildMsgTree(){
  const theBaseLang = config.theBaseLang;
  const the2StarsLang = config.the2StarsLang;
  let theProblem = '';
  let newValue = '';
  for (let lang in allI18NFiles) {
    let usedKeys = [];
    let currentKeys = allI18NFiles[lang];
    let is2StarsLang = lang.match(the2StarsLang);
    let isBaseLang = lang.match(theBaseLang);
    reports[lang] = [];
    for (let key in allSrcKeys) {
      let theKey = allSrcKeys[key];
      let match = currentKeys[theKey];
      if ("undefined" === typeof match) {
        theProblem = problemTypeNoTranslation;
      } else if(match.match(/^==.*==$/)){
        if(match.match(`==${theKey}==`)) {
          theProblem = problemTypeNoTranslation;
        } else {
          theProblem = problemTypeBadTranslation;
        }
      } else if ( is2StarsLang ? !match.match(/^\*\*.*/) : match.match(/^\*\*.*/)) {
        theProblem = problemTypeBadTranslation;
      } else if (!isBaseLang && match === theKey) {
        theProblem = problemTypeAsDefault;
      } else {
        theProblem = problemTypeOk;
      }
      
      if("undefined" === typeof reports[lang][theProblem]) {
        reports[lang][theProblem] = [];
      }
      newValue = getNewValue(theProblem , theKey , match , lang);
      addNewValue(reports, lang, theProblem, usedKeys, theKey, newValue);
    }
    theProblem = problemTypeNotInSource;
    if("undefined" === typeof reports[lang][theProblem]) {
      reports[lang][theProblem] = [];
    }
    let otherKeys = Object.keys(currentKeys).filter(x=>{{allSrcKeys.filter(xx=>'undefined' !== typeof currentKeys[x]).length>0}});
    for(let k in otherKeys) {
      newValue = getNewValue(theProblem , otherKeys[k] , currentKeys[otherKeys[k]] , lang);
      addNewValue(reports, lang, theProblem, usedKeys, theKey, newValue);
    }
  }
}

function addNewValue(reports, lang, theProblem, usedKeys, theKey, newValue) {
  if ("undefined" === typeof usedKeys[theKey]) {
    usedKeys[theKey] = 1;
    reports[lang][theProblem].push({ key: theKey, value: newValue });
    allI18NFiles[lang][theKey] = newValue;
  }
}

function getNewValue(problem, theKey, match, lang) {
  const theBaseLang = config.theBaseLang;
  const the2StarsLang = config.the2StarsLang;
  if (lang.match(theBaseLang)) {
    return theKey;
  }
  if (lang.match(the2StarsLang)) {
    return `**${theKey}`;
  }
  switch (problem) {
    case problemTypeNoTranslation:
      return `==${theKey}==`;
    case problemTypeAsDefault:
    case problemTypeBadTranslation:
    case problemTypeNotInSource:
    case problemTypeOk:
      return match;
  }
}

function printReport(){
  const localeDir = config.pathToLocaleDir;
   for (let lang in reports) {
    let report = path.join(localeDir,lang,`report_${lang}.txt`);
    let data = `Auto generated at: ${new Date().toLocaleString()} (UTC: ${new Date().toISOString(). replace(/T/, ' ').replace(/\..+/, '')})`;
    for (let msg in reports[lang]) {
      data += `


==${msg.replace(/./g,'=')}==
= ${msg} =
==${msg.replace(/./g,'=')}==
`;
      reports[lang][msg].forEach(msgData => {
        data += `${msgData.key}\n`;
      });
        
    }
    fs.writeFileSync(report, data);
  }
}

function saveLangFile(){
  const localeDir = config.pathToLocaleDir;
  const outputFile = config.outputFile;
  if (isAll) {
    for (let lang in reports) {
      fs.writeFileSync(path.join(localeDir, lang, outputFile), JSON.stringify(allI18NFiles[lang] , null , 4), 'utf8');
    }
  } else {
    fs.writeFileSync(path.join(localeDir, the2StarsLang, outputFile), JSON.stringify(allI18NFiles[the2StarsLang] , null , 4), 'utf8');  
  }
}