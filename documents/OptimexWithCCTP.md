# Overview
This document outlines the integration between Optimex and Circle's Cross-Chain Transfer Protocol (CCTP) for facilitating cross-chain USDC transfers. It details how CCTP V2's mint-burn mechanism and hook functionality enable seamless token bridging, with a specific focus on transfers between Bitcoin and Solana networks.

The document covers:
- CCTP protocol overview and fee structure
- CCTP V2 workflow and components
- Optimex's integration patterns for BTC-SOL and SOL-BTC transfers

## CCTP

### Overview 

The [CCTP Protocol](https://developers.circle.com/cctp) offers a mint-burn mechanism for USDC, enabling users to bridge their USDC tokens across multiple blockchain networks.

CCTP V2 introduces fast settlement times and hook functionality, enabling quick and composable transactions across multiple blockchains.

For transfers between Ethereum and Solana, the protocol charges a fee of 1 basis point (0.01%) as documented in the [CCTP API](https://developers.circle.com/api-reference/cctp/all/get-burn-usdc-fees). This fee is separate from any gas fees required on the source and destination chains.

### How CCTP V2 Works
![Flow](./assets/CCTPV2.jpg)

CCTP V2 works in 3 steps:
1. User initiates a burn transaction on the source chain.
2. Circle's attestation service validates the burn transaction and generates a cryptographically signed attestation.
3. Once the attestation is generated, it is submitted to the destination chain where the equivalent USDC tokens are minted to the recipient's address.

**Note**: CCTP does not provide a relayer service for steps 3. Using third-party relayer services (such as Wormhole) may incur additional fees.

## Optimex integrate with CCTP

### BTC - SOL
![Flow](./assets/BTC_SOL_CCTP.png)

### SOL - BTC
![Flow](./assets/SOL_BTC_CCTP.png)