<p align="center">
    <a href="https://github.com/documente/documente">
        <img alt="Logo for the Documenté literate testing framework" src="https://github.com/documente/documente.github.io/raw/main/public/logo.svg" title="Documenté logo" width="200"/>
    </a>
</p>

<h3 align="center">Welcome to Documenté</h3>

<p align="center">
The Javascript literate testing framework
</p>

## What is Documenté?

Documenté is a literate testing framework that allows you to generate automated tests from user documentation.

It integrates into test frameworks such as [Cypress](https://www.cypress.io/) or [Playwright](https://playwright.dev/), and builds on concepts from [Behaviour-Driven-Development](https://en.wikipedia.org/wiki/Behavior-driven_development) and [literate programming](https://en.wikipedia.org/wiki/Literate_programming).

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

Documenté integrates into projects with a end-to-end testing framework installed. You can refer to [Cypress](https://docs.cypress.io/guides/getting-started/installing-cypress) or [Playwright](https://playwright.dev/docs/intro) installation instructions to get started.

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

Create a `documente.config.yml` file at the root of your project:

```yaml
runner: playwright                  # either "playwright" or "cypress"
input: docs/**/*.md                 # location of documentation to extract tests from
outputDir: tests                    # directory in which tests should be generated
selectors: documente/selectors.yaml # path to selectors file
```

### Describing your application with a selectors file

Documenté expects a YAML file with a tree-like representation of your application.

Here is an example selectors file, describing a login form containing a login field, a password field and a confirm button, as well as error and welcome message containers.

Documenté uses the [standard HTML5 selectors](https://drafts.csswg.org/selectors/) which allow you to locate HTML elements by type, class, ID, attribute...

```yaml
login form:
  _selector: .login-form
  login field: input[type="text"]
  password field: input[type="password"]
  confirm button: button[type="submit"]
login error message: .error-message
welcome message: .welcome-message
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
```

In order to login, simply type your username and password in the login form and click on the login button.

```phrase
In order to login:
- I type "user01" on login form login field
- I type "password" on password field
- I click on login form confirm button
```
````

You can place the specifications in any folder you want, as long as you specify the correct path in the `input` property of the `documente.config.yml` file.
A good practice is to place the specifications in a `docs` folder at the root of your project.

Take a look at the [Phrasé repository](https://github.com/documente/phrase) for more information about the test syntax.

The [example project](https://github.com/documente/example-sut) will also give you a good idea of how to write specifications.

### Extracting the specifications

To extract the specifications from the documentation files, run `documente` from the root of your project:

```bash
documente
```

This will generate test files in the output folder.

### Running the tests

You can run the tests just like you would run other Cypress or Playwright tests.

With Cypress:

```bash
cypress open
```

Or with Playwright:

```bash
playwright test --ui
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
