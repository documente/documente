# What is Documenté?

Documenté is a literate testing framework that allows you to generate automated tests from user documentation.

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
