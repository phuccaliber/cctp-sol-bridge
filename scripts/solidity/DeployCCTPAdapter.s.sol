// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "forge-std/Script.sol";
import {CCTPAdapter} from "../../contracts/CCTPAdapter.sol";
import {console} from "forge-std/console.sol";

contract DeployCCTPAdapter is Script {
    function run() external {
        // Load private key from env
        uint256 deployerPrivateKey = vm.envUint("EVM_PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Message Transmitter on Sepolia
        address messageTransmitter = address(0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275);
        CCTPAdapter adapter = new CCTPAdapter(messageTransmitter);

        console.log("CCTPAdapter deployed to:", address(adapter));

        vm.stopBroadcast();
    }
}
