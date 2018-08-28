# Mute-Crypto

This library implements the conference key distribution system designed by Burmester and Desmedt[1].

## Purpose

To secure the communications in the peer-to-peer collaborative editor [Mute](https://github.com/coast-team/mute) it is fundamental to implement an end-to-end encryption system. The main characteristic of this kind of system is that the secret key (used to encrypt the communications) must only be known to the communicating parties (i.e. no server/intermediary must have access to the keys). It is also essential that the secret keys must not be communicated through the network but rather negotiated. This goal is achieved by a protocol that allow the parties to compute the same key without ever send it through the network (even by out-of-band channel). One of these is the Diffie-Hellman Key exchange protocol. Mute-Crypto implements an n-party Diffie-Hellman key exchange generalization of this protocol.

## Technical aspects

- The cryptographic primitives are provided by [Mute-Crypto-Helper](https://github.com/coast-team/mute-crypto-helper).
- There is a rekeying each time a member join or leave the session.

[1]: [A Secure and Efficient Conference Key Distribution System](https://doi.org/10.1007/BFb0053443)
