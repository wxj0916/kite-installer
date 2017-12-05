'use strict';

const AccountManager = require('../../lib/account-manager');
const Login = require('../../lib/install/login');
const LoginElement = require('../../lib/elements/atom/login-element');
const {withFakeServer, fakeResponse, withAccountManager, withRoutes, startStep} = require('../spec-helpers');

describe('Login', () => {
  let step, view, promise;

  withAccountManager();

  beforeEach(() => {
    view = new LoginElement();
    step = new Login({view});
  });

  withFakeServer([[
    o => o.method === 'POST' && o.path === '/api/account/login',
    o => fakeResponse(200, '', {
      headers: {
        'set-cookie': ['kite-session=foobar'],
      },
    }),
  ]], () => {
    describe('when started with an account with email and password', () => {
      beforeEach(() => {
        promise = startStep(step, {
          account: {
            email: 'some.email@company.com',
            invalid: false,
            exists: true,
            hasPassword: true,
            reason: 'email address already in use',
          },
        });
      });

      it('fills the input with the provided email', () => {
        expect(view.querySelector('input[type="email"]').value)
        .toEqual('some.email@company.com');
      });

      describe('filling the password field and submitting the step', () => {
        it('resolves the pending promise', () => {
          view.querySelector('input[type="password"]').value = 'password';
          view.form.dispatchEvent(new Event('submit'));

          waitsForPromise(() => promise.then(state => {
            expect(state.account.sessionId).toEqual('foobar');
          }));
        });
      });

      describe('clicking on the forgot password button', () => {
        it('opens the reset password form in a browser', () => {
          spyOn(AccountManager, 'resetPassword').andCallFake(() => {});

          view.forgotPassword.dispatchEvent(new Event('click'));

          expect(AccountManager.resetPassword).toHaveBeenCalledWith({
            email: 'some.email@company.com',
          });
        });
      });

      describe('when the login request fail', () => {
        withRoutes([[
          o => o.method === 'POST' && o.path === '/api/account/login',
          o => fakeResponse(401),
        ]]);

        it('rejects the pending promise', () => {
          view.querySelector('input[type="password"]').value = 'password';
          view.form.dispatchEvent(new Event('submit'));

          waitsForPromise({shouldReject: true}, () => promise);
        });
      });
    });
  });
});