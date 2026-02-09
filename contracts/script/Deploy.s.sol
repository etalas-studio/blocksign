// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BlockSign} from "../src/BlockSign.sol";

/**
 * @title Deploy
 * @notice Deployment script for BlockSign contract
 * @dev Usage: forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast --verify
 */
contract Deploy is Script {
    BlockSign public blockSign;

    /**
     * @notice Main deployment function
     * @dev Deploys BlockSign contract with deployer as initial owner
     */
    function run() external {
        // Get deployer's private key from stdin
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the contract with deployer as initial owner
        blockSign = new BlockSign(vm.addr(deployerPrivateKey));

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment details
        console.log("=============================");
        console.log("BlockSign Deployment Summary");
        console.log("=============================");
        console.log("Contract Address:");
        console.logAddress(address(blockSign));
        console.log("Owner Address:");
        console.logAddress(vm.addr(deployerPrivateKey));
        console.log("=============================");
        console.log("Deployment successful!");
        console.log("=============================");
    }
}
