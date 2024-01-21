# Minimal Documenté Example

This is a minimal example of a [Documenté](https://documente.github.io/) project.

## Project overview

### The application under test

The application under test is the [example.com](https://example.com) website.

It's a simple website that displays a welcome message. That's not much, but it's enough to demonstrate
how Documenté works.

### The test files

The test files are generated from this very README file. The Documenté CLI extracts the test cases from
Markdown code blocks such as the following:

```phrase
When I visit "https://example.com"
then title should be visible
and it should contain text "Example Domain"
```

This test case navigates to the example.com website and checks that the title is visible and contains the text "Example Domain".

Here is another example:

```phrase
Given I visit "https://example.com"
when I click on More information link
then title should not exist
```

This test case navigates to the example.com website and clicks on the "More information" link.
Then it checks that the title does not exist: since the page has been redirected, the title is not visible anymore.

To learn more about the syntax of the test cases, see the [Phrasé language overview](https://documente.github.io/language-overview.html) page.

### The configuration file

The configuration file is a YAML file that specifies, among other things:
- the test runner to use (here, Playwright)
- the input files to extract tests from (here, this README file)
- the selectors file that represents the application under test as a tree of selectors

Here is the configuration file for this project:

```yaml
runner: playwright
input: README.md
selectors: documente.selectors.yml
```

The full list of configuration options is available on the [Configuration file reference](https://documente.github.io/cli-configuration.html) page.

### The selectors file

The selectors file is a YAML file that defines the selectors used in the test files.

Here is the selectors file for this project:

```yaml
title: h1
More information link: a[href="https://www.iana.org/domains/example"]
```

## Running the tests

### Prerequisites

To generate and run the tests, you need to have Node.js installed on your computer.

### Generate the tests

To get started, clone this repository on your computer.

```bash
git clone https://github.com/documente/minimal-example.git
```

Then, install the dependencies:

```bash
cd minimal-example
npm install
npx playwright install
```

To generate the tests, run the following command in the project directory:

```bash
npm run generate-tests
```

This command will generate the test files in the `tests` directory.

### Run the tests

To run the tests, run the following command in the project directory:

```bash
npm run test-ui
```

This command will open the Playwright test runner from which you can run the generated tests.

Alternatively, you can generate and run the tests in headless mode in a single command with:

```bash
npm run test
```

## Running the tests in CI

This project is configured to run the tests in CI using GitHub Actions.

The workflow is defined in the `.github/workflows/test.yml` file.