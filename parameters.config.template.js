/*
* This is the configuration for the i18n-helper.
* in every configuration:
* srcDir - the full path to the sorce folder (the keys will be extracted from here)
* files - a regex to identify files to extract keys from (ex. /\.(js|hbs)$/ )
* patterns - a list of patterns each is a pattern
* pattern - a regex of the call to the translate function (ex. /[^'"]translate\([^)]*\)/g )
* pre - number of chars to ignore from start in the result (to prevent complex look-ahead)
* post - number of chars to ignore from end in the result
* inputFile - name of the g10n json files
* outputFile - the generated g10n json files (use the inputFile to override)
* the2StarsLang - each value is ** and the key (used for finding untranslated entries in the GUI)
* theBaseLang - missing keys will have the key in the value
* pathToLocaleDir - the folder containing the locale files
*/
module.exports = {
  configurations: [{
    srcDir: 'D:\\path\\to\\src',
    srcFiles: [{
      files: /\.(js|hbs)$/,
      patterns: [
        {pattern: /[^'"]translate\((['"][^)]*['"])(?:(?:[^'"])*)\)/g, group: 1},
        {pattern: /[^'"]\{\{t (['"][^)]*['"])(?:(?:[^'"])*)\}\}/g, group: 1}
      ]
    }]
  }],
  inputFile: 'kernel.json',
  outputFile: 'kernel2.json',
  the2StarsLang: /test/,
  theBaseLang: /(en-us|en-uk)/,
  pathToLocaleDir: 'D:\\path\\to\\locale'
}