# Documenté

> A literate testing framework to generate automated tests from documentation files

It is based on [Cypress](https://www.cypress.io/) and builds on concepts from [Behaviour-Driven-Development](https://en.wikipedia.org/wiki/Behavior-driven_development)
and [literate programming](https://en.wikipedia.org/wiki/Literate_programming).

## Why Documenté?

Automated testing is a key component of modern software development.
It allows to ensure that the software behaves as expected and to detect regressions.

However, writing and maintaining automated tests can be a tedious and time-consuming task.
This is especially true for end-to-end tests, which are often written in a way that is not very readable and not very maintainable.

Documenté aims to solve this problem by providing a framework that allows to write automated tests
in an almost natural language called [Phrasé](https://github.com/documente/phrase), using a syntax that is very close to the one used in BDD (Behaviour-Driven-Development).

Tests written with [Phrasé](https://github.com/documente/phrase) are meant to be included in the documentation of the application.
This allows to keep the documentation and the tests in sync, and to make the tests more accessible to non-technical people.

Regressions are easier to detect, as the tests are written in a way that is closer to the way the application is used.

Specification issues are also easier to spot and fix, as they are located in the same place as the tests.

## Getting started

### Prerequisites

If you don't have Cypress installed, follow the [Cypress installation instructions](https://docs.cypress.io/guides/getting-started/installing-cypress).

### Installation

Install Documenté as a dev dependency:

```bash
yarn add --dev @documente/documente
```

Or with npm:

```bash
npm install --save-dev @documente/documente
```

You can also install Documenté globally:

```bash
npm install --global @documente/documente
```

### Configuration

Create a `documente.config.js` file at the root of your project:

```js
module.exports = {
  // A path or an array of globs pointing to the documentation files to extract the specifications from
  input: 'docs/**/*.md',
  // The path to the folder where the specifications will be written. Defaults to 'cypress/e2e'
  outputDir: 'cypress/e2e',
  // The path to a YAML file containing the selectors
  selectors: 'documenté/selectors.yaml',
  // (Optional) The path to a Javascript file containing external functions
  externals: 'documenté/externals.js',
};
```

### Writing specifications

Specifications are written in Markdown files, using the [Phrasé](https://github.com/documente/phrase) syntax.

Here is an example of a specification file:

````markdown
# How to use my awesome application

Login into the application to be greeted by a cool welcome message.

```phrase
when I login
then welcome message should be visible
and it should have text "Welcome, user01!"
done
```

In order to login, simply type your username and password in the login form and click on the login button.

```phrase
In order to login:
- I type "user01" on login form login field
- I type "password" on password field
- I click on login form confirm button
done
```
````

You can place the specifications in any folder you want, as long as you specify the correct path in the `input` property of the `documente.config.js` file.
A good practice is to place the specifications in a `docs` folder at the root of your project.

Take a look at the [Phrasé repository](https://github.com/documente/phrase) for more information about the test syntax.

The [example project](https://github.com/documente/example-sut) will also give you a good idea of how to write specifications.

### Extracting the specifications

To extract the specifications from the documentation files, run `documente` from the root of your project:

```bash
documente
```

This will generate Cypress test files in the output folder.

### Running the tests

To run the tests, use the Cypress CLI:

```bash
cypress run
```

Or the Cypress GUI:

```bash
cypress open
```

## Example project

You can find an example repository [here](https://github.com/documente/example-sut) with a simple application and a set of specifications.

## Contributing

Any contributions you make are _greatly appreciated_.

For suggestions and improvements, feel free to fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!

## License

Distributed under the GNU GPL3 License.

See `LICENSE` for more information.

## Contact

Pierre-Clément KERNEIS - pc.kerneis@gmail.com

Project Link: https://github.com/documente/documente
