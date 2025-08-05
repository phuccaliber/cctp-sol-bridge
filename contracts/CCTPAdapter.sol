// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import {IReceiverV2} from "lib/evm-cctp-contracts/src/interfaces/v2/IReceiverV2.sol";
import {IMessageTransmitterV2} from "lib/evm-cctp-contracts/src/interfaces/v2/IMessageTransmitterV2.sol";

contract CCTPAdapter is IReceiverV2 {
    IMessageTransmitterV2 public immutable cctpMessageTransmitter;
    constructor(address initCctpMessageTransmitter) {
        cctpMessageTransmitter = IMessageTransmitterV2(initCctpMessageTransmitter);
    }

    function receiveMessage(bytes calldata message, bytes calldata attestation) external override returns (bool success) {
        cctpMessageTransmitter.receiveMessage(message, attestation);
        return true;
    }
}