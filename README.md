# i18n-helper

A tool to extract i18n keys and help maintain the g10n files

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

This tool asumes that all translation calls are made with the actual keys and not using a concatination or variable to get the key

```
translate("message.key.in.g10n.file")
translate("message.key.in.g10n.file" , var1 , var2)
```

### Installing

#### Manualy running the i18n-helper
* clone the repository
	git clone https://github.com/new-proimage/i18n-helper.git i18n-helper/
* run npm install
* edit the parameters.config.template.js with any editor, and save as parameters.config.js
* run the utility
	node index.js -a -o -c ./parameters.config.template.js

## Authors

* **Ofer Skulsky** - *Initial work* - [New ProImage](http://www.new-proimage.com/)

## License

This project is licensed under the LGPL License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Ofer Skulsky is a member of tikal knoledge (http://tikalk.com).
* This project came to help manage the i18n of new pro-image, it helps to find untranslated and bad translations. 
