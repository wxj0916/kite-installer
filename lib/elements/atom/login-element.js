'use strict';

const {CompositeDisposable} = require('atom');
const {addDisposableEventListener} = require('../../atom-helper');

class LoginElement extends HTMLElement {
  static initClass() {
    return document.registerElement('kite-atom-login', {
      prototype: this.prototype,
    });
  }

  get data() {
    return {email: this.input.value, password: this.password.value};
  }

  createdCallback() {
    this.innerHTML = `
    <p>It seems like you already have a Kite account. Sign in with your login info.</p>
    <form novalidate>
      <input class='input-text' name="email" type="email"></input>
      <input class='input-text' name="password" type="password"></input>
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
      <div class="secondary-actions">
        <a class="back">Back</a>
        <a class="reset-password secondary-cta">Forgot password</a>
      </div>
      <div class="status hidden"></div>
    </form>
    `;

    this.form = this.querySelector('form');
    this.input = this.querySelector('input[type="email"]');
    this.password = this.querySelector('input[type="password"]');
    this.submit = this.querySelector('button[type="submit"]');
    this.backButton = this.querySelector('a.back');
    this.forgotPassword = this.querySelector('a.reset-password');
    this.status = this.querySelector('.status');
  }

  release() {
    this.subscriptions && this.subscriptions.dispose();
    delete this.install;
    delete this.subscriptions;
  }

  init(install) {
    this.subscriptions = new CompositeDisposable();
    this.install = install;
    this.classList.remove('disabled');

    this.subscriptions.add(addDisposableEventListener(this.form, 'submit', () => {
      this.classList.add('disabled');
      this.install.emit('did-submit-credentials', this.data);
    }));

    this.subscriptions.add(addDisposableEventListener(this.forgotPassword, 'click', () => {
      this.install.emit('did-forgot-password');
    }));

    this.subscriptions.add(addDisposableEventListener(this.backButton, 'click', () => {
      this.install.emit('did-click-back');
    }));

    this.subscriptions.add(install.observeState(state => this.onStateChange(state)));
  }

  onStateChange(state) {
    if (state.account.email) {
      this.input.value = state.account.email;
    }

    if (state.account.password) {
      this.input.password = state.account.password;
    }

    if (state.error) {
      this.status.textContent = state.error.message;
      this.status.classList.remove('hidden');
    } else {
      this.hideError();
    }
  }

  hideError() {
    this.status.textContent = '';
    this.status.classList.add('hidden');
  }
}

module.exports = LoginElement.initClass();