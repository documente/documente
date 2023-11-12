import {withTree} from '../../../lib/src/cy-runner';

const test = withTree({
  loginForm: {
    _selector: '.login-form',
    loginField: 'input[type="text"]',
    passwordField: 'input[type="password"]',
    confirmButton: 'button[type="submit"]',
  },
  welcomeMessage: 'h1',
});

const baseUrl = 'http://localhost:3000/';

describe('template spec', () => {
  it('passes', () => {
    test `when I visit "${baseUrl}"
           and I type "username" on login form login field
           and I type "password" on password field
           and I click on login form confirm button
          then welcome message should be visible
           and welcome message should have text "Welcome, username!"`;
  });
})