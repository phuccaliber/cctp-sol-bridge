// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "forge-std/Script.sol";
import "forge-std/console.sol";

contract SimulateScript is Script {
    function run() external {
        address hookTarget = address(0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238);
        address recipient = address(0x787bb22b6dEb95D8d61C6628a97448b6fedCb414);
        uint256 amount = 1000000; // 1 USDC with 6 decimals

        // Encode ERC20 transfer function call
        bytes4 transferSelector = bytes4(keccak256("transfer(address,uint256)"));
        bytes memory hookCalldata = abi.encodeWithSelector(transferSelector, recipient, amount);

        // Encode hook target and calldata
        bytes memory encodedData = abi.encodePacked(hookTarget, hookCalldata);
        
        console.logBytes(encodedData);
        console.log("Hook Target:", hookTarget);
        console.log("Recipient:", recipient);
        console.log("Amount:", amount);
    }
}
