# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.2.2"></a>
## [0.2.2](https://github.com/coast-team/mute-crypto/compare/v0.2.0...v0.2.2) (2018-08-13)


### Bug Fixes

* **dependency:** replace crypto-api-wrapper by mute-crypto-helper ([4aa87fa](https://github.com/coast-team/mute-crypto/commit/4aa87fa))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/coast-team/mute-crypto/compare/v0.1.1...v0.2.0) (2018-08-10)


### Bug Fixes

* **cycle:** properly update myId if changed ([b3dea0d](https://github.com/coast-team/mute-crypto/commit/b3dea0d))
* **keyagreement:** restart cycle on each member leave ([d3488d6](https://github.com/coast-team/mute-crypto/commit/d3488d6))


### Code Refactoring

* **keyagreement:** change API, remove rxjs dependency ([0510bce](https://github.com/coast-team/mute-crypto/commit/0510bce))
* move source, rename classes, clean up ([a757f85](https://github.com/coast-team/mute-crypto/commit/a757f85))


### Features

* **debug:** export enableDebug function ([64d1041](https://github.com/coast-team/mute-crypto/commit/64d1041))
* send key id along with each encrypted message ([ff630e9](https://github.com/coast-team/mute-crypto/commit/ff630e9))


### BREAKING CHANGES

* Crypto class becomes MuteCrypto. generateId function is now a static method of
MuteCrypto class.
* **keyagreement:** KeyAgreementBD has changed. No longer export GroupStatus. KeyStatus becomes
KeyState.



<a name="0.1.1"></a>
## [0.1.1](https://github.com/coast-team/mute-crypto/compare/v0.1.0...v0.1.1) (2018-07-31)


### Bug Fixes

* **pack:** remove unnecessary files from package ([a9cc62e](https://github.com/coast-team/mute-crypto/commit/a9cc62e))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/coast-team/mute-crypto/compare/v0.0.2...v0.1.0) (2018-07-31)


### Features

* **keyagreement:** continuing protocol ([d0a4b54](https://github.com/coast-team/mute-crypto/commit/d0a4b54))



<a name="0.0.2"></a>
## [0.0.2](https://github.com/coast-team/mute-crypto/compare/v0.0.1...v0.0.2) (2018-07-18)



<a name="0.0.1"></a>
## 0.0.1 (2018-07-18)


### Features

* export symmetric crypto ([73ef29f](https://github.com/coast-team/mute-crypto/commit/73ef29f))
